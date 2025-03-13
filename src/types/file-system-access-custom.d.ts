// Definições de tipos personalizadas para a File System Access API
// Isso evita conflitos com as definições padrão

export interface CustomFileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: any): Promise<boolean>;
}

export interface CustomFileSystemFileHandle extends CustomFileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<any>;
}

export interface CustomFileSystemDirectoryHandle extends CustomFileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterable<[string, CustomFileSystemHandle]>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<CustomFileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<CustomFileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  resolve(possibleDescendant: CustomFileSystemHandle): Promise<string[] | null>;
  requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
}

export interface CustomDirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | CustomFileSystemHandle;
}

export interface CustomFilePickerOptions {
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  id?: string;
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | CustomFileSystemHandle;
}

// Funções auxiliares para converter entre os tipos padrão e os personalizados
export const convertToCustomDirectoryHandle = (handle: any): CustomFileSystemDirectoryHandle => {
  return handle as unknown as CustomFileSystemDirectoryHandle;
};

export const convertToCustomFileHandle = (handle: any): CustomFileSystemFileHandle => {
  return handle as unknown as CustomFileSystemFileHandle;
};
