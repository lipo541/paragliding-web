# 🎯 ჯავშნების სისტემის იმპლემენტაციის გეგმა

## პროექტის მიმოხილვა

**xparagliding** - პარაპლანინგის ჯავშნების პლატფორმა, რომელიც აერთიანებს:
- **პილოტებს** (სოლო და კომპანიის თანამშრომლებს)
- **კომპანიებს** (პილოტების გუნდები)
- **მომხმარებლებს** (ტურისტები და ადგილობრივები)

---

# 📋 სარჩევი

1. [ნაწილი 1: მონაცემთა ბაზის არქიტექტურა](#ნაწილი-1-მონაცემთა-ბაზის-არქიტექტურა)
2. [ნაწილი 2: TypeScript ტიპები და ვალიდაციები](#ნაწილი-2-typescript-ტიპები-და-ვალიდაციები)
3. [ნაწილი 3: Stripe ინტეგრაცია](#ნაწილი-3-stripe-ინტეგრაცია)
4. [ნაწილი 4: Smart Booking კომპონენტი](#ნაწილი-4-smart-booking-კომპონენტი)
5. [ნაწილი 5: პილოტების UI (ბარათები და გვერდები)](#ნაწილი-5-პილოტების-ui)
6. [ნაწილი 6: კომპანიების UI (ბარათები და გვერდები)](#ნაწილი-6-კომპანიების-ui)
7. [ნაწილი 7: Dashboard-ების განახლება](#ნაწილი-7-dashboard-ების-განახლება)
8. [ნაწილი 8: შეტყობინებები და ავტომატიზაცია](#ნაწილი-8-შეტყობინებები-და-ავტომატიზაცია)

---

# ნაწილი 1: მონაცემთა ბაზის არქიტექტურა

## 1.1 ფინანსური მოდელი

```
┌─────────────────────────────────────────────────────────────┐
│                    გადახდის ნაკადი                          │
├─────────────────────────────────────────────────────────────┤
│  კლიენტი → [50₾ დეპოზიტი] → xparagliding (თქვენ)           │
│                                                              │
│  კლიენტი → [დარჩენილი თანხა] → პილოტი/კომპანია (ადგილზე)   │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 ახალი SQL მიგრაცია (043_booking_system_upgrade.sql)

### ა) Booking Source Enum
```sql
-- ჯავშნის წყარო (საიდან მოვიდა კლიენტი)
CREATE TYPE booking_source_enum AS ENUM (
  'platform_general',  -- xparagliding.com მთავარი გვერდი (თქვენ ანაწილებთ)
  'company_direct',    -- კომპანიის გვერდიდან (კომპანია ანაწილებს)
  'pilot_direct'       -- პილოტის პროფილიდან (პირდაპირი)
);
```

### ბ) Bookings ცხრილის განახლება
```sql
ALTER TABLE bookings
  -- მიკუთვნება (Assignment)
  ADD COLUMN pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
  ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN assigned_by UUID REFERENCES auth.users(id),
  ADD COLUMN assigned_at TIMESTAMPTZ,
  
  -- წყარო (Source)
  ADD COLUMN booking_source booking_source_enum DEFAULT 'platform_general',
  
  -- ფინანსები (50₾ მოდელი)
  ADD COLUMN deposit_amount DECIMAL(10, 2) DEFAULT 50.00,
  ADD COLUMN amount_due DECIMAL(10, 2),  -- total_price - deposit_amount
  ADD COLUMN stripe_payment_intent_id TEXT,
  ADD COLUMN payment_status TEXT DEFAULT 'pending_deposit',
  
  -- გაუქმება
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN cancellation_reason TEXT,
  ADD COLUMN refund_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN refund_status TEXT DEFAULT 'none';
```

### გ) შეზღუდვები და ინდექსები
```sql
-- ჯავშანი მხოლოდ აწმყოსა და მომავალში
ALTER TABLE bookings
ADD CONSTRAINT check_future_date CHECK (selected_date >= CURRENT_DATE);

-- Payment Status ვალიდაცია
ALTER TABLE bookings
ADD CONSTRAINT check_payment_status CHECK (
  payment_status IN ('pending_deposit', 'deposit_paid', 'fully_paid', 'refunded', 'failed')
);

-- Refund Status ვალიდაცია
ALTER TABLE bookings
ADD CONSTRAINT check_refund_status CHECK (
  refund_status IN ('none', 'pending', 'processed', 'rejected')
);

-- ინდექსები
CREATE INDEX idx_bookings_pilot_id ON bookings(pilot_id);
CREATE INDEX idx_bookings_company_id ON bookings(company_id);
CREATE INDEX idx_bookings_booking_source ON bookings(booking_source);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
```

### დ) Stripe Account ID-ების დამატება
```sql
-- პილოტებისთვის (სამომავლო ავტომატური გადახდებისთვის)
ALTER TABLE pilots
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- კომპანიებისთვის
ALTER TABLE companies
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
```

### ე) Transactions ცხრილი (ისტორია)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- თანხა
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'GEL',
  
  -- ტიპი
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('deposit', 'refund', 'onsite_payment')
  ),
  
  -- Stripe
  stripe_payment_id TEXT,
  stripe_refund_id TEXT,
  
  -- სტატუსი
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'cancelled')
  ),
  
  -- მეტადატა
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ინდექსები
CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_transactions_stripe_payment_id ON transactions(stripe_payment_id);
```

### ვ) RLS პოლიტიკები
```sql
-- პილოტებს შეუძლიათ ნახონ თავიანთი ჯავშნები
CREATE POLICY "Pilots can view assigned bookings"
ON bookings FOR SELECT
USING (pilot_id IN (
  SELECT id FROM pilots WHERE user_id = auth.uid()
));

-- კომპანიებს შეუძლიათ ნახონ თავიანთი ჯავშნები
CREATE POLICY "Companies can view their bookings"
ON bookings FOR SELECT
USING (company_id IN (
  SELECT id FROM companies WHERE user_id = auth.uid()
));

-- კომპანიებს შეუძლიათ პილოტის მინიჭება
CREATE POLICY "Companies can assign pilots"
ON bookings FOR UPDATE
USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  AND pilot_id IS NULL
)
WITH CHECK (
  pilot_id IN (SELECT id FROM pilots WHERE company_id = bookings.company_id)
);
```

## 1.3 ფაილის მდებარეობა
```
supabase/migrations/043_booking_system_upgrade.sql
```

---

# ნაწილი 2: TypeScript ტიპები და ვალიდაციები

## 2.1 განახლებული Booking ტიპი

### ფაილი: `lib/types/booking.ts` (ახალი)
```typescript
export type BookingSource = 'platform_general' | 'company_direct' | 'pilot_direct';
export type PaymentStatus = 'pending_deposit' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'failed';
export type RefundStatus = 'none' | 'pending' | 'processed' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  user_id: string | null;
  
  // კლიენტის ინფო
  full_name: string;
  phone: string;
  
  // ლოკაცია
  country_id: string;
  country_name: string;
  location_id: string;
  location_name: string;
  
  // ფრენის დეტალები
  flight_type_id: string;
  flight_type_name: string;
  selected_date: string;
  number_of_people: number;
  
  // კონტაქტი
  contact_method: 'whatsapp' | 'telegram' | 'viber' | null;
  special_requests: string | null;
  
  // პრომო
  promo_code: string | null;
  promo_discount: number;
  
  // ფასები
  base_price: number;
  total_price: number;
  currency: string;
  
  // 50₾ მოდელი
  deposit_amount: number;
  amount_due: number;
  
  // მიკუთვნება
  pilot_id: string | null;
  company_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  booking_source: BookingSource;
  
  // გადახდა
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  
  // გაუქმება
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: number;
  refund_status: RefundStatus;
  
  // სტატუსი და დრო
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// ჯავშნის შექმნის ტიპი
export interface BookingCreate {
  full_name: string;
  phone: string;
  country_id: string;
  country_name: string;
  location_id: string;
  location_name: string;
  flight_type_id: string;
  flight_type_name: string;
  selected_date: string;
  number_of_people: number;
  contact_method?: 'whatsapp' | 'telegram' | 'viber';
  special_requests?: string;
  promo_code?: string;
  promo_discount?: number;
  base_price: number;
  total_price: number;
  currency?: string;
  
  // წყარო და მიკუთვნება
  booking_source: BookingSource;
  pilot_id?: string;
  company_id?: string;
}

// გაუქმების პოლიტიკა
export interface CancellationPolicy {
  canCancel: boolean;
  refundAmount: number;
  reason: string;
}

export function calculateCancellationPolicy(booking: Booking): CancellationPolicy {
  const flightDate = new Date(booking.selected_date);
  const now = new Date();
  const hoursUntilFlight = (flightDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilFlight > 24) {
    return {
      canCancel: true,
      refundAmount: booking.deposit_amount,
      reason: 'სრული თანხის დაბრუნება (24+ საათი ფრენამდე)'
    };
  } else if (hoursUntilFlight > 0) {
    return {
      canCancel: true,
      refundAmount: 0,
      reason: 'თანხა არ ბრუნდება (24 საათზე ნაკლები ფრენამდე)'
    };
  } else {
    return {
      canCancel: false,
      refundAmount: 0,
      reason: 'ჯავშნის გაუქმება შეუძლებელია (ფრენის დრო გავიდა)'
    };
  }
}
```

## 2.2 განახლებული ვალიდაცია

### ფაილი: `lib/validations/booking.ts` (განახლება)
```typescript
import { z } from 'zod';

export const bookingSchema = z.object({
  // ... არსებული ველები ...
  
  // ახალი ველები
  booking_source: z.enum(['platform_general', 'company_direct', 'pilot_direct']).default('platform_general'),
  pilot_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  
  // ფინანსური (50₾ მოდელი)
  deposit_amount: z.number().default(50),
  amount_due: z.number().min(0),
});

// თარიღის ვალიდაცია (წარსული თარიღები აკრძალულია)
export const futureDateSchema = z.string().refine((date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
}, 'თარიღი უნდა იყოს დღეს ან მომავალში');
```

## 2.3 ფაილების მდებარეობა
```
lib/types/booking.ts (ახალი)
lib/validations/booking.ts (განახლება)
```

---

# ნაწილი 3: Stripe ინტეგრაცია

## 3.1 გარემოს ცვლადები

### ფაილი: `.env.local` (დამატება)
```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform settings
PLATFORM_FEE_AMOUNT=50  # GEL
```

## 3.2 Stripe კონფიგურაცია

### ფაილი: `lib/stripe/config.ts` (ახალი)
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const PLATFORM_FEE = 50; // 50 GEL
export const CURRENCY = 'gel';

// Stripe-ში თანხა გადადის "cents"-ში (თეთრებში)
export const toStripeAmount = (amount: number): number => Math.round(amount * 100);
export const fromStripeAmount = (amount: number): number => amount / 100;
```

## 3.3 Checkout API Route

### ფაილი: `app/api/checkout/route.ts` (ახალი)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLATFORM_FEE, CURRENCY, toStripeAmount } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, successUrl, cancelUrl } = body;
    
    const supabase = await createClient();
    
    // ჯავშნის წამოღება
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Stripe Checkout Session შექმნა
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: `ფრენის ჯავშანი - ${booking.location_name}`,
              description: `${booking.flight_type_name} | ${booking.selected_date} | ${booking.number_of_people} ადამიანი`,
            },
            unit_amount: toStripeAmount(PLATFORM_FEE),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${cancelUrl}?booking_id=${bookingId}`,
      metadata: {
        booking_id: bookingId,
        deposit_amount: PLATFORM_FEE.toString(),
      },
    });
    
    // Payment Intent ID შენახვა
    await supabase
      .from('bookings')
      .update({ 
        stripe_payment_intent_id: session.payment_intent as string,
        payment_status: 'pending_deposit'
      })
      .eq('id', bookingId);
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
```

## 3.4 Webhook Handler

### ფაილი: `app/api/webhooks/stripe/route.ts` (ახალი)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  const supabase = await createClient();
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      
      if (bookingId) {
        // განვაახლოთ ჯავშანი
        await supabase
          .from('bookings')
          .update({
            payment_status: 'deposit_paid',
            status: 'confirmed',
          })
          .eq('id', bookingId);
        
        // ტრანზაქციის ჩაწერა
        await supabase.from('transactions').insert({
          booking_id: bookingId,
          amount: parseFloat(session.metadata?.deposit_amount || '50'),
          currency: 'GEL',
          transaction_type: 'deposit',
          stripe_payment_id: session.payment_intent as string,
          status: 'completed',
        });
        
        // TODO: შეტყობინების გაგზავნა პილოტს/კომპანიას
      }
      break;
    }
    
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      
      // ვპოულობთ ჯავშანს payment_intent-ით
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();
      
      if (booking) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'refunded',
            refund_status: 'processed',
            refund_amount: charge.amount_refunded / 100,
          })
          .eq('id', booking.id);
        
        // ტრანზაქციის ჩაწერა
        await supabase.from('transactions').insert({
          booking_id: booking.id,
          amount: charge.amount_refunded / 100,
          currency: 'GEL',
          transaction_type: 'refund',
          stripe_refund_id: charge.refunds?.data[0]?.id,
          status: 'completed',
        });
      }
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}
```

## 3.5 Refund API Route

### ფაილი: `app/api/refund/route.ts` (ახალი)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, toStripeAmount } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { calculateCancellationPolicy } from '@/lib/types/booking';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    const supabase = await createClient();
    
    // მომხმარებლის შემოწმება
    const { data: { user } } = await supabase.auth.getUser();
    
    // ჯავშნის წამოღება
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // ავტორიზაციის შემოწმება
    if (booking.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // გაუქმების პოლიტიკის შემოწმება
    const policy = calculateCancellationPolicy(booking);
    
    if (!policy.canCancel) {
      return NextResponse.json({ error: policy.reason }, { status: 400 });
    }
    
    // თუ დასაბრუნებელი თანხა არის
    if (policy.refundAmount > 0 && booking.stripe_payment_intent_id) {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: toStripeAmount(policy.refundAmount),
      });
    }
    
    // ჯავშნის განახლება
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        refund_amount: policy.refundAmount,
        refund_status: policy.refundAmount > 0 ? 'pending' : 'none',
      })
      .eq('id', bookingId);
    
    return NextResponse.json({ 
      success: true, 
      refundAmount: policy.refundAmount,
      message: policy.reason
    });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}
```

## 3.6 Client-side Stripe Hook

### ფაილი: `lib/hooks/useStripe.ts` (ახალი)
```typescript
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createCheckoutSession = async (bookingId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          successUrl: `${window.location.origin}/bookings/success`,
          cancelUrl: `${window.location.origin}/bookings/cancel`,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };
  
  return { createCheckoutSession, loading, error };
}
```

## 3.7 ფაილების მდებარეობა
```
lib/stripe/config.ts (ახალი)
app/api/checkout/route.ts (ახალი)
app/api/webhooks/stripe/route.ts (ახალი)
app/api/refund/route.ts (ახალი)
lib/hooks/useStripe.ts (ახალი)
```

## 3.8 Stripe-ის კონფიგურაცია (გარე)

### ნაბიჯები Stripe Dashboard-ში:
1. **Webhook შექმნა:**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `charge.refunded`

2. **API Keys:**
   - Publishable key → `.env.local`
   - Secret key → `.env.local`
   - Webhook secret → `.env.local`

---

# ნაწილი 4: Smart Booking კომპონენტი

## 4.1 Smart Booking Form

### ფაილი: `components/bookings/SmartBookingForm.tsx` (ახალი)

ეს კომპონენტი მუშაობს 3 რეჟიმში:
1. **General Mode** - მთავარი გვერდიდან (pilot_id და company_id არ არის)
2. **Pilot Direct** - პილოტის გვერდიდან (pilot_id გადაეცემა)
3. **Company Direct** - კომპანიის გვერდიდან (company_id გადაეცემა)

```typescript
interface SmartBookingFormProps {
  countryId: string;
  countryName: string;
  locationId: string;
  locationName: string;
  flightTypes: FlightType[];
  currency?: string;
  
  // რეჟიმის განსაზღვრა
  pilotId?: string;      // თუ გადაეცემა -> pilot_direct mode
  companyId?: string;    // თუ გადაეცემა -> company_direct mode
  pilotName?: string;    // პილოტის სახელი (UI-სთვის)
  companyName?: string;  // კომპანიის სახელი (UI-სთვის)
}
```

### ძირითადი ცვლილებები არსებულ BookingForm-თან შედარებით:
1. **ფასის ჩვენება:** "გადასახდელი ახლა: 50₾" + "გადასახდელი ადგილზე: X₾"
2. **Stripe გადახდა:** ფორმის წარდგენის შემდეგ გადადის Stripe Checkout-ზე
3. **booking_source:** ავტომატურად ივსება რეჟიმის მიხედვით

## 4.2 Price Breakdown კომპონენტი

### ფაილი: `components/bookings/PriceBreakdown.tsx` (ახალი)
```typescript
interface PriceBreakdownProps {
  basePrice: number;
  promoDiscount: number;
  totalPrice: number;
  depositAmount: number;
  currency: string;
}

// აჩვენებს:
// - სრული ფასი
// - ფასდაკლება (თუ არის)
// - გადასახდელი ონლაინ (50₾)
// - გადასახდელი ადგილზე
```

## 4.3 ფაილების მდებარეობა
```
components/bookings/SmartBookingForm.tsx (ახალი)
components/bookings/PriceBreakdown.tsx (ახალი)
components/bookings/BookingForm.tsx (legacy - შესანახი თავსებადობისთვის)
```

---

# ნაწილი 5: პილოტების UI

## 5.1 პილოტის ბარათი (კატალოგისთვის)

### ფაილი: `components/pilot/PilotCard.tsx` (ახალი)

```typescript
interface PilotCardProps {
  pilot: {
    id: string;
    first_name_ka: string;
    last_name_ka: string;
    avatar_url: string | null;
    tandem_flights: number | null;
    commercial_start_date: string | null;
    status: string;
    bio_ka: string | null;
    bio_en: string | null;
    // ... სხვა ენები
  };
  locale: string;
}
```

### დიზაინი (Glass Morphism):
```
┌─────────────────────────────────────┐
│  ┌──────┐                           │
│  │ FOTO │  სახელი გვარი             │
│  │      │  ⭐ 4.9 (120)              │
│  └──────┘  🛡️ Verified Pilot        │
│                                      │
│  📅 10+ წლის გამოცდილება            │
│  🪂 5000+ ტანდემ ფრენა              │
│  🌍 KA | EN | RU                     │
│                                      │
│  [ პროფილის ნახვა ]                 │
└─────────────────────────────────────┘
```

## 5.2 პილოტის გვერდი

### ფაილი: `app/[locale]/pilots/[slug]/page.tsx` (ახალი)

### სტრუქტურა:
1. **Hero Section:** დიდი ფოტო + ავატარი + სახელი
2. **Safety Section:** სერთიფიკატები, აღჭურვილობა
3. **About:** ბიოგრაფია
4. **Gallery:** ფოტო/ვიდეო
5. **Reviews:** შეფასებები
6. **Booking Widget:** კალენდარი + ფასი + ღილაკი

### Booking Widget (Sticky):
```
┌─────────────────────────────┐
│  📅 აირჩიე თარიღი           │
│  [კალენდარი]                │
│                             │
│  გადასახდელი ახლა: 50₾     │
│  გადასახდელი ადგილზე: 250₾ │
│                             │
│  [   დაჯავშნე პილოტთან   ] │
└─────────────────────────────┘
```

## 5.3 პილოტების კატალოგის გვერდი

### ფაილი: `app/[locale]/pilots/page.tsx` (ახალი)

- ფილტრები: ლოკაცია, ენა, რეიტინგი
- პილოტების grid (PilotCard კომპონენტებით)
- **მხოლოდ კომპანიის პილოტები** ჩანს (სოლო პილოტები არ ჩანს კატალოგში)

## 5.4 ფაილების მდებარეობა
```
components/pilot/PilotCard.tsx (ახალი)
components/pilot/PilotHero.tsx (ახალი)
components/pilot/PilotSafety.tsx (ახალი)
components/pilot/PilotGallery.tsx (ახალი)
components/pilot/PilotBookingWidget.tsx (ახალი)
app/[locale]/pilots/page.tsx (ახალი)
app/[locale]/pilots/[slug]/page.tsx (ახალი)
```

---

# ნაწილი 6: კომპანიების UI

## 6.1 კომპანიის ბარათი

### ფაილი: `components/company/CompanyCard.tsx` (ახალი)

```typescript
interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    description_ka: string | null;
    description_en: string | null;
    // ...
  };
  pilotsCount: number;
  locale: string;
}
```

### დიზაინი:
```
┌─────────────────────────────────────┐
│  ┌──────┐                           │
│  │ LOGO │  კომპანიის სახელი         │
│  │      │  📍 გუდაური, ყაზბეგი       │
│  └──────┘  ⭐ 4.8 (250)              │
│                                      │
│  👥 გუნდში 5 პილოტია                │
│  [ავატარი][ავატარი][ავატარი]...     │
│                                      │
│  [ კომპანიის ნახვა ]                │
└─────────────────────────────────────┘
```

## 6.2 კომპანიის გვერდი

### ფაილი: `app/[locale]/companies/[slug]/page.tsx` (ახალი)

### სტრუქტურა:
1. **Hero:** ლოგო + სახელი + ლოკაცია
2. **About:** აღწერა
3. **Our Pilots:** პილოტების ბარათები
4. **Reviews:** შეფასებები
5. **Booking Widget:** კალენდარი + ღილაკი

## 6.3 კომპანიების კატალოგის გვერდი

### ფაილი: `app/[locale]/companies/page.tsx` (ახალი)

## 6.4 ფაილების მდებარეობა
```
components/company/CompanyCard.tsx (ახალი)
components/company/CompanyHero.tsx (ახალი)
components/company/CompanyPilotsList.tsx (ახალი)
components/company/CompanyBookingWidget.tsx (ახალი)
app/[locale]/companies/page.tsx (ახალი)
app/[locale]/companies/[slug]/page.tsx (ახალი)
```

---

# ნაწილი 7: Dashboard-ების განახლება

## 7.1 Super Admin Dashboard

### განახლებები:
1. **ახალი ჯავშნების რიგი:** `booking_source = 'platform_general'` ჯავშნები
2. **პილოტის/კომპანიის მინიჭების UI**
3. **ფინანსური რეპორტი:** დეპოზიტების ჯამი

### ფაილი: `components/superadmindashboard/BookingAssignment.tsx` (ახალი)

## 7.2 Company Dashboard განახლება

### განახლებები:
1. **შემომავალი ჯავშნები:** `company_id = [ამ კომპანია]` და `pilot_id IS NULL`
2. **პილოტის მინიჭების dropdown**
3. **პილოტების დატვირთვის კალენდარი**

### ფაილი: `components/companybottomnav/CompanyBookings.tsx` (განახლება)

## 7.3 Pilot Dashboard განახლება

### განახლებები:
1. **ჩემი ჯავშნები:** `pilot_id = [ამ პილოტი]`
2. **ჯავშნის დეტალები:** კლიენტის ინფო + "ადგილზე ასაღები თანხა"
3. **კალენდარის ხედი**

### ფაილი: `components/pilotbottomnav/PilotBookings.tsx` (განახლება)

## 7.4 User Dashboard

### განახლებები:
1. **ჩემი ჯავშნები:** გადახდის სტატუსით
2. **გაუქმების ღილაკი:** 24+ საათის შემთხვევაში
3. **გადახდის ისტორია**

---

# ნაწილი 8: შეტყობინებები და ავტომატიზაცია

## 8.1 Email შეტყობინებები

### Supabase Edge Functions:
1. **ახალი ჯავშნის შეტყობინება:** პილოტს/კომპანიას
2. **გადახდის დადასტურება:** კლიენტს
3. **შეხსენება:** 1 დღით ადრე

### ფაილი: `supabase/functions/send-booking-notification/index.ts`

## 8.2 Database Triggers

```sql
-- ჯავშნის შექმნისას
CREATE OR REPLACE FUNCTION notify_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Edge Function-ის გამოძახება
  PERFORM net.http_post(
    'https://your-project.supabase.co/functions/v1/send-booking-notification',
    jsonb_build_object('booking_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_created_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_on_booking();
```

---

# 📅 იმპლემენტაციის კალენდარი

## ფაზა 1: Backend Foundation (1-2 დღე)
- [ ] SQL მიგრაცია (043_booking_system_upgrade.sql)
- [ ] TypeScript ტიპები (lib/types/booking.ts)
- [ ] ვალიდაციის განახლება

## ფაზა 2: Stripe Integration (2-3 დღე)
- [ ] Stripe კონფიგურაცია
- [ ] Checkout API
- [ ] Webhook Handler
- [ ] Refund API

## ფაზა 3: Smart Booking (2-3 დღე)
- [ ] SmartBookingForm კომპონენტი
- [ ] PriceBreakdown კომპონენტი
- [ ] Success/Cancel გვერდები

## ფაზა 4: Pilots UI (3-4 დღე)
- [ ] PilotCard კომპონენტი
- [ ] პილოტის გვერდი
- [ ] პილოტების კატალოგი

## ფაზა 5: Companies UI (2-3 დღე)
- [ ] CompanyCard კომპონენტი
- [ ] კომპანიის გვერდი
- [ ] კომპანიების კატალოგი

## ფაზა 6: Dashboards (3-4 დღე)
- [ ] Super Admin ჯავშნების მართვა
- [ ] Company Dashboard განახლება
- [ ] Pilot Dashboard განახლება

## ფაზა 7: Testing & Polish (2-3 დღე)
- [ ] E2E ტესტები
- [ ] Bug fixes
- [ ] Performance optimization

---

# 🔧 დამატებითი რესურსები

## საჭირო პაკეტები:
```bash
npm install stripe @stripe/stripe-js
```

## Stripe Dashboard Setup:
1. შექმენით ანგარიში: https://stripe.com
2. გაააქტიურეთ GEL ვალუტა
3. დააკოპირეთ API Keys
4. შექმენით Webhook Endpoint

---

**შენიშვნა:** ეს გეგმა არის სრული და მოიცავს ყველა ნაბიჯს. იმპლემენტაცია უნდა მოხდეს ფაზების მიხედვით, თანმიმდევრულად.
