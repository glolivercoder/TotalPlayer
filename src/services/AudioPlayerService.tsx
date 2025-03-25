import { Howl, Howler } from 'howler';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { youtubeAudioService } from './YouTubeAudioService';
import { karaokeService } from './KaraokeService';
import { isMobileDevice } from './FileService';

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
  videoId?: string; 
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

interface HowlExtended extends Howl {
  _sounds?: Array<{
    _node?: {
      mediaElement?: HTMLMediaElement;
    };
  }>;
}

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
  
  const howlRef = useRef<HowlExtended | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    Howler.autoUnlock = true;
    Howler.html5PoolSize = 10;
    
    karaokeService.initialize().catch(error => {
      console.error('Erro ao inicializar serviço de karaoke:', error);
    });
    
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      karaokeService.clearResources();
    };
  }, []);
  
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
  
  const next = useCallback(() => {
    try {
      console.log('Próxima faixa');
      if (playlist.length > 0 && currentTrack) {
        const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
          const nextTrack = playlist[currentIndex + 1];
          setCurrentTrackState(nextTrack);
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
            howlRef.current = howl as HowlExtended;
            howl.play();
          }
        } else if (currentIndex === playlist.length - 1) {
          const firstTrack = playlist[0];
          setCurrentTrackState(firstTrack);
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
            howlRef.current = howl as HowlExtended;
            howl.play();
          }
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir próxima faixa:', error);
    }
  }, [playlist, currentTrack, volume]);
  
  const setCurrentTrack = useCallback(async (track: Track) => {
    console.log('Definindo faixa atual:', track);
    try {
      if (howlRef.current) {
        console.log('Parando áudio anterior');
        howlRef.current.unload();
        howlRef.current = null;
      }
      
      setCurrentTrackState(track);
      
      if (track.videoId) {
        console.log('Faixa do YouTube detectada, configurando player do YouTube');
        youtubeAudioService.setVideoId(track.videoId, track.isVideo || false);
        setDuration(0); 
      } else {
        if (!track.path) {
          throw new Error('Caminho do arquivo de áudio inválido');
        }
        
        try {
          console.log('Criando instância Howl para:', track.path);
          
          const isMobile = isMobileDevice();
          console.log('DEBUG: Dispositivo móvel detectado:', isMobile);
          
          const howl = new Howl({
            src: [track.path],
            html5: true, 
            volume: volume,
            preload: true,
            format: ['mp3', 'wav', 'ogg'],
            onload: () => {
              console.log('Áudio local carregado com sucesso, duração:', howl.duration());
              setDuration(howl.duration());
              
              if (isMobile) {
                setTimeout(() => {
                  console.log('DEBUG: Tentando reproduzir áudio em dispositivo móvel');
                  howl.play();
                }, 300);
              } else {
                howl.play();
              }
              
              toast({
                title: 'Reproduzindo música',
                description: `Reproduzindo "${track.title}" de ${track.artist}`,
                variant: 'default',
              });
            },
            onloaderror: (id, error) => {
              console.error('Erro ao carregar áudio local:', error);
              toast({
                title: 'Erro ao carregar áudio',
                description: 'Não foi possível carregar o arquivo de áudio. Verifique se o arquivo existe.',
                variant: 'destructive',
              });
            },
            onplayerror: (id, error) => {
              console.error('Erro ao reproduzir áudio local:', error);
              
              if (isMobile) {
                console.log('DEBUG: Tentando reproduzir novamente em dispositivo móvel após erro');
                setTimeout(() => {
                  try {
                    howl.play();
                  } catch (retryError) {
                    console.error('DEBUG: Erro ao tentar novamente:', retryError);
                  }
                }, 1000);
              }
              
              toast({
                title: 'Erro ao reproduzir áudio',
                description: 'Não foi possível reproduzir o arquivo de áudio. O formato pode não ser suportado.',
                variant: 'destructive',
              });
            },
            onplay: () => {
              console.log('Áudio local iniciado');
              setIsPlaying(true);
            },
            onpause: () => {
              console.log('Áudio local pausado');
              setIsPlaying(false);
            },
            onstop: () => {
              console.log('Áudio local parado');
              setIsPlaying(false);
              setProgress(0);
            },
            onend: () => {
              console.log('Áudio local finalizado');
              setIsPlaying(false);
              setTimeout(() => next(), 100);
            }
          });
          
          howlRef.current = howl as HowlExtended;
          
          if (!howlRef.current) {
            throw new Error('Falha ao criar player de áudio');
          }
          
          console.log('Howl criado com sucesso:', howlRef.current);
        } catch (howlError) {
          console.error('Erro ao criar Howl:', howlError);
          toast({
            title: 'Erro ao criar player',
            description: 'Não foi possível criar o player de áudio. Tente outro arquivo.',
            variant: 'destructive',
          });
        }
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
  
  const play = useCallback(() => {
    console.log('Tentando reproduzir áudio, estado atual:', { isPlaying, currentTrack });
    
    if (!currentTrack) {
      console.log('Nenhuma faixa selecionada para reproduzir');
      return;
    }
    
    try {
      if (currentTrack.videoId) {
        if (currentTrack.isVideo) {
          console.log('Reproduzindo vídeo do YouTube');
        } else {
          console.log('Reproduzindo áudio do YouTube');
          youtubeAudioService.playAudio(currentTrack.videoId);
        }
      } else if (howlRef.current) {
        console.log('Reproduzindo áudio local via Howl');
        howlRef.current.play();
      } else {
        console.error('Nenhum player de áudio disponível');
        if (currentTrack) {
          console.log('Tentando recriar o player...');
          setCurrentTrack(currentTrack);
        }
      }
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast({
        title: 'Erro ao reproduzir',
        description: 'Não foi possível reproduzir o áudio. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [currentTrack, isPlaying, youtubeAudioService, setCurrentTrack]);
  
  const pause = useCallback(() => {
    try {
      console.log('Pause');
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        youtubeAudioService.pauseAudio(currentTrack.videoId);
        setIsPlaying(false);
      } else if (howlRef.current) {
        howlRef.current.pause();
      }
    } catch (error) {
      console.error('Erro ao pausar:', error);
    }
  }, [currentTrack]);
  
  const toggle = useCallback(() => {
    try {
      console.log('Toggle');
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } catch (error) {
      console.error('Erro ao alternar reprodução:', error);
    }
  }, [isPlaying, pause, play]);
  
  const stop = useCallback(() => {
    try {
      console.log('Stop');
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        youtubeAudioService.stopAudio(currentTrack.videoId);
        setIsPlaying(false);
        setProgress(0);
      } else if (howlRef.current) {
        howlRef.current.stop();
      }
    } catch (error) {
      console.error('Erro ao parar:', error);
    }
  }, [currentTrack]);
  
  const previous = useCallback(() => {
    try {
      console.log('Faixa anterior');
      if (playlist.length > 0 && currentTrack) {
        const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
        if (currentIndex > 0) {
          setCurrentTrack(playlist[currentIndex - 1]);
          play();
        } else if (currentIndex === 0) {
          setCurrentTrack(playlist[playlist.length - 1]);
          play();
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir faixa anterior:', error);
    }
  }, [playlist, currentTrack, setCurrentTrack, play]);
  
  const setPlaylist = useCallback((tracks: Track[]) => {
    console.log('Definindo playlist com', tracks.length, 'faixas');
    setPlaylistState(tracks);
  }, []);
  
  const addToPlaylist = useCallback((track: Track) => {
    console.log('Adicionando faixa à playlist:', track.title);
    setPlaylistState(prev => [...prev, track]);
  }, []);
  
  const removeFromPlaylist = useCallback((trackId: string) => {
    console.log('Removendo faixa da playlist:', trackId);
    setPlaylistState(prev => prev.filter(track => track.id !== trackId));
  }, []);
  
  const setVolume = useCallback((newVolume: number) => {
    try {
      console.log('Set volume:', newVolume);
      setVolumeState(newVolume);
      
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        youtubeAudioService.setVolume(currentTrack.videoId, newVolume);
      } else if (howlRef.current) {
        howlRef.current.volume(newVolume);
      }
    } catch (error) {
      console.error('Erro ao definir volume:', error);
    }
  }, [currentTrack]);
  
  const setMuted = useCallback((muted: boolean) => {
    try {
      console.log('Set muted:', muted);
      setIsMuted(muted);
      
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        youtubeAudioService.setMuted(currentTrack.videoId, muted);
      } else if (howlRef.current) {
        howlRef.current.mute(muted);
      }
    } catch (error) {
      console.error('Erro ao definir mudo:', error);
    }
  }, [currentTrack]);
  
  const seekTo = useCallback((time: number) => {
    try {
      console.log('Seek to:', time);
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        youtubeAudioService.seekTo(currentTrack.videoId, time);
        setProgress(time);
      } else if (howlRef.current) {
        howlRef.current.seek(time);
        setProgress(time);
      }
    } catch (error) {
      console.error('Erro ao buscar posição:', error);
    }
  }, [currentTrack]);
  
  const setVocalRemoval = useCallback(async (enabled: boolean) => {
    console.log('Definindo remoção de vocal:', enabled);
    setVocalRemovalState(enabled);
    
    if (howlRef.current && currentTrack && !currentTrack.isVideo && !currentTrack.videoId) {
      try {
        const wasPlaying = howlRef.current.playing();
        const currentPosition = howlRef.current.seek();
        
        if (!karaokeService.isInitialized()) {
          toast({
            title: 'Inicializando processador de áudio',
            description: 'Aguarde enquanto preparamos o processador de áudio...',
          });
          await karaokeService.initialize();
        }
        
        if (enabled) {
          const audioElement = (howlRef.current as HowlExtended)._sounds?.[0]?._node?.mediaElement;
          
          if (audioElement) {
            if (wasPlaying) {
              howlRef.current.pause();
            }
            
            toast({
              title: 'Aplicando remoção de vocal',
              description: 'Processando áudio em tempo real...',
            });
            
            const audioCtx = karaokeService.getAudioContext();
            if (!audioCtx) {
              throw new Error('Contexto de áudio não disponível');
            }
            
            const source = audioCtx.createMediaElementSource(audioElement);
            
            const processedNode = karaokeService.applyVocalRemovalToNode(source);
            
            processedNode.connect(audioCtx.destination);
            
            if (wasPlaying) {
              howlRef.current.play();
            }
            
            toast({
              title: 'Remoção de vocal ativada',
              description: 'O efeito de remoção de vocal foi aplicado com sucesso.',
            });
          } else {
            if (currentTrack) {
              howlRef.current.unload();
              
              setCurrentTrack(currentTrack);
              
              setTimeout(() => {
                if (howlRef.current) {
                  howlRef.current.seek(currentPosition);
                  if (wasPlaying) {
                    howlRef.current.play();
                  }
                }
              }, 500);
              
              toast({
                title: 'Remoção de vocal ativada',
                description: 'A faixa foi recarregada com remoção de vocal.',
              });
            }
          }
        } else {
          if (currentTrack) {
            howlRef.current.unload();
            
            setCurrentTrack(currentTrack);
            
            setTimeout(() => {
              if (howlRef.current) {
                howlRef.current.seek(currentPosition);
                if (wasPlaying) {
                  howlRef.current.play();
                }
              }
            }, 500);
            
            toast({
              title: 'Remoção de vocal desativada',
              description: 'O áudio foi restaurado ao normal.',
            });
          }
        }
      } catch (error) {
        console.error('Erro ao aplicar remoção de vocal:', error);
        toast({
          title: 'Erro ao processar áudio',
          description: 'Não foi possível aplicar a remoção de vocal.',
          variant: 'destructive',
        });
      }
    } else if (currentTrack?.videoId) {
      toast({
        title: 'Recurso não disponível',
        description: 'A remoção de vocal não está disponível para vídeos do YouTube.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Nenhum áudio reproduzindo',
        description: 'Selecione um arquivo de áudio para aplicar a remoção de vocal.',
      });
    }
  }, [currentTrack, setCurrentTrack]);
  
  const setPitchShift = useCallback((semitones: number) => {
    console.log('DEBUG: setPitchShift chamado com semitones =', semitones);
    setPitchShiftState(semitones);
    
    if (howlRef.current && currentTrack && !currentTrack.isVideo && !currentTrack.videoId) {
      console.log('DEBUG: Aplicando pitch shift em áudio local');
      try {
        const wasPlaying = howlRef.current.playing();
        console.log('DEBUG: Estado de reprodução antes do pitch shift:', { wasPlaying });
        
        // Obter o elemento de áudio da Howl
        const mediaElement = (howlRef.current as HowlExtended)._sounds?.[0]?._node?.mediaElement;
        console.log('DEBUG: Elemento de áudio obtido:', mediaElement ? 'Sim' : 'Não');
        
        if (!mediaElement) {
          console.error('DEBUG: Elemento de áudio não disponível para pitch shift');
          toast({
            title: 'Não foi possível aplicar o efeito',
            description: 'O áudio atual não suporta ajuste de tom em tempo real.',
            variant: 'destructive',
          });
          return;
        }
        
        // Verificar se o AudioContext está em estado suspended e reativá-lo se necessário
        const audioContext = karaokeService.getAudioContext();
        if (audioContext && audioContext.state === 'suspended') {
          console.log('DEBUG: Reativando AudioContext que estava suspenso');
          audioContext.resume().then(() => {
            console.log('DEBUG: AudioContext reativado com sucesso');
          }).catch(err => {
            console.error('DEBUG: Erro ao reativar AudioContext:', err);
          });
        }
        
        // Aplicar o pitch shift usando o KaraokeService
        // Converter explicitamente para HTMLMediaElement para compatibilidade
        if (mediaElement instanceof HTMLMediaElement) {
          console.log('DEBUG: Aplicando pitch shift em HTMLMediaElement');
          karaokeService.applySoundTouchPitchShift(mediaElement, semitones);
          
          // Se estava tocando e parou, retomar a reprodução
          if (wasPlaying && howlRef.current && !howlRef.current.playing()) {
            console.log('DEBUG: Retomando reprodução após pitch shift');
            howlRef.current.play();
          }
          
          toast({
            title: 'Ajuste de tom aplicado',
            description: `O tom foi ajustado em ${semitones > 0 ? '+' : ''}${semitones} semitons.`,
          });
        } else {
          console.error('DEBUG: Elemento de áudio não é do tipo HTMLMediaElement');
          toast({
            title: 'Erro ao processar áudio',
            description: 'O tipo de elemento de áudio não é suportado para ajuste de tom.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('DEBUG: Erro ao aplicar pitch shift:', error);
        toast({
          title: 'Erro ao processar áudio',
          description: 'Não foi possível aplicar o ajuste de tom.',
          variant: 'destructive',
        });
      }
    } else if (currentTrack?.videoId && youtubeAudioService.isInitialized()) {
      // Para vídeos do YouTube, ajustar a velocidade de reprodução
      try {
        console.log('DEBUG: Tentando aplicar pitch shift em vídeo do YouTube');
        toast({
          title: 'Recurso limitado',
          description: 'O ajuste de tom para vídeos do YouTube é limitado e pode afetar a velocidade de reprodução.',
        });
      } catch (error) {
        console.error('DEBUG: Erro ao ajustar pitch para YouTube:', error);
        toast({
          title: 'Erro ao processar áudio',
          description: 'Não foi possível aplicar o ajuste de tom ao vídeo do YouTube.',
          variant: 'destructive',
        });
      }
    } else {
      console.log('DEBUG: Não foi possível aplicar pitch shift - nenhum áudio reproduzindo');
      toast({
        title: 'Nenhum áudio reproduzindo',
        description: 'Selecione um arquivo de áudio para aplicar o ajuste de tom.',
      });
    }
  }, [currentTrack, setPitchShiftState]);
  
  const setVoiceType = useCallback((type: string) => {
    console.log('Definindo tipo de voz:', type);
    setVoiceTypeState(type);
    
    const voicePresets: Record<string, number> = {
      'soprano': 4,
      'mezzo': 2,
      'tenor': -4,
      'baritone': -6,
      'normal': 0
    };
    
    const newPitchShift = voicePresets[type] || 0;
    setPitchShift(newPitchShift);
    
  }, [setPitchShift]);
  
  const setTempo = useCallback((percentage: number) => {
    console.log('Definindo tempo:', percentage);
    setTempoState(percentage);
    
    if (howlRef.current && currentTrack && !currentTrack.isVideo && !currentTrack.videoId) {
      try {
        howlRef.current.rate(percentage / 100);
        
        toast({
          title: 'Velocidade ajustada',
          description: `A velocidade foi ajustada para ${percentage}%.`,
        });
      } catch (error) {
        console.error('Erro ao ajustar tempo:', error);
        toast({
          title: 'Erro ao processar áudio',
          description: 'Não foi possível ajustar a velocidade.',
          variant: 'destructive',
        });
      }
    } else if (currentTrack?.videoId) {
      toast({
        title: 'Recurso não disponível',
        description: 'O ajuste de velocidade não está disponível para vídeos do YouTube.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Nenhum áudio reproduzindo',
        description: 'Selecione um arquivo de áudio para ajustar a velocidade.',
      });
    }
  }, [currentTrack]);
  
  const createYouTubePlayer = useCallback((videoId: string, container: HTMLElement) => {
    try {
      console.log('Criando player do YouTube para o vídeo:', videoId);
      
      if (!(window as any).YT || !(window as any).YT.Player) {
        throw new Error('API do YouTube não está disponível');
      }
      
      container.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player-iframe';
      container.appendChild(playerDiv);
      
      new (window as any).YT.Player(playerDiv.id, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1
        },
        events: {
          onReady: (event: any) => {
            console.log('Player do YouTube pronto');
            event.target.setVolume(volume * 100);
            event.target.playVideo();
            setIsPlaying(true);
            
            const duration = event.target.getDuration();
            console.log('Duração do vídeo do YouTube:', duration);
            setDuration(duration);
          },
          onStateChange: (event: any) => {
            console.log('Estado do player do YouTube alterado:', event.data);
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setTimeout(() => next(), 100);
            }
          },
          onError: (event: any) => {
            console.error('Erro no player do YouTube:', event.data);
            let errorMessage = 'Ocorreu um erro ao reproduzir o vídeo do YouTube.';
            
            switch(event.data) {
              case 2:
                errorMessage = 'Parâmetro inválido no ID do vídeo.';
                break;
              case 5:
                errorMessage = 'Erro no servidor HTML5 do YouTube.';
                break;
              case 100:
                errorMessage = 'Vídeo não encontrado ou removido.';
                break;
              case 101:
              case 150:
                errorMessage = 'O proprietário do vídeo não permite que ele seja reproduzido em players incorporados.';
                break;
            }
            
            toast({
              title: 'Erro ao reproduzir vídeo',
              description: errorMessage,
              variant: 'destructive',
            });
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar player do YouTube:', error);
      toast({
        title: 'Erro ao criar player',
        description: 'Não foi possível criar o player do YouTube. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  }, [volume, next]);
  
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
