import React, { useState, useEffect } from 'react';
import { Search, Music, Download, Globe, Filter, Play, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAudioPlayer, Track } from '@/services/AudioPlayerService';
import AlbumArt from '@/components/AlbumArt';
import { scanDirectoryForMedia, openMediaFilePicker } from '@/services/FileService';
import { useQuery } from '@tanstack/react-query';

// Importação da API do YouTube Music
import { youtubeMusicService, YouTubeTrack } from '@/services/YouTubeMusicService';

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
type SearchResult = StreamTrack | LocalTrack | YouTubeTrack;

// Exemplos de músicas de streaming com URLs reais
const SAMPLE_STREAM_TRACKS: StreamTrack[] = [
  {
    id: 'stream-1',
    title: 'Acoustic Breeze',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/10/30/23-46-27-824_200x200.jpg',
    path: '',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_946f4e2cec.mp3?filename=acoustic-breeze-138605.mp3'
  },
  {
    id: 'stream-2',
    title: 'Creative Minds',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/03/08/08-00-36-517_200x200.png',
    path: '',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/08/audio_c3b7a16d87.mp3?filename=creative-minds-135224.mp3'
  },
  {
    id: 'stream-3',
    title: 'Happy Rock',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2021/11/25/08-10-56-517_200x200.png',
    path: '',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_3b7a8aba6e.mp3?filename=happy-rock-118985.mp3'
  },
  {
    id: 'stream-4',
    title: 'Jazzy Frenchy',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/03/15/09-33-46-517_200x200.png',
    path: '',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749090c.mp3?filename=jazzy-frenchy-164953.mp3'
  },
  {
    id: 'stream-5',
    title: 'Ukulele',
    artist: 'Benjamin Tissot',
    album: 'Bensound Collection',
    albumArt: 'https://cdn.pixabay.com/audio/2022/03/15/09-38-01-517_200x200.png',
    path: '',
    source: 'stream',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_db6e6dc93a.mp3?filename=ukulele-163106.mp3'
  }
];

const LibraryPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'local' | 'stream' | 'youtube'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  const [streamTracks, setStreamTracks] = useState<StreamTrack[]>(SAMPLE_STREAM_TRACKS);
  const [youtubeTracks, setYoutubeTracks] = useState<YouTubeTrack[]>([]);
  const { addToPlaylist, setCurrentTrack, currentTrack, isPlaying } = useAudioPlayer();

  // Estado para controlar a aba atual
  const [activeTab, setActiveTab] = useState('stream');

  // Carregar músicas populares do YouTube Music quando a aba for selecionada
  useEffect(() => {
    const loadPopularYouTubeTracks = async () => {
      if (activeTab === 'youtube' && youtubeTracks.length === 0) {
        try {
          toast({
            title: 'Carregando músicas',
            description: 'Buscando músicas populares no YouTube Music...',
            variant: 'default'
          });
          
          // Inicializar a API do YouTube Music
          await youtubeMusicService.initialize();
          
          // Buscar músicas populares
          const tracks = await youtubeMusicService.getPopularTracks();
          
          if (tracks.length > 0) {
            setYoutubeTracks(tracks);
            toast({
              title: 'Músicas carregadas',
              description: `${tracks.length} músicas populares foram carregadas`,
              variant: 'default'
            });
          } else {
            toast({
              title: 'Nenhuma música encontrada',
              description: 'Não foi possível carregar músicas populares',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Erro ao carregar músicas populares:', error);
          toast({
            title: 'Erro ao carregar músicas',
            description: 'Ocorreu um erro ao carregar músicas populares',
            variant: 'destructive'
          });
        }
      }
    };
    
    loadPopularYouTubeTracks();
  }, [activeTab, youtubeTracks.length, toast]);

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

  // Função para buscar músicas em streaming usando a API Subsonic
  const searchStreamTracks = async (query: string): Promise<StreamTrack[]> => {
    if (!query) return [];
    
    try {
      // Filtrando as músicas de streaming de exemplo com base na consulta
      const normalizedQuery = query.toLowerCase();
      const filteredTracks = SAMPLE_STREAM_TRACKS.filter(track => 
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery) ||
        (track.album && track.album.toLowerCase().includes(normalizedQuery))
      );
      
      return filteredTracks;
    } catch (error) {
      console.error('Erro ao buscar músicas em streaming:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar músicas em streaming. Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return [];
    }
  };

  // Função para buscar músicas no YouTube Music
  const searchYoutubeTracks = async (query: string): Promise<YouTubeTrack[]> => {
    if (!query) return [];
    
    try {
      const tracks = await youtubeMusicService.searchTracks(query);
      return tracks;
    } catch (error) {
      console.error('Erro ao buscar músicas no YouTube Music:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar músicas no YouTube Music. Tente novamente mais tarde.',
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
    
    try {
      let results: SearchResult[] = [];
      
      // Buscar em fontes locais se necessário
      if (searchType === 'all' || searchType === 'local') {
        const localResults = searchLocalTracks(searchQuery);
        results = [...results, ...localResults];
      }
      
      // Buscar em streaming se necessário
      if (searchType === 'all' || searchType === 'stream') {
        const streamResults = await searchStreamTracks(searchQuery);
        results = [...results, ...streamResults];
      }
      
      // Buscar no YouTube Music se necessário
      if (searchType === 'all' || searchType === 'youtube') {
        const youtubeResults = await searchYoutubeTracks(searchQuery);
        results = [...results, ...youtubeResults];
      }
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: `Nenhuma música encontrada para "${searchQuery}"`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Busca concluída',
          description: `Encontradas ${results.length} músicas para "${searchQuery}"`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro na busca',
        description: 'Ocorreu um erro ao realizar a busca. Tente novamente.',
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
  const playTrack = (track: SearchResult) => {
    try {
      // Para músicas de streaming, precisamos ajustar o objeto track
      if ('source' in track && track.source === 'stream') {
        const streamTrack: Track = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          path: track.streamUrl // Usar a URL de streaming como path
        };
        
        addToPlaylist(streamTrack);
        setCurrentTrack(streamTrack);
        
        toast({
          title: 'Reproduzindo música',
          description: `Reproduzindo "${track.title}" de ${track.artist}`,
          variant: 'default'
        });
      } else if ('source' in track && track.source === 'youtube') {
        const youtubeTrack: Track = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          path: track.streamUrl // Usar a URL de streaming como path
        };
        
        addToPlaylist(youtubeTrack);
        setCurrentTrack(youtubeTrack);
        
        toast({
          title: 'Reproduzindo música',
          description: `Reproduzindo "${track.title}" de ${track.artist}`,
          variant: 'default'
        });
      } else {
        // Para músicas locais, podemos usar diretamente
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
        
        // Adicionar à lista local
        const updatedTracks = [...localTracks, localTrack];
        setLocalTracks(updatedTracks);
        
        // Salvar no localStorage
        localStorage.setItem('localTracks', JSON.stringify(updatedTracks));
        
        // Adicionar à playlist e reproduzir
        addToPlaylist(track);
        setCurrentTrack(track);
        
        toast({
          title: 'Música adicionada',
          description: `"${track.title}" foi adicionada à sua biblioteca`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar música local:', error);
      toast({
        title: 'Erro ao adicionar música',
        description: 'Não foi possível adicionar a música à biblioteca',
        variant: 'destructive'
      });
    }
  };

  // Função para baixar uma música de streaming
  const downloadStreamTrack = async (track: StreamTrack) => {
    try {
      // Em uma implementação real, você faria o download do arquivo
      toast({
        title: 'Download iniciado',
        description: `Baixando "${track.title}" de ${track.artist}`,
        variant: 'default'
      });
      
      // Simular o download concluído após 2 segundos
      setTimeout(() => {
        try {
          // Adicionar à biblioteca local após o download
          const downloadedTrack: LocalTrack = {
            id: `local-${Date.now()}`,
            title: track.title,
            artist: track.artist,
            album: track.album,
            albumArt: track.albumArt,
            path: track.streamUrl, // Usar a URL de streaming diretamente
            source: 'local'
          };
          
          const updatedTracks = [...localTracks, downloadedTrack];
          setLocalTracks(updatedTracks);
          localStorage.setItem('localTracks', JSON.stringify(updatedTracks));
          
          toast({
            title: 'Download concluído',
            description: `"${track.title}" foi baixada e adicionada à sua biblioteca`,
            variant: 'default'
          });
          
          // Atualizar a aba de biblioteca local
          if (document.querySelector('[value="local"]')) {
            (document.querySelector('[value="local"]') as HTMLElement).click();
          }
        } catch (innerError) {
          console.error('Erro ao finalizar download:', innerError);
          toast({
            title: 'Erro no download',
            description: 'Não foi possível concluir o download da música',
            variant: 'destructive'
          });
        }
      }, 2000);
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível iniciar o download da música',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container py-4 space-y-6 overflow-y-auto pb-32">
      <h1 className="text-2xl font-bold">Biblioteca</h1>
      
      {/* Barra de busca */}
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar músicas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            />
          </div>
          
          <Select 
            value={searchType} 
            onValueChange={(value) => setSearchType(value as 'all' | 'local' | 'stream' | 'youtube')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Buscar em" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="local">Arquivos Locais</SelectItem>
              <SelectItem value="stream">Streaming</SelectItem>
              <SelectItem value="youtube">YouTube Music</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={performSearch} disabled={isSearching}>
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>
      
      {/* Tabs para diferentes seções */}
      <Tabs defaultValue="stream" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Resultados</TabsTrigger>
          <TabsTrigger value="stream">Streaming</TabsTrigger>
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
                        {'source' in track && track.source === 'stream' && (
                          <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-1">
                            <Globe className="h-3 w-3 text-white" />
                          </div>
                        )}
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
                        
                        {'source' in track && track.source === 'stream' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => downloadStreamTrack(track as StreamTrack)}
                            aria-label="Baixar"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        )}
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
        
        {/* Seção de streaming */}
        <TabsContent value="stream" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Músicas em Streaming</h2>
            <Button 
              onClick={() => {
                setSearchType('stream');
                document.querySelector('input')?.focus();
              }}
              variant="outline"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar mais músicas
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streamTracks.map((track) => (
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
                      <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-1">
                        <Globe className="h-3 w-3 text-white" />
                      </div>
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
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => downloadStreamTrack(track)}
                        aria-label="Baixar"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 text-left">
            <h4 className="text-md font-medium mb-2">Serviços Recomendados</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                  <Music className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Subsonic</p>
                  <p className="text-xs text-muted-foreground">Streaming de música open source</p>
                </div>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-2">
                  <Music className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Navidrome</p>
                  <p className="text-xs text-muted-foreground">Servidor de música auto-hospedado</p>
                </div>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                  <Music className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Airsonic</p>
                  <p className="text-xs text-muted-foreground">Streaming de mídia gratuito</p>
                </div>
              </li>
            </ul>
          </div>
        </TabsContent>
        
        {/* Seção do YouTube Music */}
        <TabsContent value="youtube" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Músicas do YouTube Music</h2>
            <Button 
              onClick={() => {
                setSearchType('youtube');
                document.querySelector('input')?.focus();
              }}
              variant="outline"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar mais músicas
            </Button>
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
                        <Youtube className="h-3 w-3 text-white" />
                      </div>
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
          
          {youtubeTracks.length === 0 && (
            <div className="text-center py-8">
              <Youtube className="mx-auto h-12 w-12 text-red-500 opacity-70" />
              <h3 className="mt-2 text-lg font-medium">Nenhuma música do YouTube</h3>
              <p className="text-muted-foreground mb-4">
                Use a barra de busca para encontrar músicas no YouTube Music
              </p>
              <Button 
                onClick={() => {
                  setSearchType('youtube');
                  document.querySelector('input')?.focus();
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar no YouTube Music
              </Button>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <h3 className="text-lg font-medium flex items-center text-red-600 dark:text-red-400">
              <Youtube className="mr-2 h-5 w-5" />
              Sobre o YouTube Music
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              O YouTube Music é um serviço de streaming de música que oferece milhões de faixas, álbuns e playlists.
              Esta integração permite buscar e reproduzir músicas diretamente do YouTube Music.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>Nota:</strong> Esta é uma implementação de demonstração. Em uma aplicação completa, 
              seria necessário implementar a autenticação e respeitar os termos de serviço do YouTube Music.
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
                Você ainda não adicionou nenhuma música à sua biblioteca local.
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
