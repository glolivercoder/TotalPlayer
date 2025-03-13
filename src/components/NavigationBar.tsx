import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LibraryBig, Download, Mic2, Sliders, FolderOpen, Music, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { scanDirectoryForMedia, saveFolderHandle, openMediaFilePicker, isFileSystemAccessSupported, openMediaFileWithInput } from '@/services/FileService';
import { useAudioPlayer } from '@/services/AudioPlayerService';

interface MusicFolder {
  name: string;
  handle: FileSystemDirectoryHandle | null;
}

const NavigationBar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [musicFolders, setMusicFolders] = useState<MusicFolder[]>([]);
  const { setCurrentTrack, addToPlaylist, setPlaylist } = useAudioPlayer();
  
  useEffect(() => {
    const loadSavedFolders = async () => {
      try {
        const savedFolders = localStorage.getItem('musicFolders');
        if (savedFolders) {
          const parsedFolders = JSON.parse(savedFolders);
          setMusicFolders(parsedFolders.map((folder: string) => ({ 
            name: folder,
            handle: null 
          })));
        }
      } catch (error) {
        console.error('Failed to load saved folders:', error);
      }
    };
    
    loadSavedFolders();
  }, []);
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LibraryBig, label: 'Library', path: '/library' },
    { icon: Mic2, label: 'Karaoke', path: '/karaoke' },
    { icon: Sliders, label: 'Equalizer', path: '/equalizer' }
  ];
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const selectMusicFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'music-folders',
        mode: 'readwrite',
        startIn: 'music',
      });
      
      const folderExists = musicFolders.some(folder => folder.name === dirHandle.name);
      
      if (!folderExists) {
        const newFolder: MusicFolder = {
          name: dirHandle.name,
          handle: dirHandle
        };
        
        const newFolders = [...musicFolders, newFolder];
        setMusicFolders(newFolders);
        
        // Save folder handle for persistence
        await saveFolderHandle(newFolder.name, dirHandle);
        
        localStorage.setItem('musicFolders', JSON.stringify(newFolders.map(f => f.name)));
        
        toast({
          title: "Folder added",
          description: `Added "${dirHandle.name}" to your music folders`,
        });
        
        // Scan the directory for media files
        const tracks = await scanDirectoryForMedia(dirHandle);
        if (tracks.length > 0) {
          // Add tracks to playlist
          setPlaylist(tracks);
          toast({
            title: "Media files found",
            description: `Found ${tracks.length} media files in "${dirHandle.name}"`,
          });
        } else {
          toast({
            title: "No media files found",
            description: `No supported media files found in "${dirHandle.name}"`,
          });
        }
      } else {
        toast({
          title: "Folder already exists",
          description: `"${dirHandle.name}" is already in your music folders`,
        });
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const openMusicFolder = async (folderName: string) => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'music-folders',
        mode: 'readwrite',
        startIn: 'music',
      });
      
      if (dirHandle.name === folderName) {
        toast({
          title: "Folder opened",
          description: `Opened "${folderName}"`,
        });
        
        // Scan the directory for media files
        const tracks = await scanDirectoryForMedia(dirHandle);
        if (tracks.length > 0) {
          // Add tracks to playlist
          setPlaylist(tracks);
          toast({
            title: "Media files found",
            description: `Found ${tracks.length} media files in "${folderName}"`,
          });
        } else {
          toast({
            title: "No media files found",
            description: `No supported media files found in "${folderName}"`,
          });
        }
      } else {
        toast({
          title: "Different folder selected",
          description: "Please select the correct folder",
        });
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };
  
  const openSingleMediaFile = async () => {
    try {
      const track = await openMediaFilePicker();
      if (track) {
        // Add track to playlist and start playing
        addToPlaylist(track);
        setCurrentTrack(track);
        
        // Mostrar notificau00e7u00e3o de sucesso
        toast({
          title: "Arquivo aberto com sucesso",
          description: `Reproduzindo "${track.title}"`,
        });
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo de mu00edsica:', error);
      
      // Mostrar mensagem de erro mais detalhada
      toast({
        title: "Erro ao abrir arquivo",
        description: "Nu00e3o foi possu00edvel abrir o arquivo de mu00edsica. Verifique se o formato u00e9 suportado.",
        variant: "destructive"
      });
      
      // Tentar usar o fallback com input file se a API File System Access falhar
      try {
        const fallbackTrack = await openMediaFileWithInput();
        if (fallbackTrack) {
          addToPlaylist(fallbackTrack);
          setCurrentTrack(fallbackTrack);
          
          toast({
            title: "Arquivo aberto com sucesso",
            description: `Reproduzindo "${fallbackTrack.title}"`,
          });
        }
      } catch (fallbackError) {
        console.error('Erro no mu00e9todo fallback:', fallbackError);
      }
    }
  };

  const handleOpenMediaFile = openSingleMediaFile;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <nav className="bg-background/80 backdrop-blur-lg border-t border-border/50 py-2 px-4">
        <div className="flex justify-between items-center">
          {/* Menu de navegação principal */}
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-md transition-colors',
                  isActive(item.path) 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
          
          {/* Botões de ação */}
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-accent"
                  aria-label="Pastas de música"
                >
                  <FolderOpen size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="end">
                <div className="space-y-2">
                  <div className="font-medium">Pastas de Música</div>
                  
                  {musicFolders.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {musicFolders.map((folder, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center space-x-2">
                            <FolderOpen size={16} className="text-muted-foreground" />
                            <span className="truncate">{folder.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-2">
                      Nenhuma pasta adicionada
                    </div>
                  )}
                  
                  <Button 
                    onClick={selectMusicFolder}
                    className="w-full justify-start"
                    variant="outline"
                    size="sm"
                  >
                    <FolderOpen size={16} className="mr-2" />
                    Adicionar pasta
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-accent"
              aria-label="Abrir arquivo"
              onClick={handleOpenMediaFile}
            >
              <Music size={20} />
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavigationBar;
