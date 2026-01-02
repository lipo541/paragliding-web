'use client';

import { useSuperAdminBooking } from '@/lib/context/SuperAdminBookingContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  UserX,
  DollarSign
} from 'lucide-react';

export default function SuperAdminBookingStats() {
  const { summary, filters, setFilters, isLoading } = useSuperAdminBooking();

  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    { 
      label: 'სულ', 
      value: summary.total_bookings, 
      icon: Calendar, 
      color: 'text-zinc-600 dark:text-zinc-400',
      status: 'all' as const 
    },
    { 
      label: 'მოლოდინში', 
      value: summary.pending_bookings, 
      icon: Clock, 
      color: 'text-yellow-600 dark:text-yellow-400',
      status: 'pending' as const 
    },
    { 
      label: 'დადასტურებული', 
      value: summary.confirmed_bookings, 
      icon: CheckCircle2, 
      color: 'text-blue-600 dark:text-blue-400',
      status: 'confirmed' as const 
    },
    { 
      label: 'დასრულებული', 
      value: summary.completed_bookings, 
      icon: CheckCircle2, 
      color: 'text-green-600 dark:text-green-400',
      status: 'completed' as const 
    },
    { 
      label: 'გაუქმებული', 
      value: summary.cancelled_bookings, 
      icon: XCircle, 
      color: 'text-red-600 dark:text-red-400',
      status: 'cancelled' as const 
    },
    { 
      label: 'შეჩერებული', 
      value: summary.on_hold_bookings, 
      icon: Pause, 
      color: 'text-orange-600 dark:text-orange-400',
      status: 'on_hold' as const 
    },
    { 
      label: 'No-Show', 
      value: summary.no_show_bookings, 
      icon: UserX, 
      color: 'text-gray-600 dark:text-gray-400',
      status: 'no_show' as const 
    },
    { 
      label: 'შემოსავალი', 
      value: summary.total_revenue, 
      icon: DollarSign, 
      color: 'text-emerald-600 dark:text-emerald-400',
      suffix: '₾',
      status: null 
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = stat.status && filters.status === stat.status;
        
        return (
          <button
            key={stat.label}
            onClick={() => stat.status && setFilters({ ...filters, status: stat.status })}
            disabled={!stat.status}
            title={stat.status ? `${stat.label} ჯავშნების ფილტრი` : undefined}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }
              ${stat.status ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <div className={`flex items-center gap-1.5 ${stat.color} mb-1`}>
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium truncate">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {stat.value.toLocaleString()}{stat.suffix || ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}
