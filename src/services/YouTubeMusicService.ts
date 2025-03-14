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
}

// Dados de exemplo para o YouTube Music
const SAMPLE_YOUTUBE_TRACKS: YouTubeTrack[] = [
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
    duration: 294
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
    duration: 367
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
    duration: 253
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
    duration: 282
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
    duration: 271
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
    duration: 237
  },
  {
    id: `youtube-${uuidv4()}`,
    title: 'Gangnam Style',
    artist: 'PSY',
    album: 'PSY 6 (Six Rules), Part 1',
    albumArt: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    path: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    source: 'youtube',
    videoId: '9bZkp7q19f0',
    streamUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    duration: 252
  }
];

class YouTubeMusicService {
  private initialized: boolean = false;

  constructor() {
    console.log('YouTubeMusicService inicializado');
  }

  // Inicializar o serviço
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Simulação de inicialização
      console.log('Inicializando serviço do YouTube Music...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.initialized = true;
      console.log('Serviço do YouTube Music inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar o serviço do YouTube Music:', error);
      return false;
    }
  }

  // Buscar músicas no YouTube Music
  async searchTracks(query: string): Promise<YouTubeTrack[]> {
    if (!query) return [];
    
    try {
      // Garantir que o serviço esteja inicializado
      if (!this.initialized) {
        await this.initialize();
      }

      // Simular uma busca filtrando os dados de exemplo
      console.log(`Buscando músicas no YouTube Music: "${query}"`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular tempo de resposta
      
      const normalizedQuery = query.toLowerCase();
      const filteredTracks = SAMPLE_YOUTUBE_TRACKS.filter(track => 
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery) ||
        (track.album && track.album.toLowerCase().includes(normalizedQuery))
      );
      
      // Se não houver resultados específicos, retornar todos os exemplos
      return filteredTracks.length > 0 ? filteredTracks : SAMPLE_YOUTUBE_TRACKS;
    } catch (error) {
      console.error('Erro ao buscar músicas no YouTube Music:', error);
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
      const track = SAMPLE_YOUTUBE_TRACKS.find(t => t.videoId === videoId);
      return track || null;
    } catch (error) {
      console.error('Erro ao obter detalhes da música:', error);
      return null;
    }
  }

  // Obter músicas populares (retorna todos os exemplos)
  async getPopularTracks(): Promise<YouTubeTrack[]> {
    try {
      // Garantir que o serviço esteja inicializado
      if (!this.initialized) {
        await this.initialize();
      }

      // Simular tempo de resposta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return SAMPLE_YOUTUBE_TRACKS;
    } catch (error) {
      console.error('Erro ao obter músicas populares:', error);
      return [];
    }
  }
}

// Exportar uma instância única do serviço
export const youtubeMusicService = new YouTubeMusicService();
