
import React, { useState, useEffect, useRef } from 'react';
import { FeatureMode } from '../types';
import { MODULE_INSTRUCTIONS } from '../constants';
import { geminiService } from '../services/geminiService';
import { HelpCircle, Send, X, MessageSquare, ChevronDown, ChevronUp, Bot, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TacticalAssistantProps {
  currentMode: FeatureMode;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

export const TacticalAssistant = ({ currentMode }: TacticalAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-switch context when mode changes
  useEffect(() => {
    const info = MODULE_INSTRUCTIONS[currentMode];
    if (info) {
        setMessages(prev => [
            ...prev, 
            { 
                role: 'system', 
                text: `**TACTICAL UPDATE: ${info.title}**\n\n${info.brief}\n\n**Mission Steps:**\n${info.steps.map((s, i) => `${i+1}. ${s}`).join('\n')}` 
            }
        ]);
    }
  }, [currentMode]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
        const info = MODULE_INSTRUCTIONS[currentMode];
        const contextStr = JSON.stringify(info);
        
        const responseText = await geminiService.askTacticalAssistant(
            userMsg, 
            info.title, 
            contextStr
        );
        
        setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'system', text: "Uplink Error: Unable to reach command server." }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all ${isOpen ? 'w-96' : 'w-auto'}`}>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="w-full bg-slate-950 border border-cyan-900/50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[500px] mb-4 animate-[slideIn_0.3s_ease-out]">
            {/* Header */}
            <div className="bg-slate-900 p-3 border-b border-cyan-900/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">GUIDANCE SYSTEM</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded p-3 text-xs font-mono leading-relaxed ${
                            m.role === 'user' ? 'bg-cyan-950/50 text-cyan-100 border border-cyan-900' : 
                            m.role === 'system' ? 'bg-slate-900/80 text-green-400 border border-green-900/30' : 
                            'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}>
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900 text-cyan-500 p-2 text-xs font-mono rounded animate-pulse">
                            ANALYZING REQUEST...
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-900 border-t border-cyan-900/30 flex gap-2">
                <input 
                    className="flex-1 bg-black border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Ask for tactical support..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={loading}
                    className="bg-cyan-900/50 hover:bg-cyan-500 hover:text-black border border-cyan-500/50 text-cyan-400 p-2 rounded transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 px-4 py-3 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 ${isOpen ? 'bg-cyan-500 text-black' : 'bg-slate-900 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-950'}`}
      >
        <div className="relative">
            <HelpCircle className="w-6 h-6" />
            {!isOpen && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />}
        </div>
        <span className={`font-mono font-bold text-sm overflow-hidden transition-all duration-300 ${isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            TACTICAL ASSIST
        </span>
      </button>

    </div>
  );
};
