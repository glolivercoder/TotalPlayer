import React, { useState, useEffect } from 'react';
import { Search, Music, Download, Globe, Filter, Play, Youtube, Video, Music2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAudioPlayer, Track } from '@/services/AudioPlayerService';
import { openMediaFilePicker } from '@/services/FileService';
import { youtubeMusicService, YouTubeTrack } from '@/services/YouTubeMusicService';
import AlbumArt from '@/components/AlbumArt';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Declaração global para a API do YouTube
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Definição da interface para resultados de streaming
interface StreamTrack extends Track {
  source: 'stream';
  streamUrl: string;
}

// Definição da interface para resultados locais
interface LocalTrack extends Track {
  source: 'local';
}

// Tipo unificado para resultados de busca
type SearchResult = LocalTrack | StreamTrack | YouTubeTrack;

// Exemplos de músicas de streaming com URLs reais
const SAMPLE_STREAM_TRACKS: StreamTrack[] = [
  {
    id: 'stream-1',
    title: 'Acoustic Breeze',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/10/30/23-46-27-824_200x200.jpg',
    path: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_946f4e2cec.mp3?filename=acoustic-breeze-138605.mp3',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_946f4e2cec.mp3?filename=acoustic-breeze-138605.mp3'
  },
  {
    id: 'stream-2',
    title: 'Creative Minds',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/03/08/08-00-36-517_200x200.png',
    path: 'https://cdn.pixabay.com/download/audio/2022/03/08/audio_c3b7a16d87.mp3?filename=creative-minds-135224.mp3',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/08/audio_c3b7a16d87.mp3?filename=creative-minds-135224.mp3'
  },
  {
    id: 'stream-3',
    title: 'Happy Rock',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2021/11/25/08-10-56-517_200x200.png',
    path: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_3b7a8aba6e.mp3?filename=happy-rock-118985.mp3',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_3b7a8aba6e.mp3?filename=happy-rock-118985.mp3'
  },
  {
    id: 'stream-4',
    title: 'Jazzy Frenchy',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/03/15/09-33-46-517_200x200.png',
    path: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749090c.mp3?filename=jazzy-frenchy-164953.mp3',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749090c.mp3?filename=jazzy-frenchy-164953.mp3'
  },
  {
    id: 'stream-5',
    title: 'Ukulele',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/03/15/09-38-01-517_200x200.png',
    path: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_db6e6dc93a.mp3?filename=ukulele-163106.mp3',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_db6e6dc93a.mp3?filename=ukulele-163106.mp3'
  }
];

