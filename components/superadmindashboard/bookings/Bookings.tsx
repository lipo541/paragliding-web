'use client';

import React, { useEffect } from 'react';
import { SuperAdminBookingProvider, useSuperAdminBooking } from '@/lib/context/SuperAdminBookingContext';
import SuperAdminBookingStats from './SuperAdminBookingStats';
import SuperAdminBookingFilters from './SuperAdminBookingFilters';
import SuperAdminBookingList from './SuperAdminBookingList';

/**
 * SuperAdmin Booking Management Dashboard
 * 
 * კომპაქტური არქიტექტურა (PilotBookings სტილით):
 * - SuperAdminBookingContext: სტეითის მართვა, API ურთიერთქმედება
 * - SuperAdminBookingStats: კომპაქტური სტატისტიკის ბარათები
 * - SuperAdminBookingFilters: ინლაინ ფილტრები და ძებნა
 * - SuperAdminBookingList: BookingCard-ებით ჩვენება
 * 
 * ყველა მოქმედება (reschedule, refund, etc.) ხორციელდება BookingCard-ის dropdown მენიუდან
 */

function BookingsContent() {
  const { subscribeToBookings, unsubscribeFromBookings } = useSuperAdminBooking();

  // Subscribe to real-time updates on mount
  useEffect(() => {
    subscribeToBookings();
    return () => unsubscribeFromBookings();
  }, [subscribeToBookings, unsubscribeFromBookings]);

  return (
    <div className="space-y-4">
      {/* Header - compact */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          ჯავშნების მართვა
        </h2>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Statistics - compact single row */}
      <SuperAdminBookingStats />

      {/* Filters - inline */}
      <SuperAdminBookingFilters />

      {/* Bookings List - cards */}
      <SuperAdminBookingList />
    </div>
  );
}

/**
 * Main Bookings Component
 * Wraps content with SuperAdminBookingProvider for state management
 */
export default function Bookings() {
  return (
    <SuperAdminBookingProvider>
      <BookingsContent />
    </SuperAdminBookingProvider>
  );
}
