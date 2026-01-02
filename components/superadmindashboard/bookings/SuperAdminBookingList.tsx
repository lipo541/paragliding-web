'use client';

import React, { useState } from 'react';
import { useSuperAdminBooking, BookingWithRelations } from '@/lib/context/SuperAdminBookingContext';
import BookingCard, { BookingData } from '@/components/bookings/BookingCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { 
  Loader2, 
  RefreshCw,
  Users,
  DollarSign,
  X,
  Bell,
  Search,
  User,
  Building2,
  CreditCard,
  Percent,
  Pin,
  Trash2,
  StickyNote,
  History,
  Clock,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

type ExpandedPanel = 'reschedule' | 'reassign' | 'refund' | 'notes' | 'history' | null;

interface ExpandedState {
  [bookingId: string]: ExpandedPanel;
}

export default function SuperAdminBookingList() {
  const { 
    bookings, 
    isLoading, 
    error,
    pilots,
    companies,
    bookingNotes,
    bookingHistory,
    updateBookingStatus,
    rescheduleBooking,
    reassignBooking,
    refundBooking,
    addBookingNote,
    deleteBookingNote,
    toggleNotePin,
    fetchBookingNotes,
    fetchBookingHistory,
    isActionLoading,
    markBookingAsSeen
  } = useSuperAdminBooking();

  const [expandedPanels, setExpandedPanels] = useState<ExpandedState>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Reschedule state
  const [rescheduleData, setRescheduleData] = useState<{
    newDate: string;
    reasons: {
      ka: string;
      en: string;
      ru: string;
      de: string;
      tr: string;
      ar: string;
    };
    notifyCustomer: boolean;
    notifyPilot: boolean;
  }>({ 
    newDate: '', 
    reasons: { ka: '', en: '', ru: '', de: '', tr: '', ar: '' },
    notifyCustomer: true, 
    notifyPilot: true 
  });

  // Reassign state
  const [reassignData, setReassignData] = useState<{
    type: 'pilot' | 'company';
    pilotId: string;
    companyId: string;
    search: string;
  }>({ type: 'pilot', pilotId: '', companyId: '', search: '' });

  // Refund state
  const [refundData, setRefundData] = useState<{
    type: 'full' | 'partial';
    amount: number;
    reason: string;
    processStripe: boolean;
  }>({ type: 'full', amount: 50, reason: '', processStripe: true });

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'info' | 'warning' | 'action'>('info');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    action: 'confirm' | 'cancel' | 'complete' | 'hold' | 'no_show' | null;
    name: string;
  }>({ isOpen: false, bookingId: null, action: null, name: '' });

  // Get pinned notes for a booking
  const getPinnedNotes = (bookingId: string) => {
    return bookingNotes.filter(note => note.booking_id === bookingId && note.is_pinned);
  };

  // Get latest note for a booking (if no pinned)
  const getLatestNote = (bookingId: string) => {
    const notes = bookingNotes.filter(note => note.booking_id === bookingId);
    if (notes.length === 0) return null;
    return notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  // Transform booking for BookingCard
  const transformBooking = (booking: BookingWithRelations): BookingData => ({
    id: booking.id,
    full_name: booking.full_name,
    phone: booking.phone,
    location_name: booking.location_name,
    country_name: booking.country_name || '',
    flight_type_name: booking.flight_type_name,
    selected_date: booking.selected_date,
    number_of_people: booking.number_of_people,
    contact_method: booking.contact_method as BookingData['contact_method'],
    special_requests: booking.special_requests,
    promo_code: booking.promo_code,
    promo_discount: booking.promo_discount || 0,
    base_price: booking.base_price,
    total_price: booking.total_price,
    currency: booking.currency || 'GEL',
    status: booking.status as BookingData['status'],
    created_at: booking.created_at,
    deposit_amount: booking.deposit_amount || 50,
    amount_due: booking.total_price - (booking.deposit_amount || 50),
    payment_status: booking.payment_status as BookingData['payment_status'],
    refund_status: booking.refund_status as BookingData['refund_status'],
    refund_amount: booking.refund_amount,
    booking_source: booking.booking_source as BookingData['booking_source'],
    pilot_id: booking.pilot_id,
    company_id: booking.company_id,
    pilot: booking.pilot ? {
      id: booking.pilot.id,
      first_name_ka: booking.pilot.first_name_ka ?? undefined,
      first_name_en: booking.pilot.first_name_en ?? undefined,
      last_name_ka: booking.pilot.last_name_ka ?? undefined,
      last_name_en: booking.pilot.last_name_en ?? undefined,
    } : undefined,
    company: booking.company ? {
      id: booking.company.id,
      name_ka: booking.company.name_ka ?? undefined,
      name_en: booking.company.name_en ?? undefined,
    } : undefined,
    priority: booking.priority as BookingData['priority'],
    tags: booking.tags ?? undefined,
    internal_notes: booking.internal_notes ?? undefined,
    reschedule_count: booking.reschedule_count,
    original_date: booking.original_date ?? undefined,
  });

  // Toggle expanded panel
  const togglePanel = async (bookingId: string, panel: ExpandedPanel) => {
    const currentPanel = expandedPanels[bookingId];
    
    if (currentPanel === panel) {
      setExpandedPanels(prev => ({ ...prev, [bookingId]: null }));
    } else {
      setExpandedPanels(prev => ({ ...prev, [bookingId]: panel }));
      
      if (panel === 'notes') {
        await fetchBookingNotes(bookingId);
      } else if (panel === 'history') {
        await fetchBookingHistory(bookingId);
      }
      
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        if (panel === 'reschedule') {
          setRescheduleData({
            newDate: booking.selected_date,
            reasons: { ka: '', en: '', ru: '', de: '', tr: '', ar: '' },
            notifyCustomer: true,
            notifyPilot: true
          });
        } else if (panel === 'refund') {
          setRefundData({
            type: 'full',
            amount: booking.deposit_amount || 50,
            reason: '',
            processStripe: true
          });
        } else if (panel === 'reassign') {
          setReassignData({
            type: 'pilot',
            pilotId: booking.pilot_id || '',
            companyId: booking.company_id || '',
            search: ''
          });
        }
      }
    }
  };

  // Action handlers
  const handleStatusAction = (bookingId: string, action: typeof confirmDialog.action) => {
    const booking = bookings.find(b => b.id === bookingId);
    setConfirmDialog({
      isOpen: true,
      bookingId,
      action,
      name: booking?.full_name || ''
    });
  };

  const confirmStatusAction = async () => {
    if (!confirmDialog.bookingId || !confirmDialog.action) return;

    setProcessingId(confirmDialog.bookingId);
    
    const statusMap = {
      confirm: 'confirmed',
      cancel: 'cancelled',
      complete: 'completed',
      hold: 'on_hold',
      no_show: 'no_show'
    } as const;

    const success = await updateBookingStatus(
      confirmDialog.bookingId,
      statusMap[confirmDialog.action],
      `სტატუსი შეცვლილია`
    );

    if (success) {
      toast.success('სტატუსი განახლდა');
    }

    setProcessingId(null);
    setConfirmDialog({ isOpen: false, bookingId: null, action: null, name: '' });
  };

  // Reschedule handler
  const handleReschedule = async (bookingId: string) => {
    if (!rescheduleData.newDate) {
      toast.error('აირჩიეთ თარიღი');
      return;
    }

    setProcessingId(bookingId);
    const booking = bookings.find(b => b.id === bookingId);
    
    const success = await rescheduleBooking({
      booking_id: bookingId,
      new_date: rescheduleData.newDate,
      reason: rescheduleData.reasons.ka || 'გადატანილია', // Store Georgian as main reason
      reasons: rescheduleData.reasons, // All 6 languages for notifications
      notify_customer: rescheduleData.notifyCustomer,
      notify_pilot: rescheduleData.notifyPilot,
      initiated_by: 'admin',
      // Pass booking info for notification
      booking_info: booking ? {
        location_name: booking.location_name,
        old_date: booking.selected_date,
        customer_name: booking.full_name,
        pilot_id: booking.pilot_id,
        company_id: booking.company_id
      } : undefined
    });

    if (success) {
      toast.success('თარიღი გადატანილია');
      setExpandedPanels(prev => ({ ...prev, [bookingId]: null }));
      // Reset form
      setRescheduleData({ 
        newDate: '', 
        reasons: { ka: '', en: '', ru: '', de: '', tr: '', ar: '' },
        notifyCustomer: true, 
        notifyPilot: true 
      });
    }
    setProcessingId(null);
  };

  // Reassign handler
  const handleReassign = async (bookingId: string) => {
    setProcessingId(bookingId);
    
    const data: any = { booking_id: bookingId };
    if (reassignData.type === 'pilot' && reassignData.pilotId) {
      data.new_pilot_id = reassignData.pilotId;
    } else if (reassignData.type === 'company' && reassignData.companyId) {
      data.new_company_id = reassignData.companyId;
    } else {
      toast.error(reassignData.type === 'pilot' ? 'აირჩიეთ პილოტი' : 'აირჩიეთ კომპანია');
      setProcessingId(null);
      return;
    }

    const success = await reassignBooking(data);
    if (success) {
      toast.success('გადანაწილდა');
      setExpandedPanels(prev => ({ ...prev, [bookingId]: null }));
    }
    setProcessingId(null);
  };

  // Refund handler
  const handleRefund = async (bookingId: string, depositAmount: number) => {
    const amount = refundData.type === 'full' ? depositAmount : refundData.amount;
    
    if (amount <= 0 || amount > depositAmount) {
      toast.error('არასწორი თანხა');
      return;
    }

    setProcessingId(bookingId);
    const success = await refundBooking({
      booking_id: bookingId,
      refund_type: refundData.type,
      refund_amount: amount,
      reason: refundData.reason || 'დაბრუნება',
      process_stripe_refund: refundData.processStripe
    });

    if (success) {
      toast.success('თანხა დაბრუნდა');
      setExpandedPanels(prev => ({ ...prev, [bookingId]: null }));
    }
    setProcessingId(null);
  };

  // Note handlers
  const handleAddNote = async (bookingId: string) => {
    if (!newNote.trim()) {
      toast.error('შეიყვანეთ შენიშვნა');
      return;
    }

    const success = await addBookingNote({
      booking_id: bookingId,
      note: newNote.trim(),
      note_type: noteType
    });

    if (success) {
      toast.success('შენიშვნა დაემატა');
      setNewNote('');
    }
  };

  // Helpers
  const formatDateTime = (date: string) => new Date(date).toLocaleString('ka-GE', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const today = new Date().toISOString().split('T')[0];

  const filteredPilots = pilots.filter(p => {
    const name = `${p.first_name_ka || ''} ${p.last_name_ka || ''}`.toLowerCase();
    return name.includes(reassignData.search.toLowerCase());
  });

  const filteredCompanies = companies.filter(c => {
    const name = (c.name_ka || c.name_en || '').toLowerCase();
    return name.includes(reassignData.search.toLowerCase());
  });

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      created: 'შეიქმნა', confirmed: 'დადასტურდა', cancelled: 'გაუქმდა',
      completed: 'დასრულდა', rescheduled: 'გადატანილია', reassigned: 'გადანაწილდა',
      refunded: 'დაბრუნდა', on_hold: 'შეჩერდა', no_show: 'No-Show'
    };
    return labels[actionType] || actionType;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-12 text-zinc-500">ჯავშნები ვერ მოიძებნა</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {bookings.map((booking) => {
          const expandedPanel = expandedPanels[booking.id];
          const depositAmount = booking.deposit_amount || 50;
          const pinnedNotes = getPinnedNotes(booking.id);
          const latestNote = pinnedNotes.length === 0 ? getLatestNote(booking.id) : null;
          const displayNotes = pinnedNotes.length > 0 ? pinnedNotes : (latestNote ? [latestNote] : []);
          const isRescheduled = (booking.reschedule_count || 0) > 0;
          const isNewForAdmin = booking.seen_by_admin === false;

          return (
            <div key={booking.id} className="space-y-0">
              {/* New Booking Indicator - Top Priority */}
              {isNewForAdmin && (
                <div className="mx-1 mb-0">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-t-xl text-xs bg-[#FF0000] dark:bg-[#CC0000] border border-b-0 border-red-600">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      <span className="text-white font-bold">
                        ✨ ახალი ჯავშანი!
                      </span>
                    </div>
                    <button
                      onClick={() => markBookingAsSeen(booking.id, 'admin')}
                      className="px-2 py-1 text-xs font-medium bg-white hover:bg-gray-100 text-[#FF0000] rounded transition-colors animate-pulse"
                    >
                      ნანახად მონიშვნა
                    </button>
                  </div>
                </div>
              )}
              
              {/* Rescheduled Banner - Above Notes */}
              {isRescheduled && !isNewForAdmin && (
                <div className="mx-1 mb-0">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl text-xs bg-purple-50 dark:bg-purple-900/30 border border-b-0 border-purple-200 dark:border-purple-800">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-800 dark:text-purple-200 font-medium">
                      გადატანილია {booking.reschedule_count}x
                    </span>
                    {booking.original_date && (
                      <span className="text-purple-600 dark:text-purple-400">
                        • თავდაპირველი: {new Date(booking.original_date).toLocaleDateString('ka-GE')}
                      </span>
                    )}
                    {booking.reschedule_reason && (
                      <span className="text-purple-500 dark:text-purple-500 ml-auto">
                        ({booking.reschedule_reason})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Pinned/Latest Notes Banner - Above Card */}
              {displayNotes.length > 0 && !isNewForAdmin && (
                <div className="mx-1 mb-0 space-y-1">
                  {displayNotes.map((note, noteIndex) => (
                    <div 
                      key={note.id}
                      className={`flex items-start gap-2 px-3 py-2 text-xs ${
                        // Only round top if no reschedule banner and it's the first note
                        !isRescheduled && noteIndex === 0 ? 'rounded-t-xl' : ''
                      } ${
                        note.note_type === 'warning' 
                          ? 'bg-amber-50 dark:bg-amber-900/30 border border-b-0 border-amber-200 dark:border-amber-800' 
                          : note.note_type === 'action'
                          ? 'bg-red-50 dark:bg-red-900/30 border border-b-0 border-red-200 dark:border-red-800'
                          : 'bg-blue-50 dark:bg-blue-900/30 border border-b-0 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {note.is_pinned ? (
                        <Pin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                          note.note_type === 'warning' ? 'text-amber-600' : 
                          note.note_type === 'action' ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-400" />
                      )}
                      <span className={`flex-1 ${
                        note.note_type === 'warning' ? 'text-amber-800 dark:text-amber-200' : 
                        note.note_type === 'action' ? 'text-red-800 dark:text-red-200' : 
                        'text-blue-800 dark:text-blue-200'
                      }`}>
                        {note.note}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        {note.author_name || 'Admin'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Card with red border if new */}
              <div className={isNewForAdmin ? 'ring-2 ring-[#FF0000] ring-offset-2 rounded-xl' : ''}>
                <BookingCard
                  booking={transformBooking(booking)}
                  locale="ka"
                  isProcessing={processingId === booking.id || isActionLoading}
                  onConfirm={(id) => {
                    markBookingAsSeen(id, 'admin');
                    handleStatusAction(id, 'confirm');
                  }}
                  onCancel={(id) => {
                    markBookingAsSeen(id, 'admin');
                    handleStatusAction(id, 'cancel');
                  }}
                  onComplete={(id) => {
                    markBookingAsSeen(id, 'admin');
                    handleStatusAction(id, 'complete');
                  }}
                  showAdminActions={true}
                  onReschedule={(id) => {
                    markBookingAsSeen(id, 'admin');
                    togglePanel(id, 'reschedule');
                  }}
                  onRefund={(id) => {
                    markBookingAsSeen(id, 'admin');
                    togglePanel(id, 'refund');
                  }}
                  onHold={(id) => {
                    markBookingAsSeen(id, 'admin');
                    handleStatusAction(id, 'hold');
                  }}
                  onNoShow={(id) => {
                    markBookingAsSeen(id, 'admin');
                    handleStatusAction(id, 'no_show');
                  }}
                  onReassign={(id) => {
                    markBookingAsSeen(id, 'admin');
                    togglePanel(id, 'reassign');
                  }}
                  onViewHistory={(id) => {
                    markBookingAsSeen(id, 'admin');
                    togglePanel(id, 'history');
                  }}
                  onViewNotes={(id) => {
                    markBookingAsSeen(id, 'admin');
                    togglePanel(id, 'notes');
                  }}
                />
              </div>

              {/* Expanded Panel - Inline below card */}
              {expandedPanel && (
                <div className="mx-1 -mt-1 border border-t-0 border-zinc-200 dark:border-zinc-800 rounded-b-xl bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      {expandedPanel === 'reschedule' && <><RefreshCw className="w-4 h-4 text-purple-500" /> გადატანა</>}
                      {expandedPanel === 'reassign' && <><Users className="w-4 h-4 text-indigo-500" /> გადანაწილება</>}
                      {expandedPanel === 'refund' && <><DollarSign className="w-4 h-4 text-emerald-500" /> დაბრუნება</>}
                      {expandedPanel === 'notes' && <><StickyNote className="w-4 h-4 text-blue-500" /> შენიშვნები</>}
                      {expandedPanel === 'history' && <><History className="w-4 h-4 text-zinc-500" /> ისტორია</>}
                    </span>
                    <button 
                      onClick={() => setExpandedPanels(prev => ({ ...prev, [booking.id]: null }))}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel Content */}
                  <div className="p-4">
                    {/* RESCHEDULE PANEL */}
                    {expandedPanel === 'reschedule' && (
                      <div className="space-y-3">
                        {/* Date picker */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">ახალი თარიღი</label>
                          <input
                            type="date"
                            value={rescheduleData.newDate}
                            onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                            min={today}
                            className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                          />
                        </div>

                        {/* Reason in 6 languages */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-2 block">მიზეზი (6 ენაზე)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 mb-0.5 block">🇬🇪 ქართული</label>
                              <input
                                type="text"
                                value={rescheduleData.reasons.ka}
                                onChange={(e) => setRescheduleData(prev => ({ 
                                  ...prev, 
                                  reasons: { ...prev.reasons, ka: e.target.value }
                                }))}
                                placeholder="მიზეზი ქართულად..."
                                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 mb-0.5 block">🇬🇧 English</label>
                              <input
                                type="text"
                                value={rescheduleData.reasons.en}
                                onChange={(e) => setRescheduleData(prev => ({ 
                                  ...prev, 
                                  reasons: { ...prev.reasons, en: e.target.value }
                                }))}
                                placeholder="Reason in English..."
                                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 mb-0.5 block">🇷🇺 Русский</label>
                              <input
                                type="text"
                                value={rescheduleData.reasons.ru}
                                onChange={(e) => setRescheduleData(prev => ({ 
                                  ...prev, 
                                  reasons: { ...prev.reasons, ru: e.target.value }
                                }))}
                                placeholder="Причина на русском..."
                                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 mb-0.5 block">🇩🇪 Deutsch</label>
                              <input
                                type="text"
                                value={rescheduleData.reasons.de}
                                onChange={(e) => setRescheduleData(prev => ({ 
                                  ...prev, 
                                  reasons: { ...prev.reasons, de: e.target.value }
                                }))}
                                placeholder="Grund auf Deutsch..."
                                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 mb-0.5 block">🇹🇷 Türkçe</label>
                              <input
                                type="text"
                                value={rescheduleData.reasons.tr}
                                onChange={(e) => setRescheduleData(prev => ({ 
                                  ...prev, 
                                  reasons: { ...prev.reasons, tr: e.target.value }
                                }))}
                                placeholder="Türkçe sebep..."
                                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 mb-0.5 block">🇸🇦 العربية</label>
                              <input
                                type="text"
                                dir="rtl"
                                value={rescheduleData.reasons.ar}
                                onChange={(e) => setRescheduleData(prev => ({ 
                                  ...prev, 
                                  reasons: { ...prev.reasons, ar: e.target.value }
                                }))}
                                placeholder="السبب بالعربية..."
                                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Notification checkboxes */}
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rescheduleData.notifyCustomer}
                              onChange={(e) => setRescheduleData(prev => ({ ...prev, notifyCustomer: e.target.checked }))}
                              className="w-3.5 h-3.5 rounded"
                            />
                            <Bell className="w-3 h-3" /> კლიენტი
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rescheduleData.notifyPilot}
                              onChange={(e) => setRescheduleData(prev => ({ ...prev, notifyPilot: e.target.checked }))}
                              className="w-3.5 h-3.5 rounded"
                            />
                            <Bell className="w-3 h-3" /> პილოტი
                          </label>
                        </div>

                        <button
                          onClick={() => handleReschedule(booking.id)}
                          disabled={processingId === booking.id || !rescheduleData.newDate}
                          className="w-full py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {processingId === booking.id ? 'იტვირთება...' : 'გადატანა'}
                        </button>
                      </div>
                    )}

                    {/* REASSIGN PANEL */}
                    {expandedPanel === 'reassign' && (
                      <div className="space-y-3">
                        <div className="flex rounded-lg bg-zinc-200 dark:bg-zinc-700 p-0.5">
                          <button
                            onClick={() => setReassignData(prev => ({ ...prev, type: 'pilot' }))}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md ${reassignData.type === 'pilot' ? 'bg-white dark:bg-zinc-600 shadow-sm' : ''}`}
                          >
                            <User className="w-3 h-3 inline mr-1" /> პილოტი
                          </button>
                          <button
                            onClick={() => setReassignData(prev => ({ ...prev, type: 'company' }))}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md ${reassignData.type === 'company' ? 'bg-white dark:bg-zinc-600 shadow-sm' : ''}`}
                          >
                            <Building2 className="w-3 h-3 inline mr-1" /> კომპანია
                          </button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="text"
                            value={reassignData.search}
                            onChange={(e) => setReassignData(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="ძებნა..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                          />
                        </div>
                        <div className="max-h-32 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          {reassignData.type === 'pilot' ? (
                            filteredPilots.slice(0, 5).map(pilot => (
                              <label
                                key={pilot.id}
                                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b last:border-b-0 ${reassignData.pilotId === pilot.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                              >
                                <input
                                  type="radio"
                                  checked={reassignData.pilotId === pilot.id}
                                  onChange={() => setReassignData(prev => ({ ...prev, pilotId: pilot.id }))}
                                  className="w-3.5 h-3.5"
                                />
                                <span className="text-sm">{pilot.first_name_ka} {pilot.last_name_ka}</span>
                              </label>
                            ))
                          ) : (
                            filteredCompanies.slice(0, 5).map(company => (
                              <label
                                key={company.id}
                                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b last:border-b-0 ${reassignData.companyId === company.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                              >
                                <input
                                  type="radio"
                                  checked={reassignData.companyId === company.id}
                                  onChange={() => setReassignData(prev => ({ ...prev, companyId: company.id }))}
                                  className="w-3.5 h-3.5"
                                />
                                <span className="text-sm">{company.name_ka || company.name_en}</span>
                              </label>
                            ))
                          )}
                        </div>
                        <button
                          onClick={() => handleReassign(booking.id)}
                          disabled={processingId === booking.id}
                          className="w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {processingId === booking.id ? 'იტვირთება...' : 'შენახვა'}
                        </button>
                      </div>
                    )}

                    {/* REFUND PANEL */}
                    {expandedPanel === 'refund' && (
                      <div className="space-y-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">დეპოზიტი:</span>
                            <span className="font-medium">{depositAmount} {booking.currency}</span>
                          </div>
                        </div>
                        <div className="flex rounded-lg bg-zinc-200 dark:bg-zinc-700 p-0.5">
                          <button
                            onClick={() => setRefundData(prev => ({ ...prev, type: 'full', amount: depositAmount }))}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md ${refundData.type === 'full' ? 'bg-white dark:bg-zinc-600 shadow-sm' : ''}`}
                          >
                            <CreditCard className="w-3 h-3 inline mr-1" /> სრული
                          </button>
                          <button
                            onClick={() => setRefundData(prev => ({ ...prev, type: 'partial' }))}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md ${refundData.type === 'partial' ? 'bg-white dark:bg-zinc-600 shadow-sm' : ''}`}
                          >
                            <Percent className="w-3 h-3 inline mr-1" /> ნაწილობრივი
                          </button>
                        </div>
                        {refundData.type === 'partial' && (
                          <input
                            type="number"
                            value={refundData.amount}
                            onChange={(e) => setRefundData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            min={1}
                            max={depositAmount}
                            className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                          />
                        )}
                        <input
                          type="text"
                          value={refundData.reason}
                          onChange={(e) => setRefundData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="მიზეზი..."
                          className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                        />
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex justify-between items-center">
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">დასაბრუნებელი:</span>
                          <span className="font-bold text-emerald-600">
                            {refundData.type === 'full' ? depositAmount : refundData.amount} {booking.currency}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRefund(booking.id, depositAmount)}
                          disabled={processingId === booking.id}
                          className="w-full py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {processingId === booking.id ? 'იტვირთება...' : 'დაბრუნება'}
                        </button>
                      </div>
                    )}

                    {/* NOTES PANEL */}
                    {expandedPanel === 'notes' && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="ახალი შენიშვნა..."
                            className="flex-1 px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                          />
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as any)}
                            className="px-2 py-1.5 text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
                          >
                            <option value="info">ინფო</option>
                            <option value="warning">გაფრთხ.</option>
                            <option value="action">მოქმედება</option>
                          </select>
                          <button
                            onClick={() => handleAddNote(booking.id)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {bookingNotes.length === 0 ? (
                            <p className="text-center text-xs text-zinc-500 py-4">შენიშვნები არ არის</p>
                          ) : (
                            bookingNotes.map(note => (
                              <div
                                key={note.id}
                                className={`p-2 rounded-lg text-xs ${
                                  note.note_type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                                  note.note_type === 'action' ? 'bg-purple-50 dark:bg-purple-900/20' :
                                  'bg-blue-50 dark:bg-blue-900/20'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-zinc-700 dark:text-zinc-300">{note.note}</p>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => toggleNotePin(note.id, !note.is_pinned)}
                                      className={`p-1 rounded ${note.is_pinned ? 'text-blue-600' : 'text-zinc-400'}`}
                                    >
                                      <Pin className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteBookingNote(note.id)}
                                      className="p-1 text-zinc-400 hover:text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                  {note.author_name} • {formatDateTime(note.created_at)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* HISTORY PANEL */}
                    {expandedPanel === 'history' && (
                      <div className="max-h-48 overflow-y-auto">
                        {bookingHistory.length === 0 ? (
                          <p className="text-center text-xs text-zinc-500 py-4">ისტორია ცარიელია</p>
                        ) : (
                          <div className="space-y-2">
                            {bookingHistory.map(entry => (
                              <div key={entry.id} className="flex gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                    {getActionLabel(entry.action)}
                                  </p>
                                  {entry.reason && (
                                    <p className="text-zinc-500">{entry.reason}</p>
                                  )}
                                  <p className="text-[10px] text-zinc-400">
                                    {entry.changed_by_name || 'System'} • {formatDateTime(entry.created_at)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, bookingId: null, action: null, name: '' })}
        onConfirm={confirmStatusAction}
        title={
          confirmDialog.action === 'confirm' ? 'დადასტურება' :
          confirmDialog.action === 'cancel' ? 'გაუქმება' :
          confirmDialog.action === 'complete' ? 'დასრულება' :
          confirmDialog.action === 'hold' ? 'შეჩერება' : 'No-Show'
        }
        message={`${confirmDialog.name} - ${
          confirmDialog.action === 'confirm' ? 'დადასტურება?' :
          confirmDialog.action === 'cancel' ? 'გაუქმება?' :
          confirmDialog.action === 'complete' ? 'დასრულება?' :
          confirmDialog.action === 'hold' ? 'შეჩერება?' : 'No-Show მონიშვნა?'
        }`}
        confirmText={confirmDialog.action === 'cancel' ? 'გაუქმება' : 'დადასტურება'}
        variant={confirmDialog.action === 'cancel' ? 'danger' : 'primary'}
      />
    </>
  );
}
