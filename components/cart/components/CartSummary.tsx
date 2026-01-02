'use client';

import { useState } from 'react';
import { Tag, CreditCard, Banknote, ChevronRight, Plane, Package, Loader2, Minus } from 'lucide-react';
import { CartItem, CartSummaryData, CartTranslations } from '../types/cart';

interface CartSummaryProps {
  summary: CartSummaryData;
  translations: CartTranslations;
  cartItems: CartItem[];
  onCheckout: () => void;
  onRemoveService?: (itemId: string, serviceId: string) => void;
  isCheckingOut?: boolean;
  locale: string;
}

// Extended translations for summary breakdown
const summaryTranslations: Record<string, {
  flights: string;
  services: string;
  flightsTotal: string;
  servicesTotal: string;
  orderDetails: string;
  paymentBreakdown: string;
  onlinePayment: string;
  onsitePayment: string;
  perPerson: string;
  commission: string;
  vat: string;
  totalServices: string;
}> = {
  ka: {
    flights: 'ფრენები',
    services: 'სერვისები',
    flightsTotal: 'ფრენების ჯამი',
    servicesTotal: 'სერვისების ჯამი',
    orderDetails: 'შეკვეთის დეტალები',
    paymentBreakdown: 'გადახდის დეტალები',
    onlinePayment: 'ონლაინ გადასახდელი',
    onsitePayment: 'ადგილზე გადასახდელი',
    perPerson: '/ პერსონა',
    commission: 'საკომისიო',
    vat: 'დღგ',
    totalServices: 'სერვისები',
  },
  en: {
    flights: 'Flights',
    services: 'Services',
    flightsTotal: 'Flights Total',
    servicesTotal: 'Services Total',
    orderDetails: 'Order Details',
    paymentBreakdown: 'Payment Breakdown',
    onlinePayment: 'Pay Online',
    onsitePayment: 'Pay On-site',
    perPerson: '/ person',
    commission: 'Commission',
    vat: 'VAT',
    totalServices: 'Services',
  },
  ru: {
    flights: 'Полёты',
    services: 'Услуги',
    flightsTotal: 'Итого полёты',
    servicesTotal: 'Итого услуги',
    orderDetails: 'Детали заказа',
    paymentBreakdown: 'Детали оплаты',
    onlinePayment: 'Оплатить онлайн',
    onsitePayment: 'Оплатить на месте',
    perPerson: '/ чел.',
    commission: 'Комиссия',
    vat: 'НДС',
    totalServices: 'Услуги',
  },
  ar: {
    flights: 'الرحلات',
    services: 'الخدمات',
    flightsTotal: 'إجمالي الرحلات',
    servicesTotal: 'إجمالي الخدمات',
    orderDetails: 'تفاصيل الطلب',
    paymentBreakdown: 'تفاصيل الدفع',
    onlinePayment: 'الدفع عبر الإنترنت',
    onsitePayment: 'الدفع في الموقع',
    perPerson: '/ شخص',
    commission: 'العمولة',
    vat: 'ضريبة القيمة المضافة',
    totalServices: 'الخدمات',
  },
  de: {
    flights: 'Flüge',
    services: 'Dienstleistungen',
    flightsTotal: 'Flüge Gesamt',
    servicesTotal: 'Services Gesamt',
    orderDetails: 'Bestelldetails',
    paymentBreakdown: 'Zahlungsdetails',
    onlinePayment: 'Online bezahlen',
    onsitePayment: 'Vor Ort bezahlen',
    perPerson: '/ Person',
    commission: 'Provision',
    vat: 'MwSt.',
    totalServices: 'Services',
  },
  tr: {
    flights: 'Uçuşlar',
    services: 'Hizmetler',
    flightsTotal: 'Uçuş Toplamı',
    servicesTotal: 'Hizmet Toplamı',
    orderDetails: 'Sipariş Detayları',
    paymentBreakdown: 'Ödeme Detayları',
    onlinePayment: 'Online Öde',
    onsitePayment: 'Yerinde Öde',
    perPerson: '/ kişi',
    commission: 'Komisyon',
    vat: 'KDV',
    totalServices: 'Hizmetler',
  },
};

