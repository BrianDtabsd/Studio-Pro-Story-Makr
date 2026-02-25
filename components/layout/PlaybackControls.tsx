
import React, {useRef, useEffect} from 'react';

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M4.5 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" clipRule="evenodd" />
    </svg>
  );
  
const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75ZM17.25 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
    </svg>
);

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentTrackTitle: string;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

const formatTime = (s: number) => {
  if (isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const rs = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
};

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying, currentTime, duration, volume, currentTrackTitle, onPlayPause, onStop, onSeek, onVolumeChange, disabled = false
}) => {
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] lg:w-[40%] neu-flat rounded-full px-6 py-3 flex items-center gap-4 z-[200] ${disabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        <button onClick={onPlayPause} className="w-10 h-10 rounded-full neu-btn text-accent-orange flex items-center justify-center transition-transform active:scale-90">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-accent-orange truncate max-w-[70%]">{currentTrackTitle || "Ready for preview"}</span>
                <span className="text-[10px] font-mono text-neu-text">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div className="w-full h-1 neu-pressed rounded-full relative group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-neu-base/10"></div>
                <div className="h-full bg-accent-orange" style={{ width: `${(currentTime/duration)*100 || 0}%` }}></div>
            </div>
        </div>

        <div className="flex items-center gap-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-neu-text"></div>
            <div className="w-16 h-1 neu-pressed rounded-full hidden sm:block relative">
                 <div className="absolute inset-0 bg-neu-base w-full rounded-full opacity-20"></div>
                 <div className="h-full bg-neu-text-dark rounded-full" style={{ width: `${volume * 100}%` }}></div>
            </div>
        </div>
    </div>
  );
};
