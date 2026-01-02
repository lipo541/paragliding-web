'use client';

import { Building2, Search, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  hasSearchQuery: boolean;
  translations: {
    noResults: string;
    noResultsDescription: string;
    noCompanies: string;
    noCompaniesDescription: string;
    clearSearch: string;
  };
  onClearSearch?: () => void;
}

export default function EmptyState({
  hasSearchQuery,
  translations,
  onClearSearch
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Icon - compact */}
      <div className="w-14 h-14 rounded-full bg-[#4697D2]/15 dark:bg-[#4697D2]/25 flex items-center justify-center mb-4">
        {hasSearchQuery ? (
          <Search className="w-6 h-6 text-[#4697D2]/60 dark:text-white/40" />
        ) : (
          <Building2 className="w-6 h-6 text-[#4697D2]/60 dark:text-white/40" />
        )}
      </div>
      
      {/* Text */}
      <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-1 text-center">
        {hasSearchQuery ? translations.noResults : translations.noCompanies}
      </h3>
      <p className="text-xs text-[#2d2d2d]/60 dark:text-white/50 text-center max-w-xs mb-4">
        {hasSearchQuery ? translations.noResultsDescription : translations.noCompaniesDescription}
      </p>
      
      {/* Clear search button */}
      {hasSearchQuery && onClearSearch && (
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#4697D2]/10 dark:bg-[#4697D2]/20 hover:bg-[#4697D2]/15 text-xs font-medium text-[#4697D2] dark:text-white transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          {translations.clearSearch}
        </button>
      )}
    </div>
  );
}
