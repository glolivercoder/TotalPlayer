import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import AlbumArt from '@/components/AlbumArt';
import TrackItem from '@/components/TrackItem';
import { albums, tracks } from '@/data/sampleData';
import { cn } from '@/lib/utils';

const HomePage = () => {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  
  const handlePlayTrack = (id: string) => {
    setCurrentTrackId(id);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 px-2 pb-24 overflow-y-auto">
        {/* Recently played */}
        <section className="my-3 animate-slide-up animation-delay-100">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Recently Played</h2>
            <Link 
              to="/recently-played" 
              className="text-xs text-muted-foreground flex items-center hover:text-primary transition-colors"
            >
              See all
              <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {albums.slice(0, 6).map((album) => (
              <Link 
                key={album.id}
                to={`/album/${album.id}`}
                className="flex flex-col items-center text-center group hover-lift"
              >
                <AlbumArt 
                  src={album.cover} 
                  alt={album.title}
                  size="xs"
                  className="shadow-sm mb-1 rounded-lg"
                />
                <h3 className="font-medium text-xs truncate w-full">{album.title}</h3>
                <p className="text-muted-foreground text-[10px] truncate w-full">{album.artist}</p>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Made for you */}
        <section className="my-4 animate-slide-up animation-delay-200">
          <h2 className="text-lg font-semibold mb-2">Made For You</h2>
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/20 p-3">
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop" 
                alt="Weekly Mix"
                className="rounded-lg w-20 h-20 object-cover shadow-md"
              />
              
              <div className="flex-1">
                <h3 className="text-base font-bold mb-1">Your Weekly Mix</h3>
                <p className="text-muted-foreground text-xs mb-2">Personalized tracks based on your history</p>
                
                <button className="bg-primary text-primary-foreground font-medium px-4 py-1 text-xs rounded-full hover:bg-primary/90 transition-colors">
                  Play Now
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Recently added */}
        <section className="my-4 animate-slide-up animation-delay-300">
          <h2 className="text-lg font-semibold mb-2">Recently Added</h2>
          <div className="space-y-1">
            {tracks.slice(0, 5).map((track) => (
              <TrackItem 
                key={track.id}
                track={track}
                isPlaying={currentTrackId === track.id}
                onPlay={() => handlePlayTrack(track.id)}
                showAlbum
                compact
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
