import { Metadata } from 'next';
import ContactPage from '@/components/contact/ContactPage';
import { 
  getStaticPageAlternateUrls, 
  getPageSEO,
  SITE_NAME,
  BASE_URL,
  BreadcrumbJsonLd,
  generateLocaleParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate weekly (604800 seconds)
export const revalidate = 604800;

// ✅ SSG: Pre-generate for all locales
export async function generateStaticParams() {
  return generateLocaleParams();
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

// SEO Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  
  const { title, description } = getPageSEO('contact', safeLocale);
  const alternateUrls = getStaticPageAlternateUrls('contact', safeLocale);

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
    },
  };
}

export default async function Contact({ params }: PageProps) {
  const { locale } = await params;
  
  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Contact', url: `${BASE_URL}/${locale}/contact` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ContactPage locale={locale} />
    </>
  );
}
