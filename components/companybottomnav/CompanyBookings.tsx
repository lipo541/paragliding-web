'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import BookingCard, { BookingData, BookingStatus, PaymentStatus, BookingSource } from '@/components/bookings/BookingCard';
import toast from 'react-hot-toast';
import { Search, Calendar, TrendingUp, Clock, CheckCircle2, Banknote, UserPlus, Users, RefreshCw } from 'lucide-react';

type Locale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

interface Pilot {
  id: string;
  first_name_ka: string | null;
  first_name_en: string | null;
  last_name_ka: string | null;
  last_name_en: string | null;
  status: string;
}

interface Booking {
  id: string;
  full_name: string;
  phone: string;
  country_id: string;
  location_id: string;
  flight_type_id: string;
  flight_type_name: string;
  selected_date: string;
  number_of_people: number;
  contact_method: 'whatsapp' | 'telegram' | 'viber' | null;
  special_requests: string | null;
  promo_code: string | null;
  promo_discount: number;
  base_price: number;
  total_price: number;
  currency: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  
  // Assignment fields
  pilot_id: string | null;
  company_id: string | null;
  booking_source: BookingSource;
  deposit_amount: number;
  amount_due: number;
  payment_status: PaymentStatus;
  assigned_at: string | null;
  assigned_by: string | null;
  
  // Reschedule fields
  reschedule_count?: number;
  original_date?: string;
  reschedule_reason?: string;
  
  // Seen tracking
  seen_by_pilot?: boolean;
  seen_by_company?: boolean;
  seen_by_admin?: boolean;
  
  // Joined
  countries?: {
    name_ka: string;
    name_en: string;
    name_ru: string;
    name_ar: string | null;
    name_de: string | null;
    name_tr: string | null;
  };
  locations?: {
    name_ka: string;
    name_en: string;
    name_ru: string;
    name_ar: string | null;
    name_de: string | null;
    name_tr: string | null;
  };
  pilots?: Pilot | null;
}

const translations = {
  ka: {
    title: 'კომპანიის ჯავშნები',
    search: 'ძებნა სახელით, ტელეფონით...',
    all: 'ყველა',
    unassigned: 'დაუნიშნავი',
    assigned: 'მინიჭებული',
    pending: 'მომლოდინე',
    confirmed: 'დადასტურებული',
    completed: 'დასრულებული',
    cancelled: 'გაუქმებული',
    total: 'სულ',
    todayFlights: 'დღეს',
    revenue: 'შემოსავალი',
    noBookings: 'ჯავშნები არ მოიძებნა',
    noCompanyProfile: 'კომპანიის პროფილი ვერ მოიძებნა',
    authRequired: 'ავტორიზაცია საჭიროა',
    fetchError: 'ჯავშნების ჩატვირთვა ვერ მოხერხდა',
    newBooking: '🎉 ახალი ჯავშანი მიღებულია!',
    bookingConfirmed: 'ჯავშანი დადასტურდა',
    confirmError: 'დადასტურება ვერ მოხერხდა',
    bookingCancelled: 'ჯავშანი გაუქმდა',
    cancelError: 'გაუქმება ვერ მოხერხდა',
    bookingCompleted: 'ფრენა დასრულდა',
    completeError: 'დასრულება ვერ მოხერხდა',
    pilotAssigned: 'პილოტი მინიჭებულია',
    assignError: 'მინიჭება ვერ მოხერხდა',
    confirmTitle: 'ჯავშნის დადასტურება',
    confirmMessage: 'დარწმუნებული ხართ, რომ გსურთ ამ ჯავშნის დადასტურება?',
    confirmButton: 'დადასტურება',
    cancelTitle: 'ჯავშნის გაუქმება',
    cancelMessage: 'დარწმუნებული ხართ, რომ გსურთ ამ ჯავშნის გაუქმება?',
    cancelConfirmButton: 'გაუქმება',
    cancelButton: 'გაუქმება',
    cancelCancelButton: 'დახურვა',
    completeTitle: 'ფრენის დასრულება',
    completeMessage: 'დარწმუნებული ხართ, რომ ფრენა წარმატებით დასრულდა?',
    completeButton: 'დასრულება',
    rescheduled: 'გადატანილია',
    originalDate: 'თავდაპირველი',
    newBookingAlert: 'ახალი ჯავშანი',
    markAsSeen: 'ნანახად მონიშვნა',
  },
  en: {
    title: 'Company Bookings',
    search: 'Search by name, phone...',
    all: 'All',
    unassigned: 'Unassigned',
    assigned: 'Assigned',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    total: 'Total',
    todayFlights: 'Today',
    revenue: 'Revenue',
    noBookings: 'No bookings found',
    noCompanyProfile: 'Company profile not found',
    authRequired: 'Authentication required',
    fetchError: 'Failed to load bookings',
    newBooking: '🎉 New booking received!',
    bookingConfirmed: 'Booking confirmed',
    confirmError: 'Failed to confirm',
    bookingCancelled: 'Booking cancelled',
    cancelError: 'Failed to cancel',
    bookingCompleted: 'Flight completed',
    completeError: 'Failed to complete',
    pilotAssigned: 'Pilot assigned',
    assignError: 'Failed to assign pilot',
    confirmTitle: 'Confirm Booking',
    confirmMessage: 'Are you sure you want to confirm this booking?',
    confirmButton: 'Confirm',
    cancelTitle: 'Cancel Booking',
    cancelMessage: 'Are you sure you want to cancel this booking?',
    cancelConfirmButton: 'Cancel',
    cancelButton: 'Cancel',
    cancelCancelButton: 'Close',
    completeTitle: 'Complete Flight',
    completeMessage: 'Are you sure the flight was completed successfully?',
    completeButton: 'Complete',
    rescheduled: 'Rescheduled',
    originalDate: 'Original',
    newBookingAlert: 'New Booking',
    markAsSeen: 'Mark as Seen',
  },
};

