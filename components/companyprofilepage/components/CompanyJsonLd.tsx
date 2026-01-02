'use client';

import { SupportedLocale, getLocalizedField, getCompanyUrl } from '../utils/companyProfileHelpers';

interface Country {
  name_ka?: string | null;
  name_en?: string | null;
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
  founded_date?: string | null;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  country?: Country | null;
}

interface CompanyJsonLdProps {
  company: Company;
  locale: SupportedLocale;
}

export default function CompanyJsonLd({ company, locale }: CompanyJsonLdProps) {
  const name = getLocalizedField(company, 'name', locale);
  const description = getLocalizedField(company, 'description', locale);
  const url = getCompanyUrl(company, locale);
  const countryName = company.country 
    ? getLocalizedField(company.country, 'name', locale)
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': url,
    name: name,
    description: description,
    url: url,
    ...(company.logo_url && {
      logo: {
        '@type': 'ImageObject',
        url: company.logo_url,
      },
      image: company.logo_url,
    }),
    ...(company.phone && {
      telephone: company.phone,
    }),
    ...(company.email && {
      email: company.email,
    }),
    ...(company.founded_date && {
      foundingDate: company.founded_date,
    }),
    ...(countryName && {
      address: {
        '@type': 'PostalAddress',
        addressCountry: countryName,
      },
    }),
    ...(company.cached_rating && company.cached_rating_count && company.cached_rating_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: company.cached_rating.toFixed(1),
        ratingCount: company.cached_rating_count,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    // Paragliding specific
    knowsAbout: [
      'Paragliding',
      'Tandem Paragliding',
      'Adventure Tourism',
      'Extreme Sports',
    ],
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Tandem Paragliding Flight',
        description: 'Professional tandem paragliding experience with certified pilots',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
