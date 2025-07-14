// components/DashboardTile.tsx
import { ReactNode } from 'react';
import Link from 'next/link';

type TileProps = {
  label: string;
  icon: ReactNode;
  href: string;
  bgColor: string;
};

export default function DashboardTile({ label, icon, href, bgColor }: TileProps) {
  // Define gradient mappings for different background colors
  const getGradient = (bgColor: string) => {
    const gradients: { [key: string]: string } = {
      'bg-green-500': 'from-emerald-400 to-green-600',
      'bg-pink-500': 'from-pink-400 to-rose-600',
      'bg-purple-600': 'from-violet-500 to-purple-700',
      'bg-lime-500': 'from-lime-400 to-green-500',
      'bg-indigo-600': 'from-indigo-500 to-blue-600',
      'bg-cyan-500': 'from-cyan-400 to-blue-500',
      'bg-yellow-400': 'from-yellow-400 to-orange-500',
      'bg-red-500': 'from-red-400 to-pink-600',
      'bg-blue-500': 'from-blue-400 to-indigo-600',
      'bg-orange-500': 'from-orange-400 to-red-500',
    };
    return gradients[bgColor] || 'from-gray-400 to-gray-600';
  };

  return (
    <Link href={href} className="block">
      <div className={`
        group relative overflow-hidden rounded-2xl p-6 
        bg-gradient-to-br ${getGradient(bgColor)} bg-white/20
        shadow-lg hover:shadow-2xl 
        transform hover:scale-105 hover:-translate-y-1
        transition-all duration-300 ease-out
        border border-white/20
        backdrop-blur-2xl
        max-w-xs w-full mx-auto
      `}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-bl-full transform rotate-45 translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center space-x-4">
          {/* Icon container with enhanced styling */}
          <div className="
            flex items-center justify-center w-14 h-14 
            bg-white/30 rounded-xl backdrop-blur-2xl
            group-hover:bg-white/50 group-hover:scale-110
            transition-all duration-300 ease-out
            border border-white/40
          ">
            <div className="text-2xl text-white group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex-1">
            <div className="text-xl font-bold text-white group-hover:text-white/90 transition-colors duration-300">
              {label}
            </div>
            <div className="text-white/80 text-sm font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to access
            </div>
          </div>
          
          {/* Arrow indicator */}
          <div className="
            text-white/60 group-hover:text-white 
            transform translate-x-2 group-hover:translate-x-0
            transition-all duration-300 ease-out
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </Link>
  );
}
