'use client';

import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface CompaniesSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  resultText: string;
}

export default function CompaniesSearch({
  value,
  onChange,
  placeholder,
  resultCount,
  resultText
}: CompaniesSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChange]);

  return (
    <div className="relative mb-3">
      {/* Search input container */}
      <div className="relative group">
        {/* Glass background */}
        <div className="absolute inset-0 rounded-lg backdrop-blur-md bg-white/40 dark:bg-black/25 border border-[#4697D2]/15 dark:border-white/10 transition-all duration-200 group-focus-within:border-[#4697D2]/40" />
        
        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Search icon */}
          <div className="absolute left-3 pointer-events-none">
            <Search className="w-4 h-4 text-[#4697D2]/60 dark:text-white/40 transition-colors group-focus-within:text-[#4697D2] dark:group-focus-within:text-white" />
          </div>
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-20 py-2.5 bg-transparent text-[#1a1a1a] dark:text-white placeholder-[#2d2d2d]/40 dark:placeholder-white/30 text-sm focus:outline-none"
            aria-label={placeholder}
          />
          
          {/* Right side: Clear button & keyboard shortcut */}
          <div className="absolute right-3 flex items-center gap-1.5">
            {value && (
              <button
                onClick={() => onChange('')}
                className="p-1 rounded hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-[#2d2d2d]/60 dark:text-white/50" />
              </button>
            )}
            
            {/* Keyboard shortcut hint - hidden on mobile */}
            <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#4697D2]/10 dark:bg-white/10 text-[10px] text-[#2d2d2d]/50 dark:text-white/40">
              <kbd className="font-mono">⌘K</kbd>
            </div>
          </div>
        </div>
      </div>
      
      {/* Result count - inline when searching */}
      {value && (
        <div className="absolute right-0 -bottom-5 text-xs text-[#2d2d2d]/60 dark:text-white/50">
          {resultCount} {resultText}
        </div>
      )}
    </div>
  );
}
