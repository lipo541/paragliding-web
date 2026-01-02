'use client';

import { Building2 } from 'lucide-react';

interface CompanyAboutSectionProps {
  description?: string | null;
  translations: {
    aboutCompany: string;
    noDescription: string;
  };
}

export default function CompanyAboutSection({ description, translations }: CompanyAboutSectionProps) {
  if (!description) return null;
  
  return (
    <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
        <Building2 className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
        {translations.aboutCompany}
      </h2>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}
