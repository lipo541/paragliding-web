// Helper functions for pilots page

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
 * Get pilot's full name with localization
 */
export function getPilotName(
  pilot: LocalizableItem,
  locale: SupportedLocale
): string {
  const firstName = getLocalizedField(pilot, 'first_name', locale);
  const lastName = getLocalizedField(pilot, 'last_name', locale);
  
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'პილოტი';
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
 * Calculate pilot's experience in years
 */
export function calculateExperience(startDate: string | null | undefined): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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
 * Get pilot profile URL
 */
export function getPilotUrl(
  pilot: LocalizableItem,
  locale: SupportedLocale
): string {
  const slug = getLocalizedSlug(pilot, locale);
  return `/${locale}/pilot/${slug}`;
}

/**
 * Format flights count with K suffix for large numbers
 */
export function formatFlightsCount(flights: number | null | undefined): string {
  if (!flights) return '0';
  if (flights >= 1000) {
    return `${(flights / 1000).toFixed(1)}K`;
  }
  return flights.toString();
}
