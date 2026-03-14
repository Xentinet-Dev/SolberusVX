import React from 'react';

export const CyberButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false 
}: any) => {
  const baseStyle = "font-mono font-bold py-2 px-4 border transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-cyan-950/50 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]",
    secondary: "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
    danger: "bg-red-950/50 border-red-500 text-red-400 hover:bg-red-500 hover:text-black hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]",
    solana: "bg-emerald-950/50 border-[#00FF9D] text-[#00FF9D] hover:bg-[#00FF9D] hover:text-black hover:shadow-[0_0_20px_rgba(0,255,157,0.6)]"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export const CyberInput = ({ value, onChange, placeholder, onKeyDown }: any) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className="w-full bg-slate-900/80 border border-cyan-900 text-cyan-100 p-3 font-mono focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] placeholder-cyan-900/50"
  />
);

export const CyberTextArea = ({ value, onChange, placeholder, className = '' }: any) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full bg-slate-900/80 border border-cyan-900 text-cyan-100 p-3 font-mono focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] placeholder-cyan-900/50 h-32 resize-none ${className}`}
  />
);

export const LoadingScan = ({ text = "PROCESSING DATA STREAM..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center space-y-2 p-8">
    <div className="w-64 h-2 bg-slate-800 overflow-hidden relative border border-cyan-900">
      <div className="absolute top-0 left-0 h-full w-1/3 bg-cyan-500 animate-[ping_1.5s_linear_infinite]" style={{ animationName: 'scanMove', animationDuration: '1s', animationIterationCount: 'infinite' }}></div>
    </div>
    <span className="font-mono text-xs text-cyan-500 animate-pulse uppercase">{text}</span>
    <style>{`
      @keyframes scanMove {
        0% { left: -33%; }
        100% { left: 100%; }
      }
    `}</style>
  </div>
);

export const SectionTitle = ({ icon: Icon, title, subtitle }: any) => (
  <div className="mb-6 border-b border-cyan-900/50 pb-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-cyan-950 border border-cyan-700 rounded-none">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">{title}</h2>
        <p className="text-xs font-mono text-cyan-600 uppercase">{subtitle}</p>
      </div>
    </div>
  </div>
);