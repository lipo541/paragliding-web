'use client';

import React, { useState } from 'react';
import { useSuperAdminBooking, BookingWithRelations } from '@/lib/context/SuperAdminBookingContext';
import { DollarSign, X, CreditCard, AlertTriangle, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithRelations;
}

export function RefundDialog({ isOpen, onClose, booking }: RefundDialogProps) {
  const { refundBooking, isActionLoading } = useSuperAdminBooking();
  
  const depositAmount = booking.deposit_amount ?? 50;
  
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState(depositAmount);
  const [reason, setReason] = useState('');
  const [processStripeRefund, setProcessStripeRefund] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (refundAmount <= 0) {
      toast.error('დაბრუნების თანხა უნდა იყოს 0-ზე მეტი');
      return;
    }

    if (refundAmount > depositAmount) {
      toast.error('დაბრუნების თანხა არ შეიძლება აღემატებოდეს დეპოზიტს');
      return;
    }

    const success = await refundBooking({
      booking_id: booking.id,
      refund_type: refundType,
      refund_amount: refundType === 'full' ? depositAmount : refundAmount,
      reason: reason || 'ადმინის მიერ დაბრუნება',
      process_stripe_refund: processStripeRefund
    });

    if (success) {
      toast.success('თანხა დაბრუნებულია');
      onClose();
    } else {
      toast.error('დაბრუნება ვერ მოხერხდა');
    }
  };

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
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">თანხის დაბრუნება</h3>
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
          {/* Payment Info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-2">გადახდის ინფორმაცია</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">სულ თანხა</span>
                <span className="font-medium">{booking.total_price} {booking.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">გადახდილი დეპოზიტი</span>
                <span className="font-medium text-blue-600">{depositAmount} {booking.currency}</span>
              </div>
              {booking.refund_amount && booking.refund_amount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">უკვე დაბრუნებული</span>
                  <span className="font-medium text-purple-600">{booking.refund_amount} {booking.currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              დაბრუნების ტიპი
            </label>
            <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setRefundType('full');
                  setRefundAmount(depositAmount);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  refundType === 'full'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                სრული
              </button>
              <button
                type="button"
                onClick={() => setRefundType('partial')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  refundType === 'partial'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Percent className="w-4 h-4" />
                ნაწილობრივი
              </button>
            </div>
          </div>

          {/* Refund Amount (for partial) */}
          {refundType === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                დაბრუნების თანხა
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  min={1}
                  max={depositAmount}
                  step={1}
                  className="w-full pl-10 pr-12 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  {booking.currency}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                მაქსიმუმ: {depositAmount} {booking.currency}
              </p>
            </div>
          )}

          {/* Amount Preview */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">დასაბრუნებელი თანხა</span>
              <span className="text-lg font-bold text-emerald-600">
                {refundType === 'full' ? depositAmount : refundAmount} {booking.currency}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              მიზეზი
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="მაგ: კლიენტის მოთხოვნა, ამინდის გამო გაუქმება..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Stripe Option */}
          {booking.payment_status !== 'pending_deposit' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={processStripeRefund}
                onChange={(e) => setProcessStripeRefund(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Stripe-ზე ავტომატური დაბრუნება
              </span>
            </label>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              ეს მოქმედება შეუქცევადია. დარწმუნდით რომ თანხის დაბრუნება აუცილებელია.
            </p>
          </div>

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
              disabled={isActionLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isActionLoading ? 'იტვირთება...' : 'დაბრუნება'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default RefundDialog;
