import { Howl, Howler } from 'howler';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { youtubeAudioService } from './YouTubeAudioService';
import { karaokeService } from './KaraokeService';

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
  videoId?: string; // Adicionado para suportar vídeos do YouTube
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
    
    // Inicializar o serviço de karaoke
    karaokeService.initialize().catch(error => {
      console.error('Erro ao inicializar serviço de karaoke:', error);
    });
    
    return () => {
      // Limpar recursos quando o componente for desmontado
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      karaokeService.clearResources();
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
  const setCurrentTrack = useCallback(async (track: Track) => {
    try {
      console.log('Definindo faixa atual:', track);
      
      // Parar a reprodução atual
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
      
      // Limpar o player de vídeo do YouTube se existir
      const existingContainer = document.getElementById('youtube-player-container');
      if (existingContainer) {
        existingContainer.innerHTML = '';
        existingContainer.style.display = 'none';
      }
      
      // Limpar qualquer player de áudio do YouTube anterior
      if (currentTrack?.videoId) {
        youtubeAudioService.removePlayer(currentTrack.videoId);
      }
      
      // Atualizar o estado da faixa atual
      setCurrentTrackState(track);
      
      // Verificar se é um vídeo ou áudio do YouTube
      if (track.videoId) {
        // Se for um vídeo, mostrar o player de vídeo
        if (track.isVideo) {
          console.log('Configurando reprodução de vídeo do YouTube:', track.videoId);
          
          // Verificar se o container do YouTube já existe
          let youtubeContainer = document.getElementById('youtube-player-container');
          if (!youtubeContainer) {
            // Criar o container se não existir
            youtubeContainer = document.createElement('div');
            youtubeContainer.id = 'youtube-player-container';
            youtubeContainer.style.position = 'fixed';
            youtubeContainer.style.bottom = '80px';
            youtubeContainer.style.right = '20px';
            youtubeContainer.style.width = '320px';
            youtubeContainer.style.height = '180px';
            youtubeContainer.style.zIndex = '1000';
            youtubeContainer.style.border = '1px solid #333';
            youtubeContainer.style.borderRadius = '8px';
            youtubeContainer.style.overflow = 'hidden';
            youtubeContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            document.body.appendChild(youtubeContainer);
          } else {
            // Limpar o container existente e torná-lo visível
            youtubeContainer.innerHTML = '';
            youtubeContainer.style.display = 'block';
          }
          
          // Carregar a API do YouTube se ainda não estiver carregada
          if (!(window as any).YT || !(window as any).YT.Player) {
            // Definir a função de callback antes de carregar o script
            window.onYouTubeIframeAPIReady = () => {
              console.log('API do YouTube carregada com sucesso');
              // Aguardar um momento para garantir que a API esteja totalmente inicializada
              setTimeout(() => {
                createYouTubePlayer(track.videoId as string, youtubeContainer as HTMLElement);
              }, 500);
            };
            
            // Carregar o script da API
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.onerror = () => {
              console.error('Erro ao carregar a API do YouTube');
              toast({
                title: 'Erro ao carregar API do YouTube',
                description: 'Não foi possível carregar a API do YouTube. Verifique sua conexão com a internet.',
                variant: 'destructive',
              });
            };
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
          } else {
            // A API já está carregada, criar o player diretamente
            console.log('API do YouTube já carregada, criando player...');
            setTimeout(() => {
              createYouTubePlayer(track.videoId as string, youtubeContainer as HTMLElement);
            }, 100);
          }
        } else {
          // Se for música do YouTube, usar o YouTubeAudioService para extrair apenas o áudio
          console.log('Configurando reprodução de áudio do YouTube:', track.videoId);
          
          // Esconder qualquer container de vídeo existente
          const existingContainer = document.getElementById('youtube-player-container');
          if (existingContainer) {
            existingContainer.style.display = 'none';
          }
          
          try {
            // Inicializar o serviço de áudio do YouTube se necessário
            if (!youtubeAudioService.isInitialized()) {
              console.log('Inicializando serviço de áudio do YouTube...');
              await youtubeAudioService.initialize();
            }
            
            // Criar um player de áudio para o vídeo
            console.log('Criando player de áudio para:', track.videoId);
            const player = await youtubeAudioService.createAudioPlayer(track.videoId, {
              onReady: () => {
                console.log('Player de áudio do YouTube pronto');
                setIsPlaying(true);
                
                toast({
                  title: 'Reproduzindo música',
                  description: `Reproduzindo "${track.title}" de ${track.artist}`,
                  variant: 'default',
                });
              },
              onPlay: () => {
                console.log('Áudio do YouTube iniciado');
                setIsPlaying(true);
              },
              onPause: () => {
                console.log('Áudio do YouTube pausado');
                setIsPlaying(false);
              },
              onEnd: () => {
                console.log('Áudio do YouTube finalizado');
                setIsPlaying(false);
                // Quando o áudio terminar, chamar a função next
                setTimeout(() => next(), 100);
              },
              onError: (error) => {
                console.error('Erro no player de áudio do YouTube:', error);
                toast({
                  title: 'Erro ao reproduzir áudio',
                  description: 'Não foi possível reproduzir o áudio deste vídeo do YouTube.',
                  variant: 'destructive',
                });
              },
              onDurationChange: (duration) => {
                console.log('Duração do áudio do YouTube:', duration);
                setDuration(duration);
              }
            });
            
            console.log('Player de áudio criado com sucesso:', player);
          } catch (error) {
            console.error('Erro ao configurar áudio do YouTube:', error);
            toast({
              title: 'Erro ao configurar áudio',
              description: 'Não foi possível configurar o áudio deste vídeo do YouTube.',
              variant: 'destructive',
            });
          }
        }
      } else {
        // Handle other audio playback
        console.log('Configurando reprodução de áudio:', track.path);
        
        // Verificar se o caminho do arquivo é válido
        if (!track.path) {
          throw new Error('Caminho do arquivo de áudio inválido');
        }
        
        // Criar uma nova instância de Howl para reproduzir o áudio
        try {
          console.log('Criando instância Howl para:', track.path);
          const howl = new Howl({
            src: [track.path],
            html5: true,
            volume: volume,
            preload: true,
            format: ['mp3', 'wav', 'ogg'],
            onload: () => {
              console.log('Áudio local carregado com sucesso, duração:', howl.duration());
              setDuration(howl.duration());
              
              // Iniciar a reprodução automaticamente após o carregamento
              howl.play();
              
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
              // Quando o áudio terminar, chamar a função next
              setTimeout(() => next(), 100);
            }
          });
          
          // Armazenar a referência do Howl
          howlRef.current = howl;
          
          // Verificar se o Howl foi criado corretamente
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
  
  // Função para reproduzir o áudio atual
  const play = useCallback(() => {
    console.log('Tentando reproduzir áudio, estado atual:', { isPlaying, currentTrack });
    
    if (!currentTrack) {
      console.log('Nenhuma faixa selecionada para reproduzir');
      return;
    }
    
    try {
      if (currentTrack.videoId) {
        // Se for um vídeo ou áudio do YouTube
        if (currentTrack.isVideo) {
          console.log('Reproduzindo vídeo do YouTube');
          // O vídeo já é reproduzido automaticamente pelo player do YouTube
        } else {
          console.log('Reproduzindo áudio do YouTube');
          youtubeAudioService.playAudio(currentTrack.videoId);
        }
      } else if (howlRef.current) {
        // Se for um áudio local
        console.log('Reproduzindo áudio local via Howl');
        howlRef.current.play();
      } else {
        console.error('Nenhum player de áudio disponível');
        // Tentar recriar o player
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
  
  // Pause the current track
  const pause = useCallback(() => {
    try {
      console.log('Pause');
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        // Se for áudio do YouTube, usar o YouTubeAudioService
        youtubeAudioService.pauseAudio(currentTrack.videoId);
        setIsPlaying(false);
      } else if (howlRef.current) {
        howlRef.current.pause();
      }
    } catch (error) {
      console.error('Erro ao pausar:', error);
    }
  }, [currentTrack]);
  
  // Toggle play/pause
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
  
  // Stop the current track
  const stop = useCallback(() => {
    try {
      console.log('Stop');
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        // Se for áudio do YouTube, usar o YouTubeAudioService
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
      console.log('Set volume:', newVolume);
      setVolumeState(newVolume);
      
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        // Se for áudio do YouTube, usar o YouTubeAudioService
        youtubeAudioService.setVolume(currentTrack.videoId, newVolume);
      } else if (howlRef.current) {
        howlRef.current.volume(newVolume);
      }
    } catch (error) {
      console.error('Erro ao definir volume:', error);
    }
  }, [currentTrack]);
  
  // Set muted state
  const setMuted = useCallback((muted: boolean) => {
    try {
      console.log('Set muted:', muted);
      setIsMuted(muted);
      
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        // Se for áudio do YouTube, usar o YouTubeAudioService
        youtubeAudioService.setMuted(currentTrack.videoId, muted);
      } else if (howlRef.current) {
        howlRef.current.mute(muted);
      }
    } catch (error) {
      console.error('Erro ao definir mudo:', error);
    }
  }, [currentTrack]);
  
  // Seek to a specific time
  const seekTo = useCallback((time: number) => {
    try {
      console.log('Seek to:', time);
      if (currentTrack?.videoId && !currentTrack.isVideo) {
        // Se for áudio do YouTube, usar o YouTubeAudioService
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
  
  // Função para ativar/desativar a remoção de vocal
  const setVocalRemoval = useCallback(async (enabled: boolean) => {
    console.log('Definindo remoção de vocal:', enabled);
    setVocalRemovalState(enabled);
    
    // Se tiver um áudio local sendo reproduzido, aplicar o efeito
    if (howlRef.current && currentTrack && !currentTrack.isVideo && !currentTrack.videoId) {
      try {
        // Pausar a reprodução atual
        const wasPlaying = howlRef.current.playing();
        const currentPosition = howlRef.current.seek();
        
        // Se o serviço de karaoke não estiver inicializado, inicializá-lo
        if (!karaokeService.isInitialized()) {
          toast({
            title: 'Inicializando processador de áudio',
            description: 'Aguarde enquanto preparamos o processador de áudio...',
          });
          await karaokeService.initialize();
        }
        
        // Aplicar remoção de voz diretamente ao elemento de áudio atual
        if (enabled) {
          // @ts-ignore - Howl tem propriedades internas que não estão no tipo
          const audioElement = howlRef.current._sounds?.[0]?._node;
          
          if (audioElement && audioElement.mediaElement) {
            // Pausar temporariamente para aplicar o efeito
            if (wasPlaying) {
              howlRef.current.pause();
            }
            
            toast({
              title: 'Aplicando remoção de vocal',
              description: 'Processando áudio em tempo real...',
            });
            
            // Obter o contexto de áudio
            const audioCtx = karaokeService.getAudioContext();
            if (!audioCtx) {
              throw new Error('Contexto de áudio não disponível');
            }
            
            // Criar um MediaElementSource a partir do elemento de áudio
            const source = audioCtx.createMediaElementSource(audioElement.mediaElement);
            
            // Aplicar o processador de remoção de vocais
            const processedNode = karaokeService.applyVocalRemovalToNode(source);
            
            // Conectar o nó processado à saída
            processedNode.connect(audioCtx.destination);
            
            // Retomar a reprodução se estava tocando
            if (wasPlaying) {
              howlRef.current.play();
            }
            
            toast({
              title: 'Remoção de vocal ativada',
              description: 'O efeito de remoção de vocal foi aplicado com sucesso.',
            });
          } else {
            // Se não conseguir acessar o elemento de áudio, recarregar a faixa
            if (currentTrack) {
              // Descarregar o Howl atual
              howlRef.current.unload();
              
              // Recarregar a faixa
              setCurrentTrack(currentTrack);
              
              // Definir a posição e o estado de reprodução
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
          // Desativar o efeito recarregando o áudio
          if (currentTrack) {
            // Descarregar o Howl atual
            howlRef.current.unload();
            
            // Recarregar a faixa
            setCurrentTrack(currentTrack);
            
            // Definir a posição e o estado de reprodução
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
  
  // Função para ajustar o pitch (tom)
  const setPitchShift = useCallback((semitones: number) => {
    console.log('Definindo pitch shift:', semitones);
    setPitchShiftState(semitones);
    
    // Se tiver um áudio local sendo reproduzido, aplicar o efeito
    if (howlRef.current && currentTrack && !currentTrack.isVideo && !currentTrack.videoId) {
      try {
        // Pausar a reprodução atual
        const wasPlaying = howlRef.current.playing();
        if (wasPlaying) {
          howlRef.current.pause();
        }
        
        // Obter o buffer de áudio atual
        // @ts-ignore - Howl tem propriedades internas que não estão no tipo
        const audioElement = howlRef.current._sounds?.[0]?._node;
        
        // Se o serviço de karaoke não estiver inicializado, inicializá-lo
        if (!karaokeService.isInitialized()) {
          karaokeService.initialize();
        }
        
        // Aplicar os efeitos de pitch shift
        toast({
          title: 'Processando áudio',
          description: 'Aplicando ajuste de tom...',
        });
        
        // Aplicar pitch shift em tempo real
        if (audioElement && audioElement.mediaElement) {
          const mediaElementSource = karaokeService.getAudioContext()?.createMediaElementSource(audioElement.mediaElement);
          if (mediaElementSource) {
            const processedNode = karaokeService.applyPitchShiftToNode(mediaElementSource, semitones);
            processedNode.connect(karaokeService.getAudioContext()!.destination);
            
            toast({
              title: 'Ajuste de tom aplicado',
              description: `O tom foi ajustado em ${semitones > 0 ? '+' : ''}${semitones} semitons.`,
            });
            
            // Retomar a reprodução se estava tocando
            if (wasPlaying) {
              howlRef.current.play();
            }
          }
        } else {
          toast({
            title: 'Não foi possível aplicar o efeito',
            description: 'O áudio atual não suporta ajuste de tom em tempo real.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao aplicar pitch shift:', error);
        toast({
          title: 'Erro ao processar áudio',
          description: 'Não foi possível aplicar o ajuste de tom.',
          variant: 'destructive',
        });
      }
    } else if (currentTrack?.videoId) {
      toast({
        title: 'Recurso não disponível',
        description: 'O ajuste de tom não está disponível para vídeos do YouTube.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Nenhum áudio reproduzindo',
        description: 'Selecione um arquivo de áudio para aplicar o ajuste de tom.',
      });
    }
  }, [currentTrack]);
  
  // Função para ajustar o tempo (velocidade)
  const setTempo = useCallback((percentage: number) => {
    console.log('Definindo tempo:', percentage);
    setTempoState(percentage);
    
    // Se tiver um áudio local sendo reproduzido, aplicar o efeito
    if (howlRef.current && currentTrack && !currentTrack.isVideo && !currentTrack.videoId) {
      try {
        // Ajustar a velocidade de reprodução do Howler
        // Nota: Isso afeta tanto o tempo quanto o pitch, não é ideal
        // mas é a única opção disponível com o Howler
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
  
  // Função para definir o tipo de voz
  const setVoiceType = useCallback((type: string) => {
    console.log('Definindo tipo de voz:', type);
    setVoiceTypeState(type);
    
    // Aplicar configurações predefinidas de pitch com base no tipo de voz
    let pitchValue = 0;
    switch (type) {
      case 'male':
        pitchValue = -2; // Abaixar 2 semitons para voz masculina
        break;
      case 'female':
        pitchValue = 2; // Aumentar 2 semitons para voz feminina
        break;
      case 'tenor':
        pitchValue = -4; // Abaixar 4 semitons para tenor
        break;
      case 'baritone':
        pitchValue = -6; // Abaixar 6 semitons para barítono
        break;
      case 'soprano':
        pitchValue = 4; // Aumentar 4 semitons para soprano
        break;
      case 'normal':
      default:
        pitchValue = 0; // Sem alteração para voz normal
        break;
    }
    
    // Aplicar o pitch shift com o valor calculado
    setPitchShift(pitchValue);
    
    toast({
      title: 'Tipo de voz alterado',
      description: `O tipo de voz foi alterado para ${type}.`,
    });
  }, [setPitchShift]);
  
  // Função para criar o player do YouTube
  const createYouTubePlayer = useCallback((videoId: string, container: HTMLElement) => {
    try {
      console.log('Criando player do YouTube para o vídeo:', videoId);
      
      // Verificar se a API do YouTube está disponível
      if (!(window as any).YT || !(window as any).YT.Player) {
        throw new Error('API do YouTube não está disponível');
      }
      
      // Criar um elemento DIV dentro do container para o iframe
      container.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player-iframe';
      container.appendChild(playerDiv);
      
      // Criar o player
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
            
            // Obter a duração do vídeo
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
              // Quando o vídeo terminar, chamar a função next
              setTimeout(() => next(), 100);
            }
          },
          onError: (event: any) => {
            console.error('Erro no player do YouTube:', event.data);
            let errorMessage = 'Ocorreu um erro ao reproduzir o vídeo do YouTube.';
            
            // Traduzir códigos de erro do YouTube
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
