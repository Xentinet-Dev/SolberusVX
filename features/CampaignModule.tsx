
import React, { useState, useEffect } from 'react';
import { CyberButton, CyberTextArea, SectionTitle, LoadingScan } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { MarketingCampaign, CampaignPost } from '../types';
import { Megaphone, Rocket, Calendar, Globe, Send, ShieldCheck, RefreshCw, Trash2, CheckCircle, Clock, Zap, MessageSquare } from 'lucide-react';
import { SOCIAL_STYLES, GENERATION_THEMES } from '../constants';

export const CampaignModule = () => {
  const [activeCampaign, setActiveCampaign] = useState<MarketingCampaign | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  
  // Create Form State
  const [objective, setObjective] = useState('');
  const [brandVoice, setBrandVoice] = useState(SOCIAL_STYLES[0]);
  const [visualStyle, setVisualStyle] = useState(GENERATION_THEMES[0].label);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const data = await storageService.getCampaigns();
    setCampaigns(data);
  };

  const createCampaign = async () => {
    if (!objective.trim()) return alert("OBJECTIVE REQUIRED");
    setLoading(true);
    setProgress("STRATEGIZING CONTENT CALENDAR...");
    
    try {
      const strategy = await geminiService.generateCampaignStrategy(objective, brandVoice, visualStyle);
      
      const newCampaign: MarketingCampaign = {
        id: crypto.randomUUID(),
        name: strategy.campaignName || "New Campaign",
        objective,
        brandVoice,
        visualStyle,
        created: Date.now(),
        posts: strategy.posts.map((p: any) => ({
          ...p,
          id: crypto.randomUUID(),
          status: 'PENDING'
        })),
        status: 'PLANNING'
      };

      await storageService.saveCampaign(newCampaign);
      setActiveCampaign(newCampaign);
      await loadCampaigns();
    } catch (e: any) {
      alert(`Strategic Failure: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deployCampaign = async () => {
    if (!activeCampaign) return;
    setLoading(true);
    
    const updatedPosts = [...activeCampaign.posts];

    try {
      for (let i = 0; i < updatedPosts.length; i++) {
        const post = updatedPosts[i];
        if (post.status === 'UPLINKED') continue;

        setProgress(`DAY ${post.day} // GENERATING ${post.type}...`);
        post.status = 'GENERATING';
        setActiveCampaign({ ...activeCampaign, posts: updatedPosts });

        try {
          if (post.type === 'IMAGE') {
            const images = await geminiService.generateImage(post.visualPrompt, "2K", "16:9");
            if (images.length > 0) post.assetUrl = images[0];
          } else {
            // Video delay pacing
            if (i > 0) {
              setProgress(`DAY ${post.day} // QUOTA COOLDOWN (5s)...`);
              await new Promise(r => setTimeout(r, 5000));
            }
            const videoUrl = await geminiService.generateVideo(
                post.visualPrompt, 
                "16:9", 
                undefined, 
                (status) => setProgress(`DAY ${post.day} // ${status}`)
            );
            post.assetUrl = videoUrl;
          }

          setProgress(`DAY ${post.day} // UPLINKING TO BROADCAST NETWORK...`);
          await new Promise(r => setTimeout(r, 2000)); // Simulate posting delay
          post.status = 'UPLINKED';
          
        } catch (err) {
          console.error(err);
          post.status = 'FAILED';
        }

        updatedPosts[i] = post;
        await storageService.saveCampaign({ ...activeCampaign, posts: updatedPosts });
        setActiveCampaign({ ...activeCampaign, posts: updatedPosts });
      }
    } finally {
      setLoading(false);
      setProgress("CAMPAIGN BROADCAST COMPLETE.");
    }
  };

  const deleteCampaign = async (id: string) => {
    if (confirm("DELETE THIS CAMPAIGN DATA?")) {
        await storageService.deleteCampaign(id);
        if (activeCampaign?.id === id) setActiveCampaign(null);
        loadCampaigns();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Megaphone} title="Marketing Orchestrator" subtitle="Autonomous Ad Platform" />

      {activeCampaign ? (
        <div className="flex-1 flex gap-6 overflow-hidden p-4">
          {/* Campaign Overview */}
          <div className="w-1/3 flex flex-col gap-4">
             <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-lg space-y-4 backdrop-blur-sm">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-tighter">{activeCampaign.name}</h2>
                    <button onClick={() => setActiveCampaign(null)} className="text-slate-500 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Global Objective</div>
                    <p className="text-xs text-slate-300 font-mono italic bg-black/40 p-3 border border-slate-800 rounded">{activeCampaign.objective}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-2 border border-slate-800">
                        <span className="text-[9px] text-slate-500 font-mono block">BRAND VOICE</span>
                        <span className="text-[10px] text-cyan-500 font-bold">{activeCampaign.brandVoice}</span>
                    </div>
                    <div className="bg-slate-950 p-2 border border-slate-800">
                        <span className="text-[9px] text-slate-500 font-mono block">VISUAL THEME</span>
                        <span className="text-[10px] text-purple-500 font-bold">{activeCampaign.visualStyle}</span>
                    </div>
                </div>
                <CyberButton onClick={deployCampaign} disabled={loading} className="w-full py-4 text-sm" variant="solana">
                    <Rocket className="w-4 h-4" /> {loading ? "DEPLOYING..." : "DEPLOY CAMPAIGN"}
                </CyberButton>
             </div>

             {loading && <div className="mt-4"><LoadingScan text={progress} /></div>}
          </div>

          {/* Timeline HUD */}
          <div className="w-2/3 bg-slate-900/30 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <span className="text-xs font-mono text-cyan-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> BROADCAST SCHEDULE</span>
                <span className="text-[10px] font-mono text-slate-500">{activeCampaign.posts.filter(p => p.status === 'UPLINKED').length} / 7 POSTS ACTIVE</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeCampaign.posts.map((post) => (
                    <div key={post.id} className={`border p-4 flex gap-4 transition-all ${post.status === 'UPLINKED' ? 'bg-green-950/10 border-green-900' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="w-12 h-12 flex flex-col items-center justify-center border border-slate-700 bg-slate-900 font-mono">
                            <span className="text-[10px] text-slate-500 uppercase">Day</span>
                            <span className="text-xl font-bold text-white">{post.day}</span>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${post.type === 'VIDEO' ? 'bg-purple-900 text-purple-300' : 'bg-cyan-900 text-cyan-300'}`}>
                                    {post.type}
                                </span>
                                <div className="flex items-center gap-2">
                                    {post.status === 'UPLINKED' ? (
                                        <span className="text-[10px] text-green-500 font-mono flex items-center gap-1 uppercase"><ShieldCheck className="w-3 h-3" /> Broadcast Uplink Active</span>
                                    ) : post.status === 'GENERATING' ? (
                                        <span className="text-[10px] text-yellow-500 font-mono flex items-center gap-1 uppercase animate-pulse"><Clock className="w-3 h-3" /> Synchronizing...</span>
                                    ) : (
                                        <span className="text-[10px] text-slate-600 font-mono uppercase">Status: {post.status}</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-[11px] text-slate-300 font-bold mb-1 uppercase tracking-tight">{post.goal}</p>
                                    <div className="bg-slate-900/80 p-2 border border-slate-800 flex gap-2 rounded">
                                        <MessageSquare className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                                        <p className="text-[10px] text-slate-400 font-mono italic">{post.socialCopy}</p>
                                    </div>
                                </div>
                                
                                <div className="w-32 aspect-square bg-black border border-slate-800 flex items-center justify-center overflow-hidden rounded relative">
                                    {post.assetUrl ? (
                                        post.type === 'VIDEO' ? <video src={post.assetUrl} className="w-full h-full object-cover" /> : <img src={post.assetUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Zap className="w-6 h-6 text-slate-800" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-8 p-8 overflow-hidden">
            {/* Strategy Briefing Input */}
            <div className="w-1/2 flex flex-col justify-center gap-8">
                <div className="space-y-4">
                    <div className="bg-cyan-950/20 w-fit p-4 border border-cyan-800 rounded-full animate-pulse">
                        <Globe className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Global Objective Deployment</h1>
                    <p className="text-slate-400 font-mono text-sm leading-relaxed max-w-lg">
                        Define your marketing mission. Solberus-VX will generate a full 7-day autonomous campaign, handling everything from strategic visual prompts to viral social copy and automated generation.
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6 shadow-2xl">
                    <div>
                        <label className="text-xs font-mono text-cyan-500 mb-2 block font-bold uppercase">Strategic Objective</label>
                        <CyberTextArea 
                            value={objective} 
                            onChange={(e: any) => setObjective(e.target.value)} 
                            placeholder="e.g. Launching a futuristic streetwear brand with cyberpunk themes..." 
                            className="h-24"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-mono text-slate-500 mb-2 block uppercase">Brand Voice</label>
                            <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500">
                                {SOCIAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-mono text-slate-500 mb-2 block uppercase">Visual Theme</label>
                            <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 text-xs text-purple-400 font-mono focus:outline-none focus:border-purple-500">
                                {GENERATION_THEMES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <CyberButton onClick={createCampaign} disabled={loading} className="w-full py-5 text-lg" variant="solana">
                        <Rocket className="w-6 h-6" /> {loading ? "SYNCHRONIZING..." : "INITIALIZE CAMPAIGN"}
                    </CyberButton>
                </div>
            </div>

            {/* Campaign History */}
            <div className="w-1/2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> Active Campaigns</span>
                    <span className="text-[10px] text-cyan-500 font-bold">{campaigns.length} FOUND</span>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {campaigns.map(c => (
                        <div key={c.id} onClick={() => setActiveCampaign(c)} className="p-6 border-b border-slate-800/50 hover:bg-slate-800/50 transition-all cursor-pointer group relative">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{c.name}</h4>
                                <button onClick={(e) => { e.stopPropagation(); deleteCampaign(c.id); }} className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.created).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 text-cyan-600"><CheckCircle className="w-3 h-3" /> {c.posts.length} POSTS</span>
                                <span className="text-slate-700 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">{c.id.split('-')[0]}</span>
                            </div>
                            <p className="mt-3 text-[11px] text-slate-400 italic line-clamp-1 border-l-2 border-slate-800 pl-3 group-hover:border-cyan-500 transition-all">{c.objective}</p>
                        </div>
                    ))}
                    {campaigns.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                            <Megaphone className="w-16 h-16 text-slate-500" />
                            <p className="font-mono text-xs uppercase">No Campaigns Synchronized</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
