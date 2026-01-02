// Helper functions for company profile page

export type SupportedLocale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocalizableItem = { [key: string]: any };

/**
 * Get localized field value with fallback chain
 */
export function getLocalizedField(
  item: LocalizableItem,
  fieldPrefix: string,
  locale: SupportedLocale
): string {
  const localizedValue = item[`${fieldPrefix}_${locale}`] as string;
  if (localizedValue) return localizedValue;
  
  // Fallback chain: ka -> en -> first available
  const fallbacks: SupportedLocale[] = ['ka', 'en', 'ru', 'de', 'tr', 'ar'];
  for (const fallbackLocale of fallbacks) {
    const value = item[`${fieldPrefix}_${fallbackLocale}`] as string;
    if (value) return value;
  }
  
  return '';
}

/**
 * Get localized slug with fallback
 */
export function getLocalizedSlug(
  item: LocalizableItem,
  locale: SupportedLocale
): string {
  const slug = item[`slug_${locale}`] as string;
  if (slug) return slug;
  
  // Fallback chain
  const fallbacks: SupportedLocale[] = ['ka', 'en', 'ru', 'de', 'tr', 'ar'];
  for (const fallbackLocale of fallbacks) {
    const value = item[`slug_${fallbackLocale}`] as string;
    if (value) return value;
  }
  
  return item.id as string;
}

/**
 * Calculate company age in years from founded date
 */
export function calculateCompanyAge(foundedDate: string | null | undefined): number {
  if (!foundedDate) return 0;
  const founded = new Date(foundedDate);
  const now = new Date();
  return Math.floor((now.getTime() - founded.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Format rating display
 */
export function formatRating(rating: number | null | undefined): string {
  if (!rating || rating === 0) return '0.0';
  return rating.toFixed(1);
}

/**
 * Get rating star fill percentage
 */
export function getStarFill(rating: number, starIndex: number): number {
  const diff = rating - starIndex;
  if (diff >= 1) return 100;
  if (diff <= 0) return 0;
  return diff * 100;
}

/**
 * Get company profile URL
 */
export function getCompanyUrl(
  company: LocalizableItem,
  locale: SupportedLocale
): string {
  const slug = getLocalizedSlug(company, locale);
  return `/${locale}/company/${slug}`;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone;
}

/**
 * Format date for display
 */
export function formatDate(date: string | null | undefined, locale: SupportedLocale): string {
  if (!date) return '';
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const localeMap: Record<SupportedLocale, string> = {
    ka: 'ka-GE',
    en: 'en-US',
    ru: 'ru-RU',
    de: 'de-DE',
    tr: 'tr-TR',
    ar: 'ar-SA'
  };
  return d.toLocaleDateString(localeMap[locale], options);
}
