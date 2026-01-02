'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  CreditCard,
  MessageCircle,
  User,
  Building2,
  Banknote,
  MoreVertical,
  RefreshCw,
  Pause,
  UserX,
  DollarSign,
  AlertTriangle,
  History,
  StickyNote,
  ExternalLink
} from 'lucide-react';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending_deposit' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'failed';
export type BookingSource = 'platform_general' | 'company_direct' | 'pilot_direct';

export interface BookingData {
  id: string;
  full_name: string;
  phone: string;
  location_name: string;
  country_name: string;
  flight_type_name: string;
  selected_date: string;
  number_of_people: number;
  contact_method: 'whatsapp' | 'telegram' | 'viber' | null;
  special_requests: string | null;
  promo_code: string | null;
  promo_discount: number;
  base_price: number;
  total_price: number;
  currency: string;
  status: BookingStatus;
  created_at: string;
  
  // Payment fields
  deposit_amount?: number;
  amount_due?: number;
  payment_status?: PaymentStatus;
  refund_status?: RefundStatus;
  refund_amount?: number;
  booking_source?: BookingSource;
  
  // Assignment
  pilot_id?: string | null;
  company_id?: string | null;
  pilot?: {
    id: string;
    first_name_ka?: string;
    first_name_en?: string;
    last_name_ka?: string;
    last_name_en?: string;
  } | null;
  company?: {
    id: string;
    name_ka?: string;
    name_en?: string;
  } | null;
  
  // SuperAdmin fields
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  internal_notes?: string;
  reschedule_count?: number;
  original_date?: string;
}

export type RefundStatus = 'none' | 'pending' | 'processed' | 'rejected' | 'partial';

interface BookingCardProps {
  booking: BookingData;
  locale?: string;
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  onAssignPilot?: (bookingId: string, pilotId: string) => void;
  onViewDetails?: (booking: BookingData) => void;
  availablePilots?: Array<{ id: string; name: string }>;
  showAssignPilot?: boolean;
  isProcessing?: boolean;
  compact?: boolean;
  
  // SuperAdmin props
  showAdminActions?: boolean;
  onReschedule?: (bookingId: string) => void;
  onRefund?: (bookingId: string) => void;
  onHold?: (bookingId: string) => void;
  onNoShow?: (bookingId: string) => void;
  onReassign?: (bookingId: string) => void;
  onViewHistory?: (bookingId: string) => void;
  onViewNotes?: (bookingId: string) => void;
  availableCompanies?: Array<{ id: string; name: string }>;
  onAssignCompany?: (bookingId: string, companyId: string) => void;
}

const translations = {
  ka: {
    pending: 'მომლოდინე',
    confirmed: 'დადასტურებული',
    cancelled: 'გაუქმებული',
    completed: 'დასრულებული',
    on_hold: 'შეჩერებული',
    no_show: 'არ გამოცხადდა',
    rescheduled: 'გადატანილი',
    pending_deposit: 'დეპოზიტი არ არის გადახდილი',
    deposit_paid: 'დეპოზიტი გადახდილი',
    fully_paid: 'სრულად გადახდილი',
    refunded: 'დაბრუნებული',
    failed: 'ჩაიშალა',
    platform_general: 'პლატფორმა',
    company_direct: 'კომპანია',
    pilot_direct: 'პილოტი',
    confirm: 'დადასტურება',
    cancel: 'გაუქმება',
    complete: 'დასრულება',
    details: 'დეტალები',
    assignPilot: 'პილოტის მინიჭება',
    selectPilot: 'აირჩიეთ პილოტი',
    people: 'ადამიანი',
    depositToPay: 'საკომისიო (პლატფორმა)',
    onSite: 'მისაღები ადგილზე',
    discount: 'ფასდაკლება',
    promoCode: 'პრომო კოდი',
    specialRequests: 'შენიშვნა',
    source: 'წყარო',
    assignedTo: 'მინიჭებული',
    unassigned: 'დაუნიშნავი',
    perPerson: 'თითო პერსონა',
    totalPrice: 'ჯამი',
    // SuperAdmin
    reschedule: 'გადატანა',
    rescheduleHint: 'თარიღის შეცვლა',
    refund: 'დაბრუნება',
    refundHint: 'დეპოზიტის დაბრუნება',
    hold: 'შეჩერება',
    holdHint: 'დროებით შეჩერება',
    noShow: 'No-Show',
    noShowHint: 'კლიენტი არ გამოცხადდა',
    reassign: 'გადანაწილება',
    reassignHint: 'პილოტის/კომპანიის შეცვლა',
    history: 'ისტორია',
    historyHint: 'ცვლილებების ისტორია',
    notes: 'შენიშვნები',
    notesHint: 'შიდა შენიშვნები',
    moreActions: 'სხვა მოქმედებები',
    priority: 'პრიორიტეტი',
    low: 'დაბალი',
    normal: 'ნორმალური', 
    high: 'მაღალი',
    urgent: 'სასწრაფო',
    rescheduled_times: 'გადატანილია',
    times: 'ჯერ',
    whatsapp: 'WhatsApp',
    call: 'დარეკვა',
  },
  en: {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    on_hold: 'On Hold',
    no_show: 'No Show',
    rescheduled: 'Rescheduled',
    pending_deposit: 'Deposit not paid',
    deposit_paid: 'Deposit paid',
    fully_paid: 'Fully paid',
    refunded: 'Refunded',
    failed: 'Failed',
    platform_general: 'Platform',
    company_direct: 'Company',
    pilot_direct: 'Pilot',
    confirm: 'Confirm',
    cancel: 'Cancel',
    complete: 'Complete',
    details: 'Details',
    assignPilot: 'Assign Pilot',
    selectPilot: 'Select Pilot',
    people: 'people',
    depositToPay: 'Platform fee',
    onSite: 'Amount to collect',
    discount: 'Discount',
    promoCode: 'Promo code',
    specialRequests: 'Note',
    source: 'Source',
    assignedTo: 'Assigned to',
    unassigned: 'Unassigned',
    perPerson: 'per person',
    totalPrice: 'Total',
    // SuperAdmin
    reschedule: 'Reschedule',
    rescheduleHint: 'Change booking date',
    refund: 'Refund',
    refundHint: 'Refund deposit',
    hold: 'Hold',
    holdHint: 'Put on hold temporarily',
    noShow: 'No-Show',
    noShowHint: 'Customer did not show up',
    reassign: 'Reassign',
    reassignHint: 'Change pilot/company',
    history: 'History',
    historyHint: 'View change history',
    notes: 'Notes',
    notesHint: 'Internal notes',
    moreActions: 'More actions',
    priority: 'Priority',
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    rescheduled_times: 'Rescheduled',
    times: 'times',
    whatsapp: 'WhatsApp',
    call: 'Call',
  },
};

