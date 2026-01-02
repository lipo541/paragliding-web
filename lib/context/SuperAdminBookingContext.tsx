'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Booking, 
  BookingStatus, 
  BookingNote, 
  BookingHistory,
  BookingNoteInsert,
  RescheduleData,
  ReassignData,
  RefundData,
  SuperAdminBookingSummary,
  BookingSource,
  PaymentStatus
} from '@/lib/types/booking';
import { Pilot } from '@/lib/types/pilot';
import { Company } from '@/lib/types/company';
import { RealtimeChannel } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BookingFilters {
  status: BookingStatus | 'all';
  paymentStatus: PaymentStatus | 'all';
  source: BookingSource | 'all';
  pilotId: string | null;
  companyId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  searchTerm: string;
  priority: string | 'all';
}

export interface BookingWithRelations extends Booking {
  pilot?: Pick<Pilot, 'id' | 'first_name_ka' | 'first_name_en' | 'last_name_ka' | 'last_name_en' | 'phone' | 'avatar_url'> | null;
  company?: Pick<Company, 'id' | 'name_ka' | 'name_en' | 'phone' | 'logo_url'> | null;
}

interface SuperAdminBookingContextType {
  // State
  bookings: BookingWithRelations[];
  selectedBooking: BookingWithRelations | null;
  bookingNotes: BookingNote[];
  bookingHistory: BookingHistory[];
  pilots: Pilot[];
  companies: Company[];
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  filters: BookingFilters;
  summary: SuperAdminBookingSummary | null;
  
  // Selection (for bulk actions)
  selectedBookingIds: string[];
  
  // Actions - Fetch
  fetchBookings: () => Promise<void>;
  fetchBookingById: (id: string) => Promise<BookingWithRelations | null>;
  fetchBookingNotes: (bookingId: string) => Promise<void>;
  fetchBookingHistory: (bookingId: string) => Promise<void>;
  fetchPilots: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  
  // Actions - Booking Management
  updateBookingStatus: (bookingId: string, status: BookingStatus, reason?: string) => Promise<boolean>;
  rescheduleBooking: (data: RescheduleData) => Promise<boolean>;
  reassignBooking: (data: ReassignData) => Promise<boolean>;
  refundBooking: (data: RefundData) => Promise<boolean>;
  deleteBooking: (bookingId: string) => Promise<boolean>;
  markBookingAsSeen: (bookingId: string, role: 'pilot' | 'company' | 'admin') => Promise<boolean>;
  
  // Actions - Notes
  addBookingNote: (note: BookingNoteInsert) => Promise<boolean>;
  deleteBookingNote: (noteId: string) => Promise<boolean>;
  toggleNotePin: (noteId: string, isPinned: boolean) => Promise<boolean>;
  
  // Actions - Selection
  selectBooking: (booking: BookingWithRelations | null) => void;
  toggleBookingSelection: (bookingId: string) => void;
  selectAllBookings: () => void;
  clearSelection: () => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<BookingFilters>) => void;
  resetFilters: () => void;
  
  // Actions - Priority & Tags
  updateBookingPriority: (bookingId: string, priority: string) => Promise<boolean>;
  updateBookingTags: (bookingId: string, tags: string[]) => Promise<boolean>;
  
  // Real-time
  subscribeToBookings: () => void;
  unsubscribeFromBookings: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════

const defaultFilters: BookingFilters = {
  status: 'all',
  paymentStatus: 'all',
  source: 'all',
  pilotId: null,
  companyId: null,
  dateFrom: null,
  dateTo: null,
  searchTerm: '',
  priority: 'all'
};

