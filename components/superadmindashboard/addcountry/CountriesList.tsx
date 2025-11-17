'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CountriesListProps {
  onEdit?: (countryId: string) => void;
}

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_en: string;
  content: any;
  is_active: boolean;
  created_at: string;
}

export default function CountriesList({ onEdit }: CountriesListProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name_ka', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, countryName: string) => {
    try {
      const { error } = await supabase
        .from('countries')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Refresh list
      fetchCountries();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert(`შეცდომა ${countryName}-ის სტატუსის შეცვლისას!`);
    }
  };

  const getAvailableLanguages = (content: any) => {
    if (!content) return [];
    
    const languageMap: { [key: string]: string } = {
      ka: 'ka',
      en: 'en',
      ru: 'ru',
      ar: 'ar',
      de: 'de',
      tr: 'tr',
    };

    const allLanguages = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
    
    return allLanguages.map(lang => ({
      code: languageMap[lang],
      filled: content[lang] && Object.keys(content[lang]).length > 0 && 
             (content[lang].h1_tag || content[lang].p_tag || content[lang].history_text)
    }));
  };

  const hasImages = (content: any) => {
    if (!content || !content.shared_images) return false;
    return !!(content.shared_images.hero_image || content.shared_images.gallery?.length > 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-foreground/60">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-foreground">ქვეყნები არ მოიძებნა</h3>
        <p className="mt-2 text-sm text-foreground/60">
          დარწმუნდით რომ countries ცხრილში არის ჩანაწერები
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground/60">
          ქვეყნების სია ({countries.length})
        </h3>
      </div>

      {/* Countries List */}
      <div className="space-y-2">
        {countries.map((country) => {
          const availableLanguages = getAvailableLanguages(country.content);
          const hasContent = !!country.content && Object.keys(country.content).length > 0;
          const imagesUploaded = hasImages(country.content);

          return (
            <div
              key={country.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-foreground/10 hover:border-foreground/20 transition-colors bg-background"
            >
              {/* Country Flag/Icon */}
              <svg className="w-5 h-5 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              {/* Country Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {country.name_ka}
                  </span>
                  <span className="text-xs text-foreground/40">
                    ({country.slug_en})
                  </span>
                  
                  {/* Content Status Indicators */}
                  <div className="flex items-center gap-2">
                    {/* Images Badge */}
                    {imagesUploaded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        სურათები
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        სურათები არ არის
                      </span>
                    )}
                    
                    {/* Languages */}
                    <div className="flex gap-1">
                      {availableLanguages.map((lang, idx) => (
                        <span 
                          key={idx} 
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            lang.filled 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                          }`}
                          title={lang.filled ? `${lang.code} - შევსებულია` : `${lang.code} - ცარიელია`}
                        >
                          {lang.code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-foreground/50">
                    EN: {country.name_en}
                  </span>
                  {hasContent && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ● კონტენტი დამატებულია
                    </span>
                  )}
                  {!hasContent && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      ○ კონტენტი არ არის
                    </span>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(country.id, country.is_active, country.name_ka)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    country.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={country.is_active ? 'აქტიური - დაკლიკებით გამორთვა' : 'გამორთული - დაკლიკებით ჩართვა'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      country.is_active ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Edit Action */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit?.(country.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                  title="კონტენტის რედაქტირება"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            დააწკაპუნეთ რედაქტირების ღილაკზე ქვეყნის კონტენტის დასამატებლად ან შესაცვლელად. 
            ქვეყნების წაშლა არ არის შესაძლებელი - მხოლოდ გამორთვა is_active სტატუსით.
          </span>
        </p>
      </div>
    </div>
  );
}
