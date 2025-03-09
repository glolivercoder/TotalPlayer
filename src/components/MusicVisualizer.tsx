
import React, { useEffect, useRef } from 'react';

const MusicVisualizer = ({ isPlaying = false }) => {
  const bars = Array.from({ length: 12 }, (_, i) => i);
  
  // Randomize bar heights for visual effect
  const getRandomHeight = () => {
    return isPlaying ? `${Math.random() * 80 + 20}%` : '30%';
  };
  
  const getAnimationClass = (index: number) => {
    if (!isPlaying) return '';
    
    const animations = [
      'animate-wave-1',
      'animate-wave-2',
      'animate-wave-3',
      'animate-wave-4',
      'animate-wave-5',
    ];
    
    return animations[index % animations.length];
  };

  return (
    <div className="flex items-end justify-center h-12 gap-[1px]">
      {bars.map((bar, index) => (
        <div
          key={bar}
          className={`visualizer-bar ${getAnimationClass(index)}`}
          style={{ 
            height: getRandomHeight(),
            opacity: isPlaying ? 1 : 0.5,
            transitionProperty: 'height, opacity',
            transitionDuration: '0.3s',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' // This is the ease-out-expo function
          }}
        />
      ))}
    </div>
  );
};

export default MusicVisualizer;