export default function CompanyBookings() {
  const pathname = usePathname();
  const locale = useMemo(() => (pathname.split('/')[1] as Locale) || 'ka', [pathname]);
  const t = translations[locale as keyof typeof translations] || translations.ka;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyPilots, setCompanyPilots] = useState<Pilot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'assigned' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  const getLocalizedName = useCallback((item: any, field: string, loc: Locale) => {
    const localeField = `${field}_${loc}`;
    return item?.[localeField] || item?.[`${field}_ka`] || item?.[`${field}_en`] || '';
  }, []);
  
  const getPilotDisplayName = useCallback((pilot: Pilot, loc: Locale) => {
    if (loc === 'ka') {
      return `${pilot.first_name_ka || ''} ${pilot.last_name_ka || ''}`.trim();
    }
    return `${pilot.first_name_en || pilot.first_name_ka || ''} ${pilot.last_name_en || pilot.last_name_ka || ''}`.trim();
  }, []);

  const fetchCompanyAndBookings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t.authRequired);
        return;
      }

      // Get company ID
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setIsLoading(false);
        return;
      }

      setCompanyId(company.id);

      // Fetch company pilots
      const { data: pilots } = await supabase
        .from('pilots')
        .select('id, first_name_ka, first_name_en, last_name_ka, last_name_en, status')
        .eq('company_id', company.id)
        .eq('status', 'verified');

      setCompanyPilots(pilots || []);

      // Fetch bookings for this company
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          countries:country_id (
            name_ka,
            name_en,
            name_ru,
            name_ar,
            name_de,
            name_tr
          ),
          locations:location_id (
            name_ka,
            name_en,
            name_ru,
            name_ar,
            name_de,
            name_tr
          ),
          pilots:pilot_id (
            id,
            first_name_ka,
            first_name_en,
            last_name_ka,
            last_name_en,
            status
          )
        `)
        .eq('company_id', company.id)
        .order('selected_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings - details:', error.message, error.code, error.details, error.hint);
        throw error;
      }

      setBookings(data || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err?.message || err);
      toast.error(t.fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchCompanyAndBookings();
  }, [fetchCompanyAndBookings]);

  // Real-time subscription
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('company-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            toast.success(t.newBooking);
            fetchCompanyAndBookings();
          } else if (payload.eventType === 'UPDATE') {
            fetchCompanyAndBookings(); // Refetch to get joined pilot data
          } else if (payload.eventType === 'DELETE') {
            setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase, fetchCompanyAndBookings, t]);

  const handleConfirmBooking = async () => {
    if (!selectedBookingId) return;
    setProcessingId(selectedBookingId);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', selectedBookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === selectedBookingId ? { ...b, status: 'confirmed' as const } : b
      ));
      toast.success(t.bookingConfirmed);
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error(t.confirmError);
    } finally {
      setProcessingId(null);
      setShowConfirmDialog(false);
      setSelectedBookingId(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;
    setProcessingId(selectedBookingId);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled', 
          updated_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString()
        })
        .eq('id', selectedBookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === selectedBookingId ? { ...b, status: 'cancelled' as const } : b
      ));
      toast.success(t.bookingCancelled);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t.cancelError);
    } finally {
      setProcessingId(null);
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };

  const handleCompleteBooking = async () => {
    if (!selectedBookingId) return;
    setProcessingId(selectedBookingId);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', selectedBookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === selectedBookingId ? { ...b, status: 'completed' as const } : b
      ));
      toast.success(t.bookingCompleted);
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error(t.completeError);
    } finally {
      setProcessingId(null);
      setShowCompleteDialog(false);
      setSelectedBookingId(null);
    }
  };

  // Mark booking as seen by company
  const markAsSeenByCompany = useCallback(async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          seen_by_company: true, 
          seen_by_company_at: new Date().toISOString() 
        })
        .eq('id', bookingId);

      if (!error) {
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, seen_by_company: true } : b
        ));
        // Dispatch event to update navigation badge immediately
        window.dispatchEvent(new CustomEvent('booking-seen-updated', { detail: { type: 'company' } }));
      }
    } catch (error) {
      console.error('Error marking booking as seen:', error);
    }
  }, [supabase]);

  const handleAssignPilot = async (bookingId: string, pilotId: string) => {
    setProcessingId(bookingId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          pilot_id: pilotId, 
          assigned_by: user?.id,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Refetch to get pilot data
      fetchCompanyAndBookings();
      toast.success(t.pilotAssigned);
    } catch (error) {
      console.error('Error assigning pilot:', error);
      toast.error(t.assignError);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter and search
  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    // Filter by tab
    if (activeTab === 'unassigned') {
      result = result.filter(b => !b.pilot_id);
    } else if (activeTab === 'assigned') {
      result = result.filter(b => b.pilot_id);
    } else if (activeTab !== 'all') {
      result = result.filter(b => b.status === activeTab);
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.full_name.toLowerCase().includes(term) ||
        b.phone.includes(term) ||
        getLocalizedName(b.locations, 'name', locale).toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [bookings, activeTab, searchTerm, getLocalizedName, locale]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: bookings.length,
      unassigned: bookings.filter(b => !b.pilot_id).length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      today: bookings.filter(b => b.selected_date === today).length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.amount_due || 0), 0),
    };
  }, [bookings]);

  // Convert booking to BookingCard format
  const toBookingCardData = useCallback((booking: Booking): BookingData => ({
    id: booking.id,
    full_name: booking.full_name,
    phone: booking.phone,
    location_name: getLocalizedName(booking.locations, 'name', locale),
    country_name: getLocalizedName(booking.countries, 'name', locale),
    flight_type_name: booking.flight_type_name,
    selected_date: booking.selected_date,
    number_of_people: booking.number_of_people,
    contact_method: booking.contact_method,
    special_requests: booking.special_requests,
    promo_code: booking.promo_code,
    promo_discount: booking.promo_discount,
    base_price: booking.base_price,
    total_price: booking.total_price,
    currency: booking.currency,
    status: booking.status,
    created_at: booking.created_at,
    deposit_amount: booking.deposit_amount,
    amount_due: booking.amount_due,
    payment_status: booking.payment_status,
    booking_source: booking.booking_source,
    pilot_id: booking.pilot_id,
    company_id: booking.company_id,
    pilot: booking.pilots ? {
      id: booking.pilots.id,
      first_name_ka: booking.pilots.first_name_ka || undefined,
      first_name_en: booking.pilots.first_name_en || undefined,
      last_name_ka: booking.pilots.last_name_ka || undefined,
      last_name_en: booking.pilots.last_name_en || undefined,
    } : null,
  }), [getLocalizedName, locale]);

  // Available pilots for dropdown
  const availablePilots = useMemo(() => 
    companyPilots.map(pilot => ({
      id: pilot.id,
      name: getPilotDisplayName(pilot, locale),
    })),
  [companyPilots, getPilotDisplayName, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <svg className="mb-4 h-16 w-16 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-foreground/60">{t.noCompanyProfile}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">{t.total}</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <UserPlus className="w-4 h-4" />
            <span className="text-xs">{t.unassigned}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.unassigned}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">{t.pending}</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">{t.confirmed}</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">{t.completed}</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{t.todayFlights}</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.today}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Banknote className="w-4 h-4" />
            <span className="text-xs">{t.revenue}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalRevenue}₾</p>
        </div>
      </div>

      {/* Pilots Info */}
      {companyPilots.length > 0 && (
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {locale === 'ka' ? `${companyPilots.length} აქტიური პილოტი` : `${companyPilots.length} active pilots`}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'unassigned', 'assigned', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => {
          let count = 0;
          if (tab === 'all') count = bookings.length;
          else if (tab === 'unassigned') count = bookings.filter(b => !b.pilot_id).length;
          else if (tab === 'assigned') count = bookings.filter(b => b.pilot_id).length;
          else count = bookings.filter(b => b.status === tab).length;
          
          const colors: Record<typeof tab, string> = {
            all: 'bg-zinc-500',
            unassigned: 'bg-amber-500',
            assigned: 'bg-indigo-500',
            pending: 'bg-yellow-500',
            confirmed: 'bg-blue-500',
            completed: 'bg-green-500',
            cancelled: 'bg-red-500',
          };
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? `${colors[tab]} text-white`
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {t[tab] || tab}
              {count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-12">
          <Calendar className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 dark:text-zinc-400">{t.noBookings}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isRescheduled = (booking.reschedule_count || 0) > 0;
            const isNewForCompany = booking.seen_by_company === false;
            
            return (
              <div key={booking.id} className="space-y-0">
                {/* New Booking Indicator */}
                {isNewForCompany && (
                  <div className="mx-1 mb-0">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-t-xl text-xs bg-[#FF0000] dark:bg-[#CC0000] border border-b-0 border-red-600">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                        <span className="text-white font-bold">
                          ✨ {t.newBookingAlert || 'ახალი ჯავშანი'}!
                        </span>
                      </div>
                      <button
                        onClick={() => markAsSeenByCompany(booking.id)}
                        className="px-2 py-1 text-xs font-medium bg-white hover:bg-gray-100 text-[#FF0000] rounded transition-colors animate-pulse"
                      >
                        {t.markAsSeen || 'ნანახად მონიშვნა'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Rescheduled Banner */}
                {isRescheduled && !isNewForCompany && (
                  <div className="mx-1 mb-0">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl text-xs bg-purple-50 dark:bg-purple-900/30 border border-b-0 border-purple-200 dark:border-purple-800">
                      <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-purple-800 dark:text-purple-200 font-medium">
                        {t.rescheduled || 'გადატანილია'} {booking.reschedule_count}x
                      </span>
                      {booking.original_date && (
                        <span className="text-purple-600 dark:text-purple-400">
                          • {t.originalDate || 'თავდაპირველი'}: {new Date(booking.original_date).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Main Booking Card with red border if new */}
                <div className={isNewForCompany ? 'ring-2 ring-[#FF0000] ring-offset-2 rounded-xl' : ''}>
                  <BookingCard
                    booking={toBookingCardData(booking)}
                    locale={locale}
                    isProcessing={processingId === booking.id}
                    showAssignPilot={true}
                    availablePilots={availablePilots}
                    onConfirm={(id) => {
                      markAsSeenByCompany(id);
                      setSelectedBookingId(id);
                      setShowConfirmDialog(true);
                    }}
                    onCancel={(id) => {
                      markAsSeenByCompany(id);
                      setSelectedBookingId(id);
                      setShowCancelDialog(true);
                    }}
                    onComplete={(id) => {
                      markAsSeenByCompany(id);
                      setSelectedBookingId(id);
                      setShowCompleteDialog(true);
                    }}
                    onAssignPilot={(bookingId, pilotId) => {
                      markAsSeenByCompany(bookingId);
                      handleAssignPilot(bookingId, pilotId);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleConfirmBooking}
        title={t.confirmTitle}
        message={t.confirmMessage}
        confirmText={t.confirmButton}
        cancelText={t.cancelButton}
        variant="primary"
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleCancelBooking}
        title={t.cancelTitle}
        message={t.cancelMessage}
        confirmText={t.cancelConfirmButton}
        cancelText={t.cancelCancelButton}
        variant="danger"
      />

      {/* Complete Dialog */}
      <ConfirmDialog
        isOpen={showCompleteDialog}
        onClose={() => {
          setShowCompleteDialog(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleCompleteBooking}
        title={t.completeTitle}
        message={t.completeMessage}
        confirmText={t.completeButton}
        cancelText={t.cancelButton}
        variant="primary"
      />
      </div>
    </div>
  );
}
