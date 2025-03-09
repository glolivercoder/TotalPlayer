
import React, { useState } from 'react';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

const EqualizerPage = () => {
  const [bands, setBands] = useState({
    bass: 50,
    lowMid: 50,
    mid: 50,
    highMid: 50,
    treble: 50
  });
  
  const [preset, setPreset] = useState('custom');
  
  const presets = [
    { name: 'Flat', id: 'flat' },
    { name: 'Bass Boost', id: 'bass' },
    { name: 'Treble Boost', id: 'treble' },
    { name: 'Electronic', id: 'electronic' },
    { name: 'Rock', id: 'rock' },
    { name: 'Pop', id: 'pop' },
    { name: 'Jazz', id: 'jazz' },
    { name: 'Classical', id: 'classical' },
    { name: 'Custom', id: 'custom' }
  ];
  
  const handleBandChange = (band: keyof typeof bands, value: number) => {
    setBands(prev => ({
      ...prev,
      [band]: value
    }));
    // When manually adjusting, switch to custom preset
    setPreset('custom');
  };
  
  const handlePresetChange = (presetId: string) => {
    setPreset(presetId);
    
    // Apply preset values (these would come from your audio processing library)
    if (presetId === 'flat') {
      setBands({ bass: 50, lowMid: 50, mid: 50, highMid: 50, treble: 50 });
    } else if (presetId === 'bass') {
      setBands({ bass: 80, lowMid: 65, mid: 50, highMid: 45, treble: 40 });
    } else if (presetId === 'treble') {
      setBands({ bass: 40, lowMid: 45, mid: 50, highMid: 65, treble: 80 });
    } else if (presetId === 'rock') {
      setBands({ bass: 65, lowMid: 45, mid: 30, highMid: 55, treble: 70 });
    }
    // Other presets would be defined similarly
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton />
      
      <div className="flex-1 px-4 pb-32">
        <div className="my-6 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Equalizer Presets</h2>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.id}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    p.id === preset 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                  onClick={() => handlePresetChange(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">5-Band Equalizer</h2>
            
            <div className="grid grid-cols-5 gap-6 h-60">
              {Object.entries(bands).map(([band, value]) => (
                <div key={band} className="flex flex-col items-center gap-2">
                  <span className="text-sm font-medium capitalize">{band}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleBandChange(band as keyof typeof bands, parseInt(e.target.value))}
                    className="h-full w-2 appearance-none bg-secondary rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    style={{ 
                      WebkitAppearance: 'slider-vertical',
                      writingMode: 'bt-lr' 
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EqualizerPage;
