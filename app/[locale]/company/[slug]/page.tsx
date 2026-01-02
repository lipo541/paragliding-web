import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import CompanyProfilePage from '@/components/companyprofilepage/CompanyProfilePage';
import { getLocalizedField, getCompanyUrl, SupportedLocale } from '@/components/companyprofilepage/utils/companyProfileHelpers';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Helper to get canonical slug for a company
function getCanonicalSlug(company: any, locale: string): string {
  const slugKey = `slug_${locale}` as const;
  return company[slugKey] || company.slug_ka || company.slug_en || company.id;
}

async function getCompany(slug: string, locale: string) {
  const supabase = createServerClient();
  
  // Build slug field name based on locale
  const slugField = `slug_${locale}` as const;
  
  // Check if slug looks like a UUID (ID fallback)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  // Try locale-specific slug first
  let { data: company, error } = await supabase
    .from('companies')
    .select(`
      *,
      country:countries(
        id,
        name_ka,
        name_en,
        name_ru,
        name_de,
        name_tr,
        name_ar,
        slug_ka,
        slug_en
      )
    `)
    .eq(slugField, slug)
    .eq('status', 'verified')
    .single();
  
  // If not found with locale slug, try with slug_ka
  if (!company && locale !== 'ka') {
    const fallback = await supabase
      .from('companies')
      .select(`
        *,
        country:countries(
          id,
          name_ka,
          name_en,
          name_ru,
          name_de,
          name_tr,
          name_ar,
          slug_ka,
          slug_en
        )
      `)
      .eq('slug_ka', slug)
      .eq('status', 'verified')
      .single();
    
    company = fallback.data;
    error = fallback.error;
  }
  
  // If still not found and it looks like UUID, try by ID
  if (!company && isUUID) {
    const idFallback = await supabase
      .from('companies')
      .select(`
        *,
        country:countries(
          id,
          name_ka,
          name_en,
          name_ru,
          name_de,
          name_tr,
          name_ar,
          slug_ka,
          slug_en
        )
      `)
      .eq('id', slug)
      .eq('status', 'verified')
      .single();
    
    company = idFallback.data;
    error = idFallback.error;
    
    // If found by ID, return with flag to redirect
    if (company) {
      return { company, needsRedirect: true };
    }
  }
  
  if (error || !company) {
    return null;
  }
  
  return { company, needsRedirect: false };
}

async function getCompanyLocations(locationIds: string[] | null) {
  if (!locationIds || locationIds.length === 0) {
    return [];
  }
  
  const supabase = createServerClient();
  
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id,
      name_ka,
      name_en,
      name_ru,
      name_de,
      name_tr,
      name_ar,
      slug_ka,
      slug_en,
      country:countries(
        name_ka,
        name_en,
        slug_ka
      )
    `)
    .in('id', locationIds);
  
  // Transform country array to single object
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
      id,
      first_name_ka,
      first_name_en,
      last_name_ka,
      last_name_en,
      avatar_url,
      slug_ka,
      slug_en,
      slug_ru,
      slug_de,
      slug_tr,
      slug_ar,
      cached_rating,
      cached_rating_count,
      status,
      tandem_flights,
      total_flights,
      location_ids,
      commercial_start_date,
      languages,
      bio_ka,
      bio_en,
      bio_ru,
      bio_de,
      bio_tr,
      bio_ar
    `)
    .eq('company_id', companyId)
    .eq('status', 'verified')
    .order('cached_rating', { ascending: false, nullsFirst: false });
  
  console.log('getCompanyPilots query result:', {
    companyId,
    pilotsCount: pilots?.length || 0,
    error: error?.message,
    pilots: pilots?.map(p => ({
      id: p.id,
      first_name_ka: p.first_name_ka,
      last_name_ka: p.last_name_ka,
      status: p.status,
    })),
  });

  if (error) {
    console.error('Error fetching pilots:', error);
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
  const { locale, slug } = await params;
  const result = await getCompany(slug, locale);
  
  if (!result) {
    return {
      title: 'Company Not Found',
    };
  }
  
  const { company } = result;
  const typedLocale = locale as SupportedLocale;
  const name = getLocalizedField(company, 'name', typedLocale);
  const description = getLocalizedField(company, 'description', typedLocale);
  const countryName = company.country 
    ? getLocalizedField(company.country, 'name', typedLocale)
    : '';
  const url = getCompanyUrl(company, typedLocale);
  
  const title = `${name} - Paragliding Company${countryName ? ` in ${countryName}` : ''}`;
  const metaDescription = description?.slice(0, 160) || `${name} - Professional paragliding company offering tandem flights${countryName ? ` in ${countryName}` : ''}`;
  
  return {
    title,
    description: metaDescription,
    keywords: [
      name,
      'paragliding company',
      'tandem paragliding',
      countryName,
      'paragliding operator',
      'adventure tourism',
    ].filter(Boolean),
    openGraph: {
      title,
      description: metaDescription,
      url,
      type: 'website',
      images: company.og_image || company.logo_url ? [
        {
          url: company.og_image || company.logo_url,
          width: 1200,
          height: 630,
          alt: name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: company.og_image || company.logo_url ? [company.og_image || company.logo_url] : [],
    },
    alternates: {
      canonical: url,
      languages: {
        'ka': `/ka/company/${company.slug_ka}`,
        'en': `/en/company/${company.slug_en || company.slug_ka}`,
        'ru': `/ru/company/${company.slug_ru || company.slug_ka}`,
        'de': `/de/company/${company.slug_de || company.slug_ka}`,
        'tr': `/tr/company/${company.slug_tr || company.slug_ka}`,
        'ar': `/ar/company/${company.slug_ar || company.slug_ka}`,
      },
    },
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { locale, slug } = await params;
  
  const result = await getCompany(slug, locale);
  
  if (!result) {
    notFound();
  }
  
  const { company, needsRedirect } = result;
  
  // If accessed by ID, redirect to canonical slug URL
  if (needsRedirect) {
    const canonicalSlug = getCanonicalSlug(company, locale);
    redirect(`/${locale}/company/${canonicalSlug}`);
  }
  
  // Fetch locations and pilots in parallel
  const [locations, pilots] = await Promise.all([
    getCompanyLocations(company.location_ids),
    getCompanyPilots(company.id),
  ]);
  
  console.log('Company pilots fetched:', {
    companyId: company.id,
    pilotsCount: pilots.length,
    pilots: pilots.map(p => ({
      id: p.id,
      first_name_ka: p.first_name_ka,
      last_name_ka: p.last_name_ka,
      status: p.status,
    })),
  });
  
  return (
    <CompanyProfilePage
      company={company}
      locations={locations}
      pilots={pilots}
      locale={locale}
    />
  );
}
