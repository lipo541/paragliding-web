'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingFormData } from '@/lib/validations/booking';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface BookingFormProps {
  countryId: string;
  countryName: string;
  locationId: string;
  locationName: string;
  flightTypes: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  currency?: string;
}

interface PromoValidationResult {
  is_valid: boolean;
  promo_code_id: string | null;
  discount_percentage: number;
  error_message: string | null;
}

export default function BookingForm({
  countryId,
  countryName,
  locationId,
  locationName,
  flightTypes,
  currency = 'GEL',
}: BookingFormProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoData, setPromoData] = useState<{
    isValid: boolean;
    promoCodeId: string | null;
    discount: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      country_id: countryId,
      country_name: countryName,
      location_id: locationId,
      location_name: locationName,
      number_of_people: 1,
      currency,
      status: 'pending' as const,
      promo_discount: 0,
    },
  });

  const selectedFlightTypeId = watch('flight_type_id');
  const numberOfPeople = watch('number_of_people');
  const promoCode = watch('promo_code');

  // Calculate prices
  const selectedFlightType = flightTypes.find((ft) => ft.id === selectedFlightTypeId);
  const basePrice = selectedFlightType ? selectedFlightType.price * numberOfPeople : 0;
  const discountAmount = promoData?.isValid ? (basePrice * promoData.discount) / 100 : 0;
  const totalPrice = basePrice - discountAmount;

  // Validate promo code
  const handleValidatePromo = async () => {
    if (!promoCode || promoCode.trim() === '') {
      setPromoData(null);
      setValue('promo_discount', 0);
      return;
    }

    setIsValidatingPromo(true);
    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        promo_code_text: promoCode.toUpperCase(),
        people_count: numberOfPeople,
        location_id_param: locationId,
      });

      if (error) throw error;

      const result = data[0] as PromoValidationResult;

      if (result.is_valid) {
        setPromoData({
          isValid: true,
          promoCodeId: result.promo_code_id,
          discount: result.discount_percentage,
        });
        setValue('promo_discount', result.discount_percentage);
        toast.success(`Promo code applied! ${result.discount_percentage}% discount`);
      } else {
        setPromoData(null);
        setValue('promo_discount', 0);
        toast.error(result.error_message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      toast.error('Failed to validate promo code');
      setPromoData(null);
      setValue('promo_discount', 0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Submit booking
  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      // Get current user (if authenticated)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Recalculate to ensure accuracy
      const finalBasePrice = selectedFlightType ? selectedFlightType.price * numberOfPeople : 0;
      const finalDiscountAmount = promoData?.isValid ? (finalBasePrice * promoData.discount) / 100 : 0;
      const finalTotalPrice = finalBasePrice - finalDiscountAmount;

      // Set user_id if authenticated
      const bookingData = {
        ...data,
        user_id: user?.id || null,
        base_price: finalBasePrice,
        total_price: finalTotalPrice,
        promo_code: promoCode?.toUpperCase() || null,
        promo_discount: promoData?.discount || 0,
      };

      // Insert booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // If promo code was used
      if (promoData?.isValid && promoData.promoCodeId && booking) {
        // Increment promo usage count
        const { error: incrementError } = await supabase.rpc('increment_promo_usage', {
          promo_code_text: promoCode!.toUpperCase(),
          people_count: numberOfPeople,
        });

        if (incrementError) {
          console.error('Failed to increment promo usage:', incrementError);
        }

        // Log promo code usage
        const { error: usageError } = await supabase.from('promo_code_usage').insert({
          user_id: user?.id || null,
          booking_id: booking.id,
          promo_code_id: promoData.promoCodeId,
          people_count: numberOfPeople,
          discount_amount: finalDiscountAmount,
        });

        if (usageError) {
          console.error('Failed to log promo usage:', usageError);
        }
      }

      toast.success('Booking created successfully!');
      
      // Redirect or reset form
      window.location.href = user ? `/${user.user_metadata?.locale || 'en'}/bookings` : '/';
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-2xl font-bold">Book Your Flight</h2>

        {/* Full Name */}
        <Input
          label="Full Name"
          error={errors.full_name?.message}
          {...register('full_name')}
          placeholder="Enter your full name"
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          type="tel"
          error={errors.phone?.message}
          {...register('phone')}
          placeholder="+995 XXX XXX XXX"
        />

        {/* Flight Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Flight Type</label>
          <select
            {...register('flight_type_id', {
              onChange: (e) => {
                const selected = flightTypes.find((ft) => ft.id === e.target.value);
                if (selected) {
                  setValue('flight_type_name', selected.name);
                }
              },
            })}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none"
          >
            <option value="">Select flight type</option>
            {flightTypes.map((ft) => (
              <option key={ft.id} value={ft.id}>
                {ft.name} - {ft.price} {currency}
              </option>
            ))}
          </select>
          {errors.flight_type_id && (
            <p className="text-red-500 text-sm mt-1">{errors.flight_type_id.message}</p>
          )}
        </div>

        {/* Date */}
        <Input
          label="Flight Date"
          type="date"
          error={errors.selected_date?.message}
          {...register('selected_date')}
        />

        {/* Number of People */}
        <Input
          label="Number of People"
          type="number"
          min={1}
          max={20}
          error={errors.number_of_people?.message}
          {...register('number_of_people', { valueAsNumber: true })}
        />

        {/* Contact Method */}
        <div>
          <label className="block text-sm font-medium mb-2">Preferred Contact Method</label>
          <select
            {...register('contact_method')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none"
          >
            <option value="">Select contact method</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="viber">Viber</option>
          </select>
        </div>

        {/* Promo Code */}
        <div>
          <label className="block text-sm font-medium mb-2">Promo Code (Optional)</label>
          <div className="flex gap-2">
            <Input
              {...register('promo_code', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue('promo_code', e.target.value.toUpperCase());
                  setPromoData(null);
                },
              })}
              placeholder="Enter promo code"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleValidatePromo}
              disabled={!promoCode || isValidatingPromo}
              variant="secondary"
            >
              {isValidatingPromo ? <Spinner size="sm" /> : 'Apply'}
            </Button>
          </div>
          {promoData?.isValid && (
            <p className="text-green-500 text-sm mt-1">
              ✓ {promoData.discount}% discount applied!
            </p>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium mb-2">Special Requests (Optional)</label>
          <textarea
            {...register('special_requests')}
            rows={3}
            maxLength={500}
            placeholder="Any special requirements or requests?"
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none resize-none"
          />
        </div>

        {/* Price Summary */}
        {selectedFlightType && (
          <div className="glass-card p-4 space-y-2 bg-white/5">
            <h3 className="font-semibold text-lg">Price Summary</h3>
            <div className="flex justify-between text-sm">
              <span>Base Price ({numberOfPeople} × {selectedFlightType.price} {currency})</span>
              <span>{basePrice.toFixed(2)} {currency}</span>
            </div>
            {promoData?.isValid && (
              <div className="flex justify-between text-sm text-green-500">
                <span>Discount ({promoData.discount}%)</span>
                <span>-{discountAmount.toFixed(2)} {currency}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2">
              <span>Total</span>
              <span>{totalPrice.toFixed(2)} {currency}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting || !selectedFlightType} className="w-full">
          {isSubmitting ? <Spinner /> : 'Confirm Booking'}
        </Button>
      </div>
    </form>
  );
}
