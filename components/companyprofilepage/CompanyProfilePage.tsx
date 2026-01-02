'use client';

import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import Breadcrumbs, { breadcrumbLabels, type Locale as BreadcrumbLocale } from '@/components/shared/Breadcrumbs';
import {
  CompanyJsonLd,
  CompanyHeroSection,
  CompanyProfileCard,
  CompanyAboutSection,
  CompanyGallerySection,
  CompanyVideosSection,
  CompanySidebar,
  CompanyLocationsSection,
  CompanyPilotsSection,
  CompanyReviewsSection,
  CompanyServicesSection,
} from './components';
import { SupportedLocale, getLocalizedField } from './utils/companyProfileHelpers';

interface Country {
  id: string;
  name_ka?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  name_ar?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
}

interface Location {
  id: string;
  name_ka?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  country?: {
    name_ka?: string | null;
    name_en?: string | null;
    slug_ka?: string | null;
  } | null;
}

interface Pilot {
  id: string;
  first_name_ka?: string | null;
  first_name_en?: string | null;
  last_name_ka?: string | null;
  last_name_en?: string | null;
  avatar_url?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  slug_ru?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  slug_ar?: string | null;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  status?: string | null;
  tandem_flights?: number | null;
  total_flights?: number | null;
  location_ids?: string[] | null;
  commercial_start_date?: string | null;
  languages?: string[] | null;
  bio_ka?: string | null;
  bio_en?: string | null;
  bio_ru?: string | null;
  bio_de?: string | null;
  bio_tr?: string | null;
  bio_ar?: string | null;
  locations?: {
    id: string;
    name_ka?: string | null;
    name_en?: string | null;
    slug_ka?: string | null;
  }[];
}

interface GalleryImage {
  url: string;
  caption_ka?: string;
  caption_en?: string;
  order: number;
}

interface Company {
  id: string;
  name_ka?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  name_ar?: string | null;
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  description_ar?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  slug_ru?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  slug_ar?: string | null;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  identification_code?: string | null;
  founded_date?: string | null;
  status: string;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  country?: Country | null;
  cover_image_url?: string | null;
  gallery_images?: GalleryImage[] | null;
  video_urls?: string[] | null;
}

interface CompanyProfilePageProps {
  company: Company;
  locations: Location[];
  pilots: Pilot[];
  locale: string;
}

