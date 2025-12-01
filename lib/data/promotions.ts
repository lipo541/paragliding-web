import { createServerClient } from '@/lib/supabase/server';

export interface PromoCodeLocation {
  location_id: string;
  locations: {
    id: string;
    name_ka: string;
    name_en: string;
    name_ru: string;
    name_ar: string;
    name_de: string;
    name_tr: string;
  };
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  image_path: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_ar: string | null;
  description_de: string | null;
  description_tr: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  promo_code_locations: PromoCodeLocation[];
}

export interface PromoLocation {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
}

export interface PromotionsData {
  promoCodes: PromoCode[];
  locations: PromoLocation[];
}

/**
 * Fetch all active promotions and locations for the promotions page.
 * This runs on the server for SSR/SSG.
 */
export async function getPromotionsData(): Promise<PromotionsData> {
  const supabase = createServerClient();

  // Fetch active, published promo codes with their locations
  const { data: promos, error: promosError } = await supabase
    .from('promo_codes')
    .select(`
      *,
      promo_code_locations (
        location_id,
        locations (
          id,
          name_ka,
          name_en,
          name_ru,
          name_ar,
          name_de,
          name_tr
        )
      )
    `)
    .eq('is_active', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (promosError) {
    console.error('Error fetching promo codes:', promosError);
  }

  // Fetch locations for filtering
  const { data: locs, error: locsError } = await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr')
    .order('name_ka');

  if (locsError) {
    console.error('Error fetching locations:', locsError);
  }

  return {
    promoCodes: (promos as PromoCode[]) || [],
    locations: (locs as PromoLocation[]) || []
  };
}
