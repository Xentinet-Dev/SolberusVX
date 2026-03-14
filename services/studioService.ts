
import { StudioProject, StudioScene, StudioShot, StudioStage, AspectRatio, ModelType, ShotCountMode, OctaneRenderSettings } from '../types';
import { geminiService } from './geminiService';
import { storageService } from './storageService';
import { GENERATION_THEMES, OCTANE_DNA } from '../constants';

// --- UTILS ---

async function retryOperation<T>(operation: () => Promise<T>, retries = 2, fallback?: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Detect Rate Limit / Quota Exceeded (429)
        const isQuotaError = error.status === 429 || 
                             (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));

        if (retries > 0) {
            // If quota error, wait 30 seconds. Otherwise wait 2 seconds.
            const delay = isQuotaError ? 30000 : 2000; 
            
            console.warn(`Operation failed${isQuotaError ? ' (RATE LIMIT HIT)' : ''}. Pausing for ${delay/1000}s before retry... (${retries} attempts left)`);
            
            await new Promise(r => setTimeout(r, delay));
            return retryOperation(operation, retries - 1, fallback);
        }
        if (fallback) {
            console.warn("All retries failed, executing fallback.");
            return fallback();
        }
        throw error;
    }
}

class StudioService {
  
  // --- 1. PARSING ENGINE ---

  parseScript(scriptText: string): StudioScene[] {
    const scenes: StudioScene[] = [];
    const sceneRegex = /SCENE\s+(\d+)[\s-–—:]*(.*?)(?:\r?\n|$)([\s\S]*?)(?=(?:SCENE\s+\d+|$))/gi;
    
    let match;
    while ((match = sceneRegex.exec(scriptText)) !== null) {
      const number = parseInt(match[1]);
      const title = match[2].trim() || `Scene ${number}`;
      const rawDescription = match[3].trim();

      const newScene: StudioScene = {
        id: crypto.randomUUID(),
        number,
        title,
        rawDescription,
        optimizedDescription: rawDescription, // Default until audited
        cameraStyle: "Cinematic, Static",
        lightingStyle: "Natural",
        mood: "Neutral",
        shots: [],
        status: 'PENDING'
      };
      scenes.push(newScene);
    }
    return scenes;
  }

  // --- 2. SCENE AUDITOR (GEMINI PRO) ---

