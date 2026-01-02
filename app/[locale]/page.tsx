import { Metadata } from 'next';
import { 
  getStaticPageAlternateUrls, 
  getPageSEO,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  generateLocaleParams,
  type Locale 
} from '@/lib/seo';
import { HeroSection } from '@/components/hero';
import { createServerClient } from '@/lib/supabase/server';
import { HeroSlide, HeroSlideButton } from '@/lib/types/hero';

// ✅ ISR: Revalidate hourly (3600 seconds)
export const revalidate = 3600;

// ✅ SSG: Pre-generate for all locales
export async function generateStaticParams() {
  return generateLocaleParams();
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

// SEO Metadata for Home Page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  
  const { title, description } = getPageSEO('home', safeLocale);
  const alternateUrls = getStaticPageAlternateUrls('', safeLocale);

  return {
    title,
    description,
    alternates: {
      canonical: alternateUrls.canonical,
      languages: alternateUrls.languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      locale: safeLocale,
      siteName: SITE_NAME,
      url: alternateUrls.canonical,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// Server-side data fetching for Hero slides
async function getHeroSlides(): Promise<HeroSlide[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('hero_slides')
    .select(`
      *,
      buttons:hero_slide_buttons(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching hero slides:', error);
    return [];
  }

  // Sort buttons by display_order
  return (data || []).map((slide: HeroSlide) => ({
    ...slide,
    buttons: (slide.buttons || []).sort((a: HeroSlideButton, b: HeroSlideButton) => a.display_order - b.display_order)
  }));
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = (locale as 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr') || 'ka';

  // Fetch hero slides on server
  const heroSlides = await getHeroSlides();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - SSR with pre-fetched data */}
      <HeroSection locale={safeLocale} initialSlides={heroSlides} />
      
      {/* Additional sections will be added here */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            მალე დაემატება მეტი კონტენტი
          </h2>
          <p className="text-foreground/60">
            მთავარი გვერდის სხვა სექციები მალე დაემატება
          </p>
        </div>
      </section>
    </div>
  );
}
