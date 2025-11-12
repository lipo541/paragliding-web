export const locales = ['ka', 'en', 'ru', 'ar', 'de', 'tr'] as const;
export const defaultLocale = 'ka' as const;

export type Locale = (typeof locales)[number];
