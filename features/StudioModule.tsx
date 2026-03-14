
import React, { useState, useEffect } from 'react';
import { CyberButton, CyberTextArea, SectionTitle, LoadingScan } from '../components/UI';
import { TimelinePlayer } from '../components/TimelinePlayer';
import { studioService } from '../services/studioService';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { StudioProject, StudioStage, AspectRatio, ShotCountMode, ModelType } from '../types';
import { Film, FileText, Play, Settings, Trash2, Scissors, Wand2, Download, CheckCircle, Plus, Layout, MonitorPlay, Music, Video, FileJson, FileCode, History, Sparkles } from 'lucide-react';
import { GENERATION_THEMES, SHOT_COUNT_MODES } from '../constants';

export const StudioModule = () => {
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [scriptInput, setScriptInput] = useState('');
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState("INITIALIZING...");
  const [styleSeed, setStyleSeed] = useState(GENERATION_THEMES[0].value);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [shotCountMode, setShotCountMode] = useState<ShotCountMode>(ShotCountMode.STANDARD);

  // Sidebar / Transformer State
  const [sidebarMode, setSidebarMode] = useState<'PROJECTS' | 'TRANSFORMER'>('TRANSFORMER');
  const [transformInput, setTransformInput] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const p = await storageService.getProjects();
    setProjects(p);
  };

  const handleTransform = async () => {
    if (!transformInput.trim()) return;
    setIsTransforming(true);
    try {
        const systemInstruction = `You are a Professional Screenplay Formatter & Script Doctor.
        Take the user's raw input and convert it into a standardized Scene List.
        
        FORMAT RULE:
        SCENE [Number] - [Title]
        [Detailed Visual Description]
        
        ENHANCEMENT RULES:
        1. Break the text into logical scenes.
        2. If details are missing, hallucinate plausible cinematic details (lighting, environment, action) to make it production-ready.
        3. Ensure the format matches the regex: SCENE X - Title.
        4. Keep it concise but descriptive.`;

        const result = await geminiService.generateText(ModelType.PRO, transformInput, systemInstruction);
        if (result.text) {
            setScriptInput(result.text); // Auto-populate the main input
        }
    } catch (e: any) {
        alert(`Transformation Error: ${e.message}`);
    } finally {
        setIsTransforming(false);
    }
  };

  const createProject = async () => {
    if (!scriptInput.trim()) return alert("SCRIPT DATA REQUIRED");
    
    setLoading(true);
    try {
        const scenes = studioService.parseScript(scriptInput);
        if (scenes.length === 0) throw new Error("NO SCENES DETECTED. USE FORMAT: 'SCENE 1 - Title'");
        
        const newProject: StudioProject = {
            id: crypto.randomUUID(),
            name: scenes[0].title || "Untitled Production",
            created: Date.now(),
            script: scriptInput,
            scenes: scenes,
            stage: StudioStage.SCRIPTING,
            autoRun: true,
            settings: {
                aspectRatio,
                styleSeed,
                colorGrade: 'none',
                fps: 24,
                shotCountMode,
                autoDuck: true
            }
        };

        await storageService.saveProject(newProject);
        setActiveProject(newProject);
        setProjects([newProject, ...projects]);
    } catch (e: any) {
        alert(e.message);
    } finally {
        setLoading(false);
    }
  };

  const initiateAutoPipeline = async () => {
      if (!activeProject) return;
      setLoading(true);
      try {
          await studioService.executePipeline(
              activeProject,
              (updated) => setActiveProject(updated),
              (msg) => setProgressStatus(msg)
          );
      } catch (e: any) {
          setProgressStatus(`ERROR: ${e.message}`);
      } finally {
          setLoading(false);
      }
  };

  const deleteProject = async (id: string) => {
      if(confirm("DELETE PROJECT? THIS CANNOT BE UNDONE.")) {
          await storageService.deleteProject(id);
          loadProjects();
          if (activeProject?.id === id) setActiveProject(null);
      }
  }

  const handleExport = (type: 'manifest' | 'edl') => {
      if (!activeProject) return;
      const content = type === 'manifest' 
          ? studioService.generateManifest(activeProject) 
          : studioService.generateEDL(activeProject);
      
      const blob = new Blob([content], { type: type === 'manifest' ? 'application/json' : 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.replace(/\s+/g, '_')}_${type}.${type === 'manifest' ? 'json' : 'xml'}`;
      a.click();
  }

  // --- EDITING TOOLS ---

  const handleAutoArrange = () => {
      if (!activeProject) return;
      // Sort shots based on standard cinematic grammar
      const updatedScenes = activeProject.scenes.map(scene => ({
          ...scene,
          shots: [...scene.shots].sort((a, b) => {
              const order = ['ESTABLISHING', 'WIDE', 'ACTION', 'DETAIL', 'CLOSEUP', 'ALT', 'INSERT'];
              const idxA = order.indexOf(a.type);
              const idxB = order.indexOf(b.type);
              // If type is unknown or same, keep original relative order
              if (idxA === -1 || idxB === -1 || idxA === idxB) return 0;
              return idxA - idxB;
          })
      }));
      
      const updatedProject = { ...activeProject, scenes: updatedScenes };
      setActiveProject(updatedProject);
      storageService.saveProject(updatedProject);
  };

  const handleResetEdits = () => {
      if (!activeProject) return;
      // Reload logic - In a real app this might revert to a saved state. 
      // For now we just refresh from DB which holds the last save state.
      storageService.getProjects().then(projs => {
          const original = projs.find(p => p.id === activeProject.id);
          if (original) setActiveProject(original);
      });
  };

  // --- STAGE RENDERERS ---

  const renderPipelineProgress = () => {
      if (!activeProject) return null;
      const stages = [StudioStage.SCRIPTING, StudioStage.AUDITING, StudioStage.STORYBOARDING, StudioStage.FILMING, StudioStage.EDITING];
      const currentIndex = stages.indexOf(activeProject.stage);
      
      return (
          <div className="flex items-center justify-between mb-6 px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-lg backdrop-blur-sm">
              {stages.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-500 ${i < currentIndex ? 'bg-green-500 text-green-500' : i === currentIndex ? 'bg-cyan-400 text-cyan-400 animate-pulse' : 'bg-slate-700 text-slate-700'}`} />
                      <span className={`text-[10px] font-mono font-bold tracking-widest ${i <= currentIndex ? 'text-white' : 'text-slate-600'}`}>{s}</span>
                      {i < stages.length - 1 && <div className={`w-12 h-[2px] mx-2 ${i < currentIndex ? 'bg-green-900' : 'bg-slate-800'}`} />}
                  </div>
              ))}
          </div>
      );
  };

  const renderScriptingStage = () => (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s]">
        <div className="flex gap-6 h-full">
            {/* Input Area */}
            <div className="w-1/2 flex flex-col gap-4">
                <div className="bg-slate-900/50 p-4 border border-slate-800 flex-1 flex flex-col rounded-lg">
                    <label className="text-xs font-mono text-cyan-500 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> SCENE LIST (SCRIPT)
                    </label>
                    <CyberTextArea 
                        value={activeProject?.script}
                        onChange={() => {}} // Read-only view
                        className="flex-1 font-mono text-sm leading-relaxed"
                    />
                </div>
            </div>

            {/* Config & Launch */}
            <div className="w-1/2 flex flex-col justify-center items-center gap-8">
                 <div className="text-center space-y-4">
                     <div className="relative inline-block">
                        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 rounded-full"></div>
                        <Film className="w-20 h-20 text-cyan-500 relative z-10" />
                     </div>
                     <h2 className="text-3xl font-bold text-white tracking-widest">PRE-PRODUCTION</h2>
                     <p className="text-slate-400 font-mono text-sm max-w-sm mx-auto leading-relaxed">
                        Ready to process <span className="text-white font-bold">{activeProject?.scenes.length}</span> scenes.
                        The AI Pipeline will audit the script, generate storyboards, film clips, and assemble the rough cut.
                     </p>
                 </div>

                 <div className="bg-slate-900/80 border border-slate-800 p-8 w-full max-w-md space-y-6 rounded-xl shadow-2xl">
                     <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                         <span>STYLE SEED</span>
                         <span className="text-cyan-400 font-bold truncate max-w-[150px]">{GENERATION_THEMES.find(t => t.value === activeProject?.settings.styleSeed)?.label}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                         <span>ASPECT RATIO</span>
                         <span className="text-cyan-400 font-bold">{activeProject?.settings.aspectRatio}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                         <span>SHOT DENSITY</span>
                         <span className="text-cyan-400 font-bold">{activeProject?.settings.shotCountMode}</span>
                     </div>
                     <div className="pt-2">
                        {loading ? (
                            <div className="w-full py-4 bg-slate-800 text-cyan-500 font-mono text-center text-sm animate-pulse border border-cyan-900 rounded">
                                SYSTEM INITIALIZING...
                            </div>
                        ) : (
                            <CyberButton onClick={initiateAutoPipeline} variant="solana" className="w-full text-lg py-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                <Play className="w-5 h-5 fill-current" /> START AUTO-PRODUCTION
                            </CyberButton>
                        )}
                        <p className="text-[10px] text-center text-slate-500 mt-3 font-mono">WARNING: THIS PROCESS MAY TAKE SEVERAL MINUTES</p>
                     </div>
                 </div>
            </div>
        </div>
    </div>
  );

  const renderProcessingStage = () => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2 bg-slate-900/50 p-4 rounded-t-lg">
            <div className="flex items-center gap-4">
                <LoadingScan text={progressStatus} />
            </div>
            <div className="text-xs font-mono text-slate-500">
                AUTO-PILOT ENGAGED
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-b-lg">
            {activeProject?.scenes.map(scene => (
                <div key={scene.id} className={`bg-slate-950 border p-3 flex flex-col rounded-lg transition-all duration-300 ${scene.status === 'FILMED' ? 'border-green-900 shadow-[0_0_15px_rgba(20,83,45,0.3)]' : 'border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-mono text-cyan-500 font-bold bg-cyan-950/50 px-2 py-1 rounded">SCENE {scene.number}</span>
                        {scene.status === 'FILMED' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                        )}
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-2 mb-3 font-mono border-l-2 border-slate-700 pl-2">{scene.title}</p>
                    
                    <div className="grid grid-cols-2 gap-1 mt-auto bg-black p-1 rounded border border-slate-900">
                        {scene.shots.slice(0,4).map(shot => (
                            <div key={shot.id} className="aspect-square bg-slate-900 relative overflow-hidden group">
                                {shot.imageUrl ? (
                                    <>
                                        <img src={shot.imageUrl} className={`w-full h-full object-cover transition-opacity ${shot.videoUrl ? 'opacity-100' : 'opacity-60'}`} />
                                        {shot.videoUrl && <div className="absolute top-0 right-0 p-0.5 bg-green-500/80"><Video className="w-2 h-2 text-black" /></div>}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {shot.status.includes('GENERATING') ? <div className="w-1.5 h-1.5 bg-cyan-500 animate-ping rounded-full" /> : <div className="w-1 h-1 bg-slate-800 rounded-full" />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                        <div className="text-[9px] font-mono text-slate-500 uppercase">{scene.status}</div>
                        <div className="text-[9px] font-mono text-slate-600">{scene.shots.filter(s => s.status.includes('READY')).length}/{scene.shots.length} SHOTS</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderEditingStage = () => {
      if (!activeProject) return null;
      return (
          <div className="h-full flex gap-4 animate-[fadeIn_0.5s]">
              {/* Main Workspace */}
              <div className="flex-1 flex flex-col gap-4">
                  {/* Player */}
                  <div className="flex-1 min-h-0 bg-black border border-slate-800 relative rounded-lg overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                           <TimelinePlayer project={activeProject} />
                      </div>
                  </div>
                  
                  {/* Editor Controls */}
                  <div className="h-48 bg-slate-900/80 border border-slate-800 flex flex-col rounded-lg overflow-hidden">
                      <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center px-4 justify-between">
                          <span className="text-xs font-mono text-cyan-500 flex items-center gap-2 font-bold"><Scissors className="w-3 h-3" /> TIMELINE EDITOR</span>
                          <div className="flex gap-2">
                               <button onClick={handleAutoArrange} className="text-[10px] bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"><Layout className="w-3 h-3" /> AUTO-ARRANGE</button>
                               <button onClick={handleResetEdits} className="text-[10px] bg-red-900/30 px-3 py-1 rounded hover:bg-red-900/50 text-red-300 transition-colors border border-red-900/50">RESET EDITS</button>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-x-auto p-4 flex items-center gap-2 custom-scrollbar bg-slate-900/50">
                          {activeProject.scenes.flatMap(s => s.shots).filter(s => s.videoUrl || s.imageUrl).map((shot, idx) => (
                              <div key={shot.id} className="min-w-[140px] h-24 bg-slate-800 border border-slate-600 rounded relative group cursor-pointer hover:border-cyan-500 transition-all hover:scale-105 z-0 hover:z-10 shadow-lg">
                                  <img src={shot.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity rounded-sm" />
                                  <div className="absolute top-1 left-1 text-[8px] bg-black/70 px-1.5 py-0.5 text-white truncate max-w-[90%] rounded backdrop-blur-md font-mono">{shot.type}</div>
                                  <div className="absolute bottom-1 right-1 text-[8px] bg-black/70 px-1.5 py-0.5 text-cyan-400 rounded backdrop-blur-md font-mono">{shot.duration}s</div>
                                  {shot.videoUrl && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime]" />}
                                  {shot.hasDialogue && <div className="absolute top-1 left-16 text-[8px] bg-blue-900/80 px-1 rounded text-white font-mono">VO</div>}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Sidebar Tools */}
              <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col">
                  <div className="p-4 border-b border-slate-800 font-mono text-xs text-white bg-slate-900 flex items-center gap-2 font-bold">
                      <Settings className="w-4 h-4 text-cyan-500" /> EDITING SUITE
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5 space-y-8">
                       {/* Color Grading */}
                       <div>
                           <label className="text-xs font-mono text-slate-400 block mb-3 flex items-center gap-2 font-bold"><Wand2 className="w-3 h-3 text-purple-400" /> COLOR GRADING</label>
                           <div className="grid grid-cols-2 gap-2">
                                {[
                                    {name: 'NONE', val: 'none'},
                                    {name: 'CINEMA', val: 'contrast(1.1) saturate(1.2) sepia(0.2)'},
                                    {name: 'NOIR', val: 'grayscale(1) contrast(1.2)'},
                                    {name: 'TEAL/ORG', val: 'sepia(0.3) hue-rotate(180deg) saturate(1.4) contrast(1.1)'},
                                    {name: 'MATRIX', val: 'hue-rotate(90deg) contrast(1.1)'},
                                    {name: 'VINTAGE', val: 'sepia(0.4) contrast(0.9)'}
                                ].map(lut => (
                                    <button 
                                        key={lut.name}
                                        onClick={() => {
                                            const p = {...activeProject, settings: {...activeProject.settings, colorGrade: lut.val}};
                                            setActiveProject(p);
                                            storageService.saveProject(p);
                                        }}
                                        className={`text-[10px] border p-2 font-mono rounded transition-all duration-200 ${activeProject.settings.colorGrade === lut.val ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}
                                    >
                                        {lut.name}
                                    </button>
                                ))}
                           </div>
                       </div>

                       {/* Audio */}
                       <div>
                            <label className="text-xs font-mono text-slate-400 block mb-3 flex items-center gap-2 font-bold"><Music className="w-3 h-3 text-green-400" /> AUDIO MIXER</label>
                            <div className="space-y-4">
                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg">
                                    <div className="flex justify-between text-[10px] text-slate-300 mb-2 font-mono">
                                        <span>MUSIC TRACK</span>
                                        <span className="text-cyan-500">80%</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                </div>
                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg opacity-80">
                                    <div className="flex justify-between text-[10px] text-slate-300 mb-2 font-mono">
                                        <span className="flex items-center gap-1 text-blue-400"><MonitorPlay className="w-3 h-3" /> AUTO-DUCKING</span>
                                        <span className="text-green-500 text-[9px] border border-green-900 bg-green-950 px-1 rounded">AI ACTIVE</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight">System automatically lowers music volume by -12dB when dialogue is detected in shots.</p>
                                </div>
                            </div>
                       </div>

                       {/* Export */}
                       <div className="pt-6 border-t border-slate-800">
                           <div className="grid grid-cols-2 gap-2 mb-2">
                                <button onClick={() => handleExport('manifest')} className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] py-2 hover:bg-cyan-950 hover:text-cyan-400 hover:border-cyan-700 transition-colors rounded font-mono flex flex-col items-center justify-center gap-1">
                                    <FileJson className="w-4 h-4" /> JSON MANIFEST
                                </button>
                                <button onClick={() => handleExport('edl')} className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] py-2 hover:bg-cyan-950 hover:text-cyan-400 hover:border-cyan-700 transition-colors rounded font-mono flex flex-col items-center justify-center gap-1">
                                    <FileCode className="w-4 h-4" /> XML EDL
                                </button>
                           </div>
                           <CyberButton className="w-full py-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]" variant="solana">
                               <Download className="w-4 h-4" /> FINALIZE PRODUCTION
                           </CyberButton>
                       </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Film} title="Cinematic Studio" subtitle="Autonomous Production Pipeline" />

      {activeProject ? (
          <div className="flex-1 flex flex-col overflow-hidden relative p-6">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-xl font-bold text-white tracking-wide">{activeProject.name}</h3>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-3 mt-1">
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">ID: {activeProject.id.split('-')[0]}</span>
                          <span className="flex items-center gap-1"><MonitorPlay className="w-3 h-3" /> MODE: {activeProject.autoRun ? 'AUTO' : 'MANUAL'}</span>
                      </div>
                  </div>
                  <CyberButton onClick={() => setActiveProject(null)} variant="secondary" className="text-xs py-2 px-4 border-slate-700">
                      EXIT PROJECT
                  </CyberButton>
              </div>

              {renderPipelineProgress()}

              <div className="flex-1 overflow-hidden relative bg-black/20 border border-slate-800/50 rounded-xl p-1 backdrop-blur-sm">
                  {activeProject.stage === StudioStage.SCRIPTING && renderScriptingStage()}
                  {(activeProject.stage === StudioStage.AUDITING || activeProject.stage === StudioStage.STORYBOARDING || activeProject.stage === StudioStage.FILMING) && renderProcessingStage()}
                  {(activeProject.stage === StudioStage.EDITING || activeProject.stage === StudioStage.FINISHED) && renderEditingStage()}
              </div>
          </div>
      ) : (
          <div className="flex-1 flex gap-8 overflow-hidden p-8">
              {/* Sidebar: Transformer / History */}
              <div className="w-1/3 bg-slate-900/40 border border-slate-800 flex flex-col rounded-xl overflow-hidden backdrop-blur-sm">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                      <div className="flex gap-2">
                          <button onClick={() => setSidebarMode('TRANSFORMER')} className={`text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${sidebarMode === 'TRANSFORMER' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}><Sparkles className="w-3 h-3" /> TRANSFORMER</button>
                          <button onClick={() => setSidebarMode('PROJECTS')} className={`text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${sidebarMode === 'PROJECTS' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}><History className="w-3 h-3" /> HISTORY</button>
                      </div>
                      {sidebarMode === 'PROJECTS' && <span className="text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full">{projects.length}</span>}
                  </div>

                  {sidebarMode === 'PROJECTS' ? (
                      <div className="flex-1 overflow-y-auto">
                          {projects.map(p => (
                              <div key={p.id} className="p-5 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group relative cursor-pointer" onClick={() => setActiveProject(p)}>
                                  <h4 className="font-bold text-white text-sm truncate mb-1">{p.name}</h4>
                                  <div className="flex justify-between items-center text-xs font-mono text-slate-500">
                                      <span>{new Date(p.created).toLocaleDateString()}</span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] ${p.stage === 'FINISHED' || p.stage === 'EDITING' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{p.stage}</span>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 bg-slate-950 p-1.5 rounded transition-all"><Trash2 className="w-3 h-3" /></button>
                              </div>
                          ))}
                          {projects.length === 0 && (
                              <div className="h-64 flex flex-col items-center justify-center text-slate-600 font-mono opacity-50">
                                  <Film className="w-12 h-12 mb-2" />
                                  <span className="text-xs">NO PROJECTS FOUND</span>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col p-6 gap-4 animate-[fadeIn_0.3s]">
                           <div className="bg-slate-950/50 p-4 rounded border border-slate-800 flex-1 flex flex-col relative group">
                                <label className="text-[10px] font-mono text-cyan-500 mb-2 font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> RAW IDEA INPUT</label>
                                <CyberTextArea 
                                    value={transformInput}
                                    onChange={(e: any) => setTransformInput(e.target.value)}
                                    placeholder={`Paste rough notes, a book excerpt, or a vague concept here.\n\nExample:\n"A detective walks down a rainy street. He sees a neon sign flickering. He enters a bar."`}
                                    className="flex-1 text-xs resize-none bg-transparent border-none p-0 focus:ring-0"
                                />
                                {transformInput && (
                                    <button onClick={() => setTransformInput('')} className="absolute top-4 right-4 text-xs text-slate-600 hover:text-white">CLEAR</button>
                                )}
                           </div>
                           <div className="space-y-2">
                               <p className="text-[9px] text-slate-500 font-mono leading-tight">
                                   * Gemini 3 Pro will auto-format this into scenes, add missing cinematic details, and structure it for production.
                               </p>
                               <CyberButton onClick={handleTransform} disabled={isTransforming || !transformInput.trim()} variant="solana" className="w-full py-4 text-sm">
                                   {isTransforming ? "FORMATTING..." : "TRANSFORM TO SCRIPT"}
                               </CyberButton>
                           </div>
                      </div>
                  )}
              </div>

              {/* New Project Form */}
              <div className="w-2/3 bg-slate-900/40 border border-slate-800 p-8 flex flex-col rounded-xl backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="mb-8 relative z-10">
                      <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Plus className="w-8 h-8 text-cyan-500" /> NEW PRODUCTION</h3>
                      <p className="text-sm text-slate-400 font-mono max-w-xl">Input your scene list below. The Gemini Engine will auto-audit the script, generate storyboards, and film the sequences using Veo.</p>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-6 relative z-10">
                      <div className="bg-black/40 p-1 border border-slate-700/50 flex-1 flex flex-col rounded-lg focus-within:border-cyan-500/50 transition-colors relative">
                          {scriptInput && (
                              <div className="absolute top-0 right-0 bg-green-900/80 text-green-300 text-[9px] font-mono px-2 py-1 rounded-bl-lg rounded-tr-lg backdrop-blur-sm flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> READY FOR PRODUCTION
                              </div>
                          )}
                          <CyberTextArea 
                             value={scriptInput}
                             onChange={(e: any) => setScriptInput(e.target.value)}
                             placeholder={`SCENE 1 - The Arrival\nA lone spaceship descends through heavy storm clouds. Lightning illuminates the hull.\n\nSCENE 2 - The Wasteland\nThe ship lands on a barren, rocky surface. Dust swirls around the landing gear.`}
                             className="flex-1 font-mono text-sm leading-relaxed bg-transparent border-none focus:shadow-none p-4"
                          />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                          <div>
                              <label className="text-xs font-mono text-slate-500 mb-2 block font-bold ml-1">VISUAL STYLE</label>
                              <div className="relative">
                                  <select 
                                    value={styleSeed} 
                                    onChange={(e) => setStyleSeed(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 p-4 text-sm rounded appearance-none focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
                                  >
                                    {GENERATION_THEMES.map((t, i) => <option key={i} value={t.value}>{t.label}</option>)}
                                  </select>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-mono text-slate-500 mb-2 block font-bold ml-1">ASPECT RATIO</label>
                              <div className="relative">
                                  <select 
                                    value={aspectRatio} 
                                    onChange={(e) => setAspectRatio(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 p-4 text-sm rounded appearance-none focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
                                  >
                                    <option value="16:9">16:9 (CINEMATIC)</option>
                                    <option value="21:9">21:9 (ANAMORPHIC)</option>
                                    <option value="9:16">9:16 (VERTICAL / REELS)</option>
                                    <option value="4:3">4:3 (CLASSIC)</option>
                                  </select>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-mono text-slate-500 mb-2 block font-bold ml-1">SHOT DENSITY</label>
                              <div className="relative">
                                  <select 
                                    value={shotCountMode} 
                                    onChange={(e) => setShotCountMode(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 p-4 text-sm rounded appearance-none focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
                                  >
                                    {SHOT_COUNT_MODES.map((m, i) => <option key={i} value={m.value}>{m.label}</option>)}
                                  </select>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                              </div>
                          </div>
                      </div>

                      <CyberButton onClick={createProject} disabled={loading} variant="solana" className="w-full py-5 text-lg font-bold tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all">
                          {loading ? "INITIALIZING STUDIO..." : "CREATE PROJECT"}
                      </CyberButton>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
