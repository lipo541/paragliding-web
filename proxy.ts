import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Extract locale from path for x-locale header
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const detectedLocale = localeMatch ? localeMatch[1] : defaultLocale;

  if (pathnameHasLocale) {
    // Add x-locale header for root layout to use
    const response = NextResponse.next();
    response.headers.set('x-locale', detectedLocale);
    return response;
  }

  // Redirect to default locale (ka)
  const locale = defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!_next|api|favicon.ico|.*\\.).*)',
  ],
};
