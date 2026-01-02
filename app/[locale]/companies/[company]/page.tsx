import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import CompanyProfilePage from '@/components/companyprofilepage/CompanyProfilePage';
import { getLocalizedField, getCompanyUrl, SupportedLocale } from '@/components/companyprofilepage/utils/companyProfileHelpers';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; company: string }>;
}

async function getCompany(slug: string, locale: string) {
  const supabase = createServerClient();
  const slugField = `slug_${locale}` as const;
  
  let { data: company, error } = await supabase
    .from('companies')
    .select(`
      *,
      country:countries(
        id, name_ka, name_en, name_ru, name_de, name_tr, name_ar, slug_ka, slug_en
      )
    `)
    .eq(slugField, slug)
    .eq('status', 'verified')
    .single();
  
  if (!company && locale !== 'ka') {
    const fallback = await supabase
      .from('companies')
      .select(`
        *,
        country:countries(
          id, name_ka, name_en, name_ru, name_de, name_tr, name_ar, slug_ka, slug_en
        )
      `)
      .eq('slug_ka', slug)
      .eq('status', 'verified')
      .single();
    company = fallback.data;
    error = fallback.error;
  }
  
  if (error || !company) return null;
  return company;
}

async function getCompanyLocations(locationIds: string[] | null) {
  if (!locationIds || locationIds.length === 0) return [];
  const supabase = createServerClient();
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id, name_ka, name_en, name_ru, name_de, name_tr, name_ar, slug_ka, slug_en,
      country:countries(name_ka, name_en, slug_ka)
    `)
    .in('id', locationIds);
  return (locations || []).map(loc => ({
    ...loc,
    country: Array.isArray(loc.country) ? loc.country[0] : loc.country
  }));
}

async function getCompanyPilots(companyId: string) {
  const supabase = createServerClient();
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select(`
      id, first_name_ka, first_name_en, last_name_ka, last_name_en, avatar_url, slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      cached_rating, cached_rating_count, status, tandem_flights, total_flights, location_ids
    `)
    .eq('company_id', companyId)
    .eq('status', 'verified')
    .order('cached_rating', { ascending: false, nullsFirst: false });
  
  console.log('getCompanyPilots (companies/[company]) result:', {
    companyId,
    pilotsCount: pilots?.length || 0,
    error: error?.message,
    pilots: pilots?.map(p => ({ id: p.id, first_name_ka: p.first_name_ka, last_name_ka: p.last_name_ka })),
  });

  if (error) {
    console.error('Error fetching company pilots:', error);
    return [];
  }
  
  // Fetch locations for each pilot
  if (pilots && pilots.length > 0) {
    const allLocationIds = [...new Set(pilots.flatMap(p => p.location_ids || []))];
    if (allLocationIds.length > 0) {
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name_ka, name_en, slug_ka')
        .in('id', allLocationIds);
      
      // Map locations to pilots
      return pilots.map(pilot => ({
        ...pilot,
        locations: (pilot.location_ids || [])
          .map((locId: string) => locations?.find(l => l.id === locId))
          .filter(Boolean)
      }));
    }
  }
  
  return pilots || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, company: slug } = await params;
  const company = await getCompany(slug, locale);
  if (!company) return { title: 'Company Not Found' };
  
  const typedLocale = locale as SupportedLocale;
  const name = getLocalizedField(company, 'name', typedLocale);
  const description = getLocalizedField(company, 'description', typedLocale);
  const countryName = company.country ? getLocalizedField(company.country, 'name', typedLocale) : '';
  const url = getCompanyUrl(company, typedLocale);
  
  return {
    title: `${name} - Paragliding Company${countryName ? ` in ${countryName}` : ''}`,
    description: description?.slice(0, 160) || `${name} - Professional paragliding company`,
    openGraph: { title: name, description: description?.slice(0, 160), url, type: 'website' },
    alternates: { canonical: url },
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { locale, company: slug } = await params;
  const company = await getCompany(slug, locale);
  if (!company) notFound();
  
  const [locations, pilots] = await Promise.all([
    getCompanyLocations(company.location_ids),
    getCompanyPilots(company.id),
  ]);
  
  return (
    <CompanyProfilePage
      company={company}
      locations={locations}
      pilots={pilots}
      locale={locale}
    />
  );
}