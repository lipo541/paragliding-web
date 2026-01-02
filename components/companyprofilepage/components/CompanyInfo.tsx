'use client';

import { Phone, Mail, Calendar, Building, MapPin, Hash } from 'lucide-react';
import { SupportedLocale, formatDate, calculateCompanyAge, getLocalizedField } from '../utils/companyProfileHelpers';

interface CompanyData {
  phone?: string | null;
  email?: string | null;
  founded_date?: string | null;
  identification_code?: string | null;
  country?: {
    name_ka?: string | null;
    name_en?: string | null;
  } | null;
}

interface CompanyInfoProps {
  company: CompanyData;
  locale: SupportedLocale;
  translations: {
    phone: string;
    email: string;
    foundedDate: string;
    yearsActive: string;
    identificationCode: string;
    country: string;
  };
}

export default function CompanyInfo({ company, locale, translations }: CompanyInfoProps) {
  const companyAge = calculateCompanyAge(company.founded_date);
  const countryName = company.country 
    ? getLocalizedField(company.country, 'name', locale)
    : '';

  const infoItems = [
    {
      icon: Phone,
      label: translations.phone,
      value: company.phone,
      href: company.phone ? `tel:${company.phone}` : undefined,
      color: 'text-green-500',
    },
    {
      icon: Mail,
      label: translations.email,
      value: company.email,
      href: company.email ? `mailto:${company.email}` : undefined,
      color: 'text-blue-500',
    },
    {
      icon: Calendar,
      label: translations.foundedDate,
      value: company.founded_date 
        ? `${formatDate(company.founded_date, locale)} (${companyAge} ${translations.yearsActive})`
        : null,
      color: 'text-purple-500',
    },
    {
      icon: Hash,
      label: translations.identificationCode,
      value: company.identification_code,
      color: 'text-orange-500',
    },
    {
      icon: MapPin,
      label: translations.country,
      value: countryName,
      color: 'text-red-500',
    },
  ].filter(item => item.value);

  if (infoItems.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.label}</p>
              {item.href ? (
                <a 
                  href={item.href}
                  className="text-sm font-medium text-zinc-900 dark:text-white hover:text-[#4697D2] transition-colors truncate block"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {item.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
