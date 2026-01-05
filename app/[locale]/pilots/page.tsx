import PilotsPage from '@/components/pilotspage/PilotsPage';
import { createServerClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { SupportedLocale } from '@/components/pilotspage/utils/pilotHelpers';
import { getPageSEO, type Locale } from '@/lib/seo';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  const seo = getPageSEO('pilots', safeLocale);

  return {
    title: seo.title,
    description: seo.description,
  };
}

// Force dynamic rendering - no cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPilotsData() {
  const supabase = createServerClient();
  
  // Fetch countries
  const { data: countries } = await supabase
    .from('countries')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en')
    .eq('is_active', true)
    .order('name_ka', { ascending: true });

  // Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, country_id')
    .order('name_ka', { ascending: true });

  // Fetch verified companies for filter
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, logo_url')
    .eq('status', 'verified')
    .order('name_ka', { ascending: true });

  // Fetch verified pilots that belong to a company
  const { data: pilots } = await supabase
    .from('pilots')
    .select(`
      id, user_id, status, avatar_url, company_id, location_ids,
      first_name_ka, first_name_en, first_name_ru, first_name_ar, first_name_de, first_name_tr,
      last_name_ka, last_name_en, last_name_ru, last_name_ar, last_name_de, last_name_tr,
      slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr,
      bio_ka, bio_en, bio_ru, bio_ar, bio_de, bio_tr,
      commercial_start_date, tandem_flights, languages,
      cached_rating, cached_rating_count, created_at
    `)
    .eq('status', 'verified')
    .not('company_id', 'is', null)
    .order('first_name_ka', { ascending: true });

  return {
    countries: countries || [],
    locations: locations || [],
    companies: companies || [],
    pilots: pilots || [],
  };
}

export default async function PilotsPageRoute({ params }: PageProps) {
  const { locale } = await params;
  const { countries, locations, companies, pilots } = await getPilotsData();

  return (
    <PilotsPage
      locale={locale as SupportedLocale}
      initialCountries={countries}
      initialLocations={locations}
      initialCompanies={companies}
      initialPilots={pilots}
    />
  );
}