export default function BookingCard({
  booking,
  locale = 'ka',
  onConfirm,
  onCancel,
  onComplete,
  onAssignPilot,
  onViewDetails,
  availablePilots,
  showAssignPilot = false,
  isProcessing = false,
  compact = false,
  // SuperAdmin props
  showAdminActions = false,
  onReschedule,
  onRefund,
  onHold,
  onNoShow,
  onReassign,
  onViewHistory,
  onViewNotes,
  availableCompanies,
  onAssignCompany,
}: BookingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPilotId, setSelectedPilotId] = useState<string>('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const t = translations[locale as keyof typeof translations] || translations.ka;

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const getStatusBadge = (status: BookingStatus) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      confirmed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      on_hold: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      no_show: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
      rescheduled: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      confirmed: <CheckCircle2 className="w-3 h-3" />,
      completed: <CheckCircle2 className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
      on_hold: <Pause className="w-3 h-3" />,
      no_show: <UserX className="w-3 h-3" />,
      rescheduled: <RefreshCw className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${styles[status] || styles.pending}`}>
        {icons[status] || icons.pending}
        {t[status as keyof typeof t] || status}
      </span>
    );
  };
  
  const getPaymentStatusBadge = (status?: PaymentStatus) => {
    if (!status) return null;
    const styles = {
      pending_deposit: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      deposit_paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      fully_paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
      refunded: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
        <CreditCard className="w-3 h-3" />
        {t[status]}
      </span>
    );
  };
  
  const getContactIcon = (method: string | null) => {
    if (!method) return <Phone className="w-4 h-4" />;
    const icons = {
      whatsapp: (
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      ),
      telegram: (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      viber: (
        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.398.002C9.473.028 5.331.344 2.823 2.908 1.089 4.658.197 7.03.056 9.735c-.14 2.706-.1 7.636 4.648 8.991h.003l-.002 2.622s-.033.85.526 1.022c.678.209 1.075-.44 1.722-1.14.356-.385.85-.95 1.223-1.382 3.367.288 5.953-.37 6.25-.476.685-.247 4.564-.798 5.196-6.499.652-5.905-.334-9.629-2.866-11.277C14.972.441 13.269.027 11.398.002z"/>
        </svg>
      ),
    };
    return icons[method as keyof typeof icons] || <Phone className="w-4 h-4" />;
  };
  
  const getSourceBadge = (source?: BookingSource) => {
    if (!source) return null;
    const styles = {
      platform_general: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
      company_direct: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      pilot_direct: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };
    const icons = {
      platform_general: <Plane className="w-3 h-3" />,
      company_direct: <Building2 className="w-3 h-3" />,
      pilot_direct: <User className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[source]}`}>
        {icons[source]}
        {t[source]}
      </span>
    );
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const depositAmount = booking.deposit_amount ?? 50;
  const amountDue = booking.amount_due ?? (booking.total_price - depositAmount);
  
  const getPilotName = () => {
    if (!booking.pilot) return null;
    if (locale === 'ka') {
      return `${booking.pilot.first_name_ka || ''} ${booking.pilot.last_name_ka || ''}`.trim();
    }
    return `${booking.pilot.first_name_en || booking.pilot.first_name_ka || ''} ${booking.pilot.last_name_en || booking.pilot.last_name_ka || ''}`.trim();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Customer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                {booking.full_name}
              </h3>
              {getStatusBadge(booking.status)}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                {getContactIcon(booking.contact_method)}
                {booking.phone}
              </span>
              {!compact && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {booking.number_of_people} {t.people}
                </span>
              )}
            </div>
          </div>
          
          {/* Right: Date & Price */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              <Calendar className="w-4 h-4" />
              {formatDate(booking.selected_date)}
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">
              {booking.total_price} {booking.currency}
            </div>
            {booking.promo_discount > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400">
                -{booking.promo_discount}%
              </div>
            )}
          </div>
        </div>
        
        {/* Location & Flight Type Row */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{booking.location_name}</span>
          </span>
          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <Plane className="w-4 h-4" />
            <span className="truncate">{booking.flight_type_name}</span>
          </span>
        </div>
        
        {/* Payment & Source Badges */}
        {!compact && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {getPaymentStatusBadge(booking.payment_status)}
            {getSourceBadge(booking.booking_source)}
            {booking.pilot && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <User className="w-3 h-3" />
                {getPilotName()}
              </span>
            )}
            {showAssignPilot && !booking.pilot_id && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <User className="w-3 h-3" />
                {t.unassigned}
              </span>
            )}
          </div>
        )}
        
        {/* Deposit Info */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-1">
              <span className="text-zinc-600 dark:text-zinc-400">{t.totalPrice}:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{booking.total_price} {booking.currency}</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-500 dark:text-zinc-500">{t.depositToPay}:</span>
              <span className="font-medium text-zinc-500">{depositAmount} {booking.currency}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span className="text-zinc-600 dark:text-zinc-400">{t.onSite}:</span>
              <span className="font-bold text-emerald-600 text-base">{amountDue} {booking.currency}</span>
            </div>
          </div>
        )}
        
        {/* Actions Row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {t.details}
            </button>
            
            {/* SuperAdmin Quick Actions - Contact */}
            {showAdminActions && (
              <div className="flex items-center gap-1 ml-2">
                <a
                  href={`https://wa.me/${booking.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t.whatsapp}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                <a
                  href={`tel:${booking.phone}`}
                  title={t.call}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Assign Pilot Dropdown */}
            {showAssignPilot && !booking.pilot_id && availablePilots && availablePilots.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedPilotId}
                  onChange={(e) => setSelectedPilotId(e.target.value)}
                  className="text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  disabled={isProcessing}
                >
                  <option value="">{t.selectPilot}</option>
                  {availablePilots.map((pilot) => (
                    <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => selectedPilotId && onAssignPilot?.(booking.id, selectedPilotId)}
                  disabled={!selectedPilotId || isProcessing}
                  className="text-xs px-2 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t.assignPilot}
                </button>
              </div>
            )}
            
            {/* Status Actions */}
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => onConfirm?.(booking.id)}
                  disabled={isProcessing}
                  title="დაადასტურეთ ეს ჯავშანი"
                  className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {t.confirm}
                </button>
                <button
                  onClick={() => onCancel?.(booking.id)}
                  disabled={isProcessing}
                  title="გააუქმეთ ეს ჯავშანი"
                  className="text-xs px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  {t.cancel}
                </button>
              </>
            )}
            
            {booking.status === 'confirmed' && (
              <>
                <button
                  onClick={() => onComplete?.(booking.id)}
                  disabled={isProcessing}
                  title="მონიშნეთ როგორც დასრულებული"
                  className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {t.complete}
                </button>
                <button
                  onClick={() => onCancel?.(booking.id)}
                  disabled={isProcessing}
                  title="გააუქმეთ ეს ჯავშანი"
                  className="text-xs px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  {t.cancel}
                </button>
              </>
            )}
            
            {/* SuperAdmin More Actions Menu */}
            {showAdminActions && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  title={t.moreActions}
                  className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 py-1">
                    {/* Reschedule */}
                    {['pending', 'confirmed', 'rescheduled'].includes(booking.status) && onReschedule && (
                      <button
                        onClick={() => { onReschedule(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.rescheduleHint}
                      >
                        <RefreshCw className="w-4 h-4 text-purple-500" />
                        {t.reschedule}
                      </button>
                    )}
                    
                    {/* Hold */}
                    {['pending', 'confirmed'].includes(booking.status) && onHold && (
                      <button
                        onClick={() => { onHold(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.holdHint}
                      >
                        <Pause className="w-4 h-4 text-orange-500" />
                        {t.hold}
                      </button>
                    )}
                    
                    {/* No-Show */}
                    {['confirmed', 'rescheduled'].includes(booking.status) && onNoShow && (
                      <button
                        onClick={() => { onNoShow(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.noShowHint}
                      >
                        <UserX className="w-4 h-4 text-gray-500" />
                        {t.noShow}
                      </button>
                    )}
                    
                    {/* Reassign */}
                    {onReassign && (
                      <button
                        onClick={() => { onReassign(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.reassignHint}
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        {t.reassign}
                      </button>
                    )}
                    
                    {/* Refund */}
                    {booking.payment_status === 'deposit_paid' && booking.refund_status !== 'processed' && onRefund && (
                      <button
                        onClick={() => { onRefund(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.refundHint}
                      >
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        {t.refund}
                      </button>
                    )}
                    
                    <div className="border-t border-zinc-100 dark:border-zinc-700 my-1" />
                    
                    {/* Notes */}
                    {onViewNotes && (
                      <button
                        onClick={() => { onViewNotes(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.notesHint}
                      >
                        <StickyNote className="w-4 h-4 text-zinc-500" />
                        {t.notes}
                      </button>
                    )}
                    
                    {/* History */}
                    {onViewHistory && (
                      <button
                        onClick={() => { onViewHistory(booking.id); setShowMoreMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        title={t.historyHint}
                      >
                        <History className="w-4 h-4 text-zinc-500" />
                        {t.history}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Priority Badge - SuperAdmin */}
        {showAdminActions && booking.priority && booking.priority !== 'normal' && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
              booking.priority === 'urgent' ? 'bg-red-500/10 text-red-600' :
              booking.priority === 'high' ? 'bg-orange-500/10 text-orange-600' :
              'bg-zinc-500/10 text-zinc-600'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {t[booking.priority]}
            </span>
            {booking.reschedule_count && booking.reschedule_count > 0 && (
              <span className="text-xs text-zinc-500">
                {t.rescheduled_times} {booking.reschedule_count} {t.times}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Special Requests */}
            {booking.special_requests && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                  <MessageCircle className="w-4 h-4" />
                  {t.specialRequests}
                </div>
                <p className="text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 rounded-lg p-2">
                  {booking.special_requests}
                </p>
              </div>
            )}
            
            {/* Promo Code */}
            {booking.promo_code && (
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-1">{t.promoCode}</div>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  {booking.promo_code} (-{booking.promo_discount}%)
                </p>
              </div>
            )}
            
            {/* Base Price */}
            <div>
              <div className="text-zinc-500 dark:text-zinc-400 mb-1">Base Price</div>
              <p className="text-zinc-900 dark:text-white">
                {booking.base_price} {booking.currency}
              </p>
            </div>
            
            {/* Source */}
            {booking.booking_source && (
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-1">{t.source}</div>
                <div>{getSourceBadge(booking.booking_source)}</div>
              </div>
            )}
            
            {/* Assigned Pilot */}
            {booking.pilot && (
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-1">{t.assignedTo}</div>
                <p className="text-zinc-900 dark:text-white">{getPilotName()}</p>
              </div>
            )}
            
            {/* Assigned Company - SuperAdmin */}
            {showAdminActions && booking.company && (
              <div>
                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  კომპანია
                </div>
                <p className="text-zinc-900 dark:text-white">
                  {locale === 'ka' ? booking.company.name_ka : (booking.company.name_en || booking.company.name_ka)}
                </p>
              </div>
            )}
            
            {/* Created At */}
            <div>
              <div className="text-zinc-500 dark:text-zinc-400 mb-1">Created</div>
              <p className="text-zinc-900 dark:text-white">
                {new Date(booking.created_at).toLocaleString(locale === 'ka' ? 'ka-GE' : 'en-US')}
              </p>
            </div>
            
            {/* Internal Notes - SuperAdmin */}
            {showAdminActions && booking.internal_notes && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                  <StickyNote className="w-4 h-4" />
                  შიდა შენიშვნა
                </div>
                <p className="text-zinc-900 dark:text-white bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-sm">
                  {booking.internal_notes}
                </p>
              </div>
            )}
            
            {/* Tags - SuperAdmin */}
            {showAdminActions && booking.tags && booking.tags.length > 0 && (
              <div className="sm:col-span-2">
                <div className="text-zinc-500 dark:text-zinc-400 mb-1">ტეგები</div>
                <div className="flex flex-wrap gap-1">
                  {booking.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
