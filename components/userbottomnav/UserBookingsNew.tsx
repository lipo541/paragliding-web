'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Plane,
  Package,
  RefreshCw,
  CalendarClock,
  MoreVertical,
  Filter,
  Search,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Breadcrumbs, { breadcrumbLabels, type Locale } from '@/components/shared/Breadcrumbs';

// =====================================================
// Types
// =====================================================
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
  services_total: number | null;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  reschedule_count?: number;
  original_date?: string;
  reschedule_reason?: string;
  additional_services?: AdditionalServiceItem[] | null;
  pilot?: { first_name_ka?: string; first_name_en?: string } | null;
  company?: { name_ka?: string; name_en?: string } | null;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed';

// =====================================================
// Status Badge Component
// =====================================================
const StatusBadge = ({ status, locale }: { status: Booking['status']; locale: string }) => {
  const statusConfig = {
    pending: { 
      bg: 'bg-amber-100 dark:bg-amber-500/20', 
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/30',
      icon: Clock,
      label: { ka: 'მომლოდინე', en: 'Pending', ru: 'В ожидании' }
    },
    confirmed: { 
      bg: 'bg-emerald-100 dark:bg-emerald-500/20', 
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      icon: CheckCircle2,
      label: { ka: 'დადასტურებული', en: 'Confirmed', ru: 'Подтвержден' }
    },
    cancelled: { 
      bg: 'bg-red-100 dark:bg-red-500/20', 
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-500/30',
      icon: XCircle,
      label: { ka: 'გაუქმებული', en: 'Cancelled', ru: 'Отменен' }
    },
    completed: { 
      bg: 'bg-blue-100 dark:bg-blue-500/20', 
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-500/30',
      icon: CheckCircle2,
      label: { ka: 'დასრულებული', en: 'Completed', ru: 'Завершен' }
    },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  const label = config.label[locale as keyof typeof config.label] || config.label.en;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// =====================================================
// Booking Card Component (Compact)
// =====================================================
interface BookingCardProps {
  booking: Booking;
  locale: string;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  isCancelling: boolean;
}

const UserBookingCard = ({ booking, locale, onCancel, onReschedule, isCancelling }: BookingCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const isRescheduled = (booking.reschedule_count || 0) > 0;
  const hasServices = booking.additional_services && booking.additional_services.length > 0;
  
  const getCurrencySymbol = (currency: string) => {
    if (currency === 'GEL') return '₾';
    if (currency === 'USD') return '$';
    return '€';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const canCancel = booking.status === 'pending';
  const canReschedule = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="group relative">
      {/* Rescheduled Badge */}
      {isRescheduled && (
        <div className="absolute -top-2 left-4 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
            <RefreshCw className="w-2.5 h-2.5" />
            {locale === 'ka' ? 'გადატანილი' : 'Rescheduled'}
          </span>
        </div>
      )}
      
      <div className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#4697D2]/30 ${isRescheduled ? 'mt-2' : ''}`}>
        {/* Main Content */}
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Left: Icon */}
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-[#4697D2]/20 to-[#4697D2]/5 dark:from-[#4697D2]/30 dark:to-[#4697D2]/10 items-center justify-center flex-shrink-0">
              <Plane className="w-5 h-5 text-[#4697D2]" />
            </div>
            
            {/* Center: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {booking.location_name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {booking.flight_type_name}
                  </p>
                </div>
                <StatusBadge status={booking.status} locale={locale} />
              </div>
              
              {/* Details Grid */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                    {formatDate(booking.selected_date)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Users className="w-3 h-3 text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {booking.number_of_people} {locale === 'ka' ? 'ადამიანი' : 'people'}
                  </span>
                </div>
                {booking.contact_method && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-600 dark:text-zinc-300 capitalize">
                      {booking.contact_method}
                    </span>
                  </div>
                )}
              </div>

              {/* Price Row */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {getCurrencySymbol(booking.currency)}{booking.total_price.toFixed(0)}
                  </span>
                  {booking.promo_discount > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      -{booking.promo_discount}%
                    </span>
                  )}
                  {hasServices && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      +{locale === 'ka' ? 'სერვისები' : 'services'}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {hasServices && (
                    <button
                      type="button"
                      onClick={() => setExpanded(!expanded)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                    >
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      )}
                    </button>
                  )}
                  
                  {(canCancel || canReschedule) && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-zinc-500" />
                      </button>
                      
                      {showActions && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowActions(false)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 overflow-hidden">
                            {canReschedule && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowActions(false);
                                  onReschedule(booking.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                              >
                                <CalendarClock className="w-4 h-4 text-blue-500" />
                                {locale === 'ka' ? 'თარიღის შეცვლა' : 'Reschedule'}
                              </button>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowActions(false);
                                  onCancel(booking.id);
                                }}
                                disabled={isCancelling}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              >
                                {isCancelling ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Services */}
        {expanded && hasServices && (
          <div className="px-3 sm:px-4 pb-3 border-t border-zinc-100 dark:border-white/5">
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                <Package className="w-3 h-3" />
                {locale === 'ka' ? 'დამატებითი სერვისები' : 'Additional Services'}
              </div>
              {booking.additional_services!.map((service, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] py-1.5 px-2 bg-zinc-50 dark:bg-white/5 rounded-lg">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {service.name} {service.quantity > 1 && `×${service.quantity}`}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    ₾{(service.price_gel * service.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
              {booking.services_total && (
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-zinc-200 dark:border-white/10">
                  <span className="font-medium text-zinc-500">
                    {locale === 'ka' ? 'სერვისების ჯამი' : 'Services Total'}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ₾{booking.services_total.toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Special Requests */}
        {booking.special_requests && (
          <div className="px-3 sm:px-4 pb-3 border-t border-zinc-100 dark:border-white/5">
            <div className="pt-2">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                "{booking.special_requests}"
              </p>
            </div>
          </div>
        )}
        
        {/* Footer: Created Date */}
        <div className="px-3 sm:px-4 py-2 bg-zinc-50/50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>{locale === 'ka' ? 'შეიქმნა' : 'Created'}: {formatDate(booking.created_at)}</span>
            {booking.pilot && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.pilot.first_name_ka || booking.pilot.first_name_en}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Stats Component
// =====================================================
const BookingStats = ({ bookings, locale }: { bookings: Booking[]; locale: string }) => {
  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  }), [bookings]);

  const labels = {
    total: { ka: 'სულ', en: 'Total' },
    pending: { ka: 'მომლოდინე', en: 'Pending' },
    confirmed: { ka: 'დადასტურებული', en: 'Confirmed' },
    completed: { ka: 'დასრულებული', en: 'Completed' },
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl p-2.5 border border-zinc-200/50 dark:border-white/10 text-center">
          <div className="text-xl font-bold text-zinc-900 dark:text-white">{value}</div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
            {labels[key as keyof typeof labels][locale as 'ka' | 'en'] || labels[key as keyof typeof labels].en}
          </div>
        </div>
      ))}
    </div>
  );
};

// =====================================================
// Filter Component
// =====================================================
const BookingFilters = ({ 
  filter, 
  setFilter,
  search,
  setSearch,
  locale 
}: { 
  filter: FilterStatus;
  setFilter: (f: FilterStatus) => void;
  search: string;
  setSearch: (s: string) => void;
  locale: string;
}) => {
  const filters: { value: FilterStatus; label: { ka: string; en: string } }[] = [
    { value: 'all', label: { ka: 'ყველა', en: 'All' } },
    { value: 'pending', label: { ka: 'მომლოდინე', en: 'Pending' } },
    { value: 'confirmed', label: { ka: 'დადასტურებული', en: 'Confirmed' } },
    { value: 'completed', label: { ka: 'დასრულებული', en: 'Completed' } },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === 'ka' ? 'ძებნა...' : 'Search...'}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4697D2]/50 placeholder:text-zinc-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
          </button>
        )}
      </div>
      
      {/* Filter Pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
        {filters.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-[#4697D2] text-white shadow-md'
                : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            {f.label[locale as 'ka' | 'en'] || f.label.en}
          </button>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// Reschedule Modal
// =====================================================
const RescheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  locale
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, reason: string) => void;
  isSubmitting: boolean;
  locale: string;
}) => {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-5 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-5 h-5 text-zinc-500" />
        </button>
        
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#4697D2]" />
          {locale === 'ka' ? 'თარიღის გადატანის მოთხოვნა' : 'Reschedule Request'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {locale === 'ka' ? 'ახალი თარიღი' : 'New Date'}
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-[#4697D2]/50 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {locale === 'ka' ? 'მიზეზი (არასავალდებულო)' : 'Reason (optional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-[#4697D2]/50 focus:border-transparent resize-none"
              placeholder={locale === 'ka' ? 'მიუთითეთ მიზეზი...' : 'Enter reason...'}
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(newDate, reason)}
            disabled={!newDate || isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#4697D2] text-white rounded-xl hover:bg-[#3a7bb0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {locale === 'ka' ? 'გაგზავნა' : 'Submit'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Confirm Dialog
// =====================================================
const ConfirmCancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  locale
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  locale: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-zinc-200 dark:border-zinc-700">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
            {locale === 'ka' ? 'ჯავშნის გაუქმება' : 'Cancel Booking'}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
            {locale === 'ka' 
              ? 'ნამდვილად გსურთ ჯავშნის გაუქმება? ეს მოქმედება შეუქცევადია.'
              : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {locale === 'ka' ? 'არა' : 'No'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {locale === 'ka' ? 'დიახ, გაუქმება' : 'Yes, Cancel'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Main Component
// =====================================================
export default function UserBookingsNew() {
  const pathname = usePathname();
  const locale = useMemo(() => pathname.split('/')[1] || 'ka', [pathname]);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  
  // Modal states
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const supabase = createClient();

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          countries:country_id (name_ka, name_en),
          locations:location_id (name_ka, name_en),
          pilot:pilots!bookings_pilot_id_fkey (first_name_ka, first_name_en),
          company:companies!bookings_company_id_fkey (name_ka, name_en)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform with localized names
      const transformed = (data || []).map((b: any) => ({
        ...b,
        country_name: b.countries?.[`name_${locale}`] || b.countries?.name_en || b.country_name,
        location_name: b.locations?.[`name_${locale}`] || b.locations?.name_en || b.location_name,
      }));

      setBookings(transformed);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(locale === 'ka' ? 'ჯავშნების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, locale]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    if (filter !== 'all') {
      result = result.filter(b => b.status === filter);
    }
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(b => 
        b.location_name.toLowerCase().includes(s) ||
        b.flight_type_name.toLowerCase().includes(s) ||
        b.full_name.toLowerCase().includes(s)
      );
    }
    
    return result;
  }, [bookings, filter, search]);

  // Handle cancel
  const handleCancel = async () => {
    if (!cancelBookingId) return;
    
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancelBookingId)
        .eq('status', 'pending');

      if (error) throw error;
      
      toast.success(locale === 'ka' ? 'ჯავშანი გაუქმდა' : 'Booking cancelled');
      fetchBookings();
    } catch (error) {
      console.error('Error:', error);
      toast.error(locale === 'ka' ? 'გაუქმება ვერ მოხერხდა' : 'Failed to cancel');
    } finally {
      setIsCancelling(false);
      setCancelBookingId(null);
    }
  };

  // Handle reschedule
  const handleReschedule = async (newDate: string, reason: string) => {
    if (!rescheduleBookingId) return;
    
    setIsRescheduling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const booking = bookings.find(b => b.id === rescheduleBookingId);
      if (!booking) throw new Error('Booking not found');

      await supabase.rpc('create_notification', {
        p_recipient_id: user.id,
        p_recipient_type: 'admin',
        p_type: 'reschedule_request',
        p_title: 'თარიღის გადატანის მოთხოვნა 📅',
        p_message: `${booking.full_name} - ${newDate}`,
        p_booking_id: rescheduleBookingId,
        p_group_id: null,
        p_pilot_id: null,
        p_company_id: null,
        p_metadata: {
          requested_date: newDate,
          current_date: booking.selected_date,
          reason: reason,
          requester_id: user.id
        }
      });

      toast.success(locale === 'ka' ? 'მოთხოვნა გაიგზავნა' : 'Request sent');
    } catch (error) {
      console.error('Error:', error);
      toast.error(locale === 'ka' ? 'გაგზავნა ვერ მოხერხდა' : 'Failed to send');
    } finally {
      setIsRescheduling(false);
      setRescheduleBookingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#4697D2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs 
          items={[
            { label: breadcrumbLabels[locale as Locale]?.home || 'Home', href: `/${locale}` },
            { label: locale === 'ka' ? 'ჩემი ჯავშნები' : 'My Bookings' }
          ]} 
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          {locale === 'ka' ? 'ჩემი ჯავშნები' : 'My Bookings'}
        </h1>
        <button
          type="button"
          onClick={() => fetchBookings()}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Stats */}
      <BookingStats bookings={bookings} locale={locale} />

      {/* Filters */}
      <div className="mt-4 mb-4">
        <BookingFilters 
          filter={filter} 
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          locale={locale}
        />
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/50 dark:border-white/10">
          <Plane className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">
            {search || filter !== 'all'
              ? (locale === 'ka' ? 'ჯავშნები ვერ მოიძებნა' : 'No bookings found')
              : (locale === 'ka' ? 'ჯავშნები არ გაქვთ' : 'No bookings yet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <UserBookingCard
              key={booking.id}
              booking={booking}
              locale={locale}
              onCancel={(id) => setCancelBookingId(id)}
              onReschedule={(id) => setRescheduleBookingId(id)}
              isCancelling={isCancelling && cancelBookingId === booking.id}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ConfirmCancelModal
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancel}
        isProcessing={isCancelling}
        locale={locale}
      />

      <RescheduleModal
        isOpen={!!rescheduleBookingId}
        onClose={() => setRescheduleBookingId(null)}
        onSubmit={handleReschedule}
        isSubmitting={isRescheduling}
        locale={locale}
      />
    </div>
  );
}
