'use client';

import { FileText } from 'lucide-react';
import { SupportedLocale, getLocalizedField } from '../utils/companyProfileHelpers';

interface CompanyData {
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
}

interface CompanyDescriptionProps {
  company: CompanyData;
  locale: SupportedLocale;
  translations: {
    aboutCompany: string;
    noDescription: string;
  };
}

export default function CompanyDescription({ company, locale, translations }: CompanyDescriptionProps) {
  const description = getLocalizedField(company, 'description', locale);

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-[#4697D2]" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {translations.aboutCompany}
        </h2>
      </div>
      
      {description ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
          {translations.noDescription}
        </p>
      )}
    </div>
  );
}
