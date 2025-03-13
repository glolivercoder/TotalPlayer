import React, { useState, useEffect } from 'react';
import { Search, Music, Download, Globe, Filter } from 'lucide-react';
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
type SearchResult = StreamTrack | LocalTrack;

const LibraryPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'local' | 'stream'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  const { addToPlaylist, setCurrentTrack, currentTrack, isPlaying } = useAudioPlayer();

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
      // Simulando uma chamada à API Subsonic
      // Em uma implementação real, você faria uma chamada fetch para um servidor Subsonic
      
      // Dados de exemplo para demonstração
      const mockStreamResults: StreamTrack[] = [
        {
          id: 'stream-1',
          title: `${query} - Top Hit`,
          artist: 'Popular Artist',
          album: 'Greatest Hits',
          albumArt: 'https://picsum.photos/seed/stream1/300/300',
          path: '',
          source: 'stream',
          streamUrl: 'https://example.com/stream/track1.mp3'
        },
        {
          id: 'stream-2',
          title: `Remix of ${query}`,
          artist: 'DJ Remix',
          album: 'Remix Collection',
          albumArt: 'https://picsum.photos/seed/stream2/300/300',
          path: '',
          source: 'stream',
          streamUrl: 'https://example.com/stream/track2.mp3'
        },
        {
          id: 'stream-3',
          title: `${query} Acoustic Version`,
          artist: 'Acoustic Band',
          album: 'Unplugged',
          albumArt: 'https://picsum.photos/seed/stream3/300/300',
          path: '',
          source: 'stream',
          streamUrl: 'https://example.com/stream/track3.mp3'
        }
      ];
      
      return mockStreamResults;
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
    // Para músicas de streaming, precisamos ajustar o objeto track
    if ('source' in track && track.source === 'stream') {
      const streamTrack: Track = {
        ...track,
        path: track.streamUrl // Usar a URL de streaming como path
      };
      
      addToPlaylist(streamTrack);
      setCurrentTrack(streamTrack);
      
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
  const downloadStreamTrack = (track: StreamTrack) => {
    // Em uma implementação real, você faria o download do arquivo
    // Para esta demonstração, apenas mostramos um toast
    toast({
      title: 'Download iniciado',
      description: `Baixando "${track.title}" de ${track.artist}`,
      variant: 'default'
    });
    
    // Simular o download concluído após 3 segundos
    setTimeout(() => {
      // Adicionar à biblioteca local após o download
      const downloadedTrack: LocalTrack = {
        id: `local-${Date.now()}`,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArt: track.albumArt,
        path: `/downloads/${track.id}.mp3`, // Caminho local simulado
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
    }, 3000);
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
            onValueChange={(value) => setSearchType(value as 'all' | 'local' | 'stream')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Buscar em" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="local">Arquivos Locais</SelectItem>
              <SelectItem value="stream">Streaming</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={performSearch} disabled={isSearching}>
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>
      
      {/* Tabs para diferentes seções */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Resultados</TabsTrigger>
          <TabsTrigger value="stream">Streaming</TabsTrigger>
          <TabsTrigger value="local">Biblioteca Local</TabsTrigger>
        </TabsList>
        
        {/* Resultados de busca */}
        <TabsContent value="search" className="space-y-4">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((track) => (
                <Card key={track.id} className="overflow-hidden">
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
                        >
                          <Music className="h-4 w-4" />
                        </Button>
                        
                        {'source' in track && track.source === 'stream' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => downloadStreamTrack(track as StreamTrack)}
                            aria-label="Baixar"
                          >
                            <Download className="h-4 w-4" />
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
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <Globe className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium">Streaming de Música</h3>
            <p className="text-muted-foreground mb-4">
              Busque e reproduza milhões de músicas online sem precisar baixá-las.
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  setSearchType('stream');
                  document.querySelector('input')?.focus();
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar músicas em streaming
              </Button>
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
                <Card key={track.id} className="overflow-hidden">
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
                      >
                        <Music className="h-4 w-4" />
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