export default function CartSummary({ 
  summary, 
  translations, 
  cartItems, 
  onCheckout, 
  onRemoveService,
  isCheckingOut = false,
  locale 
}: CartSummaryProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const st = summaryTranslations[locale] || summaryTranslations.ka;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplying(true);
    // TODO: Implement promo code validation
    setTimeout(() => setIsApplying(false), 1000);
  };

  // Calculate services total from all items
  const servicesTotal = cartItems.reduce((sum, item) => {
    return sum + (item.selectedServices || []).reduce((sSum, s) => sSum + s.price * s.quantity, 0);
  }, 0);

  // Calculate flights total (without services)
  const flightsTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Get all selected services with item context
  const allServices = cartItems.flatMap(item => 
    (item.selectedServices || []).map(s => ({
      ...s,
      itemName: item.name,
      locationName: item.location?.name
    }))
  );

  return (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-3 lg:p-4 sticky top-4">
      {/* Header */}
      <h3 className="text-sm font-bold text-foreground mb-3">{st.orderDetails}</h3>

      {/* Order Items Breakdown - Compact */}
      <div className="space-y-1.5 pb-3 text-[11px]">
        {/* Flights */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground/70">
            <Plane className="w-3 h-3" />
            <span>{st.flights}</span>
          </div>
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center pl-4">
              <span className="text-foreground/80 truncate flex-1">{item.name} ({item.quantity})</span>
              <span className="text-foreground font-medium ml-1">{(item.price * item.quantity).toFixed(0)}₾</span>
            </div>
          ))}
        </div>

        {/* Services (if any) - Compact with remove */}
        {allServices.length > 0 && (
          <div className="space-y-1 pt-1.5 border-t border-foreground/10">
            <div className="flex items-center gap-1.5 font-medium text-foreground/70">
              <Package className="w-3 h-3" />
              <span>{st.services}</span>
            </div>
            {allServices.map((service, idx) => (
              <div key={`${service.serviceId}-${idx}`} className="flex justify-between items-center pl-4 group">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <button
                    onClick={() => {
                      // Find the cart item that has this service and remove it
                      const itemWithService = cartItems.find(item => 
                        item.selectedServices?.some(s => s.serviceId === service.serviceId)
                      );
                      if (itemWithService && onRemoveService) {
                        onRemoveService(itemWithService.id, service.serviceId);
                      }
                    }}
                    className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-red-500/0 hover:bg-red-500/20 text-foreground/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-foreground/80 truncate">
                    {service.name}{service.quantity > 1 ? ` ×${service.quantity}` : ''}
                  </span>
                </div>
                <span className="text-foreground font-medium ml-1">{(service.price * service.quantity).toFixed(0)}₾</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo Code - Compact */}
      <div className="py-2 border-t border-foreground/10">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/40" />
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="PROMO"
              className="w-full pl-7 pr-2 py-1.5 text-[11px] rounded-lg bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#4697D2] transition-colors"
            />
          </div>
          <button
            onClick={handleApplyPromo}
            disabled={isApplying || !promoCode.trim()}
            className="px-2 py-1.5 text-[11px] bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium rounded-lg border border-foreground/10 disabled:opacity-50 transition-colors"
          >
            {translations.applyCode}
          </button>
        </div>
      </div>

      {/* Price Summary - Compact */}
      <div className="py-2 border-t border-foreground/10 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-foreground/60">{st.flightsTotal}</span>
          <span className="text-foreground">{flightsTotal.toFixed(0)}₾</span>
        </div>
        
        {servicesTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-foreground/60">+ {st.totalServices}</span>
            <span className="text-foreground">{servicesTotal.toFixed(0)}₾</span>
          </div>
        )}

        {summary.discount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>{translations.discount}</span>
            <span>-{summary.discount.toFixed(0)}₾</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1.5 border-t border-foreground/10">
          <span className="text-xs font-bold text-foreground">{translations.total}</span>
          <span className="text-base font-bold text-[#4697D2]">{summary.total.toFixed(0)}₾</span>
        </div>
      </div>

      {/* Payment Breakdown - Compact */}
      <div className="py-2 border-t border-foreground/10">
        {/* Online Payment */}
        <div className="p-2 rounded-lg bg-[#4697D2]/10 border border-[#4697D2]/20 space-y-0.5 text-[10px]">
          <div className="flex items-center gap-1 mb-1">
            <CreditCard className="w-3 h-3 text-[#4697D2]" />
            <span className="text-[11px] font-semibold text-[#4697D2]">{st.onlinePayment}</span>
          </div>
          <div className="flex justify-between text-foreground/60">
            <span>{st.commission} (50₾×{summary.totalPassengers})</span>
            <span>{(summary.depositPerPerson * summary.totalPassengers).toFixed(0)}₾</span>
          </div>
          <div className="flex justify-between text-foreground/60">
            <span>{st.vat} 18%</span>
            <span>{summary.tax.toFixed(0)}₾</span>
          </div>
          {servicesTotal > 0 && (
            <div className="flex justify-between text-foreground/60">
              <span>{st.totalServices}</span>
              <span>{servicesTotal.toFixed(0)}₾</span>
            </div>
          )}
          <div className="flex justify-between pt-1 mt-1 border-t border-[#4697D2]/20 text-[11px] font-bold text-[#4697D2]">
            <span>სულ ონლაინ</span>
            <span>{summary.depositAmount.toFixed(0)}₾</span>
          </div>
        </div>

        {/* On-site Payment */}
        <div className="mt-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Banknote className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{st.onsitePayment}</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{summary.amountDue.toFixed(0)}₾</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isCheckingOut || cartItems.length === 0}
        className="w-full mt-2 py-2.5 bg-foreground hover:bg-foreground/90 disabled:bg-foreground/50 text-background text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2 group disabled:cursor-not-allowed"
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {translations.checkout}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}
