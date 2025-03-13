import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import AlbumArt from './AlbumArt';
import MusicVisualizer from './MusicVisualizer';
import { cn } from '@/lib/utils';
import { useAudioPlayer, Track } from '@/services/AudioPlayerService';
import { Slider } from '@/components/ui/slider';

interface NowPlayingProps {
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const NowPlaying = ({ expanded = false, onToggleExpand }: NowPlayingProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use the audio player state
  const { 
    currentTrack, 
    isPlaying, 
    isMuted,
    volume: playerVolume,
    progress, 
    duration,
    play, 
    pause, 
    toggle,
    stop, 
    next, 
    previous, 
    seekTo, 
    setVolume: setPlayerVolume,
    setMuted: setPlayerMuted,
    vocalRemoval,
    pitchShift,
    tempo,
    setVocalRemoval,
    setPitchShift,
    setTempo
  } = useAudioPlayer();
  
  // Handle volume change
  const handleVolumeChange = (value: number) => {
    setPlayerVolume(value);
    if (value === 0) {
      setPlayerMuted(true);
    } else if (isMuted) {
      setPlayerMuted(false);
    }
  };
  
  // Handle mute toggle
  const handleMuteToggle = () => {
    setPlayerMuted(!isMuted);
    if (isMuted && playerVolume === 0) {
      setPlayerVolume(0.8);
    }
  };
  
  // Format time from seconds
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get current time
  const getCurrentTime = () => {
    return formatTime(progress);
  };
  
  // Get total duration
  const getDuration = () => {
    return formatTime(duration);
  };
  
  // Handle seek
  const handleSeek = (value: number) => {
    // Converter o valor percentual para segundos
    if (duration) {
      const seekTime = (value / 100) * duration;
      seekTo(seekTime);
    }
  };
  
  // Calcular o progresso percentual para o slider
  const getProgressPercentage = () => {
    if (!duration || duration === 0) return 0;
    return (progress / duration) * 100;
  };
  
  // Sync video with audio player if playing a video
  useEffect(() => {
    if (currentTrack?.isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(error => console.error('Erro ao reproduzir vídeo:', error));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  return (
    <div 
      className={cn(
        'glass fixed bottom-0 left-0 right-0 rounded-t-2xl p-4 z-20 transition-all duration-500 border-t border-border/50',
        expanded ? 'h-[80vh]' : 'h-24'
      )}
      style={{ 
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' // ease-out-expo
      }}
      onClick={expanded ? undefined : onToggleExpand}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Compact player (always visible) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {currentTrack ? (
              <>
                <AlbumArt 
                  src={currentTrack.albumArt || '/default-album-art.png'} 
                  alt={`${currentTrack.album || 'Unknown Album'} by ${currentTrack.artist}`}
                  size="sm"
                  isPlaying={isPlaying}
                />
                <div className="truncate min-w-0">
                  <h3 className="font-medium truncate">{currentTrack.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-md bg-secondary/40 flex-shrink-0"></div>
                <div className="truncate min-w-0">
                  <h3 className="font-medium truncate">Nenhuma faixa reproduzindo</h3>
                  <p className="text-sm text-muted-foreground truncate">Selecione uma faixa para reproduzir</p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="player-button" 
              aria-label="Faixa anterior"
              onClick={(e) => {
                e.stopPropagation();
                previous();
              }}
              disabled={!currentTrack}
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              className="player-button-primary" 
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              disabled={!currentTrack}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            
            <button 
              className="player-button" 
              aria-label="Próxima faixa"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              disabled={!currentTrack}
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
        
        {/* Expanded player (visible when expanded) */}
        {expanded && (
          <div className="flex-1 mt-4 overflow-hidden">
            <div className="expanded-player-content">
              {/* Left side - Album art and track info */}
              <div className="flex flex-col items-center justify-center p-4">
                {currentTrack ? (
                  <>
                    <div className="w-full max-w-xs aspect-square mb-4">
                      <AlbumArt 
                        src={currentTrack.albumArt || '/default-album-art.png'} 
                        alt={`${currentTrack.album || 'Unknown Album'} by ${currentTrack.artist}`}
                        size="lg"
                        isPlaying={isPlaying}
                        className="w-full h-full object-cover rounded-xl shadow-lg"
                      />
                    </div>
                    <div className="w-full text-center">
                      <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
                      <p className="text-muted-foreground truncate">{currentTrack.artist}</p>
                      {currentTrack.album && (
                        <p className="text-sm text-muted-foreground truncate">{currentTrack.album}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-64 h-64 rounded-xl bg-secondary/40 mb-4"></div>
                    <h2 className="text-xl font-bold">Nenhuma faixa selecionada</h2>
                    <p className="text-muted-foreground">Selecione uma faixa para reproduzir</p>
                  </div>
                )}
              </div>
              
              {/* Right side - Controls and visualizer */}
              <div className="flex flex-col p-4">
                {/* Visualizer */}
                <div className="h-32 mb-4 flex items-center justify-center">
                  <MusicVisualizer isPlaying={isPlaying} />
                </div>
                
                {/* Progress bar */}
                <div className="mb-4">
                  <div 
                    className="progress-slider mb-1"
                    onClick={(e) => {
                      const container = e.currentTarget;
                      const rect = container.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      handleSeek(percentage);
                    }}
                  >
                    <div 
                      className="progress-slider-fill" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{getCurrentTime()}</span>
                    <span>{getDuration()}</span>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <button 
                    className="player-button" 
                    aria-label="Faixa anterior"
                    onClick={previous}
                    disabled={!currentTrack}
                  >
                    <SkipBack size={24} />
                  </button>
                  
                  <button 
                    className="player-button primary w-12 h-12" 
                    aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                    onClick={toggle}
                    disabled={!currentTrack}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  <button 
                    className="player-button" 
                    aria-label="Próxima faixa"
                    onClick={next}
                    disabled={!currentTrack}
                  >
                    <SkipForward size={24} />
                  </button>
                </div>
                
                {/* Volume control */}
                <div className="flex items-center space-x-2">
                  <button 
                    className="player-button" 
                    aria-label={isMuted ? 'Ativar som' : 'Mutar'}
                    onClick={handleMuteToggle}
                  >
                    {isMuted || playerVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  
                  <Slider
                    value={[isMuted ? 0 : playerVolume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                  />
                </div>
                
                {/* Additional controls for karaoke */}
                {currentTrack?.isKaraoke && (
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm">Remoção de voz: {vocalRemoval ? 'Ativada' : 'Desativada'}</label>
                      <Slider
                        value={[vocalRemoval ? 100 : 0]}
                        min={0}
                        max={100}
                        step={100}
                        className="w-full"
                        onValueChange={(value) => setVocalRemoval(value[0] > 50)}
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm">Tonalidade: {pitchShift > 0 ? `+${pitchShift}` : pitchShift}</label>
                      <Slider
                        value={[pitchShift + 12]}
                        min={0}
                        max={24}
                        step={1}
                        className="w-full"
                        onValueChange={(value) => setPitchShift(value[0] - 12)}
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm">Velocidade: {tempo.toFixed(1)}x</label>
                      <Slider
                        value={[tempo * 10]}
                        min={5}
                        max={15}
                        step={1}
                        className="w-full"
                        onValueChange={(value) => setTempo(value[0] / 10)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NowPlaying;
