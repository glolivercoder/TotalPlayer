
interface MusicFile {
  name: string;
  type: string;
  path: string;
  handle: FileSystemFileHandle;
}

class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  /**
   * Request permission to access the file system
   */
  async requestPermission(): Promise<boolean> {
    try {
      // @ts-ignore - The File System Access API TypeScript definitions might not be up to date
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      this.directoryHandle = directoryHandle;
      return true;
    } catch (error) {
      console.error('Error requesting file system permission:', error);
      return false;
    }
  }

  /**
   * Check if we have permission to access the previously selected directory
   */
  async hasPermission(): Promise<boolean> {
    if (!this.directoryHandle) return false;
    
    try {
      // Try to read permission state
      // @ts-ignore - QueryPermissionResult might not be defined in the TS types
      const permissionState = await this.directoryHandle.queryPermission({ mode: 'read' });
      return permissionState === 'granted';
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Scan the selected directory for music files
   */
  async scanMusicFiles(): Promise<MusicFile[]> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected. Call requestPermission() first.');
    }

    const musicFiles: MusicFile[] = [];
    
    try {
      // Use for-await-of loop to iterate through directory entries
      for await (const [name, handle] of this.directoryHandle) {
        if (handle.kind === 'file') {
          const fileHandle = handle as FileSystemFileHandle;
          const fileName = name.toLowerCase();
          
          // Check if it's a music file by extension
          if (fileName.endsWith('.mp3') || 
              fileName.endsWith('.wav') || 
              fileName.endsWith('.ogg') || 
              fileName.endsWith('.m4a') || 
              fileName.endsWith('.flac')) {
            
            musicFiles.push({
              name: name,
              type: fileName.split('.').pop() || '',
              path: name, // We don't have a real path in the web API
              handle: fileHandle
            });
          }
        } else if (handle.kind === 'directory') {
          // In a more complex implementation, we could recursively scan subdirectories
          // but for simplicity, we're just scanning the top level
        }
      }
      
      return musicFiles;
    } catch (error) {
      console.error('Error scanning directory:', error);
      throw error;
    }
  }

  /**
   * Get the file from a handle
   */
  async getFileFromHandle(handle: FileSystemFileHandle): Promise<File> {
    return await handle.getFile();
  }
}

export default new FileSystemService();
