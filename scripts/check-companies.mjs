import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dxvczwjbroyxpwnnwaca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dmN6d2picm95eHB3bm53YWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkzMTkwNiwiZXhwIjoyMDc4NTA3OTA2fQ.Nd2jJQ3XILff1Gt--rl4c_nxH1nFTDDuyI0Rx7WqKms'
);

async function main() {
  // Get companies
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select('id, name_ka, country_id, status');
  
  console.log('=== Companies ===');
  if (compErr) console.error('Error:', compErr);
  companies?.forEach(c => {
    console.log(`- ${c.name_ka} | country_id: ${c.country_id} | status: ${c.status}`);
  });

  // Get ALL countries (including inactive)
  const { data: allCountries, error: countryErr } = await supabase
    .from('countries')
    .select('id, name_ka, is_active');
  
  console.log('\n=== ALL Countries ===');
  if (countryErr) console.error('Error:', countryErr);
  allCountries?.forEach(c => {
    console.log(`- ${c.name_ka} | id: ${c.id} | active: ${c.is_active}`);
  });

  // Get active countries only
  const { data: activeCountries } = await supabase
    .from('countries')
    .select('id, name_ka, is_active')
    .eq('is_active', true);
  
  console.log('\n=== ACTIVE Countries ===');
  activeCountries?.forEach(c => {
    console.log(`- ${c.name_ka} | id: ${c.id}`);
  });
}

main();
