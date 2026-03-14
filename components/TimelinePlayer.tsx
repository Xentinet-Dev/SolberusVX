
import React, { useEffect, useRef, useState } from 'react';
import { StudioProject, StudioShot } from '../types';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface TimelinePlayerProps {
  project: StudioProject;
}

export const TimelinePlayer = ({ project }: TimelinePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [allShots, setAllShots] = useState<StudioShot[]>([]);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  // Placeholder audio for demo purposes. In a real app, this would come from a user upload or asset library.
  const audioRef = useRef<HTMLAudioElement>(new Audio('https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3')); // Cinematic ambient track

  // Flatten scenes into a linear timeline for playback
  useEffect(() => {
    const flat: StudioShot[] = [];
    project.scenes.forEach(scene => {
      scene.shots.forEach(shot => {
        if (shot.videoUrl || shot.imageUrl) {
            flat.push(shot);
        }
      });
    });
    setAllShots(flat);
  }, [project]);

  // Handle Playback Logic
  useEffect(() => {
    // Sync Audio Playback
    if (audioRef.current) {
        if (isPlaying && !isMuted) {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        } else {
            audioRef.current.pause();
        }
    }

    if (!isPlaying) {
        if (videoRef.current) videoRef.current.pause();
        return;
    }

    const currentShot = allShots[currentShotIndex];
    if (!currentShot) {
        setIsPlaying(false);
        setCurrentShotIndex(0);
        return;
    }

    // --- AUTO DUCKING LOGIC ---
    if (audioRef.current && project.settings.autoDuck) {
        const targetVolume = currentShot.hasDialogue ? 0.2 : 0.8; // Duck to 20% if dialogue, else 80%
        // Smooth fade (simulated)
        audioRef.current.volume = targetVolume;
    }

    // Trigger Transition Effect (Fade In)
    if (transitionRef.current) {
        transitionRef.current.style.opacity = '1';
        setTimeout(() => {
             if (transitionRef.current) transitionRef.current.style.opacity = '0';
        }, 300); // 300ms transition
    }

    // Setup Media Source
    if (currentShot.videoUrl) {
        if (videoRef.current) {
            videoRef.current.src = currentShot.videoUrl;
            videoRef.current.currentTime = currentShot.trimStart;
            videoRef.current.volume = isMuted ? 0 : (currentShot.volume || 1);
            
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.error("Auto-play prevented", error));
            }

            videoRef.current.ontimeupdate = () => {
                if (videoRef.current) {
                    // Calculate effective duration based on trims
                    const shotEnd = currentShot.trimEnd > 0 ? currentShot.trimEnd : videoRef.current.duration;
                    const shotDuration = shotEnd - currentShot.trimStart;
                    const currentPos = videoRef.current.currentTime - currentShot.trimStart;
                    
                    setProgress((currentPos / shotDuration) * 100);

                    // Handle Trim End or Video End
                    if (videoRef.current.currentTime >= shotEnd) {
                        handleNext();
                    }
                }
            };
            
            // Fallback if trimEnd is 0
            videoRef.current.onended = handleNext;
        }
    } else if (currentShot.imageUrl) {
        // Image Slideshow logic
        let startTime = Date.now();
        const duration = (currentShot.duration || 5) * 1000;
        
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            setProgress((elapsed / duration) * 100);
            
            if (elapsed >= duration) {
                clearInterval(interval);
                handleNext();
            }
        }, 50);
        
        return () => clearInterval(interval);
    }
  }, [isPlaying, currentShotIndex, allShots.length, isMuted, project.settings.autoDuck]); 

  const handleNext = () => {
      if (currentShotIndex < allShots.length - 1) {
          setCurrentShotIndex(prev => prev + 1);
      } else {
          // End of timeline
          setIsPlaying(false);
          setCurrentShotIndex(0);
          setProgress(0);
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
          }
      }
  };

  const handlePrev = () => {
      if (currentShotIndex > 0) {
          setCurrentShotIndex(prev => prev - 1);
      }
  };

  const currentShot = allShots[currentShotIndex];

  return (
    <div className="flex flex-col gap-2 w-full h-full bg-black rounded-lg overflow-hidden border border-slate-800 shadow-2xl">
        <div className="relative flex-1 bg-black group min-h-0">
            {/* Main Screen Container with Color Grade */}
            <div 
              className="w-full h-full relative overflow-hidden"
              style={{ filter: project.settings.colorGrade }}
            >
                {currentShot?.videoUrl ? (
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-contain" 
                        playsInline
                    />
                ) : currentShot?.imageUrl ? (
                    <img 
                        ref={imgRef} 
                        src={currentShot.imageUrl} 
                        className="w-full h-full object-contain animate-[subtleZoom_10s_ease-out]" 
                        alt="Shot"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 font-mono">
                         <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4" />
                         <span>NO SIGNAL / STANDBY</span>
                    </div>
                )}
            </div>

            {/* Black Transition Overlay */}
            <div 
                ref={transitionRef}
                className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 opacity-0 z-10"
            />

            {/* Info Overlay */}
            <div className="absolute top-4 left-4 pointer-events-none z-20">
                <div className="bg-black/70 px-3 py-1 text-xs font-mono text-cyan-500 border-l-2 border-cyan-500 backdrop-blur-sm">
                    SCENE {allShots[currentShotIndex]?.id ? project.scenes.find(s => s.shots.some(sh => sh.id === allShots[currentShotIndex].id))?.number : '--'}
                </div>
                <div className="mt-1 bg-black/70 px-3 py-1 text-[10px] font-mono text-white backdrop-blur-sm">
                    {currentShot?.type || "WAITING FOR MEDIA"}
                </div>
                {currentShot?.hasDialogue && project.settings.autoDuck && (
                    <div className="mt-1 bg-blue-900/80 px-3 py-1 text-[10px] font-mono text-white backdrop-blur-sm animate-pulse">
                        DIALOGUE: MUSIC DUCKED
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-cyan-400 transition-colors">
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button onClick={handlePrev} className="text-slate-400 hover:text-white transition-colors">
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={handleNext} className="text-slate-400 hover:text-white transition-colors">
                        <SkipForward className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden relative group/progress cursor-pointer">
                         <div 
                            className="h-full bg-cyan-500 transition-all duration-100 ease-linear relative" 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100" />
                        </div>
                    </div>
                    
                    <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition-colors">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <span className="text-xs font-mono text-white w-12 text-right">
                        {currentShotIndex + 1} / {allShots.length}
                    </span>
                </div>
            </div>
        </div>

        {/* Sequencer Strip / Navigation */}
        <div className="h-24 bg-slate-950 border-t border-slate-800 flex overflow-x-auto p-2 gap-1 custom-scrollbar z-20">
            {allShots.map((shot, idx) => (
                <div 
                    key={shot.id} 
                    onClick={() => { setCurrentShotIndex(idx); setIsPlaying(true); }}
                    className={`h-full aspect-video flex-shrink-0 cursor-pointer border-2 transition-all relative group overflow-hidden ${currentShotIndex === idx ? 'border-cyan-500 opacity-100' : 'border-slate-800 opacity-60 hover:opacity-90'}`}
                >
                    {shot.imageUrl ? (
                        <img src={shot.imageUrl} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        <div className="w-full h-full bg-slate-900" />
                    )}
                    
                    <div className="absolute bottom-0 left-0 w-full bg-black/80 text-[8px] text-white px-1 truncate py-0.5 font-mono">
                        {shot.type}
                    </div>
                    
                    {shot.videoUrl && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime]" title="Video Ready" />
                    )}
                    {shot.hasDialogue && (
                         <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_blue]" title="Has Dialogue" />
                    )}
                </div>
            ))}
        </div>
        <style>{`
            @keyframes subtleZoom {
                0% { transform: scale(1); }
                100% { transform: scale(1.1); }
            }
        `}</style>
    </div>
  );
};
