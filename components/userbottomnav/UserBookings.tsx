'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import { usePathname } from 'next/navigation';
import { RefreshCw, Package, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import Breadcrumbs, { breadcrumbLabels, type Locale } from '@/components/shared/Breadcrumbs';

interface AdditionalServiceItem {
  service_id: string;
  name: string;
  price_gel: number;
  quantity: number;
}

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
  promo_code: string | null;
  promo_discount: number;
  special_requests: string | null;
  base_price: number;
  total_price: number;
  services_total: number | null;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  // Reschedule fields
  reschedule_count?: number;
  original_date?: string;
  reschedule_reason?: string;
  // Additional services
  additional_services?: AdditionalServiceItem[] | null;
}

export default function UserBookings() {
  const { t } = useTranslation('userbookings');
  const pathname = usePathname();
  const locale = useMemo(() => pathname.split('/')[1] as 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr' || 'ka', [pathname]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const supabase = createClient();

  const toggleBookingExpanded = (bookingId: string) => {
    setExpandedBookings(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  const getLocalizedName = (booking: Booking, field: 'country_name' | 'location_name' | 'flight_type_name') => {
    const localeField = `${field}_${locale}` as keyof Booking;
    return (booking[localeField] as string) || booking[`${field}_ka`] || '';
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('messages.authRequired'));
        return;
      }

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch location_pages for flight type translations
      const locationIds = [...new Set((data || []).map((b: any) => b.location_id).filter(Boolean))];
      
      const locationPagesMap: Record<string, any> = {};
      if (locationIds.length > 0) {
        const { data: locationPages } = await supabase
          .from('location_pages')
          .select('location_id, content')
          .in('location_id', locationIds);

        if (locationPages) {
          locationPages.forEach((lp: any) => {
            locationPagesMap[lp.location_id] = lp.content;
          });
        }
      }

      // Helper to get flight type name from location_pages content
      const getFlightTypeName = (locationId: string, flightTypeId: string, locale: string) => {
        const content = locationPagesMap[locationId];
        if (!content) return null;

        // Get locale-specific flight types array
        const localeContent = content[locale] || content['ka'] || {};
        const localeFlightTypes = localeContent.flight_types || [];

        // Find the flight type by shared_id (not id!)
        const localizedFlight = localeFlightTypes.find((ft: any) => ft.shared_id === flightTypeId);
        return localizedFlight?.name || null;
      };

      // Transform data to include localized names
      const transformedData = (data || []).map((booking: any) => ({
        ...booking,
        country_name_ka: booking.countries?.name_ka || booking.country_name,
        country_name_en: booking.countries?.name_en || booking.country_name,
        country_name_ru: booking.countries?.name_ru || booking.country_name,
        country_name_ar: booking.countries?.name_ar || booking.country_name,
        country_name_de: booking.countries?.name_de || booking.country_name,
        country_name_tr: booking.countries?.name_tr || booking.country_name,
        location_name_ka: booking.locations?.name_ka || booking.location_name,
        location_name_en: booking.locations?.name_en || booking.location_name,
        location_name_ru: booking.locations?.name_ru || booking.location_name,
        location_name_ar: booking.locations?.name_ar || booking.location_name,
        location_name_de: booking.locations?.name_de || booking.location_name,
        location_name_tr: booking.locations?.name_tr || booking.location_name,
        flight_type_name_ka: getFlightTypeName(booking.location_id, booking.flight_type_id, 'ka') || booking.flight_type_name,
        flight_type_name_en: getFlightTypeName(booking.location_id, booking.flight_type_id, 'en') || booking.flight_type_name,
        flight_type_name_ru: getFlightTypeName(booking.location_id, booking.flight_type_id, 'ru') || booking.flight_type_name,
        flight_type_name_ar: getFlightTypeName(booking.location_id, booking.flight_type_id, 'ar') || booking.flight_type_name,
        flight_type_name_de: getFlightTypeName(booking.location_id, booking.flight_type_id, 'de') || booking.flight_type_name,
        flight_type_name_tr: getFlightTypeName(booking.location_id, booking.flight_type_id, 'tr') || booking.flight_type_name,
      }));

      setBookings(transformedData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('messages.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;

    setCancellingId(selectedBookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', selectedBookingId)
        .eq('status', 'pending'); // Only allow cancelling pending bookings

      if (error) throw error;

      toast.success(t('messages.cancelSuccess'));
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('messages.cancelError'));
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };

  const handleRescheduleRequest = async () => {
    if (!rescheduleBookingId || !newDate) return;

    setIsSubmittingReschedule(true);
    try {
      // Create a reschedule request notification for admin/company
      const booking = bookings.find(b => b.id === rescheduleBookingId);
      if (!booking) throw new Error('Booking not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update booking with reschedule request in metadata or create notification
      const { error } = await supabase
        .rpc('create_notification', {
          p_recipient_id: user.id, // Will be changed to admin/company
          p_recipient_type: 'admin',
          p_type: 'reschedule_request',
          p_title: 'თარიღის გადატანის მოთხოვნა 📅',
          p_message: `${booking.full_name} - ${newDate} | მიზეზი: ${rescheduleReason || 'არ არის მითითებული'}`,
          p_booking_id: rescheduleBookingId,
          p_group_id: null,
          p_pilot_id: null,
          p_company_id: null,
          p_metadata: {
            requested_date: newDate,
            current_date: booking.selected_date,
            reason: rescheduleReason,
            requester_id: user.id
          }
        });

      if (error) throw error;

      toast.success(t('messages.rescheduleRequestSent') || 'თარიღის გადატანის მოთხოვნა გაიგზავნა');
      setShowRescheduleDialog(false);
      setRescheduleBookingId(null);
      setNewDate('');
      setRescheduleReason('');
    } catch (error) {
      console.error('Error submitting reschedule request:', error);
      toast.error(t('messages.rescheduleError') || 'მოთხოვნის გაგზავნა ვერ მოხერხდა');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: t('status.pending') },
      confirmed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: t('status.confirmed') },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: t('status.cancelled') },
      completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: t('status.completed') },
    };
    const badge = badges[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency === 'GEL') return '₾';
    if (currency === 'USD') return '$';
    return '€';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:pr-20 py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs 
          items={[
            { label: breadcrumbLabels[locale as Locale]?.home || 'Home', href: `/${locale}` },
            { label: breadcrumbLabels[locale as Locale]?.bookings || 'Bookings' }
          ]} 
        />
      </div>
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{t('title')}</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isRescheduled = (booking.reschedule_count || 0) > 0;
            
            return (
              <div key={booking.id} className="space-y-0">
                {/* Rescheduled Banner */}
                {isRescheduled && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-t-2xl text-sm bg-purple-50 dark:bg-purple-900/30 border border-b-0 border-purple-200 dark:border-purple-800">
                    <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-800 dark:text-purple-200 font-medium">
                      {t('rescheduled') || 'თარიღი გადატანილია'}
                    </span>
                    {booking.original_date && (
                      <span className="text-purple-600 dark:text-purple-400">
                        • {t('originalDate') || 'თავდაპირველი თარიღი'}: {new Date(booking.original_date).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US')}
                      </span>
                    )}
                  </div>
                )}
                
                <div
                  className={`bg-white dark:bg-black border border-gray-200 dark:border-white/20 ${isRescheduled ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'} p-6 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left: Booking Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getLocalizedName(booking, 'location_name')}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getLocalizedName(booking, 'country_name')} • {getLocalizedName(booking, 'flight_type_name')}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('fields.date')}:</span>{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(booking.selected_date).toLocaleDateString('ka-GE')}
                          </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('fields.people')}:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {booking.number_of_people}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('fields.contact')}:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {booking.phone}
                      </span>
                    </div>
                    {booking.contact_method && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('fields.method')}:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {booking.contact_method}
                        </span>
                      </div>
                    )}
                  </div>

                  {booking.promo_code && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('fields.promoCode')}:</span>{' '}
                      <span className="font-mono font-medium text-green-600 dark:text-green-400">
                        {booking.promo_code} (-{booking.promo_discount}%)
                      </span>
                    </div>
                  )}

                  {booking.special_requests && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('fields.comment')}:</span>{' '}
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {booking.special_requests}
                      </p>
                    </div>
                  )}

                  {/* Additional Services Section */}
                  {booking.additional_services && booking.additional_services.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                      <button
                        onClick={() => toggleBookingExpanded(booking.id)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Package className="w-4 h-4" />
                        {t('fields.additionalServices') || 'დამატებითი სერვისები'} ({booking.additional_services.length})
                        {expandedBookings.has(booking.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedBookings.has(booking.id) && (
                        <div className="mt-2 space-y-1">
                          {booking.additional_services.map((service, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1 px-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                              <span className="text-gray-700 dark:text-gray-300">
                                {service.name} {service.quantity > 1 && `×${service.quantity}`}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {(service.price_gel * service.quantity).toFixed(2)} ₾
                              </span>
                            </div>
                          ))}
                          {booking.services_total && (
                            <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-200 dark:border-white/10">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                {t('fields.servicesTotal') || 'სერვისების ჯამი'}:
                              </span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {booking.services_total.toFixed(2)} ₾
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col items-end gap-3 min-w-[180px]">
                  <div className="text-right">
                    {booking.promo_discount > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {booking.base_price.toFixed(2)} {getCurrencySymbol(booking.currency)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {booking.total_price.toFixed(2)} {getCurrencySymbol(booking.currency)}
                    </p>
                    {booking.services_total && booking.services_total > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        +{booking.services_total.toFixed(2)} ₾ {t('fields.services') || 'სერვისები'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(booking.created_at).toLocaleDateString('ka-GE')}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full">
                    {/* Reschedule Request Button - Only for pending/confirmed bookings */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => {
                          setRescheduleBookingId(booking.id);
                          setShowRescheduleDialog(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors text-sm font-medium w-full"
                      >
                        <CalendarClock className="w-4 h-4" />
                        {t('actions.reschedule') || 'თარიღის შეცვლა'}
                      </button>
                    )}

                    {/* Cancel Button - Only for pending bookings */}
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setShowCancelDialog(true);
                        }}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
                      >
                        {cancellingId === booking.id ? <Spinner size="sm" /> : t('actions.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleCancelBooking}
        title={t('dialog.title')}
        message={t('dialog.message')}
        confirmText={t('dialog.confirm')}
        cancelText={t('dialog.cancel')}
      />

      {/* Reschedule Request Dialog */}
      {showRescheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('rescheduleDialog.title') || 'თარიღის გადატანის მოთხოვნა'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('rescheduleDialog.newDate') || 'ახალი თარიღი'}
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('rescheduleDialog.reason') || 'მიზეზი (არასავალდებულო)'}
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={t('rescheduleDialog.reasonPlaceholder') || 'მიუთითეთ თარიღის შეცვლის მიზეზი...'}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRescheduleDialog(false);
                  setRescheduleBookingId(null);
                  setNewDate('');
                  setRescheduleReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t('rescheduleDialog.cancel') || 'გაუქმება'}
              </button>
              <button
                onClick={handleRescheduleRequest}
                disabled={!newDate || isSubmittingReschedule}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReschedule ? <Spinner size="sm" /> : (t('rescheduleDialog.submit') || 'მოთხოვნის გაგზავნა')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
