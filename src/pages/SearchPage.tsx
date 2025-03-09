
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import Header from '@/components/Header';
import { categories } from '@/data/sampleData';
import CategoryCard from '@/components/CategoryCard';
import { cn } from '@/lib/utils';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Search" />
      
      <div className="flex-1 px-4 pb-32">
        {/* Search input */}
        <div className="sticky top-16 pt-4 pb-4 bg-background z-10">
          <div 
            className={cn(
              'flex items-center gap-3 bg-secondary rounded-full px-4 py-2 transition-all duration-300',
              isFocused && 'ring-2 ring-primary'
            )}
          >
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for artists, songs, or podcasts"
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        {/* Categories */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard 
                key={category.id}
                title={category.name}
                image={category.image}
                to={`/category/${category.id}`}
                color={category.color}
                size="sm"
              />
            ))}
          </div>
        </div>
        
        {/* Recommended */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Recommended for you</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CategoryCard 
              title="Daily Mix"
              image="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop"
              to="/playlist/daily-mix"
              color="#7E57C2"
              size="md"
            />
            <CategoryCard 
              title="New Releases"
              image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop"
              to="/playlist/new-releases"
              color="#0288D1"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
