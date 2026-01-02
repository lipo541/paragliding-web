'use client';

import { Tags } from 'lucide-react';
import type { ServiceCategory } from '@/lib/types/services';
import type { Locale } from '@/lib/data/services';

interface ServiceCategoryFilterProps {
  categories: ServiceCategory[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  locale: Locale;
  serviceCounts?: Record<string, number>;
}

// "All" label translations
const allLabels: Record<Locale, string> = {
  ka: 'ყველა',
  en: 'All',
  ru: 'Все',
  ar: 'الكل',
  de: 'Alle',
  tr: 'Tümü'
};

export default function ServiceCategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  locale,
  serviceCounts
}: ServiceCategoryFilterProps) {
  const getCategoryName = (category: ServiceCategory): string => {
    const nameKey = `name_${locale}` as keyof ServiceCategory;
    return (category[nameKey] as string) || category.name_en;
  };

  const totalCount = serviceCounts 
    ? Object.values(serviceCounts).reduce((sum, count) => sum + count, 0)
    : null;

  return (
    <div className="flex flex-wrap gap-2">
      {/* All category button */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
          selectedCategoryId === null
            ? 'bg-[#4697D2] text-white shadow-lg'
            : 'bg-[rgba(70,151,210,0.15)] dark:bg-black/40 text-gray-700 dark:text-gray-200 hover:bg-[rgba(70,151,210,0.25)] dark:hover:bg-black/50 border border-[#4697D2]/30 dark:border-white/10'
        }`}
      >
        <Tags className="w-4 h-4" />
        <span>{allLabels[locale]}</span>
        {totalCount !== null && (
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
            selectedCategoryId === null
              ? 'bg-white/20 text-white'
              : 'bg-[#4697D2]/20 text-[#4697D2] dark:bg-white/10 dark:text-white'
          }`}>
            {totalCount}
          </span>
        )}
      </button>

      {/* Category buttons */}
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        const count = serviceCounts?.[category.id] || 0;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              isSelected
                ? 'bg-[#4697D2] text-white shadow-lg'
                : 'bg-[rgba(70,151,210,0.15)] dark:bg-black/40 text-gray-700 dark:text-gray-200 hover:bg-[rgba(70,151,210,0.25)] dark:hover:bg-black/50 border border-[#4697D2]/30 dark:border-white/10'
            }`}
          >
            <span>{getCategoryName(category)}</span>
            {serviceCounts && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-[#4697D2]/20 text-[#4697D2] dark:bg-white/10 dark:text-white'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
