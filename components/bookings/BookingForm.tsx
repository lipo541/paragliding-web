'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingFormData } from '@/lib/validations/booking';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
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
  const { t } = useTranslation('bookings');
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
        toast.success(t('form.promoApplied', { discount: result.discount_percentage.toString() }));
      } else {
        setPromoData(null);
        setValue('promo_discount', 0);
        toast.error(result.error_message || t('errors.invalidPromo'));
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      toast.error(t('errors.promoValidationFailed'));
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
      
      // Calculate deposit: 50₾ per person
      const depositAmount = 50 * numberOfPeople;
      // Amount due to pilot/company = total_price - deposit
      const amountDue = finalTotalPrice - depositAmount;

      // Set user_id if authenticated
      const bookingData = {
        ...data,
        user_id: user?.id || null,
        base_price: finalBasePrice,
        total_price: finalTotalPrice,
        promo_code: promoCode?.toUpperCase() || null,
        promo_discount: promoData?.discount || 0,
        deposit_amount: depositAmount,
        amount_due: amountDue,
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

      toast.success(t('success.bookingCreated'));
      
      // Redirect or reset form
      window.location.href = user ? `/${user.user_metadata?.locale || 'en'}/bookings` : '/';
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(t('errors.bookingFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-2xl font-bold">{t('page.title')}</h2>

        {/* Full Name */}
        <Input
          label={t('form.fullName')}
          error={errors.full_name?.message}
          {...register('full_name')}
          placeholder={t('form.fullNamePlaceholder')}
        />

        {/* Phone */}
        <Input
          label={t('form.phone')}
          type="tel"
          error={errors.phone?.message}
          {...register('phone')}
          placeholder={t('form.phonePlaceholder')}
        />

        {/* Flight Type */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('summary.flightType')}</label>
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
            <option value="">{t('form.selectFlightType')}</option>
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
          label={t('form.flightDate')}
          type="date"
          error={errors.selected_date?.message}
          {...register('selected_date')}
        />

        {/* Number of People */}
        <Input
          label={t('form.numberOfPeople')}
          type="number"
          min={1}
          max={20}
          error={errors.number_of_people?.message}
          {...register('number_of_people', { valueAsNumber: true })}
        />

        {/* Contact Method */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('form.contactMethod')}</label>
          <select
            {...register('contact_method')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none"
          >
            <option value="">{t('form.selectContactMethod')}</option>
            <option value="whatsapp">{t('form.whatsapp')}</option>
            <option value="telegram">{t('form.telegram')}</option>
            <option value="viber">{t('form.viber')}</option>
          </select>
        </div>

        {/* Promo Code */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('form.promoCode')}</label>
          <div className="flex gap-2">
            <Input
              {...register('promo_code', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue('promo_code', e.target.value.toUpperCase());
                  setPromoData(null);
                },
              })}
              placeholder={t('form.promoCodePlaceholder')}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleValidatePromo}
              disabled={!promoCode || isValidatingPromo}
              variant="secondary"
            >
              {isValidatingPromo ? <Spinner size="sm" /> : t('form.applyPromo')}
            </Button>
          </div>
          {promoData?.isValid && (
            <p className="text-green-500 text-sm mt-1">
              {t('form.promoApplied', { discount: promoData.discount.toString() })}
            </p>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('form.specialRequests')}</label>
          <textarea
            {...register('special_requests')}
            rows={3}
            maxLength={500}
            placeholder={t('form.specialRequestsPlaceholder')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none resize-none"
          />
        </div>

        {/* Price Summary */}
        {selectedFlightType && (
          <div className="glass-card p-4 space-y-2 bg-white/5">
            <h3 className="font-semibold text-lg">{t('pricing.priceSummary')}</h3>
            <div className="flex justify-between text-sm">
              <span>{t('pricing.basePrice')} ({numberOfPeople} × {selectedFlightType.price} {currency})</span>
              <span>{basePrice.toFixed(2)} {currency}</span>
            </div>
            {promoData?.isValid && (
              <div className="flex justify-between text-sm text-green-500">
                <span>{t('pricing.discount')} ({promoData.discount}%)</span>
                <span>-{discountAmount.toFixed(2)} {currency}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2">
              <span>{t('pricing.total')}</span>
              <span>{totalPrice.toFixed(2)} {currency}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting || !selectedFlightType} className="w-full">
          {isSubmitting ? <Spinner /> : t('actions.confirmBooking')}
        </Button>
      </div>
    </form>
  );
}
