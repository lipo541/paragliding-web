// =====================================================
// Booking Types
// =====================================================
// TypeScript types for booking and payment system
// =====================================================

import { Pilot } from './pilot';
import { Company } from './company';

// =====================================================
// Enums (aligned with database)
// =====================================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'on_hold' | 'no_show' | 'rescheduled';

export type BookingSource = 
  | 'platform_general'  // ჯავშანი xparagliding.com-დან (პლატფორმა ანაწილებს)
  | 'company_direct'    // ჯავშანი კომპანიის გვერდიდან (კომპანია ანაწილებს)
  | 'pilot_direct';     // ჯავშანი პილოტის პროფილიდან (პირდაპირი)

export type PaymentStatus = 
  | 'pending_deposit'   // დეპოზიტი არ არის გადახდილი
  | 'deposit_paid'      // 50₾ გადახდილია
  | 'fully_paid'        // სრულად გადახდილი (ადგილზე)
  | 'refunded'          // დაბრუნებულია
  | 'failed';           // გადახდა ჩაიშალა

export type RefundStatus = 
  | 'none'              // დაბრუნება არ მოხდა
  | 'pending'           // დაბრუნება პროცესშია
  | 'processed'         // დაბრუნებულია
  | 'rejected'          // უარყოფილია
  | 'partial';          // ნაწილობრივ დაბრუნებული

export type NoShowAction = 'refund' | 'keep_deposit' | 'reschedule';

export type BookingPriority = 'low' | 'normal' | 'high' | 'urgent';

export type BookingNoteType = 'info' | 'warning' | 'action' | 'customer_contact' | 'system';

export type BookingHistoryAction = 
  | 'status_change' 
  | 'reschedule' 
  | 'pilot_change' 
  | 'company_change' 
  | 'refund'
  | 'note_added'
  | 'update';

export type TransactionType = 'deposit' | 'refund' | 'onsite_payment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type ContactMethod = 'whatsapp' | 'telegram' | 'viber';

// =====================================================
// Core Booking Interface
// =====================================================

export interface Booking {
  id: string;
  
  // User (nullable for guest bookings)
  user_id: string | null;
  
  // Customer details
  full_name: string;
  phone: string;
  
  // Location details
  country_id: string;
  country_name: string;
  location_id: string;
  location_name: string;
  
  // Flight details
  flight_type_id: string;
  flight_type_name: string;
  selected_date: string;
  number_of_people: number;
  
  // Contact preferences
  contact_method: ContactMethod | null;
  
  // Promo
  promo_code: string | null;
  promo_discount: number;
  
  // Special requests
  special_requests: string | null;
  
  // Pricing (original)
  base_price: number;
  total_price: number;
  currency: string;
  
  // Status
  status: BookingStatus;
  
  // =====================================================
  // NEW: Assignment (ვის ეკუთვნის ჯავშანი)
  // =====================================================
  pilot_id: string | null;
  company_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  
  // =====================================================
  // NEW: Booking source
  // =====================================================
  booking_source: BookingSource;
  
  // =====================================================
  // NEW: Payment (50₾ დეპოზიტის მოდელი)
  // =====================================================
  deposit_amount: number;        // Default: 50.00
  amount_due: number;            // total_price - deposit_amount
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  
  // =====================================================
  // NEW: Cancellation
  // =====================================================
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: number;
  refund_status: RefundStatus;
  
  // =====================================================
  // NEW: SuperAdmin Management Fields
  // =====================================================
  // Reschedule
  original_date: string | null;
  reschedule_count: number;
  last_rescheduled_at: string | null;
  reschedule_reason: string | null;
  
  // Refund (extended)
  refunded_at: string | null;
  refunded_by: string | null;
  
  // No-Show
  no_show_at: string | null;
  no_show_action: NoShowAction | null;
  
  // On Hold
  on_hold_reason: string | null;
  on_hold_until: string | null;
  
  // Internal Management
  internal_notes: string | null;
  priority: BookingPriority;
  tags: string[] | null;
  
  // =====================================================
  // NEW: Seen tracking (for new booking indicators)
  // =====================================================
  seen_by_pilot: boolean;
  seen_by_company: boolean;
  seen_by_admin: boolean;
  seen_by_pilot_at: string | null;
  seen_by_company_at: string | null;
  seen_by_admin_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// Booking with Relations
// =====================================================

export interface BookingWithRelations extends Booking {
  pilot?: Pick<Pilot, 'id' | 'first_name_ka' | 'first_name_en' | 'last_name_ka' | 'last_name_en' | 'phone' | 'avatar_url'> | null;
  company?: Pick<Company, 'id' | 'name_ka' | 'name_en' | 'phone' | 'logo_url'> | null;
  transactions?: Transaction[];
}

// =====================================================
// Booking Insert (for creating new bookings)
// =====================================================

export interface BookingInsert {
  // Required fields
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
  base_price: number;
  total_price: number;
  
  // Optional fields
  user_id?: string | null;
  contact_method?: ContactMethod | null;
  promo_code?: string | null;
  promo_discount?: number;
  special_requests?: string | null;
  currency?: string;
  status?: BookingStatus;
  
