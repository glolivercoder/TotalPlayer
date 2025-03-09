
import React from 'react';
import { PlayCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackItemProps {
  track: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: string;
    albumArt: string;
  };
  isPlaying?: boolean;
  onPlay?: () => void;
  showAlbum?: boolean;
}

const TrackItem = ({ 
  track, 
  isPlaying = false, 
  onPlay,
  showAlbum = false
}: TrackItemProps) => {
  return (
    <div 
      className={cn(
        'group flex items-center justify-between p-3 rounded-xl transition-all duration-300',
        isPlaying 
          ? 'bg-primary/10 text-primary' 
          : 'hover:bg-secondary'
      )}
    >
      <div className="flex items-center space-x-3 flex-1 min-width-0">
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
          <img 
            src={track.albumArt} 
            alt={track.album || track.title}
            className="w-full h-full object-cover"
          />
          <div className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-200',
            isPlaying ? 'opacity-100' : 'group-hover:opacity-100'
          )}>
            <button 
              className="text-white"
              onClick={onPlay}
              aria-label={isPlaying ? "Now playing" : "Play"}
            >
              <PlayCircle size={28} fill={isPlaying ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        
        <div className="truncate flex-1 min-width-0">
          <h3 className={cn(
            'font-medium truncate',
            isPlaying && 'text-primary'
          )}>
            {track.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {track.artist}
            {showAlbum && track.album && ` • ${track.album}`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">{track.duration}</span>
        <button 
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
};

export default TrackItem;
