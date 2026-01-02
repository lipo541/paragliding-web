'use client';

import { Company, Country } from '../hooks/useCompaniesFilter';
import { SupportedLocale, getLocalizedField } from '../utils/companyHelpers';

interface CompaniesJsonLdProps {
  companies: Company[];
  countries: Country[];
  locale: SupportedLocale;
  baseUrl: string;
}

export default function CompaniesJsonLd({
  companies,
  countries,
  locale,
  baseUrl
}: CompaniesJsonLdProps) {
  // ItemList schema for the companies listing
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'ka' ? 'პარაგლაიდინგ კომპანიები' : 'Paragliding Companies',
    description: locale === 'ka' 
      ? 'ვერიფიცირებული პარაგლაიდინგ კომპანიების სია' 
      : 'List of verified paragliding companies',
    numberOfItems: companies.length,
    itemListElement: companies.map((company, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/${locale}/companies/${company[`slug_${locale}` as keyof Company] || company.id}`,
        name: getLocalizedField(company, 'name', locale),
        description: getLocalizedField(company, 'description', locale),
        image: company.logo_url || undefined,
        url: `${baseUrl}/${locale}/companies/${company[`slug_${locale}` as keyof Company] || company.id}`,
        ...(company.cached_rating && company.cached_rating > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: company.cached_rating,
            reviewCount: company.cached_rating_count || 0,
            bestRating: 5,
            worstRating: 1
          }
        }),
        ...(company.country_id && {
          address: {
            '@type': 'PostalAddress',
            addressCountry: countries.find(c => c.id === company.country_id)?.code || ''
          }
        })
      }
    }))
  };

  // BreadcrumbList schema
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
        name: locale === 'ka' ? 'კომპანიები' : 'Companies',
        item: `${baseUrl}/${locale}/companies`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
    </>
  );
}
