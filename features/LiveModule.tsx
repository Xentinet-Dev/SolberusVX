
import React, { useState, useRef, useEffect } from 'react';
import { CyberButton, SectionTitle } from '../components/UI';
import { geminiService } from '../services/geminiService';
import { storageService, VoiceSession } from '../services/storageService';
import { Mic, MicOff, Activity, History, Save, Trash2, Clock } from 'lucide-react';
import { LiveServerMessage } from '@google/genai';

export const LiveModule = () => {
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const s = await storageService.getVoiceSessions();
      setSessions(s);
    } catch (e) { console.error(e); }
  };

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const saveSession = async () => {
    if (logs.length === 0) return;
    const session: VoiceSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      logs: [...logs]
    };
    await storageService.saveVoiceSession(session);
    await loadSessions();
    alert("SESSION ARCHIVED");
  };

  const connect = async () => {
    try {
      addLog("Initializing Audio...");
      const InputContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      inputAudioContextRef.current = new InputContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new InputContextClass({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("Microphone Active.");

      const inputContext = inputAudioContextRef.current;
      const source = inputContext.createMediaStreamSource(stream);
      const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        if (!sessionPromiseRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        sessionPromiseRef.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputContext.destination);

      addLog("Connecting to Live API...");
      sessionPromiseRef.current = geminiService.connectLive({
          onOpen: () => { setConnected(true); addLog("Connected. Speak now."); },
          onMessage: handleServerMessage,
          onError: (e) => { addLog(`Error: ${e}`); disconnect(); },
          onClose: () => { addLog("Disconnected."); disconnect(); }
      }, "You are Solberus. Speak briefly and helpful.");

    } catch (e: any) { addLog(`Connection Failed: ${e.message}`); }
  };

  const handleServerMessage = async (message: LiveServerMessage) => {
    const outputContext = outputAudioContextRef.current;
    if (!outputContext) return;

    if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
        addLog(`AI: ${message.serverContent.modelTurn.parts[0].text}`);
    }

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        setSpeaking(true);
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for(let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const buffer = await decodeAudioData(bytes, outputContext);
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
        const source = outputContext.createBufferSource();
        source.buffer = buffer;
        source.connect(outputContext.destination);
        source.onended = () => {
            sourcesRef.current.delete(source);
            if (sourcesRef.current.size === 0) setSpeaking(false);
        };
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
        sourcesRef.current.add(source);
    }
    if (message.serverContent?.interrupted) {
        addLog("Interrupted.");
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setSpeaking(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sessionPromiseRef.current?.then((s: any) => s.close && s.close());
    sessionPromiseRef.current = null;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      <SectionTitle icon={Mic} title="Voice Chat" subtitle="Real-time Conversation" />

      <div className="flex-1 flex gap-4 overflow-hidden">
         {/* Main Interface */}
         <div className="flex-1 flex flex-col items-center justify-center relative border-r border-slate-800">
             <div className={`w-64 h-64 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${connected ? speaking ? 'border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.5)] bg-cyan-950' : 'border-green-500 shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-slate-900' : 'border-slate-800 bg-slate-950'}`}>
                 {connected ? <Activity className={`w-32 h-32 ${speaking ? 'text-cyan-400 animate-pulse' : 'text-green-500'}`} /> : <MicOff className="w-24 h-24 text-slate-700" />}
             </div>

             <div className="mt-8 flex gap-4">
                 {!connected ? (
                     <CyberButton onClick={connect} variant="solana" className="w-48 text-lg"><Mic className="w-5 h-5" /> START CALL</CyberButton>
                 ) : (
                     <CyberButton onClick={disconnect} variant="danger" className="w-48 text-lg"><MicOff className="w-5 h-5" /> END CALL</CyberButton>
                 )}
             </div>

             <div className="mt-4 flex gap-2">
                <button onClick={saveSession} className="text-cyan-500 text-xs font-mono hover:text-white flex items-center gap-1"><Save className="w-4 h-4" /> ARCHIVE SESSION</button>
                <button onClick={() => setShowHistory(!showHistory)} className="text-slate-500 text-xs font-mono hover:text-white flex items-center gap-1"><History className="w-4 h-4" /> {showHistory ? "HIDE HISTORY" : "SHOW HISTORY"}</button>
             </div>
         </div>

         {/* Logs / History Panel */}
         <div className={`w-1/3 bg-slate-900/30 flex flex-col transition-all duration-300 ${showHistory ? 'translate-x-0' : 'translate-x-full hidden'}`}>
             <div className="p-3 border-b border-slate-800 font-mono text-xs text-cyan-500 font-bold flex justify-between">
                <span>ARCHIVED SESSIONS</span>
                <span className="text-slate-500">{sessions.length}</span>
             </div>
             <div className="flex-1 overflow-y-auto">
                 {sessions.map(s => (
                     <div key={s.id} className="p-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer group">
                         <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
                             <Clock className="w-3 h-3" />
                             {new Date(s.timestamp).toLocaleString()}
                         </div>
                         <div className="text-[10px] text-slate-500 font-mono line-clamp-2">
                             {s.logs.length} events logged.
                         </div>
                     </div>
                 ))}
             </div>
             <div className="h-1/2 border-t border-slate-800 bg-black/50 flex flex-col">
                <div className="p-2 text-xs font-mono text-green-500 border-b border-slate-800">LIVE LOGS</div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] text-slate-400 space-y-1">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

// Helper functions kept same as previous...
function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i] / 32768.0; }
    return buffer;
}
