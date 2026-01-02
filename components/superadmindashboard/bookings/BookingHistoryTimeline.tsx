'use client';

import React from 'react';
import { useSuperAdminBooking } from '@/lib/context/SuperAdminBookingContext';
import { 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  User, 
  CreditCard,
  Pause,
  UserX,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  AlertTriangle
} from 'lucide-react';

export function BookingHistoryTimeline() {
  const { bookingHistory } = useSuperAdminBooking();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ka-GE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, React.ReactNode> = {
      created: <Clock className="w-3.5 h-3.5 text-blue-500" />,
      confirmed: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
      cancelled: <XCircle className="w-3.5 h-3.5 text-red-500" />,
      completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      rescheduled: <RefreshCw className="w-3.5 h-3.5 text-purple-500" />,
      reassigned: <User className="w-3.5 h-3.5 text-indigo-500" />,
      refunded: <DollarSign className="w-3.5 h-3.5 text-orange-500" />,
      on_hold: <Pause className="w-3.5 h-3.5 text-amber-500" />,
      no_show: <UserX className="w-3.5 h-3.5 text-gray-500" />,
      payment_updated: <CreditCard className="w-3.5 h-3.5 text-blue-500" />,
      pilot_assigned: <User className="w-3.5 h-3.5 text-indigo-500" />,
      company_assigned: <Building2 className="w-3.5 h-3.5 text-indigo-500" />,
      date_changed: <Calendar className="w-3.5 h-3.5 text-purple-500" />,
      priority_changed: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
      tags_updated: <Tag className="w-3.5 h-3.5 text-cyan-500" />,
    };
    return icons[actionType] || <History className="w-3.5 h-3.5 text-zinc-500" />;
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      created: 'ჯავშანი შეიქმნა',
      confirmed: 'ჯავშანი დადასტურდა',
      cancelled: 'ჯავშანი გაუქმდა',
      completed: 'ჯავშანი დასრულდა',
      rescheduled: 'თარიღი შეიცვალა',
      reassigned: 'გადანაწილდა',
      refunded: 'თანხა დაბრუნდა',
      on_hold: 'შეჩერდა',
      no_show: 'No-Show მონიშნულია',
      payment_updated: 'გადახდის სტატუსი შეიცვალა',
      pilot_assigned: 'პილოტი მიენიჭა',
      company_assigned: 'კომპანია მიენიჭა',
      date_changed: 'თარიღი შეიცვალა',
      priority_changed: 'პრიორიტეტი შეიცვალა',
      tags_updated: 'ტეგები განახლდა',
    };
    return labels[actionType] || actionType;
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      created: 'border-blue-200 dark:border-blue-800',
      confirmed: 'border-green-200 dark:border-green-800',
      cancelled: 'border-red-200 dark:border-red-800',
      completed: 'border-emerald-200 dark:border-emerald-800',
      rescheduled: 'border-purple-200 dark:border-purple-800',
      reassigned: 'border-indigo-200 dark:border-indigo-800',
      refunded: 'border-orange-200 dark:border-orange-800',
      on_hold: 'border-amber-200 dark:border-amber-800',
      no_show: 'border-gray-200 dark:border-gray-700',
    };
    return colors[actionType] || 'border-zinc-200 dark:border-zinc-700';
  };

  if (bookingHistory.length === 0) {
    return (
      <div className="text-center py-6">
        <History className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">ისტორია ცარიელია</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
        <History className="w-4 h-4" />
        ისტორია ({bookingHistory.length})
      </h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Timeline Items */}
        <div className="space-y-3">
          {bookingHistory.map((entry, index) => (
            <div key={entry.id} className="relative flex gap-3">
              {/* Dot */}
              <div className={`relative z-10 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border-2 ${getActionColor(entry.action)} flex items-center justify-center flex-shrink-0`}>
                {getActionIcon(entry.action)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-3">
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {getActionLabel(entry.action)}
                      </p>
                      {entry.reason && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {entry.reason}
                        </p>
                      )}
                      {entry.old_value && entry.new_value && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          <span className="line-through text-zinc-400">{JSON.stringify(entry.old_value)}</span>
                          {' → '}
                          <span className="text-zinc-700 dark:text-zinc-300">{JSON.stringify(entry.new_value)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.changed_by_name || 'System'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookingHistoryTimeline;
