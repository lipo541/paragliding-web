import { createServerClient } from '@/lib/supabase/server';

export interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string;
  slug_de: string;
  slug_tr: string;
  og_image_url?: string;
  cached_rating?: number;
  cached_rating_count?: number;
}

export interface FlightType {
  name: string;
  description?: string;
  price_gel?: number;
  price_usd?: number;
  price_eur?: number;
}

export interface Location {
  id: string;
  country_id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string;
  slug_de: string;
  slug_tr: string;
  og_image_url?: string;
  hero_image_url?: string;
  cached_rating?: number;
  cached_rating_count?: number;
  altitude?: number;
  best_season_start?: number;
  best_season_end?: number;
  difficulty_level?: string;
  flight_types?: FlightType[];
  min_price?: number;
}

export interface LocationsData {
  countries: Country[];
  locations: Location[];
}

/**
 * Fetch all countries and locations for the locations page.
 * This runs on the server for SSR/SSG.
 */
export async function getLocationsData(locale: string): Promise<LocationsData> {
  const supabase = createServerClient();

  // Fetch countries (public data)
  const { data: countriesData, error: countriesError } = await supabase
    .from('countries')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, og_image_url, cached_rating, cached_rating_count')
    .eq('is_active', true)
    .order('name_ka', { ascending: true });

  if (countriesError) {
    console.error('Countries error:', countriesError);
  }

  // Fetch locations (public data)
  const { data: locationsData, error: locationsError } = await supabase
    .from('locations')
    .select('id, country_id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, og_image_url, cached_rating, cached_rating_count, altitude, best_season_start, best_season_end, difficulty_level')
    .order('name_ka', { ascending: true });

  if (locationsError) {
    console.error('Error fetching locations:', locationsError);
  }

  // Fetch location_pages for hero images and flight types
  const { data: locationPagesData, error: pagesError } = await supabase
    .from('location_pages')
    .select('location_id, content')
    .eq('is_active', true);

  if (pagesError) {
    console.error('Error fetching location_pages:', pagesError);
  }

  // Merge hero images and flight types with locations
  const locationsWithHero: Location[] = (locationsData || []).map((loc: any) => {
    const locationPage = locationPagesData?.find((lp: any) => lp.location_id === loc.id);
    const heroImageUrl = locationPage?.content?.shared_images?.hero_image?.url;
    
    // Extract flight types and prices from current locale with fallback
    const localeFlightTypes = locationPage?.content?.[locale]?.flight_types || 
                              locationPage?.content?.en?.flight_types || 
                              locationPage?.content?.ka?.flight_types || [];
    const sharedFlightTypes = locationPage?.content?.shared_flight_types || [];
    
    // Merge locale flight types with shared prices
    const flightTypes: FlightType[] = localeFlightTypes.map((ft: any) => {
      const shared = sharedFlightTypes.find((s: any) => String(s.id) === String(ft.shared_id));
      return {
        name: ft.name,
        description: ft.description,
        price_gel: ft.price_gel ?? shared?.price_gel,
        price_usd: ft.price_usd ?? shared?.price_usd,
        price_eur: ft.price_eur ?? shared?.price_eur,
      };
    });
    
    const minPrice = flightTypes.length > 0
      ? Math.min(...flightTypes.map((ft) => ft.price_gel || Infinity).filter((p) => p !== Infinity))
      : undefined;
    
    return {
      ...loc,
      hero_image_url: heroImageUrl || loc.og_image_url || undefined,
      flight_types: flightTypes,
      min_price: minPrice === Infinity ? undefined : minPrice
    };
  });

  return {
    countries: countriesData || [],
    locations: locationsWithHero
  };
}
