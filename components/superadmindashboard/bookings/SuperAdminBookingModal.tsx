'use client';

import React, { useState, useEffect } from 'react';
import { useSuperAdminBooking, BookingWithRelations } from '@/lib/context/SuperAdminBookingContext';
import { BookingNotesSection } from './BookingNotesSection';
import { BookingHistoryTimeline } from './BookingHistoryTimeline';
import { RescheduleDialog } from './RescheduleDialog';
import { ReassignDialog } from './ReassignDialog';
import { RefundDialog } from './RefundDialog';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Phone,
  CreditCard,
  User,
  Building2,
  Plane,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pause,
  UserX,
  RefreshCw,
  MessageCircle,
  History,
  StickyNote,
  DollarSign,
  Banknote,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SuperAdminBookingModalProps {
  booking: BookingWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

type ActiveSection = 'details' | 'notes' | 'history' | 'actions';

export default function SuperAdminBookingModal({ booking, isOpen, onClose }: SuperAdminBookingModalProps) {
  const {
    bookingNotes,
    bookingHistory,
    fetchBookingNotes,
    fetchBookingHistory,
    updateBookingStatus,
    isActionLoading
  } = useSuperAdminBooking();

  const [activeSection, setActiveSection] = useState<ActiveSection>('details');
  const [showReschedule, setShowReschedule] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    booking: true,
    payment: false,
    assignment: false
  });

  useEffect(() => {
    if (isOpen && booking) {
      fetchBookingNotes(booking.id);
      fetchBookingHistory(booking.id);
    }
  }, [isOpen, booking, fetchBookingNotes, fetchBookingHistory]);

  if (!isOpen || !booking) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-600 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
      on_hold: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      no_show: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      rescheduled: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
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
    const labels: Record<string, string> = {
      pending: 'მომლოდინე',
      confirmed: 'დადასტურებული',
      completed: 'დასრულებული',
      cancelled: 'გაუქმებული',
      on_hold: 'შეჩერებული',
      no_show: 'არ გამოცხადდა',
      rescheduled: 'გადატანილი',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${styles[status] || styles.pending}`}>
        {icons[status] || icons.pending}
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      low: 'დაბალი',
      normal: 'ნორმალური',
      high: 'მაღალი',
      urgent: 'სასწრაფო',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${styles[priority]}`}>
        {priority === 'urgent' && <AlertTriangle className="w-3 h-3" />}
        {labels[priority] || priority}
      </span>
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} დაკოპირდა`);
  };

  const handleStatusChange = async (newStatus: string) => {
    const success = await updateBookingStatus(booking.id, newStatus as any);
    if (success) {
      toast.success('სტატუსი განახლდა');
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const depositAmount = booking.deposit_amount ?? 50;
  const amountDue = booking.amount_due ?? (booking.total_price - depositAmount);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Side Sheet Style */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-900 z-50 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                {booking.full_name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {getStatusBadge(booking.status)}
                {getPriorityBadge(booking.priority)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs - Compact */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-2">
          {[
            { id: 'details', label: 'დეტალები', icon: User },
            { id: 'notes', label: 'შენიშვნები', icon: StickyNote, count: bookingNotes.length },
            { id: 'history', label: 'ისტორია', icon: History, count: bookingHistory.length },
            { id: 'actions', label: 'მოქმედებები', icon: RefreshCw },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as ActiveSection)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeSection === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-200 dark:bg-zinc-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === 'details' && (
            <div className="p-4 space-y-3">
              {/* Customer Section */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('customer')}
                  className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4 text-zinc-500" />
                    კლიენტი
                  </span>
                  {expandedSections.customer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.customer && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">სახელი</span>
                      <span className="font-medium flex items-center gap-1">
                        {booking.full_name}
                        <button 
                          onClick={() => copyToClipboard(booking.full_name, 'სახელი')}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        >
                          <Copy className="w-3 h-3 text-zinc-400" />
                        </button>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">ტელეფონი</span>
                      <span className="font-medium flex items-center gap-1">
                        {booking.phone}
                        <a 
                          href={`tel:${booking.phone}`}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-blue-500"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a 
                          href={`https://wa.me/${booking.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-green-500"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </span>
                    </div>
                    {booking.contact_method && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">კონტაქტის მეთოდი</span>
                        <span className="font-medium capitalize">{booking.contact_method}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Booking Details Section */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('booking')}
                  className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    ჯავშნის დეტალები
                  </span>
                  {expandedSections.booking ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.booking && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">თარიღი</span>
                      <span className="font-medium">{formatDate(booking.selected_date)}</span>
                    </div>
                    {booking.original_date && booking.original_date !== booking.selected_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">თავდაპირველი თარიღი</span>
                        <span className="text-zinc-400 line-through">{formatDate(booking.original_date)}</span>
                      </div>
                    )}
                    {booking.reschedule_count && booking.reschedule_count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">გადატანილია</span>
                        <span className="text-purple-600">{booking.reschedule_count} ჯერ</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">ადგილი</span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        {booking.location_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">ფრენის ტიპი</span>
                      <span className="font-medium flex items-center gap-1">
                        <Plane className="w-3 h-3 text-zinc-400" />
                        {booking.flight_type_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">ადამიანები</span>
                      <span className="font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-400" />
                        {booking.number_of_people}
                      </span>
                    </div>
                    {booking.special_requests && (
                      <div className="text-sm pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500 block mb-1">შენიშვნა:</span>
                        <span className="text-zinc-700 dark:text-zinc-300 italic">
                          {booking.special_requests}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('payment')}
                  className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="w-4 h-4 text-zinc-500" />
                    გადახდა
                  </span>
                  {expandedSections.payment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.payment && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">ჯამი</span>
                      <span className="font-bold text-lg">{booking.total_price} {booking.currency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">დეპოზიტი</span>
                      <span className="font-medium">{depositAmount} {booking.currency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">დარჩენილი</span>
                      <span className="font-medium text-emerald-600">{amountDue} {booking.currency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">გადახდის სტატუსი</span>
                      <span className={`font-medium ${
                        booking.payment_status === 'fully_paid' ? 'text-green-600' :
                        booking.payment_status === 'deposit_paid' ? 'text-blue-600' :
                        'text-orange-600'
                      }`}>
                        {booking.payment_status === 'fully_paid' ? 'სრულად გადახდილი' :
                         booking.payment_status === 'deposit_paid' ? 'დეპოზიტი გადახდილი' :
                         booking.payment_status === 'refunded' ? 'დაბრუნებული' :
                         'მოლოდინში'}
                      </span>
                    </div>
                    {booking.promo_code && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">პრომო კოდი</span>
                        <span className="font-medium text-green-600">{booking.promo_code} (-{booking.promo_discount}%)</span>
                      </div>
                    )}
                    {booking.refund_amount && booking.refund_amount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">დაბრუნებული</span>
                        <span className="font-medium text-purple-600">{booking.refund_amount} {booking.currency}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Assignment Section */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('assignment')}
                  className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="w-4 h-4 text-zinc-500" />
                    მინიჭება
                  </span>
                  {expandedSections.assignment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.assignment && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">წყარო</span>
                      <span className="font-medium">
                        {booking.booking_source === 'platform_general' ? 'პლატფორმა' :
                         booking.booking_source === 'company_direct' ? 'კომპანია' :
                         booking.booking_source === 'pilot_direct' ? 'პილოტი' :
                         booking.booking_source || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">პილოტი</span>
                      <span className="font-medium">
                        {booking.pilot 
                          ? `${booking.pilot.first_name_ka || ''} ${booking.pilot.last_name_ka || ''}`.trim() 
                          : <span className="text-amber-600">დაუნიშნავი</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">კომპანია</span>
                      <span className="font-medium">
                        {booking.company?.name_ka || booking.company?.name_en || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">შექმნილია</span>
                      <span className="text-zinc-600">{formatDateTime(booking.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              {booking.internal_notes && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    შიდა შენიშვნა
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{booking.internal_notes}</p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'notes' && (
            <div className="p-4">
              <BookingNotesSection bookingId={booking.id} />
            </div>
          )}

          {activeSection === 'history' && (
            <div className="p-4">
              <BookingHistoryTimeline />
            </div>
          )}

          {activeSection === 'actions' && (
            <div className="p-4 space-y-3">
              {/* Status Change */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">სტატუსის შეცვლა</h3>
                <div className="grid grid-cols-2 gap-2">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      disabled={isActionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      დადასტურება
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={isActionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      გაუქმება
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      disabled={isActionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      დასრულება
                    </button>
                  )}
                  {booking.status !== 'on_hold' && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusChange('on_hold')}
                      disabled={isActionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      <Pause className="w-4 h-4" />
                      შეჩერება
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange('no_show')}
                      disabled={isActionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      No-Show
                    </button>
                  )}
                </div>
              </div>

              {/* Other Actions */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">სხვა მოქმედებები</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    გადატანა
                  </button>
                  <button
                    onClick={() => setShowReassign(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <User className="w-4 h-4" />
                    გადანაწილება
                  </button>
                  {(booking.payment_status === 'deposit_paid' || booking.payment_status === 'fully_paid') && (
                    <button
                      onClick={() => setShowRefund(true)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <DollarSign className="w-4 h-4" />
                      დაბრუნება
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Contact */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">სწრაფი კონტაქტი</h3>
                <div className="flex gap-2">
                  <a
                    href={`tel:${booking.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <Phone className="w-4 h-4" />
                    დარეკვა
                  </a>
                  <a
                    href={`https://wa.me/${booking.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-dialogs */}
      <RescheduleDialog
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        booking={booking}
      />
      <ReassignDialog
        isOpen={showReassign}
        onClose={() => setShowReassign(false)}
        booking={booking}
      />
      <RefundDialog
        isOpen={showRefund}
        onClose={() => setShowRefund(false)}
        booking={booking}
      />
    </>
  );
}
