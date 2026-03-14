
import React, { useState } from 'react';
import { CyberButton, CyberTextArea, SectionTitle, LoadingScan } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { ModelType, FeatureMode } from '../types';
import { Sparkles, ArrowRight, Copy, Zap, FileInput, ScanLine, Dna, Flame, CopyPlus, Wand2, RefreshCw } from 'lucide-react';

// The "God Tier" 3D Render DNA
const ULTRA_OCTANE_DNA = ", Octane Render, Unreal Engine 5.4, Path Tracing, Nanite Geometry, Lumen Global Illumination, 8K UHD, 32k texture resolution, hyper-maximalist, subsurface scattering, volumetric atmospherics, cinematic post-processing, color graded, masterpiece, trending on ArtStation, ISO 100, f/1.8";

type ProcessingMode = 'STANDARD' | 'DEEP' | 'MULTIPLY';

export const IntelligenceModule = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [dnaOptions, setDnaOptions] = useState<{name: string, dna: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('READY FOR INPUT');
  const [detectedMode, setDetectedMode] = useState<'SINGLE' | 'BATCH' | null>(null);
  
  // 3-Way Mode State
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('STANDARD');

  const handleEnhance = async () => {
    if (!input.trim()) return;
    setLoading(true);
    
    // Status Update based on Mode
    if (processingMode === 'MULTIPLY') setStatus('ENGAGING INFINITY MULTIPLIER...');
    else if (processingMode === 'DEEP') setStatus('ENGAGING CINEMATIC OVERDRIVE...');
    else setStatus('INITIALIZING OPTIC-PRIME AGENT...');

    setOutput('');
    setDnaOptions([]);

    try {
      // LOGIC SWITCH: Standard vs Deep vs Multiply
      let processingLogic = "";

      if (processingMode === 'MULTIPLY') {
          // --- MULTIPLIER LOGIC ---
          processingLogic = `
          3. **EXPANSION & MULTIPLICATION (CRITICAL)**: 
             - You are NOT just rewriting the prompt. You are a **SCENE GENERATOR**.
             - For every input item, identify its **THEME/GENRE** (e.g. Cyberpunk, Horror, Nature).
             - **ACTION:** Generate a **COMPLETELY NEW SCENE** that fits that same universe but depicts a DIFFERENT subject, angle, or event.
             - **EXAMPLE:**
               - Input: "A samurai standing in snow."
               - Output: "A close-up of a katana blade resting on a wooden rack inside a dojo, candlelight flickering against the steel, dust motes dancing in the air, cinematic depth of field." (Same theme, totally new image).
             - **REQUIREMENT:** The output must be 8K, highly detailed, and completely distinct from the input description, but thematically linked.
          `;
      } else if (processingMode === 'DEEP') {
          // --- DEEP ENHANCE LOGIC ---
          processingLogic = `
          3. EVALUATION & PROCESSING (Per Item):
             - **FORCE UPGRADE**: You must rewrite EVERY single item into a "Mega-Prompt".
             - INJECT: Cinematic lighting (Rembrandt, Split, Volumetric), Camera Gear (Arri Alexa, 35mm, Anamorphic), and Texture Details (8K, porous skin, rust, grime, imperceptible details).
             - ATMOSPHERE: Add depth cues (dust particles, fog, bokeh, heat haze).
             - TONE: Intense, dramatic, hyper-realistic.
             - Do NOT preserve simple wording. Expand significantly for visual depth and mood.
          `;
      } else {
          // --- STANDARD LOGIC ---
          processingLogic = `
          3. EVALUATION & PROCESSING (Per Item):
             - IF item is < 15 words or vague: REWRITE it into a high-fidelity, photorealistic prompt (8K, lighting, texture).
             - IF item is detailed, specific, or technical: **PRESERVE IT EXACTLY**. Do not change a single adjective. ONLY fix the formatting/spacing.
          `;
      }

      // THE BRAIN: Advanced Logic for Lossless Processing
      const systemInstruction = `You are "OPTIC-PRIME", the Solberus-VX Prompt Architect.
      
      MISSION: BATCH NORMALIZATION & UPGRADE
      
      INPUT ANALYSIS:
      The user will provide text that may contain:
      - Numbered lists (1., 2., 01))
      - Bullet points (-, *, •)
      - Mixed spacing (single lines, double lines)
      - Mixed quality (some "dog in car", some "8k octane render...")
      
      EXECUTION STEPS:
      1. SEGMENTATION: Identify every distinct image idea/prompt.
      2. CLEANING: Remove ALL list markers (numbers, bullets) and leading/trailing whitespace.
      ${processingLogic}
      4. FORMATTING: Join the processed items with exactly TWO NEWLINES (\\n\\n) between them.
      
      5. DNA GENERATION:
         - Generate 3 DISTINCT "Consistency Protocol" (DNA) strings based on the subject matter.
         - Option 1: Photorealistic / Cinematic (Film look).
         - Option 2: Digital Art / Stylized.
         - Option 3: High-End 3D Render (Context-specific to the prompt).
         - These should be appendable suffixes.
      
      OUTPUT FORMAT (STRICT):
      ---PROMPTS_START---
      [Item 1]
      
      [Item 2]
      
      [Item 3]
      ---PROMPTS_END---
      ---DNA_START---
      1. [NAME_1]: [DNA_STRING_1]
      2. [NAME_2]: [DNA_STRING_2]
      3. [NAME_3]: [DNA_STRING_3]
      ---DNA_END---`;

      setStatus('ANALYZING STRUCTURE...');
      
      // Use Pro for complex reasoning
      const result = await geminiService.generateText(
          ModelType.PRO, 
          input, 
          systemInstruction, 
          0, 
          false
      );
      
      const rawText = result.text || "";

      setStatus('PARSING DNA SEQUENCE...');

      // Regex Parsing to separate Prompts from DNA options
      const promptMatch = rawText.match(/---PROMPTS_START---([\s\S]*?)---PROMPTS_END---/);
      const dnaMatch = rawText.match(/---DNA_START---([\s\S]*?)---DNA_END---/);

      if (promptMatch) {
          const cleanOutput = promptMatch[1].trim();
          setOutput(cleanOutput);
          
          // Detect mode based on output structure
          const count = cleanOutput.split(/\n\s*\n/).length;
          setDetectedMode(count > 1 ? 'BATCH' : 'SINGLE');
      } else {
          setOutput(rawText);
      }

      const generatedDna: {name: string, dna: string}[] = [];

      if (dnaMatch) {
          const dnaLines = dnaMatch[1].trim().split('\n');
          dnaLines.forEach(line => {
              // Matches format: "1. [NAME]: DNA_STRING"
              const match = line.match(/\d+\.\s*\[(.*?)\]:\s*(.*)/);
              if (match) {
                  generatedDna.push({ name: match[1], dna: match[2] });
              }
          });
      }

      // INJECT THE "SOLBERUS PRIME" ULTRA OPTION
      generatedDna.push({
          name: "SOLBERUS PRIME (ULTRA 3D)",
          dna: ULTRA_OCTANE_DNA
      });

      setDnaOptions(generatedDna);

    } catch (e: any) {
      setOutput(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
      setStatus('READY');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("COPIED TO CLIPBOARD");
  };

  const transmitToVisuals = () => {
      if (!output) return;
      
      // Trigger global event handled by App.tsx and VisualModule.tsx
      const event = new CustomEvent('solberus-link', {
          detail: {
              target: FeatureMode.VISUALS,
              payload: output // Sends the corrected batch list
          }
      });
      window.dispatchEvent(event);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle 
        icon={Sparkles} 
        title="Prompt Correcter" 
        subtitle="Batch Optimization & DNA Synthesis" 
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* Input Side */}
          <div className="w-1/3 flex flex-col gap-4">
              <div className="bg-slate-900/50 p-4 border border-slate-800 flex-1 flex flex-col relative group rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-mono text-cyan-500 flex items-center gap-2 font-bold">
                          <FileInput className="w-4 h-4" /> RAW BATCH INPUT
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">SUPPORTS MULTI-LINE</span>
                  </div>
                  <CyberTextArea 
                    value={input}
                    onChange={(e: any) => setInput(e.target.value)}
                    placeholder={`PASTE PROMPTS HERE (BATCH SUPPORTED)

Example Input:
1. A red cyber truck in rain
- A blue cyber truck in desert
• A green cyber truck in snow

MODES:
[STANDARD]: Fixes format, preserves details.
[DEEP]: Rewrites into 8K cinematic descriptions.
[MULTIPLY]: Generates NEW scene ideas based on the input themes (Spinoffs).`}
                    className="flex-1 resize-none h-full font-mono text-sm leading-relaxed p-4 bg-slate-950/50 focus:bg-slate-950 transition-colors border-slate-700"
                  />
                  
                  {/* 3-WAY MODE SELECTOR */}
                  <div className="mt-4 mb-2 grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                      <button 
                        onClick={() => setProcessingMode('STANDARD')}
                        className={`text-[9px] font-mono font-bold py-2 rounded flex flex-col items-center justify-center gap-1 transition-all ${processingMode === 'STANDARD' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                      >
                          <RefreshCw className="w-3 h-3" />
                          STANDARD
                      </button>
                      
                      <button 
                        onClick={() => setProcessingMode('DEEP')}
                        className={`text-[9px] font-mono font-bold py-2 rounded flex flex-col items-center justify-center gap-1 transition-all ${processingMode === 'DEEP' ? 'bg-purple-900/30 text-purple-400' : 'text-slate-500 hover:text-white'}`}
                      >
                          <Flame className="w-3 h-3" />
                          DEEP UPGRADE
                      </button>
                      
                      <button 
                        onClick={() => setProcessingMode('MULTIPLY')}
                        className={`text-[9px] font-mono font-bold py-2 rounded flex flex-col items-center justify-center gap-1 transition-all ${processingMode === 'MULTIPLY' ? 'bg-amber-900/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-white'}`}
                      >
                          <CopyPlus className="w-3 h-3" />
                          MULTIPLY (NEW)
                      </button>
                  </div>

                  {/* Mode Description Text */}
                  <div className="mb-2 text-[9px] font-mono text-center">
                      {processingMode === 'STANDARD' && <span className="text-cyan-600">PRESERVES DETAILS. FIXES FORMATTING.</span>}
                      {processingMode === 'DEEP' && <span className="text-purple-600">REWRITES EVERYTHING TO 8K CINEMATIC.</span>}
                      {processingMode === 'MULTIPLY' && <span className="text-amber-600">GENERATES NEW SCENES FROM SAME THEMES.</span>}
                  </div>

                  <div>
                      <CyberButton onClick={handleEnhance} disabled={loading || !input.trim()} variant={processingMode === 'MULTIPLY' ? 'secondary' : processingMode === 'DEEP' ? 'primary' : 'solana'} className={`w-full py-4 shadow-[0_0_15px_rgba(0,255,157,0.1)] ${processingMode === 'MULTIPLY' ? 'border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-black' : processingMode === 'DEEP' ? 'border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white' : ''}`}>
                          {loading ? "PROCESSING..." : processingMode === 'MULTIPLY' ? "MULTIPLY & EXPAND" : processingMode === 'DEEP' ? "ENHANCE & REWRITE" : "CORRECT & SYNTHESIZE"} <ArrowRight className="w-4 h-4 ml-2" />
                      </CyberButton>
                  </div>
              </div>
          </div>

          {/* Output Side */}
          <div className="w-2/3 flex flex-col gap-4">
               {/* Corrected Prompts */}
               <div className="bg-slate-900/50 p-4 border border-slate-800 flex-1 flex flex-col relative overflow-hidden rounded-lg min-h-[50%]">
                   <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-3">
                           <label className="text-xs font-mono text-purple-400 flex items-center gap-2 font-bold">
                               <ScanLine className="w-4 h-4" /> OPTIMIZED OUTPUT
                           </label>
                           {detectedMode && (
                               <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${detectedMode === 'BATCH' ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                                   {detectedMode} MODE DETECTED
                               </span>
                           )}
                       </div>
                       
                       {output && (
                           <div className="flex gap-2">
                               <button onClick={() => copyToClipboard(output)} className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-300 flex items-center gap-1 transition-colors">
                                   <Copy className="w-3 h-3" /> COPY BATCH
                               </button>
                               <button onClick={transmitToVisuals} className="text-[10px] font-bold font-mono bg-cyan-900/50 hover:bg-cyan-500 border border-cyan-500/50 px-3 py-1.5 rounded text-cyan-400 hover:text-black flex items-center gap-1 animate-pulse transition-all">
                                   <Zap className="w-3 h-3" /> TRANSMIT TO VISUALS
                               </button>
                           </div>
                       )}
                   </div>
                   
                   <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-700 p-4 font-mono text-sm text-slate-300 relative rounded">
                       {loading ? (
                           <LoadingScan text={status} />
                       ) : (
                           output ? (
                               <textarea 
                                  readOnly 
                                  value={output} 
                                  className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-slate-300 font-mono leading-relaxed whitespace-pre-wrap"
                               />
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                   <Sparkles className="w-12 h-12 mb-2" />
                                   <span className="text-xs font-mono">AWAITING INPUT DATA</span>
                               </div>
                           )
                       )}
                   </div>
               </div>

               {/* DNA Options */}
               {dnaOptions.length > 0 && (
                   <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex flex-col gap-3 animate-[fadeIn_0.5s]">
                       <div className="flex justify-between items-center">
                           <label className="text-xs font-mono text-green-400 flex items-center gap-2 font-bold">
                               <Dna className="w-4 h-4" /> SUGGESTED CONSISTENCY PROTOCOLS (DNA)
                           </label>
                           <span className="text-[9px] font-mono text-slate-500">COPY & PASTE INTO VISUAL MODULE 'DNA' FIELD</span>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-2">
                           {dnaOptions.map((opt, idx) => (
                               <div key={idx} className={`flex items-center gap-3 bg-slate-950 border p-3 rounded hover:border-green-500 transition-colors group ${opt.name.includes('ULTRA 3D') ? 'border-purple-900/50 bg-purple-950/10' : 'border-slate-700'}`}>
                                   <div className="flex flex-col w-32 shrink-0">
                                       <span className="text-[10px] font-mono text-slate-500">OPTION 0{idx+1}</span>
                                       <span className={`text-xs font-bold uppercase ${opt.name.includes('ULTRA 3D') ? 'text-purple-400' : 'text-white'}`}>{opt.name}</span>
                                   </div>
                                   <div className="flex-1 text-[10px] font-mono text-slate-400 border-l border-slate-800 pl-3 italic truncate">
                                       {opt.dna}
                                   </div>
                                   <button 
                                      onClick={() => copyToClipboard(opt.dna)}
                                      className="text-slate-500 hover:text-green-400 bg-slate-900 p-2 rounded hover:bg-green-900/30 transition-all"
                                      title="Copy DNA"
                                   >
                                       <Copy className="w-4 h-4" />
                                   </button>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
          </div>
      </div>
    </div>
  );
};
