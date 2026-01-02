'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru?: string;
}

interface LocationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  locationIds: string[];
  locale: string;
  pilotName: string;
}

export default function LocationSelectModal({
  isOpen,
  onClose,
  onSelect,
  locationIds,
  locale,
  pilotName,
}: LocationSelectModalProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && locationIds.length > 0) {
      fetchLocations();
    }
  }, [isOpen, locationIds]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name_ka, name_en, name_ru')
        .in('id', locationIds);

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = (location: Location) => {
    if (locale === 'en') return location.name_en || location.name_ka;
    if (locale === 'ru') return location.name_ru || location.name_ka;
    return location.name_ka;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Compact */}
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#4697D2]/30 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#4697D2]/20 dark:border-white/10">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#1a1a1a] dark:text-white truncate">
              {pilotName}
            </h3>
            <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
              {locale === 'ka' ? 'აირჩიეთ ლოკაცია' : 'Select location'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#4697D2]/10 dark:hover:bg-white/10 text-[#1a1a1a] dark:text-white transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content - Compact */}
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[#4697D2]" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
                {locale === 'ka' 
                  ? 'ლოკაციები ვერ მოიძებნა' 
                  : 'No locations found'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => onSelect(location)}
                  className="w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150
                    bg-[rgba(70,151,210,0.08)] dark:bg-white/5
                    border border-[#4697D2]/15 dark:border-white/10
                    hover:bg-[rgba(70,151,210,0.15)] dark:hover:bg-white/10
                    hover:border-[#4697D2]/30 dark:hover:border-white/20
                    active:scale-[0.98]
                  "
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#4697D2]" />
                    <span className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                      {getLocalizedName(location)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
