'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { Locale } from '@/lib/data/services';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ServiceBreadcrumbsProps {
  locale: Locale;
  serviceName?: string;
  items?: BreadcrumbItem[];
}

// Translation labels
const labels: Record<Locale, { home: string; services: string }> = {
  ka: { home: 'მთავარი', services: 'სერვისები' },
  en: { home: 'Home', services: 'Services' },
  ru: { home: 'Главная', services: 'Услуги' },
  ar: { home: 'الرئيسية', services: 'الخدمات' },
  de: { home: 'Startseite', services: 'Dienstleistungen' },
  tr: { home: 'Ana Sayfa', services: 'Hizmetler' }
};

export default function ServiceBreadcrumbs({ 
  locale, 
  serviceName,
  items 
}: ServiceBreadcrumbsProps) {
  const localeLabels = labels[locale] || labels.en;

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = items || [
    { label: localeLabels.home, href: `/${locale}` },
    { label: localeLabels.services, href: `/${locale}/services` },
    ...(serviceName ? [{ label: serviceName }] : [])
  ];

  return (
    <nav 
      aria-label="Breadcrumb"
      className="inline-flex items-center gap-2 text-sm py-2 px-4 rounded-lg backdrop-blur-md bg-white/60 dark:bg-black/40 border border-[#4697D2]/20 dark:border-white/10 shadow-sm overflow-x-auto"
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
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
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
