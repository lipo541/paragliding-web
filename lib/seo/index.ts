/**
 * SEO Module Exports
 * ===================
 * ცენტრალიზებული exports SEO მოდულისთვის
 */

// Constants
export {
  BASE_URL,
  SITE_NAME,
  locales,
  defaultLocale,
  X_DEFAULT_LOCALE,
  LOCALE_NAMES,
  HREFLANG_CODES,
  DEFAULT_DESCRIPTIONS,
  TITLE_TEMPLATES,
  DEFAULT_OG_IMAGE,
  NOINDEX_ROUTES,
  SITEMAP_EXCLUDE_ROUTES,
  STATIC_ROUTES,
  type Locale,
  type AlternateUrls,
  type SEOMetadata,
} from './constants';

// URL Utilities
export {
  buildUrl,
  buildCanonicalUrl,
  buildAlternateUrls,
  getLocationSlugs,
  getCountrySlugs,
  getLocationAlternateUrls,
  getCountryAlternateUrls,
  getStaticPageAlternateUrls,
  isValidSlug,
  normalizeSlug,
} from './urls';

// Translations
export {
  PAGE_SEO,
  getPageSEO,
  getPageOG,
  type PageSEO,
} from './translations';

// Static Params Generators
export {
  generateLocaleParams,
  generateCountryParams,
  generateLocationParams,
  REVALIDATION_TIMES,
} from './staticParams';

// JSON-LD Components
export {
  OrganizationJsonLd,
  WebSiteJsonLd,
  BreadcrumbJsonLd,
  LocationJsonLd,
  ParaglidingActivityJsonLd,
  FAQJsonLd,
  ReviewJsonLd,
  ServiceJsonLd,
} from './JsonLd';
