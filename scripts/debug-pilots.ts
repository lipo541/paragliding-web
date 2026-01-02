// Debug script to check pilots data
// Run with: npx tsx scripts/debug-pilots.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxvczwjbroyxpwnnwaca.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPilots() {
  console.log('\n🔍 Checking pilots and requests data...\n');

  // 1. Get all pilots
  const { data: allPilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, first_name_ka, last_name_ka, status, company_id, location_ids');

  if (pilotsError) {
    console.error('❌ Error fetching pilots:', pilotsError);
    return;
  }

  console.log(`📊 Total pilots: ${allPilots?.length || 0}`);
  console.log('\n--- All Pilots ---');
  allPilots?.forEach(p => {
    console.log(`  ${p.first_name_ka} ${p.last_name_ka}:`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Status: ${p.status}`);
    console.log(`    Company ID: ${p.company_id || 'NULL'}`);
    console.log(`    Location IDs: ${JSON.stringify(p.location_ids)}`);
  });

  // 2. Get verified pilots with company
  const { data: verifiedWithCompany, error: e2 } = await supabase
    .from('pilots')
    .select('id, first_name_ka, status, company_id, location_ids')
    .eq('status', 'verified')
    .not('company_id', 'is', null);

  console.log(`\n📊 Verified pilots with company: ${verifiedWithCompany?.length || 0}`);
  if (e2) console.error('Error:', e2);

  // 3. Get all companies
  const { data: companies, error: e4 } = await supabase
    .from('companies')
    .select('id, name_ka, status');

  console.log('\n--- All Companies ---');
  companies?.forEach(c => {
    console.log(`  ${c.name_ka}: ${c.id} (status: ${c.status})`);
  });

  // 4. Get pilot_company_requests
  const { data: requests, error: reqError } = await supabase
    .from('pilot_company_requests')
    .select('id, pilot_id, company_id, status, request_type, created_at');

  console.log('\n--- Pilot Company Requests ---');
  if (reqError) {
    console.log(`  Error: ${reqError.message}`);
  } else if (!requests || requests.length === 0) {
    console.log('  No requests found');
  } else {
    requests.forEach(r => {
      console.log(`  Request ${r.id}:`);
      console.log(`    Type: ${r.request_type}`);
      console.log(`    Pilot: ${r.pilot_id}`);
      console.log(`    Company: ${r.company_id}`);
      console.log(`    Status: ${r.status}`);
    });
  }
}

debugPilots().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
