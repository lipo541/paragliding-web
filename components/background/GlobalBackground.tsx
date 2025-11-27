'use client';

import { useEffect, useState } from 'react';

const backgroundImages = [
  'https://res.cloudinary.com/dgsemkiaf/image/upload/v1764242941/pexels-photo-314726_a3cnf7.jpg',
  'https://res.cloudinary.com/dgsemkiaf/image/upload/v1764243316/light-blue-sky-high-resolution-clouds-hswmztfo862ydkpm_vckkka.jpg'
];

export default function GlobalBackground() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % 2);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-sky-100 dark:bg-sky-100" suppressHydrationWarning>
      {/* Global Ken Burns Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes globalKenBurnsZoom {
          0%, 100% {
            transform: scale(1.02) translate(0, 0);
          }
          50% {
            transform: scale(1.08) translate(-0.5%, -0.3%);
          }
        }
        @keyframes globalGradientShift {
          0%, 100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          50% {
            opacity: 0.7;
            transform: translateX(2%) translateY(-1%);
          }
        }
      `}} />
      
      {/* Rotating Background - Two special sky images */}
      {backgroundImages.map((imageUrl, index) => (
        <div
          key={`bg-${index}`}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{
            opacity: mounted ? (currentBgIndex % 2 === index ? 1 : 0) : (index === 0 ? 1 : 0),
          }}
          suppressHydrationWarning
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${imageUrl})`,
              transform: 'scale(1.02)',
              animation: 'globalKenBurnsZoom 30s ease-in-out infinite',
              animationDelay: `${index * -15}s`,
            }}
          />
        </div>
      ))}
      
      {/* Light mode overlay */}
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/60 via-white/20 to-transparent dark:hidden z-10"
      />
      
      {/* Dark mode overlay */}
      <div 
        className="absolute inset-0 pointer-events-none hidden dark:block bg-black/80 z-10"
      />
      
      {/* Subtle color accent */}
      <div 
        className="absolute inset-0 pointer-events-none z-[11]"
        style={{ 
          background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 50%, rgba(147,51,234,0.05) 100%)',
          animation: 'globalGradientShift 25s ease-in-out infinite',
        }} 
      />
    </div>
  );
}
