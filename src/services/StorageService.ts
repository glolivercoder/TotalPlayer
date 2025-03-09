
import { openDB, IDBPDatabase } from 'idb';

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  path: string;
  duration?: string;
  coverArt?: string;
  dateAdded: number;
}

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  dateCreated: number;
  dateModified: number;
}

class StorageService {
  private static instance: StorageService;
  private db: IDBPDatabase | null = null;
  
  private constructor() {
    this.initDatabase();
  }
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  private async initDatabase() {
    try {
      this.db = await openDB('musicPlayerDB', 1, {
        upgrade(db) {
          // Create the songs store
          if (!db.objectStoreNames.contains('songs')) {
            const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
            songsStore.createIndex('by-artist', 'artist');
            songsStore.createIndex('by-album', 'album');
            songsStore.createIndex('by-title', 'title');
            songsStore.createIndex('by-dateAdded', 'dateAdded');
          }
          
          // Create the playlists store
          if (!db.objectStoreNames.contains('playlists')) {
            const playlistsStore = db.createObjectStore('playlists', { keyPath: 'id' });
            playlistsStore.createIndex('by-name', 'name');
            playlistsStore.createIndex('by-dateCreated', 'dateCreated');
          }
          
          // Create settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        }
      });
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  // Song methods
  public async addSong(song: Song): Promise<void> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.put('songs', song);
  }
  
  public async getSongById(id: string): Promise<Song | undefined> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    return this.db.get('songs', id);
  }
  
  public async getAllSongs(): Promise<Song[]> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    return this.db.getAll('songs');
  }
  
  public async searchSongs(query: string): Promise<Song[]> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    const allSongs = await this.db.getAll('songs');
    const lowerQuery = query.toLowerCase();
    
    return allSongs.filter(song => 
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      (song.album && song.album.toLowerCase().includes(lowerQuery))
    );
  }
  
  // Playlist methods
  public async createPlaylist(name: string): Promise<string> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `playlist_${Date.now()}`;
    const now = Date.now();
    
    const playlist: Playlist = {
      id,
      name,
      songIds: [],
      dateCreated: now,
      dateModified: now
    };
    
    await this.db.put('playlists', playlist);
    return id;
  }
  
  public async getPlaylistById(id: string): Promise<Playlist | undefined> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    return this.db.get('playlists', id);
  }
  
  public async getAllPlaylists(): Promise<Playlist[]> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    return this.db.getAll('playlists');
  }
  
  // Settings methods
  public async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.put('settings', { key, value });
  }
  
  public async getSetting(key: string): Promise<any> {
    if (!this.db) await this.initDatabase();
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.get('settings', key);
    return result ? result.value : null;
  }
}

export default StorageService;
