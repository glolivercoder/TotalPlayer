
interface MusicFile {
  name: string;
  handle: FileSystemFileHandle;
  type: string;
  size?: number;
}

class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  
  async requestDirectoryAccess(): Promise<boolean> {
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'music-library',
        mode: 'read',
        startIn: 'music',
      });
      
      this.directoryHandle = dirHandle;
      return true;
    } catch (error) {
      console.error('Error getting directory access:', error);
      return false;
    }
  }

  async hasStoredDirectoryAccess(): Promise<boolean> {
    // Check if we have a stored directory handle in localStorage
    const savedDir = localStorage.getItem('musicDirectoryHandle');
    return !!savedDir;
  }

  async getFileFromHandle(fileHandle: FileSystemFileHandle): Promise<File> {
    try {
      return await fileHandle.getFile();
    } catch (error) {
      console.error('Error getting file from handle:', error);
      throw error;
    }
  }

  async scanForMusicFiles(): Promise<MusicFile[]> {
    if (!this.directoryHandle) {
      throw new Error('No directory handle available. Request access first.');
    }
    
    const musicFiles: MusicFile[] = [];
    
    try {
      // Modern approach to iterate directories - compatible with Chrome
      const getFilesRecursively = async (dirHandle: FileSystemDirectoryHandle, path = '') => {
        // Manual async iteration using async iterator
        for await (const [name, handle] of Object.entries(dirHandle)) {
          // Create full path for nested files
          const itemPath = path ? `${path}/${name}` : name;
          
          if (handle.kind === 'file') {
            // It's a file
            const fileHandle = handle as FileSystemFileHandle;
            const fileName = name.toLowerCase();
            
            // Check if it's a music file by extension
            if (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || 
                fileName.endsWith('.ogg') || fileName.endsWith('.flac') || 
                fileName.endsWith('.m4a') || fileName.endsWith('.aac')) {
              
              // Push music file to our array
              musicFiles.push({
                name: name,
                handle: fileHandle,
                type: this.getFileType(fileName),
              });
            }
          } else if (handle.kind === 'directory') {
            // Recursively scan subdirectories
            await getFilesRecursively(handle as FileSystemDirectoryHandle, itemPath);
          }
        }
      };
      
      await getFilesRecursively(this.directoryHandle);
      return musicFiles;
    } catch (error) {
      console.error('Error scanning for music files:', error);
      throw error;
    }
  }
  
  private getFileType(fileName: string): string {
    if (fileName.endsWith('.mp3')) return 'audio/mpeg';
    if (fileName.endsWith('.wav')) return 'audio/wav';
    if (fileName.endsWith('.ogg')) return 'audio/ogg';
    if (fileName.endsWith('.flac')) return 'audio/flac';
    if (fileName.endsWith('.m4a')) return 'audio/m4a';
    if (fileName.endsWith('.aac')) return 'audio/aac';
    return 'audio/unknown';
  }
}

export default new FileSystemService();
