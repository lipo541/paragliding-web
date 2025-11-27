'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-16 h-8 rounded-full bg-[#4697D2]/20" aria-label="Loading theme toggle">
        {/* Placeholder skeleton */}
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4697D2]/30 hover:scale-105 active:scale-95 transform border"
      style={{
        background: isDark 
          ? 'linear-gradient(to right, #1a1a1a, #0a0a0a)' 
          : 'linear-gradient(to right, rgba(70, 151, 210, 0.3), rgba(70, 151, 210, 0.5))',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(70, 151, 210, 0.4)',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle circle */}
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ease-in-out transform ${
          isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #CAFA00, #a8d600)' 
            : 'linear-gradient(135deg, #ffffff, #f0f0f0)',
          boxShadow: isDark 
            ? '0 0 10px rgba(202, 250, 0, 0.5), inset -2px -2px 4px rgba(0,0,0,0.2)' 
            : '0 0 10px rgba(70, 151, 210, 0.3), inset -2px -2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Sun/Moon icon inside the circle */}
        <div className="w-full h-full flex items-center justify-center">
          {isDark ? (
            // Moon icon
            <svg
              className="w-4 h-4 text-[#1a1a1a]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            // Sun icon
            <svg
              className="w-4 h-4 text-[#4697D2]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Stars for dark mode */}
      {isDark && (
        <>
          <div className="absolute top-2 left-3 w-1 h-1 bg-[#CAFA00] rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-4 left-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-5 left-4 w-0.5 h-0.5 bg-[#CAFA00]/70 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}

      {/* Clouds for light mode */}
      {!isDark && (
        <>
          <div className="absolute top-2 right-3 w-2 h-1 bg-white/60 rounded-full" />
          <div className="absolute top-3 right-2 w-2.5 h-1 bg-white/50 rounded-full" />
          <div className="absolute top-5 right-4 w-1.5 h-0.5 bg-white/70 rounded-full" />
        </>
      )}
    </button>
  );
}
