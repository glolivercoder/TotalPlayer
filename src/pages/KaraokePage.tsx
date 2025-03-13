import React, { useState } from 'react';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { Mic, VolumeX, Music, ArrowDownUp, FolderPlus, FileUp, Loader2 } from 'lucide-react';
import { useAudioPlayer } from '@/services/AudioPlayerService';
import { 
  openMediaFilePicker, 
  openMediaFolderPicker, 
  scanDirectoryForMedia, 
  isFileSystemAccessSupported,
  openMediaFileWithInput
} from '@/services/FileService';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';

const KaraokePage = () => {
  // Use the audio player state and methods
  const { 
    currentTrack, 
    vocalRemoval, 
    pitchShift, 
    tempo, 
    voiceType,
    setCurrentTrack,
    setPlaylist,
    addToPlaylist,
    play,
    setVocalRemoval, 
    setPitchShift, 
    setTempo, 
    setVoiceType 
  } = useAudioPlayer();
  
  const [isLoading, setIsLoading] = useState(false);

  // Handle opening a media file
  const handleOpenMediaFile = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let track = null;
      
      // Verificar se a API File System Access é suportada
      if (isFileSystemAccessSupported()) {
        track = await openMediaFilePicker();
      } else {
        // Usar o método alternativo com input file
        track = await openMediaFileWithInput();
      }
      
      if (track) {
        setCurrentTrack(track);
        play();
        toast({
          title: 'Arquivo de mídia carregado',
          description: `Reproduzindo: ${track.title}`,
        });
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo de mídia:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao abrir arquivo de mídia',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a media folder
  const handleAddMediaFolder = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Verificar se a API File System Access é suportada
      if (!isFileSystemAccessSupported()) {
        toast({
          title: 'Recurso não suportado',
          description: 'Seu navegador não suporta a seleção de pastas. Por favor, use a opção "Abrir Arquivo de Mídia" para selecionar arquivos individuais.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const directoryHandle = await openMediaFolderPicker();
      if (directoryHandle) {
        toast({
          title: 'Escaneando pasta',
          description: 'Procurando arquivos de mídia na pasta selecionada...',
        });
        
        const tracks = await scanDirectoryForMedia(directoryHandle);
        if (tracks && tracks.length > 0) {
          setPlaylist(tracks);
          // Auto-play the first track
          setCurrentTrack(tracks[0]);
          play();
          toast({
            title: 'Pasta de mídia adicionada',
            description: `Adicionadas ${tracks.length} faixas de ${directoryHandle.name}`,
          });
        } else {
          toast({
            title: 'Nenhum arquivo de mídia encontrado',
            description: 'A pasta selecionada não contém arquivos de mídia suportados',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar pasta de mídia:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar pasta de mídia',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Voice type options
  const voiceTypes = [
    { id: 'male', name: 'Voz Masculina' },
    { id: 'female', name: 'Voz Feminina' },
    { id: 'tenor', name: 'Tenor' },
    { id: 'baritone', name: 'Barítono' },
    { id: 'soprano', name: 'Soprano' },
    { id: 'normal', name: 'Normal' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Karaoke" />
      
      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-foreground">Carregando...</p>
            </div>
          </div>
        )}
        
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Configurações de Karaoke</h2>
          
          {currentTrack ? (
            <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
              <p className="font-medium">Reproduzindo: {currentTrack.title}</p>
              <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
              {currentTrack.isVideo && <p className="text-xs text-primary mt-1">Vídeo</p>}
              {currentTrack.isKaraoke && <p className="text-xs text-primary mt-1">Karaoke</p>}
            </div>
          ) : (
            <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
              <p className="font-medium">Nenhuma faixa reproduzindo</p>
              <p className="text-sm text-muted-foreground">Selecione uma faixa para reproduzir</p>
            </div>
          )}
          
          {/* Media Folders Section */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Arquivos de Mídia</h3>
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={handleAddMediaFolder} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <FolderPlus size={16} />
                Adicionar Pasta de Mídia
              </Button>
              <Button 
                onClick={handleOpenMediaFile} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileUp size={16} />
                Abrir Arquivo de Mídia
              </Button>
            </div>
          </div>

          {/* Vocal Removal */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <VolumeX className={cn("h-5 w-5", vocalRemoval ? "text-primary" : "text-muted-foreground")} />
              <label className="font-medium">
                Remoção de Vocal
              </label>
              <div className="ml-auto">
                <Button 
                  variant={vocalRemoval ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVocalRemoval(!vocalRemoval)}
                  disabled={!currentTrack}
                >
                  {vocalRemoval ? "Ligado" : "Desligado"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground ml-7">Remove os vocais da faixa</p>
          </div>
          
          {/* Pitch Adjustment */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownUp className={cn("h-5 w-5", pitchShift !== 0 ? "text-primary" : "text-muted-foreground")} />
              <label className="font-medium">
                Ajuste de Tom
              </label>
              <div className="ml-auto font-medium">{pitchShift}</div>
            </div>
            <Slider 
              defaultValue={[0]} 
              min={-12} 
              max={12} 
              step={1} 
              value={[pitchShift]}
              onValueChange={(value) => setPitchShift(value[0])}
              disabled={!currentTrack}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-12</span>
              <span>0</span>
              <span>+12</span>
            </div>
          </div>
          
          {/* Tempo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Music className={cn("h-5 w-5", tempo !== 100 ? "text-primary" : "text-muted-foreground")} />
              <label className="font-medium">
                Andamento
              </label>
              <div className="ml-auto font-medium">{tempo}%</div>
            </div>
            <Slider 
              defaultValue={[100]} 
              min={50} 
              max={150} 
              step={1} 
              value={[tempo]}
              onValueChange={(value) => setTempo(value[0])}
              disabled={!currentTrack}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mais Lento</span>
              <span>Normal</span>
              <span>Mais Rápido</span>
            </div>
          </div>
          
          {/* Voice Type */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Mic className={cn("h-5 w-5", voiceType !== 'normal' ? "text-primary" : "text-muted-foreground")} />
              <label className="font-medium">
                Tipo de Voz
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {voiceTypes.map(type => (
                <button
                  key={type.id}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-colors",
                    type.id === voiceType 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                  onClick={() => setVoiceType(type.id)}
                  disabled={!currentTrack}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="glass rounded-xl p-6">
          <h3 className="font-medium mb-3">Dicas de Karaoke</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• A remoção de vocal funciona melhor com faixas estéreo onde os vocais estão centralizados</li>
            <li>• Ajuste o tom para combinar com sua extensão vocal</li>
            <li>• Diminua o andamento se estiver aprendendo uma nova música</li>
            <li>• Selecione o tipo de voz que melhor combina com a sua voz</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KaraokePage;
