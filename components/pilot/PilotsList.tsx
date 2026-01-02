'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, ChevronDown, Loader2 } from 'lucide-react';
import PilotCard, { type PilotCardData } from './PilotCard';
import FlightTypeModal from './FlightTypeModal';
import { useCart } from '@/lib/context/CartContext';

interface PilotsListProps {
  locationId: string;
  locationName?: string;
  locale: string;
  initialLimit?: number;
}

export default function PilotsList({ locationId, locationName, locale, initialLimit = 6 }: PilotsListProps) {
  const [pilots, setPilots] = useState<PilotCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(initialLimit);
  
  // Cart and modal state
  const { addItem } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<{ pilot: PilotCardData; quantity: number } | null>(null);
  
  const supabase = createClient();

  // Handle add to cart - opens flight type modal
  const handleAddToCart = useCallback((pilot: PilotCardData, quantity: number) => {
    setSelectedPilot({ pilot, quantity });
    setModalOpen(true);
  }, []);

  // Handle flight type selection from modal
  const handleFlightTypeSelect = useCallback((flightType: { shared_id: string; name_ka?: string; name_en?: string; price_gel?: number }) => {
    if (!selectedPilot) return;
    
    const { pilot, quantity } = selectedPilot;
    const pilotName = (locale === 'ka' 
      ? `${pilot.first_name_ka || ''} ${pilot.last_name_ka || ''}` 
      : `${pilot.first_name_en || ''} ${pilot.last_name_en || ''}`
    ).trim() || 'პილოტი';
    
    const flightTypeName = (locale === 'ka' ? flightType.name_ka : flightType.name_en) || flightType.name_ka || '';
    
    // Get localized slugs with ID fallback
    const pilotSlug = (pilot as any)[`slug_${locale}`] || (pilot as any).slug_en || (pilot as any).slug_ka || pilot.id;
    const companySlug = pilot.company ? ((pilot.company as any)[`slug_${locale}`] || (pilot.company as any).slug_en || (pilot.company as any).slug_ka) : undefined;
    
    addItem({
      type: flightType.shared_id,
      name: flightTypeName,
      price: flightType.price_gel || 0,
      quantity: quantity,
      pilot: {
        id: pilot.id,
        name: pilotName,
        avatarUrl: pilot.avatar_url || undefined,
        slug: pilotSlug,
      },
      company: pilot.company ? {
        id: pilot.company.id,
        name: (locale === 'ka' ? pilot.company.name_ka : pilot.company.name_en) || pilot.company.name_ka || '',
        logoUrl: pilot.company.logo_url || undefined,
        slug: companySlug || undefined,
      } : undefined,
      location: locationName ? {
        id: locationId,
        name: locationName,
      } : undefined,
    });
    
    setModalOpen(false);
    setSelectedPilot(null);
  }, [selectedPilot, addItem, locale, locationId, locationName]);

  // Fetch pilots for this location
  const fetchPilots = useCallback(async () => {
    try {
      // Get total count first (only pilots with company)
      const { count } = await supabase
        .from('pilots')
        .select('*', { count: 'exact', head: true })
        .contains('location_ids', [locationId])
        .eq('status', 'verified')
        .not('company_id', 'is', null);
      
      setTotalCount(count || 0);
      setHasMore((count || 0) > displayCount);

      // Get pilots with company info
      const { data, error } = await supabase
        .from('pilots')
        .select(`
          id,
          first_name_ka,
          first_name_en,
          first_name_ru,
          last_name_ka,
          last_name_en,
          last_name_ru,
          avatar_url,
          bio_ka,
          bio_en,
          bio_ru,
          commercial_start_date,
          tandem_flights,
          languages,
          status,
          cached_rating,
          cached_rating_count,
          slug_ka,
          slug_en,
          company:companies(
            id,
            name_ka,
            name_en,
            logo_url,
            slug_ka,
            slug_en
          )
        `)
        .contains('location_ids', [locationId])
        .eq('status', 'verified')
        .not('company_id', 'is', null)
        .order('cached_rating', { ascending: false })
        .order('tandem_flights', { ascending: false, nullsFirst: false })
        .limit(displayCount);

      if (error) {
        console.error('Error fetching pilots:', error?.message || JSON.stringify(error, null, 2));
        return;
      }

      setPilots(data || []);
    } catch (err: any) {
      console.error('Pilots fetch error:', err?.message || JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [supabase, locationId, displayCount]);

  useEffect(() => {
    fetchPilots();
  }, [fetchPilots]);

  // Load more pilots
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const newLimit = displayCount + initialLimit;
    setDisplayCount(newLimit);
    
    const { data, error } = await supabase
      .from('pilots')
      .select(`
        id,
        first_name_ka,
        first_name_en,
        first_name_ru,
        last_name_ka,
        last_name_en,
        last_name_ru,
        avatar_url,
        bio_ka,
        bio_en,
        bio_ru,
        commercial_start_date,
        tandem_flights,
        languages,
        status,
        cached_rating,
        cached_rating_count,
        slug_ka,
        slug_en,
        company:companies(
          id,
          name_ka,
          name_en,
          logo_url
        )
      `)
      .contains('location_ids', [locationId])
      .eq('status', 'verified')
      .not('company_id', 'is', null)
      .order('cached_rating', { ascending: false })
      .order('tandem_flights', { ascending: false, nullsFirst: false })
      .limit(newLimit);

    if (!error && data) {
      setPilots(data);
      setHasMore(totalCount > newLimit);
    }
    
    setLoadingMore(false);
  }, [supabase, locationId, displayCount, initialLimit, totalCount]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#4697D2]" />
      </div>
    );
  }

  // No pilots - show "coming soon" message
  if (pilots.length === 0) {
    return (
      <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.08)] dark:bg-black/30 border border-[#4697D2]/20 dark:border-white/10 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4697D2]/10 dark:bg-[#4697D2]/20 flex items-center justify-center">
          <Users className="w-8 h-8 text-[#4697D2]" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-white mb-2">
          {locale === 'ka' ? 'პილოტები მალე' : 'Pilots Coming Soon'}
        </h3>
        <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 max-w-md mx-auto">
          {locale === 'ka' 
            ? 'ამ ლოკაციაზე მალე გამოჩნდებიან ვერიფიცირებული პილოტები. თვალი ადევნეთ განახლებებს!'
            : 'Verified pilots will appear here soon. Stay tuned for updates!'
          }
        </p>
      </div>
    );
  }

  // Get pilot name for modal
  const getSelectedPilotName = () => {
    if (!selectedPilot) return '';
    const { pilot } = selectedPilot;
    return (locale === 'ka' 
      ? `${pilot.first_name_ka || ''} ${pilot.last_name_ka || ''}` 
      : `${pilot.first_name_en || ''} ${pilot.last_name_en || ''}`
    ).trim() || 'პილოტი';
  };

  return (
    <div className="space-y-4">
      {/* Pilots grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pilots.map((pilot) => (
          <PilotCard
            key={pilot.id}
            pilot={pilot}
            locale={locale}
            locationId={locationId}
            locationName={locationName}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="
              inline-flex items-center gap-2 px-6 py-2.5
              rounded-xl font-medium text-sm
              bg-[rgba(70,151,210,0.15)] dark:bg-white/10
              text-[#4697D2] dark:text-white
              border border-[#4697D2]/30 dark:border-white/20
              hover:bg-[rgba(70,151,210,0.25)] dark:hover:bg-white/15
              hover:border-[#4697D2]/50 dark:hover:border-white/30
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {locale === 'ka' 
              ? `მეტის ნახვა (${totalCount - pilots.length} დარჩენილი)`
              : `Show more (${totalCount - pilots.length} remaining)`
            }
          </button>
        </div>
      )}
      
      {/* Total count info */}
      {pilots.length > 0 && (
        <p className="text-center text-xs text-[#1a1a1a]/40 dark:text-white/40">
          {locale === 'ka' 
            ? `ნაჩვენებია ${pilots.length} / ${totalCount} პილოტი`
            : `Showing ${pilots.length} of ${totalCount} pilots`
          }
        </p>
      )}
      
      {/* Flight Type Selection Modal */}
      <FlightTypeModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedPilot(null); }}
        onSelect={handleFlightTypeSelect}
        locationId={locationId}
        locale={locale}
        pilotName={getSelectedPilotName()}
      />
    </div>
  );
}
