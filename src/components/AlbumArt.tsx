
import React from 'react';
import { cn } from '@/lib/utils';

interface AlbumArtProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPlaying?: boolean;
}

const AlbumArt = ({ 
  src, 
  alt, 
  className,
  size = 'md',
  isPlaying = false
}: AlbumArtProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-48 h-48 sm:w-64 sm:h-64',
    xl: 'w-64 h-64 sm:w-80 sm:h-80'
  };

  return (
    <div 
      className={cn(
        'relative rounded-xl overflow-hidden bg-muted/50 shadow-lg transition-all duration-500',
        isPlaying ? 'shadow-xl' : 'shadow',
        sizeClasses[size],
        className
      )}
    >
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        className={cn(
          'object-cover w-full h-full transition-transform duration-500',
          isPlaying && size === 'lg' && 'scale-105'
        )}
      />
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b from-black/0 to-black/20 opacity-0 transition-opacity duration-300',
        isPlaying && 'opacity-100'
      )} />
    </div>
  );
};

export default AlbumArt;
