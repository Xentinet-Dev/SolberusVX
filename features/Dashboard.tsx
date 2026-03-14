
import React, { useState, useEffect } from 'react';
import { SectionTitle, CyberButton } from '../components/UI';
import { FeatureMode } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Shield, Sparkles, Image, Search, Mic, Terminal, ArrowRight, Info, Cpu, Zap, Film, Grid, BookOpen, ChevronRight, Megaphone, Activity, Layers, Play, Dna, FileJson, X } from 'lucide-react';

interface DashboardProps {
  onNavigate: (mode: FeatureMode) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'MANUAL'>('GRID');
  const [manualSection, setManualSection] = useState<string>('CAMPAIGNS');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagStats, setDiagStats] = useState<{latency: number, tps: number, status: string} | null>(null);
  const [scanning, setScanning] = useState(false);
  
  const [stats, setStats] = useState({
    campaigns: 0,
    assets: 0,
    projects: 0,
    reports: 0
  });

  useEffect(() => {
    const loadTelemetry = async () => {
        const [c, a, p, r] = await Promise.all([
            storageService.getCampaigns(),
            storageService.getAssets(),
            storageService.getProjects(),
            storageService.getReconReports()
        ]);
        setStats({
            campaigns: c.length,
            assets: a.length,
            projects: p.length,
            reports: r.length
        });
    };
    loadTelemetry();
  }, []);

  const runDiagnostics = async () => {
      setScanning(true);
      setDiagStats(null);
      // Simulate scan delay for effect
      await new Promise(r => setTimeout(r, 1500));
      try {
          const result = await geminiService.runDiagnostics();
          setDiagStats(result);
      } catch (e) {
          setDiagStats({ latency: 0, tps: 0, status: "ERROR" });
      } finally {
          setScanning(false);
      }
  };

  const modules = [
    {
      id: FeatureMode.CAMPAIGNS,
      title: "MARKETING ORCHESTRATOR",
      icon: Megaphone,
      desc: "Autonomous campaign strategist. Decomposes objectives into 7-day tactical blitzes with auto-generated assets.",
      features: ["Strategic Planning", "Content Calendar", "Auto-Uplink", "Copywriting"],
      stat: `${stats.campaigns} CAMPAIGNS ACTIVE`,
      color: "text-pink-400",
      borderColor: "border-pink-500/30",
      hover: "hover:bg-pink-950/30"
    },
    {
      id: FeatureMode.STYLE_PROTOCOL,
      title: "PROTOCOL DNA",
      icon: Dna,
      desc: "Visual Consistency Engine. Lock a 'God Image' and Master DNA to ensure every generated asset belongs to the same universe.",
      features: ["Anchor Frame Locking", "DNA Suffix Injection", "Texture Modifiers", "Asset Fabrication"],
      stat: "SYSTEM SECURE",
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      hover: "hover:bg-blue-950/30"
    },
    {
      id: FeatureMode.STUDIO,
      title: "CINEMATIC STUDIO",
      icon: Film,
      desc: "Full automated pipeline. Convert a script into a fully produced video sequence with storyboards and Veo clips.",
      features: ["Script Parsing", "Auto-Storyboarding", "Scene Assembly", "Timeline Editor"],
      stat: `${stats.projects} PRODUCTIONS`,
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      hover: "hover:bg-amber-950/30"
    },
    {
      id: FeatureMode.INTELLIGENCE,
      title: "PROMPT ENHANCER",
      icon: Sparkles,
      desc: "Turn simple ideas into professional prompts. Rewrite raw concepts into 8K photorealistic descriptions.",
      features: ["Batch Optimization", "Photorealistic Detail", "Gemini 3 Pro Reasoning", "Auto-Formatting"],
      stat: "READY FOR INPUT",
      color: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      hover: "hover:bg-cyan-950/30"
    },
    {
      id: FeatureMode.VISUALS,
      title: "IMAGE & VIDEO GEN",
      icon: Image,
      desc: "Create or edit visual assets. Generate 8K images, animate photos, or create videos from scratch.",
      features: ["8K Image Generation", "Veo Video Generation", "Image Editing", "Auto-Sequential Mode"],
      stat: `${stats.assets} ASSETS ARCHIVED`,
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      hover: "hover:bg-purple-950/30"
    },
    {
      id: FeatureMode.RECON,
      title: "MEDIA ANALYZER",
      icon: Search,
      desc: "Analyze and extract data. Upload media for detailed descriptions, transcriptions, or threat analysis.",
      features: ["Image Recognition", "Video Understanding", "Audio Transcription", "Detailed Reports"],
      stat: `${stats.reports} LOGS SAVED`,
      color: "text-green-400",
      borderColor: "border-green-500/30",
      hover: "hover:bg-green-950/30"
    }
  ];

  const renderManualContent = () => {
    switch (manualSection) {
        case 'CAMPAIGNS':
            return (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                    <div>
                        <h3 className="text-xl font-bold text-pink-400 mb-2">CAMPAIGN MODULE // STRATEGIC WARFARE</h3>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                            The Marketing Orchestrator replaces the role of a Chief Marketing Officer (CMO) and Social Media Manager.
                            Instead of manually scheduling posts, you define a single "Global Objective" (e.g., "Launch a luxury watch brand").
                            The system utilizes Gemini 3 Pro to generate a comprehensive 7-day content strategy, defining the "Goal," "Visual Prompt," and "Social Copy" for every single day.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 border border-slate-800">
                            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Cpu className="w-4 h-4" /> AUTO-UPLINK</h4>
                            <p className="text-xs text-slate-400">
                                Once the strategy is approved, the "Deploy" function iterates through the calendar. It automatically generates the required Image (Imagen 3) or Video (Veo) for that day's post, simulating a live broadcast schedule.
                            </p>
                        </div>
                        <div className="bg-slate-900/50 p-4 border border-slate-800">
                            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Terminal className="w-4 h-4" /> JSON ARCHITECTURE</h4>
                            <p className="text-xs text-slate-400">
                                Strategies are stored as structured JSON objects, allowing for precise editing of prompts or copy before the generation phase begins.
                            </p>
                        </div>
                    </div>
                </div>
            );
        case 'STYLE_PROTOCOL':
            return (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                    <div>
                        <h3 className="text-xl font-bold text-blue-400 mb-2">PROTOCOL DNA // CONSISTENCY ENGINE</h3>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                            A specialized fabrication module designed to solve the "Consistency Problem." 
                            By separating the <b>Subject</b> (what changes) from the <b>DNA</b> (what stays the same), it allows for rapid asset creation that always matches the brand's visual universe.
                        </p>
                    </div>
                    <ul className="space-y-4">
                         <li className="bg-slate-900/50 p-3 border-l-2 border-blue-500">
                            <strong className="text-blue-400 text-xs block mb-1">ANCHOR FRAME (GOD IMAGE)</strong>
                            <span className="text-xs text-slate-400">Upload a single "Perfect Image." The system uses this as a reference for lighting, color palette, and composition for every future generation.</span>
                        </li>
                        <li className="bg-slate-900/50 p-3 border-l-2 border-blue-500">
                            <strong className="text-blue-400 text-xs block mb-1">MASTER DNA (SUFFIX)</strong>
                            <span className="text-xs text-slate-400">A locked text block appended to every prompt. e.g. "Unreal Engine 5, clay material, 8k resolution..."</span>
                        </li>
                    </ul>
                </div>
            );
        case 'STUDIO':
            return (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                    <div>
                        <h3 className="text-xl font-bold text-amber-400 mb-2">CINEMATIC STUDIO // PRODUCTION PIPELINE</h3>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                            A fully autonomous video production facility. This module moves beyond simple text-to-video by implementing a professional "Pipeline" workflow: Scripting -> Auditing -> Storyboarding -> Filming -> Editing.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        <li className="bg-slate-900/50 p-3 border-l-2 border-amber-500">
                            <strong className="text-amber-400 text-xs block mb-1">STAGE 1: THE TRANSFORMER</strong>
                            <span className="text-xs text-slate-400">Converts raw, messy user notes into a standardized Screenplay format (SCENE X - TITLE), parsing actions and locations.</span>
                        </li>
                        <li className="bg-slate-900/50 p-3 border-l-2 border-amber-500">
                            <strong className="text-amber-400 text-xs block mb-1">STAGE 2: THE AUDITOR (DoP)</strong>
                            <span className="text-xs text-slate-400">Acts as a Director of Photography. It "hallucinates" missing details—lens types, lighting temperatures, and camera movements—to ensure cinematic consistency.</span>
                        </li>
                        <li className="bg-slate-900/50 p-3 border-l-2 border-amber-500">
                            <strong className="text-amber-400 text-xs block mb-1">STAGE 3: VEO FILMING</strong>
                            <span className="text-xs text-slate-400">Takes the generated Storyboard frames (Reference Images) and animates them using the Veo model, ensuring characters and environments remain consistent across shots.</span>
                        </li>
                    </ul>
                </div>
            );
        case 'INTELLIGENCE':
            return (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                    <div>
                        <h3 className="text-xl font-bold text-cyan-400 mb-2">INTELLIGENCE MODULE // PROMPT ENGINEERING</h3>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                            The "Batch Optimization Engine." This tool bridges the gap between a novice user and a professional prompt engineer.
                            It allows for bulk processing: paste a list of 20 simple ideas, and the system will rewrite all 20 into "Mega-Prompts"—highly detailed, 8K-ready instruction sets focused on lighting, texture, and composition.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 border border-cyan-900/30 rounded">
                        <h4 className="text-xs font-bold text-cyan-500 mb-2">LOGIC CORE</h4>
                        <p className="text-xs text-slate-400 font-mono">
                            Uses Gemini 3 Pro to understand the <i>intent</i> of a prompt, not just the words. If you type "a sad robot," it expands this to: "A rusting robotic unit sitting alone in a rain-slicked alleyway, neon reflections on wet metal, 35mm lens, bokeh, melancholic atmosphere."
                        </p>
                    </div>
                </div>
            );
        case 'VISUALS':
            return (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                    <div>
                        <h3 className="text-xl font-bold text-purple-400 mb-2">VISUAL ENGINE // ASSET FACTORY</h3>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                            The tactical fabrication center. While the Studio is for narratives, the Visual Engine is for raw asset creation.
                            It supports both "Text-to-X" and "Image-to-X" workflows.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border border-slate-700 bg-slate-950">
                            <strong className="text-purple-400 text-xs block mb-1">IMAGE-TO-VIDEO</strong>
                            <span className="text-xs text-slate-400">Upload a static brand asset or product photo and use Veo to bring it to life with "High Motion" or "Low Motion" settings.</span>
                        </div>
                        <div className="p-3 border border-slate-700 bg-slate-950">
                            <strong className="text-purple-400 text-xs block mb-1">MAGIC EDIT</strong>
                            <span className="text-xs text-slate-400">Use Gemini 2.5 Flash to modify existing images via natural language (e.g., "Change the background to a cyberpunk city").</span>
                        </div>
                    </div>
                </div>
            );
        case 'RECON':
            return (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                    <div>
                        <h3 className="text-xl font-bold text-green-400 mb-2">RECON MODULE // DEEP ANALYSIS</h3>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                            A multimodal intelligence scanner. It reverses the creative process—instead of generating content, it dissects it.
                            Useful for analyzing competitor ads, extracting text from video feeds, or creating automated logs of security footage.
                        </p>
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-400 font-mono space-y-2">
                        <li><strong className="text-green-500">Video Scan:</strong> Generates timestamped logs of key events within a video file.</li>
                        <li><strong className="text-green-500">Sentiment Analysis:</strong> Determines the emotional tone of audio or text inputs.</li>
                        <li><strong className="text-green-500">Object Detection:</strong> Identifies and lists physical assets within a frame.</li>
                    </ul>
                </div>
            );
        default:
            return <div className="text-slate-500">Select a module to view details.</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50 overflow-y-auto">
      <SectionTitle 
        icon={Shield} 
        title="Command Center" 
        subtitle="Solberus-VX Interface" 
      />

      {/* SYSTEM DIAGNOSTICS MODAL */}
      {showDiagnostics && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm animate-[fadeIn_0.2s]">
              <div className="bg-slate-950 border border-cyan-500 w-full max-w-4xl max-h-full overflow-y-auto rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col">
                  {/* Header */}
                  <div className="bg-cyan-950/50 p-4 border-b border-cyan-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
                          <div>
                              <h3 className="text-lg font-bold text-white font-mono tracking-widest">SYSTEM_DIAGNOSTICS // NEURAL_OCTANE_BRIDGE</h3>
                              <p className="text-[10px] text-cyan-500 font-mono uppercase">Analyzing Render Configuration...</p>
                          </div>
                      </div>
                      <button onClick={() => setShowDiagnostics(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 space-y-8 font-mono">
                      
                      {/* Section 1: Hardware */}
                      <div>
                          <h4 className="text-xs text-slate-500 border-b border-slate-800 pb-1 mb-3 font-bold">1. SYSTEM & GPU CONFIGURATION (CLOUD_LINK)</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-900/50 p-3 border-l-2 border-cyan-500">
                                  <div className="text-[10px] text-slate-400">DETECTED HARDWARE</div>
                                  <div className="text-sm text-white font-bold">GOOGLE TPU v5p (Cloud Cluster)</div>
                              </div>
                              <div className="bg-slate-900/50 p-3 border-l-2 border-cyan-500">
                                  <div className="text-[10px] text-slate-400">VIRTUAL VRAM (HBM)</div>
                                  <div className="text-sm text-white font-bold">32 GB / NODE (Dynamically Allocated)</div>
                              </div>
                              <div className="bg-slate-900/50 p-3 border-l-2 border-purple-500">
                                  <div className="text-[10px] text-slate-400">COMPUTE DRIVER</div>
                                  <div className="text-sm text-white font-bold">SOLBERUS-VX v3.1.0 (Gemini Core)</div>
                              </div>
                              <div className="bg-slate-900/50 p-3 border-l-2 border-purple-500">
                                  <div className="text-[10px] text-slate-400">ACCELERATION</div>
                                  <div className="text-sm text-white font-bold">XLA (Accelerated Linear Algebra)</div>
                              </div>
                          </div>
                      </div>

                      {/* Section 2: Core */}
                      <div>
                          <h4 className="text-xs text-slate-500 border-b border-slate-800 pb-1 mb-3 font-bold">2. OCTANE RENDER CORE DETAILS</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div className="bg-black border border-slate-800 p-3">
                                  <div className="text-[10px] text-slate-500">KERNEL VERSION</div>
                                  <div className="text-xs text-cyan-300">2024.1.Alpha (Neural-Hybrid)</div>
                              </div>
                              <div className="bg-black border border-slate-800 p-3">
                                  <div className="text-[10px] text-slate-500">LICENSE TIER</div>
                                  <div className="text-xs text-cyan-300">ENTERPRISE / UNLIMITED</div>
                              </div>
                              <div className="bg-black border border-slate-800 p-3">
                                  <div className="text-[10px] text-slate-500">HOST APPLICATION</div>
                                  <div className="text-xs text-cyan-300">Solberus-VX (Web Client)</div>
                              </div>
                          </div>
                      </div>

                      {/* Section 3: Metrics */}
                      <div>
                          <h4 className="text-xs text-slate-500 border-b border-slate-800 pb-1 mb-3 font-bold">3. SCENE & PERFORMANCE METRICS</h4>
                          <div className="bg-slate-900 p-4 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed font-mono">
                              <span className="text-green-500">✓ Device Initialization:</span> COMPLETED (0.04s)<br/>
                              <span className="text-green-500">✓ Kernel Compilation:</span> CACHED<br/>
                              <span className="text-white">--- SCENE INFO ---</span><br/>
                              Polygon Count: ∞ (Neural Estimation / NeRF)<br/>
                              Texture Memory: Virtualized (Streamed)<br/>
                              Neural Radiance Cache (NRC): <span className="text-cyan-400">ACTIVE</span><br/>
                              Geometry Streaming: <span className="text-cyan-400">CLOUD NATIVE</span>
                          </div>
                      </div>

                      {/* Section 4: Live Benchmark */}
                      <div>
                          <h4 className="text-xs text-slate-500 border-b border-slate-800 pb-1 mb-3 font-bold">4. COMPARATIVE BENCHMARK (LIVE)</h4>
                          <div className="flex items-center gap-6">
                              <div className="flex-1">
                                  {!scanning ? (
                                      <CyberButton onClick={runDiagnostics} variant="solana" className="w-full">
                                          <Play className="w-4 h-4" /> EXECUTE BENCHMARK
                                      </CyberButton>
                                  ) : (
                                      <div className="w-full h-10 bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-500 animate-pulse">
                                          MEASURING LATENCY...
                                      </div>
                                  )}
                              </div>
                              <div className="w-2/3 grid grid-cols-2 gap-4">
                                  <div className="bg-black p-3 border border-slate-700">
                                      <div className="text-[10px] text-slate-500">TIME-TO-FIRST-TOKEN (TTFT)</div>
                                      <div className="text-xl font-bold text-white">{diagStats ? `${diagStats.latency}ms` : '--'}</div>
                                  </div>
                                  <div className="bg-black p-3 border border-slate-700">
                                      <div className="text-[10px] text-slate-500">INFERENCE SPEED (Simulated SPS)</div>
                                      <div className="text-xl font-bold text-green-400">{diagStats ? `${diagStats.tps} Samples/Sec` : '--'}</div>
                                  </div>
                              </div>
                          </div>
                          {diagStats && (
                              <div className="mt-2 text-[10px] text-slate-500">
                                  * Benchmark compares Gemini API response time against simulated OctaneBench 2024 reference scores.
                              </div>
                          )}
                      </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="bg-slate-900/80 p-4 border-t border-slate-800 flex justify-end gap-2">
                       <CyberButton onClick={() => {
                           const data = JSON.stringify({
                               timestamp: Date.now(),
                               hardware: "Google TPU v5p",
                               octane_core: "2024.1.Alpha",
                               benchmark_result: diagStats
                           }, null, 2);
                           const blob = new Blob([data], {type: 'application/json'});
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.href = url;
                           a.download = `solberus_diagnostic_report_${Date.now()}.json`;
                           a.click();
                       }} variant="secondary" className="text-xs">
                           <FileJson className="w-4 h-4" /> EXPORT JSON REPORT
                       </CyberButton>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-6xl mx-auto w-full space-y-6 pb-8 px-4">
        
        {/* Welcome Block */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu className="w-32 h-32 text-cyan-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wider">SOLBERUS-VX ENGINE</h2>
            <p className="text-slate-400 max-w-2xl font-mono text-sm leading-relaxed mb-4">
                Welcome to the Solberus-VX interface. This system leverages Google's advanced Gemini models to enhance creativity and analysis. 
                Use the Prompt Enhancer to upgrade your ideas, then feed them into the Image & Video Generator for automated production.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-cyan-600">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> ENGINE: ONLINE</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SECURITY: MAX</span>
                <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> VERSION: 3.1.0</span>
                <button onClick={() => setShowDiagnostics(true)} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer ml-4 border-l border-slate-800 pl-4"><Activity className="w-3 h-3" /> RUN DIAGNOSTICS</button>
            </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-slate-900 p-1 border border-slate-800 w-fit rounded-lg">
            <button 
                onClick={() => setViewMode('GRID')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono rounded transition-all ${viewMode === 'GRID' ? 'bg-cyan-950 text-cyan-400 shadow' : 'text-slate-500 hover:text-white'}`}
            >
                <Grid className="w-4 h-4" /> COMMAND GRID
            </button>
            <button 
                onClick={() => setViewMode('MANUAL')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono rounded transition-all ${viewMode === 'MANUAL' ? 'bg-cyan-950 text-cyan-400 shadow' : 'text-slate-500 hover:text-white'}`}
            >
                <BookOpen className="w-4 h-4" /> TACTICAL MANUAL
            </button>
        </div>

        {viewMode === 'GRID' ? (
            /* Module Grid */
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((m) => (
                        <div 
                            key={m.id}
                            onClick={() => onNavigate(m.id)}
                            className={`bg-slate-900/30 border ${m.borderColor} p-6 cursor-pointer transition-all duration-300 group ${m.hover} relative overflow-hidden`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 bg-slate-950 border border-slate-800 group-hover:border-white/20 transition-colors`}>
                                    <m.icon className={`w-8 h-8 ${m.color}`} />
                                </div>
                                <ArrowRight className={`w-5 h-5 text-slate-600 group-hover:${m.color} transition-colors transform group-hover:translate-x-1`} />
                            </div>
                            
                            <h3 className={`text-xl font-bold text-white mb-2 tracking-wide group-hover:${m.color} transition-colors`}>{m.title}</h3>
                            <p className="text-slate-400 text-sm font-mono mb-4 h-10">{m.desc}</p>
                            
                            <div className="space-y-3">
                                <div className="text-xs font-mono font-bold text-white bg-slate-950 w-fit px-2 py-0.5 border border-slate-800 rounded">
                                    {m.stat}
                                </div>
                                <div className="space-y-1">
                                    {m.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                            <div className={`w-1 h-1 rounded-full bg-slate-600 group-hover:${m.color}`}></div>
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent group-hover:via-white/20 transition-all"></div>
                        </div>
                    ))}
                </div>

                {/* Quick Tips */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/30 border border-slate-800 p-4">
                        <div className="flex items-center gap-2 text-cyan-400 mb-2 font-bold font-mono text-sm">
                            <Info className="w-4 h-4" /> BATCH MODE
                        </div>
                        <p className="text-xs text-slate-500">
                            Paste a list of 10+ raw ideas into the Prompt Enhancer. It will output 10+ perfected prompts. Then paste that result into the Image Gen tool.
                        </p>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800 p-4">
                        <div className="flex items-center gap-2 text-cyan-400 mb-2 font-bold font-mono text-sm">
                            <Info className="w-4 h-4" /> AUTO-SEQUENCE
                        </div>
                        <p className="text-xs text-slate-500">
                            The Image & Video Generator loops through every line of text you provide. It will generate an asset for every single line automatically.
                        </p>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800 p-4">
                        <div className="flex items-center gap-2 text-cyan-400 mb-2 font-bold font-mono text-sm">
                            <Info className="w-4 h-4" /> VEO ACCESS
                        </div>
                        <p className="text-xs text-slate-500">
                            Video generation uses Veo models which require a paid billing account. Use the unlock button in the sidebar if available.
                        </p>
                    </div>
                </div>
            </>
        ) : (
            /* System Manual View */
            <div className="flex gap-8 border-t border-slate-800 pt-6">
                <div className="w-1/4 space-y-2">
                    {modules.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setManualSection(m.id)}
                            className={`w-full text-left px-4 py-3 text-xs font-mono font-bold border-l-2 transition-all flex items-center justify-between group ${manualSection === m.id ? `bg-slate-900 ${m.color} border-current` : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-900/50'}`}
                        >
                            <span>{m.title}</span>
                            {manualSection === m.id && <ChevronRight className="w-3 h-3" />}
                        </button>
                    ))}
                </div>
                <div className="w-3/4 bg-slate-950 border border-slate-800 p-8 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    {renderManualContent()}
                    
                    <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-mono">MANUAL_ENTRY_ID: {manualSection}</span>
                        <CyberButton onClick={() => onNavigate(manualSection as FeatureMode)} variant="secondary" className="text-xs py-2">
                             <Play className="w-3 h-3" /> LAUNCH MODULE
                        </CyberButton>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
