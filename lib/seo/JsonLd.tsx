/**
 * JSON-LD Schema Components
 * ==========================
 * Structured Data კომპონენტები Rich Snippets-ისთვის
 * 
 * Google Rich Results: https://search.google.com/test/rich-results
 * Schema.org: https://schema.org/
 */

import { BASE_URL, SITE_NAME } from '@/lib/seo';

// ============================================
// 🏢 Organization Schema (საიტის შესახებ)
// ============================================

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo.png`,
      "width": 512,
      "height": 512
    },
    "description": "Professional paragliding tandem flights in Georgia",
    "telephone": "+995511440400",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE",
      "addressLocality": "Tbilisi"
    },
    "sameAs": [
      // TODO: დაამატეთ თქვენი social media ლინკები
      // "https://www.facebook.com/xparagliding",
      // "https://www.instagram.com/xparagliding",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 🌐 WebSite Schema (საძიებო ველისთვის)
// ============================================

export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/ka/locations?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 🧭 SiteNavigationElement Schema (Google Sitelinks-ისთვის)
// ============================================

interface NavItem {
  name: string;
  url: string;
}

export function SiteNavigationJsonLd({ locale = 'en' }: { locale?: string }) {
  const navItems: NavItem[] = [
    { name: 'Locations', url: `${BASE_URL}/${locale}/locations` },
    { name: 'Bookings', url: `${BASE_URL}/${locale}/bookings` },
    { name: 'Promotions', url: `${BASE_URL}/${locale}/promotions` },
    { name: 'About Us', url: `${BASE_URL}/${locale}/about` },
    { name: 'Contact', url: `${BASE_URL}/${locale}/contact` },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": navItems.map((item, index) => ({
      "@type": "SiteNavigationElement",
      "position": index + 1,
      "name": item.name,
      "url": item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 🍞 Breadcrumb Schema
// ============================================

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 🌍 Country Schema (ქვეყნის გვერდისთვის - ItemList + LocalBusiness)
// ============================================

interface LocationItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  rating?: number;
  ratingCount?: number;
  altitude?: number;
}

interface CountrySchemaProps {
  countryName: string;
  countrySlug: string;
  locale: string;
  locations: LocationItem[];
}

export function CountryJsonLd({
  countryName,
  countrySlug,
  locale,
  locations,
}: CountrySchemaProps) {
  // ItemList schema with LocalBusiness items - enables Review Snippets
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Paragliding Locations in ${countryName}`,
    "description": `All paragliding locations in ${countryName}`,
    "numberOfItems": locations.length,
    "itemListElement": locations.map((loc, index) => {
      const locationUrl = `${BASE_URL}/${locale}/locations/${countrySlug}/${loc.slug}`;
      
      const item: Record<string, unknown> = {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "LocalBusiness",
          "@id": locationUrl,
          "name": `Paragliding ${loc.name}`,
          "url": locationUrl,
          ...(loc.image && { "image": loc.image }),
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "GE",
            "addressRegion": countryName,
            "addressLocality": loc.name,
          },
          "priceRange": "₾150 - ₾400",
        },
      };

      // Add AggregateRating if available
      if (loc.rating && loc.ratingCount && loc.ratingCount > 0 && loc.rating > 0) {
        (item.item as Record<string, unknown>)["aggregateRating"] = {
          "@type": "AggregateRating",
          "ratingValue": loc.rating,
          "bestRating": 5,
          "worstRating": 1,
          "ratingCount": loc.ratingCount,
        };
      }

      return item;
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 📍 LocalBusiness Schema (ლოკაციისთვის - Google Rich Results მხარდაჭერილი)
// ============================================

interface FlightTypeOffer {
  name: string;
  description?: string;
  price: number;
  currency?: string;
}

interface LocationSchemaProps {
  name: string;
  description: string;
  image?: string;
  countryName: string;
  rating?: number;
  ratingCount?: number;
  altitude?: number;
  url: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  flightTypes?: FlightTypeOffer[];
}