  async auditScenes(project: StudioProject, onProgress: (msg: string) => void): Promise<StudioProject> {
    const updatedScenes = [...project.scenes];
    
    let shotRangeInstruction = "4-6 shots";
    if (project.settings.shotCountMode === ShotCountMode.EXTENDED) shotRangeInstruction = "7-15 shots (detailed coverage)";
    if (project.settings.shotCountMode === ShotCountMode.DEEP) shotRangeInstruction = "15-25 shots (maximum cinematic detail)";

    for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (scene.status !== 'PENDING') continue;

        onProgress(`AUDITING SCENE ${scene.number} (${project.settings.shotCountMode} DENSITY)...`);

        const systemInstruction = `You are a World-Class Hollywood Cinematographer and Director of Photography (Scene Auditor).
        Your mission is to upgrade the user's raw scene into a production-ready shot list.
        
        CINEMATIC OPTIMIZATION RULESET:
        1. LIGHTING: Define key, fill, and rim light temperature and quality.
        2. CAMERA: Specify lens focal lengths (e.g., 35mm, 85mm), aperture feel (depth of field), and motion.
        3. REALISM: Add atmospheric details (dust, haze, rain) and material textures.
        4. EMOTION: define the tension or mood explicitly.
        5. NARRATIVE: You must be LOSSLESS. Preserve characters, action beats, and story intent perfectly.
        
        SHOT DENSITY TARGET: Generate ${shotRangeInstruction}.
        
        DIALOGUE DETECTION:
        For each shot, set "hasDialogue": true if characters are speaking, shouting, or whispering.`;

        const prompt = `
        SCENE TITLE: ${scene.title}
        RAW DESCRIPTION: ${scene.rawDescription}
        
        Return STRICT JSON format:
        {
            "optimizedDescription": "Full cinematic description...",
            "cameraStyle": "e.g., Handheld shaky cam, Slow dolly in...",
            "lightingStyle": "e.g., High contrast noir, Neon cyber...",
            "mood": "e.g., Tense, Joyful...",
            "soundscape": "e.g., Rain on pavement, distant sirens...",
            "shots": [
                { 
                  "type": "ESTABLISHING" | "WIDE" | "ACTION" | "DETAIL" | "ALT" | "INSERT" | "CLOSEUP", 
                  "desc": "Visual description of the shot...",
                  "hasDialogue": boolean
                }
            ]
        }
        `;

        try {
            const result = await retryOperation(() => geminiService.generateText(ModelType.PRO, prompt, systemInstruction));
            
            const jsonMatch = result.text?.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                
                const generatedShots: StudioShot[] = (data.shots || []).map((s: any) => ({
                    id: crypto.randomUUID(),
                    type: s.type || 'WIDE',
                    description: s.desc || '',
                    imagePrompt: '',
                    videoPrompt: '',
                    status: 'PENDING',
                    trimStart: 0,
                    trimEnd: 0,
                    volume: 1,
                    duration: 5,
                    hasDialogue: s.hasDialogue || false
                }));

                updatedScenes[i] = {
                    ...scene,
                    optimizedDescription: data.optimizedDescription || scene.rawDescription,
                    cameraStyle: data.cameraStyle || "Cinematic",
                    lightingStyle: data.lightingStyle || "Dramatic",
                    mood: data.mood || "Intense",
                    soundscape: data.soundscape,
                    shots: generatedShots.length > 0 ? generatedShots : this.getDefaultShots(scene),
                    status: 'AUDITED'
                };
            } else {
                throw new Error("Invalid JSON");
            }
        } catch (e) {
            console.error(`Audit failed for Scene ${scene.number}`, e);
            updatedScenes[i] = {
                ...scene,
                shots: this.getDefaultShots(scene),
                status: 'AUDITED'
            }; 
        }
        await storageService.saveProject({ ...project, scenes: updatedScenes });
    }

    return { ...project, scenes: updatedScenes, stage: StudioStage.STORYBOARDING };
  }

  private getDefaultShots(scene: StudioScene): StudioShot[] {
      return [
          this.createShot('ESTABLISHING', "Wide shot establishing the location."),
          this.createShot('ACTION', "Medium shot of the main action."),
          this.createShot('DETAIL', "Close up detail shot."),
          this.createShot('ALT', "Cinematic angle.")
      ];
  }

  private createShot(type: StudioShot['type'], desc: string): StudioShot {
      return {
          id: crypto.randomUUID(),
          type,
          description: desc,
          imagePrompt: "",
          videoPrompt: "",
          status: 'PENDING',
          trimStart: 0,
          trimEnd: 0,
          volume: 1,
          duration: 5,
          hasDialogue: false
      };
  }

  // --- 3. STORYBOARD ENGINE (PARALLELIZED & OCTANE ENHANCED) ---

  async generateStoryboard(project: StudioProject, onProgress: (msg: string) => void): Promise<StudioProject> {
    const updatedScenes = [...project.scenes];
    
    // Flatten shots needing generation to queue them
    const shotsToProcess: { sceneIndex: number, shotIndex: number, prompt: string }[] = [];

    // Define Global Cinematic Settings for the Project
    const cinematicSettings: OctaneRenderSettings = {
        lens: "35mm (Standard)",
        aperture: "f/2.8 (Cinematic)",
        lighting: "Cinematic / Dramatic",
        filmStock: "Kodak Portra 400",
        material: "",
        spectral: true
    };

    for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (scene.status !== 'AUDITED') continue;

        for (let j = 0; j < scene.shots.length; j++) {
            const shot = scene.shots[j];
            if (shot.status !== 'PENDING') continue;

            // Base prompt construction for the Architect
            const basePrompt = `Shot Type: ${shot.type}. Action: ${shot.description}. Scene Context: ${scene.optimizedDescription}. Mood: ${scene.mood}. Lighting: ${scene.lightingStyle}.`;
            
            // Optimistically update prompt in object before generation
            updatedScenes[i].shots[j].imagePrompt = basePrompt;
            shotsToProcess.push({ sceneIndex: i, shotIndex: j, prompt: basePrompt });
        }
    }

    onProgress(`INITIALIZING PARALLEL STORYBOARD GENERATION (${shotsToProcess.length} FRAMES)...`);

    // Use Batch Generation Service with OCTANE INJECTION
    const prompts = shotsToProcess.map(s => s.prompt);
    let completed = 0;

    await geminiService.generateImageBatch(
        prompts,
        "2K",
        project.settings.aspectRatio,
        [],
        ModelType.PRO_IMAGE,
        (index, url) => {
            const { sceneIndex, shotIndex } = shotsToProcess[index];
            const scene = updatedScenes[sceneIndex];
            const shot = scene.shots[shotIndex];

            shot.imageUrl = url;
            shot.status = 'READY_IMG';
            scene.shots[shotIndex] = shot;
            updatedScenes[sceneIndex] = scene;

            completed++;
            onProgress(`STORYBOARD: ${completed}/${shotsToProcess.length} FRAMES RENDERED`);
        },
        OCTANE_DNA, // Global DNA
        project.settings.styleSeed, // Theme from constants (contains style string)
        cinematicSettings // Octane Virtual Camera
    );

    // Update statuses after batch completion
    for (let i = 0; i < updatedScenes.length; i++) {
        if (updatedScenes[i].status === 'AUDITED') {
             // Check if all shots attempted
             updatedScenes[i].status = 'STORYBOARDED';
        }
    }
    
    await storageService.saveProject({ ...project, scenes: updatedScenes });
    return { ...project, scenes: updatedScenes, stage: StudioStage.FILMING };
  }

  // --- 4. VIDEO CLIP GENERATOR (VEO) ---

  async generateCinematography(project: StudioProject, onProgress: (msg: string) => void): Promise<StudioProject> {
    const updatedScenes = [...project.scenes];

    // Veo generation is extremely resource intensive and strictly rate limited.
    // We keep this SEQUENTIAL to avoid 429 errors on the video model, which has lower quotas than image models.
    for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        
        for (let j = 0; j < scene.shots.length; j++) {
            const shot = scene.shots[j];
            
            if (shot.status === 'READY_IMG' && shot.imageUrl) {
                onProgress(`FILMING SCENE ${scene.number} // SHOT ${j+1} (${shot.type})`);
                
                const motionPrompt = `Cinematic video, ${project.settings.styleSeed}. ${scene.cameraStyle}, ${scene.mood} atmosphere. ${shot.description}. Highly detailed, 8k, smooth motion.`;
                
                try {
                    const [header, base64Data] = shot.imageUrl.split(',');
                    const mimeType = header.split(':')[1].split(';')[0];
                    
                    // RATE LIMIT PACING: Wait 5s between video requests to avoid hitting limits
                    if (j > 0 || i > 0) {
                        onProgress(`SCENE ${scene.number} // COOLING DOWN (5s) FOR QUOTA...`);
                        await new Promise(r => setTimeout(r, 5000));
                    }

                    const videoUrl = await retryOperation(
                        () => geminiService.generateVideo(
                            motionPrompt, 
                            project.settings.aspectRatio === "9:16" ? "9:16" : "16:9",
                            { data: base64Data, mimeType },
                            (status) => onProgress(`SCENE ${scene.number} // SHOT ${j+1}: ${status}`),
                            () => false 
                        ),
                        3, 
                    );
                    
                    shot.videoUrl = videoUrl;
                    shot.videoPrompt = motionPrompt;
                    shot.status = 'READY_VID';
                    shot.duration = 5; 
                } catch (e) {
                    console.error("Video gen failed", e);
                }
                scene.shots[j] = shot;
                await storageService.saveProject({ ...project, scenes: updatedScenes });
            }
        }
        updatedScenes[i] = { ...scene, status: 'FILMED' };
    }

    return { ...project, scenes: updatedScenes, stage: StudioStage.EDITING };
  }

  // --- EXPORT ENGINES ---

  generateManifest(project: StudioProject): string {
      const manifest = {
          project_id: project.id,
          title: project.name,
          created_at: new Date(project.created).toISOString(),
          settings: project.settings,
          assets: [] as any[],
          timeline: [] as any[]
      };

      project.scenes.forEach(scene => {
          scene.shots.forEach(shot => {
              if (shot.videoUrl || shot.imageUrl) {
                  manifest.assets.push({
                      id: shot.id,
                      type: shot.videoUrl ? 'video' : 'image',
                      src: shot.videoUrl || shot.imageUrl,
                      prompt: shot.videoPrompt || shot.imagePrompt
                  });
                  manifest.timeline.push({
                      scene: scene.number,
                      shot_id: shot.id,
                      duration: shot.duration,
                      trim_in: shot.trimStart,
                      trim_out: shot.trimEnd,
                      has_dialogue: shot.hasDialogue
                  });
              }
          });
      });

      return JSON.stringify(manifest, null, 2);
  }

  generateEDL(project: StudioProject): string {
      let edl = `TITLE: ${project.name.toUpperCase()}\nFCM: NON-DROP FRAME\n\n`;
      let eventCount = 1;
      let currentTime = 0;

      const toTC = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          const f = Math.floor((seconds % 1) * 24);
          return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}:${f.toString().padStart(2,'0')}`;
      };

      project.scenes.forEach(scene => {
          scene.shots.forEach(shot => {
              if (shot.videoUrl || shot.imageUrl) {
                  const duration = (shot.trimEnd > 0 ? shot.trimEnd : shot.duration) - shot.trimStart;
                  edl += `${eventCount.toString().padStart(3,'0')}  AX       V     C        ${toTC(shot.trimStart)} ${toTC(shot.trimStart + duration)} ${toTC(currentTime)} ${toTC(currentTime + duration)}\n`;
                  if (shot.hasDialogue) {
                      edl += `* NOTE: DIALOGUE DETECTED / AUTO-DUCK MUSIC\n`;
                  }
                  edl += `* FROM CLIP: ${shot.id}\n\n`;
                  
                  currentTime += duration;
                  eventCount++;
              }
          });
      });

      return edl;
  }

  // --- AUTO PIPELINE ORCHESTRATOR ---

  async executePipeline(
      project: StudioProject, 
      onUpdate: (p: StudioProject) => void,
      onStatus: (msg: string) => void
  ) {
      let currentProject = project;

      // Stage 1: Audit
      if (currentProject.stage === StudioStage.SCRIPTING) {
          onStatus("PIPELINE STAGE 1/4: SCENE AUDIT");
          currentProject = await this.auditScenes(currentProject, onStatus);
          onUpdate(currentProject);
      }

      // Stage 2: Storyboard
      if (currentProject.stage === StudioStage.AUDITING || currentProject.stage === StudioStage.STORYBOARDING) {
          onStatus("PIPELINE STAGE 2/4: STORYBOARD GENERATION");
          currentProject = await this.generateStoryboard(currentProject, onStatus);
          onUpdate(currentProject);
      }

      // Stage 3: Filming
      if (currentProject.stage === StudioStage.FILMING || (currentProject.stage as any) === 'STORYBOARDED') {
          onStatus("PIPELINE STAGE 3/4: CINEMATOGRAPHY (VEO)");
          currentProject = await this.generateCinematography(currentProject, onStatus);
          onUpdate(currentProject);
      }

      onStatus("PIPELINE COMPLETE. ENTERING EDITING SUITE.");
      currentProject.stage = StudioStage.EDITING;
      onUpdate(currentProject);
      await storageService.saveProject(currentProject);
  }
}

export const studioService = new StudioService();
