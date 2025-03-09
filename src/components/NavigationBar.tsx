
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LibraryBig, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavigationBar = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: LibraryBig, label: 'Library', path: '/library' },
    { icon: Download, label: 'Downloads', path: '/downloads' }
  ];
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="glass fixed bottom-3 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 z-10 animate-slide-up">
      <ul className="flex items-center space-x-10">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className="flex flex-col items-center"
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <div 
                className={cn(
                  'transition-all duration-300 p-2 rounded-full',
                  isActive(item.path) 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon size={20} />
              </div>
              <span 
                className={cn(
                  'text-xs mt-1 transition-colors duration-300',
                  isActive(item.path) 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavigationBar;
