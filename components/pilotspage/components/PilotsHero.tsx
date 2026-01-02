'use client';

import { User } from 'lucide-react';

interface PilotsHeroProps {
  title: string;
  subtitle: string;
  badge: string;
  totalCount: number;
}

export default function PilotsHero({ 
  title, 
  subtitle, 
  badge,
  totalCount 
}: PilotsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-xl mb-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2]/15 via-[#4697D2]/5 to-transparent dark:from-[#4697D2]/25 dark:via-[#4697D2]/10 dark:to-transparent" />
      
      {/* Glass effect */}
      <div className="absolute inset-0 backdrop-blur-md" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4697D2]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Content */}
      <div className="relative z-10 px-4 py-5 md:px-6 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1">
            {/* Title - H1 for SEO */}
            <h1 className="text-xl md:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">
              {title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-[#2d2d2d]/70 dark:text-white/60 line-clamp-2 max-w-xl">
              {subtitle}
            </p>
          </div>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4697D2]/15 dark:bg-[#4697D2]/25 border border-[#4697D2]/20 dark:border-[#4697D2]/30 self-start md:self-center">
            <User className="w-3.5 h-3.5 text-[#4697D2] dark:text-white" />
            <span className="text-xs font-medium text-[#1a1a1a] dark:text-white">
              {badge}
            </span>
            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-[#4697D2] text-white min-w-[20px] text-center">
              {totalCount}
            </span>
          </div>
        </div>
      </div>
      
      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4697D2]/30 to-transparent" />
    </section>
  );
}
