
import React from 'react';
import { ChevronLeft, UserCircle, Bell } from 'lucide-react';
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
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const getTitle = () => {
    if (title) return title;
    
    // Default titles based on route
    const pathMapping: Record<string, string> = {
      '/': 'Home',
      '/search': 'Search',
      '/library': 'Your Library',
      '/downloads': 'Downloads'
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
      <div className="flex items-center gap-4">
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
