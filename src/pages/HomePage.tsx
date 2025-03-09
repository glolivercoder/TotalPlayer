
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
      
      <div className="flex-1 px-4 pb-32">
        {/* Recently played */}
        <section className="my-6 animate-slide-up animation-delay-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recently Played</h2>
            <Link 
              to="/recently-played" 
              className="text-sm text-muted-foreground flex items-center hover:text-primary transition-colors"
            >
              See all
              <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.slice(0, 5).map((album) => (
              <Link 
                key={album.id}
                to={`/album/${album.id}`}
                className="flex flex-col items-center text-center group hover-lift"
              >
                <AlbumArt 
                  src={album.cover} 
                  alt={album.title}
                  size="md"
                  className="shadow-md mb-3 rounded-xl"
                />
                <h3 className="font-medium text-sm truncate w-full">{album.title}</h3>
                <p className="text-muted-foreground text-xs truncate w-full">{album.artist}</p>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Made for you */}
        <section className="my-10 animate-slide-up animation-delay-200">
          <h2 className="text-xl font-semibold mb-4">Made For You</h2>
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/20 p-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img 
                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop" 
                alt="Weekly Mix"
                className="rounded-xl w-40 h-40 object-cover shadow-lg"
              />
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">Your Weekly Mix</h3>
                <p className="text-muted-foreground mb-4">Personalized tracks based on your listening history</p>
                
                <button className="bg-primary text-primary-foreground font-medium px-6 py-2 rounded-full hover:bg-primary/90 transition-colors">
                  Play Now
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Recently added */}
        <section className="my-10 animate-slide-up animation-delay-300">
          <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
          <div className="space-y-2">
            {tracks.slice(0, 4).map((track) => (
              <TrackItem 
                key={track.id}
                track={track}
                isPlaying={currentTrackId === track.id}
                onPlay={() => handlePlayTrack(track.id)}
                showAlbum
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
