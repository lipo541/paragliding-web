// =====================================================
// Booking Hooks
// =====================================================
// React hooks for booking operations with Supabase
// =====================================================

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { 
  Booking, 
  BookingWithRelations,
  BookingInsert, 
  BookingUpdate,
  CancellationCheck,
  BookingSummary
} from '@/lib/types/booking';

// =====================================================
// useBookings - Fetch bookings with filters
// =====================================================

interface UseBookingsOptions {
  userId?: string;
  pilotId?: string;
  companyId?: string;
  status?: Booking['status'];
  limit?: number;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          pilot:pilots(id, first_name, last_name, phone, avatar_url),
          company:companies(id, name, phone, logo_url)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options.pilotId) {
        query = query.eq('pilot_id', options.pilotId);
      }
      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      
      setBookings(data as BookingWithRelations[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [options.userId, options.pilotId, options.companyId, options.status, options.limit]);

  return { bookings, loading, error, refetch: fetchBookings };
}

// =====================================================
// useBooking - Fetch single booking by ID
// =====================================================

export function useBooking(bookingId: string | null) {
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select(`
          *,
          pilot:pilots(id, first_name, last_name, phone, avatar_url),
          company:companies(id, name, phone, logo_url),
          transactions(*)
        `)
        .eq('id', bookingId)
        .single();

      if (queryError) throw queryError;
      
      setBooking(data as BookingWithRelations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch booking');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  return { booking, loading, error, refetch: fetchBooking };
}

// =====================================================
// useCreateBooking - Create new booking
// =====================================================

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const createBooking = useCallback(async (bookingData: BookingInsert): Promise<Booking | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (insertError) throw insertError;
      
      return data as Booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createBooking, loading, error };
}

// =====================================================
// useUpdateBooking - Update booking
// =====================================================

export function useUpdateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const updateBooking = useCallback(async (
    bookingId: string, 
    updates: BookingUpdate
  ): Promise<Booking | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return data as Booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateBooking, loading, error };
}

// =====================================================
// useAssignBooking - Assign pilot/company to booking
// =====================================================

export function useAssignBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const assignBooking = useCallback(async (
    bookingId: string,
    assignment: { pilot_id?: string | null; company_id?: string | null }
  ): Promise<Booking | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user for assigned_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          ...assignment,
          assigned_by: user?.id || null,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return data as Booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { assignBooking, loading, error };
}

// =====================================================
// useCancelBooking - Cancel booking with refund check
// =====================================================

export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Check if booking can be cancelled and get refund amount
  const checkCancellation = useCallback(async (bookingId: string): Promise<CancellationCheck | null> => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('can_cancel_with_refund', { booking_id: bookingId });

      if (rpcError) throw rpcError;
      
      // RPC returns array of single row
      return data?.[0] as CancellationCheck || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check cancellation');
      return null;
    }
  }, []);

  // Cancel the booking
  const cancelBooking = useCallback(async (
    bookingId: string,
    reason?: string
  ): Promise<Booking | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if we can cancel
      const check = await checkCancellation(bookingId);
      if (!check?.can_cancel) {
        throw new Error(check?.reason || 'Cannot cancel this booking');
      }

      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || null,
          refund_amount: check.refund_amount,
          refund_status: check.refund_amount > 0 ? 'pending' : 'none',
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return data as Booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkCancellation]);

  return { cancelBooking, checkCancellation, loading, error };
}

// =====================================================
// useBookingSummary - Get booking statistics
// =====================================================

export function useBookingSummary(options: { pilotId?: string; companyId?: string } = {}) {
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase.from('bookings').select('status, total_price, payment_status');
      
      if (options.pilotId) {
        query = query.eq('pilot_id', options.pilotId);
      }
      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      
      // Type for the selected columns
      type BookingSummaryRow = {
        status: string;
        total_price: number | null;
        payment_status: string;
      };
      
      const bookingsData = data as BookingSummaryRow[];
      
      // Calculate summary
      const bookingsSummary: BookingSummary = {
        total_bookings: bookingsData.length,
        pending_bookings: bookingsData.filter(b => b.status === 'pending').length,
        confirmed_bookings: bookingsData.filter(b => b.status === 'confirmed').length,
        completed_bookings: bookingsData.filter(b => b.status === 'completed').length,
        cancelled_bookings: bookingsData.filter(b => b.status === 'cancelled').length,
        total_revenue: bookingsData
          .filter(b => b.status === 'completed')
          .reduce((sum: number, b) => sum + (b.total_price || 0), 0),
        pending_deposits: bookingsData
          .filter(b => b.payment_status === 'pending_deposit')
          .length,
      };
      
      setSummary(bookingsSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [options.pilotId, options.companyId]);

  return { summary, loading, error, refetch: fetchSummary };
}
