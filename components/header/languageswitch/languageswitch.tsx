'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LanguageSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'ka';

  const languages = [
    { code: 'ka', label: 'ქართული', short: 'ქარ', nativeName: 'Georgian' },
    { code: 'en', label: 'English', short: 'EN', nativeName: 'English' },
    { code: 'ru', label: 'Русский', short: 'РУ', nativeName: 'Russian' },
    { code: 'ar', label: 'العربية', short: 'AR', nativeName: 'Arabic' },
    { code: 'de', label: 'Deutsch', short: 'DE', nativeName: 'German' },
    { code: 'tr', label: 'Türkçe', short: 'TR', nativeName: 'Turkish' },
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLocale);

  const handleLanguageChange = async (newLocale: string) => {
    const pathParts = pathname.split('/');
    const supabase = createClient();
    const currentSlugField = `slug_${currentLocale}`;
    
    // Check if we're on a location page (e.g., /ka/locations/ka-sakarthvelo/ka-guduri)
    const isLocationPage = pathParts.length >= 5 && pathParts[2] === 'locations';
    
    if (isLocationPage) {
      const countrySlug = pathParts[3];
      const locationSlug = pathParts[4];
      
      try {
        // First, get the country with its new slug
        const { data: country } = await supabase
          .from('countries')
          .select('*')
          .eq(currentSlugField, countrySlug)
          .eq('is_active', true)
          .single();
        
        if (country) {
          // Then, get the location with its new slug
          const { data: location } = await supabase
            .from('locations')
            .select('*')
            .eq(currentSlugField, locationSlug)
            .eq('country_id', country.id)
            .single();
          
          if (location) {
            const newCountrySlug = country[`slug_${newLocale}` as keyof typeof country];
            const newLocationSlug = location[`slug_${newLocale}` as keyof typeof location];
            
            if (newCountrySlug && newLocationSlug) {
              router.push(`/${newLocale}/locations/${newCountrySlug}/${newLocationSlug}`);
              setIsOpen(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching location slugs:', error);
      }
    }
    
    // Check if we're on a country page
    const isCountryPage = pathParts.length === 4 && pathParts[2] === 'locations';
    
    if (isCountryPage) {
      const currentSlug = pathParts[3];
      
      try {
        const { data: country } = await supabase
          .from('countries')
          .select('*')
          .eq(currentSlugField, currentSlug)
          .eq('is_active', true)
          .single();
        
        if (country) {
          const newSlugField = `slug_${newLocale}`;
          const newSlug = country[newSlugField as keyof typeof country];
          
          if (newSlug) {
            router.push(`/${newLocale}/locations/${newSlug}`);
            setIsOpen(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching country slug:', error);
      }
    }
    
    // Fallback: just replace the locale in the path
    const pathWithoutLocale = pathname.replace(/^\/[^\/]+/, '');
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-[#1a1a1a] dark:text-white backdrop-blur-md bg-gradient-to-br from-[rgba(70,151,210,0.3)] to-[rgba(70,151,210,0.2)] dark:bg-black/20 dark:from-transparent dark:to-transparent border border-[#4697D2]/40 dark:border-white/20 rounded-md hover:from-[rgba(70,151,210,0.4)] hover:to-[rgba(70,151,210,0.3)] dark:hover:bg-black/30 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:ring-white/30 w-[50px] md:w-[100px]"
      >
        <span className="flex-1 text-left text-[10px] md:text-sm font-bold md:font-medium">
          <span className="md:hidden">{currentLanguage?.short}</span>
          <span className="hidden md:inline">{currentLanguage?.label}</span>
        </span>
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#4697D2] dark:bg-zinc-900 border border-[#4697D2] dark:border-white/20 rounded-xl shadow-xl shadow-[#4697D2]/30 dark:shadow-black/30 overflow-hidden z-[120] animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                currentLocale === lang.code
                  ? 'bg-white/20 dark:bg-white/10 text-white font-medium'
                  : 'text-white/90 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="font-medium">{lang.label}</span>
              {currentLocale === lang.code && (
                <svg className="w-4 h-4 text-[#CAFA00]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