export function LocationJsonLd({
  name,
  description,
  image,
  countryName,
  rating,
  ratingCount,
  altitude,
  url,
  minPrice,
  maxPrice,
  currency = '₾',
  flightTypes,
}: LocationSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    "name": `Paragliding ${name}`,
    "description": description,
    "url": url,
    ...(image && { "image": image }),
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE",
      "addressRegion": countryName,
      "addressLocality": name,
    },
    // Additional categorization
    "additionalType": "https://schema.org/SportsActivityLocation",
    // Price range - Georgian Lari typical paragliding prices
    "priceRange": minPrice && maxPrice 
      ? `${currency}${minPrice} - ${currency}${maxPrice}` 
      : "₾150 - ₾500",
  };

  // Rating - დავამატოთ მხოლოდ თუ ვალიდურია
  if (rating && ratingCount && ratingCount > 0 && rating > 0) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": rating,
      "bestRating": 5,
      "worstRating": 1,
      "ratingCount": ratingCount,
    };
  }

  // Altitude/Geo - დავამატოთ მხოლოდ თუ არის
  if (altitude && altitude > 0) {
    schema["geo"] = {
      "@type": "GeoCoordinates",
      "elevation": `${altitude}m`,
    };
  }

  // Flight Types as OfferCatalog - Google Sitelinks-ისთვის
  if (flightTypes && flightTypes.length > 0) {
    schema["hasOfferCatalog"] = {
      "@type": "OfferCatalog",
      "name": `Paragliding Flights in ${name}`,
      "itemListElement": flightTypes.map((flight, index) => ({
        "@type": "Offer",
        "position": index + 1,
        "name": flight.name,
        "description": flight.description || `${flight.name} paragliding experience`,
        "price": flight.price,
        "priceCurrency": flight.currency || "GEL",
        "availability": "https://schema.org/InStock",
        "itemOffered": {
          "@type": "Service",
          "name": flight.name,
          "description": flight.description || `${flight.name} in ${name}`,
        }
      }))
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 🪂 SportsActivity Schema (პარაგლაიდინგისთვის)
// ============================================

interface ParaglidingActivityProps {
  locationName: string;
  countryName: string;
  description: string;
  image?: string;
  url: string;
  difficulty?: string;
  altitude?: number;
}

export function ParaglidingActivityJsonLd({
  locationName,
  countryName,
  description,
  image,
  url,
  difficulty,
  altitude,
}: ParaglidingActivityProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": `Paragliding in ${locationName}`,
    "description": description,
    "url": url,
    ...(image && { "image": image }),
    "sport": "Paragliding",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE",
      "addressRegion": countryName,
    },
    // Difficulty and Altitude as amenities
    "amenityFeature": [
      ...(difficulty ? [{
        "@type": "LocationFeatureSpecification",
        "name": "Difficulty Level",
        "value": difficulty,
      }] : []),
      ...(altitude ? [{
        "@type": "LocationFeatureSpecification",
        "name": "Launch Altitude",
        "value": `${altitude}m`,
      }] : []),
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// ❓ FAQ Schema
// ============================================

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// ⭐ Review Schema
// ============================================

interface ReviewSchemaProps {
  author: string;
  rating: number;
  reviewText: string;
  datePublished: string;
  locationName: string;
}

export function ReviewJsonLd({
  author,
  rating,
  reviewText,
  datePublished,
  locationName,
}: ReviewSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": `Paragliding ${locationName}`,
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": rating,
      "bestRating": 5,
    },
    "author": {
      "@type": "Person",
      "name": author,
    },
    "reviewBody": reviewText,
    "datePublished": datePublished,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// 🎫 Product/Service Schema (დაჯავშნისთვის)
// ============================================

interface ServiceSchemaProps {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  image?: string;
  url: string;
  rating?: number;
  ratingCount?: number;
}

export function ServiceJsonLd({
  name,
  description,
  price,
  currency = 'GEL',
  image,
  url,
  rating,
  ratingCount,
}: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "url": url,
    "provider": {
      "@type": "Organization",
      "name": SITE_NAME,
    },
    ...(image && { "image": image }),
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
      },
    }),
    ...(rating && ratingCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": ratingCount,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
