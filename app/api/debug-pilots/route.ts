import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const slug = searchParams.get('slug');

  const supabase = createServerClient();

  let targetCompanyId = companyId;

  // If slug is provided, find company by slug
  if (slug) {
    const { data: company } = await supabase
      .from('companies')
      .select('id, name_ka, name_en, slug_ka, slug_en')
      .or(`slug_ka.eq.${slug},slug_en.eq.${slug}`)
      .single();
    
    if (company) {
      targetCompanyId = company.id;
    }
  }

  if (!targetCompanyId) {
    return NextResponse.json({ error: 'companyId or slug is required' }, { status: 400 });
  }

  // Check company details
  const { data: company } = await supabase
    .from('companies')
    .select('id, name_ka, name_en, slug_ka, slug_en, status')
    .eq('id', targetCompanyId)
    .single();

  // Check pilots table directly with company_id
  const { data: pilotsWithCompanyId, error: error1 } = await supabase
    .from('pilots')
    .select('*')
    .eq('company_id', targetCompanyId);

  // Check pilots with verified status
  const { data: verifiedPilots, error: error4 } = await supabase
    .from('pilots')
    .select('*')
    .eq('company_id', targetCompanyId)
    .eq('status', 'verified');

  // Check all pilots to see what's in the database
  const { data: allPilots, error: error2 } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, company_id, status');

  // Check company_pilots junction table if it exists
  const { data: companyPilots, error: error3 } = await supabase
    .from('company_pilots')
    .select('*')
    .eq('company_id', targetCompanyId);

  return NextResponse.json({
    company,
    companyId: targetCompanyId,
    slug,
    pilotsWithCompanyId: {
      data: pilotsWithCompanyId,
      error: error1?.message,
      count: pilotsWithCompanyId?.length || 0,
    },
    verifiedPilots: {
      data: verifiedPilots,
      error: error4?.message,
      count: verifiedPilots?.length || 0,
    },
    allPilotsInDatabase: {
      data: allPilots,
      error: error2?.message,
      count: allPilots?.length || 0,
    },
    companyPilotsJunction: {
      data: companyPilots,
      error: error3?.message,
      count: companyPilots?.length || 0,
    },
  });
}
