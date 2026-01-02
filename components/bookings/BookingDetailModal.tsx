'use client';

import { useState } from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Plane,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  User,
  Building2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { BookingData, BookingStatus, PaymentStatus, BookingSource } from './BookingCard';

interface BookingDetailModalProps {
  booking: BookingData | null;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  onAssignPilot?: (bookingId: string, pilotId: string) => void;
  availablePilots?: Array<{ id: string; name: string }>;
  showAssignPilot?: boolean;
  isProcessing?: boolean;
}

const translations = {
  ka: {
    bookingDetails: 'ჯავშნის დეტალები',
    customerInfo: 'კლიენტის ინფორმაცია',
    flightInfo: 'ფრენის ინფორმაცია',
    paymentInfo: 'გადახდის ინფორმაცია',
    timeline: 'ისტორია',
    actions: 'მოქმედებები',
    
    fullName: 'სახელი',
    phone: 'ტელეფონი',
    contactMethod: 'კომუნიკაცია',
    people: 'ადამიანი',
    
    location: 'ლოკაცია',
    flightType: 'ფრენის ტიპი',
    date: 'თარიღი',
    
    basePrice: 'საწყისი ფასი',
    discount: 'ფასდაკლება',
    totalPrice: 'სულ',
    deposit: 'დეპოზიტი (ონლაინ)',
    amountDue: 'ადგილზე გადასახდელი',
    paymentStatus: 'გადახდის სტატუსი',
    
    pending: 'მომლოდინე',
    confirmed: 'დადასტურებული',
    cancelled: 'გაუქმებული',
    completed: 'დასრულებული',
    
    pending_deposit: 'დეპოზიტი არ არის გადახდილი',
    deposit_paid: 'დეპოზიტი გადახდილი',
    fully_paid: 'სრულად გადახდილი',
    refunded: 'დაბრუნებული',
    failed: 'ჩაიშალა',
    
    platform_general: 'პლატფორმიდან',
    company_direct: 'კომპანიიდან',
    pilot_direct: 'პილოტიდან',
    
    createdAt: 'შექმნილია',
    source: 'წყარო',
    assignedPilot: 'მინიჭებული პილოტი',
    unassigned: 'დაუნიშნავი',
    
    confirm: 'დადასტურება',
    cancel: 'გაუქმება',
    complete: 'დასრულება',
    selectPilot: 'აირჩიეთ პილოტი',
    assignPilot: 'მინიჭება',
    
    specialRequests: 'სპეციალური მოთხოვნები',
    promoCode: 'პრომო კოდი',
    
    copied: 'დაკოპირდა!',
    openWhatsApp: 'WhatsApp-ში გახსნა',
    openTelegram: 'Telegram-ში გახსნა',
    openViber: 'Viber-ში გახსნა',
  },
  en: {
    bookingDetails: 'Booking Details',
    customerInfo: 'Customer Information',
    flightInfo: 'Flight Information',
    paymentInfo: 'Payment Information',
    timeline: 'Timeline',
    actions: 'Actions',
    
    fullName: 'Full Name',
    phone: 'Phone',
    contactMethod: 'Contact Method',
    people: 'people',
    
    location: 'Location',
    flightType: 'Flight Type',
    date: 'Date',
    
    basePrice: 'Base Price',
    discount: 'Discount',
    totalPrice: 'Total',
    deposit: 'Deposit (Online)',
    amountDue: 'Due On-site',
    paymentStatus: 'Payment Status',
    
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    
    pending_deposit: 'Deposit not paid',
    deposit_paid: 'Deposit paid',
    fully_paid: 'Fully paid',
    refunded: 'Refunded',
    failed: 'Failed',
    
    platform_general: 'From Platform',
    company_direct: 'From Company',
    pilot_direct: 'From Pilot',
    
    createdAt: 'Created',
    source: 'Source',
    assignedPilot: 'Assigned Pilot',
    unassigned: 'Unassigned',
    
    confirm: 'Confirm',
    cancel: 'Cancel',
    complete: 'Complete',
    selectPilot: 'Select Pilot',
    assignPilot: 'Assign',
    
    specialRequests: 'Special Requests',
    promoCode: 'Promo Code',
    
    copied: 'Copied!',
    openWhatsApp: 'Open in WhatsApp',
    openTelegram: 'Open in Telegram',
    openViber: 'Open in Viber',
  },
};

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  locale = 'ka',
  onConfirm,
  onCancel,
  onComplete,
  onAssignPilot,
  availablePilots,
  showAssignPilot = false,
  isProcessing = false,
}: BookingDetailModalProps) {
  const [selectedPilotId, setSelectedPilotId] = useState('');
  const [copied, setCopied] = useState(false);
  
  const t = translations[locale as keyof typeof translations] || translations.ka;
  
  if (!isOpen || !booking) return null;
  
  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      confirmed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
      cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle2 className="w-4 h-4" />,
      completed: <CheckCircle2 className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {t[status]}
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
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>
        <CreditCard className="w-4 h-4" />
        {t[status]}
      </span>
    );
  };
  
  const copyPhone = () => {
    navigator.clipboard.writeText(booking.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const getContactLink = () => {
    const phone = booking.phone.replace(/[^0-9+]/g, '');
    switch (booking.contact_method) {
      case 'whatsapp':
        return { url: `https://wa.me/${phone}`, label: t.openWhatsApp };
      case 'telegram':
        return { url: `https://t.me/${phone}`, label: t.openTelegram };
      case 'viber':
        return { url: `viber://chat?number=${phone}`, label: t.openViber };
      default:
        return null;
    }
  };
  
  const contactLink = getContactLink();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t.bookingDetails}</h2>
            <p className="text-sm text-zinc-500">#{booking.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(booking.status)}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Customer Info */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              {t.customerInfo}
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">{t.fullName}</span>
                </div>
                <span className="font-medium text-zinc-900 dark:text-white">{booking.full_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">{t.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-white">{booking.phone}</span>
                  <button 
                    onClick={copyPhone}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">{t.people}</span>
                </div>
                <span className="font-medium text-zinc-900 dark:text-white">{booking.number_of_people}</span>
              </div>
              
              {contactLink && (
                <a
                  href={contactLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {contactLink.label}
                </a>
              )}
            </div>
          </section>
          
          {/* Flight Info */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              {t.flightInfo}
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">{t.location}</span>
                </div>
                <span className="font-medium text-zinc-900 dark:text-white">{booking.location_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">{t.flightType}</span>
                </div>
                <span className="font-medium text-zinc-900 dark:text-white">{booking.flight_type_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">{t.date}</span>
                </div>
                <span className="font-medium text-zinc-900 dark:text-white">{formatDate(booking.selected_date)}</span>
              </div>
              
              {booking.pilot && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-500">{t.assignedPilot}</span>
                  </div>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{getPilotName()}</span>
                </div>
              )}
              
              {showAssignPilot && !booking.pilot_id && availablePilots && availablePilots.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <label className="text-sm text-zinc-500 mb-2 block">{t.assignedPilot}</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPilotId}
                      onChange={(e) => setSelectedPilotId(e.target.value)}
                      className="flex-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t.assignPilot}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Payment Info */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              {t.paymentInfo}
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">{t.basePrice}</span>
                <span className="text-zinc-900 dark:text-white">{booking.base_price} {booking.currency}</span>
              </div>
              
              {booking.promo_discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{t.discount} ({booking.promo_code})</span>
                  <span className="text-green-600 dark:text-green-400">-{booking.promo_discount}%</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.totalPrice}</span>
                <span className="font-bold text-lg text-zinc-900 dark:text-white">{booking.total_price} {booking.currency}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-zinc-500">{t.deposit}</span>
                </div>
                <span className="font-medium text-emerald-600">{depositAmount} {booking.currency}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-zinc-500">{t.amountDue}</span>
                </div>
                <span className="font-medium text-blue-600">{amountDue} {booking.currency}</span>
              </div>
              
              {booking.payment_status && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm text-zinc-500">{t.paymentStatus}</span>
                  {getPaymentStatusBadge(booking.payment_status)}
                </div>
              )}
            </div>
          </section>
          
          {/* Special Requests */}
          {booking.special_requests && (
            <section>
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                {t.specialRequests}
              </h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-zinc-700 dark:text-zinc-300">{booking.special_requests}</p>
                </div>
              </div>
            </section>
          )}
          
          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              {t.timeline}
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">{t.createdAt}</span>
                <span className="text-zinc-900 dark:text-white">{formatDateTime(booking.created_at)}</span>
              </div>
              
              {booking.booking_source && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{t.source}</span>
                  <span className="inline-flex items-center gap-1 text-zinc-900 dark:text-white">
                    {booking.booking_source === 'platform_general' && <Plane className="w-4 h-4" />}
                    {booking.booking_source === 'company_direct' && <Building2 className="w-4 h-4" />}
                    {booking.booking_source === 'pilot_direct' && <User className="w-4 h-4" />}
                    {t[booking.booking_source]}
                  </span>
                </div>
              )}
            </div>
          </section>
          
          {/* Actions */}
          <section className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-wrap gap-3">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => onConfirm?.(booking.id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {t.confirm}
                  </button>
                  <button
                    onClick={() => onCancel?.(booking.id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 bg-red-500/10 text-red-600 rounded-lg font-medium hover:bg-red-500/20 disabled:opacity-50 transition-colors"
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
                    className="flex-1 py-2.5 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {t.complete}
                  </button>
                  <button
                    onClick={() => onCancel?.(booking.id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 bg-red-500/10 text-red-600 rounded-lg font-medium hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    {t.cancel}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
