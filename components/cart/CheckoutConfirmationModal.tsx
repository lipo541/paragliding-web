'use client';

import { useState, useEffect } from 'react';
import { X, User, MessageCircle, Check } from 'lucide-react';
import { SiWhatsapp, SiTelegram } from 'react-icons/si';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Viber icon component
const ViberIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.4 0C9.473.028 5.333.344 2.746 2.699 1.497 3.814.704 5.316.088 7.113c-.614 1.798-.634 3.635-.647 5.522-.013 1.887.014 3.774.497 5.622.44 1.684 1.369 3.075 2.674 4.086.515.4 1.042.627 1.638.795.649.184 1.306.199 1.964.199h.005c.582 0 1.13-.019 1.665-.058 1.018-.074 1.897-.309 2.71-.664 3.155-1.382 5.28-4.254 6.197-7.383.684-2.334.851-4.79.493-7.234-.401-2.741-1.516-5.03-3.314-6.803C13.513 1.246 11.4 0 11.4 0zm1.57 1.91c.7 0 1.27.57 1.27 1.27 0 .7-.57 1.27-1.27 1.27-.7 0-1.27-.57-1.27-1.27 0-.7.57-1.27 1.27-1.27z"/>
  </svg>
);

type ContactMethod = 'whatsapp' | 'telegram' | 'viber';

interface CheckoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    fullName: string;
    phone: string;
    contactMethod: ContactMethod;
  }) => void;
  initialData: {
    fullName: string;
    phone: string;
  };
  translations: {
    title: string;
    subtitle: string;
    fullNameLabel: string;
    phoneLabel: string;
    contactMethodLabel: string;
    contactMethodHint: string;
    whatsapp: string;
    telegram: string;
    viber: string;
    confirm: string;
    cancel: string;
    phoneRequired: string;
    nameRequired: string;
  };
  isLoading?: boolean;
}

export default function CheckoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  translations: t,
  isLoading = false,
}: CheckoutConfirmationModalProps) {
  const [fullName, setFullName] = useState(initialData.fullName);
  const [phone, setPhone] = useState(initialData.phone);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('whatsapp');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  // Sync with initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(initialData.fullName);
      setPhone(initialData.phone);
      setErrors({});
    }
  }, [isOpen, initialData.fullName, initialData.phone]);

  const validateForm = (): boolean => {
    const newErrors: { fullName?: string; phone?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = t.nameRequired;
    }

    if (!phone.trim()) {
      newErrors.phone = t.phoneRequired;
    } else {
      // Basic phone validation
      const phoneRegex = /^\+?[0-9\s()-]{9,20}$/;
      if (!phoneRegex.test(phone)) {
        newErrors.phone = t.phoneRequired;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirm({
        fullName: fullName.trim(),
        phone: phone.trim(),
        contactMethod,
      });
    }
  };

  if (!isOpen) return null;

  const contactMethods: { id: ContactMethod; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'whatsapp',
      label: t.whatsapp,
      icon: <SiWhatsapp className="w-5 h-5" />,
      color: 'bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20',
    },
    {
      id: 'telegram',
      label: t.telegram,
      icon: <SiTelegram className="w-5 h-5" />,
      color: 'bg-[#229ED9]/10 border-[#229ED9]/30 text-[#229ED9] hover:bg-[#229ED9]/20',
    },
    {
      id: 'viber',
      label: t.viber,
      icon: <ViberIcon className="w-5 h-5" />,
      color: 'bg-[#7360F2]/10 border-[#7360F2]/30 text-[#7360F2] hover:bg-[#7360F2]/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl backdrop-blur-md bg-white/95 dark:bg-[#1a1a1a]/95 border border-[#4697D2]/30 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#4697D2]/20 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a] dark:text-white">
              {t.title}
            </h2>
            <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 mt-0.5">
              {t.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[#1a1a1a]/60 dark:text-white/60" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
              {t.fullNameLabel}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]/40 dark:text-white/40" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
                disabled={isLoading}
                className={`w-full rounded-lg border ${
                  errors.fullName
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-[#4697D2]/30 dark:border-white/20 focus:border-[#4697D2] focus:ring-[#4697D2]/30'
                } bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
              {t.phoneLabel}
            </label>
            <PhoneInput
              international
              defaultCountry="GE"
              value={phone}
              onChange={(value) => {
                setPhone(value || '');
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              disabled={isLoading}
              className={`phone-input-modal w-full rounded-lg border ${
                errors.phone
                  ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30'
                  : 'border-[#4697D2]/30 dark:border-white/20 focus-within:border-[#4697D2] focus-within:ring-[#4697D2]/30'
              } bg-white/80 dark:bg-black/40 backdrop-blur-sm text-[#1a1a1a] dark:text-white px-4 py-3 text-sm font-medium transition-all duration-300 focus-within:outline-none focus-within:ring-2 disabled:opacity-50`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Contact Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
              {t.contactMethodLabel}
            </label>
            <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 -mt-1">
              {t.contactMethodHint}
            </p>
            <div className="flex gap-2">
              {contactMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setContactMethod(method.id)}
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 disabled:opacity-50 ${
                    contactMethod === method.id
                      ? `${method.color} border-2 shadow-sm`
                      : 'bg-white/50 dark:bg-black/30 border-[#4697D2]/20 dark:border-white/10 text-[#1a1a1a]/60 dark:text-white/60 hover:bg-[#4697D2]/5'
                  }`}
                >
                  {method.icon}
                  <span className="text-xs font-medium hidden sm:inline">{method.label}</span>
                  {contactMethod === method.id && (
                    <Check className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[#4697D2]/20 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg border border-[#4697D2]/30 dark:border-white/20 text-[#1a1a1a] dark:text-white text-sm font-medium hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg bg-[#4697D2] dark:bg-white text-white dark:text-[#1a1a1a] text-sm font-bold hover:bg-[#4697D2]/90 dark:hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t.confirm}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
