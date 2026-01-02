'use client';

import { Pilot, Country } from '../hooks/usePilotsFilter';
import { SupportedLocale, getPilotName, getLocalizedSlug, getLocalizedField } from '../utils/pilotHelpers';

interface PilotsJsonLdProps {
  pilots: Pilot[];
  countries: Country[];
  baseUrl: string;
  locale: SupportedLocale;
}

export default function PilotsJsonLd({
  pilots,
  countries,
  baseUrl,
  locale
}: PilotsJsonLdProps) {
  // Create ItemList schema for pilots
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'ka' ? 'პარაგლაიდინგის პილოტები' : 'Paragliding Pilots',
    description: locale === 'ka' 
      ? 'სერტიფიცირებული ტანდემ პილოტები' 
      : 'Certified tandem pilots',
    numberOfItems: pilots.length,
    itemListElement: pilots.slice(0, 20).map((pilot, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        '@id': `${baseUrl}/${locale}/pilot/${getLocalizedSlug(pilot, locale)}`,
        name: getPilotName(pilot, locale),
        url: `${baseUrl}/${locale}/pilot/${getLocalizedSlug(pilot, locale)}`,
        image: pilot.avatar_url || undefined,
        jobTitle: locale === 'ka' ? 'ტანდემ პილოტი' : 'Tandem Pilot',
        ...(pilot.cached_rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: pilot.cached_rating.toFixed(1),
            reviewCount: pilot.cached_rating_count || 0,
            bestRating: 5,
            worstRating: 1
          }
        })
      }
    }))
  };

  // Create BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'ka' ? 'მთავარი' : 'Home',
        item: `${baseUrl}/${locale}`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'ka' ? 'პილოტები' : 'Pilots',
        item: `${baseUrl}/${locale}/pilots`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
