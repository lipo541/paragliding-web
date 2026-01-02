// Run migration via Supabase Management API
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'dxvczwjbroyxpwnnwaca';

const sql = `
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';
COMMENT ON COLUMN public.companies.cover_image_url IS 'Hero/cover image URL for company profile page';
COMMENT ON COLUMN public.companies.gallery_images IS 'JSON array of gallery images';
COMMENT ON COLUMN public.companies.video_urls IS 'Array of YouTube video URLs';
`;

async function runMigration() {
  console.log('Running migration via Supabase SQL Editor...');
  console.log('');
  console.log('Please run the following SQL in Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
  console.log('');
  console.log('After running, verify with:');
  console.log('SELECT id, cover_image_url, gallery_images, video_urls FROM companies LIMIT 1;');
}

runMigration();
