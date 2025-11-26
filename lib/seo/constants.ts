/**
 * SEO Constants and Configuration
 * ================================
 * ცენტრალიზებული SEO კონფიგურაცია მთელი აპლიკაციისთვის
 */

import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

// ============================================
// 🌐 BASE URL Configuration
// ============================================

/**
 * საიტის Base URL
 * - Development: http://localhost:3000
 * - Production: https://your-domain.com (შეცვალეთ deploy-ის დროს)
 */
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL 
  || (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://your-domain.com');

// ============================================
// 🌍 Localization
// ============================================

export { locales, defaultLocale };
export type { Locale };

/**
 * x-default ენა (fallback როცა მომხმარებლის ენა არ არის მხარდაჭერილი)
 */
export const X_DEFAULT_LOCALE: Locale = 'en';

/**
 * Locale სახელები (UI-სთვის და Schema.org-ისთვის)
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
  tr: 'Türkçe',
  ar: 'العربية',
};

/**
 * hreflang კოდები (ISO 639-1)
 * ზოგიერთ შემთხვევაში შეიძლება განსხვავდებოდეს locale-სგან
 */
export const HREFLANG_CODES: Record<Locale, string> = {
  ka: 'ka',
  en: 'en',
  ru: 'ru',
  de: 'de',
  tr: 'tr',
  ar: 'ar',
};

// ============================================
// 📝 Default SEO Values
// ============================================

/**
 * საიტის სახელი
 */
export const SITE_NAME = 'Paragliding Georgia';

/**
 * Default Meta Descriptions (თუ გვერდს არ აქვს საკუთარი)
 */
export const DEFAULT_DESCRIPTIONS: Record<Locale, string> = {
  ka: 'საქართველოში პარაგლაიდინგის საუკეთესო ადგილები. დაჯავშნე ტანდემ ფრენა გუდაურში, კაზბეგში და სხვა ლოკაციებზე.',
  en: 'Best paragliding locations in Georgia. Book tandem flights in Gudauri, Kazbegi and other stunning locations.',
  ru: 'Лучшие места для параглайдинга в Грузии. Забронируйте тандемный полет в Гудаури, Казбеги и других локациях.',
  de: 'Die besten Gleitschirmflug-Standorte in Georgien. Buchen Sie Tandemflüge in Gudauri, Kazbegi und anderen Orten.',
  tr: 'Gürcistan\'daki en iyi yamaç paraşütü lokasyonları. Gudauri, Kazbegi ve diğer muhteşem lokasyonlarda tandem uçuş rezervasyonu yapın.',
  ar: 'أفضل مواقع الطيران المظلي في جورجيا. احجز رحلات ترادفية في غودوري وكازبيغي ومواقع أخرى مذهلة.',
};

/**
 * Title Templates - %s ადგილას ჩაჯდება გვერდის სათაური
 */
export const TITLE_TEMPLATES: Record<Locale, string> = {
  ka: '%s | პარაგლაიდინგი საქართველოში',
  en: '%s | Paragliding Georgia',
  ru: '%s | Параглайдинг в Грузии',
  de: '%s | Gleitschirmfliegen Georgien',
  tr: '%s | Gürcistan Yamaç Paraşütü',
  ar: '%s | الطيران المظلي في جورجيا',
};

/**
 * Default OG Image
 */
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

// ============================================
// 🚫 Routes Configuration
// ============================================

/**
 * გვერდები რომლებიც არ უნდა დაინდექსდეს
 */
export const NOINDEX_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/profile',
  '/bookings',
  '/notifications',
  '/cms',
  '/user',
  '/auth',
] as const;

/**
 * გვერდები რომლებიც არ უნდა მოხვდეს sitemap-ში
 */
export const SITEMAP_EXCLUDE_ROUTES = [
  ...NOINDEX_ROUTES,
  '/api',
] as const;

/**
 * სტატიკური გვერდები (sitemap-ისთვის)
 */
export const STATIC_ROUTES = [
  '',           // home
  '/about',
  '/contact',
  '/locations',
  '/promotions',
  '/terms',
  '/privacy',
] as const;

// ============================================
// 🔧 Utility Types
// ============================================

export interface AlternateUrls {
  canonical: string;
  languages: Record<Locale | 'x-default', string>;
}

export interface SEOMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}
