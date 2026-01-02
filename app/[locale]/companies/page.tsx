import CompaniesPage from '@/components/companiespage/CompaniesPage';
import { createServerClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { SupportedLocale } from '@/components/companiespage/utils/companyHelpers';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    ka: 'პარაგლაიდინგის კომპანიები | Paragliding',
    en: 'Paragliding Companies | Paragliding',
    ru: 'Компании парапланеризма | Paragliding',
    de: 'Paragliding-Unternehmen | Paragliding',
    tr: 'Yamaç Paraşütü Şirketleri | Paragliding',
    ar: 'شركات الطيران الشراعي | Paragliding',
  };

  const descriptions: Record<string, string> = {
    ka: 'აღმოაჩინეთ საუკეთესო პარაგლაიდინგის კომპანიები და დაჯავშნეთ თქვენი ფრენა',
    en: 'Discover the best paragliding companies and book your flight',
    ru: 'Откройте для себя лучшие компании парапланеризма и забронируйте полет',
    de: 'Entdecken Sie die besten Paragliding-Unternehmen und buchen Sie Ihren Flug',
    tr: 'En iyi yamaç paraşütü şirketlerini keşfedin ve uçuşunuzu rezerve edin',
    ar: 'اكتشف أفضل شركات الطيران الشراعي واحجز رحلتك',
  };

  return {
    title: titles[locale] || titles.ka,
    description: descriptions[locale] || descriptions.ka,
  };
}

// Force dynamic rendering - no cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCompaniesData() {
  const supabase = createServerClient();
  
  // Fetch countries
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, og_image_url')
    .eq('is_active', true)
    .order('name_ka', { ascending: true });

  // Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, country_id')
    .order('name_ka', { ascending: true });

  // Fetch verified companies with rating fields and location_ids
  const { data: companies } = await supabase
    .from('companies')
    .select(`
      id, country_id, location_ids, status, logo_url, created_at,
      name_ka, name_en, name_ru, name_ar, name_de, name_tr,
      slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr,
      description_ka, description_en, description_ru, description_ar, description_de, description_tr,
      cached_rating, cached_rating_count
    `)
    .eq('status', 'verified')
    .order('name_ka', { ascending: true });

  // Fetch pilot counts per company
  const { data: pilotCounts } = await supabase
    .from('pilots')
    .select('company_id')
    .eq('status', 'verified');

  // Calculate pilot count per company
  const pilotCountMap = new Map<string, number>();
  pilotCounts?.forEach(pilot => {
    if (pilot.company_id) {
      pilotCountMap.set(pilot.company_id, (pilotCountMap.get(pilot.company_id) || 0) + 1);
    }
  });

  // Add pilot_count to companies
  const companiesWithPilotCount = companies?.map(company => ({
    ...company,
    pilot_count: pilotCountMap.get(company.id) || 0
  })) || [];

  return {
    countries: countries || [],
    locations: locations || [],
    companies: companiesWithPilotCount,
  };
}

export default async function CompaniesPageRoute({ params }: PageProps) {
  const { locale } = await params;
  const { countries, locations, companies } = await getCompaniesData();

  return (
    <CompaniesPage
      locale={locale as SupportedLocale}
      initialCountries={countries}
      initialLocations={locations}
      initialCompanies={companies}
    />
  );
}
