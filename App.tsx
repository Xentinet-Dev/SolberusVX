
import React, { useState, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { FeatureMode } from './types';
import { Dashboard } from './features/Dashboard';
import { IntelligenceModule } from './features/IntelligenceModule';
import { VisualModule } from './features/VisualModule';
import { ReconModule } from './features/ReconModule';
import { LiveModule } from './features/LiveModule';
import { StudioModule } from './features/StudioModule';
import { CampaignModule } from './features/CampaignModule';
import { StyleProtocolModule } from './features/StyleProtocolModule';
import { BatchFactoryModule } from './features/BatchFactoryModule';
import { AssetLibraryModule } from './features/AssetLibraryModule';
import { UIArchitectModule } from './features/UIArchitectModule';
import { TacticalAssistant } from './components/TacticalAssistant';
import { Shield, Sparkles, Image, Search, Mic, CreditCard, ChevronRight, Home, Film, Megaphone, Lock, Dna, Factory, LayoutGrid, Activity, Key, Layout } from 'lucide-react';

const NavItem = ({ mode, icon: Icon, label, activeMode, setActiveMode }: { mode: FeatureMode, icon: any, label: string, activeMode: FeatureMode, setActiveMode: (mode: FeatureMode) => void }) => (
  <button
    onClick={() => setActiveMode(mode)}
    className={`w-full flex items-center gap-3 p-4 transition-all border-l-2 ${
      activeMode === mode 
        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-100' 
        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-mono uppercase tracking-widest text-sm">{label}</span>
    {activeMode === mode && <ChevronRight className="ml-auto w-4 h-4 text-cyan-500 animate-pulse" />}
  </button>
);

interface PersistentViewProps {
  mode: FeatureMode;
  activeMode: FeatureMode;
  children?: React.ReactNode;
}

const PersistentView = ({ mode, activeMode, children }: PersistentViewProps) => (
    <div className={activeMode === mode ? 'h-full w-full flex flex-col' : 'hidden'}>
        {children}
    </div>
);

const App = () => {
  const [apiKey, setApiKey] = useState<string | null>(process.env.API_KEY || null);
  const [hasVeoKey, setHasVeoKey] = useState(false);
  const [activeMode, setActiveMode] = useState<FeatureMode>(FeatureMode.DASHBOARD);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    // Check for Veo Key support via AI Studio injection
    const checkVeoKey = async () => {
      try {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
           const hasKey = await (window as any).aistudio.hasSelectedApiKey();
           if (hasKey) {
             setHasVeoKey(true);
             geminiService.initialize(process.env.API_KEY || '');
           }
        }
      } catch (e) {
        console.error("Key check failed", e);
      } finally {
        setCheckingKey(false);
        if (process.env.API_KEY) {
            geminiService.initialize(process.env.API_KEY);
        }
      }
    };
    checkVeoKey();

    // Event Listener for Cross-Module Navigation (Uplink)
    const handleUplink = (e: any) => {
        if (e.detail && e.detail.target) {
            setActiveMode(e.detail.target);
        }
    };
    window.addEventListener('solberus-link', handleUplink);
    return () => window.removeEventListener('solberus-link', handleUplink);

  }, []);

  const handleVeoKeyRequest = async () => {
    try {
      if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        setHasVeoKey(true);
        geminiService.initialize(process.env.API_KEY || '');
      } else {
        alert("AI Studio environment not detected. Cannot verify paid key for Veo.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (checkingKey) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-cyan-500 font-mono animate-pulse">INITIALIZING SECURITY PROTOCOLS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800 cursor-pointer" onClick={() => setActiveMode(FeatureMode.DASHBOARD)}>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tighter">SOLBERUS<span className="text-white text-opacity-50 text-base ml-1">VX</span></h1>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">TRI-INTELLIGENCE ENGINE</div>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          <NavItem mode={FeatureMode.DASHBOARD} icon={Home} label="Home" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.CAMPAIGNS} icon={Megaphone} label="Campaigns" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.BATCH_FACTORY} icon={Factory} label="Batch Factory" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.STYLE_PROTOCOL} icon={Dna} label="Protocol DNA" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.UI_ARCHITECT} icon={Layout} label="UI Architect" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.STUDIO} icon={Film} label="Cinematic Studio" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.INTELLIGENCE} icon={Sparkles} label="Prompt Enhancer" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.VISUALS} icon={Image} label="Image & Video Gen" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.ASSET_LIBRARY} icon={LayoutGrid} label="Asset Library" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.RECON} icon={Search} label="Media Analyzer" activeMode={activeMode} setActiveMode={setActiveMode} />
          <NavItem mode={FeatureMode.LIVE_UPLINK} icon={Mic} label="Voice Chat" activeMode={activeMode} setActiveMode={setActiveMode} />
        </nav>

        {/* API Status / Tier Selector */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className="mb-3 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase">SIGNAL TIER</span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${hasVeoKey ? 'bg-green-950 border-green-500 text-green-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                {hasVeoKey ? 'ELITE (PAID)' : 'SANDBOX (FREE)'}
              </span>
           </div>

           {!hasVeoKey ? (
             <div className="space-y-3">
                <div className="text-[10px] text-slate-500 font-mono leading-tight bg-slate-950 p-2 rounded border border-slate-800">
                   <Lock className="w-3 h-3 inline mr-1 text-yellow-500" />
                   Veo video generation requires a verified billing key.
                </div>
                <button 
                  onClick={handleVeoKeyRequest}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-950/30 border border-cyan-800 text-cyan-400 text-[10px] py-2 px-2 hover:bg-cyan-900/50 hover:text-white transition-colors uppercase font-bold rounded"
                >
                  <Key className="w-3 h-3" /> CONNECT PRO KEY
                </button>
             </div>
           ) : (
             <div className="space-y-2">
                 <div className="flex items-center gap-2 text-green-500 text-[10px] font-mono uppercase font-bold bg-green-900/10 p-2 rounded border border-green-900/30">
                   <Activity className="w-3 h-3" />
                   All Modules Operational
                 </div>
                 <button 
                  onClick={handleVeoKeyRequest} 
                  className="w-full text-[9px] text-slate-600 hover:text-slate-400 font-mono uppercase flex items-center justify-center gap-1 py-1"
                 >
                    SWITCH API KEY
                 </button>
             </div>
           )}
           
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-[9px] text-slate-700 hover:text-slate-500 text-center mt-3 font-mono">
             Google AI Billing Documentation
           </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6 z-10">
          <div className="font-mono text-xs text-cyan-600 flex items-center gap-4">
             <span>SYS.STATUS: <span className="text-green-500 font-bold">OPTIMAL</span></span>
             <span>MARKETING_UPLINK: <span className={hasVeoKey ? "text-green-500 font-bold" : "text-yellow-500"}>{hasVeoKey ? "UNLOCKED" : "RESTRICTED"}</span></span>
             <span>MODEL: <span className="text-cyan-400">GEMINI-3-PRO</span></span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]"></div>
             <span className="font-bold text-sm tracking-widest text-white uppercase">Neural Active</span>
          </div>
        </header>

        <main className="flex-1 p-6 z-10 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none scanline opacity-30"></div>
          {/* 
             PERSISTENCE LAYER:
             We use 'display: none' via styles instead of conditional React rendering.
             This keeps all components mounted, preserving their internal state (inputs, scroll position, draft text).
          */}
          <PersistentView mode={FeatureMode.DASHBOARD} activeMode={activeMode}><Dashboard onNavigate={setActiveMode} /></PersistentView>
          <PersistentView mode={FeatureMode.CAMPAIGNS} activeMode={activeMode}><CampaignModule /></PersistentView>
          <PersistentView mode={FeatureMode.STYLE_PROTOCOL} activeMode={activeMode}><StyleProtocolModule /></PersistentView>
          <PersistentView mode={FeatureMode.STUDIO} activeMode={activeMode}><StudioModule /></PersistentView>
          <PersistentView mode={FeatureMode.INTELLIGENCE} activeMode={activeMode}><IntelligenceModule /></PersistentView>
          <PersistentView mode={FeatureMode.VISUALS} activeMode={activeMode}><VisualModule /></PersistentView>
          <PersistentView mode={FeatureMode.RECON} activeMode={activeMode}><ReconModule /></PersistentView>
          <PersistentView mode={FeatureMode.LIVE_UPLINK} activeMode={activeMode}><LiveModule /></PersistentView>
          <PersistentView mode={FeatureMode.BATCH_FACTORY} activeMode={activeMode}><BatchFactoryModule /></PersistentView>
          <PersistentView mode={FeatureMode.ASSET_LIBRARY} activeMode={activeMode}><AssetLibraryModule /></PersistentView>
          <PersistentView mode={FeatureMode.UI_ARCHITECT} activeMode={activeMode}><UIArchitectModule /></PersistentView>
        </main>
        
        {/* TACTICAL ASSISTANT OVERLAY */}
        <TacticalAssistant currentMode={activeMode} />
      </div>
    </div>
  );
};

export default App;
