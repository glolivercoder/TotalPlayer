import { v4 as uuidv4 } from 'uuid';
import { Track } from './AudioPlayerService';
import { toast } from '@/components/ui/use-toast';

// Extend the FileSystemDirectoryHandle interface to include the values method and requestPermission method
declare global {
  interface FileSystemDirectoryHandle {
    values(): AsyncIterable<[string, FileSystemHandle]>;
    requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  }
}

// Supported media formats
const SUPPORTED_AUDIO_FORMATS = [
  '.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac',
  '.wma', '.aiff', '.alac', '.dsd', '.dsf', '.dff'
];

const SUPPORTED_VIDEO_FORMATS = [
  '.mp4', '.webm', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.mpg', '.mpeg'
];

const SUPPORTED_KARAOKE_FORMATS = [
  '.kar', '.midi', '.mid', '.cdg', '.kfn', '.kok', '.zpl'
];

// Check if a file is a supported media file
const isSupportedMediaFile = (filename: string): boolean => {
  if (!filename) return false;
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return SUPPORTED_AUDIO_FORMATS.includes(extension) || 
         SUPPORTED_VIDEO_FORMATS.includes(extension) || 
         SUPPORTED_KARAOKE_FORMATS.includes(extension);
};

// Check if a file is a karaoke file
const isKaraokeFile = (filename: string): boolean => {
  if (!filename) return false;
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return SUPPORTED_KARAOKE_FORMATS.includes(extension);
};

// Check if a file is a video file
const isVideoFile = (filename: string): boolean => {
  if (!filename) return false;
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return SUPPORTED_VIDEO_FORMATS.includes(extension);
};

// Detecta se o dispositivo é móvel
const isMobileDevice = (): boolean => {
  try {
    console.log('DEBUG: Verificando se é dispositivo móvel');
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    console.log('DEBUG: É dispositivo móvel:', isMobile);
    return isMobile;
  } catch (error) {
    console.error('DEBUG: Erro ao verificar se é dispositivo móvel:', error);
    return false;
  }
};

// Verifica se a API File System Access está disponível
const isFileSystemAccessSupported = (): boolean => {
  try {
    console.log('DEBUG: Verificando suporte à API File System Access');
    const isSupported = typeof window !== 'undefined' && 
           'showOpenFilePicker' in window && 
           'showDirectoryPicker' in window;
    console.log('DEBUG: API File System Access suportada:', isSupported);
    
    // Em dispositivos móveis, mesmo que a API esteja disponível, pode não funcionar corretamente
    // Então, vamos usar o fallback para dispositivos móveis
    if (isSupported && isMobileDevice()) {
      console.log('DEBUG: Dispositivo móvel detectado, usando fallback mesmo com API suportada');
      return false;
    }
    
    return isSupported;
  } catch (error) {
    console.error('DEBUG: Erro ao verificar suporte à API File System Access:', error);
    return false;
  }
};

// Open file picker to select a media file
const openMediaFilePicker = async (): Promise<Track | null> => {
  console.log('DEBUG: Iniciando openMediaFilePicker');
  try {
    // Verificar se a API é suportada
    if (!isFileSystemAccessSupported()) {
      console.log('DEBUG: File System Access API não é suportada, usando fallback');
      return await openMediaFileWithInput(); // Fallback para input file
    }

    console.log('DEBUG: Configurando tipos de arquivos aceitos');
    // Configuração para tipos de arquivos aceitos
    const fileTypes: Record<string, string[]> = {};
    
    // Adicionar tipos de áudio
    SUPPORTED_AUDIO_FORMATS.forEach(format => {
      const type = format.substring(1);
      if (type === 'mp3') {
        fileTypes['audio/mpeg'] = [format];
      } else {
        fileTypes[`audio/${type}`] = [format];
      }
    });
    
    // Adicionar tipos de vídeo
    SUPPORTED_VIDEO_FORMATS.forEach(format => {
      const type = format.substring(1);
      fileTypes[`video/${type}`] = [format];
    });
    
    // Adicionar tipos de karaoke
    if (SUPPORTED_KARAOKE_FORMATS.length > 0) {
      fileTypes['application/octet-stream'] = SUPPORTED_KARAOKE_FORMATS;
    }

    console.log('DEBUG: Chamando showOpenFilePicker');
    // Open file picker and get the file handle
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Arquivos de Mídia',
            accept: fileTypes
          }
        ],
        multiple: false
      });
      
      console.log('DEBUG: File handle obtido com sucesso');
      
      // Get the file
      console.log('DEBUG: Obtendo arquivo do file handle');
      const file = await fileHandle.getFile();
      console.log('DEBUG: Arquivo obtido:', file.name);
      
      const isKaraoke = isKaraokeFile(file.name);
      const isVideo = isVideoFile(file.name);
      
      // Create a URL for the file
      console.log('DEBUG: Criando URL para o arquivo');
      const url = URL.createObjectURL(file);
      
      // Create a track object
      const track: Track = {
        id: uuidv4(),
        title: file.name.split('.').slice(0, -1).join('.') || file.name,
        artist: 'Unknown Artist',
        path: url,
        format: file.name.split('.').pop()?.toLowerCase() || '',
        isKaraoke,
        isVideo,
        fileHandle
      };
      
      console.log('DEBUG: Track criado com sucesso:', track);
      return track;
    } catch (pickerError) {
      console.error('DEBUG: Erro específico ao usar showOpenFilePicker:', pickerError);
      // Se o erro for de cancelamento pelo usuário, não mostrar toast
      if (pickerError.name !== 'AbortError') {
        toast({
          title: 'Erro',
          description: 'Falha ao abrir seletor de arquivos',
          variant: 'destructive',
        });
      } else {
        console.log('DEBUG: Usuário cancelou a seleção de arquivo');
      }
      return null;
    }
  } catch (error) {
    console.error('DEBUG: Erro geral ao abrir arquivo de mídia:', error);
    toast({
      title: 'Erro',
      description: 'Falha ao abrir arquivo de mídia',
      variant: 'destructive',
    });
    return null;
  }
};

