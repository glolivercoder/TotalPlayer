
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  image: string;
  to: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CategoryCard = ({ 
  title, 
  image, 
  to, 
  color = 'rgb(29, 185, 84)',  // Spotify green default
  size = 'md',
  className
}: CategoryCardProps) => {
  const sizeClasses = {
    sm: 'h-36 w-36',
    md: 'h-44 w-44',
    lg: 'h-52 w-52'
  };
  
  return (
    <Link
      to={to}
      className={cn(
        'group relative rounded-2xl overflow-hidden hover-lift',
        sizeClasses[size],
        className
      )}
    >
      <div 
        className="absolute inset-0 opacity-90 mix-blend-multiply"
        style={{ backgroundColor: color }}
      />
      
      <img 
        src={image} 
        alt={title}
        className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
      />
      
      <div className="absolute inset-0 flex items-end p-4">
        <h3 className="text-white font-bold text-xl drop-shadow-md">{title}</h3>
      </div>
    </Link>
  );
};

export default CategoryCard;
