'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

type Locale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

interface Booking {
  id: string;
  full_name: string;
  phone: string;
  country_name_ka: string;
  country_name_en: string;
  country_name_ru: string;
  country_name_ar: string | null;
  country_name_de: string | null;
  country_name_tr: string | null;
  location_name_ka: string;
  location_name_en: string;
  location_name_ru: string;
  location_name_ar: string | null;
  location_name_de: string | null;
  location_name_tr: string | null;
  flight_type_name_ka: string;
  flight_type_name_en: string;
  flight_type_name_ru: string;
  flight_type_name_ar: string | null;
  flight_type_name_de: string | null;
  flight_type_name_tr: string | null;
  selected_date: string;
  number_of_people: number;
  contact_method: string | null;
  special_requests: string | null;
  base_price: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export default function PilotBookings() {
  const { t } = useTranslation('pilotbookings');
  const pathname = usePathname();
  const locale = useMemo(() => (pathname.split('/')[1] as Locale) || 'ka', [pathname]);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pilotId, setPilotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const supabase = createClient();

  const getLocalizedName = (booking: Booking, field: 'country_name' | 'location_name' | 'flight_type_name') => {
    const localeField = `${field}_${locale}` as keyof Booking;
    return (booking[localeField] as string) || (booking[`${field}_ka` as keyof Booking] as string) || '';
  };

  useEffect(() => {
    fetchPilotAndBookings();
  }, []);

  const fetchPilotAndBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('authRequired') || 'ავტორიზაცია საჭიროა');
        return;
      }

      // Get pilot ID
      const { data: pilot } = await supabase
        .from('pilots')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!pilot) {
        setIsLoading(false);
        return;
      }

      setPilotId(pilot.id);

      // Fetch bookings for this pilot
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
          )
        `)
        .eq('pilot_id', pilot.id)
        .order('selected_date', { ascending: true });

      if (error) throw error;

      const formattedBookings = (data || []).map((booking: any) => ({
        ...booking,
        country_name_ka: booking.countries?.name_ka || '',
        country_name_en: booking.countries?.name_en || '',
        country_name_ru: booking.countries?.name_ru || '',
        country_name_ar: booking.countries?.name_ar || null,
        country_name_de: booking.countries?.name_de || null,
        country_name_tr: booking.countries?.name_tr || null,
        location_name_ka: booking.locations?.name_ka || '',
        location_name_en: booking.locations?.name_en || '',
        location_name_ru: booking.locations?.name_ru || '',
        location_name_ar: booking.locations?.name_ar || null,
        location_name_de: booking.locations?.name_de || null,
        location_name_tr: booking.locations?.name_tr || null,
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('fetchError') || 'ჯავშნების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

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
      toast.success(t('bookingConfirmed') || 'ჯავშანი დადასტურდა');
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error(t('confirmError') || 'დადასტურება ვერ მოხერხდა');
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
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', selectedBookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === selectedBookingId ? { ...b, status: 'cancelled' as const } : b
      ));
      toast.success(t('bookingCancelled') || 'ჯავშანი გაუქმდა');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('cancelError') || 'გაუქმება ვერ მოხერხდა');
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
      toast.success(t('bookingCompleted') || 'ფრენა დასრულდა');
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error(t('completeError') || 'დასრულება ვერ მოხერხდა');
    } finally {
      setProcessingId(null);
      setShowCompleteDialog(false);
      setSelectedBookingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === 'all') return bookings;
    return bookings.filter(b => b.status === activeTab);
  }, [bookings, activeTab]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      confirmed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
      cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };
    const labels = {
      pending: t('statusPending') || 'მომლოდინე',
      confirmed: t('statusConfirmed') || 'დადასტურებული',
      completed: t('statusCompleted') || 'დასრულებული',
      cancelled: t('statusCancelled') || 'გაუქმებული',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pilotId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <svg className="mb-4 h-16 w-16 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-foreground/60">{t('noPilotProfile') || 'პილოტის პროფილი ვერ მოიძებნა'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('title') || 'ჯავშნები'}</h1>
        <div className="text-sm text-foreground/60">
          {t('total') || 'სულ'}: {bookings.length}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => {
          const count = tab === 'all' ? bookings.length : bookings.filter(b => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/5 text-foreground/60 hover:text-foreground'
              }`}
            >
              {tab === 'all' && (t('filterAll') || 'ყველა')}
              {tab === 'pending' && (t('filterPending') || 'მომლოდინე')}
              {tab === 'confirmed' && (t('filterConfirmed') || 'დადასტურებული')}
              {tab === 'completed' && (t('filterCompleted') || 'დასრულებული')}
              {tab === 'cancelled' && (t('filterCancelled') || 'გაუქმებული')}
              {count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-foreground/10 bg-background py-12">
          <svg className="mb-4 h-12 w-12 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-foreground/60">{t('noBookings') || 'ჯავშნები არ მოიძებნა'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Booking Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking.status)}
                    <span className="text-sm text-foreground/60">
                      {formatDate(booking.selected_date)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground">{booking.full_name}</h3>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/70">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {getLocalizedName(booking, 'location_name')}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {booking.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {booking.number_of_people} {t('people') || 'ადამიანი'}
                    </span>
                  </div>

                  {booking.special_requests && (
                    <p className="text-sm italic text-foreground/60">
                      &quot;{booking.special_requests}&quot;
                    </p>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      {booking.total_price} {booking.currency}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBookingId(booking.id);
                            setShowConfirmDialog(true);
                          }}
                          disabled={processingId === booking.id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {t('confirm') || 'დადასტურება'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookingId(booking.id);
                            setShowCancelDialog(true);
                          }}
                          disabled={processingId === booking.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {t('cancel') || 'გაუქმება'}
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setShowCompleteDialog(true);
                        }}
                        disabled={processingId === booking.id}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {t('complete') || 'დასრულება'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
        title={t('confirmTitle') || 'ჯავშნის დადასტურება'}
        message={t('confirmMessage') || 'დარწმუნებული ხართ, რომ გსურთ ამ ჯავშნის დადასტურება?'}
        confirmText={t('confirmButton') || 'დადასტურება'}
        cancelText={t('cancelButton') || 'გაუქმება'}
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
        title={t('cancelTitle') || 'ჯავშნის გაუქმება'}
        message={t('cancelMessage') || 'დარწმუნებული ხართ, რომ გსურთ ამ ჯავშნის გაუქმება?'}
        confirmText={t('cancelConfirmButton') || 'გაუქმება'}
        cancelText={t('cancelCancelButton') || 'დახურვა'}
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
        title={t('completeTitle') || 'ფრენის დასრულება'}
        message={t('completeMessage') || 'დარწმუნებული ხართ, რომ ფრენა წარმატებით დასრულდა?'}
        confirmText={t('completeButton') || 'დასრულება'}
        cancelText={t('cancelButton') || 'გაუქმება'}
        variant="primary"
      />
    </div>
  );
}
