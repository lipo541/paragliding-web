'use client';

import Link from 'next/link';
import { Calendar, FileText, MapPin, Users, Plane } from 'lucide-react';

interface CompanySidebarProps {
  company: {
    id: string;
    name: string;
    logoUrl?: string | null;
    foundedDate?: string | null;
    identificationCode?: string | null;
    countryName?: string | null;
    pilotsCount?: number;
  };
  locale: string;
  translations: {
    founded: string;
    idCode: string;
    country: string;
    pilots: string;
    bookNow: string;
    bookingDescription: string;
  };
}

export default function CompanySidebar({ company, locale, translations }: CompanySidebarProps) {
  
  // Format founded date
  const foundedYear = company.foundedDate 
    ? new Date(company.foundedDate).getFullYear()
    : null;

  const hasCompanyInfo = foundedYear || company.identificationCode || company.countryName;

  return (
    <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4 sticky top-20">
      
      {/* Booking CTA */}
      <div className="mb-4 pb-4 border-b border-[#4697D2]/20 dark:border-white/10">
        <div className="text-center mb-3">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#4697D2] to-[#3a7fb8] dark:from-[#CAFA00] dark:to-[#b8e600] flex items-center justify-center">
            <Plane className="w-6 h-6 text-white dark:text-black" />
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {translations.bookingDescription}
          </p>
        </div>
        <Link
          href={`/${locale}/bookings?company=${company.id}`}
          className="block w-full py-2.5 text-center text-sm rounded-lg bg-gradient-to-r from-[#4697D2] to-[#3a7fb8] dark:from-[#CAFA00] dark:to-[#b8e600] text-white dark:text-black font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          {translations.bookNow}
        </Link>
      </div>

      {/* Company Info */}
      {hasCompanyInfo && (
        <div className="space-y-2">
          {company.pilotsCount !== undefined && company.pilotsCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Users className="w-3.5 h-3.5" />
                {translations.pilots}
              </span>
              <span className="font-medium text-zinc-800 dark:text-white">{company.pilotsCount}</span>
            </div>
          )}
          {foundedYear && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                {translations.founded}
              </span>
              <span className="font-medium text-zinc-800 dark:text-white">{foundedYear}</span>
            </div>
          )}
          {company.identificationCode && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <FileText className="w-3.5 h-3.5" />
                {translations.idCode}
              </span>
              <span className="font-medium text-zinc-800 dark:text-white font-mono">{company.identificationCode}</span>
            </div>
          )}
          {company.countryName && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <MapPin className="w-3.5 h-3.5" />
                {translations.country}
              </span>
              <span className="font-medium text-zinc-800 dark:text-white">{company.countryName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
