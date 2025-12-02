/**
 * Image Sitemap Generator
 * ========================
 * აგენერირებს image-sitemap.xml-ს ბაზის მონაცემებიდან
 * 
 * URL: /image-sitemap.xml
 * 
 * Google Images-ში უკეთესი ინდექსირებისთვის
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { BASE_URL, locales } from '@/lib/seo';

// Revalidate every 24 hours
export const revalidate = 86400;

interface GalleryImage {
  url: string;
  alt_ka?: string;
  alt_en?: string;
  alt_ru?: string;
  alt_de?: string;
  alt_tr?: string;
  alt_ar?: string;
}

interface HeroImage {
  url: string;
  alt_ka?: string;
  alt_en?: string;
  alt_ru?: string;
  alt_de?: string;
  alt_tr?: string;
  alt_ar?: string;
}

interface SharedImages {
  gallery?: GalleryImage[];
  hero_image?: HeroImage;
}

interface LocationContent {
  ka?: { h1_tag?: string };
  en?: { h1_tag?: string };
  [key: string]: { h1_tag?: string } | undefined;
}

interface LocationPage {
  content?: LocationContent & {
    shared_images?: SharedImages;
  };
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
      og_image_url,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      )
    `);

  // Fetch location_pages separately (shared_images is inside content JSON)
  const { data: locationPages, error: pagesError } = await supabase
    .from('location_pages')
    .select('location_id, content')
    .eq('is_active', true);

  // Debug log
  console.log('[IMAGE-SITEMAP] Locations found:', locations?.length || 0);
  console.log('[IMAGE-SITEMAP] Location pages found:', locationPages?.length || 0);
  if (locError) console.error('[IMAGE-SITEMAP] Locations Error:', locError);
  if (pagesError) console.error('[IMAGE-SITEMAP] Pages Error:', pagesError);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  if (locations && locations.length > 0) {
    for (const location of locations) {
      const country = location.countries as unknown as Record<string, string>;
      
      // Find matching location_page by location_id
      const locationPage = locationPages?.find(
        (lp: { location_id: string; content: LocationPage['content'] }) => lp.location_id === location.id
      );

      // shared_images is inside content JSON
      const sharedImages = locationPage?.content?.shared_images as SharedImages | undefined;
      const galleryImages = sharedImages?.gallery || [];
      const heroImage = sharedImages?.hero_image;
      const ogImage = location.og_image_url;

      // Collect all images for this location
      const images: { url: string; title: string; caption?: string }[] = [];

      // Add OG image
      if (ogImage) {
        images.push({
          url: ogImage,
          title: `${location.name_en || location.name_ka} - Paragliding`,
          caption: `Paragliding in ${location.name_en || location.name_ka}, Georgia`
        });
      }

      // Add hero image
      if (heroImage?.url) {
        images.push({
          url: heroImage.url,
          title: `${location.name_en || location.name_ka} Hero Image`,
          caption: heroImage.alt_en || `Paragliding destination: ${location.name_en || location.name_ka}`
        });
      }

      // Add gallery images
      galleryImages.forEach((img: GalleryImage, index: number) => {
        if (img.url) {
          images.push({
            url: img.url,
            title: img.alt_en || `${location.name_en || location.name_ka} - Photo ${index + 1}`,
            caption: img.alt_en || `Paragliding gallery image from ${location.name_en || location.name_ka}`
          });
        }
      });

      // Generate URL entries for each locale
      for (const locale of locales) {
        const locationSlug = location[`slug_${locale}` as keyof typeof location] || location.slug_en;
        const countrySlug = country[`slug_${locale}`] || country.slug_en;
        const pageUrl = `${BASE_URL}/${locale}/locations/${countrySlug}/${locationSlug}`;

        if (images.length > 0) {
          xml += `  <url>
    <loc>${pageUrl}</loc>
`;
          for (const img of images) {
            xml += `    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
${img.caption ? `      <image:caption>${escapeXml(img.caption)}</image:caption>\n` : ''}    </image:image>
`;
          }
          xml += `  </url>
`;
        }
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