// Open directory picker to select a media folder
const openMediaFolderPicker = async (): Promise<FileSystemDirectoryHandle | null> => {
  console.log('DEBUG: Iniciando openMediaFolderPicker');
  try {
    // Verificar se a API é suportada
    if (!isFileSystemAccessSupported()) {
      console.error('DEBUG: File System Access API não é suportada neste navegador');
      throw new Error('File System Access API não é suportada neste navegador');
    }

    console.log('DEBUG: Chamando showDirectoryPicker');
    // Open directory picker
    try {
      const directoryHandle = await window.showDirectoryPicker();
      console.log('DEBUG: Directory handle obtido com sucesso');
      return directoryHandle;
    } catch (pickerError) {
      console.error('DEBUG: Erro específico ao usar showDirectoryPicker:', pickerError);
      // Se o erro for de cancelamento pelo usuário, não mostrar toast
      if (pickerError.name !== 'AbortError') {
        toast({
          title: 'Erro',
          description: 'Falha ao abrir seletor de pastas',
          variant: 'destructive',
        });
      } else {
        console.log('DEBUG: Usuário cancelou a seleção de pasta');
      }
      return null;
    }
  } catch (error) {
    console.error('DEBUG: Erro geral ao abrir pasta de mídia:', error);
    toast({
      title: 'Erro',
      description: 'Falha ao abrir pasta de mídia',
      variant: 'destructive',
    });
    return null;
  }
};

// Salvar a referência da pasta para uso posterior
const saveFolderHandle = async (folderName: string, directoryHandle: FileSystemDirectoryHandle): Promise<boolean> => {
  try {
    // Solicitar permissão persistente para a pasta
    const permission = await directoryHandle.requestPermission({ mode: 'read' });
    if (permission !== 'granted') {
      console.error('Permissão para ler o diretório não foi concedida');
      toast({
        title: 'Permissão negada',
        description: 'Não foi possível obter permissão para acessar a pasta',
        variant: 'destructive',
      });
      return false;
    }
    
    // Salvar o nome da pasta no localStorage
    try {
      const savedFolders = localStorage.getItem('musicFolders');
      let folders: string[] = [];
      
      if (savedFolders) {
        folders = JSON.parse(savedFolders);
      }
      
      // Adicionar a nova pasta se ainda não existir
      if (!folders.includes(folderName)) {
        folders.push(folderName);
        localStorage.setItem('musicFolders', JSON.stringify(folders));
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar pasta no localStorage:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a referência da pasta',
        variant: 'destructive',
      });
      return false;
    }
  } catch (error) {
    console.error('Erro ao salvar referência da pasta:', error);
    toast({
      title: 'Erro',
      description: 'Falha ao salvar a referência da pasta',
      variant: 'destructive',
    });
    return false;
  }
};

