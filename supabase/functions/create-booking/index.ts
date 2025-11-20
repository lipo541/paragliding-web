import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const bookingData = await req.json()
    console.log('Received booking data:', bookingData)

    // 1. Validate flight type and get real prices from database
    console.log('Fetching flight type:', bookingData.flight_type_id)
    console.log('From location:', bookingData.location_id)
    
    const { data: locationData, error: locationError } = await supabaseClient
      .from('location_pages')
      .select('content')
      .eq('location_id', bookingData.location_id)
      .single()

    console.log('Location data:', { locationData, locationError })

    if (locationError || !locationData) {
      throw new Error(`Invalid location: ${locationError?.message || 'Not found'}`)
    }

    // Find flight type in shared_flight_types array
    const sharedFlightTypes = locationData.content?.shared_flight_types || []
    const flightTypeData = sharedFlightTypes.find((ft: any) => ft.id === bookingData.flight_type_id)

    console.log('Flight type result:', flightTypeData)

    if (!flightTypeData) {
      throw new Error('Invalid flight type: Not found in location')
    }

    // 2. Validate promo code if provided
    let validPromoDiscount = 0
    if (bookingData.promo_code) {
      const { data: promoData, error: promoError } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('code', bookingData.promo_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (promoData && !promoError) {
        const now = new Date()
        const validFrom = promoData.valid_from ? new Date(promoData.valid_from) : null
        const validUntil = promoData.valid_until ? new Date(promoData.valid_until) : null
        
        const isDateValid = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)
        const isUsageValid = !promoData.usage_limit || promoData.usage_count < promoData.usage_limit
        
        if (isDateValid && isUsageValid) {
          validPromoDiscount = promoData.discount_percentage
        }
      }
    }

    // 3. Calculate real prices on backend
    let basePrice = 0
    switch (bookingData.currency) {
      case 'GEL':
        basePrice = flightTypeData.price_gel
        break
      case 'USD':
        basePrice = flightTypeData.price_usd
        break
      case 'EUR':
        basePrice = flightTypeData.price_eur
        break
      default:
        throw new Error('Invalid currency')
    }

    const subtotal = basePrice * bookingData.number_of_people
    const discountAmount = (subtotal * validPromoDiscount) / 100
    const totalPrice = subtotal - discountAmount

    // 4. Verify prices match (with 1 cent tolerance for rounding)
    console.log('Price verification:', {
      frontend: { base: bookingData.base_price, total: bookingData.total_price },
      backend: { base: basePrice, total: totalPrice },
      difference: {
        base: Math.abs(bookingData.base_price - basePrice),
        total: Math.abs(bookingData.total_price - totalPrice)
      }
    })

    const priceTolerance = 0.01
    if (
      Math.abs(bookingData.base_price - basePrice) > priceTolerance ||
      Math.abs(bookingData.total_price - totalPrice) > priceTolerance
    ) {
      throw new Error(`Price mismatch detected. Frontend: ${bookingData.total_price}, Backend: ${totalPrice}. Please refresh the page.`)
    }

    // 5. Insert booking with validated data
    const validatedBookingData = {
      ...bookingData,
      base_price: basePrice,
      total_price: totalPrice,
      promo_discount: validPromoDiscount,
    }

    const { data, error } = await supabaseClient
      .from('bookings')
      .insert([validatedBookingData])
      .select()
      .single()

    if (error) {
      throw error
    }

    // 6. Increment promo code usage
    if (bookingData.promo_code && validPromoDiscount > 0) {
      await supabaseClient.rpc('increment_promo_usage', { 
        promo_code_text: bookingData.promo_code.toUpperCase()
      })
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = {
      success: false,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }
    console.error('Returning error:', errorDetails)
    return new Response(
      JSON.stringify(errorDetails),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
