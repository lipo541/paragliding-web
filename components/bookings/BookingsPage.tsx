'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import Image from 'next/image';
import { Calendar, MapPin, Clock, CheckCircle2, User, Mail, Phone, MessageSquare, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
}

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  country_id: string;
  og_image_url?: string;
}

interface FlightType {
  shared_id: string;
  name: string;
  description: string;
  features: string[];
  duration?: string;
}

interface BookingDetails {
  locationId?: string;
  locationName?: string;
  countryId?: string;
  countryName?: string;
  flightTypeName?: string;
  flightTypeId?: string;
  priceGel?: number;
  priceUsd?: number;
  priceEur?: number;
  duration?: string;
  features?: string[];
  heroImage?: string;
}

export default function BookingsPage() {
  const { t, locale } = useTranslation('bookings');
  const searchParams = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'GEL' | 'USD' | 'EUR'>('GEL');

  // Helper function to get localized name
  const getLocalizedName = (item: any): string => {
    if (!item) return '';
    const nameKey = `name_${locale}` as keyof typeof item;
    return item[nameKey] || item.name_en || item.name_ka || '';
  };
  
  // Dropdown Data
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [flightTypes, setFlightTypes] = useState<FlightType[]>([]);
  const [sharedFlightTypes, setSharedFlightTypes] = useState<any[]>([]);
  
  // Selected Values
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedFlightTypeId, setSelectedFlightTypeId] = useState('');
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'telegram' | 'viber' | ''>('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch all countries
        const { data: countriesData } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr')
          .eq('is_active', true)
          .order('name_ka');
        
        setCountries(countriesData || []);

        // Get URL parameters
        const locationId = searchParams.get('locationId');
        const flightTypeId = searchParams.get('flightTypeId');

        if (locationId && flightTypeId) {
          // Pre-fill from URL parameters
          const { data: locationData } = await supabase
            .from('locations')
            .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, country_id, og_image_url')
            .eq('id', locationId)
            .single();

          if (locationData) {
            setSelectedCountryId(locationData.country_id);
            setSelectedLocationId(locationData.id);
            setSelectedFlightTypeId(flightTypeId);

            // Fetch locations for this country
            const { data: locationsData } = await supabase
              .from('locations')
              .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, country_id, og_image_url')
              .eq('country_id', locationData.country_id)
              .order('name_ka');
            
            setLocations(locationsData || []);

            // Fetch flight types for this location
            const { data: locationPageData } = await supabase
              .from('location_pages')
              .select('content')
              .eq('location_id', locationData.id)
              .single();

            if (locationPageData?.content) {
              // Get flight types for current locale, fallback to ka
              const initialLocaleFlightTypes = locationPageData.content[locale]?.flight_types || locationPageData.content.ka?.flight_types || [];
              const sharedTypes = locationPageData.content.shared_flight_types || [];
              
              setFlightTypes(initialLocaleFlightTypes);
              setSharedFlightTypes(sharedTypes);

              // Set booking details
              const selectedFlight = initialLocaleFlightTypes.find((ft: any) => ft.shared_id === flightTypeId);
              const sharedFlight = sharedTypes.find((sft: any) => sft.id === flightTypeId);
              
              const { data: countryData } = await supabase
                .from('countries')
                .select('name_ka, name_en, name_ru, name_ar, name_de, name_tr')
                .eq('id', locationData.country_id)
                .single();

              const heroImage = locationPageData.content.shared_images?.hero_image?.url || locationData.og_image_url;

              // Get flight type name based on current locale
              const localeFlightTypes = locationPageData.content[locale]?.flight_types || locationPageData.content.ka?.flight_types || [];
              const localizedFlight = localeFlightTypes.find((ft: any) => ft.shared_id === flightTypeId);

              setBookingDetails({
                locationId: locationData.id,
                locationName: getLocalizedName(locationData),
                countryId: locationData.country_id,
                countryName: getLocalizedName(countryData),
                flightTypeName: localizedFlight?.name || selectedFlight?.name || 'Flight',
                flightTypeId: flightTypeId,
                priceGel: sharedFlight?.price_gel || selectedFlight?.price_gel,
                priceUsd: sharedFlight?.price_usd || selectedFlight?.price_usd,
                priceEur: sharedFlight?.price_eur || selectedFlight?.price_eur,
                duration: localizedFlight?.duration || selectedFlight?.duration,
                features: localizedFlight?.features || selectedFlight?.features || [],
                heroImage: heroImage,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [searchParams]);

  // Fetch locations when country changes
  useEffect(() => {
    if (!selectedCountryId) return;

    const fetchLocations = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('locations')
        .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, country_id, og_image_url')
        .eq('country_id', selectedCountryId)
        .order('name_ka');
      
      setLocations(data || []);
      
      // Reset location and flight type if country changed
      if (selectedLocationId && data?.find((loc: any) => loc.id === selectedLocationId)?.country_id !== selectedCountryId) {
        setSelectedLocationId('');
        setSelectedFlightTypeId('');
        setFlightTypes([]);
      }
    };

    fetchLocations();
  }, [selectedCountryId]);

  // Fetch flight types when location changes
  useEffect(() => {
    if (!selectedLocationId) return;

    const fetchFlightTypes = async () => {
      const supabase = createClient();
      const { data: locationPageData } = await supabase
        .from('location_pages')
        .select('content')
        .eq('location_id', selectedLocationId)
        .single();

      if (locationPageData?.content) {
        // Get flight types for current locale, fallback to ka
        const localeFlightTypes = locationPageData.content[locale]?.flight_types || locationPageData.content.ka?.flight_types || [];
        const sharedTypes = locationPageData.content.shared_flight_types || [];
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 Loaded flight types for location:', selectedLocationId, {
            locale: locale,
            localeFlightTypes: localeFlightTypes.map((ft: any) => ({ id: ft.shared_id, name: ft.name })),
            sharedTypes: sharedTypes.map((st: any) => ({ id: st.id, price_gel: st.price_gel })),
            currentSelection: selectedFlightTypeId
          });
        }
        
        // Set flight types first (using locale-specific)
        setFlightTypes(localeFlightTypes);
        setSharedFlightTypes(sharedTypes);
        
        // Then validate current selection
        if (selectedFlightTypeId) {
          const flightExists = localeFlightTypes.find((ft: any) => ft.shared_id === selectedFlightTypeId);
          const sharedExists = sharedTypes.find((st: any) => st.id === selectedFlightTypeId);
          
          if (!flightExists || !sharedExists) {
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ Current flight type not available in this location, resetting');
            }
            setSelectedFlightTypeId('');
          } else if (process.env.NODE_ENV === 'development') {
            console.log('✅ Current flight type is valid');
          }
        }
      }
    };

    fetchFlightTypes();
  }, [selectedLocationId, locale]);

  // Update booking details when selections change
  useEffect(() => {
    if (!selectedCountryId || !selectedLocationId || !selectedFlightTypeId) {
      // Clear booking details if selections are incomplete
      if (bookingDetails.locationId) {
        setBookingDetails({});
      }
      return;
    }

    // Wait for flight types to be loaded
    if (flightTypes.length === 0 || sharedFlightTypes.length === 0) {
      return;
    }

    let isCancelled = false;

    const updateBookingDetails = async () => {
      try {
        const supabase = createClient();
        
        const selectedCountry = countries.find(c => c.id === selectedCountryId);
        const selectedLocation = locations.find(l => l.id === selectedLocationId);
        const selectedFlight = flightTypes.find(ft => ft.shared_id === selectedFlightTypeId);
        const sharedFlight = sharedFlightTypes.find(sft => sft.id === selectedFlightTypeId);

        if (!selectedFlight || !sharedFlight) {
          console.warn('⚠️ Flight type not found:', selectedFlightTypeId);
          setSelectedFlightTypeId('');
          return;
        }

        // Check if booking details already match (avoid unnecessary updates)
        if (
          bookingDetails.locationId === selectedLocationId &&
          bookingDetails.flightTypeId === selectedFlightTypeId &&
          bookingDetails.priceGel === sharedFlight.price_gel
        ) {
          return; // Already up to date
        }

        // Fetch hero image
        const { data: locationPageData } = await supabase
          .from('location_pages')
          .select('content')
          .eq('location_id', selectedLocationId)
          .single();

        if (isCancelled) return;

        const heroImage = locationPageData?.content?.shared_images?.hero_image?.url || selectedLocation?.og_image_url;

        const newBookingDetails = {
          locationId: selectedLocationId,
          locationName: getLocalizedName(selectedLocation),
          countryId: selectedCountryId,
          countryName: getLocalizedName(selectedCountry),
          flightTypeName: selectedFlight.name || 'Flight',
          flightTypeId: selectedFlightTypeId,
          priceGel: sharedFlight.price_gel || 0,
          priceUsd: sharedFlight.price_usd || 0,
          priceEur: sharedFlight.price_eur || 0,
          duration: selectedFlight.duration || '',
          features: selectedFlight.features || [],
          heroImage: heroImage || '',
        };

        setBookingDetails(newBookingDetails);
      } catch (error) {
        console.error('❌ Error updating booking details:', error);
      }
    };

    updateBookingDetails();

    return () => {
      isCancelled = true;
    };
  }, [selectedCountryId, selectedLocationId, selectedFlightTypeId, countries, locations, flightTypes, sharedFlightTypes, bookingDetails, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactMethod) {
      alert(t('errors.selectContactMethod'));
      return;
    }

    if (!selectedCountryId || !selectedLocationId || !selectedFlightTypeId) {
      alert(t('errors.fillAllFields'));
      return;
    }
    
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Get current user (if logged in)
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare booking data
      const pricePerPerson = getPrice() || 0;
      const basePrice = pricePerPerson * numberOfPeople;
      const totalPrice = parseFloat(getTotalPrice());
      
      const bookingData = {
        user_id: user?.id || null, // null if guest
        full_name: fullName,
        phone: phone,
        country_id: selectedCountryId,
        country_name: bookingDetails.countryName || '',
        location_id: selectedLocationId,
        location_name: bookingDetails.locationName || '',
        flight_type_id: selectedFlightTypeId,
        flight_type_name: bookingDetails.flightTypeName || '',
        selected_date: selectedDate,
        number_of_people: numberOfPeople,
        contact_method: contactMethod,
        promo_code: promoCode || null,
        promo_discount: promoDiscount,
        special_requests: specialRequests || null,
        base_price: basePrice,
        total_price: totalPrice,
        currency: selectedCurrency,
        status: 'pending'
      };

      // Call Edge Function to create booking (bypasses RLS for guests)
      console.log('Sending booking data:', bookingData);
      console.log('Price calculation:', {
        pricePerPerson,
        numberOfPeople,
        basePrice,
        promoDiscount,
        totalPrice,
        getTotalPriceResult: getTotalPrice()
      });
      
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: bookingData
      });

      console.log('Edge Function response:', { data, error });
      
      if (data && !data.success) {
        console.log('Full error response:', JSON.stringify(data, null, 2));
      }

      if (error) {
        console.error('Edge Function error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`${t('errors.bookingFailed')}: ${error?.message || t('errors.bookingFailed')}`);
        throw error;
      }

      if (!data?.success) {
        console.error('Booking failed:', data);
        alert(`${t('errors.bookingFailed')}: ${data?.error || t('errors.bookingFailed')}`);
        throw new Error(data?.error);
      }

      alert(t('success.bookingCreated'));
      
      // Reset form
      setFullName('');
      setPhone('');
      setSelectedDate('');
      setNumberOfPeople(1);
      setContactMethod('');
      setPromoCode('');
      setPromoDiscount(0);
      setSpecialRequests('');
      setSelectedCountryId('');
      setSelectedLocationId('');
      setSelectedFlightTypeId('');
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(t('errors.bookingFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrice = () => {
    if (selectedCurrency === 'GEL') return bookingDetails.priceGel;
    if (selectedCurrency === 'USD') return bookingDetails.priceUsd;
    return bookingDetails.priceEur;
  };

  const getCurrencySymbol = () => {
    if (selectedCurrency === 'GEL') return '₾';
    if (selectedCurrency === 'USD') return '$';
    return '€';
  };

  const getTotalPrice = () => {
    const basePrice = getPrice() || 0;
    const subtotal = basePrice * numberOfPeople;
    const discount = (subtotal * promoDiscount) / 100;
    return (subtotal - discount).toFixed(2);
  };

  const getSubtotal = () => {
    const basePrice = getPrice() || 0;
    return (basePrice * numberOfPeople).toFixed(2);
  };

  const getDiscount = () => {
    const basePrice = getPrice() || 0;
    const subtotal = basePrice * numberOfPeople;
    return ((subtotal * promoDiscount) / 100).toFixed(2);
  };

  const handlePromoCodeApply = async () => {
    const code = promoCode.trim().toUpperCase();
    
    if (!code) {
      setPromoError(t('errors.enterPromoCode'));
      return;
    }

    try {
      const supabase = createClient();
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPromoError(t('errors.promoRequiresAuth'));
        setPromoDiscount(0);
        
        // Show login/register prompt
        if (confirm(t('errors.promoAuthConfirm'))) {
          window.location.href = '/ka/login?redirect=/ka/bookings';
        }
        return;
      }
      
      // Fetch promo code from database
      const { data: promoData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !promoData) {
        setPromoError(t('errors.invalidPromo'));
        setPromoDiscount(0);
        return;
      }

      // Check if promo code is still valid
      const now = new Date();
      
      if (promoData.valid_from && new Date(promoData.valid_from) > now) {
        setPromoError(t('errors.promoNotActive'));
        setPromoDiscount(0);
        return;
      }

      if (promoData.valid_until && new Date(promoData.valid_until) < now) {
        setPromoError(t('errors.promoExpired'));
        setPromoDiscount(0);
        return;
      }

      // Check usage limit
      if (promoData.usage_limit && promoData.usage_count >= promoData.usage_limit) {
        setPromoError(t('errors.promoLimitReached'));
        setPromoDiscount(0);
        return;
      }

      // Valid promo code
      setPromoDiscount(promoData.discount_percentage);
      setPromoError('');

      // TODO: Increment usage count when booking is confirmed
      // This should be done on booking confirmation, not here
      
    } catch (err) {
      console.error('Error validating promo code:', err);
      setPromoError('დაფიქსირდა შეცდომა');
      setPromoDiscount(0);
    }
  };

  const handlePromoCodeRemove = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoError('');
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image for entire page */}
      <div className="fixed inset-0 z-0">
        <Image
          src={bookingDetails.heroImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop'}
          alt={bookingDetails.locationName || 'Mountain Landscape'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero Section - Compact */}
          <div className="relative z-10 pt-12 pb-4 text-center px-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
              {t('page.title')}
            </h1>
            {bookingDetails.locationName && bookingDetails.flightTypeName && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{bookingDetails.locationName}</span>
                </div>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{bookingDetails.flightTypeName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className={`mx-auto px-4 pb-8 relative z-10 transition-all duration-300 ${
            selectedCountryId && selectedLocationId && selectedFlightTypeId 
              ? 'max-w-[1280px]' 
              : 'max-w-2xl'
          }`}>
        <div className={`grid grid-cols-1 gap-4 transition-all duration-300 ${
          selectedCountryId && selectedLocationId && selectedFlightTypeId 
            ? 'lg:grid-cols-3' 
            : ''
        }`}>
          
          {/* Booking Form - Left Column */}
          <div className={selectedCountryId && selectedLocationId && selectedFlightTypeId ? 'lg:col-span-2' : ''}>
            <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
              
              <div className="p-4 space-y-3">
                
                {/* Country Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">
                    {t('form.selectCountry')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCountryId}
                    onChange={(e) => setSelectedCountryId(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all"
                  >
                    <option value="">{t('form.selectCountry')}</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {getLocalizedName(country)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">
                    {t('form.selectLocation')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    required
                    disabled={!selectedCountryId}
                    className="w-full h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{t('form.selectLocation')}</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {getLocalizedName(location)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flight Type Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">
                    {t('form.selectFlightType')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedFlightTypeId}
                    onChange={(e) => {
                      const newFlightTypeId = e.target.value;
                      if (process.env.NODE_ENV === 'development') {
                        console.log('✈️ Flight type changed to:', newFlightTypeId);
                      }
                      setSelectedFlightTypeId(newFlightTypeId);
                    }}
                    required
                    disabled={!selectedLocationId || flightTypes.length === 0}
                    className="w-full h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {flightTypes.length === 0 && selectedLocationId ? t('form.loading') : t('form.selectFlightType')}
                    </option>
                    {flightTypes.map((ft) => {
                      const sharedType = sharedFlightTypes.find(sft => sft.id === ft.shared_id);
                      if (!sharedType) {
                        console.warn('⚠️ Shared type not found for:', ft.shared_id);
                        return null;
                      }
                      return (
                        <option key={ft.shared_id} value={ft.shared_id}>
                          {ft.name} - {sharedType.price_gel}₾
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedFlightTypeId && (
                  <div className="border-t border-gray-200 dark:border-white/10 my-3" />
                )}

                {/* Name & Phone */}
                {selectedFlightTypeId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">{t('form.fullName')}</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all"
                      placeholder={t('form.fullNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">{t('form.phone')}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all"
                      placeholder={t('form.phonePlaceholder')}
                    />
                  </div>
                </div>
                )}

                {/* Date & People */}
                {selectedFlightTypeId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">{t('form.flightDate')}</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">{t('form.numberOfPeople')}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                        className="w-9 h-9 flex items-center justify-center bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all text-gray-700 dark:text-gray-300 font-semibold"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={numberOfPeople}
                        onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="flex-1 h-9 text-center px-2 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all text-gray-900 dark:text-white text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setNumberOfPeople(numberOfPeople + 1)}
                        className="w-9 h-9 flex items-center justify-center bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all text-gray-700 dark:text-gray-300 font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                )}

                {/* Contact Method Preference */}
                {selectedFlightTypeId && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1.5">{t('form.contactMethod')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setContactMethod('whatsapp')}
                      className={`h-9 flex items-center justify-center gap-1.5 rounded-lg border transition-all ${
                        contactMethod === 'whatsapp'
                          ? 'bg-green-500 border-green-500 text-white shadow-sm'
                          : 'bg-white dark:bg-black border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <span className="text-[10px] font-semibold">{t('form.whatsapp')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setContactMethod('telegram')}
                      className={`h-9 flex items-center justify-center gap-1.5 rounded-lg border transition-all ${
                        contactMethod === 'telegram'
                          ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                          : 'bg-white dark:bg-black border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <span className="text-[10px] font-semibold">{t('form.telegram')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setContactMethod('viber')}
                      className={`h-9 flex items-center justify-center gap-1.5 rounded-lg border transition-all ${
                        contactMethod === 'viber'
                          ? 'bg-purple-500 border-purple-500 text-white shadow-sm'
                          : 'bg-white dark:bg-black border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.398.002C9.473.028 5.331.344 2.823 2.908 1.089 4.658.197 7.03.056 9.735c-.14 2.706-.1 7.636 4.648 8.991h.003l-.002 2.622s-.033.85.526 1.022c.678.209 1.075-.44 1.722-1.14.356-.385.85-.95 1.223-1.382 3.367.288 5.953-.37 6.25-.476 .685-.247 4.564-.798 5.196-6.499.652-5.905-.334-9.629-2.866-11.277C14.972.441 13.269.027 11.398.002zm.067 1.697c1.586.019 2.998.364 4.461 1.619 2.176 1.873 2.605 5.017 2.07 9.35-.535 4.332-3.23 4.934-4.931 5.256-.414.079-2.846.677-5.804.203 0 0-2.293 2.76-3.009 3.475-.091.091-.204.128-.292.102-.13-.037-.166-.188-.165-.414l.01-4.264c-.015 0-.015 0 0 0-3.632-1.004-3.418-5.292-3.308-7.544.109-2.252.798-4.254 2.24-5.709C5.023 1.481 8.576 1.679 11.465 1.7z"/>
                      </svg>
                      <span className="text-[10px] font-semibold">{t('form.viber')}</span>
                    </button>
                  </div>
                </div>
                )}

                {/* Promo Code */}
                {selectedFlightTypeId && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">
                    {t('form.promoCode')}
                    <span className="ml-1.5 text-[9px] text-gray-500 dark:text-gray-600 font-normal">
                      ({t('errors.promoRequiresAuth')})
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      disabled={promoDiscount > 0}
                      className={`flex-1 h-9 px-3 bg-white dark:bg-black border rounded-lg text-xs text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all ${
                        promoDiscount > 0 
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                          : promoError 
                          ? 'border-red-500' 
                          : 'border-gray-300 dark:border-white/20'
                      }`}
                      placeholder={t('form.promoCodePlaceholder')}
                    />
                    {promoDiscount > 0 ? (
                      <button
                        type="button"
                        onClick={handlePromoCodeRemove}
                        className="h-9 px-3 bg-white dark:bg-black border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-[11px] font-medium"
                      >
                        {t('actions.cancel')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePromoCodeApply}
                        disabled={!promoCode.trim()}
                        className="h-9 px-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg transition-colors text-[11px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('form.applyPromo')}
                      </button>
                    )}
                  </div>
                  {promoError && (
                    <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">{promoError}</p>
                  )}
                  {promoDiscount > 0 && (
                    <p className="mt-1 text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('form.promoApplied', { discount: promoDiscount.toString() })}
                    </p>
                  )}
                </div>
                )}

                {/* Weather Notice */}
                {selectedFlightTypeId && (
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40 border-2 border-amber-400/50 dark:border-amber-600/50 rounded-xl p-3.5 shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-300/20 to-orange-400/20 dark:from-amber-600/10 dark:to-orange-700/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="relative flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center shadow-md">
                        <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                        <span>{t('form.weatherNoticeTitle')}</span>
                        <span className="inline-block w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
                      </h4>
                      <p className="text-[11px] leading-relaxed text-amber-950/90 dark:text-amber-100/90 font-medium">
                        {t('form.weatherNoticeText')}
                        <span className="inline-block mt-1 pt-1 border-t border-amber-400/30 dark:border-amber-600/30 w-full">
                          {t('form.weatherNoticeConfirm')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {/* Special Requests */}
                {selectedFlightTypeId && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-400 mb-1">{t('form.specialRequests')}</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all resize-none"
                    placeholder={t('form.specialRequestsPlaceholder')}
                  />
                </div>
                )}

              </div>
            </form>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            {selectedFlightTypeId && bookingDetails.flightTypeName && (
            <div className="sticky top-20">
              
              {/* Summary Card */}
              <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                
                <div className="p-4 space-y-3">
                  
                  {/* Location Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {bookingDetails.locationName}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                          {bookingDetails.countryName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {bookingDetails.flightTypeName}
                        </p>
                        {bookingDetails.duration && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-500">
                            {bookingDetails.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {bookingDetails.features && bookingDetails.features.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                      <ul className="space-y-1.5">
                        {bookingDetails.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[10px] text-gray-700 dark:text-gray-400">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Currency Selector */}
                  <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                    <div className="flex gap-1">
                      {(['GEL', 'USD', 'EUR'] as const).map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => setSelectedCurrency(currency)}
                          className={`flex-1 h-7 text-[10px] font-semibold rounded-md transition-all ${
                            selectedCurrency === currency
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                              : 'bg-white dark:bg-black border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-3 border-t border-gray-200 dark:border-white/10 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{t('pricing.basePrice')} × {numberOfPeople}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getCurrencySymbol()}{getSubtotal()}
                      </span>
                    </div>
                    
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600 dark:text-green-500">{t('pricing.discount')} ({promoDiscount}%)</span>
                        <span className="font-medium text-green-600 dark:text-green-500">
                          -{getCurrencySymbol()}{getDiscount()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-white/10">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('pricing.total')}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {getCurrencySymbol()}{getTotalPrice()}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full h-10 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98] text-white dark:text-black text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                          <span className="text-xs">{t('actions.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          {t('actions.confirmBooking')}
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>
            )}
          </div>

          </div>
        </div>
        </>
      )}
    </div>
  );
}