const defaultSummary: SuperAdminBookingSummary = {
  total_bookings: 0,
  pending_bookings: 0,
  confirmed_bookings: 0,
  completed_bookings: 0,
  cancelled_bookings: 0,
  on_hold_bookings: 0,
  no_show_bookings: 0,
  rescheduled_bookings: 0,
  total_revenue: 0,
  total_refunded: 0,
  pending_deposits: 0,
  today_bookings: 0,
  this_week_bookings: 0
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const SuperAdminBookingContext = createContext<SuperAdminBookingContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface SuperAdminBookingProviderProps {
  children: ReactNode;
}

export function SuperAdminBookingProvider({ children }: SuperAdminBookingProviderProps) {
  // State
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [bookingNotes, setBookingNotes] = useState<BookingNote[]>([]);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<BookingFilters>(defaultFilters);
  const [summary, setSummary] = useState<SuperAdminBookingSummary | null>(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  
  const supabase = createClient();

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          pilot:pilots(
            id, first_name_ka, first_name_en, last_name_ka, last_name_en, phone, avatar_url
          ),
          company:companies(
            id, name_ka, name_en, phone, logo_url
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters.source !== 'all') {
        query = query.eq('booking_source', filters.source);
      }
      if (filters.pilotId) {
        query = query.eq('pilot_id', filters.pilotId);
      }
      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      if (filters.dateFrom) {
        query = query.gte('selected_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('selected_date', filters.dateTo);
      }
      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,location_name.ilike.%${filters.searchTerm}%`);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('ჯავშნების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, filters]);

  const fetchBookingById = useCallback(async (id: string): Promise<BookingWithRelations | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          pilot:pilots(
            id, first_name_ka, first_name_en, last_name_ka, last_name_en, phone, avatar_url
          ),
          company:companies(
            id, name_ka, name_en, phone, logo_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('Error fetching booking:', err);
      return null;
    }
  }, [supabase]);

  const fetchBookingNotes = useCallback(async (bookingId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('booking_notes')
        .select('*')
        .eq('booking_id', bookingId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setBookingNotes(data || []);
    } catch (err) {
      console.error('Error fetching booking notes:', err);
    }
  }, [supabase]);

  // Fetch all notes for displayed bookings (pinned + recent)
  const fetchAllBookingNotes = useCallback(async (bookingIds: string[]) => {
    if (bookingIds.length === 0) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('booking_notes')
        .select('*')
        .in('booking_id', bookingIds)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setBookingNotes(data || []);
    } catch (err) {
      console.error('Error fetching all booking notes:', err);
    }
  }, [supabase]);

  const fetchBookingHistory = useCallback(async (bookingId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('booking_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setBookingHistory(data || []);
    } catch (err) {
      console.error('Error fetching booking history:', err);
    }
  }, [supabase]);

  const fetchPilots = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pilots')
        .select('*')
        .eq('status', 'verified')
        .order('first_name_ka', { ascending: true });
      
      if (fetchError) throw fetchError;
      setPilots(data || []);
    } catch (err) {
      console.error('Error fetching pilots:', err);
    }
  }, [supabase]);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('id, name_ka, name_en, phone, logo_url, status')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }, [supabase]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data: allBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('status, payment_status, total_price, refund_amount, selected_date, created_at');
      
      if (fetchError) throw fetchError;
      
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      type BookingSummaryRow = {
        status: string | null;
        payment_status: string | null;
        total_price: number | null;
        refund_amount: number | null;
        selected_date: string | null;
        created_at: string | null;
      };

      const newSummary: SuperAdminBookingSummary = {
        total_bookings: allBookings?.length || 0,
        pending_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'pending').length || 0,
        confirmed_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'confirmed').length || 0,
        completed_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'completed').length || 0,
        cancelled_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'cancelled').length || 0,
        on_hold_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'on_hold').length || 0,
        no_show_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'no_show').length || 0,
        rescheduled_bookings: allBookings?.filter((b: BookingSummaryRow) => b.status === 'rescheduled').length || 0,
        total_revenue: allBookings?.reduce((sum: number, b: BookingSummaryRow) => sum + (b.total_price || 0), 0) || 0,
        total_refunded: allBookings?.reduce((sum: number, b: BookingSummaryRow) => sum + (b.refund_amount || 0), 0) || 0,
        pending_deposits: allBookings?.filter((b: BookingSummaryRow) => b.payment_status === 'pending_deposit').length || 0,
        today_bookings: allBookings?.filter((b: BookingSummaryRow) => b.selected_date === today).length || 0,
        this_week_bookings: allBookings?.filter((b: BookingSummaryRow) => b.selected_date && b.selected_date >= weekAgo).length || 0
      };
      
      setSummary(newSummary);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, [supabase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOKING MANAGEMENT ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const updateBookingStatus = useCallback(async (
    bookingId: string, 
    status: BookingStatus, 
    reason?: string
  ): Promise<boolean> => {
    setIsActionLoading(true);
    try {
      const updateData: Record<string, unknown> = { status };
      
      // Add specific fields based on status
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = reason || null;
      } else if (status === 'on_hold') {
        updateData.on_hold_reason = reason || null;
      } else if (status === 'no_show') {
        updateData.no_show_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);
      
      if (updateError) throw updateError;
      
      // Refresh bookings
      await fetchBookings();
      await fetchSummary();
      
      // Update selected booking if it's the one being updated
      if (selectedBooking?.id === bookingId) {
        const updated = await fetchBookingById(bookingId);
        setSelectedBooking(updated);
      }
      
      return true;
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('სტატუსის განახლება ვერ მოხერხდა');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [supabase, fetchBookings, fetchSummary, selectedBooking, fetchBookingById]);

  const rescheduleBooking = useCallback(async (data: RescheduleData): Promise<boolean> => {
    setIsActionLoading(true);
    try {
      // Get current booking with user info
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          selected_date, original_date, reschedule_count, status, 
          user_id, pilot_id, company_id, location_name, full_name,
          pilot:pilots(user_id, company_id),
          company:companies(user_id)
        `)
        .eq('id', data.booking_id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const oldDate = currentBooking.selected_date;
      const newDate = data.new_date;
      
      const updateData = {
        selected_date: newDate,
        original_date: currentBooking.original_date || oldDate,
        reschedule_count: (currentBooking.reschedule_count || 0) + 1,
        last_rescheduled_at: new Date().toISOString(),
        reschedule_reason: data.reason,
      };
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', data.booking_id);
      
      if (updateError) throw updateError;

      // Get current admin user for sender
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      // Send notifications
      if (adminUser) {
        const formatDate = (dateStr: string, locale: string) => {
          return new Date(dateStr).toLocaleDateString(locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        };

        const recipientSet = new Set<string>();
        
        // Customer
        if (data.notify_customer && currentBooking.user_id) {
          recipientSet.add(currentBooking.user_id);
        }
        
        // Pilot
        if (data.notify_pilot && currentBooking.pilot?.user_id) {
          recipientSet.add(currentBooking.pilot.user_id);
        }

        // Booking's company (if exists)
        if (currentBooking.company?.user_id) {
          recipientSet.add(currentBooking.company.user_id);
        }

        // Pilot's company (if pilot is member of a company)
        // Need to fetch company user_id if pilot has company_id
        if (currentBooking.pilot?.company_id) {
          const { data: pilotCompany } = await supabase
            .from('companies')
            .select('user_id')
            .eq('id', currentBooking.pilot.company_id)
            .single();
          
          if (pilotCompany?.user_id) {
            recipientSet.add(pilotCompany.user_id);
          }
        }

        const recipients = Array.from(recipientSet);

        if (recipients.length > 0) {
          const location = currentBooking.location_name;
          const reasons = data.reasons || { ka: data.reason || '', en: data.reason || '', ru: '', de: '', tr: '', ar: '' };

          // Build subjects for all languages
          const subject_ka = '📅 თქვენი ჯავშანი გადატანილია';
          const subject_en = '📅 Your booking has been rescheduled';
          const subject_ru = '📅 Ваше бронирование перенесено';
          const subject_de = '📅 Ihre Buchung wurde verschoben';
          const subject_tr = '📅 Rezervasyonunuz ertelendi';
          const subject_ar = '📅 تم إعادة جدولة حجزك';

          // Build content for all languages
          const content_ka = `ლოკაცია: ${location}\nძველი თარიღი: ${formatDate(oldDate, 'ka')}\nახალი თარიღი: ${formatDate(newDate, 'ka')}${reasons.ka ? `\nმიზეზი: ${reasons.ka}` : ''}`;
          const content_en = `Location: ${location}\nOld date: ${formatDate(oldDate, 'en')}\nNew date: ${formatDate(newDate, 'en')}${reasons.en ? `\nReason: ${reasons.en}` : ''}`;
          const content_ru = `Локация: ${location}\nСтарая дата: ${formatDate(oldDate, 'ru')}\nНовая дата: ${formatDate(newDate, 'ru')}${reasons.ru ? `\nПричина: ${reasons.ru}` : ''}`;
          const content_de = `Ort: ${location}\nAltes Datum: ${formatDate(oldDate, 'de')}\nNeues Datum: ${formatDate(newDate, 'de')}${reasons.de ? `\nGrund: ${reasons.de}` : ''}`;
          const content_tr = `Konum: ${location}\nEski tarih: ${formatDate(oldDate, 'tr')}\nYeni tarih: ${formatDate(newDate, 'tr')}${reasons.tr ? `\nSebep: ${reasons.tr}` : ''}`;
          const content_ar = `الموقع: ${location}\nالتاريخ القديم: ${formatDate(oldDate, 'ar')}\nالتاريخ الجديد: ${formatDate(newDate, 'ar')}${reasons.ar ? `\nالسبب: ${reasons.ar}` : ''}`;

          // Create single message with all languages
          const { data: message, error: msgError } = await supabase
            .from('messages')
            .insert({
              sender_id: adminUser.id,
              recipient_type: 'USER',
              subject_ka,
              subject_en,
              subject_ru,
              subject_de,
              subject_tr,
              subject_ar,
              content_ka,
              content_en,
              content_ru,
              content_de,
              content_tr,
              content_ar
            })
            .select('id')
            .single();

          if (msgError) {
            console.error('Error creating notification message:', msgError);
          } else if (message) {
            // Add recipients to message_recipients table
            const recipientInserts = recipients.map(userId => ({
              message_id: message.id,
              user_id: userId,
              is_read: false
            }));

            const { error: recipError } = await supabase
              .from('message_recipients')
              .insert(recipientInserts);

            if (recipError) {
              console.error('Error adding message recipients:', recipError);
            }
          }
        }
      }
      
      await fetchBookings();
      await fetchSummary();
      
      if (selectedBooking?.id === data.booking_id) {
        const updated = await fetchBookingById(data.booking_id);
        setSelectedBooking(updated);
        if (updated) await fetchBookingHistory(data.booking_id);
      }
      
      return true;
    } catch (err) {
      console.error('Error rescheduling booking:', err);
      setError('თარიღის გადაწევა ვერ მოხერხდა');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [supabase, fetchBookings, fetchSummary, selectedBooking, fetchBookingById, fetchBookingHistory]);

  const reassignBooking = useCallback(async (data: ReassignData): Promise<boolean> => {
    setIsActionLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        assigned_at: new Date().toISOString()
      };
      
      if (data.new_pilot_id !== undefined) {
        updateData.pilot_id = data.new_pilot_id;
      }
      if (data.new_company_id !== undefined) {
        updateData.company_id = data.new_company_id;
        // If changing company, remove pilot assignment (company will reassign)
        if (data.new_company_id !== null && data.new_pilot_id === undefined) {
          updateData.pilot_id = null;
        }
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', data.booking_id);
      
      if (updateError) throw updateError;
      
      // TODO: Send notifications
      
      await fetchBookings();
      
      if (selectedBooking?.id === data.booking_id) {
        const updated = await fetchBookingById(data.booking_id);
        setSelectedBooking(updated);
        if (updated) await fetchBookingHistory(data.booking_id);
      }
      
      return true;
    } catch (err) {
      console.error('Error reassigning booking:', err);
      setError('გადამისამართება ვერ მოხერხდა');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [supabase, fetchBookings, selectedBooking, fetchBookingById, fetchBookingHistory]);

  const refundBooking = useCallback(async (data: RefundData): Promise<boolean> => {
    setIsActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = {
        refund_amount: data.refund_amount,
        refund_status: data.refund_type === 'full' ? 'processed' : 'partial',
        refunded_at: new Date().toISOString(),
        refunded_by: user?.id || null,
        payment_status: data.refund_type === 'full' ? 'refunded' : 'deposit_paid',
        cancellation_reason: data.reason
      };
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', data.booking_id);
      
      if (updateError) throw updateError;
      
      // TODO: Process Stripe refund if data.process_stripe_refund
      
      await fetchBookings();
      await fetchSummary();
      
      if (selectedBooking?.id === data.booking_id) {
        const updated = await fetchBookingById(data.booking_id);
        setSelectedBooking(updated);
        if (updated) await fetchBookingHistory(data.booking_id);
      }
      
      return true;
    } catch (err) {
      console.error('Error refunding booking:', err);
      setError('დაბრუნება ვერ მოხერხდა');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [supabase, fetchBookings, fetchSummary, selectedBooking, fetchBookingById, fetchBookingHistory]);

  const deleteBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    setIsActionLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      
      if (deleteError) throw deleteError;
      
      await fetchBookings();
      await fetchSummary();
      
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('წაშლა ვერ მოხერხდა');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [supabase, fetchBookings, fetchSummary, selectedBooking]);

  // Mark booking as seen by role
  const markBookingAsSeen = useCallback(async (bookingId: string, role: 'pilot' | 'company' | 'admin'): Promise<boolean> => {
    try {
      const updateData: Record<string, boolean | string> = {};
      
      if (role === 'pilot') {
        updateData.seen_by_pilot = true;
        updateData.seen_by_pilot_at = new Date().toISOString();
      } else if (role === 'company') {
        updateData.seen_by_company = true;
        updateData.seen_by_company_at = new Date().toISOString();
      } else if (role === 'admin') {
        updateData.seen_by_admin = true;
        updateData.seen_by_admin_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, ...updateData } : b
      ));

      // Dispatch event to update navigation badge immediately
      window.dispatchEvent(new CustomEvent('booking-seen-updated', { detail: { type: role } }));

      return true;
    } catch (err) {
      console.error('Error marking booking as seen:', err);
      return false;
    }
  }, [supabase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addBookingNote = useCallback(async (note: BookingNoteInsert): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();
      
      const { error: insertError } = await supabase
        .from('booking_notes')
        .insert({
          ...note,
          author_id: user?.id || null,
          author_name: profile?.full_name || 'Admin'
        });
      
      if (insertError) throw insertError;
      
      await fetchBookingNotes(note.booking_id);
      return true;
    } catch (err) {
      console.error('Error adding note:', err);
      return false;
    }
  }, [supabase, fetchBookingNotes]);

  const deleteBookingNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('booking_notes')
        .delete()
        .eq('id', noteId);
      
      if (deleteError) throw deleteError;
      
      setBookingNotes(prev => prev.filter(n => n.id !== noteId));
      return true;
    } catch (err) {
      console.error('Error deleting note:', err);
      return false;
    }
  }, [supabase]);

  const toggleNotePin = useCallback(async (noteId: string, isPinned: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('booking_notes')
        .update({ is_pinned: isPinned })
        .eq('id', noteId);
      
      if (updateError) throw updateError;
      
      setBookingNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, is_pinned: isPinned } : n
      ).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }));
      
      return true;
    } catch (err) {
      console.error('Error toggling note pin:', err);
      return false;
    }
  }, [supabase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const selectBooking = useCallback((booking: BookingWithRelations | null) => {
    setSelectedBooking(booking);
    if (booking) {
      fetchBookingNotes(booking.id);
      fetchBookingHistory(booking.id);
    } else {
      setBookingNotes([]);
      setBookingHistory([]);
    }
  }, [fetchBookingNotes, fetchBookingHistory]);

  const toggleBookingSelection = useCallback((bookingId: string) => {
    setSelectedBookingIds(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  }, []);

  const selectAllBookings = useCallback(() => {
    setSelectedBookingIds(bookings.map(b => b.id));
  }, [bookings]);

  const clearSelection = useCallback(() => {
    setSelectedBookingIds([]);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const setFilters = useCallback((newFilters: Partial<BookingFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIORITY & TAGS ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const updateBookingPriority = useCallback(async (bookingId: string, priority: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ priority })
        .eq('id', bookingId);
      
      if (updateError) throw updateError;
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, priority: priority as Booking['priority'] } : b
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating priority:', err);
      return false;
    }
  }, [supabase]);

  const updateBookingTags = useCallback(async (bookingId: string, tags: string[]): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ tags })
        .eq('id', bookingId);
      
      if (updateError) throw updateError;
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, tags } : b
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating tags:', err);
      return false;
    }
  }, [supabase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  const subscribeToBookings = useCallback(() => {
    if (subscription) return;
    
    const channel = supabase
      .channel('superadmin-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchBookings();
          fetchSummary();
        }
      )
      .subscribe();
    
    setSubscription(channel);
  }, [supabase, subscription, fetchBookings, fetchSummary]);

  const unsubscribeFromBookings = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [supabase, subscription]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Initial fetch
  useEffect(() => {
    fetchBookings();
    fetchSummary();
    fetchPilots();
    fetchCompanies();
  }, [fetchBookings, fetchSummary, fetchPilots, fetchCompanies]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchBookings();
  }, [filters, fetchBookings]);

  // Fetch notes for all displayed bookings
  useEffect(() => {
    if (bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id);
      fetchAllBookingNotes(bookingIds);
    }
  }, [bookings, fetchAllBookingNotes]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromBookings();
    };
  }, [unsubscribeFromBookings]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  const value: SuperAdminBookingContextType = {
    // State
    bookings,
    selectedBooking,
    bookingNotes,
    bookingHistory,
    pilots,
    companies,
    isLoading,
    isActionLoading,
    error,
    filters,
    summary,
    selectedBookingIds,
    
    // Fetch actions
    fetchBookings,
    fetchBookingById,
    fetchBookingNotes,
    fetchBookingHistory,
    fetchPilots,
    fetchCompanies,
    fetchSummary,
    
    // Booking management actions
    updateBookingStatus,
    rescheduleBooking,
    reassignBooking,
    refundBooking,
    deleteBooking,
    markBookingAsSeen,
    
    // Notes actions
    addBookingNote,
    deleteBookingNote,
    toggleNotePin,
    
    // Selection actions
    selectBooking,
    toggleBookingSelection,
    selectAllBookings,
    clearSelection,
    
    // Filter actions
    setFilters,
    resetFilters,
    
    // Priority & Tags
    updateBookingPriority,
    updateBookingTags,
    
    // Real-time
    subscribeToBookings,
    unsubscribeFromBookings
  };

  return (
    <SuperAdminBookingContext.Provider value={value}>
      {children}
    </SuperAdminBookingContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useSuperAdminBooking() {
  const context = useContext(SuperAdminBookingContext);
  if (!context) {
    throw new Error('useSuperAdminBooking must be used within SuperAdminBookingProvider');
  }
  return context;
}
