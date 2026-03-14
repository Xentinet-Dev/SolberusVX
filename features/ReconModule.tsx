
import React, { useState, useRef, useEffect } from 'react';
import { CyberButton, SectionTitle, LoadingScan } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { storageService, ReconReport } from '../services/storageService';
import { ModelType } from '../types';
import { Search, Video, Mic, Upload, BrainCircuit, MessageSquare, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ReconModule = () => {
  const [subMode, setSubMode] = useState<'ANALYZE_IMG' | 'ANALYZE_VID' | 'TRANSCRIBE' | 'OBJECT_DETECT' | 'SENTIMENT'>('ANALYZE_IMG');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('PROCESSING...');
  const [result, setResult] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{data: string, mimeType: string} | null>(null);
  const [reports, setReports] = useState<ReconReport[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storageService.getReconReports().then(setReports);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setUploadedFile({ data: base64Data, mimeType: file.type });
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) { alert("INPUT ERROR: SOURCE MEDIA REQUIRED"); return; }
    setLoading(true);
    setResult('');
    
    try {
        let model = ModelType.PRO;
        let prompt = "";

        switch (subMode) {
            case 'ANALYZE_IMG':
                setStatusMsg("SCANNING IMAGE DATA...");
                prompt = "Analyze this image in extreme detail. Identify threats, anomalies, and key features.";
                break;
            case 'ANALYZE_VID':
                setStatusMsg("DECODING VIDEO STREAM...");
                prompt = "Analyze this video clip. Provide a timestamped log of key events.";
                break;
            case 'TRANSCRIBE':
                model = ModelType.FLASH;
                setStatusMsg("PROCESSING AUDIO WAVEFORM...");
                prompt = "Transcribe this audio file verbatim.";
                break;
            case 'OBJECT_DETECT':
                setStatusMsg("DETECTING OBJECTS...");
                model = ModelType.PRO;
                prompt = "Detect and list all distinct objects in this media. Provide bounding box estimates if possible (e.g., [ymin, xmin, ymax, xmax] object_name).";
                break;
            case 'SENTIMENT':
                setStatusMsg("ANALYZING SENTIMENT...");
                model = ModelType.FLASH; // Fast text/audio analysis
                prompt = "Analyze the sentiment of the speakers or text in this media. Classify as Positive, Negative, or Neutral and explain why.";
                break;
        }

        const text = await geminiService.analyzeMedia(prompt, uploadedFile.data, uploadedFile.mimeType, model);
        setResult(text || "No data returned.");

    } catch (e: any) { setResult(`Error: ${e.message}`); } 
    finally { setLoading(false); }
  };

  const saveReport = async () => {
      if (!result) return;
      const report: ReconReport = {
          id: crypto.randomUUID(),
          type: subMode === 'TRANSCRIBE' || subMode === 'SENTIMENT' ? 'audio' : subMode === 'ANALYZE_VID' ? 'video' : 'image',
          result: result,
          timestamp: Date.now()
      };
      await storageService.saveReconReport(report);
      setReports(await storageService.getReconReports());
      alert("REPORT SAVED TO DATABASE");
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Search} title="Media Analyzer" subtitle="Deep Reconnaissance" />

      <div className="grid grid-cols-5 gap-2 mb-6">
        {[
          { id: 'ANALYZE_IMG', label: 'Image Scan', icon: Search },
          { id: 'ANALYZE_VID', label: 'Video Scan', icon: Video },
          { id: 'TRANSCRIBE', label: 'Transcribe', icon: Mic },
          { id: 'OBJECT_DETECT', label: 'Obj. Detect', icon: BrainCircuit },
          { id: 'SENTIMENT', label: 'Sentiment', icon: MessageSquare },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => { setSubMode(m.id as any); setUploadedFile(null); setPreview(null); setResult(''); }}
            className={`p-2 border flex flex-col items-center justify-center gap-1 transition-all ${
              subMode === m.id ? 'bg-green-900/30 border-green-400 text-green-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
          >
            <m.icon className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold tracking-wider">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Input Column */}
        <div className="w-1/3 flex flex-col gap-4">
            <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded p-4 flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadedFile ? 'border-green-500 bg-green-900/10' : 'border-slate-700 hover:border-green-500'}`}>
                <Upload className={`w-8 h-8 mb-2 ${uploadedFile ? 'text-green-500' : 'text-slate-500'}`} />
                <span className="font-mono text-xs text-slate-400">{uploadedFile ? "MEDIA LOADED" : "UPLOAD SOURCE"}</span>
                <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept={subMode === 'TRANSCRIBE' || subMode === 'SENTIMENT' ? 'audio/*,video/*' : subMode === 'ANALYZE_VID' ? 'video/*' : 'image/*'} />
            </div>

            {preview && (
                <div className="h-40 bg-black border border-slate-700 flex items-center justify-center overflow-hidden">
                    {uploadedFile?.mimeType.startsWith('image') && <img src={preview} className="h-full object-contain" />}
                    {uploadedFile?.mimeType.startsWith('video') && <video src={preview} controls className="h-full" />}
                    {uploadedFile?.mimeType.startsWith('audio') && <div className="text-green-500 font-mono text-xs">AUDIO WAVEFORM LOADED</div>}
                </div>
            )}

            <CyberButton onClick={handleAnalyze} disabled={loading || !uploadedFile} variant="solana">
                {loading ? "SCANNING..." : "EXECUTE ANALYSIS"}
            </CyberButton>
        </div>

        {/* Output Column */}
        <div className="w-1/3 flex flex-col bg-slate-900 border border-slate-800">
             <div className="p-2 border-b border-slate-800 flex justify-between items-center">
                 <span className="text-xs font-mono text-slate-500">INTELLIGENCE OUTPUT</span>
                 {result && <button onClick={saveReport} className="text-green-500 hover:text-white"><Save className="w-4 h-4" /></button>}
             </div>
             <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-slate-300">
                 {loading ? <LoadingScan text={statusMsg} /> : (result ? <ReactMarkdown>{result}</ReactMarkdown> : <div className="text-slate-600 text-center mt-10">NO DATA GENERATED</div>)}
             </div>
        </div>

        {/* History Column */}
        <div className="w-1/3 bg-slate-950/30 border border-slate-800 flex flex-col">
            <div className="p-2 border-b border-slate-800 text-xs font-mono text-green-500">SAVED REPORTS</div>
            <div className="flex-1 overflow-y-auto">
                {reports.map(r => (
                    <div key={r.id} className="p-3 border-b border-slate-800 hover:bg-slate-900 cursor-pointer" onClick={() => setResult(r.result)}>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                            <span className="text-green-400">{r.type.toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono line-clamp-2">{r.result}</div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
