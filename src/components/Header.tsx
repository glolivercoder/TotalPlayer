
import React, { useState } from 'react';
import { ChevronLeft, UserCircle, Bell, Search, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  className?: string;
  transparent?: boolean;
}

const Header = ({ 
  title, 
  showBackButton = false, 
  className,
  transparent = false
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleBack = () => {
    navigate(-1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  const getTitle = () => {
    if (title) return title;
    
    // Default titles based on route
    const pathMapping: Record<string, string> = {
      '/': 'Home',
      '/search': 'Search',
      '/library': 'Your Library',
      '/downloads': 'Downloads',
      '/karaoke': 'Karaoke',
      '/equalizer': 'Equalizer'
    };
    
    return pathMapping[location.pathname] || '';
  };

  return (
    <header 
      className={cn(
        'sticky top-0 z-10 px-4 py-4 flex items-center justify-between transition-colors duration-300',
        transparent ? 'bg-transparent' : 'glass',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="rounded-full p-2 -ml-2 hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <h1 className="text-xl font-semibold">{getTitle()}</h1>
      </div>
      
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search music, artists, albums..."
            className="w-full py-2 pl-10 pr-4 rounded-full bg-secondary border-transparent focus:border-primary focus:bg-background focus:ring-0 text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>
      
      <div className="flex items-center gap-2">
        <button 
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
        
        <button 
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Profile"
        >
          <UserCircle size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