export default function CompanyProfilePage({
  company,
  locations,
  pilots,
  locale,
}: CompanyProfilePageProps) {
  const { t } = useTranslation('companyprofile');
  const typedLocale = locale as SupportedLocale;

  const companyName = getLocalizedField(company, 'name', typedLocale) || '';
  const description = getLocalizedField(company, 'description', typedLocale);
  const countryName = company.country ? getLocalizedField(company.country, 'name', typedLocale) : null;

  // Transform locations for component
  const transformedLocations = locations.map(loc => ({
    id: loc.id,
    name: getLocalizedField(loc, 'name', typedLocale) || '',
    slug: loc.slug_ka || '',
    countrySlug: loc.country?.slug_ka || '',
    countryName: loc.country ? getLocalizedField(loc.country, 'name', typedLocale) : null,
  }));

  // Transform pilots for component
  const transformedPilots = pilots.map(pilot => {
    // Calculate experience from commercial_start_date
    const experience = pilot.commercial_start_date 
      ? Math.floor((Date.now() - new Date(pilot.commercial_start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;
    
    return {
      id: pilot.id,
      firstName: getLocalizedField(pilot, 'first_name', typedLocale) || '',
      lastName: getLocalizedField(pilot, 'last_name', typedLocale) || '',
      avatarUrl: pilot.avatar_url,
      slug: (pilot as any)[`slug_${typedLocale}`] || pilot.slug_ka || pilot.slug_en || pilot.id,
      rating: pilot.cached_rating || 0,
      reviewCount: pilot.cached_rating_count || 0,
      verified: pilot.status === 'verified',
      tandemFlights: pilot.tandem_flights,
      totalFlights: pilot.total_flights,
      locationIds: pilot.location_ids || [],
      experience: experience > 0 ? experience : undefined,
      languages: pilot.languages || [],
      bio: getLocalizedField(pilot, 'bio', typedLocale) || '',
      locations: pilot.locations?.map(loc => ({
        id: loc.id,
        name: getLocalizedField(loc, 'name', typedLocale) || '',
        slug: loc.slug_ka || '',
      })),
    };
  });

  console.log('CompanyProfilePage - Pilots data:', {
    pilotsInputCount: pilots.length,
    transformedPilotsCount: transformedPilots.length,
    pilots: pilots,
    transformedPilots,
    locale: typedLocale,
  });

  return (
    <>
      {/* JSON-LD Schema */}
      <CompanyJsonLd company={company} locale={typedLocale} />

      <div className="min-h-screen">
        {/* Hero Section */}
        <CompanyHeroSection
          coverImageUrl={company.cover_image_url}
          companyName={companyName}
        />

        {/* Breadcrumbs */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs 
            items={[
              { label: breadcrumbLabels[locale as BreadcrumbLocale]?.home || 'Home', href: `/${locale}` },
              { label: breadcrumbLabels[locale as BreadcrumbLocale]?.companies || 'Companies', href: `/${locale}/companies` },
              { label: companyName }
            ]} 
          />
        </div>

        {/* Profile Card - Overlapping Hero */}
        <CompanyProfileCard
          company={{
            id: company.id,
            logoUrl: company.logo_url,
            name: companyName,
            countryName,
            verified: company.status === 'verified',
            rating: company.cached_rating || 0,
            reviewCount: company.cached_rating_count || 0,
            foundedDate: company.founded_date,
            pilotsCount: pilots.length,
          }}
          locations={transformedLocations}
          locale={locale}
          translations={{
            verified: t('verified'),
            share: t('share'),
            qrCode: t('qrCode'),
            reviews: t('reviews'),
            bookFlight: t('bookFlight') || (locale === 'ka' ? 'დაჯავშნა' : 'Book Flight'),
            yearsActive: t('yearsActive') || (locale === 'ka' ? 'წელი აქტიური' : 'Years Active'),
            pilots: t('pilots'),
            rateFirst: locale === 'ka' ? 'შეაფასე პირველმა' : 'Be first to rate',
          }}
        />

        {/* Main Content - Two Column Layout */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
              
              {/* About */}
              <CompanyAboutSection
                description={description}
                translations={{
                  aboutCompany: t('about'),
                  noDescription: t('noDescription'),
                }}
              />

              {/* Gallery */}
              {company.gallery_images && company.gallery_images.length > 0 && (
                <CompanyGallerySection
                  images={company.gallery_images}
                  locale={locale}
                  translations={{
                    gallery: t('gallery') || (locale === 'ka' ? 'ფოტო გალერეა' : 'Photo Gallery'),
                    photos: t('photos') || (locale === 'ka' ? 'ფოტო' : 'photos'),
                  }}
                />
              )}

              {/* Videos */}
              {company.video_urls && company.video_urls.length > 0 && (
                <CompanyVideosSection
                  videos={company.video_urls}
                  locale={locale}
                  translations={{
                    videos: t('videos') || (locale === 'ka' ? 'ვიდეოები' : 'Videos'),
                    video: t('video') || (locale === 'ka' ? 'ვიდეო' : 'Video'),
                    nowPlaying: locale === 'ka' ? 'მიმდინარე' : 'Now Playing',
                    playlist: locale === 'ka' ? 'პლეილისტი' : 'Playlist',
                  }}
                />
              )}

              {/* Locations */}
              {transformedLocations.length > 0 && (
                <CompanyLocationsSection
                  locations={transformedLocations}
                  locale={locale}
                  translations={{
                    locations: t('locations'),
                    viewLocation: t('viewLocation'),
                  }}
                />
              )}

              {/* Pilots */}
              {transformedPilots.length > 0 && (
                <CompanyPilotsSection
                  pilots={transformedPilots}
                  locale={locale}
                  companyId={company.id}
                  companyName={companyName}
                  companyLogoUrl={company.logo_url || undefined}
                  companySlug={(company as any)[`slug_${typedLocale}`] || company.slug_ka || undefined}
                  translations={{
                    pilots: t('pilots'),
                    viewPilot: t('viewPilot'),
                    reviews: t('reviews'),
                    verified: t('verified'),
                    flights: locale === 'ka' ? 'ფრენა' : 'flights',
                    tandemFlights: locale === 'ka' ? 'ტანდემ' : 'tandem',
                    addToCart: locale === 'ka' ? 'კალათა' : 'Cart',
                    selectLocation: locale === 'ka' ? 'აირჩიეთ ლოკაცია' : 'Select location',
                  }}
                />
              )}

              {/* Additional Services */}
              <CompanyServicesSection
                companyId={company.id}
                locale={locale}
              />

              {/* Reviews */}
              <CompanyReviewsSection
                companyId={company.id}
                companyName={companyName}
                locale={locale}
                translations={{
                  reviews: t('reviews'),
                  writeReview: t('leaveReview') || (locale === 'ka' ? 'დაწერე შეფასება' : 'Write Review'),
                }}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4 order-1 lg:order-2">
              <CompanySidebar
                company={{
                  id: company.id,
                  name: companyName,
                  logoUrl: company.logo_url,
                  foundedDate: company.founded_date,
                  identificationCode: company.identification_code,
                  countryName,
                  pilotsCount: pilots.length,
                }}
                locale={locale}
                translations={{
                  founded: t('founded'),
                  idCode: t('idCode'),
                  country: t('country'),
                  pilots: t('pilots'),
                  bookNow: locale === 'ka' ? 'დაჯავშნე ფრენა' : 'Book a Flight',
                  bookingDescription: locale === 'ka' 
                    ? 'დაჯავშნეთ ფრენა კომპანიასთან. კომპანია შეგირჩევთ მათ საუკეთესო პილოტს და მათი სერვისი მოემსახურებათ ადგილზე.' 
                    : 'Book a flight with the company. They will select their best pilot for you and provide personal service on site.',
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
