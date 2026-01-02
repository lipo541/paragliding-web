'use client';

import { ChevronDown } from 'lucide-react';
import { Country, Pilot, Company } from '../hooks/usePilotsFilter';
import { SupportedLocale, getLocalizedField } from '../utils/pilotHelpers';
import PilotCard from './PilotCard';
import { ViewMode } from '../hooks/usePilotsFilter';

interface CountrySectionProps {
  country: Country;
  pilots: Pilot[];
  companies: Company[];
  locale: SupportedLocale;
  viewMode: ViewMode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  cardTranslations: {
    experience: string;
    years: string;
    flights: string;
    languages: string;
    viewProfile: string;
    independent: string;
  };
}

export default function CountrySection({
  country,
  pilots,
  companies,
  locale,
  viewMode,
  isCollapsed,
  onToggleCollapse,
  cardTranslations
}: CountrySectionProps) {
  const countryName = getLocalizedField(country, 'name', locale);
  
  // Get company by ID
  const getCompanyById = (companyId?: string) => {
    if (!companyId) return undefined;
    return companies.find(c => c.id === companyId);
  };

  return (
    <section className="mb-4">
      {/* Country header - collapsible */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg backdrop-blur-sm bg-white/30 dark:bg-black/20 border border-[#4697D2]/10 dark:border-white/5 hover:bg-white/40 dark:hover:bg-black/30 transition-all group"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">
            {countryName}
          </h2>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[#4697D2]/10 dark:bg-white/10 text-[#4697D2] dark:text-white">
            {pilots.length}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#2d2d2d]/40 dark:text-white/30 transition-transform duration-200 ${
            isCollapsed ? '' : 'rotate-180'
          }`}
        />
      </button>
      
      {/* Pilots grid */}
      {!isCollapsed && (
        <div className={`mt-3 ${
          viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center' 
            : 'flex flex-col gap-3'
        }`}>
          {pilots.map(pilot => (
            <PilotCard
              key={pilot.id}
              pilot={pilot}
              company={getCompanyById(pilot.company_id)}
              locale={locale}
              viewMode={viewMode}
              translations={cardTranslations}
            />
          ))}
        </div>
      )}
    </section>
  );
}
