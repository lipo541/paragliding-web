import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name_ka, slug_ka, slug_en, status');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Companies:');
  data?.forEach(c => {
    console.log(`- ${c.name_ka}: slug_ka="${c.slug_ka}", slug_en="${c.slug_en}", status="${c.status}"`);
  });
}

checkCompanies();