const LibraryPage = () => {
  const { toast } = useToast();
  const { currentTrack, isPlaying, addToPlaylist, setCurrentTrack, next } = useAudioPlayer();
  
  // Estado para controlar os resultados da busca
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'local' | 'youtube'>('all');
  const [youtubeContentType, setYoutubeContentType] = useState<'music' | 'video'>('music');
  
  // Estado para controlar as músicas locais
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  
  // Estado para controlar as músicas do YouTube
  const [youtubeTracks, setYoutubeTracks] = useState<YouTubeTrack[]>([]);
  
  // Estado para controlar a aba atual
  const [activeTab, setActiveTab] = useState('local');

  // Carregar músicas populares do YouTube Music quando a aba for selecionada
  useEffect(() => {
    const loadPopularYouTubeTracks = async () => {
      // Só carregar se a aba do YouTube estiver ativa
      if (activeTab === 'youtube') {
        try {
          // Limpar os resultados anteriores
          setYoutubeTracks([]);
          
          toast({
            title: 'Carregando músicas',
            description: `Buscando ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} populares no YouTube...`,
            variant: 'default'
          });
          
          // Inicializar a API do YouTube Music
          await youtubeMusicService.initialize();
          
          // Buscar músicas populares
          const tracks = await youtubeMusicService.getPopularTracks(youtubeContentType);
          
          if (tracks.length > 0) {
            setYoutubeTracks(tracks);
            toast({
              title: 'Conteúdo carregado',
              description: `${tracks.length} ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} populares foram carregados`,
              variant: 'default'
            });
          } else {
            toast({
              title: 'Nenhum conteúdo encontrado',
              description: `Não foi possível carregar ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} populares`,
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Erro ao carregar conteúdo do YouTube:', error);
          toast({
            title: 'Erro ao carregar conteúdo',
            description: 'Ocorreu um erro ao carregar conteúdo do YouTube',
            variant: 'destructive'
          });
        }
      }
    };
    
    loadPopularYouTubeTracks();
  }, [activeTab, toast, youtubeContentType]);

  // Efeito para atualizar os resultados quando o tipo de conteúdo do YouTube mudar
  useEffect(() => {
    if (activeTab === 'youtube') {
      const loadYouTubeContent = async () => {
        try {
          // Limpar os resultados anteriores
          setYoutubeTracks([]);
          
          toast({
            title: 'Carregando conteúdo',
            description: `Buscando ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} no YouTube...`,
            variant: 'default'
          });
          
          // Buscar conteúdo do tipo selecionado
          const tracks = await youtubeMusicService.getPopularTracks(youtubeContentType);
          
          if (tracks.length > 0) {
            setYoutubeTracks(tracks);
            toast({
              title: 'Conteúdo carregado',
              description: `${tracks.length} ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} foram carregados`,
              variant: 'default'
            });
          }
        } catch (error) {
          console.error('Erro ao carregar conteúdo do YouTube:', error);
        }
      };
      
      loadYouTubeContent();
    }
  }, [youtubeContentType, activeTab, toast]);

  // Função para buscar músicas locais
  const searchLocalTracks = (query: string) => {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase();
    return localTracks.filter(track => 
      track.title.toLowerCase().includes(normalizedQuery) ||
      track.artist.toLowerCase().includes(normalizedQuery) ||
      (track.album && track.album.toLowerCase().includes(normalizedQuery))
    );
  };

  // Função para buscar músicas no YouTube Music
  const searchYoutubeTracks = async (query: string): Promise<YouTubeTrack[]> => {
    if (!query) return [];
    
    try {
      // Garantir que o serviço esteja inicializado
      await youtubeMusicService.initialize();
      
      toast({
        title: 'Buscando no YouTube',
        description: `Buscando ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} no YouTube...`,
        variant: 'default'
      });
      
      const tracks = await youtubeMusicService.searchTracks(query, youtubeContentType);
      return tracks;
    } catch (error) {
      console.error(`Erro ao buscar ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} no YouTube:`, error);
      toast({
        title: 'Erro na busca',
        description: `Não foi possível buscar ${youtubeContentType === 'music' ? 'músicas' : 'vídeos'} no YouTube. Tente novamente mais tarde.`,
        variant: 'destructive'
      });
      return [];
    }
  };

  // Função para realizar a busca combinada
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Busca vazia',
        description: 'Digite algo para buscar',
        variant: 'default'
      });
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      let results: SearchResult[] = [];
      
      // Buscar em fontes locais se necessário
      if (searchType === 'all' || searchType === 'local') {
        const localResults = searchLocalTracks(searchQuery);
        results = [...results, ...localResults];
      }
      
      // Buscar no YouTube se necessário
      if (searchType === 'all' || searchType === 'youtube') {
        const youtubeResults = await searchYoutubeTracks(searchQuery);
        results = [...results, ...youtubeResults];
        
        // Se a busca for especificamente para YouTube, atualizar a aba do YouTube
        if (searchType === 'youtube') {
          setYoutubeTracks(youtubeResults);
          setActiveTab('youtube');
          
          if (youtubeResults.length === 0) {
            toast({
              title: 'Nenhum resultado',
              description: `Nenhum conteúdo encontrado para "${searchQuery}" no YouTube`,
              variant: 'default'
            });
          } else {
            toast({
              title: 'Busca concluída',
              description: `${youtubeResults.length} resultados encontrados no YouTube`,
              variant: 'default'
            });
          }
          setIsSearching(false);
          return;
        }
      }
      
      // Atualizar resultados e mudar para a aba de resultados
      setSearchResults(results);
      setActiveTab('search');
      
      if (results.length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: `Nenhum conteúdo encontrado para "${searchQuery}"`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Busca concluída',
          description: `${results.length} resultados encontrados`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro na busca',
        description: 'Ocorreu um erro ao realizar a busca. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Carregar músicas locais ao iniciar
  useEffect(() => {
    const loadLocalTracks = async () => {
      try {
        // Tentar carregar do localStorage
        const savedTracks = localStorage.getItem('localTracks');
        if (savedTracks) {
          const parsedTracks = JSON.parse(savedTracks) as LocalTrack[];
          setLocalTracks(parsedTracks);
        }
      } catch (error) {
        console.error('Erro ao carregar músicas locais:', error);
      }
    };
    
    loadLocalTracks();
  }, []);

  // Função para reproduzir uma música
  const playTrack = async (track: SearchResult) => {
    try {
      console.log('Reproduzindo faixa:', track);
      
      // Verificar o tipo de faixa
      if ('source' in track && track.source === 'stream') {
        // Verificar se a URL de streaming é válida
        if (!track.streamUrl) {
          throw new Error('URL de streaming inválida');
        }
        
        const streamTrack: Track = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          path: track.streamUrl,
          duration: track.duration
        };
        
        console.log('Adicionando faixa de streaming a playlist:', streamTrack);
        addToPlaylist(streamTrack);
        setCurrentTrack(streamTrack);
        
        toast({
          title: 'Reproduzindo música',
          description: `Reproduzindo "${track.title}" de ${track.artist}`,
          variant: 'default'
        });
      } else if ('source' in track && track.source === 'youtube') {
        // Verificar se a URL do YouTube é válida
        if (!track.videoId) {
          throw new Error('ID do vídeo do YouTube inválido');
        }
        
        // Criar um track com o videoId para o AudioPlayerService
        const youtubeTrack: Track = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          path: track.streamUrl || '',
          videoId: track.videoId,
          isVideo: track.contentType === 'video'
        };
        
        console.log(`Adicionando ${track.contentType === 'video' ? 'vídeo' : 'música'} do YouTube a playlist:`, youtubeTrack);
        addToPlaylist(youtubeTrack);
        
        // Mostrar toast de carregamento
        toast({
          title: track.contentType === 'video' ? 'Carregando vídeo' : 'Carregando áudio',
          description: `Preparando para reproduzir "${track.title}"...`,
          variant: 'default'
        });
        
        // Definir a faixa atual
        await setCurrentTrack(youtubeTrack);
      } else {
        // Para músicas locais, podemos usar diretamente
        console.log('Adicionando faixa local a playlist:', track);
        addToPlaylist(track);
        setCurrentTrack(track);
        
        toast({
          title: 'Reproduzindo música',
          description: `Reproduzindo "${track.title}" de ${track.artist}`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erro ao reproduzir música:', error);
      toast({
        title: 'Erro ao reproduzir',
        description: 'Não foi possível reproduzir esta música. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Função para adicionar mais músicas locais
  const handleAddLocalMusic = async () => {
    try {
      const track = await openMediaFilePicker();
      if (track) {
        const localTrack: LocalTrack = {
          ...track,
          source: 'local'
        };
        
        // Adicionar a lista local
        const updatedTracks = [...localTracks, localTrack];
        setLocalTracks(updatedTracks);
        
        // Salvar no localStorage
        localStorage.setItem('localTracks', JSON.stringify(updatedTracks));
        
        // Adicionar a playlist e reproduzir
        addToPlaylist(track);
        setCurrentTrack(track);
        
        toast({
          title: 'Música adicionada',
          description: `"${track.title}" foi adicionada a sua biblioteca`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar música local:', error);
      toast({
        title: 'Erro ao adicionar música',
        description: 'Não foi possível adicionar a música a biblioteca',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container py-4 space-y-6 overflow-y-auto pb-32">
      <h1 className="text-2xl font-bold">Biblioteca</h1>
      
      {/* Barra de busca */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar músicas, artistas ou álbuns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            className="pl-8 w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Select 
          value={searchType} 
          onValueChange={(value) => setSearchType(value as 'all' | 'local' | 'youtube')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo de busca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
        
        {searchType === 'youtube' && (
          <RadioGroup 
            value={youtubeContentType} 
            onValueChange={(value) => setYoutubeContentType(value as 'music' | 'video')}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="music" id="music" />
              <Label htmlFor="music" className="flex items-center">
                <Music2 className="mr-1 h-4 w-4" />
                Música
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video" className="flex items-center">
                <Video className="mr-1 h-4 w-4" />
                Vídeo
              </Label>
            </div>
          </RadioGroup>
        )}
        
        <Button 
          onClick={performSearch} 
          disabled={isSearching}
          size="icon"
          className="h-10 w-10"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tabs para diferentes seções */}
      <Tabs defaultValue="local" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Resultados</TabsTrigger>
          <TabsTrigger value="youtube">YouTube Music</TabsTrigger>
          <TabsTrigger value="local">Biblioteca Local</TabsTrigger>
        </TabsList>
        
        {/* Resultados de busca */}
        <TabsContent value="search" className="space-y-4">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((track) => (
                <Card key={track.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center p-2">
                      <div className="relative mr-3">
                        <AlbumArt 
                          src={track.albumArt} 
                          alt={track.title} 
                          size="sm"
                          isPlaying={isPlaying && currentTrack?.id === track.id}
                        />
                        {'source' in track && track.source === 'youtube' && (
                          <div className="absolute top-0 right-0 bg-red-500 rounded-full p-1">
                            <Youtube className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                        {track.album && (
                          <p className="text-xs text-muted-foreground truncate">{track.album}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => playTrack(track)}
                          aria-label="Reproduzir"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Play className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Music className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-2 text-lg font-medium">Nenhum resultado</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 
                  `Nenhuma música encontrada para "${searchQuery}"` : 
                  'Use a barra de busca para encontrar músicas'}
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Seção do YouTube Music */}
        <TabsContent value="youtube" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {youtubeContentType === 'music' ? 'Músicas do YouTube' : 'Vídeos do YouTube'}
            </h2>
            <div className="flex items-center space-x-2">
              <RadioGroup 
                value={youtubeContentType} 
                onValueChange={(value) => setYoutubeContentType(value as 'music' | 'video')}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="music" id="youtube-music" />
                  <Label htmlFor="youtube-music" className="flex items-center">
                    <Music2 className="mr-1 h-4 w-4" />
                    Música
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="youtube-video" />
                  <Label htmlFor="youtube-video" className="flex items-center">
                    <Video className="mr-1 h-4 w-4" />
                    Vídeo
                  </Label>
                </div>
              </RadioGroup>
              
              <Button 
                onClick={() => {
                  setSearchType('youtube');
                  document.querySelector('input')?.focus();
                }}
                variant="outline"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar mais
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeTracks.map((track) => (
              <Card key={track.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center p-2">
                    <div className="relative mr-3">
                      <AlbumArt 
                        src={track.albumArt} 
                        alt={track.title} 
                        size="sm"
                        isPlaying={isPlaying && currentTrack?.id === track.id}
                      />
                      <div className="absolute top-0 right-0 bg-red-500 rounded-full p-1">
                        {track.contentType === 'music' ? (
                          <Music2 className="h-3 w-3 text-white" />
                        ) : (
                          <Video className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{track.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                      {track.album && (
                        <p className="text-xs text-muted-foreground truncate">{track.album}</p>
                      )}
                      {track.contentType === 'video' && (
                        <p className="text-xs text-blue-500">
                          {Math.floor(track.duration! / 60)}:{(track.duration! % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => playTrack(track)}
                        aria-label="Reproduzir"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {youtubeTracks.length === 0 && (
            <div className="text-center py-8">
              {youtubeContentType === 'music' ? (
                <Music2 className="mx-auto h-12 w-12 text-red-500 opacity-70" />
              ) : (
                <Video className="mx-auto h-12 w-12 text-red-500 opacity-70" />
              )}
              <h3 className="mt-2 text-lg font-medium">
                {youtubeContentType === 'music' ? 'Nenhuma música do YouTube' : 'Nenhum vídeo do YouTube'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Use a barra de busca para encontrar {youtubeContentType === 'music' ? 'músicas' : 'vídeos'} no YouTube
              </p>
              <Button 
                onClick={() => {
                  setSearchType('youtube');
                  document.querySelector('input')?.focus();
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar no YouTube
              </Button>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <h3 className="text-lg font-medium flex items-center text-red-600 dark:text-red-400">
              <Youtube className="mr-2 h-5 w-5" />
              Sobre o YouTube
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {youtubeContentType === 'music' ? (
                <>O YouTube Music é um serviço de streaming de música que oferece milhões de faixas, álbuns e playlists.</>
              ) : (
                <>O YouTube é a maior plataforma de compartilhamento de vídeos do mundo, com bilhões de vídeos disponíveis.</>
              )}
              Esta integração permite buscar e reproduzir {youtubeContentType === 'music' ? 'músicas' : 'vídeos'} diretamente do YouTube.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>Nota:</strong> Esta é uma implementação de demonstração. Em uma aplicação completa, 
              seria necessário implementar a autenticação e respeitar os termos de serviço do YouTube.
            </p>
          </div>
        </TabsContent>
        
        {/* Biblioteca local */}
        <TabsContent value="local" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Suas Músicas</h2>
            <Button onClick={handleAddLocalMusic}>
              <Music className="mr-2 h-4 w-4" />
              Adicionar Música
            </Button>
          </div>
          
          {localTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localTracks.map((track) => (
                <Card key={track.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center p-2">
                      <AlbumArt 
                        src={track.albumArt} 
                        alt={track.title} 
                        size="sm"
                        isPlaying={isPlaying && currentTrack?.id === track.id}
                        className="mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                        {track.album && (
                          <p className="text-xs text-muted-foreground truncate">{track.album}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => playTrack(track)}
                        aria-label="Reproduzir"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Music className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-2 text-lg font-medium">Biblioteca vazia</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não adicionou nenhuma música a sua biblioteca local.
              </p>
              <Button onClick={handleAddLocalMusic}>
                <Music className="mr-2 h-4 w-4" />
                Adicionar Música
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryPage;
