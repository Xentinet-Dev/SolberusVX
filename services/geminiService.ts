
import { GoogleGenAI, Type, SchemaType, LiveServerMessage, Modality, GenerateContentResponse } from "@google/genai";
import { ModelType, OctaneRenderSettings } from '../types';
import { CINEMATIC_PROMPT_LAYER, UI_ARCHITECT_SYSTEM_INSTRUCTION } from '../constants';

// --- CONCURRENCY ENGINE ---

class SmartQueue {
  private activeRequests = 0;
  private queue: (() => Promise<void>)[] = [];
  private concurrencyLimit = 2; // OPTIMIZED: Reduced to 2 to prevent Rate Limit (429) errors during heavy loads

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        this.activeRequests++;
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          this.activeRequests--;
          // Add a breather before processing next in queue
          setTimeout(() => this.next(), 500);
        }
      };

      if (this.activeRequests < this.concurrencyLimit) {
        wrappedTask();
      } else {
        this.queue.push(wrappedTask);
      }
    });
  }

  private next() {
    if (this.queue.length > 0 && this.activeRequests < this.concurrencyLimit) {
      const task = this.queue.shift();
      task?.();
    }
  }
}

class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | null = null;
  private queue = new SmartQueue();

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async retryWrapper<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
      try {
          return await operation();
      } catch (e: any) {
          if (retries > 0 && (e.status === 429 || e.message?.includes('429'))) {
              const delay = 5000 + (Math.random() * 3000); // OPTIMIZED: Increased retry delay (5-8s)
              console.warn(`[RATE LIMIT] Pausing for ${Math.round(delay)}ms...`);
              await new Promise(r => setTimeout(r, delay));
              return this.retryWrapper(operation, retries - 1);
          }
          throw e;
      }
  }

  // --- SYSTEM DIAGNOSTICS ---
  
  async runDiagnostics(): Promise<{ latency: number, tps: number, status: string }> {
      if (!this.ai) throw new Error("AI Offline");
      const start = performance.now();
      
      try {
          // Minimal ping to check model health and speed
          await this.ai.models.generateContent({
              model: ModelType.FLASH,
              contents: "Ping",
              config: { maxOutputTokens: 1 }
          });
          const end = performance.now();
          const latency = Math.round(end - start);
          
          // Calculate simulated "Tokens Per Second" based on latency
          // Lower latency = Higher TPS score
          const tps = Math.round(10000 / (latency || 1)); 

          return { latency, tps, status: "ONLINE" };
      } catch (e: any) {
          return { latency: 0, tps: 0, status: "OFFLINE" };
      }
  }

  // --- PROMPT ARCHITECT ENGINE v2.3 (MATERIAL NODE SUPPORT) ---
  private constructMegaPrompt(
    basePrompt: string, 
    dna: string | undefined, 
    theme: string | undefined, 
    hasRefImages: boolean,
    octaneSettings?: OctaneRenderSettings,
    isTextureMode: boolean = false
  ): string {
    // 1. Clean Inputs
    const cleanPrompt = basePrompt.trim();
    const cleanDNA = dna ? dna.trim() : "";
    const cleanTheme = theme ? theme.trim() : "";
    
    // Combine DNA + Theme effectively
    const consistencyProtocol = `${cleanTheme} ${cleanDNA}`.trim();

    // 2. TEXTURE FABRICATION MODE
    if (isTextureMode) {
        return `
[DIRECTIVE: TEXTURE FABRICATION]
You are a PBR Material Generator.
TASK: Generate a high-fidelity, seamless texture map.

[SUBJECT]: ${cleanPrompt}

[TECHNICAL CONSTRAINTS]:
- VIEWPOINT: Top-down, Orthographic, Flat (No perspective distortion).
- LIGHTING: Flat, Even, Neutral (No directional shadows).
- TILING: Perfectly Seamless / Repeatable edges.
- RESOLUTION: 8K, Ultra-detailed surface information.
- MATERIALITY: Emphasize tactile surface details (roughness, bumps, weave).
- STYLE: Photorealistic PBR Albedo Map.

[DNA]: ${consistencyProtocol}
        `.trim();
    }

    // 3. STYLE TRANSFER MODE
    if (hasRefImages) {
        return `
[DIRECTIVE: VISUAL STYLE MIMICRY]
You are an advanced rendering engine (Octane/Redshift). 
INPUT: Reference Image(s) (Source Style) + Text Prompt (Target Subject).

EXECUTION PROTOCOL:
1. DECOUPLE: Separate the Source Style (lighting, texture, palette, brushwork) from the Source Subject.
2. MAP: Apply the Source Style onto the Target Subject: "${cleanPrompt}".
3. TEXTURE COUPLING: Ensure the material properties of the reference (e.g. film grain, canvas texture, digital noise, lens artifacts) are perfectly replicated in the output.
4. RENDER SETTINGS: Apply ACES Filmic Tone Mapping and mimic a High Dynamic Range (HDR) output.

[CONSISTENCY DNA]:
${consistencyProtocol}

[NEGATIVE CONSTRAINTS]:
Do not copy the composition of the reference if it conflicts with the prompt. Do not produce text.
        `.trim();
    } 

    // 4. VIRTUAL KERNEL / OCTANE MODE
    // Build Virtual Camera String
    let virtualCamera = "";
    if (octaneSettings) {
        // MATERIAL OVERRIDE LOGIC
        const materialInstruction = octaneSettings.material 
            ? `- SURFACING / MATERIAL: Apply a "${octaneSettings.material}" material to the main subject.` 
            : "";

        virtualCamera = `
[VIRTUAL KERNEL SETTINGS]:
- LENS: ${octaneSettings.lens}
- APERTURE: ${octaneSettings.aperture}
- LIGHTING MODEL: ${octaneSettings.lighting}
- FILM STOCK: ${octaneSettings.filmStock}
${materialInstruction}
- SPECTRAL RENDERING: ${octaneSettings.spectral ? "Enabled (Chromatic Aberration, Dispersion, Prism Effects)" : "Disabled"}
        `.trim();
    }

    // 5. PURE GENERATION MODE (High Fidelity Enforcer)
    return `
[ROLE]: World-Class Digital Artist & Cinematographer (Octane 2026 Engine).
[SUBJECT]: ${cleanPrompt}
[VISUAL DNA / STYLE]: ${consistencyProtocol}

${virtualCamera}

[GLOBAL AESTHETICS]:
- ENGINE: Octane Render 2026, Path Tracing, Neural Radiance Cache.
- COLOR: ACES Filmic Tone Mapping, High Dynamic Range (HDR).
- TEXTURE: 8K Resolution, Micro-details enabled, Material-accurate rendering (OpenPBR).
- COMPOSITION: Rule of thirds, Balanced, Dynamic angle.
- EXTRA: ${CINEMATIC_PROMPT_LAYER}

[NEGATIVE CONSTRAINTS]:
No text, no watermarks, no blur, no distorted limbs, no bad anatomy, no low resolution, no jpeg artifacts.
    `.trim();
  }

  // --- Marketing Campaign Intelligence ---

  async generateCampaignStrategy(objective: string, brandVoice: string, visualStyle: string) {
    if (!this.ai) throw new Error("AI not initialized");

    const systemInstruction = `You are a World-Class Digital Marketing Strategist and Creative Director.
    Your task is to take a high-level marketing objective and create a 7-day content blitz.
    
    Each day must have:
    1. A Goal (Why are we posting this?)
    2. A Visual Prompt (Detailed description for an AI image/video generator)
    3. Social Copy (Viral, engaging Twitter/X style text with emojis)
    4. Format (Either IMAGE or VIDEO)
    
    Maintain consistent Brand Voice: ${brandVoice}
    Maintain consistent Visual Style: ${visualStyle}
    
    Return the response in STRICT JSON format.`;

    const prompt = `OBJECTIVE: ${objective}
    Return JSON:
    {
      "campaignName": "Short catchy name",
      "posts": [
        { "day": 1, "type": "IMAGE", "goal": "...", "visualPrompt": "...", "socialCopy": "..." },
        ... up to day 7
      ]
    }`;

    const response = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
      model: ModelType.PRO,
      contents: prompt,
      config: { 
        systemInstruction,
        responseMimeType: "application/json"
      }
    }));

    return JSON.parse(response.text || "{}");
  }

  // --- UI ARCHITECT ENGINE ---

  async runUIArchitect(
    sourceImage: { data: string, mimeType: string },
    mode: string,
    refImage?: { data: string, mimeType: string },
    stylePrompt?: string
  ) {
    if (!this.ai) throw new Error("AI not initialized");

    // 1. ANALYSIS & BLUEPRINTING
    const parts: any[] = [
        { inlineData: { data: sourceImage.data, mimeType: sourceImage.mimeType } }
    ];

    if (refImage) {
        parts.push({ inlineData: { data: refImage.data, mimeType: refImage.mimeType } });
    }

    const prompt = `
    INPUT:
    - {source_screenshot}: Provided as Image 1.
    - {design_mode}: ${mode}
    ${refImage ? `- {reference_image}: Provided as Image 2.` : ''}
    ${stylePrompt ? `- {style_prompt}: "${stylePrompt}"` : ''}

    Execute UI Architect Protocol. Provide structured Analysis and Redesign Concept.
    CRITICAL: The "Visual Description of New UI" must be vivid and detailed as it will be used for image generation.
    `;

    const analysisResponse = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
        model: ModelType.PRO,
        contents: { parts: [...parts, { text: prompt }] },
        config: { systemInstruction: UI_ARCHITECT_SYSTEM_INSTRUCTION }
    }));

    const analysisText = analysisResponse.text || "Analysis Failed.";

    // 2. EXTRACTION OF VISUAL PROMPT
    // We parse the output to find the "Visual Description" block to feed into the image generator
    // Regex matches text between "**Visual Description of New UI:**" and the next section header or end of text
    const visualDescriptionMatch = analysisText.match(/\*\*Visual Description of New UI:\*\*\s*([\s\S]*?)(?=\n\[|$)/i);
    let visualPrompt = visualDescriptionMatch ? visualDescriptionMatch[1].trim() : "";

    // Fallback if regex fails - use the whole logic block
    if (!visualPrompt) {
        visualPrompt = `High fidelity UI mockup, ${mode} style. ` + analysisText.substring(0, 500); // Truncated fallback
    }

    // Enhance prompt for pure UI generation (No Text)
    const finalImagePrompt = `
    UI Design Mockup. ${visualPrompt}
    
    STYLE: ${mode}
    CONSTRAINTS: High resolution, abstract UI, no readable text, solid color blocks for text, geometric shapes for icons, professional interface design.
    `;

    // 3. VISUAL SYNTHESIS
    // Generate the mockup image based on the extracted description
    const imageResponse = await this.generateImage(finalImagePrompt, "2K", "16:9", [], ModelType.PRO_IMAGE);

    return {
        analysis: analysisText,
        mockupUrl: imageResponse[0] || null
    };
  }

  // --- Text & General Intelligence ---

  async generateText(
    model: string,
    prompt: string,
    systemInstruction?: string,
    thinkingBudget?: number,
    useSearch: boolean = false
  ) {
    if (!this.ai) throw new Error("AI not initialized");
    
    const config: any = {
      systemInstruction,
    };

    if (thinkingBudget && thinkingBudget > 0) {
      config.thinkingConfig = { thinkingBudget };
    }

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
      model,
      contents: prompt,
      config
    }));

    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return {
      text: response.text,
      grounding
    };
  }
  
  // --- TACTICAL ASSISTANT (INSTRUCTOR) ---
  
  async askTacticalAssistant(userQuery: string, currentMode: string, modeContext: string) {
      if (!this.ai) throw new Error("AI not initialized");

      const systemInstruction = `You are the TACTICAL INSTRUCTOR for the Solberus-VX Platform.
      Your role is to guide the user through the current module they are looking at.
      
      CURRENT MODULE: ${currentMode}
      MODULE DOCUMENTATION: ${modeContext}
      
      INSTRUCTIONS:
      1. Be concise, professional, and helpful. Use a "Military-Tech" persona (e.g. "Affirmative", "Protocol").
      2. Answer questions specifically about the features available on this page.
      3. If the user asks how to do something, provide a numbered list of steps based on the MODULE DOCUMENTATION provided above.
      4. If the user asks about a different module, briefly explain where to find it in the sidebar.
      `;

      const response = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
          model: ModelType.FLASH, // Fast response for chat
          contents: userQuery,
          config: { systemInstruction }
      }));

      return response.text || "Systems offline. Unable to process query.";
  }

  // --- Prompt Enhancement ---

  async enhancePrompt(originalPrompt: string): Promise<string> {
    if (!this.ai) throw new Error("AI not initialized");

    const systemInstruction = `You are an expert visual prompt engineer for high-end AI image generation. 
    Rewrite the user's prompt to be highly descriptive, focusing on lighting, texture, camera angle, and artistic style.
    Keep the core subject but elevate the description to 8K photorealistic standards.
    Output ONLY the enhanced prompt. No conversational filler.`;

    const response = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
      model: ModelType.PRO,
      contents: originalPrompt,
      config: { systemInstruction }
    }));

    return response.text?.trim() || originalPrompt;
  }

  // --- Image Generation (Queue Optimized & Architected) ---

  async generateImage(
    basePrompt: string,
    size: "1K" | "2K" | "4K" = "1K",
    aspectRatio: string = "1:1",
    images: { data: string, mimeType: string }[] = [],
    model: string = ModelType.PRO_IMAGE,
    // Optional Explicit DNA/Theme overrides (if not already baked into prompt)
    dna?: string,
    theme?: string,
    octaneSettings?: OctaneRenderSettings,
    isTextureMode: boolean = false
  ) {
    if (!this.ai) throw new Error("AI not initialized");

    const effectiveModel = images.length > 0 ? ModelType.PRO_IMAGE : model;
    
    // Inject Settings into the prompt
    const finalPromptText = this.constructMegaPrompt(basePrompt, dna, theme, images.length > 0, octaneSettings, isTextureMode);

    return this.queue.add(async () => {
        return this.retryWrapper(async () => {
             // --- IMAGEN PATH ---
            if (effectiveModel.includes('imagen') && images.length === 0) {
                const response = await this.ai!.models.generateImages({
                    model: effectiveModel,
                    prompt: finalPromptText,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: aspectRatio as any,
                        outputMimeType: 'image/jpeg'
                    }
                });
                
                const generatedImages: string[] = [];
                if (response.generatedImages && response.generatedImages.length > 0) {
                    for (const img of response.generatedImages) {
                        if (img.image.imageBytes) {
                            generatedImages.push(`data:image/jpeg;base64,${img.image.imageBytes}`);
                        }
                    }
                }
                return generatedImages;
            } 
            
            // --- GEMINI MULTIMODAL PATH ---
            else {
                const parts: any[] = [];
                for (const img of images) {
                    parts.push({
                        inlineData: { data: img.data, mimeType: img.mimeType }
                    });
                }
                parts.push({ text: finalPromptText });

                const response = await this.ai!.models.generateContent({
                    model: effectiveModel, 
                    contents: { parts },
                    config: {
                        imageConfig: {
                            imageSize: size,
                            aspectRatio: aspectRatio as any
                        }
                    }
                });

                const generatedImages: string[] = [];
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                        generatedImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                        }
                    }
                }
                return generatedImages;
            }
        });
    });
  }

  // --- Neural Refinement (Production Quality Uplink) ---
  // Takes an existing image and "upscales/refines" it by re-running it through the strongest model 
  // with a denoising/sharpening prompt.
  async refineVisualAsset(
    base64Data: string,
    mimeType: string,
    originalPrompt: string
  ): Promise<string | null> {
      if (!this.ai) throw new Error("AI not initialized");

      const refinementPrompt = `
      CRITICAL: OUTPUT IMAGE ONLY.
      
      ROLE: Advanced Image Restoration & Upscaling AI.
      TASK: Enhance the input image.
      
      INSTRUCTIONS:
      1. RESAMPLING: Increase perceived resolution (Super-Resolution).
      2. DENOISE: Remove JPEG artifacts, grain, and blur.
      3. DETAIL: Hallucinate micro-textures on surfaces (skin pores, metal scratches, fabric weave) consistent with the subject.
      4. LIGHTING: Correct dynamic range (HDR), deepen blacks, fix blown-out highlights.
      5. FIDELITY: Maintain the exact composition and subject of the input. Do not change the pose or identity.
      
      ORIGINAL CONTEXT: "${originalPrompt}"
      `;

      return this.queue.add(async () => {
          return this.retryWrapper(async () => {
              const response = await this.ai!.models.generateContent({
                  model: ModelType.PRO_IMAGE, // Use strongest model for refinement
                  contents: {
                      parts: [
                          { inlineData: { data: base64Data, mimeType } },
                          { text: refinementPrompt }
                      ]
                  },
                  config: {
                      imageConfig: { imageSize: "4K" } // Force 4K upsample request
                  }
              });

              if (response.candidates?.[0]?.content?.parts) {
                  for (const part of response.candidates[0].content.parts) {
                      if (part.inlineData && part.inlineData.data) {
                          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                      }
                  }
              }
              return null;
          });
      });
  }

  // --- Batch Image Generation ---

  async generateImageBatch(
    prompts: string[],
    size: "1K" | "2K" | "4K",
    aspectRatio: string,
    refImages: { data: string, mimeType: string }[] = [],
    model: string,
    onItemComplete: (index: number, url: string) => void,
    dna?: string,
    theme?: string,
    octaneSettings?: OctaneRenderSettings
  ) {
      // SEQUENTIAL PROCESSING: Converted from Promise.all to sequential loop
      // to strictly enforce spacing and prevent "RESOURCE_EXHAUSTED" (429) errors.
      for (let i = 0; i < prompts.length; i++) {
          try {
              // Safety Delay: 4000ms between requests ensures we stay under common RPM limits (~15 req/min)
              if (i > 0) {
                  await new Promise(resolve => setTimeout(resolve, 4000));
              }

              const result = await this.generateImage(
                  prompts[i], 
                  size, 
                  aspectRatio, 
                  refImages, 
                  model, 
                  dna, 
                  theme, 
                  octaneSettings
              );
              
              if (result.length > 0) {
                  onItemComplete(i, result[0]);
              }
          } catch (e: any) {
              console.error(`Batch item ${i} failed`, e);
              // CRITICAL: If we hit a hard daily limit or serious quota issue, we should stop
              // to prevent the UI from flooding with 50 failure messages.
              if (e.message && (e.message.includes('limit: 0') || e.message.includes('quota') || e.message.includes('RESOURCE_EXHAUSTED'))) {
                  console.error("CRITICAL: QUOTA EXHAUSTED. ABORTING BATCH.");
                  break; // Stop processing further items
              }
          }
      }
  }

  // --- Image Editing ---

  async editImage(
    base64Image: string,
    mimeType: string,
    prompt: string
  ) {
    if (!this.ai) throw new Error("AI not initialized");

    const response = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
      model: ModelType.FLASH_IMAGE,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    }));

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
       for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }
    return images;
  }

  // --- Video Generation (Veo) ---

  async generateVideo(
    prompt: string,
    aspectRatio: "16:9" | "9:16" = "16:9",
    image?: { data: string, mimeType: string },
    onProgress?: (status: string) => void,
    shouldAbort?: () => boolean,
    resolution: "720p" | "1080p" = "720p",
    lastFrame?: { data: string, mimeType: string }
  ) {
    if (!this.ai || !this.apiKey) throw new Error("AI not initialized");

    // Re-initialize to ensure latest API key is used
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });

    const model = resolution === "1080p" ? ModelType.VEO_GEN : ModelType.VEO_FAST;
    const config: any = {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: aspectRatio
    };

    if (lastFrame) {
      config.lastFrame = {
        imageBytes: lastFrame.data,
        mimeType: lastFrame.mimeType
      };
    }

    let operation;
    try {
        if (image) {
          operation = await this.ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: image.data,
                mimeType: image.mimeType
            },
            config
          });
        } else {
          operation = await this.ai.models.generateVideos({
            model,
            prompt,
            config
          });
        }

        let pollCount = 0;
        while (!operation.done) {
          if (shouldAbort && shouldAbort()) {
            throw new Error("ABORTED_BY_USER");
          }
          pollCount++;
          if (onProgress) onProgress(`RENDERING... CYCLE ${pollCount} [${resolution}]`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await this.ai.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed");

        if (onProgress) onProgress("UPLINKING FINAL STREAM...");

        const vidResponse = await fetch(`${videoUri}&key=${this.apiKey}`);
        const blob = await vidResponse.blob();
        return URL.createObjectURL(blob);
    } catch (e: any) {
        throw e;
    }
  }

  // --- Multimodal Analysis ---

  async analyzeMedia(
    prompt: string,
    base64Data: string,
    mimeType: string,
    model: string = ModelType.PRO
  ) {
    if (!this.ai) throw new Error("AI not initialized");

    const response = await this.retryWrapper<GenerateContentResponse>(() => this.ai!.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          },
          { text: prompt }
        ]
      }
    }));

    return response.text;
  }

  // --- Live API ---

  async connectLive(
    callbacks: {
        onOpen: () => void,
        onMessage: (msg: LiveServerMessage) => void,
        onError: (err: ErrorEvent) => void,
        onClose: (evt: CloseEvent) => void
    },
    systemInstruction: string
  ) {
    if (!this.ai) throw new Error("AI not initialized");

    return this.ai.live.connect({
        model: ModelType.LIVE,
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
            },
            systemInstruction
        }
    });
  }
}

export const geminiService = new GeminiService();
