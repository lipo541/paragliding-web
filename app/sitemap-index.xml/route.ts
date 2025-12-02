/**
 * Sitemap Index Generator
 * ========================
 * აგენერირებს sitemap-index.xml-ს რომელიც აერთიანებს ყველა sitemap-ს
 * 
 * URL: /sitemap-index.xml
 * 
 * Google Search Console-ში ეს ერთი URL უნდა დარეგისტრირდეს
 */

import { NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/seo';

// Revalidate every 24 hours
export const revalidate = 86400;

export async function GET() {
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/image-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/video-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
