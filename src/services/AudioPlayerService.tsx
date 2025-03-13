import { Howl, Howler } from 'howler';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  path: string;
  duration?: number;
  format?: string;
  isVideo?: boolean;
  isKaraoke?: boolean;
  fileHandle?: FileSystemFileHandle;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  progress: number;
  duration: number;
  vocalRemoval: boolean;
  pitchShift: number;
  tempo: number;
  voiceType: string;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setCurrentTrack: (track: Track) => void;
  setPlaylist: (tracks: Track[]) => void;
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  seekTo: (time: number) => void;
  setVocalRemoval: (enabled: boolean) => void;
  setPitchShift: (semitones: number) => void;
  setTempo: (percentage: number) => void;
  setVoiceType: (type: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [playlist, setPlaylistState] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vocalRemoval, setVocalRemovalState] = useState(false);
  const [pitchShift, setPitchShiftState] = useState(0);
  const [tempo, setTempoState] = useState(100);
  const [voiceType, setVoiceTypeState] = useState('normal');
  
  const howlRef = useRef<Howl | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  
  // Inicializar o Howler
  useEffect(() => {
    Howler.autoUnlock = true;
    Howler.html5PoolSize = 10;
    
    return () => {
      // Limpar recursos quando o componente for desmontado
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);
  
  // Update progress
  const updateProgress = useCallback(() => {
    try {
      if (howlRef.current && isPlaying) {
        const seek = howlRef.current.seek() as number;
        setProgress(seek);
      } else if (videoRef.current && isPlaying) {
        setProgress(videoRef.current.currentTime);
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  }, [isPlaying]);
  
  // Set up progress timer
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = window.setInterval(updateProgress, 1000);
    } else if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying, updateProgress]);
  
  // Play the next track in the playlist
  const next = useCallback(() => {
    try {
      console.log('Próxima faixa');
      if (playlist.length > 0 && currentTrack) {
        const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
          const nextTrack = playlist[currentIndex + 1];
          setCurrentTrackState(nextTrack);
          // Criar nova instância de áudio para a próxima faixa
          if (!nextTrack.isVideo) {
            const howl = new Howl({
              src: [nextTrack.path],
              html5: true,
              volume: volume,
              onload: () => {
                console.log('Áudio carregado, duração:', howl.duration());
                setDuration(howl.duration());
              },
              onplay: () => {
                console.log('Áudio iniciado');
                setIsPlaying(true);
              },
              onpause: () => {
                console.log('Áudio pausado');
                setIsPlaying(false);
              },
              onstop: () => {
                console.log('Áudio parado');
                setIsPlaying(false);
                setProgress(0);
              },
              onend: () => {
                console.log('Áudio finalizado');
                setIsPlaying(false);
                // Não chamar next aqui para evitar recursão
              },
              onloaderror: (id, error) => {
                console.error('Erro ao carregar áudio:', error);
                toast({
                  title: 'Erro ao carregar áudio',
                  description: 'Não foi possível carregar o arquivo de áudio.',
                  variant: 'destructive',
                });
              },
              onplayerror: (id, error) => {
                console.error('Erro ao reproduzir áudio:', error);
                toast({
                  title: 'Erro ao reproduzir áudio',
                  description: 'Não foi possível reproduzir o arquivo de áudio.',
                  variant: 'destructive',
                });
              }
            });
            howlRef.current = howl;
            howl.play();
          }
        } else if (currentIndex === playlist.length - 1) {
          // Loop back to the first track
          const firstTrack = playlist[0];
          setCurrentTrackState(firstTrack);
          // Criar nova instância de áudio para a primeira faixa
          if (!firstTrack.isVideo) {
            const howl = new Howl({
              src: [firstTrack.path],
              html5: true,
              volume: volume,
              onload: () => {
                console.log('Áudio carregado, duração:', howl.duration());
                setDuration(howl.duration());
              },
              onplay: () => {
                console.log('Áudio iniciado');
                setIsPlaying(true);
              },
              onpause: () => {
                console.log('Áudio pausado');
                setIsPlaying(false);
              },
              onstop: () => {
                console.log('Áudio parado');
                setIsPlaying(false);
                setProgress(0);
              },
              onend: () => {
                console.log('Áudio finalizado');
                setIsPlaying(false);
                // Não chamar next aqui para evitar recursão
              },
              onloaderror: (id, error) => {
                console.error('Erro ao carregar áudio:', error);
                toast({
                  title: 'Erro ao carregar áudio',
                  description: 'Não foi possível carregar o arquivo de áudio.',
                  variant: 'destructive',
                });
              },
              onplayerror: (id, error) => {
                console.error('Erro ao reproduzir áudio:', error);
                toast({
                  title: 'Erro ao reproduzir áudio',
                  description: 'Não foi possível reproduzir o arquivo de áudio.',
                  variant: 'destructive',
                });
              }
            });
            howlRef.current = howl;
            howl.play();
          }
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir próxima faixa:', error);
    }
  }, [playlist, currentTrack, volume]);
  
  // Handle setting the current track
  const setCurrentTrack = useCallback((track: Track) => {
    try {
      console.log('Definindo faixa atual:', track);
      
      // Stop and unload any existing audio
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
      
      // Reset progress
      setProgress(0);
      
      // Set the new track
      setCurrentTrackState(track);
      
      // Create a new Howl instance for the track
      if (!track.isVideo) {
        console.log('Criando instância Howl para áudio:', track.path);
        
        // Configurar formato correto para MP3
        const format = track.format?.toLowerCase() || '';
        const formats = [];
        
        if (format === 'mp3') {
          formats.push('mp3');
        } else if (format) {
          formats.push(format);
        }
        
        const howl = new Howl({
          src: [track.path],
          html5: true,
          format: formats.length > 0 ? formats : undefined,
          volume: volume,
          onload: () => {
            console.log('Áudio carregado, duração:', howl.duration());
            setDuration(howl.duration());
          },
          onplay: () => {
            console.log('Áudio iniciado');
            setIsPlaying(true);
          },
          onpause: () => {
            console.log('Áudio pausado');
            setIsPlaying(false);
          },
          onstop: () => {
            console.log('Áudio parado');
            setIsPlaying(false);
            setProgress(0);
          },
          onend: () => {
            console.log('Áudio finalizado');
            setIsPlaying(false);
            // Chamar next de forma segura
            setTimeout(() => next(), 100);
          },
          onloaderror: (id, error) => {
            console.error('Erro ao carregar áudio:', error);
            toast({
              title: 'Erro ao carregar áudio',
              description: 'Não foi possível carregar o arquivo de áudio. Verifique se o formato é suportado.',
              variant: 'destructive',
            });
          },
          onplayerror: (id, error) => {
            console.error('Erro ao reproduzir áudio:', error);
            toast({
              title: 'Erro ao reproduzir áudio',
              description: 'Não foi possível reproduzir o arquivo de áudio. Tente novamente ou selecione outro arquivo.',
              variant: 'destructive',
            });
          }
        });
        
        // Apply karaoke effects if needed
        if (track.isKaraoke || vocalRemoval) {
          console.log('Aplicando efeitos de karaoke');
          // Apply vocal removal and other effects
          // This would require more complex audio processing
          // For now, we'll just set a placeholder
        }
        
        howlRef.current = howl;
      } else {
        // Handle video playback
        console.log('Configurando reprodução de vídeo:', track.path);
        // Criar um elemento de vídeo temporário para obter a duração
        const tempVideo = document.createElement('video');
        tempVideo.src = track.path;
        tempVideo.onloadedmetadata = () => {
          console.log('Vídeo carregado, duração:', tempVideo.duration);
          setDuration(tempVideo.duration);
        };
        tempVideo.onerror = (error) => {
          console.error('Erro ao carregar vídeo:', error);
          toast({
            title: 'Erro ao carregar vídeo',
            description: 'Não foi possível carregar o arquivo de vídeo.',
            variant: 'destructive',
          });
        };
      }
    } catch (error) {
      console.error('Erro ao definir faixa atual:', error);
      toast({
        title: 'Erro ao carregar mídia',
        description: 'Ocorreu um erro ao tentar carregar o arquivo de mídia.',
        variant: 'destructive',
      });
    }
  }, [volume, vocalRemoval, next]);
  
  // Play the current track
  const play = useCallback(() => {
    try {
      console.log('Iniciando reprodução');
      if (currentTrack) {
        if (howlRef.current) {
          howlRef.current.play();
        } else if (videoRef.current) {
          videoRef.current.play();
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir mídia:', error);
      toast({
        title: 'Erro ao reproduzir',
        description: 'Não foi possível iniciar a reprodução.',
        variant: 'destructive',
      });
    }
  }, [currentTrack]);
  
  // Pause the current track
  const pause = useCallback(() => {
    try {
      console.log('Pausando reprodução');
      if (howlRef.current) {
        howlRef.current.pause();
      } else if (videoRef.current) {
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('Erro ao pausar mídia:', error);
    }
  }, []);
  
  // Toggle play/pause
  const toggle = useCallback(() => {
    console.log('Alternando reprodução, isPlaying:', isPlaying);
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);
  
  // Stop the current track
  const stop = useCallback(() => {
    try {
      console.log('Parando reprodução');
      if (howlRef.current) {
        howlRef.current.stop();
      } else if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setProgress(0);
    } catch (error) {
      console.error('Erro ao parar mídia:', error);
    }
  }, []);
  
  // Play the previous track in the playlist
  const previous = useCallback(() => {
    try {
      console.log('Faixa anterior');
      if (playlist.length > 0 && currentTrack) {
        const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
        if (currentIndex > 0) {
          setCurrentTrack(playlist[currentIndex - 1]);
          play();
        } else if (currentIndex === 0) {
          // Loop back to the last track
          setCurrentTrack(playlist[playlist.length - 1]);
          play();
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir faixa anterior:', error);
    }
  }, [playlist, currentTrack, setCurrentTrack, play]);
  
  // Set the playlist
  const setPlaylist = useCallback((tracks: Track[]) => {
    console.log('Definindo playlist com', tracks.length, 'faixas');
    setPlaylistState(tracks);
  }, []);
  
  // Add a track to the playlist
  const addToPlaylist = useCallback((track: Track) => {
    console.log('Adicionando faixa à playlist:', track.title);
    setPlaylistState(prev => [...prev, track]);
  }, []);
  
  // Remove a track from the playlist
  const removeFromPlaylist = useCallback((trackId: string) => {
    console.log('Removendo faixa da playlist:', trackId);
    setPlaylistState(prev => prev.filter(track => track.id !== trackId));
  }, []);
  
  // Set the volume
  const setVolume = useCallback((newVolume: number) => {
    try {
      console.log('Definindo volume:', newVolume);
      setVolumeState(newVolume);
      if (howlRef.current) {
        howlRef.current.volume(newVolume);
      } else if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
    } catch (error) {
      console.error('Erro ao definir volume:', error);
    }
  }, []);
  
  // Set muted state
  const setMuted = useCallback((muted: boolean) => {
    try {
      console.log('Definindo mudo:', muted);
      setIsMuted(muted);
      if (howlRef.current) {
        howlRef.current.mute(muted);
      } else if (videoRef.current) {
        videoRef.current.muted = muted;
      }
    } catch (error) {
      console.error('Erro ao definir mudo:', error);
    }
  }, []);
  
  // Seek to a specific time
  const seekTo = useCallback((time: number) => {
    try {
      console.log('Buscando posição:', time);
      if (howlRef.current) {
        howlRef.current.seek(time);
        setProgress(time);
      } else if (videoRef.current) {
        videoRef.current.currentTime = time;
        setProgress(time);
      }
    } catch (error) {
      console.error('Erro ao buscar posição:', error);
    }
  }, []);
  
  // Set vocal removal
  const setVocalRemoval = useCallback((enabled: boolean) => {
    console.log('Definindo remoção de vocal:', enabled);
    setVocalRemovalState(enabled);
    // If we have a current track, we need to reload it with the new settings
    if (currentTrack) {
      const wasPlaying = isPlaying;
      const currentProgress = progress;
      setCurrentTrack(currentTrack);
      if (wasPlaying) {
        play();
        // Seek to the previous position
        setTimeout(() => {
          seekTo(currentProgress);
        }, 100);
      }
    }
  }, [currentTrack, isPlaying, progress, setCurrentTrack, play, seekTo]);
  
  // Set pitch shift
  const setPitchShift = useCallback((semitones: number) => {
    console.log('Definindo alteração de tom:', semitones);
    setPitchShiftState(semitones);
    // Apply pitch shift to current track
    // This would require more complex audio processing
    // For now, we'll just set the state
  }, []);
  
  // Set tempo
  const setTempo = useCallback((percentage: number) => {
    console.log('Definindo andamento:', percentage);
    setTempoState(percentage);
    // Apply tempo change to current track
    // This would require more complex audio processing
    // For now, we'll just set the state
  }, []);
  
  // Set voice type
  const setVoiceType = useCallback((type: string) => {
    console.log('Definindo tipo de voz:', type);
    setVoiceTypeState(type);
    // Apply voice type change to current track
    // This would require more complex audio processing
    // For now, we'll just set the state
  }, []);
  
  const value = {
    currentTrack,
    playlist,
    isPlaying,
    isMuted,
    volume,
    progress,
    duration,
    vocalRemoval,
    pitchShift,
    tempo,
    voiceType,
    play,
    pause,
    toggle,
    stop,
    next,
    previous,
    setCurrentTrack,
    setPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    setVolume,
    setMuted,
    seekTo,
    setVocalRemoval,
    setPitchShift,
    setTempo,
    setVoiceType,
  };
  
  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
