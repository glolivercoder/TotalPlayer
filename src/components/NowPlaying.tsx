
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import AlbumArt from './AlbumArt';
import MusicVisualizer from './MusicVisualizer';
import { cn } from '@/lib/utils';

interface NowPlayingProps {
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const NowPlaying = ({ expanded = false, onToggleExpand }: NowPlayingProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  
  // Simulate progress update when playing
  useEffect(() => {
    let interval: number;
    
    if (isPlaying) {
      interval = window.setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 0.5;
          return newProgress > 100 ? 0 : newProgress;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);
  
  // Example song data
  const currentSong = {
    title: "Weightless",
    artist: "Marconi Union",
    album: "Ambient 1",
    albumArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=80",
    duration: "5:18"
  };
  
  const formatTime = (percentage: number) => {
    const totalSeconds = (percentage / 100) * 318; // 5:18 in seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      className={cn(
        'glass fixed bottom-24 left-4 right-4 rounded-2xl p-4 z-10 transition-all duration-500 ease-out-expo',
        expanded ? 'h-[70vh] bottom-24' : 'h-24'
      )}
      onClick={expanded ? undefined : onToggleExpand}
    >
      <div className="h-full flex flex-col">
        {/* Compact player (always visible) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AlbumArt 
              src={currentSong.albumArt} 
              alt={`${currentSong.album} by ${currentSong.artist}`}
              size="sm"
              isPlaying={isPlaying}
            />
            <div className="truncate">
              <h3 className="font-medium truncate">{currentSong.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="player-button" aria-label="Previous track">
              <SkipBack size={20} />
            </button>
            
            <button 
              className="player-button-primary" 
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            
            <button className="player-button" aria-label="Next track">
              <SkipForward size={20} />
            </button>
          </div>
        </div>
        
        {/* Expanded view (visible when expanded) */}
        {expanded && (
          <div className="flex-1 flex flex-col mt-6 animate-fade-in overflow-hidden">
            {/* Album art and visualizer */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <AlbumArt 
                src={currentSong.albumArt} 
                alt={`${currentSong.album} by ${currentSong.artist}`}
                size="lg"
                isPlaying={isPlaying}
                className="mx-auto"
              />
              
              <div className="w-full max-w-lg">
                <MusicVisualizer isPlaying={isPlaying} />
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{currentSong.title}</h2>
                <p className="text-muted-foreground mt-1">{currentSong.artist} • {currentSong.album}</p>
              </div>
            </div>
            
            {/* Progress bar and controls */}
            <div className="w-full max-w-xl mx-auto mt-auto">
              <div className="w-full bg-secondary rounded-full h-1.5 mb-2">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground mb-8">
                <span>{formatTime(progress)}</span>
                <span>{currentSong.duration}</span>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <button className="player-button" aria-label="Volume">
                  <Volume2 size={20} />
                </button>
                
                <div className="flex items-center space-x-8">
                  <button className="player-button" aria-label="Previous track">
                    <SkipBack size={24} />
                  </button>
                  
                  <button 
                    className="player-button-primary" 
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    style={{ padding: '16px' }}
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                  </button>
                  
                  <button className="player-button" aria-label="Next track">
                    <SkipForward size={24} />
                  </button>
                </div>
                
                <button className="player-button invisible" aria-hidden="true">
                  <Volume2 size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NowPlaying;
