
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LibraryBig, Download, Mic2, Sliders, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MusicFolder {
  name: string;
  handle: FileSystemDirectoryHandle | null;
}

const NavigationBar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [musicFolders, setMusicFolders] = useState<MusicFolder[]>([]);
  
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
        
        localStorage.setItem('musicFolders', JSON.stringify(newFolders.map(f => f.name)));
        
        toast({
          title: "Folder added",
          description: `Added "${dirHandle.name}" to your music folders`,
        });
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

  return (
    <nav className="glass fixed bottom-3 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 z-10 animate-slide-up">
      <ul className="flex items-center space-x-10">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className="flex flex-col items-center"
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <div 
                className={cn(
                  'transition-all duration-300 p-2 rounded-full',
                  isActive(item.path) 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon size={20} />
              </div>
              <span 
                className={cn(
                  'text-xs mt-1 transition-colors duration-300',
                  isActive(item.path) 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
        
        <li>
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="flex flex-col items-center"
                aria-label="Select Music Folder"
              >
                <div className="transition-all duration-300 p-2 rounded-full text-muted-foreground hover:text-foreground">
                  <FolderOpen size={20} />
                </div>
                <span className="text-xs mt-1 text-muted-foreground">
                  Folders
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-background border-border shadow-lg rounded-lg">
              <div className="flex flex-col gap-2">
                <h3 className="font-medium px-2 py-1">Music Folders</h3>
                
                {musicFolders.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {musicFolders.map((folder, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="justify-start px-2 py-1 h-auto text-sm font-normal"
                        onClick={() => openMusicFolder(folder.name)}
                      >
                        <FolderOpen size={16} className="mr-2 text-muted-foreground" />
                        {folder.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground px-2">No folders added yet</p>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={selectMusicFolder}
                >
                  <FolderOpen size={16} className="mr-2" />
                  Add Music Folder
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </li>
      </ul>
    </nav>
  );
};

export default NavigationBar;
