import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ServiceDetailPage } from '@/components/services';
import { 
  getServiceBySlug, 
  getAllServicesForStaticParams,
  getAllActiveServices,
  getLocalizedField
} from '@/lib/data/services';
import type { Locale } from '@/lib/data/services';
import { 
  BASE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  BreadcrumbJsonLd
} from '@/lib/seo';

// ✅ ISR: Revalidate every 4 hours
export const revalidate = 14400;

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  
  const service = await getServiceBySlug(slug, safeLocale);

  if (!service) {
    return {
      title: safeLocale === 'ka' ? 'სერვისი ვერ მოიძებნა' : 'Service Not Found',
    };
  }

  const name = getLocalizedField<string>(service, 'name', safeLocale) || service.name_en;
  const description = getLocalizedField<string>(service, 'description', safeLocale) || service.description_en;
  
  // SEO fields
  const seoTitle = getLocalizedField<string>(service, 'seo_title', safeLocale) || name;
  const seoDescription = getLocalizedField<string>(service, 'seo_description', safeLocale) || description || '';
  
  // OG fields
  const ogTitle = getLocalizedField<string>(service, 'og_title', safeLocale) || seoTitle;
  const ogDescription = getLocalizedField<string>(service, 'og_description', safeLocale) || seoDescription;
  const ogImage = service.og_image || service.gallery_images?.[0]?.url || DEFAULT_OG_IMAGE;

  const serviceSlug = getLocalizedField<string>(service, 'slug', safeLocale) || service.slug_en;
  const canonicalUrl = `${BASE_URL}/${safeLocale}/services/${serviceSlug}`;

  // Generate alternate URLs
  const languages: Record<string, string> = {};
  const locales: Locale[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
  locales.forEach(loc => {
    const locSlug = getLocalizedField<string>(service, 'slug', loc) || service.slug_en;
    if (locSlug) {
      languages[loc] = `${BASE_URL}/${loc}/services/${locSlug}`;
    }
  });

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      type: 'website',
      locale: safeLocale,
      siteName: SITE_NAME,
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const safeLocale = (locale as Locale) || 'ka';

  // Fetch service
  const service = await getServiceBySlug(slug, safeLocale);

  if (!service) {
    notFound();
  }

  // Check if current slug matches the locale's slug - redirect if not
  const correctSlug = getLocalizedField<string>(service, 'slug', safeLocale) || service.slug_en;
  if (correctSlug && correctSlug !== slug) {
    redirect(`/${safeLocale}/services/${correctSlug}`);
  }

  // Fetch related services (same category, excluding current)
  const allServices = await getAllActiveServices();
  const relatedServices = allServices
    .filter(s => s.id !== service.id && s.category_id === service.category_id)
    .slice(0, 4);

  const name = getLocalizedField<string>(service, 'name', safeLocale) || service.name_en;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${safeLocale}` },
    { name: 'Services', url: `${BASE_URL}/${safeLocale}/services` },
    { name: name, url: `${BASE_URL}/${safeLocale}/services/${correctSlug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {/* SEO: Server-rendered h1 for crawlers */}
      <h1 className="sr-only">{name}</h1>
      <ServiceDetailPage 
        service={service}
        locale={safeLocale}
        relatedServices={relatedServices}
      />
    </>
  );
}

// Generate static params for all services
export async function generateStaticParams() {
  const services = await getAllServicesForStaticParams();

  if (!services || services.length === 0) return [];

  const params: { locale: string; slug: string }[] = [];
  const locales: Locale[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];

  for (const service of services) {
    for (const locale of locales) {
      const slugKey = `slug_${locale}` as keyof typeof service;
      const slug = service[slugKey];
      if (slug) {
        params.push({ locale, slug });
      }
    }
  }

  return params;
}
