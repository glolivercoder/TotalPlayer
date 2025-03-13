import React from 'react';
import { cn } from '@/lib/utils';

interface AlbumArtProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isPlaying?: boolean;
  className?: string;
}

const AlbumArt = ({ src, alt, size = 'md', isPlaying = false, className }: AlbumArtProps) => {
  const sizeClasses = {
    xs: 'w-10 h-10',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full h-full max-w-xs max-h-xs'
  };
  
  return (
    <div 
      className={cn(
        'album-art relative overflow-hidden rounded-lg bg-background/20',
        sizeClasses[size],
        isPlaying && 'album-art-playing',
        className
      )}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to default image if loading fails
          const target = e.target as HTMLImageElement;
          target.src = '/default-album-art.png';
        }}
      />
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className={cn(
            'bg-white rounded-full animate-pulse',
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          )}></div>
        </div>
      )}
    </div>
  );
};

export default AlbumArt;
