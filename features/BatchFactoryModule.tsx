
import React, { useState, useRef } from 'react';
import { CyberButton, CyberTextArea, SectionTitle } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { storageService, StoredAsset } from '../services/storageService';
import { ModelType } from '../types';
import { Factory, Terminal, OctagonX, ImagePlus, X, Upload, FileJson, CheckCircle, Copy, Cpu, Play, LayoutGrid, Maximize2, Download, FileText, ToggleLeft, ToggleRight, Sparkles, Wand2 } from 'lucide-react';
import JSZip from 'jszip';

// HIDDEN CONSTANT - TRENCHZ STYLE DNA
const TRENCHZ_STYLE_DNA = ", Unreal Engine 5 render, Octane Render, 8k resolution, cinematic lighting, clay material, vinyl toy texture, smooth surfaces, vibrant psychedelic colors, Matt Furie inspired art style, whimsical but grotesque, high fidelity details, sharp focus, volumetric fog, ray tracing, 3D cartoon style --v 6.0";

interface BatchItem {
    filename: string;
    category: string;
    aspect_ratio: string;
    base_prompt?: string;
    subject_core?: string;
    camera_angle?: string;
    lighting_setup?: string;
    background_instruction?: string;
    negative_constraints?: string;
}

export const BatchFactoryModule = () => {
  const [inputMode, setInputMode] = useState<'JSON' | 'RAW'>('JSON');
  const [batchInput, setBatchInput] = useState('');
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(ModelType.PRO_IMAGE);
  
  // Reference Images State
  const [refImages, setRefImages] = useState<{data: string, mimeType: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // Session Output State (Local Only)
  const [viewMode, setViewMode] = useState<'TERMINAL' | 'SESSION'>('TERMINAL');
  const [sessionAssets, setSessionAssets] = useState<StoredAsset[]>([]); 
  const [fullScreenAsset, setFullScreenAsset] = useState<{url: string, type: 'image' | 'video'} | null>(null);

  const models = [
    { id: ModelType.PRO_IMAGE, name: "GEMINI 3 PRO (RECOMMENDED)", desc: "Best Instruction Following" },
    { id: ModelType.IMAGEN_3, name: "IMAGEN 3.0", desc: "High Fidelity Textures" },
    { id: ModelType.FLASH_IMAGE, name: "GEMINI FLASH (FAST)", desc: "Rapid Prototyping" },
  ];

  const addBatchLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      const timestamp = new Date().toLocaleTimeString();
      setBatchLogs(prev => [`[${timestamp}] [${type.toUpperCase()}] ${msg}`, ...prev]);
  };

  const copyManifestPrompt = () => {
      const prompt = `Act as the "Manifest Architect" for the Solberus-VX Batch Factory.
I will provide a list of asset ideas. You must convert them into a strict JSON Array using the ENHANCED STRUCTURE below.

### OUTPUT JSON STRUCTURE (Strict):
[
  {
    "filename": "string (snake_case, unique)",
    "category": "string (folder name)",
    "aspect_ratio": "16:9" | "1:1" | "9:16",
    "subject_core": "string (The object only. e.g. 'A tactical frog smoking a cigar')",
    "camera_angle": "string (CRITICAL for UI. e.g. 'Direct front view, orthographic, symmetrical')",
    "lighting_setup": "string (e.g. 'Studio rim lighting, hard shadows' or 'Soft cinematic fog')",
    "background_instruction": "string (e.g. 'Isolated on pure white background, no shadows on floor')",
    "negative_constraints": "string (What to avoid. e.g. 'No text, no blur, do not crop edges')"
  }
]

### RULES:
1. Return ONLY the JSON. No markdown formatting.
2. Separate the WHAT (Subject) from the HOW (Camera/Lighting).
3. Do NOT add style keywords (like "Unreal Engine") to the fields. The system injects DNA automatically.

### MY INPUT:
`;
      navigator.clipboard.writeText(prompt);
      addBatchLog("ENHANCED SYSTEM PROMPT COPIED.", 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const remainingSlots = 4 - refImages.length;
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
        setRefImages(prev => [...prev, ...newImages]);
    });
    if (e.target) e.target.value = '';
  };

  const removeRefImage = (index: number) => {
    setRefImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStop = () => {
    abortRef.current = true;
    addBatchLog("EMERGENCY STOP SIGNAL RECEIVED.", 'error');
  };

  const handleTransformBatch = async () => {
      if (!batchInput.trim()) {
          alert("INPUT REQUIRED: Paste your raw prompt list first.");
          return;
      }
      setIsTransforming(true);
      addBatchLog("INITIATING INTELLIGENT BATCH TRANSFORMATION...", 'info');

      try {
          const systemInstruction = `You are the Solberus-VX Batch Manifest Architect.
          Your task is to convert raw text inputs (lists of prompts, even if messy or numbered) into a strict JSON Array for the Batch Factory.

          INPUT ANALYSIS:
          The input might contain:
          - Numbered lists
          - "---PROMPTS_START---" blocks (from Intelligence Module)
          - Raw paragraphs
          
          TASK:
          Extract every distinct visual idea and format it.

          OUTPUT FORMAT (Strict JSON Array):
          [
            {
              "filename": "string (generate a unique, descriptive snake_case filename based on the prompt, max 30 chars)",
              "category": "string (infer a 1-word category e.g. 'character', 'vehicle', 'landscape', 'ui')",
              "aspect_ratio": "16:9",
              "base_prompt": "string (The full refined prompt text. Enhance clarity if needed.)"
            }
          ]

          RULES:
          1. Return ONLY valid JSON. No markdown code blocks (no \`\`\`json).
          2. Ensure every item in the input list gets an object.
          3. Infer meaningful filenames.`;

          const result = await geminiService.generateText(ModelType.PRO, batchInput, systemInstruction);
          
          let cleanJson = result.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "";
          
          // Basic validation attempt
          JSON.parse(cleanJson); // Will throw if invalid

          setBatchInput(cleanJson);
          setInputMode('JSON');
          addBatchLog("BATCH TRANSFORMATION COMPLETE. FORMAT: JSON [READY].", 'success');

      } catch (e: any) {
          addBatchLog(`TRANSFORMATION FAILED: ${e.message}`, 'error');
      } finally {
          setIsTransforming(false);
      }
  };

  const handleBatchExecute = async () => {
      if (!batchInput.trim()) {
          alert("INPUT DATA REQUIRED");
          return;
      }

      setLoading(true);
      setViewMode('TERMINAL'); 
      setBatchLogs([]);
      setBatchProgress(0);
      setSessionAssets([]); // Clear previous session outputs for a fresh run
      abortRef.current = false;

      let assets: BatchItem[] = [];

      try {
          if (inputMode === 'JSON') {
              // --- JSON PARSING LOGIC ---
              let raw = batchInput.trim();
              const startIndex = raw.indexOf('[');
              const endIndex = raw.lastIndexOf(']');

              if (startIndex === -1 || endIndex === -1) {
                  throw new Error("No JSON Array found. Input must contain '[' and ']'.");
              }

              raw = raw.substring(startIndex, endIndex + 1);
              raw = raw.replace(/,\s*\]/g, ']');
              
              assets = JSON.parse(raw);
              if (!Array.isArray(assets)) throw new Error("Parsed content is not an array.");
          } else {
              // --- RAW TEXT PARSING LOGIC ---
              // Handles blocks of text separated by double newlines OR single lines
              const hasDoubleNewlines = batchInput.includes('\n\n');
              const rawPrompts = hasDoubleNewlines 
                  ? batchInput.split(/\n\s*\n/) 
                  : batchInput.split('\n');
              
              const cleanPrompts = rawPrompts.filter(p => p.trim() !== '');
              
              assets = cleanPrompts.map((p, idx) => ({
                  filename: `batch_asset_${idx + 1}`,
                  category: 'raw_batch',
                  aspect_ratio: '16:9',
                  base_prompt: p.trim()
              }));
              
              if (assets.length === 0) throw new Error("No valid prompts found in text input.");
          }
      } catch (e: any) {
          addBatchLog(`PARSING ERROR: ${e.message}`, 'error');
          if (inputMode === 'JSON') addBatchLog("TIP: Ensure your JSON is a valid list of objects inside [ ].", 'info');
          setLoading(false);
          return;
      }

      const zip = new JSZip();
      addBatchLog(`INITIALIZING FACTORY. QUEUED: ${assets.length} ASSETS.`, 'info');
      addBatchLog(`MODEL CORE: ${selectedModel}`, 'info');

      if (refImages.length > 0) {
          addBatchLog(`STYLE REFERENCE INJECTION ACTIVE: ${refImages.length} FRAMES`, 'info');
      }

      // --- CONSTRUCT ALL PROMPTS FIRST ---
      const prompts: string[] = [];
      const assetMetadata: BatchItem[] = [];

      for (const item of assets) {
          let finalPrompt = "";
          if (item.base_prompt) {
              finalPrompt = `${item.base_prompt}`; 
              if (inputMode === 'JSON') finalPrompt += TRENCHZ_STYLE_DNA; 
          } else {
              const subject = item.subject_core || "Object";
              const camera = item.camera_angle ? `${item.camera_angle}. ` : "";
              const lighting = item.lighting_setup ? `${item.lighting_setup}. ` : "";
              const bg = item.background_instruction ? `${item.background_instruction}. ` : "";
              const neg = item.negative_constraints ? `Avoid: ${item.negative_constraints}. ` : "";
              
              finalPrompt = `${camera}${subject}. ${lighting}${bg}${neg} Style DNA: ${TRENCHZ_STYLE_DNA}`;
          }
          prompts.push(finalPrompt);
          assetMetadata.push(item);
      }

      addBatchLog(`ENGAGING PARALLEL GENERATION MATRIX...`, 'info');

      // --- EXECUTE PARALLEL BATCH ---
      let completedCount = 0;
      await geminiService.generateImageBatch(
          prompts,
          "2K",
          "16:9", // Default ratio if not specified per item (BatchFactory simplifies this for parallel efficiency, can be enhanced later)
          refImages,
          selectedModel,
          async (index, url) => {
              if (abortRef.current) return;
              
              const item = assetMetadata[index];
              const fileName = item.filename.replace(/[^a-z0-9-_]/gi, '_') + '.png';
              
              // Add to ZIP
              const base64Data = url.split(',')[1];
              zip.folder(item.category || "uncategorized")?.file(fileName, base64Data, { base64: true });

              // Save to Storage
              const newAsset: StoredAsset = {
                  id: crypto.randomUUID(),
                  type: 'image',
                  url: url,
                  prompt: prompts[index],
                  timestamp: Date.now(),
                  tags: [item.category, "BATCH_FACTORY"],
                  theme: inputMode === 'JSON' ? "TRENCHZ_V6" : "RAW_BATCH"
              };

              await storageService.saveAsset(newAsset);
              setSessionAssets(prev => [newAsset, ...prev]);

              completedCount++;
              setBatchProgress(Math.round((completedCount / assets.length) * 100));
              addBatchLog(`[${completedCount}/${assets.length}] GENERATED: ${fileName}`, 'success');
          }
      );

      if (!abortRef.current) {
          setBatchProgress(100);
          addBatchLog("BATCH COMPLETE. COMPRESSING ARCHIVE...", 'info');
          
          try {
              const content = await zip.generateAsync({ type: "blob" });
              const url = URL.createObjectURL(content);
              const a = document.createElement('a');
              a.href = url;
              a.download = `solberus_batch_${Date.now()}.zip`;
              a.click();
              addBatchLog("ARCHIVE DOWNLOADED.", 'success');
          } catch (e: any) {
              addBatchLog(`COMPRESSION FAILED: ${e.message}`, 'error');
          }
      }

      setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Factory} title="Batch Factory" subtitle="Automated Asset Pipeline" />

      {fullScreenAsset && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setFullScreenAsset(null)}>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-8 h-8" /></button>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                <img src={fullScreenAsset.url} alt="Full Screen" className="max-w-[90vw] max-h-[90vh] object-contain border border-slate-700 shadow-2xl" />
            </div>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden animate-[fadeIn_0.5s]">
          
          {/* Left Panel: Configuration */}
          <div className="w-1/2 flex flex-col gap-4">
              
              <div className="flex gap-4">
                  <div className="w-2/3 bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex flex-col justify-center">
                       <label className="text-[10px] font-mono text-cyan-500 font-bold uppercase flex items-center gap-1 mb-1">
                           <Cpu className="w-3 h-3" /> MODEL CORE
                       </label>
                       <select 
                          value={selectedModel} 
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-xs font-mono text-white p-1 rounded focus:outline-none focus:border-cyan-500"
                        >
                           {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                  </div>
                  
                  <div className="w-1/3 bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={copyManifestPrompt}>
                       <Copy className="w-4 h-4 text-purple-400 mb-1" />
                       <span className="text-[9px] font-mono text-purple-300 text-center leading-tight">COPY AI<br/>INSTRUCTIONS</span>
                  </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-mono text-cyan-500 font-bold uppercase flex items-center gap-1">
                          <ImagePlus className="w-3 h-3" /> STYLE REFERENCE INJECTION (OPTIONAL)
                      </label>
                      {refImages.length > 0 && (
                          <button onClick={() => setRefImages([])} className="text-[9px] text-red-500 hover:text-white uppercase">CLEAR</button>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                      {refImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-square group border border-slate-700 bg-black overflow-hidden rounded">
                               <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover opacity-80" />
                               <button 
                                   onClick={() => removeRefImage(idx)}
                                   className="absolute top-0.5 right-0.5 bg-red-900/80 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   <X className="w-3 h-3" />
                               </button>
                          </div>
                      ))}
                      
                      {refImages.length < 4 && (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded flex flex-col items-center justify-center cursor-pointer transition-colors group bg-slate-950 hover:bg-slate-900"
                          >
                              <Upload className="w-4 h-4 text-slate-600 group-hover:text-cyan-500 mb-1" />
                              <span className="text-[8px] text-slate-500 group-hover:text-cyan-400 font-mono uppercase">UPLOAD</span>
                          </div>
                      )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                  <p className="text-[9px] text-slate-600 font-mono mt-2 leading-tight">
                      Upload references to override or mix with DNA. If empty, pure Trenchz DNA is used.
                  </p>
              </div>

              <div className="bg-slate-900/50 p-6 border border-slate-800 rounded-lg flex-1 flex flex-col shadow-2xl relative">
                  <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-mono text-cyan-500 font-bold flex items-center gap-2">
                          {inputMode === 'JSON' ? <FileJson className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          INPUT DATA: {inputMode === 'JSON' ? 'STRUCTURED JSON' : 'RAW TEXT'}
                      </label>
                      
                      <div className="flex bg-slate-950 border border-slate-700 rounded overflow-hidden">
                          <button 
                            onClick={() => setInputMode('JSON')}
                            className={`px-3 py-1 text-[10px] font-mono font-bold transition-colors ${inputMode === 'JSON' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                          >
                              JSON
                          </button>
                          <div className="w-[1px] bg-slate-700"></div>
                          <button 
                            onClick={() => setInputMode('RAW')}
                            className={`px-3 py-1 text-[10px] font-mono font-bold transition-colors ${inputMode === 'RAW' ? 'bg-cyan-900 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                          >
                              RAW TEXT
                          </button>
                      </div>
                  </div>
                  
                  <CyberTextArea
                      value={batchInput}
                      onChange={(e: any) => setBatchInput(e.target.value)}
                      placeholder={inputMode === 'JSON' 
                        ? `[\n  {\n    "filename": "asset_1",\n    "category": "ui",\n    "base_prompt": "A futuristic button"\n  }\n]` 
                        : `Paste your list of prompts here (or Intelligence Module output).\n\n1. A cybernetic soldier...\n2. A neon city street...\n\nUse "Transform Batch" to auto-convert this to JSON.`}
                      className="flex-1 font-mono text-xs leading-relaxed border-slate-700 bg-slate-950"
                  />
                  
                  {/* UTILITY BAR */}
                  <div className="flex gap-2 mt-4">
                        <button 
                            onClick={handleTransformBatch}
                            disabled={isTransforming || loading}
                            className="bg-slate-800 border border-slate-600 text-cyan-400 hover:bg-cyan-900/50 hover:text-white hover:border-cyan-500 px-4 py-3 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all w-1/2"
                        >
                            {isTransforming ? (
                                <span className="animate-pulse">ANALYZING...</span>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" /> TRANSFORM TO BATCH JSON
                                </>
                            )}
                        </button>
                        
                        {loading ? (
                            <CyberButton onClick={handleStop} variant="danger" className="w-1/2 py-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                                <OctagonX className="w-4 h-4" /> ABORT
                            </CyberButton>
                        ) : (
                            <CyberButton onClick={handleBatchExecute} variant="solana" className="w-1/2 py-3 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
                                <Play className="w-4 h-4" /> EXECUTE BATCH
                            </CyberButton>
                        )}
                  </div>
              </div>
          </div>

          {/* Right Panel: Console & Session Output */}
          <div className="w-1/2 flex flex-col gap-4">
               <div className="bg-black border border-slate-800 rounded-lg flex-1 flex flex-col overflow-hidden relative shadow-2xl">
                   
                   {/* Header Tabs */}
                   <div className="bg-slate-900 p-2 border-b border-slate-800 flex justify-between items-center">
                       <div className="flex gap-2">
                           <button 
                              onClick={() => setViewMode('TERMINAL')} 
                              className={`text-[10px] font-mono font-bold px-3 py-1 rounded transition-colors flex items-center gap-2 ${viewMode === 'TERMINAL' ? 'bg-slate-800 text-green-400' : 'text-slate-500 hover:text-white'}`}
                           >
                               <Terminal className="w-3 h-3" /> TERMINAL
                           </button>
                           <button 
                              onClick={() => setViewMode('SESSION')} 
                              className={`text-[10px] font-mono font-bold px-3 py-1 rounded transition-colors flex items-center gap-2 ${viewMode === 'SESSION' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                           >
                               <LayoutGrid className="w-3 h-3" /> SESSION OUTPUT ({sessionAssets.length})
                           </button>
                       </div>
                       {viewMode === 'TERMINAL' && <span className="text-xs font-mono text-slate-500">{batchProgress}%</span>}
                   </div>
                   
                   {viewMode === 'TERMINAL' ? (
                        <>
                            <div className="h-1 bg-slate-800 w-full">
                                <div className="h-full bg-green-500 transition-all duration-300" style={{width: `${batchProgress}%`}}></div>
                            </div>

                            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 bg-black">
                                {batchLogs.length === 0 && (
                                    <div className="text-slate-600 italic mt-4 ml-2 opacity-50">
                                        > System Ready.<br/>
                                        > Waiting for Input Data...
                                    </div>
                                )}
                                {batchLogs.map((log, i) => (
                                    <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-slate-300'} border-l-2 border-transparent pl-2 hover:bg-slate-900/50`}>
                                        {log}
                                    </div>
                                ))}
                                {loading && <div className="text-cyan-500 animate-pulse ml-2">_</div>}
                            </div>
                        </>
                   ) : (
                       <div className="flex-1 flex flex-col bg-slate-950/50">
                           <div className="flex-1 overflow-y-auto p-4 space-y-4">
                               {sessionAssets.length === 0 && (
                                   <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-2">
                                       <LayoutGrid className="w-12 h-12" />
                                       <p className="font-mono text-xs uppercase">No Active Session Data</p>
                                   </div>
                               )}

                               {sessionAssets.map((item) => (
                                   <div key={item.id} className="bg-slate-950 border border-slate-800 p-3 flex gap-3 animate-[fadeIn_0.5s_ease-out] hover:border-slate-700 transition-colors rounded">
                                       <div className="w-1/3 relative group bg-black flex items-center justify-center rounded overflow-hidden aspect-video">
                                           <img src={item.url} alt="Gen" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenAsset({url: item.url, type: item.type})} />
                                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                               <button onClick={() => setFullScreenAsset({url: item.url, type: item.type})} className="text-white hover:text-cyan-400"><Maximize2 className="w-4 h-4" /></button>
                                               <button onClick={() => { const a = document.createElement('a'); a.href = item.url; a.download = `solberus_${item.id}.png`; a.click(); }} className="text-white hover:text-cyan-400"><Download className="w-4 h-4" /></button>
                                           </div>
                                       </div>
                                       <div className="w-2/3 flex flex-col justify-between">
                                           <div>
                                               <div className="flex justify-between text-[9px] font-mono mb-1">
                                                   <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                               </div>
                                               <p className="text-[10px] font-mono text-slate-300 leading-tight bg-slate-900/50 p-1.5 border border-slate-800 rounded line-clamp-3 hover:line-clamp-none transition-all">{item.prompt}</p>
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
          </div>
      </div>
    </div>
  );
};
