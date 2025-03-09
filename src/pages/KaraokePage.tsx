
import React, { useState } from 'react';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { Mic, VolumeX, Music, ArrowDownUp } from 'lucide-react';

const KaraokePage = () => {
  const [vocalRemoval, setVocalRemoval] = useState(false);
  const [pitchShift, setPitchShift] = useState(0);
  const [tempo, setTempo] = useState(100);
  const [voiceType, setVoiceType] = useState('normal');
  
  const voiceTypes = [
    { id: 'male', name: 'Male Voice' },
    { id: 'female', name: 'Female Voice' },
    { id: 'tenor', name: 'Tenor' },
    { id: 'baritone', name: 'Baritone' },
    { id: 'soprano', name: 'Soprano' },
    { id: 'normal', name: 'Normal' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton />
      
      <div className="flex-1 px-4 pb-32">
        <div className="my-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Karaoke Settings</h2>
          
          <div className="glass rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <VolumeX size={24} className={vocalRemoval ? 'text-primary' : 'text-muted-foreground'} />
                <div>
                  <h3 className="font-medium">Vocal Removal</h3>
                  <p className="text-sm text-muted-foreground">Remove vocals from the track</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={vocalRemoval}
                  onChange={() => setVocalRemoval(!vocalRemoval)}
                />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium flex items-center gap-2">
                  <ArrowDownUp size={18} /> 
                  Pitch Adjustment
                </label>
                <span className="text-sm font-medium">{pitchShift > 0 ? `+${pitchShift}` : pitchShift}</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={pitchShift}
                onChange={(e) => setPitchShift(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-12</span>
                <span>0</span>
                <span>+12</span>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium flex items-center gap-2">
                  <Music size={18} /> 
                  Tempo
                </label>
                <span className="text-sm font-medium">{tempo}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>
            
            <div>
              <label className="font-medium flex items-center gap-2 mb-3">
                <Mic size={18} /> 
                Voice Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {voiceTypes.map(type => (
                  <button
                    key={type.id}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm transition-colors",
                      type.id === voiceType 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    onClick={() => setVoiceType(type.id)}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KaraokePage;
