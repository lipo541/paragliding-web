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
// 📍 LocalBusiness Schema (ლოკაციისთვის - Google Rich Results მხარდაჭერილი)
// ============================================

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
      : "₾150 - ₾400",
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