  // Assignment (optional - can be set later)
  pilot_id?: string | null;
  company_id?: string | null;
  booking_source?: BookingSource;
}

// =====================================================
// Booking Update
// =====================================================

export interface BookingUpdate {
  // Status updates
  status?: BookingStatus;
  
  // Assignment updates
  pilot_id?: string | null;
  company_id?: string | null;
  assigned_by?: string | null;
  assigned_at?: string | null;
  
  // Payment updates
  payment_status?: PaymentStatus;
  stripe_payment_intent_id?: string | null;
  
  // Cancellation
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  refund_amount?: number;
  refund_status?: RefundStatus;
  
  // Other updates
  special_requests?: string | null;
}

// =====================================================
// Transaction Interface
// =====================================================

export interface Transaction {
  id: string;
  booking_id: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Type
  transaction_type: TransactionType;
  
  // Stripe references
  stripe_payment_id: string | null;
  stripe_refund_id: string | null;
  
  // Status
  status: TransactionStatus;
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Notes
  notes: string | null;
  
  // Timestamp
  created_at: string;
}

export interface TransactionInsert {
  booking_id: string;
  amount: number;
  transaction_type: TransactionType;
  
  // Optional
  currency?: string;
  stripe_payment_id?: string | null;
  stripe_refund_id?: string | null;
  status?: TransactionStatus;
  metadata?: Record<string, unknown>;
  notes?: string | null;
}

// =====================================================
// Helper Types
// =====================================================

// For cancellation check response
export interface CancellationCheck {
  can_cancel: boolean;
  refund_amount: number;
  reason: string;
}

// For payment intent creation
export interface CreatePaymentIntentRequest {
  booking_id: string;
  amount?: number; // defaults to deposit_amount (50)
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

// For booking assignment
export interface AssignBookingRequest {
  booking_id: string;
  pilot_id?: string | null;
  company_id?: string | null;
}

// Booking summary for dashboards
export interface BookingSummary {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  pending_deposits: number;
}

// =====================================================
// Constants
// =====================================================

export const PLATFORM_FEE_PER_PERSON = 50; // 50₾ per person deposit
export const PLATFORM_FEE = 50; // Legacy: 50₾ (use PLATFORM_FEE_PER_PERSON * number_of_people)
export const DEFAULT_CURRENCY = 'GEL';

// Cancellation policy: 24 hours before flight for full refund
export const CANCELLATION_HOURS = 24;

// Max reschedule count
export const MAX_RESCHEDULE_COUNT = 2;

// Helper function to calculate deposit
export const calculateDeposit = (numberOfPeople: number): number => {
  return PLATFORM_FEE_PER_PERSON * numberOfPeople;
};

// Helper function to calculate amount due to pilot/company
export const calculateAmountDue = (totalPrice: number, numberOfPeople: number): number => {
  const deposit = calculateDeposit(numberOfPeople);
  return Math.max(0, totalPrice - deposit);
};

// =====================================================
// Booking Note Interface
// =====================================================

export interface BookingNote {
  id: string;
  booking_id: string;
  author_id: string | null;
  author_name: string | null;
  note: string;
  note_type: BookingNoteType;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingNoteInsert {
  booking_id: string;
  author_id?: string | null;
  author_name?: string | null;
  note: string;
  note_type?: BookingNoteType;
  is_pinned?: boolean;
}

// =====================================================
// Booking History Interface (Audit Log)
// =====================================================

export interface BookingHistory {
  id: string;
  booking_id: string;
  action: BookingHistoryAction;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  changed_by: string | null;
  changed_by_role: string | null;
  changed_by_name: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// =====================================================
// SuperAdmin Booking Types
// =====================================================

export interface RescheduleReasons {
  ka: string;
  en: string;
  ru: string;
  de: string;
  tr: string;
  ar: string;
}

export interface RescheduleData {
  booking_id: string;
  new_date: string;
  reason: string;
  reasons?: RescheduleReasons; // Multi-language reasons for notifications
  notify_customer: boolean;
  notify_pilot: boolean;
  initiated_by: 'customer' | 'pilot' | 'company' | 'admin' | 'weather';
  // Booking info for notifications
  booking_info?: {
    location_name: string;
    old_date: string;
    customer_name: string;
    pilot_id?: string | null;
    company_id?: string | null;
  };
}

export interface ReassignData {
  booking_id: string;
  new_pilot_id?: string | null;
  new_company_id?: string | null;
  reason: string;
  notify_old_assignee: boolean;
  notify_new_assignee: boolean;
  notify_customer: boolean;
}

export interface RefundData {
  booking_id: string;
  refund_type: 'full' | 'partial';
  refund_amount: number;
  reason: string;
  process_stripe_refund: boolean;
}

// Extended booking summary for SuperAdmin dashboard
export interface SuperAdminBookingSummary extends BookingSummary {
  on_hold_bookings: number;
  no_show_bookings: number;
  rescheduled_bookings: number;
  total_refunded: number;
  today_bookings: number;
  this_week_bookings: number;
}
