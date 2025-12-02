import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface LocationContent {
  shared_images?: {
    hero_image?: { url: string };
    gallery?: { url: string }[];
  };
  shared_videos?: string[];
}

export async function GET() {
  const supabase = createServerClient();

  // Check locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name_en, og_image_url');

  // Check location_pages separately
  const { data: locationPages, error: pagesError } = await supabase
    .from('location_pages')
    .select('id, location_id, is_active, content');

  // Check countries (no is_active field in countries table)
  const { data: countries, error: countryError } = await supabase
    .from('countries')
    .select('id, name_en');

  return NextResponse.json({
    locations: {
      count: locations?.length || 0,
      error: locError?.message || null,
      data: locations?.map(loc => {
        const page = locationPages?.find(lp => lp.location_id === loc.id);
        const content = page?.content as LocationContent | undefined;
        return {
          id: loc.id,
          name: loc.name_en,
          has_og_image: !!loc.og_image_url,
          has_location_page: !!page,
          location_page_is_active: page?.is_active,
          has_shared_images: !!content?.shared_images,
          has_hero_image: !!content?.shared_images?.hero_image?.url,
          gallery_count: content?.shared_images?.gallery?.length || 0,
          has_shared_videos: !!content?.shared_videos,
          videos_count: content?.shared_videos?.length || 0,
        };
      })
    },
    location_pages: {
      count: locationPages?.length || 0,
      error: pagesError?.message || null,
    },
    countries: {
      count: countries?.length || 0,
      error: countryError?.message || null,
    }
  }, { status: 200 });
}
