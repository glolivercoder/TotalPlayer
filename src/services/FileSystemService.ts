
class FileSystemService {
  private static instance: FileSystemService;
  
  // Check if the File System Access API is available
  private hasFileSystemAccess = 'showDirectoryPicker' in window;
  
  // Store the last directory handle
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  
  private constructor() {
    // Singleton pattern
  }
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }
  
  public async pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.hasFileSystemAccess) {
      console.error('File System Access API is not supported in this browser');
      return null;
    }
    
    try {
      // @ts-ignore - TypeScript doesn't have the types for this API yet
      this.directoryHandle = await window.showDirectoryPicker();
      await this.saveDirectoryToStorage();
      return this.directoryHandle;
    } catch (error) {
      console.error('Error picking directory:', error);
      return null;
    }
  }
  
  private async saveDirectoryToStorage() {
    if (!this.directoryHandle) return;
    
    try {
      // Save a reference to the directory in indexedDB for persistence
      // This allows us to request permission again later
      const dirName = this.directoryHandle.name;
      localStorage.setItem('lastDirectoryName', dirName);
      
      // For actual persistence, we'd need to use IndexedDB
      // This is just a basic implementation
    } catch (error) {
      console.error('Error saving directory to storage:', error);
    }
  }
  
  public async getLastDirectory(): Promise<FileSystemDirectoryHandle | null> {
    // In a full implementation, we'd retrieve the directory handle from IndexedDB
    // and verify permissions. This is a placeholder for that functionality.
    return this.directoryHandle;
  }
  
  public async listAudioFiles(directory: FileSystemDirectoryHandle | null = this.directoryHandle): Promise<string[]> {
    if (!directory) return [];
    
    const audioFiles: string[] = [];
    try {
      for await (const entry of directory.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('audio/') || 
              file.name.endsWith('.mp3') || 
              file.name.endsWith('.wav') || 
              file.name.endsWith('.ogg') ||
              file.name.endsWith('.flac')) {
            audioFiles.push(file.name);
          }
        } else if (entry.kind === 'directory') {
          // Recursively scan subdirectories
          const subDirFiles = await this.listAudioFiles(entry);
          audioFiles.push(...subDirFiles.map(file => `${entry.name}/${file}`));
        }
      }
    } catch (error) {
      console.error('Error listing audio files:', error);
    }
    
    return audioFiles;
  }
}

export default FileSystemService;
