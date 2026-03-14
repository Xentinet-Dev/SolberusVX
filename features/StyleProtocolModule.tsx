
import React, { useState, useRef } from 'react';
import { CyberButton, CyberTextArea, SectionTitle, LoadingScan } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { ModelType } from '../types';
import { OCTANE_DNA } from '../constants';
import { Dna, Lock, Image as ImageIcon, Plus, Layers, AlertCircle, Copy, ArrowRight, X, Cpu, Globe, Info, Check } from 'lucide-react';

export const StyleProtocolModule = () => {
  // CONFIGURATION STATE
  // Now supports multiple anchor images
  const [anchorImages, setAnchorImages] = useState<{data: string, mimeType: string}[]>([]);
  const [masterDNA, setMasterDNA] = useState("Unreal Engine 5 render, Octane Render, 8k resolution, cinematic lighting, clay material, vinyl toy texture, smooth surfaces, vibrant psychedelic colors, Matt Furie inspired art style, whimsical but grotesque, high fidelity details, sharp focus, volumetric fog, ray tracing, 3D cartoon style --v 6.0");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState<string>(ModelType.PRO_IMAGE);
  
  // EXECUTION STATE
  const [subjectInput, setSubjectInput] = useState("");
  // Multi-select Modifiers State
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<{url: string, subject: string, timestamp: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const modifiers = [
    { name: "UI / GLASS", prompt: "thick frosted glass texture, glowing edges, holographic interface" },
    { name: "CHARACTER", prompt: "subsurface scattering, waxy skin texture, wet eyes" },
    { name: "STRUCTURE", prompt: "worn concrete texture, rusted metal, painted wood" },
    { name: "ORGANIC", prompt: "slime texture, biological fluid, pulsating veins, translucent membrane" },
    { name: "OCTANE / 3D", prompt: OCTANE_DNA.replace(/^, /, '') }, // Remove leading comma from constant
    { name: "NONE", prompt: "" }
  ];

  const models = [
    { id: ModelType.PRO_IMAGE, name: "NANO BANANA PRO (GEMINI 3)", desc: "Highest Fidelity / Best Reasoning", type: "google" },
    { id: ModelType.FLASH_IMAGE, name: "NANO BANANA (GEMINI FLASH)", desc: "High Speed Prototyping", type: "google" },
    { id: ModelType.IMAGEN_4, name: "IMAGEN 4.0 (PREVIEW)", desc: "Ultra Photorealism Engine", type: "google" },
    { id: ModelType.IMAGEN_3, name: "IMAGEN 3.0", desc: "Stable High-Fidelity Generation", type: "google" },
    { id: "MIDJOURNEY_V6", name: "MIDJOURNEY V6.1", desc: "External Uplink Offline - Protocol Restricted", type: "restricted" },
    { id: "DALLE_3", name: "DALL-E 3 (OPENAI)", desc: "External Uplink Offline - Protocol Restricted", type: "restricted" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Limit total to 4 images to prevent context overload/clutter
    const remainingSlots = 4 - anchorImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    const promises = filesToProcess.map((file: File) => new Promise<{data: string, mimeType: string}>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve({ data: base64Data, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    }));

    Promise.all(promises).then(newImages => {
        setAnchorImages(prev => [...prev, ...newImages]);
    });
    
    if (e.target) e.target.value = '';
  };

  const removeAnchorImage = (index: number) => {
      setAnchorImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleModifier = (name: string) => {
      if (name === 'NONE') {
          setActiveModifiers([]);
          return;
      }
      // If we select a normal modifier, ensure 'NONE' is removed if it was there (though our logic handles array)
      setActiveModifiers(prev => {
          if (prev.includes(name)) {
              return prev.filter(m => m !== name);
          } else {
              return [...prev, name];
          }
      });
  };

  const handleGenerate = async () => {
      if (!subjectInput.trim()) return alert("SUBJECT REQUIRED");
      
      setLoading(true);
      setProgressMsg("ASSEMBLING DNA SEQUENCE...");

      try {
          // 1. Construct the Formula
          const subject = subjectInput.trim();
          
          // Combine all active modifier prompts
          const selectedPrompts = modifiers
              .filter(m => activeModifiers.includes(m.name))
              .map(m => m.prompt)
              .join(', ');
              
          const mod = selectedPrompts ? `${selectedPrompts}, ` : "";
          const dna = masterDNA.trim();
          
          // The Formula: [Subject] + [Modifier Combination] + [Master DNA]
          const finalPrompt = `${subject}, isolated in center with empty space. ${mod}${dna}`;
          
          setProgressMsg(`FABRICATING ASSET (${anchorImages.length} REFS)...`);

          const images = await geminiService.generateImage(
              finalPrompt, 
              "2K", 
              aspectRatio, 
              anchorImages, // Pass the array of all anchor images
              selectedModel
          );

          if (images.length > 0) {
              setGeneratedAssets(prev => [{
                  url: images[0],
                  subject: subject,
                  timestamp: Date.now()
              }, ...prev]);
          }

      } catch (e: any) {
          alert(`Fabrication Error: ${e.message}`);
      } finally {
          setLoading(false);
          setSubjectInput(""); // Clear subject for next item
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Dna} title="Protocol DNA" subtitle="Visual Consistency Engine" />

      <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* LEFT: THE ARCHITECT (Configuration) */}
          <div className="w-1/3 flex flex-col gap-4">

               {/* MODEL SELECTOR (NEURAL CORE) */}
               <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                   <label className="text-[10px] font-mono text-cyan-500 font-bold uppercase flex items-center gap-1 mb-2">
                       <Cpu className="w-3 h-3" /> NEURAL CORE SELECTION
                   </label>
                   <div className="space-y-1">
                       {models.map(m => (
                           <button
                             key={m.id}
                             onClick={() => m.type === 'google' ? setSelectedModel(m.id) : null}
                             className={`w-full text-left p-2 border rounded flex justify-between items-center transition-all ${
                                 m.type === 'restricted' 
                                 ? 'bg-red-950/10 border-red-900/30 text-red-700 cursor-not-allowed opacity-60'
                                 : selectedModel === m.id 
                                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                             }`}
                           >
                               <div>
                                   <div className="text-[10px] font-bold font-mono">{m.name}</div>
                                   <div className="text-[9px] font-mono opacity-70">{m.desc}</div>
                               </div>
                               {m.type === 'restricted' && <Lock className="w-3 h-3" />}
                               {selectedModel === m.id && m.type === 'google' && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                           </button>
                       ))}
                   </div>
               </div>
              
              {/* STEP 1: ANCHOR FRAME */}
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-mono text-cyan-500 font-bold uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3" /> STEP 1: ANCHOR DNA ({anchorImages.length}/4)
                      </label>
                      {anchorImages.length > 0 && (
                          <button onClick={() => setAnchorImages([])} className="text-[9px] text-red-500 hover:text-white uppercase">CLEAR ALL</button>
                      )}
                  </div>
                  
                  {/* Grid Display for Anchors */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                      {anchorImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-video group border border-slate-700 bg-black overflow-hidden rounded">
                               <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover opacity-80" />
                               <button 
                                   onClick={() => removeAnchorImage(idx)}
                                   className="absolute top-1 right-1 bg-red-900/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   <X className="w-3 h-3" />
                               </button>
                          </div>
                      ))}
                      
                      {/* Upload Button */}
                      {anchorImages.length < 4 && (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`aspect-video border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded flex flex-col items-center justify-center cursor-pointer transition-colors group ${anchorImages.length === 0 ? 'col-span-2 py-8' : ''}`}
                          >
                              <Plus className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 mb-1" />
                              <span className="text-[9px] text-slate-500 group-hover:text-cyan-400 font-mono uppercase transition-colors">
                                  {anchorImages.length === 0 ? "UPLOAD ANCHOR FRAMES" : "ADD REF"}
                              </span>
                          </div>
                      )}
                  </div>
                  
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                  
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 mt-2">
                      <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${anchorImages.length > 0 ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                          <span className="text-[9px] font-mono text-slate-400">
                              {anchorImages.length > 0 ? `${anchorImages.length} REFERENCE NODES LOCKED` : "NO REFERENCE DATA"}
                          </span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-mono leading-tight">
                          Upload specific art styles (e.g., Cartoons, 3D Renders). <br/>
                          <span className="text-cyan-600 font-bold">SYSTEM WILL MIMIC THIS EXACT STYLE FOR ANY PROMPT.</span>
                      </p>
                  </div>
              </div>

              {/* STEP 2: MASTER DNA */}
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-mono text-purple-400 font-bold uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3" /> STEP 2: MASTER DNA (SUFFIX)
                      </label>
                      <button 
                        onClick={() => navigator.clipboard.writeText(masterDNA)}
                        className="text-slate-500 hover:text-white"
                        title="Copy to Clipboard"
                      >
                          <Copy className="w-3 h-3" />
                      </button>
                  </div>
                  <CyberTextArea 
                    value={masterDNA}
                    onChange={(e: any) => setMasterDNA(e.target.value)}
                    className="flex-1 text-[10px] leading-relaxed resize-none text-slate-300 font-mono"
                    placeholder="Enter the static prompt suffix here..."
                  />
                  <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] text-slate-600 font-mono">ASPECT RATIO:</span>
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded">
                          <option value="1:1">1:1 (Square)</option>
                          <option value="16:9">16:9 (Landscape)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                      </select>
                  </div>
              </div>

          </div>

          {/* RIGHT: THE FABRICATOR (Execution) */}
          <div className="w-2/3 flex flex-col gap-4">
              
              {/* INPUT CONSOLE */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                   
                   <div className="relative z-10">
                       <div className="flex justify-between items-center mb-4">
                           <label className="text-xs font-mono text-slate-400 flex items-center gap-2">
                               <Layers className="w-4 h-4 text-green-500" /> STEP 3: TEXTURE MODIFIERS (COMBINABLE)
                           </label>
                           {activeModifiers.length > 0 && <span className="text-[9px] text-green-500 font-mono bg-green-950/30 px-2 py-0.5 rounded border border-green-900/50">{activeModifiers.length} ACTIVE</span>}
                       </div>
                       
                       <div className="flex flex-wrap gap-2 mb-6">
                           {modifiers.map(mod => (
                               <button
                                key={mod.name}
                                onClick={() => toggleModifier(mod.name)}
                                className={`px-3 py-1.5 text-[10px] font-mono border transition-all rounded uppercase flex items-center gap-2 ${
                                    (mod.name !== 'NONE' && activeModifiers.includes(mod.name)) || (mod.name === 'NONE' && activeModifiers.length === 0)
                                    ? 'bg-green-950 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                                }`}
                               >
                                   {mod.name !== 'NONE' && activeModifiers.includes(mod.name) && <Check className="w-3 h-3" />}
                                   {mod.name}
                               </button>
                           ))}
                       </div>

                       <label className="text-xs font-mono text-slate-400 mb-2 block flex items-center gap-2">
                           <Plus className="w-4 h-4 text-white" /> STEP 4: SUBJECT INPUT
                       </label>
                       <div className="flex gap-4">
                           <div className="flex-1 relative">
                               <input 
                                value={subjectInput}
                                onChange={(e) => setSubjectInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="e.g. A futuristic loading bar, A golden trophy, A map icon..."
                                className="w-full h-12 bg-black border border-slate-700 text-white font-mono px-4 focus:outline-none focus:border-cyan-500 rounded-l"
                               />
                               <div className="absolute right-0 top-0 h-full flex items-center px-4 bg-slate-900 border-l border-slate-700 text-[10px] text-slate-500 font-mono select-none">
                                   + DNA LOCKED
                               </div>
                           </div>
                           <CyberButton onClick={handleGenerate} disabled={loading} variant="solana" className="w-40 rounded-r rounded-l-none">
                               {loading ? "FABRICATING..." : "GENERATE"}
                           </CyberButton>
                       </div>
                   </div>
              </div>

              {/* OUTPUT STREAM */}
              <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-lg p-4 overflow-y-auto">
                   {loading && <div className="mb-4"><LoadingScan text={progressMsg} /></div>}
                   
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                       {generatedAssets.map((asset, i) => (
                           <div key={i} className="bg-slate-950 border border-slate-800 p-2 rounded group relative hover:border-cyan-600 transition-colors">
                               <div className="aspect-square bg-black mb-2 overflow-hidden relative">
                                   <img src={asset.url} className="w-full h-full object-cover" />
                                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                       <a href={asset.url} download={`protocol_dna_${asset.timestamp}`} className="bg-black/70 text-white p-1.5 rounded hover:bg-cyan-600"><ArrowRight className="w-3 h-3" /></a>
                                   </div>
                               </div>
                               <div className="text-[10px] font-mono text-slate-300 truncate px-1">
                                   {asset.subject}
                               </div>
                               <div className="text-[9px] font-mono text-slate-600 px-1">
                                   {new Date(asset.timestamp).toLocaleTimeString()}
                               </div>
                           </div>
                       ))}
                       {generatedAssets.length === 0 && !loading && (
                           <div className="col-span-full h-32 flex flex-col items-center justify-center text-slate-600 font-mono opacity-50">
                               <Dna className="w-8 h-8 mb-2" />
                               <span className="text-xs">NO ASSETS FABRICATED</span>
                           </div>
                       )}
                   </div>
              </div>

          </div>
      </div>
    </div>
  );
};
