import { toast } from '@/components/ui/use-toast';

/**
 * Serviço para extrair e reproduzir áudio de vídeos do YouTube
 * usando a API do YouTube IFrame.
 */
export class YouTubeAudioService {
  private initialized: boolean = false;
  private hiddenContainer: HTMLElement | null = null;
  private audioPlayers: Map<string, any> = new Map();
  private loadingPromise: Promise<boolean> | null = null;

  constructor() {
    console.log('YouTubeAudioService inicializado');
  }

  // Verificar se o serviço foi inicializado
  isInitialized(): boolean {
    return this.initialized;
  }

  // Inicializar o serviço
  async initialize(): Promise<boolean> {
    try {
      // Se já estiver inicializando, aguardar a inicialização atual
      if (this.loadingPromise) {
        return this.loadingPromise;
      }

      // Se já estiver inicializado, retornar
      if (this.initialized) {
        console.log('YouTubeAudioService já inicializado');
        return true;
      }

      console.log('Inicializando YouTubeAudioService...');
      
      // Criar um container oculto para os players de áudio
      if (!this.hiddenContainer) {
        this.hiddenContainer = document.createElement('div');
        this.hiddenContainer.id = 'youtube-audio-container';
        this.hiddenContainer.style.position = 'absolute';
        this.hiddenContainer.style.width = '1px';
        this.hiddenContainer.style.height = '1px';
        this.hiddenContainer.style.overflow = 'hidden';
        this.hiddenContainer.style.opacity = '0.01';
        this.hiddenContainer.style.pointerEvents = 'none';
        document.body.appendChild(this.hiddenContainer);
      }
      
      // Definir a promessa de carregamento
      this.loadingPromise = new Promise<boolean>((resolve) => {
        // Verificar se a API do YouTube já está carregada
        if ((window as any).YT && (window as any).YT.Player) {
          console.log('API do YouTube já está carregada');
          this.initialized = true;
          this.loadingPromise = null;
          resolve(true);
          return;
        }
        
        // Definir a função de callback para quando a API estiver carregada
        window.onYouTubeIframeAPIReady = () => {
          console.log('API do YouTube carregada com sucesso via YouTubeAudioService');
          this.initialized = true;
          this.loadingPromise = null;
          resolve(true);
        };
        
        // Carregar o script da API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => {
          console.error('Erro ao carregar a API do YouTube via YouTubeAudioService');
          this.loadingPromise = null;
          resolve(false);
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      });
      
      return this.loadingPromise;
    } catch (error) {
      console.error('Erro ao inicializar YouTubeAudioService:', error);
      this.loadingPromise = null;
      return false;
    }
  }

  // Criar um player de áudio do YouTube
  async createAudioPlayer(videoId: string, callbacks: {
    onReady?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
    onStateChange?: (state: number) => void;
    onDurationChange?: (duration: number) => void;
  }): Promise<any> {
    try {
      console.log('Criando player de áudio para o vídeo:', videoId);
      
      // Verificar se o serviço foi inicializado
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Não foi possível inicializar o serviço de áudio do YouTube');
        }
      }
      
