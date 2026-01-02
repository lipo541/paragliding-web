'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export type Locale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb"
      className={`inline-flex items-center gap-2 text-sm py-2 px-4 rounded-lg backdrop-blur-md bg-white/60 dark:bg-black/40 border border-[#4697D2]/20 dark:border-white/10 shadow-sm overflow-x-auto ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;
        
        return (
          <div key={index} className="flex items-center gap-2 flex-shrink-0">
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            )}
            
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#4697D2] dark:hover:text-[#4697D2] transition-colors"
              >
                {isFirst && <Home className="w-4 h-4" />}
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            ) : (
              <span className={`whitespace-nowrap ${isLast ? 'text-[#4697D2] dark:text-[#4697D2] font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                {isFirst && !item.href && <Home className="w-4 h-4 inline mr-1.5" />}
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// =====================================================
// Breadcrumb Labels for all pages
// =====================================================
export const breadcrumbLabels: Record<Locale, Record<string, string>> = {
  ka: {
    home: 'მთავარი',
    about: 'ჩვენს შესახებ',
    contact: 'კონტაქტი',
    locations: 'ლოკაციები',
    companies: 'კომპანიები',
    pilots: 'პილოტები',
    services: 'სერვისები',
    privacy: 'კონფიდენციალურობა',
    terms: 'წესები და პირობები',
    login: 'შესვლა',
    register: 'რეგისტრაცია',
    profile: 'პროფილი',
    bookings: 'ჯავშნები',
    cart: 'კალათა',
    promotions: 'აქციები',
    notifications: 'შეტყობინებები',
    dashboard: 'დაფა',
    company: 'კომპანია',
    pilot: 'პილოტი',
    user: 'მომხმარებელი',
  },
  en: {
    home: 'Home',
    about: 'About Us',
    contact: 'Contact',
    locations: 'Locations',
    companies: 'Companies',
    pilots: 'Pilots',
    services: 'Services',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    login: 'Login',
    register: 'Register',
    profile: 'Profile',
    bookings: 'Bookings',
    cart: 'Cart',
    promotions: 'Promotions',
    notifications: 'Notifications',
    dashboard: 'Dashboard',
    company: 'Company',
    pilot: 'Pilot',
    user: 'User',
  },
  ru: {
    home: 'Главная',
    about: 'О нас',
    contact: 'Контакты',
    locations: 'Локации',
    companies: 'Компании',
    pilots: 'Пилоты',
    services: 'Услуги',
    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    login: 'Вход',
    register: 'Регистрация',
    profile: 'Профиль',
    bookings: 'Бронирования',
    cart: 'Корзина',
    promotions: 'Акции',
    notifications: 'Уведомления',
    dashboard: 'Панель',
    company: 'Компания',
    pilot: 'Пилот',
    user: 'Пользователь',
  },
  ar: {
    home: 'الرئيسية',
    about: 'من نحن',
    contact: 'اتصل بنا',
    locations: 'المواقع',
    companies: 'الشركات',
    pilots: 'الطيارون',
    services: 'الخدمات',
    privacy: 'سياسة الخصوصية',
    terms: 'الشروط والأحكام',
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    profile: 'الملف الشخصي',
    bookings: 'الحجوزات',
    cart: 'السلة',
    promotions: 'العروض',
    notifications: 'الإشعارات',
    dashboard: 'لوحة التحكم',
    company: 'الشركة',
    pilot: 'الطيار',
    user: 'المستخدم',
  },
  de: {
    home: 'Startseite',
    about: 'Über uns',
    contact: 'Kontakt',
    locations: 'Standorte',
    companies: 'Unternehmen',
    pilots: 'Piloten',
    services: 'Dienstleistungen',
    privacy: 'Datenschutz',
    terms: 'AGB',
    login: 'Anmelden',
    register: 'Registrieren',
    profile: 'Profil',
    bookings: 'Buchungen',
    cart: 'Warenkorb',
    promotions: 'Aktionen',
    notifications: 'Benachrichtigungen',
    dashboard: 'Dashboard',
    company: 'Unternehmen',
    pilot: 'Pilot',
    user: 'Benutzer',
  },
  tr: {
    home: 'Ana Sayfa',
    about: 'Hakkımızda',
    contact: 'İletişim',
    locations: 'Konumlar',
    companies: 'Şirketler',
    pilots: 'Pilotlar',
    services: 'Hizmetler',
    privacy: 'Gizlilik Politikası',
    terms: 'Şartlar ve Koşullar',
    login: 'Giriş',
    register: 'Kayıt',
    profile: 'Profil',
    bookings: 'Rezervasyonlar',
    cart: 'Sepet',
    promotions: 'Promosyonlar',
    notifications: 'Bildirimler',
    dashboard: 'Panel',
    company: 'Şirket',
    pilot: 'Pilot',
    user: 'Kullanıcı',
  }
};

// Helper to build breadcrumb items
export function buildBreadcrumbs(
  locale: Locale,
  path: string[],
  customLabels?: Record<string, string>
): BreadcrumbItem[] {
  const labels = breadcrumbLabels[locale] || breadcrumbLabels.en;
  
  const items: BreadcrumbItem[] = [
    { label: labels.home, href: `/${locale}` }
  ];

  let currentPath = `/${locale}`;
  
  path.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === path.length - 1;
    const label = customLabels?.[segment] || labels[segment] || segment;
    
    items.push({
      label,
      href: isLast ? undefined : currentPath
    });
  });

  return items;
}
