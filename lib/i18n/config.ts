export const locales = ['ka', 'en', 'ru', 'ar', 'de', 'tr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ka';

export const namespaces = [
  'common',
  'navigation',
  'auth',
  'globallocations',
  'countrypage',
  'locationinfocard',
  'locationpage',
  'rating',
  'comments',
  'bookings',
  'promotionpage',
  'login',
  'register',
  'userbottomnav',
  'usernotification',
  'userprofile',
  'userbookings',
  'footer',
  'profile',
  'admin',
  'validation',
] as const;

export type Namespace = (typeof namespaces)[number];