// Scan a directory for media files
const scanDirectoryForMedia = async (directoryHandle: FileSystemDirectoryHandle): Promise<Track[]> => {
  const tracks: Track[] = [];
  
  try {
    // Request permission to read the directory
    const permission = await directoryHandle.requestPermission({ mode: 'read' });
    if (permission !== 'granted') {
      console.error('Permissão para ler o diretório não foi concedida');
      toast({
        title: 'Permissão negada',
        description: 'Não foi possível acessar os arquivos da pasta',
        variant: 'destructive',
      });
      return [];
    }
    
    // Function to recursively scan a directory
    const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, path: string = '') => {
      try {
        for await (const entry of dirHandle.values()) {
          try {
            const [name, handle] = entry;
            if (handle.kind === 'directory') {
              // Recursively scan subdirectories
              await scanDirectory(handle as FileSystemDirectoryHandle, `${path}${name}/`);
            } else if (handle.kind === 'file' && isSupportedMediaFile(name)) {
              // Process media file
              const fileHandle = handle as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              const isKaraoke = isKaraokeFile(file.name);
              const isVideo = isVideoFile(file.name);
              
              // Create a URL for the file
              const url = URL.createObjectURL(file);
              
              // Create a track object
              const track: Track = {
                id: uuidv4(),
                title: file.name.split('.').slice(0, -1).join('.') || file.name,
                artist: 'Unknown Artist',
                album: path.split('/').filter(Boolean).pop() || 'Unknown Album',
                path: url,
                format: file.name.split('.').pop()?.toLowerCase() || '',
                isKaraoke,
                isVideo,
                fileHandle
              };
              
              tracks.push(track);
            }
          } catch (entryError) {
            console.error(`Erro ao processar arquivo ou diretório:`, entryError);
            // Continue com o próximo arquivo/diretório
            continue;
          }
        }
      } catch (error) {
        console.error(`Erro ao escanear diretório ${path}:`, error);
      }
    };
    
    await scanDirectory(directoryHandle);
  } catch (error) {
    console.error('Erro ao escanear diretório:', error);
    toast({
      title: 'Erro',
      description: 'Falha ao escanear pasta de mídia',
      variant: 'destructive',
    });
  }
  
  return tracks;
};

// Fallback para navegadores que não suportam a API File System Access
const openMediaFileWithInput = (): Promise<Track | null> => {
  console.log('DEBUG: Iniciando openMediaFileWithInput (fallback)');
  return new Promise((resolve) => {
    try {
      // Criar um elemento de input temporário
      console.log('DEBUG: Criando input temporário');
      const input = document.createElement('input');
      input.type = 'file';
      
      // Configurar os tipos de arquivo aceitos
      const acceptedTypes = [
        ...SUPPORTED_AUDIO_FORMATS,
        ...SUPPORTED_VIDEO_FORMATS,
        ...SUPPORTED_KARAOKE_FORMATS
      ].join(',');
      
      console.log('DEBUG: Tipos aceitos:', acceptedTypes);
      input.accept = acceptedTypes;
      
      // Manipular o evento de alteração (quando o usuário seleciona um arquivo)
      input.onchange = async (event) => {
        try {
          console.log('DEBUG: Evento onchange acionado');
          const target = event.target as HTMLInputElement;
          const files = target.files;
          
          if (!files || files.length === 0) {
            console.log('DEBUG: Nenhum arquivo selecionado');
            resolve(null);
            return;
          }
          
          const file = files[0];
          console.log('DEBUG: Arquivo selecionado:', file.name);
          
          // Verificar se é um arquivo de mídia suportado
          if (!isSupportedMediaFile(file.name)) {
            console.error('DEBUG: Formato de arquivo não suportado:', file.name);
            toast({
              title: 'Formato não suportado',
              description: 'O arquivo selecionado não é um formato de mídia suportado',
              variant: 'destructive',
            });
            resolve(null);
            return;
          }
          
          const isKaraoke = isKaraokeFile(file.name);
          const isVideo = isVideoFile(file.name);
          
          // Criar uma URL para o arquivo
          console.log('DEBUG: Criando URL para o arquivo');
          const url = URL.createObjectURL(file);
          console.log('DEBUG: URL criada:', url);
          
          // Criar um objeto de faixa
          const track: Track = {
            id: uuidv4(),
            title: file.name.split('.').slice(0, -1).join('.') || file.name,
            artist: 'Unknown Artist',
            path: url,
            format: file.name.split('.').pop()?.toLowerCase() || '',
            isKaraoke,
            isVideo
          };
          
          console.log('DEBUG: Track criado com sucesso:', track);
          resolve(track);
        } catch (error) {
          console.error('DEBUG: Erro ao processar arquivo selecionado:', error);
          toast({
            title: 'Erro',
            description: 'Falha ao processar o arquivo selecionado',
            variant: 'destructive',
          });
          resolve(null);
        }
      };
      
      // Manipular erros
      input.onerror = (error) => {
        console.error('DEBUG: Erro ao selecionar arquivo:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao selecionar arquivo',
          variant: 'destructive',
        });
        resolve(null);
      };
      
      // Simular um clique no input para abrir o seletor de arquivos
      console.log('DEBUG: Simulando clique no input');
      // Adicionar temporariamente ao DOM para garantir compatibilidade em todos os navegadores
      document.body.appendChild(input);
      input.click();
      // Remover após o clique para não poluir o DOM
      setTimeout(() => {
        document.body.removeChild(input);
      }, 100);
    } catch (error) {
      console.error('DEBUG: Erro ao criar input de arquivo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao abrir seletor de arquivos',
        variant: 'destructive',
      });
      resolve(null);
    }
  });
};

export {
  openMediaFilePicker,
  openMediaFolderPicker,
  scanDirectoryForMedia,
  isSupportedMediaFile,
  isKaraokeFile,
  isVideoFile,
  isFileSystemAccessSupported,
  isMobileDevice,
  openMediaFileWithInput,
  saveFolderHandle,
  SUPPORTED_AUDIO_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  SUPPORTED_KARAOKE_FORMATS
};
