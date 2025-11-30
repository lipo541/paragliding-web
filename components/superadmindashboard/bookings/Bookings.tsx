'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/ui';

interface Booking {
  id: string;
  full_name: string;
  phone: string;
  selected_date: string;
  number_of_people: number;
  contact_method: string;
  promo_code?: string;
  promo_discount: number;
  special_requests?: string;
  location_name: string;
  country_name: string;
  flight_type_name: string;
  base_price: number;
  total_price: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; bookingId: string | null; bookingName: string }>({
    isOpen: false,
    bookingId: null,
    bookingName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings
      fetchBookings();
      setDeleteConfirm({ isOpen: false, bookingId: null, bookingName: '' });
    } catch (error) {
      console.error('Error deleting booking:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch =
      booking.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm) ||
      booking.location_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };

    const labels = {
      pending: 'მოლოდინში',
      confirmed: 'დადასტურებული',
      cancelled: 'გაუქმებული',
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'whatsapp':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        );
      case 'telegram':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        );
      case 'viber':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.398.002C9.473.028 5.331.344 2.823 2.908 1.089 4.658.197 7.03.056 9.735c-.14 2.706-.1 7.636 4.648 8.991h.003l-.002 2.622s-.033.85.526 1.022c.678.209 1.075-.44 1.722-1.14.356-.385.85-.95 1.223-1.382 3.367.288 5.953-.37 6.25-.476 .685-.247 4.564-.798 5.196-6.499.652-5.905-.334-9.629-2.866-11.277C14.972.441 13.269.027 11.398.002z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ძებნა სახელით, ტელეფონით, ლოკაციით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            ყველა
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            მოლოდინში
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'confirmed'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            დადასტურებული
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            გაუქმებული
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">სულ ჯავშნები</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{bookings.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">მოლოდინში</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {bookings.filter((b) => b.status === 'pending').length}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">დადასტურებული</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {bookings.filter((b) => b.status === 'confirmed').length}
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  კლიენტი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ლოკაცია
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ფრენის ტიპი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  თარიღი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ადამიანები
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ფასი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  სტატუსი
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {filteredBookings.map((booking) => (
                <React.Fragment key={booking.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.full_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {getContactIcon(booking.contact_method)}
                        {booking.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{booking.location_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{booking.country_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {booking.flight_type_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(booking.selected_date).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {booking.number_of_people}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {booking.total_price} {booking.currency}
                      </div>
                      {booking.promo_discount > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          -{booking.promo_discount}% ({booking.promo_code})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          title="დეტალების ნახვა"
                        >
                          <svg 
                            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${expandedBookingId === booking.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <select
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-white/20 rounded bg-white dark:bg-black text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">მოლოდინში</option>
                          <option value="confirmed">დადასტურება</option>
                          <option value="cancelled">გაუქმება</option>
                        </select>
                        <button
                          onClick={() => setDeleteConfirm({ 
                            isOpen: true, 
                            bookingId: booking.id, 
                            bookingName: `${booking.full_name} - ${booking.location_name}` 
                          })}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="წაშლა"
                        >
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedBookingId === booking.id && (
                    <tr className="bg-gray-50 dark:bg-gray-900/30">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">დამატებითი ინფორმაცია</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {booking.special_requests && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">დამატებითი შენიშვნები:</p>
                                <p className="text-sm text-gray-900 dark:text-white">{booking.special_requests}</p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">შექმნის თარიღი:</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {new Date(booking.created_at).toLocaleString('ka-GE')}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ბაზის ფასი:</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {booking.base_price} {booking.currency}
                              </p>
                            </div>
                            
                            {booking.promo_code && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">გამოყენებული პრომო კოდი:</p>
                                <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                  {booking.promo_code} (-{booking.promo_discount}%)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">ჯავშნები არ მოიძებნა</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, bookingId: null, bookingName: '' })}
        onConfirm={() => deleteConfirm.bookingId && deleteBooking(deleteConfirm.bookingId)}
        title="ჯავშნის წაშლა"
        message={`დარწმუნებული ხართ, რომ გსურთ წაშალოთ ეს ჯავშანი?\n\n"${deleteConfirm.bookingName}"\n\nეს მოქმედება შეუქცევადია.`}
        confirmText={isDeleting ? 'იშლება...' : 'წაშლა'}
        cancelText="გაუქმება"
        variant="danger"
      />
    </div>
  );
}
