'use client';

import { User, Search } from 'lucide-react';

interface EmptyStateProps {
  hasSearchQuery: boolean;
  onClearSearch: () => void;
  translations: {
    noResults: string;
    noResultsDescription: string;
    noPilots: string;
    noPilotsDescription: string;
    clearSearch: string;
  };
}

export default function EmptyState({
  hasSearchQuery,
  onClearSearch,
  translations
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-[#4697D2]/10 dark:bg-white/10 flex items-center justify-center">
          {hasSearchQuery ? (
            <Search className="w-7 h-7 text-[#4697D2]/50 dark:text-white/30" />
          ) : (
            <User className="w-7 h-7 text-[#4697D2]/50 dark:text-white/30" />
          )}
        </div>
      </div>
      
      {/* Text */}
      <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-1 text-center">
        {hasSearchQuery ? translations.noResults : translations.noPilots}
      </h3>
      <p className="text-sm text-[#2d2d2d]/60 dark:text-white/50 text-center max-w-sm mb-4">
        {hasSearchQuery ? translations.noResultsDescription : translations.noPilotsDescription}
      </p>
      
      {/* Clear search button */}
      {hasSearchQuery && (
        <button
          onClick={onClearSearch}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#4697D2]/10 dark:bg-white/10 text-[#4697D2] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/20 transition-colors"
        >
          {translations.clearSearch}
        </button>
      )}
    </div>
  );
}
