
import React, { useState, useRef, useEffect } from 'react';
import { CyberButton, CyberInput, CyberTextArea, SectionTitle, LoadingScan } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { storageService, StoredAsset } from '../services/storageService';
import { ASPECT_RATIOS, IMAGE_SIZES, GENERATION_THEMES, OCTANE_DNA, OCTANE_LENSES, OCTANE_APERTURES, OCTANE_LIGHTING, OCTANE_FILM_STOCKS, OCTANE_MATERIALS } from '../constants';
import { Image as ImageIcon, Video, Wand2, Upload, Trash2, Download, OctagonX, X, Copy, Calendar, Maximize2, RefreshCw, Zap, Move, FastForward, ListOrdered, Dna, Lock, Plus, CheckCircle, Box, Monitor, Sparkles, Settings2, Grid3X3, Sun, Camera, Aperture, Layers, RotateCcw } from 'lucide-react';
import { OctaneRenderSettings } from '../types';

export const VisualModule = () => {
  const [subMode, setSubMode] = useState<'GEN_IMG' | 'GEN_OCTANE' | 'GEN_TEXTURE' | 'EDIT_IMG' | 'GEN_VIDEO' | 'IMG_TO_VIDEO'>('GEN_IMG');
  const [promptInput, setPromptInput] = useState('');
  const [scenePromptInput, setScenePromptInput] = useState('');
  const [styleDNA, setStyleDNA] = useState(''); // New Consistency Control
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('PROCESSING...');
  const [uplinkSuccess, setUplinkSuccess] = useState(false);
  
  // Gallery State
  const [gallery, setGallery] = useState<StoredAsset[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'image' | 'video'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Full Screen State
  const [fullScreenAsset, setFullScreenAsset] = useState<{url: string, type: 'image' | 'video'} | null>(null);

  // Generation Settings
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("16:9");
  const [selectedSize, setSelectedSize] = useState<"1K"|"2K"|"4K">("1K");
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);

  // Octane Kernel Settings (Virtual Camera)
  const [showKernelSettings, setShowKernelSettings] = useState(false);
  const [activeKernelTab, setActiveKernelTab] = useState<'MATERIAL' | 'LENS' | 'APERTURE' | 'LIGHTING' | 'FILM'>('MATERIAL');
  const [octaneSettings, setOctaneSettings] = useState<OctaneRenderSettings>({
      lens: OCTANE_LENSES[0].value, 
      aperture: OCTANE_APERTURES[2].value, 
      lighting: OCTANE_LIGHTING[1].value, 
      filmStock: OCTANE_FILM_STOCKS[4].value, 
      material: OCTANE_MATERIALS[9].value, // Standard/None
      spectral: false
  });

  // Video Specific Settings
  const [videoResolution, setVideoResolution] = useState<"720p" | "1080p">("720p");
  const [motionIntensity, setMotionIntensity] = useState<"Low" | "Standard" | "High">("Standard");
  const [extendDuration, setExtendDuration] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedImages, setUploadedImages] = useState<{data: string, mimeType: string}[]>([]);
  const [uploadedEndFrame, setUploadedEndFrame] = useState<{data: string, mimeType: string} | null>(null);
  const abortRef = useRef(false);

  // Batch Logic: Enhanced to detect double-newlines as separators for paragraph-based prompts
  const hasDoubleNewlines = promptInput.includes('\n\n');
  const validPrompts = hasDoubleNewlines 
      ? promptInput.split(/\n\s*\n/).filter(p => p.trim() !== '') 
      : promptInput.split('\n').filter(p => p.trim() !== '');

  const isBatchMode = validPrompts.length > 1;

  // Load Gallery on Mount or Refresh
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const assets = await storageService.getAssets();
        setGallery(assets);
      } catch (e) {
        console.error("Failed to load gallery", e);
      }
    };
    loadGallery();
  }, [refreshTrigger]);

  // Listen for Uplink Events from Intelligence Module
  useEffect(() => {
      const handleUplink = (e: any) => {
          if (e.detail && e.detail.payload) {
              setSubMode('GEN_IMG');
              setPromptInput(e.detail.payload);
              setUplinkSuccess(true);
              setTimeout(() => setUplinkSuccess(false), 3000); // Reset after 3s
          }
      };
      window.addEventListener('solberus-link', handleUplink);
      return () => window.removeEventListener('solberus-link', handleUplink);
  }, []);

  const handleNewSession = () => {
      setPromptInput('');
      setScenePromptInput('');
      setStyleDNA('');
      setUploadedImages([]);
      setUploadedEndFrame(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEndFrame: boolean = false) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    if (isEndFrame) {
         if (!files[0]) return;
         const reader = new FileReader();
         reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            setUploadedEndFrame({ data: base64Data, mimeType: files[0].type });
         };
         reader.readAsDataURL(files[0]);
    } else {
        // Limit to 10 images max for references
        const remainingSlots = 10 - uploadedImages.length;
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
            if (subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE') {
                setUploadedImages(prev => [...prev, ...newImages]);
            } else {
                // For video/edit, usually 1 image is handled, but let's just replace
                setUploadedImages(newImages.slice(0, 1)); 
            }
        });
    }
    
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStop = () => {
    abortRef.current = true;
    setProgressMsg("EMERGENCY STOP INITIATED...");
  };

  const saveToGallery = async (asset: Omit<StoredAsset, 'id' | 'timestamp'>) => {
    const newAsset: StoredAsset = {
      ...asset,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tags: asset.tags || []
    };
    await storageService.saveAsset(newAsset);
    setRefreshTrigger(prev => prev + 1);
    // Notify other persistent modules
    window.dispatchEvent(new Event('solberus-storage-update'));
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm("Delete this asset permanently?")) {
      await storageService.deleteAsset(id);
      setRefreshTrigger(prev => prev + 1);
      window.dispatchEvent(new Event('solberus-storage-update'));
    }
  };

  // --- NEURAL REFINEMENT LOGIC ---
  const handleRefine = async (asset: StoredAsset) => {
      if (loading) return;
      if (asset.type !== 'image') return alert("Only images can be refined.");
      
      setLoading(true);
      abortRef.current = false;
      setProgressMsg("NEURAL UPLINK: DENOISING & UPSCALING...");

      try {
          const [header, base64Data] = asset.url.split(',');
          const mimeType = header.split(':')[1].split(';')[0];

          const refinedUrl = await geminiService.refineVisualAsset(base64Data, mimeType, asset.prompt);
          
          if (refinedUrl) {
              await saveToGallery({
                  type: 'image',
                  url: refinedUrl,
                  prompt: asset.prompt,
                  theme: asset.theme,
                  tags: [...(asset.tags || []), 'REFINED_4K']
              });
          } else {
              throw new Error("Refinement returned empty data");
          }
          setLoading(false);
      } catch (e: any) {
          setLoading(false);
          alert(`Refinement Failed: ${e.message}`);
      }
  };

  const handleRegenerate = async (asset: StoredAsset) => {
    if (loading) return;
    setLoading(true);
    abortRef.current = false;
    setProgressMsg("REGENERATING...");

    try {
        if (asset.type === 'image') {
             const theme = GENERATION_THEMES[selectedThemeIndex];
             const sceneContext = scenePromptInput.trim() ? `${scenePromptInput}` : "";
             const dna = asset.tags?.includes('OCTANE') ? `${OCTANE_DNA} ${styleDNA}` : styleDNA.trim();
             
             // Construct Prompt - Pass components separately for Architect
             const images = await geminiService.generateImage(
                 `${asset.prompt} ${sceneContext}`, 
                 selectedSize, 
                 selectedAspectRatio, 
                 uploadedImages,
                 "gemini-3-pro-image-preview",
                 dna,
                 theme.value,
                 subMode === 'GEN_OCTANE' ? octaneSettings : undefined,
                 subMode === 'GEN_TEXTURE'
             );
             if (images.length > 0) {
                 await saveToGallery({ 
                     type: 'image', 
                     url: images[0], 
                     prompt: asset.prompt, 
                     theme: theme.label, 
                     tags: asset.tags || [] 
                 });
             }
        } else if (asset.type === 'video') {
             const videoUrl = await geminiService.generateVideo(asset.prompt, selectedAspectRatio as any, undefined, (status) => setProgressMsg(status), () => abortRef.current, videoResolution);
             await saveToGallery({ type: 'video', url: videoUrl, prompt: asset.prompt, tags: [] });
        }
        setLoading(false);
    } catch (e: any) {
        setLoading(false);
        alert(e.message);
    }
  };

  const handleExecute = async () => {
    const hasPrompt = promptInput.trim().length > 0;
    
    if (!hasPrompt && subMode !== 'IMG_TO_VIDEO') {
        alert("INPUT ERROR: PROMPT REQUIRED");
        return;
    }

    setLoading(true);
    abortRef.current = false;
    setProgressMsg("INITIALIZING...");

    try {
      const prompts = validPrompts.length > 0 ? validPrompts : ["Animate this visual"];
      const sceneContext = scenePromptInput.trim() ? `${scenePromptInput}` : "";
      const theme = GENERATION_THEMES[selectedThemeIndex];
      const motionKeywords = motionIntensity === "High" ? ", high dynamic motion, fluid movement" : motionIntensity === "Low" ? ", minimal subtle motion, steady cam" : "";
      
      // DNA Logic
      let dna = styleDNA.trim();
      let tags: string[] = [];
      
      if (subMode === 'GEN_OCTANE') {
          dna = `${OCTANE_DNA} ${dna}`;
          tags.push('OCTANE');
      }
      if (subMode === 'GEN_TEXTURE') {
          tags.push('TEXTURE');
      }

      // --- PARALLEL PROCESSING FOR IMAGE BATCHES ---
      if ((subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE') && isBatchMode) {
          setProgressMsg("ENGAGING PARALLEL PROCESSING GRID [4x CONCURRENCY]...");
          
          let completed = 0;
          await geminiService.generateImageBatch(
              prompts.map(p => `${p} ${sceneContext}`), // Base prompt + scene context
              selectedSize,
              selectedAspectRatio,
              uploadedImages,
              "gemini-3-pro-image-preview", // Use Pro Image for Batch
              async (index, url) => {
                  if (abortRef.current) return;
                  completed++;
                  setProgressMsg(`BATCH PROGRESS: ${completed} / ${prompts.length}`);
                  await saveToGallery({ 
                      type: 'image', 
                      url: url, 
                      prompt: prompts[index], 
                      theme: theme.label,
                      tags: tags 
                  });
              }
          );
      } 
      // --- SEQUENTIAL PROCESSING ---
      else {
          for (let i = 0; i < prompts.length; i++) {
            const p = prompts[i];
            if (abortRef.current) break;

            if (isBatchMode) {
                 setProgressMsg(`PROCESSING SEQUENCE ${i + 1} / ${prompts.length}...`);
            } else {
                 setProgressMsg("PROCESSING DATA STREAM...");
            }

            if (subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE') {
               // --- IMAGE GENERATION ---
               // We pass distinct arguments (prompt, dna, theme) so the Architect in geminiService can assemble the Mega-Prompt
               const images = await geminiService.generateImage(
                  `${p} ${sceneContext}`, 
                  selectedSize, 
                  selectedAspectRatio, 
                  uploadedImages,
                  "gemini-3-pro-image-preview", // Default Model
                  dna,
                  theme.value,
                  subMode === 'GEN_OCTANE' ? octaneSettings : undefined,
                  subMode === 'GEN_TEXTURE'
               );

              if (images.length > 0) {
                await saveToGallery({ type: 'image', url: images[0], prompt: p, theme: theme.label, tags: tags });
              }
            } 
            else if (subMode === 'EDIT_IMG') {
               // Edit mode still uses simple concatenation as it uses Flash Image which is less structured
               const finalPrompt = `${p} ${sceneContext}. Style: ${theme.value} ${dna}`;
               const images = await geminiService.editImage(uploadedImages[0].data, uploadedImages[0].mimeType, finalPrompt);
               if (images.length > 0) {
                  await saveToGallery({ type: 'image', url: images[0], prompt: p, theme: theme.label, tags: [] });
               }
            }
            else if (subMode === 'GEN_VIDEO' || subMode === 'IMG_TO_VIDEO') {
              // Video uses Veo, which expects a single prompt string
              const startFrame = uploadedImages.length > 0 ? uploadedImages[0] : undefined;
              const finalPrompt = `${p} ${sceneContext} ${theme.value} ${dna} ${motionKeywords}`;
              
              const videoUrl = await geminiService.generateVideo(
                finalPrompt, 
                selectedAspectRatio as any, 
                startFrame, 
                (status) => setProgressMsg(isBatchMode ? `SEQ ${i+1}/${prompts.length}: ${status}` : status), 
                () => abortRef.current,
                videoResolution,
                uploadedEndFrame || undefined
              );
              await saveToGallery({ type: 'video', url: videoUrl, prompt: p, tags: [] });
            }
          }
      }
      
      setLoading(false);
    } catch (e: any) {
      alert(`Operation Failed: ${e.message}`);
      setLoading(false);
    }
  };

  const filteredGallery = gallery
    .filter(item => filterType === 'ALL' || item.type === filterType)
    .sort((a, b) => sortBy === 'NEWEST' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  // Helper for Octane Kernel Tabs
  const getOptionsForTab = (tab: typeof activeKernelTab) => {
      switch(tab) {
          case 'MATERIAL': return OCTANE_MATERIALS;
          case 'LENS': return OCTANE_LENSES;
          case 'APERTURE': return OCTANE_APERTURES;
          case 'LIGHTING': return OCTANE_LIGHTING;
          case 'FILM': return OCTANE_FILM_STOCKS;
          default: return [];
      }
  };

  const getCurrentSettingValue = (tab: typeof activeKernelTab) => {
      switch(tab) {
          case 'MATERIAL': return octaneSettings.material;
          case 'LENS': return octaneSettings.lens;
          case 'APERTURE': return octaneSettings.aperture;
          case 'LIGHTING': return octaneSettings.lighting;
          case 'FILM': return octaneSettings.filmStock;
          default: return "";
      }
  };

  const handleSettingChange = (tab: typeof activeKernelTab, value: string) => {
      const newSettings = { ...octaneSettings };
      switch(tab) {
          case 'MATERIAL': newSettings.material = value; break;
          case 'LENS': newSettings.lens = value; break;
          case 'APERTURE': newSettings.aperture = value; break;
          case 'LIGHTING': newSettings.lighting = value; break;
          case 'FILM': newSettings.filmStock = value; break;
      }
      setOctaneSettings(newSettings);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={ImageIcon} title="Visual Engine" subtitle="Photorealistic Asset Generation" />

      {fullScreenAsset && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setFullScreenAsset(null)}>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-8 h-8" /></button>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                {fullScreenAsset.type === 'video' ? (
                    <video src={fullScreenAsset.url} controls autoPlay className="max-w-[90vw] max-h-[90vh] border border-slate-700 shadow-2xl" />
                ) : (
                    <img src={fullScreenAsset.url} alt="Full Screen" className="max-w-[90vw] max-h-[90vh] object-contain border border-slate-700 shadow-2xl" />
                )}
            </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-2 mb-6">
        {[
          { id: 'GEN_IMG', label: 'Gen Image', icon: ImageIcon },
          { id: 'GEN_OCTANE', label: '3D Octane Gen', icon: Box },
          { id: 'GEN_TEXTURE', label: 'Texture Fab', icon: Grid3X3 },
          { id: 'EDIT_IMG', label: 'Edit Image', icon: Wand2 },
          { id: 'GEN_VIDEO', label: 'Gen Video', icon: Video },
          { id: 'IMG_TO_VIDEO', label: 'Animate Img', icon: Upload },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => { setSubMode(m.id as any); setUploadedImages([]); setUploadedEndFrame(null); }}
            className={`p-3 border flex flex-col items-center justify-center gap-2 transition-all ${
              subMode === m.id 
                ? m.id === 'GEN_OCTANE' 
                   ? 'bg-purple-900/30 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                   : m.id === 'GEN_TEXTURE' 
                      ? 'bg-amber-900/30 border-amber-400 text-amber-300'
                      : 'bg-cyan-900/30 border-cyan-400 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
          >
            <m.icon className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* === STANDARD MODES === */}
        <div className="w-1/3 overflow-y-auto pr-2 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                 <div className="flex items-center gap-2">
                     <Settings2 className="w-4 h-4 text-cyan-500" />
                     <span className="text-xs font-bold text-white font-mono">ENGINE CONFIG</span>
                 </div>
                 <button 
                    onClick={handleNewSession}
                    className="flex items-center gap-1 text-[10px] font-mono font-bold text-red-400 hover:text-red-300 bg-red-950/30 px-2 py-1 rounded border border-red-900/50 transition-colors"
                 >
                     <RotateCcw className="w-3 h-3" /> NEW SESSION
                 </button>
            </div>

            <div className="space-y-4">
                {/* REFERENCE IMAGES SECTION */}
                <div className="bg-slate-900/30 border border-slate-800 p-3 rounded">
                    <label className="text-[10px] font-mono text-cyan-500 mb-2 flex justify-between items-center uppercase">
                        <span>{subMode === 'GEN_VIDEO' ? 'Starting Frame (Optional)' : (subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE') ? `Style Reference (${uploadedImages.length}/10)` : 'Source Image'}</span>
                        {uploadedImages.length > 0 && <span className="text-white font-bold cursor-pointer hover:text-red-500" onClick={() => setUploadedImages([])}>CLEAR</span>}
                    </label>
                    
                    {/* Grid for up to 10 images */}
                    <div className="grid grid-cols-5 gap-2 mb-2">
                         {uploadedImages.map((img, idx) => (
                            <div key={idx} className="relative group border border-slate-700 bg-black aspect-square overflow-hidden rounded">
                                <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" alt="ref" />
                                <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="absolute top-0.5 right-0.5 bg-red-900/80 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2 h-2 text-white" /></button>
                            </div>
                         ))}
                         
                         {/* Upload Button */}
                         {(( (subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE') && uploadedImages.length < 10) || (subMode !== 'GEN_IMG' && subMode !== 'GEN_OCTANE' && subMode !== 'GEN_TEXTURE' && uploadedImages.length < 1)) && (
                             <div 
                                onClick={() => fileInputRef.current?.click()} 
                                className="aspect-square border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-900"
                             >
                                 <Plus className="w-4 h-4 text-slate-600 mb-1" />
                             </div>
                         )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, false)} className="hidden" accept="image/*" multiple={(subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE')} />
                    {(subMode === 'GEN_IMG' || subMode === 'GEN_OCTANE' || subMode === 'GEN_TEXTURE') && uploadedImages.length > 0 && (
                        <div className="text-[9px] text-green-500 font-mono mt-2 bg-green-900/20 p-2 border border-green-900/50 rounded flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            STYLE TRANSFER MODE ENGAGED (GEMINI 3 PRO)
                        </div>
                    )}
                </div>

                {/* CONSISTENCY CONTROLS */}
                {subMode === 'GEN_OCTANE' && (
                    <div className="bg-purple-900/20 border border-purple-900/50 p-3 rounded transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-mono text-purple-400 flex items-center gap-1 uppercase font-bold">
                                <Box className="w-3 h-3" /> OCTANE KERNEL
                            </label>
                            <button onClick={() => setShowKernelSettings(!showKernelSettings)} className="text-[10px] text-white underline font-mono">
                                {showKernelSettings ? "HIDE SETTINGS" : "OPEN KERNEL SETTINGS"}
                            </button>
                        </div>
                        
                        {showKernelSettings ? (
                            <div className="bg-purple-950/40 p-4 rounded animate-[fadeIn_0.3s] border border-purple-900/50">
                                {/* TABS */}
                                <div className="flex gap-1 mb-4 overflow-x-auto border-b border-purple-800/50 pb-1">
                                    {['MATERIAL', 'LENS', 'APERTURE', 'LIGHTING', 'FILM'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveKernelTab(tab as any)}
                                            className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-colors rounded-t ${
                                                activeKernelTab === tab 
                                                ? 'bg-purple-500/20 text-purple-200 border-b-2 border-purple-400' 
                                                : 'text-purple-400/60 hover:text-purple-300'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* CONTENT */}
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {getOptionsForTab(activeKernelTab).map((opt) => (
                                        <button
                                            key={opt.label}
                                            onClick={() => handleSettingChange(activeKernelTab, opt.value)}
                                            className={`text-left p-2 rounded border transition-all group ${
                                                getCurrentSettingValue(activeKernelTab) === opt.value
                                                ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                                : 'bg-slate-900/50 border-purple-900/30 hover:bg-purple-900/20 hover:border-purple-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] font-bold font-mono ${getCurrentSettingValue(activeKernelTab) === opt.value ? 'text-white' : 'text-purple-300'}`}>
                                                    {opt.label}
                                                </span>
                                                {getCurrentSettingValue(activeKernelTab) === opt.value && <CheckCircle className="w-3 h-3 text-purple-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-mono leading-tight group-hover:text-slate-300">
                                                {opt.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Spectral Toggle */}
                                <div className="mt-4 pt-3 border-t border-purple-800/50 flex items-center gap-2">
                                     <input type="checkbox" checked={octaneSettings.spectral} onChange={(e) => setOctaneSettings({...octaneSettings, spectral: e.target.checked})} className="accent-purple-500 w-3 h-3" />
                                     <div className="flex flex-col">
                                         <span className="text-[10px] text-purple-200 font-bold font-mono">SPECTRAL RENDERING (CHROMATIC ABERRATION)</span>
                                         <span className="text-[9px] text-purple-400/70 font-mono">Simulates realistic lens glass dispersion (rainbow edges).</span>
                                     </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[9px] text-purple-200 font-mono leading-tight">
                                System will automatically inject high-fidelity 3D keywords (Unreal Engine 5, Ray Tracing, 8K) into every prompt.
                            </p>
                        )}
                    </div>
                )}

                {subMode === 'GEN_TEXTURE' && (
                    <div className="bg-amber-900/20 border border-amber-900/50 p-3 rounded">
                        <label className="text-[10px] font-mono text-amber-400 mb-1 flex items-center gap-1 uppercase font-bold">
                            <Grid3X3 className="w-3 h-3" /> TEXTURE FABRICATOR
                        </label>
                        <p className="text-[9px] text-amber-200 font-mono leading-tight">
                            Generates seamless, top-down PBR Albedo maps. Perfect for 3D surfaces.
                            <br/><strong>AUTO-SETTINGS:</strong> 8K, Orthographic, Flat Lighting, Seamless Tiling.
                        </p>
                    </div>
                )}

                <div className="bg-slate-900/30 border border-slate-800 p-3 rounded">
                    <label className="text-[10px] font-mono text-cyan-400 mb-2 flex items-center gap-1 uppercase font-bold">
                        <Dna className="w-3 h-3" /> Consistency Protocol (DNA)
                    </label>
                    <CyberTextArea 
                            value={styleDNA}
                            onChange={(e: any) => setStyleDNA(e.target.value)}
                            placeholder="Enter Custom DNA suffix here (e.g. 'Cyberpunk, Neon'). This appends AFTER the Octane defaults."
                            className="h-20 text-[10px] leading-relaxed resize-none bg-black/40 border-slate-700"
                    />
                </div>

                {/* VIDEO END FRAME */}
                {subMode === 'GEN_VIDEO' && (
                    <div>
                        <label className="text-[10px] font-mono text-cyan-500 mb-2 block uppercase">Ending Frame (Optional)</label>
                        <div onClick={() => endFrameInputRef.current?.click()} className={`border-2 border-dashed rounded p-4 text-center cursor-pointer bg-slate-900/30 transition-all hover:bg-slate-900/50 ${uploadedEndFrame ? 'border-purple-500' : 'border-slate-700'}`}>
                            <Monitor className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                            <span className="text-xs font-mono text-slate-400 uppercase">{uploadedEndFrame ? "Replace End Frame" : "Upload End Frame"}</span>
                            <input type="file" ref={endFrameInputRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" accept="image/*" />
                        </div>
                        {uploadedEndFrame && (
                            <div className="relative group border border-slate-700 bg-black aspect-video mt-2">
                                <img src={`data:${uploadedEndFrame.mimeType};base64,${uploadedEndFrame.data}`} className="w-full h-full object-cover" alt="end ref" />
                                <button onClick={(e) => { e.stopPropagation(); setUploadedEndFrame(null); }} className="absolute top-1 right-1 bg-red-900/80 p-1 rounded"><X className="w-3 h-3 text-white" /></button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 p-4 border border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-mono text-slate-500 mb-1 block">ASPECT RATIO</label>
                        <select value={selectedAspectRatio} onChange={(e) => setSelectedAspectRatio(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-cyan-400 p-2 font-mono text-xs">
                            {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    {(subMode === 'GEN_VIDEO' || subMode === 'IMG_TO_VIDEO') ? (
                        <div>
                            <label className="text-[10px] font-mono text-slate-500 mb-1 block">RESOLUTION</label>
                            <select value={videoResolution} onChange={(e: any) => setVideoResolution(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-cyan-400 p-2 font-mono text-xs">
                                <option value="720p">720P (Standard)</option>
                                <option value="1080p">1080P (High Quality)</option>
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-mono text-slate-500 mb-1 block">IMAGE SIZE</label>
                            <select value={selectedSize} onChange={(e: any) => setSelectedSize(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-cyan-400 p-2 font-mono text-xs">
                                {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {(subMode === 'GEN_VIDEO' || subMode === 'IMG_TO_VIDEO') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-mono text-slate-500 mb-1 block flex items-center gap-1"><Move className="w-3 h-3" /> MOTION</label>
                            <select value={motionIntensity} onChange={(e: any) => setMotionIntensity(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-cyan-400 p-2 font-mono text-xs">
                                <option value="Low">Low</option>
                                <option value="Standard">Standard</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-slate-500 mb-1 block flex items-center gap-1"><FastForward className="w-3 h-3" /> DURATION</label>
                            <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-700 rounded h-8 mt-0.5">
                                <input type="checkbox" checked={extendDuration} onChange={(e) => setExtendDuration(e.target.checked)} className="accent-cyan-500" />
                                <span className="text-[10px] font-mono text-slate-400 uppercase">{extendDuration ? "Extended (10s+)" : "Standard (5s)"}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-[10px] font-mono text-slate-500 mb-1 block">VISUAL THEME / STYLE</label>
                    <select value={selectedThemeIndex} onChange={(e) => setSelectedThemeIndex(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-cyan-400 p-2 font-mono text-xs uppercase">
                        {GENERATION_THEMES.map((t, idx) => <option key={idx} value={idx}>{t.label}</option>)}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] font-mono text-slate-500 block">PROMPT INSTRUCTIONS</label>
                        {uplinkSuccess && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-green-400 animate-pulse bg-green-950/30 px-2 py-0.5 rounded border border-green-900/50">
                                <CheckCircle className="w-3 h-3" /> UPLINK RECEIVED
                            </div>
                        )}
                        {isBatchMode && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50">
                                <ListOrdered className="w-3 h-3" />
                                <span>AUTO-SEQUENCE: {validPrompts.length} ASSETS</span>
                            </div>
                        )}
                    </div>
                    <CyberTextArea 
                        value={promptInput} 
                        onChange={(e: any) => setPromptInput(e.target.value)} 
                        placeholder={
                            subMode === 'GEN_TEXTURE' 
                            ? 'Enter texture description (e.g. "Rusted Iron", "Mossy Rock", "Carbon Fiber")...' 
                            : subMode === 'GEN_OCTANE'
                                ? `[SUBJECT ONLY]\nEnter the core object/geometry here (e.g. "A futuristic helmet").\n\nUse the Kernel Settings above for Material, Camera, and Lighting control.`
                                : `Enter prompt...\n\n[BATCH MODE]: Paste multiple lines here.\nThe system will automatically generate an asset for every single line,\nsequentially from top to bottom.\n\n[PARAGRAPH MODE]: Separate large blocks of text with TWO empty lines to treat them as distinct prompts.`
                        } 
                    />
                </div>

                <div className="pt-2">
                    {loading ? (
                    <CyberButton onClick={handleStop} variant="danger" className="w-full animate-pulse uppercase"><OctagonX className="w-5 h-5 mr-2" /> Abort Sequence</CyberButton>
                    ) : (
                    <CyberButton onClick={handleExecute} disabled={loading} className="w-full uppercase" variant="solana">Initialize Generation</CyberButton>
                    )}
                </div>
            </div>
        </div>

        {/* Right Panel: Gallery */}
        <div className="w-2/3 bg-slate-900/30 border border-slate-800 flex flex-col relative overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div className="flex gap-2">
                    <button onClick={() => setFilterType('ALL')} className={`text-[10px] px-2 py-1 font-mono uppercase ${filterType === 'ALL' ? 'text-cyan-400 bg-cyan-950 border border-cyan-800' : 'text-slate-500'}`}>All Assets</button>
                    <button onClick={() => setFilterType('image')} className={`text-[10px] px-2 py-1 font-mono uppercase ${filterType === 'image' ? 'text-cyan-400 bg-cyan-950 border border-cyan-800' : 'text-slate-500'}`}>Images</button>
                    <button onClick={() => setFilterType('video')} className={`text-[10px] px-2 py-1 font-mono uppercase ${filterType === 'video' ? 'text-cyan-400 bg-cyan-950 border border-cyan-800' : 'text-slate-500'}`}>Videos</button>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-mono text-slate-400 border-none focus:outline-none uppercase">
                        <option value="NEWEST">Newest First</option>
                        <option value="OLDEST">Oldest First</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && <div className="p-8 border border-cyan-900/30 bg-cyan-950/5"><LoadingScan text={progressMsg} /></div>}
                
                {filteredGallery.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-4">
                        <ImageIcon className="w-20 h-20" />
                        <p className="font-mono text-sm uppercase tracking-tighter">Visual Archive Empty</p>
                    </div>
                )}

                {filteredGallery.map((item) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 flex gap-4 animate-[fadeIn_0.5s_ease-out] hover:border-slate-700 transition-colors">
                        <div className="w-1/2 relative group bg-black flex items-center justify-center">
                            {item.type === 'video' ? (
                                <video src={item.url} controls className="w-full h-full object-contain" />
                            ) : (
                                <img src={item.url} alt="Gen" className="w-full h-full object-contain cursor-pointer" onClick={() => setFullScreenAsset({url: item.url, type: item.type})} />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setFullScreenAsset({url: item.url, type: item.type})} className="bg-black/80 text-white p-2 hover:bg-cyan-600"><Maximize2 className="w-4 h-4" /></button>
                                {item.type === 'image' && (
                                    <button onClick={() => handleRefine(item)} className="bg-black/80 text-white p-2 hover:bg-purple-600" title="Neural Refine (Upscale)"><Sparkles className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => handleRegenerate(item)} className="bg-black/80 text-white p-2 hover:bg-green-600"><RefreshCw className="w-4 h-4" /></button>
                                <button onClick={() => { const a = document.createElement('a'); a.href = item.url; a.download = `solberus_${item.id}`; a.click(); }} className="bg-black/80 text-white p-2 hover:bg-cyan-600"><Download className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteAsset(item.id)} className="bg-red-900/80 text-white p-2 hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="w-1/2 flex flex-col gap-2">
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <span className="text-cyan-500 font-bold uppercase tracking-widest">{item.type}</span>
                            </div>
                            <p className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-900/50 p-2 border border-slate-800 overflow-y-auto max-h-32">{item.prompt}</p>
                            <div className="flex flex-wrap gap-1">
                                {item.theme && <span className="text-[10px] font-mono text-purple-400 bg-purple-900/20 px-2 py-0.5 w-fit border border-purple-900/40">{item.theme}</span>}
                                {item.tags && item.tags.includes('OCTANE') && <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 px-2 py-0.5 w-fit border border-purple-800 flex items-center gap-1"><Box className="w-3 h-3" /> OCTANE 3D</span>}
                                {item.tags && item.tags.includes('TEXTURE') && <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 w-fit border border-amber-800 flex items-center gap-1"><Grid3X3 className="w-3 h-3" /> TEXTURE</span>}
                                {item.tags && item.tags.includes('REFINED_4K') && <span className="text-[10px] font-mono text-green-300 bg-green-950/50 px-2 py-0.5 w-fit border border-green-800 flex items-center gap-1"><Sparkles className="w-3 h-3" /> 4K UPSCALED</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
