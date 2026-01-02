'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FlightType {
  shared_id: string;
  name_ka?: string;
  name_en?: string;
  price_gel?: number;
  price_usd?: number;
  price_eur?: number;
  features?: string[];
}

interface FlightTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (flightType: FlightType) => void;
  locationId: string;
  locale: string;
  pilotName: string;
}

export default function FlightTypeModal({
  isOpen,
  onClose,
  onSelect,
  locationId,
  locale,
  pilotName,
}: FlightTypeModalProps) {
  const [flightTypes, setFlightTypes] = useState<FlightType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && locationId) {
      fetchFlightTypes();
    }
  }, [isOpen, locationId]);

  const fetchFlightTypes = async () => {
    setLoading(true);
    try {
      // Get location_page with content that contains shared_flight_types
      const { data: locationPage, error } = await supabase
        .from('location_pages')
        .select('content')
        .eq('location_id', locationId)
        .single();

      if (error) {
        console.error('Error fetching location page:', error);
        return;
      }

      if (locationPage?.content) {
        const content = locationPage.content as any;
        
        // Get shared_flight_types from content (prices)
        const sharedFlightTypes = content.shared_flight_types || [];
        
        // Get localized flight type names from content.ka or content.en
        const kaContent = content.ka || {};
        const enContent = content.en || {};
        const kaFlightTypes = kaContent.flight_types || [];
        const enFlightTypes = enContent.flight_types || [];
        
        // Merge shared prices with localized names
        const mergedFlightTypes: FlightType[] = sharedFlightTypes.map((shared: any, index: number) => {
          // Find matching localized flight type by shared_id
          const kaLocalized = kaFlightTypes.find((lft: any) => lft.shared_id === shared.id);
          const enLocalized = enFlightTypes.find((lft: any) => lft.shared_id === shared.id);
          
          // Fallback to index-based matching if shared_id doesn't match
          const kaByIndex = kaFlightTypes[index];
          const enByIndex = enFlightTypes[index];
          
          return {
            shared_id: shared.id,
            name_ka: kaLocalized?.name || kaByIndex?.name || 'ტანდემ ფრენა',
            name_en: enLocalized?.name || enByIndex?.name || 'Tandem Flight',
            price_gel: shared.price_gel,
            price_usd: shared.price_usd,
            price_eur: shared.price_eur,
            features: (locale === 'ka' ? kaLocalized?.features : enLocalized?.features) 
              || kaLocalized?.features || kaByIndex?.features || [],
          };
        });
        
        setFlightTypes(mergedFlightTypes);
      }
    } catch (error) {
      console.error('Error fetching flight types:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = (ft: FlightType) => {
    return (locale === 'ka' ? ft.name_ka : ft.name_en) || ft.name_ka || ft.name_en || '';
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
              {locale === 'ka' ? 'აირჩიეთ ფრენის ტიპი' : 'Select flight type'}
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
          ) : flightTypes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
                {locale === 'ka' 
                  ? 'ფრენის ტიპები ვერ მოიძებნა' 
                  : 'No flight types found'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {flightTypes.map((ft) => (
                <button
                  key={ft.shared_id}
                  onClick={() => onSelect(ft)}
                  className="w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150
                    bg-[rgba(70,151,210,0.08)] dark:bg-white/5
                    border border-[#4697D2]/15 dark:border-white/10
                    hover:bg-[rgba(70,151,210,0.15)] dark:hover:bg-white/10
                    hover:border-[#4697D2]/30 dark:hover:border-white/20
                    active:scale-[0.98]
                  "
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                      {getLocalizedName(ft)}
                    </span>
                    <span className="text-sm font-bold text-[#4697D2] ml-2">
                      ₾{ft.price_gel || 0}
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
