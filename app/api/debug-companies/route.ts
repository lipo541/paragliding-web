import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServerClient();
  
  // Fetch countries
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('id, name_ka, name_en, is_active')
    .eq('is_active', true)
    .order('name_ka', { ascending: true });

  // Fetch companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name_ka, country_id, status')
    .eq('status', 'verified');

  return NextResponse.json({
    countries: countries || [],
    countriesError,
    companies: companies || [],
    companiesError,
    debug: {
      countriesCount: countries?.length || 0,
      companiesCount: companies?.length || 0,
    }
  });
}
