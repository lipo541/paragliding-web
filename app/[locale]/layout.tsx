import type { Metadata } from 'next';
import LocaleLayoutClient from "@/components/layout/LocaleLayoutClient";
import SEONavLinks from "@/components/seo/SEONavLinks";
import { 
  SITE_NAME, 
  DEFAULT_DESCRIPTIONS, 
  TITLE_TEMPLATES,
  DEFAULT_OG_IMAGE,
  BASE_URL,
  OrganizationJsonLd,
  WebSiteJsonLd,
  SiteNavigationJsonLd,
  type Locale 
} from '@/lib/seo';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for locale layout
 * ეს მუშაობს მხოლოდ Server Component-ში!
 */
export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  
  return {
    title: {
      default: SITE_NAME,
      template: TITLE_TEMPLATES[safeLocale] || TITLE_TEMPLATES.ka,
    },
    description: DEFAULT_DESCRIPTIONS[safeLocale] || DEFAULT_DESCRIPTIONS.ka,
    metadataBase: new URL(BASE_URL),
    openGraph: {
      type: 'website',
      locale: safeLocale,
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // params-ის await არის საჭირო Next.js 15+-ში
  const { locale } = await params;
  
  return (
    <>
      {/* Global JSON-LD Schemas */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <SiteNavigationJsonLd locale={locale} />
      
      {/* SEO Navigation Links - Server Rendered for Google */}
      <SEONavLinks locale={locale} />
      
      <LocaleLayoutClient locale={locale}>
        {children}
      </LocaleLayoutClient>
    </>
  );
}
