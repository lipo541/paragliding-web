/**
 * Dynamic Robots.txt Generator
 * =============================
 * აკონტროლებს რომელი გვერდები დაინდექსდეს
 * 
 * URL: /robots.txt
 */

import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // 🔒 პირადი გვერდები
          '/*/login',
          '/*/register',
          '/*/forgot-password',
          '/*/profile',
          '/*/bookings',
          '/*/notifications',
          '/*/user',
          '/*/user-promotions',
          
          // 🔒 ადმინ პანელი
          '/*/cms',
          '/*/cms/*',
          
          // 🔒 API და Auth
          '/api/',
          '/api/*',
          '/auth/',
          '/auth/*',
          
          // 🔒 Query Parameters (დუბლიკატების პრევენცია)
          '/*?sort=*',
          '/*?filter=*',
          '/*?page=*',
          '/*?utm_*',
          '/*?ref=*',
          '/*?fbclid=*',
          '/*?gclid=*',
        ],
      },
      {
        // Googlebot-ისთვის იგივე წესები
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/*/login',
          '/*/register',
          '/*/forgot-password',
          '/*/profile',
          '/*/bookings',
          '/*/notifications',
          '/*/user',
          '/*/user-promotions',
          '/*/cms',
          '/*/cms/*',
          '/api/',
          '/api/*',
          '/auth/',
          '/auth/*',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
