import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import PilotDetailPage from '@/components/pilot/PilotDetailPage';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Helper to check if string is UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Helper to get canonical slug for a pilot
function getCanonicalSlug(pilot: any, locale: string): string {
  const slugKey = `slug_${locale}` as const;
  return pilot[slugKey] || pilot.slug_ka || pilot.slug_en || pilot.id;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = createServerClient();
  
  // Build OR query - only include id check if slug looks like UUID
  const slugConditions = [
    `slug_ka.eq.${slug}`,
    `slug_en.eq.${slug}`,
    `slug_ru.eq.${slug}`,
    `slug_de.eq.${slug}`,
    `slug_ar.eq.${slug}`,
    `slug_tr.eq.${slug}`,
    `slug.eq.${slug}`,
  ];
  if (isUUID(slug)) {
    slugConditions.push(`id.eq.${slug}`);
  }
  
  const { data: pilot } = await supabase
    .from('pilots')
    .select('*')
    .or(slugConditions.join(','))
    .single();

  if (!pilot) {
    return {
      title: locale === 'ka' ? 'პილოტი ვერ მოიძებნა' : 'Pilot Not Found',
    };
  }

  const firstName = locale === 'ka' 
    ? (pilot.first_name_ka || pilot.first_name_en) 
    : (pilot.first_name_en || pilot.first_name_ka);
  const lastName = locale === 'ka' 
    ? (pilot.last_name_ka || pilot.last_name_en) 
    : (pilot.last_name_en || pilot.last_name_ka);
  const name = `${firstName || ''} ${lastName || ''}`.trim();

  const seoTitleKey = `seo_title_${locale}` as keyof typeof pilot;
  const seoDescKey = `seo_description_${locale}` as keyof typeof pilot;
  const ogTitleKey = `og_title_${locale}` as keyof typeof pilot;
  const ogDescKey = `og_description_${locale}` as keyof typeof pilot;

  const seoTitle = (pilot[seoTitleKey] as string) || name;
  const seoDescription = (pilot[seoDescKey] as string) || 
    (locale === 'ka' 
      ? `${name} - პროფესიონალი პარაგლაიდინგის პილოტი. დაჯავშნეთ ტანდემ ფრენა.`
      : `${name} - Professional paragliding pilot. Book a tandem flight.`);

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: (pilot[ogTitleKey] as string) || seoTitle,
      description: (pilot[ogDescKey] as string) || seoDescription,
      images: pilot.avatar_url ? [{ url: pilot.avatar_url }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: pilot.avatar_url ? [pilot.avatar_url] : [],
    },
  };
}

export default async function PilotPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const supabase = createServerClient();

  // Build OR query - only include id check if slug looks like UUID
  const slugConditions = [
    `slug_ka.eq.${slug}`,
    `slug_en.eq.${slug}`,
    `slug_ru.eq.${slug}`,
    `slug_de.eq.${slug}`,
    `slug_ar.eq.${slug}`,
    `slug_tr.eq.${slug}`,
    `slug.eq.${slug}`,
  ];
  if (isUUID(slug)) {
    slugConditions.push(`id.eq.${slug}`);
  }

  // Fetch pilot with company relation
  const { data: pilot, error } = await supabase
    .from('pilots')
    .select(`
      *,
      company:companies(id, name_ka, name_en, logo_url, slug_ka, slug_en)
    `)
    .or(slugConditions.join(','))
    .single();

  if (error || !pilot) {
    notFound();
  }

  // If accessed by ID, redirect to canonical slug URL
  if (isUUID(slug) && slug === pilot.id) {
    const canonicalSlug = getCanonicalSlug(pilot, locale);
    if (canonicalSlug !== slug) {
      redirect(`/${locale}/pilot/${canonicalSlug}`);
    }
  }

  // Fetch locations if pilot has location_ids
  let locations = null;
  if (pilot.location_ids && pilot.location_ids.length > 0) {
    const { data: locationsData } = await supabase
      .from('locations')
      .select('id, name_ka, name_en, slug_ka, slug_en')
      .in('id', pilot.location_ids);
    
    locations = locationsData;
  }

  const pilotWithLocations = {
    ...pilot,
    locations
  };

  return (
    <PilotDetailPage
      pilotSlug={slug}
      locale={locale}
      initialData={{ pilot: pilotWithLocations }}
    />
  );
}

// Generate static params for popular pilots (optional, for static generation)
export async function generateStaticParams() {
  const supabase = createServerClient();
  
  const { data: pilots } = await supabase
    .from('pilots')
    .select('slug_ka, slug_en')
    .eq('status', 'verified')
    .limit(50);

  if (!pilots) return [];

  const params: { locale: string; slug: string }[] = [];
  
  for (const pilot of pilots) {
    if (pilot.slug_ka) {
      params.push({ locale: 'ka', slug: pilot.slug_ka });
    }
    if (pilot.slug_en) {
      params.push({ locale: 'en', slug: pilot.slug_en });
    }
  }

  return params;
}
