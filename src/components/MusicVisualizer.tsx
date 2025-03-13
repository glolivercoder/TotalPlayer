import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MusicVisualizerProps {
  isPlaying: boolean;
  className?: string;
}

const MusicVisualizer = ({ isPlaying, className }: MusicVisualizerProps) => {
  const [heights, setHeights] = useState<number[]>([]);
  const animationRef = useRef<number>();
  const barCount = 16;
  
  useEffect(() => {
    // Inicializar alturas
    if (heights.length === 0) {
      setHeights(Array(barCount).fill(0).map(() => Math.random() * 0.5 + 0.1));
    }
    
    const updateHeights = () => {
      if (isPlaying) {
        setHeights(prev => 
          prev.map(h => {
            // Gerar nova altura com base na anterior para suavizar a transição
            const target = Math.random() * 0.8 + 0.2;
            const step = Math.random() * 0.2;
            return h + (target - h) * step;
          })
        );
      } else {
        // Quando não está tocando, barras ficam baixas e paradas
        setHeights(prev => 
          prev.map(h => {
            const target = 0.1;
            return h + (target - h) * 0.1;
          })
        );
      }
      
      animationRef.current = requestAnimationFrame(updateHeights);
    };
    
    animationRef.current = requestAnimationFrame(updateHeights);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  return (
    <div className={cn("music-visualizer", className)}>
      {heights.map((height, index) => (
        <div 
          key={index}
          className="music-visualizer-bar"
          style={{
            height: `${Math.max(height * 100, 5)}%`,
            opacity: isPlaying ? 0.8 + (height * 0.2) : 0.4,
            backgroundColor: isPlaying ? `hsl(${210 + index * 5}, 100%, 50%)` : 'var(--muted)',
            transition: 'opacity 0.3s ease'
          }}
        />
      ))}
    </div>
  );
};

export default MusicVisualizer;
