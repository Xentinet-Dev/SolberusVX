
import React, { useState, useRef } from 'react';
import { SectionTitle, CyberButton, CyberTextArea, LoadingScan } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { UI_ARCHITECT_MODES } from '../constants';
import { Layout, Image as ImageIcon, Upload, RefreshCw, X, ArrowRight, FileText, CheckCircle, Maximize2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const UIArchitectModule = () => {
  // Input State
  const [sourceImage, setSourceImage] = useState<{data: string, mimeType: string} | null>(null);
  const [refImage, setRefImage] = useState<{data: string, mimeType: string} | null>(null);
  const [mode, setMode] = useState(UI_ARCHITECT_MODES[0].id);
  const [stylePrompt, setStylePrompt] = useState("");
  
  // Execution State
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'SOURCE' | 'REF') => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          const imgData = { data: base64Data, mimeType: file.type };
          
          if (target === 'SOURCE') setSourceImage(imgData);
          else setRefImage(imgData);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const executeArchitect = async () => {
      if (!sourceImage) return alert("SOURCE SCREENSHOT REQUIRED");
      
      setLoading(true);
      setProgressMsg("ANALYZING UI STRUCTURE...");
      setAnalysisText("");
      setMockupUrl(null);

      try {
          // Phase 1 & 2 combined in service
          const result = await geminiService.runUIArchitect(
              sourceImage, 
              mode, 
              refImage || undefined, 
              stylePrompt
          );

          setAnalysisText(result.analysis);
          setProgressMsg("SYNTHESIZING MOCKUP...");
          
          if (result.mockupUrl) {
              setMockupUrl(result.mockupUrl);
          }

      } catch (e: any) {
          setAnalysisText(`ERROR: ${e.message}`);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Layout} title="UI Architect" subtitle="Visual Deconstruction Engine" />

      {fullScreen && mockupUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setFullScreen(false)}>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-8 h-8" /></button>
            <img src={mockupUrl} alt="Mockup Full" className="max-w-[95vw] max-h-[95vh] object-contain border border-slate-700 shadow-2xl" />
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden animate-[fadeIn_0.5s]">
          
          {/* LEFT: INPUT CONSOLE */}
          <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
              
              {/* 1. Source Upload */}
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                  <label className="text-[10px] font-mono text-cyan-500 font-bold uppercase flex items-center gap-1 mb-2">
                      <Layout className="w-3 h-3" /> 1. SOURCE SCREENSHOT (REQUIRED)
                  </label>
                  
                  <div 
                      onClick={() => sourceInputRef.current?.click()}
                      className={`aspect-video border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${sourceImage ? 'border-cyan-500' : 'border-slate-700 hover:border-cyan-500 bg-black/20'}`}
                  >
                      {sourceImage ? (
                          <>
                              <img src={`data:${sourceImage.mimeType};base64,${sourceImage.data}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="bg-black/70 text-white text-[9px] px-2 py-1 rounded">CHANGE IMAGE</span>
                              </div>
                              <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500 text-green-400 p-1 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                              </div>
                          </>
                      ) : (
                          <>
                              <Upload className="w-6 h-6 text-slate-600 mb-2 group-hover:text-cyan-500" />
                              <span className="text-[9px] text-slate-500 font-mono group-hover:text-cyan-400">UPLOAD UI IMAGE</span>
                          </>
                      )}
                  </div>
                  <input type="file" ref={sourceInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'SOURCE')} />
              </div>

              {/* 2. Mode Select */}
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                  <label className="text-[10px] font-mono text-purple-400 font-bold uppercase flex items-center gap-1 mb-2">
                      <RefreshCw className="w-3 h-3" /> 2. REDESIGN MODE
                  </label>
                  <div className="space-y-1">
                      {UI_ARCHITECT_MODES.map(m => (
                          <button
                              key={m.id}
                              onClick={() => setMode(m.id)}
                              className={`w-full text-left p-2 border rounded flex flex-col gap-1 transition-all ${mode === m.id ? 'bg-purple-950/30 border-purple-500 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                          >
                              <span className="text-[10px] font-bold font-mono">{m.label}</span>
                              <span className="text-[9px] font-mono opacity-70">{m.desc}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* 3. Custom Ref (Conditional) */}
              <div className={`bg-slate-900/50 border border-slate-800 p-4 rounded-lg transition-all ${mode === 'custom_reference' ? 'opacity-100' : 'opacity-50 grayscale pointer-events-none'}`}>
                  <label className="text-[10px] font-mono text-amber-500 font-bold uppercase flex items-center gap-1 mb-2">
                      <ImageIcon className="w-3 h-3" /> 3. CUSTOM REFERENCE (OPTIONAL)
                  </label>
                  
                  <div className="flex gap-2 mb-3">
                       <div 
                          onClick={() => refInputRef.current?.click()}
                          className={`w-24 h-16 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${refImage ? 'border-amber-500' : 'border-slate-700 hover:border-amber-500 bg-black/20'}`}
                      >
                          {refImage ? (
                              <img src={`data:${refImage.mimeType};base64,${refImage.data}`} className="w-full h-full object-cover" />
                          ) : (
                              <Upload className="w-4 h-4 text-slate-600" />
                          )}
                       </div>
                       <input type="file" ref={refInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'REF')} />
                       
                       <div className="flex-1">
                           <CyberTextArea 
                              value={stylePrompt}
                              onChange={(e: any) => setStylePrompt(e.target.value)}
                              placeholder='Describe target style (e.g. "Cyberpunk city vibes, dark mode")'
                              className="h-full text-[10px] leading-tight"
                           />
                       </div>
                  </div>
              </div>

              <CyberButton onClick={executeArchitect} disabled={loading} variant="solana" className="w-full py-4 mt-auto">
                  {loading ? "ARCHITECTING..." : "INITIATE ARCHITECT"} <ArrowRight className="w-4 h-4 ml-2" />
              </CyberButton>

          </div>

          {/* RIGHT: OUTPUT DISPLAY */}
          <div className="w-2/3 flex flex-col gap-4">
              
              {/* Output Tabs/Header */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                   <div className="flex gap-4 text-xs font-mono font-bold text-slate-400">
                       <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-500" /> BLUEPRINT ANALYSIS</span>
                       <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-500" /> VISUAL SYNTHESIS</span>
                   </div>
                   {mockupUrl && (
                       <div className="flex gap-2">
                           <button onClick={() => { const a = document.createElement('a'); a.href = mockupUrl; a.download = `ui_architect_mockup.png`; a.click(); }} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded"><Download className="w-4 h-4" /></button>
                           <button onClick={() => setFullScreen(true)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded"><Maximize2 className="w-4 h-4" /></button>
                       </div>
                   )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex gap-4 overflow-hidden">
                   
                   {/* Analysis Column */}
                   <div className="w-1/2 bg-slate-950/50 border border-slate-800 rounded-lg p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar">
                       {loading && !analysisText ? (
                           <LoadingScan text={progressMsg} />
                       ) : analysisText ? (
                           <ReactMarkdown components={{
                               h1: ({node, ...props}) => <h1 className="text-lg font-bold text-cyan-400 mb-2 border-b border-cyan-900/50 pb-1" {...props} />,
                               h2: ({node, ...props}) => <h2 className="text-sm font-bold text-white mt-4 mb-2" {...props} />,
                               strong: ({node, ...props}) => <strong className="text-cyan-200" {...props} />,
                               ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-1 text-slate-400" {...props} />
                           }}>
                               {analysisText}
                           </ReactMarkdown>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-2">
                               <FileText className="w-12 h-12" />
                               <p className="text-center">Awaiting Analysis Data</p>
                           </div>
                       )}
                   </div>

                   {/* Visual Column */}
                   <div className="w-1/2 bg-black border border-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center">
                       {mockupUrl ? (
                           <img src={mockupUrl} className="max-w-full max-h-full object-contain" />
                       ) : loading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-mono text-purple-500 animate-pulse">{progressMsg}</span>
                            </div>
                       ) : (
                           <div className="flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-2">
                               <Layout className="w-16 h-16" />
                               <p className="font-mono text-xs uppercase">No Mockup Generated</p>
                           </div>
                       )}
                   </div>

              </div>
          </div>

      </div>
    </div>
  );
};
