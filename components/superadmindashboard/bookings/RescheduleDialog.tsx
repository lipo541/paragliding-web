'use client';

import React, { useState } from 'react';
import { useSuperAdminBooking, BookingWithRelations } from '@/lib/context/SuperAdminBookingContext';
import { Calendar, X, RefreshCw, Bell, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithRelations;
}

export function RescheduleDialog({ isOpen, onClose, booking }: RescheduleDialogProps) {
  const { rescheduleBooking, isActionLoading } = useSuperAdminBooking();
  
  const [newDate, setNewDate] = useState(booking.selected_date);
  const [reason, setReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notifyPilot, setNotifyPilot] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDate) {
      toast.error('აირჩიეთ თარიღი');
      return;
    }

    if (newDate === booking.selected_date) {
      toast.error('ახალი თარიღი უნდა განსხვავდებოდეს არსებულისგან');
      return;
    }

    const success = await rescheduleBooking({
      booking_id: booking.id,
      new_date: newDate,
      reason: reason || 'მომხმარებლის მოთხოვნა',
      notify_customer: notifyCustomer,
      notify_pilot: notifyPilot,
      initiated_by: 'admin'
    });

    if (success) {
      toast.success('თარიღი გადატანილია');
      onClose();
    } else {
      toast.error('გადატანა ვერ მოხერხდა');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-xl z-[60] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">თარიღის გადატანა</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Current Date Info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">მიმდინარე თარიღი</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-white">
              {formatDate(booking.selected_date)}
            </div>
            {booking.reschedule_count && booking.reschedule_count > 0 && (
              <div className="text-xs text-purple-600 mt-1">
                უკვე გადატანილია {booking.reschedule_count} ჯერ
              </div>
            )}
          </div>

          {/* New Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              ახალი თარიღი
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={today}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              მიზეზი (არასავალდებულო)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="მაგ: კლიენტის მოთხოვნა, ამინდის პირობები..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Bell className="w-4 h-4" />
              შეტყობინებები
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">კლიენტის შეტყობინება</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyPilot}
                onChange={(e) => setNotifyPilot(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">პილოტის შეტყობინება</span>
            </label>
          </div>

          {/* Warning */}
          {booking.reschedule_count && booking.reschedule_count >= 2 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ეს ჯავშანი უკვე რამდენჯერმე გადატანილია. გთხოვთ დარწმუნდეთ რომ კლიენტი ინფორმირებულია.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isActionLoading || newDate === booking.selected_date}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isActionLoading ? 'იტვირთება...' : 'გადატანა'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default RescheduleDialog;
