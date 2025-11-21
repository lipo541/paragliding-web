'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  full_name: string;
  phone: string;
  country_name: string;
  location_name: string;
  flight_type_name: string;
  selected_date: string;
  number_of_people: number;
  contact_method: string | null;
  promo_code: string | null;
  promo_discount: number;
  special_requests: string | null;
  base_price: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('გთხოვთ გაიაროთ ავტორიზაცია');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('ჯავშნების ჩატვირთვა ვერ მოხერხდა');
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

      toast.success('ჯავშანი გაუქმდა');
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('ჯავშნის გაუქმება ვერ მოხერხდა');
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'მუშავდება' },
      confirmed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'დადასტურებული' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'გაუქმებული' },
      completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'დასრულებული' },
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
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">ჩემი ჯავშნები</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">თქვენ ჯერ არ გაქვთ ჯავშნები</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left: Booking Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.location_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.country_name} • {booking.flight_type_name}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">თარიღი:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(booking.selected_date).toLocaleDateString('ka-GE')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">ადამიანები:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {booking.number_of_people}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">კონტაქტი:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {booking.phone}
                      </span>
                    </div>
                    {booking.contact_method && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">მეთოდი:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {booking.contact_method}
                        </span>
                      </div>
                    )}
                  </div>

                  {booking.promo_code && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">პრომო კოდი:</span>{' '}
                      <span className="font-mono font-medium text-green-600 dark:text-green-400">
                        {booking.promo_code} (-{booking.promo_discount}%)
                      </span>
                    </div>
                  )}

                  {booking.special_requests && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">კომენტარი:</span>{' '}
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {booking.special_requests}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col items-end gap-4 min-w-[180px]">
                  <div className="text-right">
                    {booking.promo_discount > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {booking.base_price.toFixed(2)} {getCurrencySymbol(booking.currency)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {booking.total_price.toFixed(2)} {getCurrencySymbol(booking.currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(booking.created_at).toLocaleDateString('ka-GE')}
                    </p>
                  </div>

                  {/* Cancel Button - Only for pending bookings */}
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setShowCancelDialog(true);
                      }}
                      disabled={cancellingId === booking.id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingId === booking.id ? <Spinner size="sm" /> : 'გაუქმება'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
        title="ჯავშნის გაუქმება"
        message="დარწმუნებული ხართ, რომ გსურთ ამ ჯავშნის გაუქმება?"
        confirmText="დიახ, გაუქმება"
        cancelText="არა"
      />
    </div>
  );
}
