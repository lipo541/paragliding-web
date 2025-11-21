import { z } from 'zod';

export const bookingSchema = z.object({
  // User info (optional for guest bookings)
  user_id: z.string().uuid().nullable().optional(),

  // Customer details
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().min(9, 'Phone number is required').max(20),

  // Booking details
  country_id: z.string().uuid('Invalid country'),
  country_name: z.string().min(1, 'Country name is required'),
  location_id: z.string().uuid('Invalid location'),
  location_name: z.string().min(1, 'Location name is required'),
  flight_type_id: z.string().min(1, 'Flight type is required'),
  flight_type_name: z.string().min(1, 'Flight type name is required'),

  // Date and people
  selected_date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, 'Date must be today or in the future'),
  number_of_people: z.number().int().min(1, 'At least 1 person required').max(20, 'Maximum 20 people per booking'),

  // Contact preferences
  contact_method: z.enum(['whatsapp', 'telegram', 'viber']).optional().nullable(),

  // Promo code
  promo_code: z.string().max(50).optional().nullable(),
  promo_discount: z.number().int().min(0).max(100).default(0),

  // Special requests
  special_requests: z.string().max(500).optional().nullable(),

  // Pricing
  base_price: z.number().positive('Base price must be positive'),
  total_price: z.number().positive('Total price must be positive'),
  currency: z.string().length(3).default('GEL'),

  // Status
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

export const promoCodeValidationSchema = z.object({
  code: z.string()
    .min(3, 'Promo code must be at least 3 characters')
    .max(50, 'Promo code is too long')
    .regex(/^[A-Z0-9]+$/, 'Promo code must contain only uppercase letters and numbers'),
  people_count: z.number().int().min(1).max(20),
  location_id: z.string().uuid(),
});

export type PromoCodeValidation = z.infer<typeof promoCodeValidationSchema>;
