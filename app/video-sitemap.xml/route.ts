/**
 * Video Sitemap Generator
 * ========================
 * აგენერირებს video-sitemap.xml-ს ბაზის მონაცემებიდან
 * 
 * URL: /video-sitemap.xml
 * 
 * Google Video/YouTube ძიებაში უკეთესი ინდექსირებისთვის
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { BASE_URL, locales } from '@/lib/seo';

// Revalidate every 24 hours
export const revalidate = 86400;

interface LocationContent {
  ka?: { h1_tag?: string; p_tag?: string };
  en?: { h1_tag?: string; p_tag?: string };
  shared_videos?: string[];
  [key: string]: { h1_tag?: string; p_tag?: string } | string[] | undefined;
}

interface LocationPage {
  content?: LocationContent;
}

/**
 * YouTube URL-დან video ID-ის ამოღება
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET() {
  const supabase = createServerClient();

  // Fetch locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select(`
      id,
      name_ka, name_en, name_ru, name_de, name_tr, name_ar,
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      seo_description_en, seo_description_ka,
      og_image_url,
      updated_at,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
        name_en, name_ka
      )
    `);

  // Fetch location_pages separately (shared_videos is inside content JSON)
  const { data: locationPages, error: pagesError } = await supabase
    .from('location_pages')
    .select('location_id, content')
    .eq('is_active', true);

  // Debug log
  console.log('[VIDEO-SITEMAP] Locations found:', locations?.length || 0);
  console.log('[VIDEO-SITEMAP] Location pages found:', locationPages?.length || 0);
  if (locError) console.error('[VIDEO-SITEMAP] Locations Error:', locError);
  if (pagesError) console.error('[VIDEO-SITEMAP] Pages Error:', pagesError);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

  if (locations && locations.length > 0) {
    for (const location of locations) {
      const country = location.countries as unknown as Record<string, string>;
      
      // Find matching location_page by location_id
      const locationPage = locationPages?.find(
        (lp: { location_id: string; content: LocationPage['content'] }) => lp.location_id === location.id
      );

      // shared_videos is inside content JSON
      const content = locationPage?.content as LocationContent | undefined;
      const videos: string[] = Array.isArray(content?.shared_videos) ? content.shared_videos : [];
      
      if (videos.length === 0) continue;

      // Get description from content or SEO
      const description = location.seo_description_en || 
                         location.seo_description_ka || 
                         content?.en?.p_tag ||
                         content?.ka?.p_tag ||
                         `Paragliding experience in ${location.name_en || location.name_ka}`;

      // Thumbnail - use OG image or first gallery image
      const thumbnailUrl = location.og_image_url || `${BASE_URL}/og-default.jpg`;
      
      // Publication date
      const pubDate = location.updated_at 
        ? new Date(location.updated_at as string).toISOString().split('T')[0]
        : '2025-01-01';

      // Generate URL entries for primary locale (en)
      const locationSlug = location.slug_en || location.slug_ka;
      const countrySlug = country.slug_en || country.slug_ka;
      const pageUrl = `${BASE_URL}/en/locations/${countrySlug}/${locationSlug}`;

      xml += `  <url>
    <loc>${pageUrl}</loc>
`;

      for (let i = 0; i < videos.length; i++) {
        const videoUrl = videos[i];
        const videoId = extractYouTubeId(videoUrl);
        
        if (!videoId) continue;

        const videoTitle = `Paragliding in ${location.name_en || location.name_ka}${videos.length > 1 ? ` - Video ${i + 1}` : ''}`;
        const videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        xml += `    <video:video>
      <video:thumbnail_loc>${escapeXml(videoThumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(videoTitle)}</video:title>
      <video:description>${escapeXml(truncate(description, 2000))}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${videoId}</video:player_loc>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      <video:tag>paragliding</video:tag>
      <video:tag>${escapeXml(location.name_en || location.name_ka || '')}</video:tag>
      <video:tag>Georgia</video:tag>
      <video:tag>tandem flight</video:tag>
      <video:tag>adventure</video:tag>
    </video:video>
`;
      }

      xml += `  </url>
`;

      // Also add for other locales with content
      for (const locale of locales.filter(l => l !== 'en')) {
        const localeSlug = location[`slug_${locale}` as keyof typeof location] || location.slug_en;
        const localeCountrySlug = country[`slug_${locale}`] || country.slug_en;
        const localePageUrl = `${BASE_URL}/${locale}/locations/${localeCountrySlug}/${localeSlug}`;
        
        const localeName = location[`name_${locale}` as keyof typeof location] || location.name_en || location.name_ka;

        xml += `  <url>
    <loc>${localePageUrl}</loc>
`;

        for (let i = 0; i < videos.length; i++) {
          const videoUrl = videos[i];
          const videoId = extractYouTubeId(videoUrl);
          
          if (!videoId) continue;

          const videoTitle = `Paragliding in ${localeName}${videos.length > 1 ? ` - Video ${i + 1}` : ''}`;
          const videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

          xml += `    <video:video>
      <video:thumbnail_loc>${escapeXml(videoThumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(videoTitle)}</video:title>
      <video:description>${escapeXml(truncate(description, 2000))}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${videoId}</video:player_loc>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
`;
        }

        xml += `  </url>
`;
      }
    }
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
