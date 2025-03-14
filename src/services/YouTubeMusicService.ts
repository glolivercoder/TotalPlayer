import { v4 as uuidv4 } from 'uuid';

// Interface para os resultados da busca do YouTube Music
export interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  videoId: string;
  duration?: number;
  contentType?: 'music' | 'video';
}

// Interface para faixas do YouTube Music
export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  path: string;
  source: 'youtube';
  videoId: string;
  streamUrl: string;
  duration?: number;
  contentType: 'music' | 'video';
}

// Dados de exemplo para o YouTube Music (músicas)
const SAMPLE_YOUTUBE_MUSIC_TRACKS: YouTubeTrack[] = [
  {
    id: `youtube-${uuidv4()}`,
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    albumArt: 'https://i.ytimg.com/vi/Zi_XfUwnJng/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=Zi_XfUwnJng',
    source: 'youtube',
    videoId: 'Zi_XfUwnJng',
    streamUrl: 'https://www.youtube.com/watch?v=Zi_XfUwnJng',
    duration: 294,
    contentType: 'music'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    albumArt: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    source: 'youtube',
    videoId: 'fJ9rUzIMcZQ',
    streamUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    duration: 367,
    contentType: 'music'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    albumArt: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    source: 'youtube',
    videoId: 'JGwWNGJdvx8',
    streamUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    duration: 253,
    contentType: 'music'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    album: 'VIDA',
    albumArt: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    source: 'youtube',
    videoId: 'kJQP7kiw5Fk',
    streamUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    duration: 282,
    contentType: 'music'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    album: 'Uptown Special',
    albumArt: 'https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=OPf0YbXqDm0',
    source: 'youtube',
    videoId: 'OPf0YbXqDm0',
    streamUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0',
    duration: 271,
    contentType: 'music'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'See You Again',
    artist: 'Wiz Khalifa ft. Charlie Puth',
    album: 'Furious 7: Original Motion Picture Soundtrack',
    albumArt: 'https://i.ytimg.com/vi/RgKAFK5djSk/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    source: 'youtube',
    videoId: 'RgKAFK5djSk',
    streamUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    duration: 237,
    contentType: 'music'
  }
];

// Dados de exemplo para o YouTube Music (vídeos)
const SAMPLE_YOUTUBE_VIDEO_TRACKS: YouTubeTrack[] = [
  {
    id: `youtube-${uuidv4()}`,
    title: 'React JS Tutorial for Beginners',
    artist: 'Programming with Mosh',
    albumArt: 'https://i.ytimg.com/vi/SqcY0GlETPk/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    source: 'youtube',
    videoId: 'SqcY0GlETPk',
    streamUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    duration: 2400,
    contentType: 'video'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'How to Make a Website with React JS',
    artist: 'Brian Design',
    albumArt: 'https://i.ytimg.com/vi/I2UBjN5ER4s/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=I2UBjN5ER4s',
    source: 'youtube',
    videoId: 'I2UBjN5ER4s',
    streamUrl: 'https://www.youtube.com/watch?v=I2UBjN5ER4s',
    duration: 3600,
    contentType: 'video'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'TypeScript Course for Beginners',
    artist: 'Academind',
    albumArt: 'https://i.ytimg.com/vi/BwuLxPH8IDs/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
    source: 'youtube',
    videoId: 'BwuLxPH8IDs',
    streamUrl: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
    duration: 3200,
    contentType: 'video'
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'Next.js Crash Course',
    artist: 'Traversy Media',
    albumArt: 'https://i.ytimg.com/vi/mTz0GXj8NN0/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=mTz0GXj8NN0',
    source: 'youtube',
    videoId: 'mTz0GXj8NN0',
    streamUrl: 'https://www.youtube.com/watch?v=mTz0GXj8NN0',
    duration: 1800,
    contentType: 'video'
  }
];

class YouTubeMusicService {
  private initialized: boolean = false;

  constructor() {
    console.log('YouTubeMusicService inicializado');
  }

  // Inicializar o serviço
  async initialize(): Promise<boolean> {
    try {
      if (this.initialized) {
        console.log('YouTubeMusicService já inicializado');
        return true;
      }

      console.log('Inicializando YouTubeMusicService...');
      
      // Verificar se a API do YouTube está carregada
      if (typeof window !== 'undefined' && !(window as any).YT) {
        return new Promise<boolean>((resolve) => {
          // Definir a função de callback para quando a API estiver carregada
          window.onYouTubeIframeAPIReady = () => {
            console.log('API do YouTube carregada com sucesso via YouTubeMusicService');
            this.initialized = true;
            resolve(true);
          };
          
          // Carregar o script da API
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.onerror = () => {
            console.error('Erro ao carregar a API do YouTube via YouTubeMusicService');
            resolve(false);
          };
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        });
      }
      
      // Simular tempo de inicialização (em uma aplicação real, isso seria a autenticação com a API)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.initialized = true;
      console.log('YouTubeMusicService inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar YouTubeMusicService:', error);
      return false;
    }
  }

  // Buscar músicas no YouTube Music
  async searchTracks(query: string, contentType: 'music' | 'video' = 'music'): Promise<YouTubeTrack[]> {
    if (!query) return [];
    
    try {
      // Garantir que o serviço esteja inicializado
      if (!this.initialized) {
        await this.initialize();
      }

      // Simular uma busca filtrando os dados de exemplo
      console.log(`Buscando ${contentType === 'music' ? 'músicas' : 'vídeos'} no YouTube: "${query}"`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular tempo de resposta
      
      const normalizedQuery = query.toLowerCase();
      const tracksToSearch = contentType === 'music' ? SAMPLE_YOUTUBE_MUSIC_TRACKS : SAMPLE_YOUTUBE_VIDEO_TRACKS;
      
      const filteredTracks = tracksToSearch.filter(track => 
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery) ||
        (track.album && track.album.toLowerCase().includes(normalizedQuery))
      );
      
      // Se não houver resultados específicos, retornar todos os exemplos do tipo selecionado
      return filteredTracks.length > 0 ? filteredTracks : tracksToSearch;
    } catch (error) {
      console.error(`Erro ao buscar ${contentType === 'music' ? 'músicas' : 'vídeos'} no YouTube:`, error);
      return [];
    }
  }

  // Obter detalhes de uma música específica
  async getTrackDetails(videoId: string): Promise<YouTubeTrack | null> {
    try {
      // Garantir que o serviço esteja inicializado
      if (!this.initialized) {
        await this.initialize();
      }

      // Buscar nos dados de exemplo
      const track = [...SAMPLE_YOUTUBE_MUSIC_TRACKS, ...SAMPLE_YOUTUBE_VIDEO_TRACKS].find(t => t.videoId === videoId);
      return track || null;
    } catch (error) {
      console.error('Erro ao obter detalhes da música:', error);
      return null;
    }
  }

  // Obter músicas populares (retorna todos os exemplos)
  async getPopularTracks(contentType: 'music' | 'video' = 'music'): Promise<YouTubeTrack[]> {
    try {
      // Garantir que o serviço esteja inicializado
      if (!this.initialized) {
        await this.initialize();
      }

      // Simular tempo de resposta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return contentType === 'music' ? SAMPLE_YOUTUBE_MUSIC_TRACKS : SAMPLE_YOUTUBE_VIDEO_TRACKS;
    } catch (error) {
      console.error(`Erro ao obter ${contentType === 'music' ? 'músicas' : 'vídeos'} populares:`, error);
      return [];
    }
  }
}

// Exportar uma instância única do serviço
export const youtubeMusicService = new YouTubeMusicService();
