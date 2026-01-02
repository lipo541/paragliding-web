import { Metadata } from 'next';
import { ServicesPage } from '@/components/services';
import { getAllActiveServices, getServiceCategories, getServicesCountByCategory } from '@/lib/data/services';
import type { Locale } from '@/lib/data/services';
import { 
  BASE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  BreadcrumbJsonLd,
  generateLocaleParams
} from '@/lib/seo';

// ✅ ISR: Revalidate every 4 hours
export const revalidate = 14400;

// ✅ SSG: Pre-generate for all locales
export async function generateStaticParams() {
  return generateLocaleParams();
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// SEO translations
const seoContent: Record<Locale, { title: string; description: string }> = {
  ka: {
    title: 'დამატებითი სერვისები | პარაგლაიდინგი საქართველოში',
    description: 'აირჩიეთ დამატებითი სერვისები: დრონით გადაღება, ფოტო/ვიდეო, ATV ტური, აღჭურვილობის გაქირავება და სხვა.'
  },
  en: {
    title: 'Additional Services | Paragliding in Georgia',
    description: 'Choose additional services: drone filming, photo/video, ATV tour, equipment rental and more.'
  },
  ru: {
    title: 'Дополнительные услуги | Параглайдинг в Грузии',
    description: 'Выберите дополнительные услуги: съемка с дрона, фото/видео, ATV тур, аренда оборудования и многое другое.'
  },
  ar: {
    title: 'خدمات إضافية | الطيران المظلي في جورجيا',
    description: 'اختر خدمات إضافية: تصوير بالدرون، صور/فيديو، جولات ATV، تأجير المعدات والمزيد.'
  },
  de: {
    title: 'Zusätzliche Dienstleistungen | Paragliding in Georgien',
    description: 'Wählen Sie zusätzliche Dienste: Drohnenaufnahmen, Foto/Video, ATV-Tour, Ausrüstungsverleih und mehr.'
  },
  tr: {
    title: 'Ek Hizmetler | Gürcistan\'da Yamaç Paraşütü',
    description: 'Ek hizmetleri seçin: drone çekimi, fotoğraf/video, ATV turu, ekipman kiralama ve daha fazlası.'
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  const seo = seoContent[safeLocale] || seoContent.en;
  const canonicalUrl = `${BASE_URL}/${safeLocale}/services`;

  // Generate alternate URLs for all locales
  const languages: Record<string, string> = {};
  const locales: Locale[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
  locales.forEach(loc => {
    languages[loc] = `${BASE_URL}/${loc}/services`;
  });

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      type: 'website',
      locale: safeLocale,
      siteName: SITE_NAME,
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
      title: seo.title,
      description: seo.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ServicesListPage({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  const seo = seoContent[safeLocale] || seoContent.en;

  // Fetch data server-side
  const [services, categories, serviceCounts] = await Promise.all([
    getAllActiveServices(),
    getServiceCategories(),
    getServicesCountByCategory()
  ]);

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${safeLocale}` },
    { name: 'Services', url: `${BASE_URL}/${safeLocale}/services` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {/* SEO: Server-rendered h1 for crawlers */}
      <h1 className="sr-only">{seo.title}</h1>
      <ServicesPage 
        services={services}
        categories={categories}
        locale={safeLocale}
        serviceCounts={serviceCounts}
      />
    </>
  );
}
