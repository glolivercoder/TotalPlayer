import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
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
  
  // Update video time when audio time changes
  useEffect(() => {
    if (currentTrack?.isVideo && videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - progress) > 0.5) {
        videoRef.current.currentTime = progress;
      }
    }
  }, [progress, currentTrack]);
  
  return (
    <div className={cn(
      "glass w-full transition-all duration-300",
      expanded ? "h-[calc(100vh-48px)]" : "h-auto"
    )}>
      {/* Player minimizado */}
      <div className="p-2">
        {/* Barra de progresso */}
        <div 
          className="progress-slider mb-1 cursor-pointer" 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            handleSeek(percentage);
          }}
        >
          <div 
            className="progress-slider-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          {/* Informações da música */}
          <div 
            className="flex items-center flex-1 min-w-0 cursor-pointer" 
            onClick={onToggleExpand}
          >
            {currentTrack ? (
              <>
                <AlbumArt 
                  src={currentTrack.albumArt} 
                  alt={currentTrack.title} 
                  size="xs"
                  isPlaying={isPlaying}
                  className="mr-2"
                />
                <div className="truncate">
                  <h3 className="font-medium text-xs truncate">{currentTrack.title}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">Nenhuma música selecionada</div>
            )}
          </div>
          
          {/* Controles de reprodução */}
          <div className="flex items-center space-x-1">
            <button 
              className="player-button" 
              onClick={previous}
              disabled={!currentTrack}
              aria-label="Anterior"
            >
              <SkipBack size={16} />
            </button>
            
            <button 
              className="player-button primary" 
              onClick={toggle}
              disabled={!currentTrack}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button 
              className="player-button" 
              onClick={next}
              disabled={!currentTrack}
              aria-label="Próxima"
            >
              <SkipForward size={16} />
            </button>
            
            <button 
              className="player-button ml-1" 
              onClick={onToggleExpand}
              aria-label={expanded ? "Minimizar player" : "Expandir player"}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Player expandido */}
      {expanded && (
        <div className="p-4 pt-0 h-[calc(100%-56px)] overflow-auto">
          <div className="flex flex-col h-full">
            {/* Área principal */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 items-center justify-center py-4">
              {/* Capa do álbum ou vídeo */}
              <div className="w-full max-w-xs aspect-square relative">
                {currentTrack?.isVideo ? (
                  <video 
                    ref={videoRef}
                    src={currentTrack.path} 
                    className="w-full h-full object-contain rounded-lg"
                    playsInline
                    muted
                  />
                ) : (
                  <AlbumArt 
                    src={currentTrack?.albumArt || '/default-album-art.png'} 
                    alt={currentTrack?.title || 'Album art'} 
                    size="lg"
                    isPlaying={isPlaying}
                    className="w-full h-full"
                  />
                )}
                
                {isPlaying && !currentTrack?.isVideo && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <MusicVisualizer isPlaying={isPlaying} />
                  </div>
                )}
              </div>
              
              {/* Informações e controles */}
              <div className="w-full max-w-md flex flex-col items-center md:items-start space-y-6">
                {/* Título e artista */}
                <div className="text-center md:text-left w-full">
                  <h2 className="text-2xl font-bold truncate">{currentTrack?.title || 'Nenhuma música selecionada'}</h2>
                  <p className="text-lg text-muted-foreground">{currentTrack?.artist || 'Selecione uma música para reproduzir'}</p>
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full space-y-2">
                  <div 
                    className="progress-slider h-2 cursor-pointer" 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                      handleSeek(percentage);
                    }}
                  >
                    <div 
                      className="progress-slider-fill" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{getCurrentTime()}</span>
                    <span>{getDuration()}</span>
                  </div>
                </div>
                
                {/* Controles de reprodução */}
                <div className="flex items-center justify-center space-x-4">
                  <button 
                    className="player-button" 
                    onClick={previous}
                    disabled={!currentTrack}
                    aria-label="Anterior"
                  >
                    <SkipBack size={24} />
                  </button>
                  
                  <button 
                    className="player-button primary w-12 h-12" 
                    onClick={toggle}
                    disabled={!currentTrack}
                    aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  <button 
                    className="player-button" 
                    onClick={next}
                    disabled={!currentTrack}
                    aria-label="Próxima"
                  >
                    <SkipForward size={24} />
                  </button>
                </div>
                
                {/* Controle de volume */}
                <div className="flex items-center space-x-2 w-full max-w-xs">
                  <button 
                    className="player-button" 
                    onClick={handleMuteToggle}
                    aria-label={isMuted ? "Ativar som" : "Mudo"}
                  >
                    {isMuted || playerVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  
                  <Slider
                    value={[isMuted ? 0 : playerVolume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                    onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                  />
                </div>
                
                {/* Controles de áudio avançados */}
                {currentTrack && (
                  <div className="w-full space-y-4 border-t border-border/50 pt-4 mt-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm">Remoção de vocal: {vocalRemoval ? 'Ativada' : 'Desativada'}</label>
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
        </div>
      )}
    </div>
  );
};

export default NowPlaying;
