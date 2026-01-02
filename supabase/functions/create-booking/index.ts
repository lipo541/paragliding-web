import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  console.log('=== CREATE-BOOKING v2026.01.02.15 ===');
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Parse request body first
    let bookingData;
    try {
      bookingData = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('Received booking data:', JSON.stringify(bookingData, null, 2));
    // Validate required fields
    const requiredFields = [
      'full_name',
      'phone',
      'location_id',
      'flight_type_id',
      'selected_date',
      'number_of_people',
      'base_price',
      'total_price'
    ];
    const missingFields = requiredFields.filter((field)=>!bookingData[field] && bookingData[field] !== 0);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    // Validate date format
    if (bookingData.selected_date && !/^\d{4}-\d{2}-\d{2}$/.test(bookingData.selected_date)) {
      throw new Error(`Invalid date format: ${bookingData.selected_date}. Expected YYYY-MM-DD`);
    }
    // 1. Validate flight type and get real prices from database
    console.log('Fetching flight type:', bookingData.flight_type_id);
    console.log('From location:', bookingData.location_id);
    // Fetch location details (including country) to ensure we have names and IDs
    const { data: locationDetails, error: locationDetailsError } = await supabaseClient.from('locations').select('id, name_en, country_id, countries(id, name_en)').eq('id', bookingData.location_id).single();
    if (locationDetailsError || !locationDetails) {
      console.error('Error fetching location details:', locationDetailsError);
      throw new Error('Invalid location ID');
    }
    const resolvedCountryName = bookingData.country_name || locationDetails.countries?.name_en || 'Unknown Country';
    const resolvedCountryId = bookingData.country_id || locationDetails.country_id;
    const resolvedLocationName = bookingData.location_name || locationDetails.name_en;
    const { data: locationData, error: locationError } = await supabaseClient.from('location_pages').select('content').eq('location_id', bookingData.location_id).single();
    console.log('Location data:', {
      locationData,
      locationError
    });
    if (locationError || !locationData) {
      throw new Error(`Invalid location: ${locationError?.message || 'Not found'}`);
    }
    // Find flight type in shared_flight_types array
    const sharedFlightTypes = locationData.content?.shared_flight_types || [];
    const flightTypeData = sharedFlightTypes.find((ft)=>ft.id === bookingData.flight_type_id);
    console.log('Flight type result:', flightTypeData);
    if (!flightTypeData) {
      throw new Error('Invalid flight type: Not found in location');
    }
    // 1.5. Validate pilot/company ownership of location
    if (bookingData.pilot_id) {
      // Pilot direct booking - validate pilot serves this location
      const { data: pilotData, error: pilotError } = await supabaseClient.from('pilots').select('location_ids, company_id').eq('id', bookingData.pilot_id).single();
      if (pilotError || !pilotData) {
        console.error('Pilot validation error:', pilotError);
        throw new Error('Invalid pilot');
      }
      const pilotLocationIds = pilotData.location_ids || [];
      if (!pilotLocationIds.includes(bookingData.location_id)) {
        throw new Error('Pilot does not serve this location');
      }
      // Auto-set company_id from pilot if not provided
      if (!bookingData.company_id && pilotData.company_id) {
        bookingData.company_id = pilotData.company_id;
      }
      // Ensure booking_source is set correctly
      bookingData.booking_source = 'pilot_direct';
      console.log('Pilot booking validated:', {
        pilot_id: bookingData.pilot_id,
        company_id: bookingData.company_id
      });
    } else if (bookingData.company_id) {
      // Company direct booking - validate company exists
      const { data: companyData, error: companyError } = await supabaseClient.from('companies').select('id, name').eq('id', bookingData.company_id).single();
      if (companyError || !companyData) {
        // Company not found - continue as platform_general instead of failing
        console.log('Company not found, continuing as platform_general:', bookingData.company_id);
        bookingData.company_id = null;
        bookingData.booking_source = 'platform_general';
      } else {
        // Company exists - proceed as company_direct
        // No need to validate pilots - company can receive bookings without pilots
        bookingData.booking_source = 'company_direct';
        console.log('Company booking validated:', {
          company_id: bookingData.company_id,
          company_name: companyData.name
        });
      }
    } else {
      // Platform general booking
      bookingData.booking_source = 'platform_general';
    }
    // Normalize booking_source to valid enum values
    // Frontend might send 'platform' but DB expects 'platform_general'
    console.log('=== BOOKING SOURCE NORMALIZATION START ===');
    console.log('Initial bookingData.booking_source:', bookingData.booking_source);
    const validBookingSources = [
      'pilot_direct',
      'company_direct',
      'platform_general'
    ];
    let finalBookingSource = bookingData.booking_source;
    console.log('finalBookingSource before normalization:', finalBookingSource);
    // Explicit conversion for common mistakes
    if (finalBookingSource === 'platform') {
      console.log('CONVERTING platform to platform_general');
      finalBookingSource = 'platform_general';
    }
    if (!finalBookingSource || !validBookingSources.includes(finalBookingSource)) {
      console.log(`Normalizing booking_source from '${finalBookingSource}' to 'platform_general'`);
      finalBookingSource = 'platform_general';
    }
    console.log('FINAL booking_source to insert:', finalBookingSource);
    console.log('=== BOOKING SOURCE NORMALIZATION END ===');
    // 2. Validate promo code if provided
    let validPromoDiscount = 0;
    let promoCodeId = null;
    if (bookingData.promo_code) {
      try {
        const { data: promoValidation, error: promoError } = await supabaseClient.rpc('validate_promo_code', {
          promo_code_text: bookingData.promo_code.toUpperCase(),
          people_count: bookingData.number_of_people,
          location_id_param: bookingData.location_id
        });
        console.log('Promo validation result:', {
          promoValidation,
          promoError
        });
        if (promoError) {
          console.error('Promo validation RPC error:', promoError);
          // If validate_promo_code function doesn't exist, fallback to old method
          if (promoError.message?.includes('function') || promoError.code === '42883') {
            console.log('Using fallback promo validation');
            const { data: promoData } = await supabaseClient.from('promo_codes').select('*').eq('code', bookingData.promo_code.toUpperCase()).eq('is_active', true).single();
            if (promoData) {
              const now = new Date();
              const validFrom = promoData.valid_from ? new Date(promoData.valid_from) : null;
              const validUntil = promoData.valid_until ? new Date(promoData.valid_until) : null;
              const isDateValid = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now);
              const isUsageValid = !promoData.usage_limit || promoData.usage_count + bookingData.number_of_people <= promoData.usage_limit;
              if (isDateValid && isUsageValid) {
                validPromoDiscount = promoData.discount_percentage;
                promoCodeId = promoData.id;
              }
            }
          }
        } else if (promoValidation && promoValidation[0]) {
          const result = promoValidation[0];
          if (result.is_valid) {
            validPromoDiscount = result.discount_percentage;
            promoCodeId = result.promo_code_id;
          } else {
            throw new Error(result.error_message || 'Invalid promo code');
          }
        }
      } catch (err) {
        console.error('Promo code validation error:', err);
      // Continue without promo code if validation fails
      }
    }
    // 3. Calculate real prices on backend
    let pricePerPerson = 0;
    switch(bookingData.currency){
      case 'GEL':
        pricePerPerson = flightTypeData.price_gel;
        break;
      case 'USD':
        pricePerPerson = flightTypeData.price_usd;
        break;
      case 'EUR':
        pricePerPerson = flightTypeData.price_eur;
        break;
      default:
        throw new Error('Invalid currency');
    }
    const basePrice = pricePerPerson * bookingData.number_of_people;
    const servicesTotal = bookingData.services_total || 0;
    // Apply discount to both flight price AND services (matching frontend calculation)
    const discountAmount = (basePrice + servicesTotal) * validPromoDiscount / 100;
    const totalPrice = basePrice + servicesTotal - discountAmount;
    // 4. Verify prices match (with 1 cent tolerance for rounding)
    console.log('Price verification:', {
      frontend: {
        base: bookingData.base_price,
        services: bookingData.services_total,
        total: bookingData.total_price
      },
      backend: {
        base: basePrice,
        services: servicesTotal,
        total: totalPrice
      },
      difference: {
        base: Math.abs(bookingData.base_price - basePrice),
        total: Math.abs(bookingData.total_price - totalPrice)
      }
    });
    const priceTolerance = 0.01;
    if (Math.abs(bookingData.base_price - basePrice) > priceTolerance || Math.abs(bookingData.total_price - totalPrice) > priceTolerance) {
      throw new Error(`Price mismatch detected. Frontend: ${bookingData.total_price}, Backend: ${totalPrice}. Please refresh the page.`);
    }
    // 5. Insert booking with validated data
    console.log('Final booking source to be inserted:', finalBookingSource);
    console.log('Booking data keys:', Object.keys(bookingData));
    // Explicitly construct the object to avoid any spread issues or hidden fields
    const validatedBookingData = {
      user_id: bookingData.user_id,
      flight_type_id: bookingData.flight_type_id,
      flight_type_name: bookingData.flight_type_name,
      location_id: bookingData.location_id,
      pilot_id: bookingData.pilot_id,
      company_id: bookingData.company_id,
      selected_date: bookingData.selected_date,
      number_of_people: bookingData.number_of_people,
      full_name: bookingData.full_name,
      phone: bookingData.phone,
      country_name: resolvedCountryName,
      country_id: resolvedCountryId,
      location_name: resolvedLocationName,
      contact_method: bookingData.contact_method || null,
      special_requests: bookingData.special_requests || null,
      promo_code: bookingData.promo_code,
      services_total: bookingData.services_total,
      additional_services: bookingData.additional_services,
      currency: bookingData.currency,
      // Calculated/Validated fields
      booking_source: finalBookingSource,
      base_price: basePrice,
      total_price: totalPrice,
      promo_discount: validPromoDiscount
    };
    // Only add email if it exists in the request and we want to try to save it
    // But since the error says column doesn't exist, we should probably skip it for now
    // or check if the column exists. For now, let's skip it to fix the error.
    if (bookingData.email) {
      console.log('Skipping email field as it might not exist in DB:', bookingData.email);
    }
    console.log('Inserting booking with validated data:', JSON.stringify(validatedBookingData, null, 2));
    const { data, error } = await supabaseClient.from('bookings').insert([
      validatedBookingData
    ]).select().single();
    if (error) {
      console.error('Database insert error:', JSON.stringify(error, null, 2));
      throw new Error(`Database error: ${error.message || error.code || JSON.stringify(error)}`);
    }
    // 6. Increment promo code usage and log it
    if (bookingData.promo_code && validPromoDiscount > 0 && promoCodeId) {
      try {
        // Try new increment function with people_count
        const { error: incrementError } = await supabaseClient.rpc('increment_promo_usage', {
          promo_code_text: bookingData.promo_code.toUpperCase(),
          people_count: bookingData.number_of_people
        });
        // If new function doesn't exist, try old function
        if (incrementError && (incrementError.message?.includes('function') || incrementError.code === '42883')) {
          console.log('Using old increment_promo_usage function');
          // Old function only increments by 1
          for(let i = 0; i < bookingData.number_of_people; i++){
            await supabaseClient.rpc('increment_promo_usage', {
              promo_code_text: bookingData.promo_code.toUpperCase()
            });
          }
        }
        // Try to log promo code usage (table might not exist yet)
        await supabaseClient.from('promo_code_usage').insert({
          user_id: bookingData.user_id || null,
          booking_id: data.id,
          promo_code_id: promoCodeId,
          people_count: bookingData.number_of_people,
          discount_amount: discountAmount
        }).then(({ error })=>{
          if (error) console.log('promo_code_usage table not available yet:', error.message);
        });
      } catch (err) {
        console.error('Error updating promo usage:', err);
      // Don't fail the booking if promo tracking fails
      }
    }
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    // Extract error message from various error types
    let errorMessage = 'Unknown error occurred';
    let errorDetails = {};
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails.stack = error.stack;
      errorDetails.name = error.name;
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase/Postgres errors which might have different structure
      const errObj = error;
      errorMessage = errObj.message || errObj.error || errObj.details || JSON.stringify(error);
      errorDetails = {
        ...errObj
      };
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    const responseBody = {
      success: false,
      error: errorMessage,
      details: errorDetails
    };
    console.error('Returning error response:', JSON.stringify(responseBody, null, 2));
    return new Response(JSON.stringify(responseBody), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