      // Verificar se a API do YouTube está disponível
      if (!(window as any).YT || !(window as any).YT.Player) {
        console.log('Aguardando a API do YouTube carregar...');
        // Esperar a API carregar (máximo de 10 segundos)
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const checkYT = setInterval(() => {
            attempts++;
            if ((window as any).YT && (window as any).YT.Player) {
              clearInterval(checkYT);
              resolve();
            } else if (attempts > 100) { // 10 segundos (100ms * 100)
              clearInterval(checkYT);
              reject(new Error('Timeout ao aguardar a API do YouTube'));
            }
          }, 100);
        });
      }
      
      // Verificar novamente se a API está disponível
      if (!(window as any).YT || !(window as any).YT.Player) {
        throw new Error('API do YouTube não está disponível após aguardar');
      }
      
      // Verificar se já existe um player para este vídeo
      if (this.audioPlayers.has(videoId)) {
        console.log('Usando player existente para:', videoId);
        return this.audioPlayers.get(videoId);
      }
      
      // Criar um elemento para o player
      const playerId = `youtube-audio-${videoId}-${Date.now()}`;
      const playerElement = document.createElement('div');
      playerElement.id = playerId;
      
      // Adicionar o elemento ao container oculto
      if (!this.hiddenContainer) {
        this.hiddenContainer = document.createElement('div');
        this.hiddenContainer.id = 'youtube-audio-container';
        this.hiddenContainer.style.position = 'absolute';
        this.hiddenContainer.style.width = '1px';
        this.hiddenContainer.style.height = '1px';
        this.hiddenContainer.style.overflow = 'hidden';
        this.hiddenContainer.style.opacity = '0.01';
        this.hiddenContainer.style.pointerEvents = 'none';
        document.body.appendChild(this.hiddenContainer);
      }
      this.hiddenContainer.appendChild(playerElement);
      
      console.log('Criando novo player do YouTube para:', videoId);
      
      // Criar o player do YouTube
      return new Promise((resolve, reject) => {
        try {
          console.log('Iniciando criação do player com ID:', playerId);
          const player = new (window as any).YT.Player(playerId, {
            videoId: videoId,
            height: '1',
            width: '1',
            playerVars: {
              autoplay: 1,  // Iniciar automaticamente
              controls: 0,  // Sem controles
              disablekb: 1,  // Desabilitar teclado
              fs: 0,  // Sem tela cheia
              modestbranding: 1,  // Branding mínimo
              rel: 0,  // Sem vídeos relacionados
              iv_load_policy: 3,  // Sem anotações
              autohide: 1  // Esconder controles
            },
            events: {
              onReady: (event: any) => {
                console.log('Player de áudio do YouTube pronto');
                
                // Obter a duração do vídeo
                const duration = event.target.getDuration();
                console.log('Duração do áudio do YouTube:', duration);
                
                if (callbacks.onDurationChange) {
                  callbacks.onDurationChange(duration);
                }
                
                // Iniciar a reprodução
                event.target.playVideo();
                
                if (callbacks.onReady) {
                  callbacks.onReady();
                }
                
                // Armazenar o player no mapa
                this.audioPlayers.set(videoId, player);
                resolve(player);
              },
              onStateChange: (event: any) => {
                console.log('Estado do player de áudio do YouTube alterado:', event.data);
                
                if (callbacks.onStateChange) {
                  callbacks.onStateChange(event.data);
                }
                
                if (event.data === (window as any).YT.PlayerState.PLAYING) {
                  if (callbacks.onPlay) callbacks.onPlay();
                } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
                  if (callbacks.onPause) callbacks.onPause();
                } else if (event.data === (window as any).YT.PlayerState.ENDED) {
                  if (callbacks.onEnd) callbacks.onEnd();
                }
              },
              onError: (event: any) => {
                console.error('Erro no player de áudio do YouTube:', event.data);
                
                let errorMessage = 'Erro ao reproduzir áudio do YouTube';
                
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
                  title: 'Erro ao reproduzir áudio',
                  description: errorMessage,
                  variant: 'destructive',
                });
                
                if (callbacks.onError) {
                  callbacks.onError(event.data);
                }
                
                reject(new Error(`Erro no player de áudio do YouTube: ${event.data}`));
              }
            }
          });
          
          console.log('Player criado:', player);
          
          // Definir um timeout para caso o evento onReady não seja chamado
          setTimeout(() => {
            if (!this.audioPlayers.has(videoId)) {
              console.log('Timeout ao aguardar o player ficar pronto');
              this.audioPlayers.set(videoId, player);
              resolve(player);
            }
          }, 5000);
          
        } catch (error) {
          console.error('Erro ao criar player de áudio do YouTube:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Erro ao criar player de áudio do YouTube:', error);
      toast({
        title: 'Erro ao carregar áudio',
        description: 'Não foi possível carregar o áudio deste vídeo do YouTube.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  // Reproduzir áudio de um vídeo do YouTube
  playAudio(videoId: string, volume: number = 1.0): void {
    try {
      console.log('Reproduzindo áudio do YouTube:', videoId);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        player.setVolume(volume * 100);
        player.playVideo();
      } else {
        console.error('Player não encontrado para o vídeo:', videoId);
        toast({
          title: 'Erro ao reproduzir áudio',
          description: 'Não foi possível encontrar o player para este vídeo.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio do YouTube:', error);
      toast({
        title: 'Erro ao reproduzir áudio',
        description: 'Ocorreu um erro ao tentar reproduzir o áudio do YouTube.',
        variant: 'destructive',
      });
    }
  }

  // Pausar áudio de um vídeo do YouTube
  pauseAudio(videoId: string): void {
    try {
      console.log('Pausando áudio do YouTube:', videoId);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        player.pauseVideo();
      }
    } catch (error) {
      console.error('Erro ao pausar áudio do YouTube:', error);
    }
  }

  // Parar áudio de um vídeo do YouTube
  stopAudio(videoId: string): void {
    try {
      console.log('Parando áudio do YouTube:', videoId);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        player.stopVideo();
      }
    } catch (error) {
      console.error('Erro ao parar áudio do YouTube:', error);
    }
  }

  // Definir o volume do áudio
  setVolume(videoId: string, volume: number): void {
    try {
      console.log(`Definindo volume para ${volume * 100}%`);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        player.setVolume(volume * 100);
      }
    } catch (error) {
      console.error('Erro ao definir volume:', error);
    }
  }

  // Definir o estado de mudo
  setMuted(videoId: string, muted: boolean): void {
    try {
      console.log(`Definindo mudo: ${muted}`);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        if (muted) {
          player.mute();
        } else {
          player.unMute();
        }
      }
    } catch (error) {
      console.error('Erro ao definir mudo:', error);
    }
  }

  // Buscar para uma posição específica no áudio
  seekTo(videoId: string, seconds: number): void {
    try {
      console.log(`Buscando para ${seconds} segundos`);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        player.seekTo(seconds, true);
      }
    } catch (error) {
      console.error('Erro ao buscar posição:', error);
    }
  }

  // Obter a posição atual do áudio
  getCurrentTime(videoId: string): number {
    try {
      const player = this.audioPlayers.get(videoId);
      if (player) {
        return player.getCurrentTime();
      }
      return 0;
    } catch (error) {
      console.error('Erro ao obter posição atual:', error);
      return 0;
    }
  }

  // Remover um player de áudio
  removePlayer(videoId: string): void {
    try {
      console.log('Removendo player de áudio:', videoId);
      const player = this.audioPlayers.get(videoId);
      if (player) {
        player.stopVideo();
        player.destroy();
        this.audioPlayers.delete(videoId);
      }
    } catch (error) {
      console.error('Erro ao remover player de áudio:', error);
    }
  }

  // Limpar todos os players
  clearAllPlayers(): void {
    try {
      console.log('Limpando todos os players de áudio');
      for (const [videoId, player] of this.audioPlayers.entries()) {
        try {
          player.stopVideo();
          player.destroy();
        } catch (playerError) {
          console.error(`Erro ao limpar player ${videoId}:`, playerError);
        }
      }
      this.audioPlayers.clear();
      
      // Limpar o container
      if (this.hiddenContainer) {
        this.hiddenContainer.innerHTML = '';
      }
    } catch (error) {
      console.error('Erro ao limpar players de áudio:', error);
    }
  }
}

export const youtubeAudioService = new YouTubeAudioService();
