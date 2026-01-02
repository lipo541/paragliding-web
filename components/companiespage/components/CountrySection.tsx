'use client';

import { ChevronDown, MapPin } from 'lucide-react';
import { Company, Country, ViewMode, Location } from '../hooks/useCompaniesFilter';
import { SupportedLocale, getLocalizedField } from '../utils/companyHelpers';
import CompanyCard from './CompanyCard';

interface CountrySectionProps {
  country: Country;
  companies: Company[];
  locations: Location[];
  locale: SupportedLocale;
  viewMode: ViewMode;
  isCollapsed: boolean;
  onToggle: () => void;
  cardTranslations: {
    verified: string;
    pilots: string;
    reviews: string;
    viewDetails: string;
  };
}

export default function CountrySection({
  country,
  companies,
  locations,
  locale,
  viewMode,
  isCollapsed,
  onToggle,
  cardTranslations
}: CountrySectionProps) {
  const countryName = getLocalizedField(country, 'name', locale);

  return (
    <section className="mb-4">
      {/* Country header - compact */}
      <button
        onClick={onToggle}
        className="w-full group flex items-center justify-between gap-2 px-3 py-2 mb-2.5 rounded-lg backdrop-blur-sm bg-white/30 dark:bg-black/25 border border-[#4697D2]/15 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/35 transition-all"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          {/* Icon - smaller */}
          <div className="p-1.5 rounded-md bg-[#4697D2]/15 dark:bg-[#4697D2]/25">
            <MapPin className="w-3.5 h-3.5 text-[#4697D2] dark:text-white" />
          </div>
          
          {/* Country name - H2 for SEO */}
          <h2 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">
            {countryName}
          </h2>
          
          {/* Count badge */}
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#4697D2]/15 dark:bg-[#4697D2]/25 text-[#4697D2] dark:text-white">
            {companies.length}
          </span>
        </div>
        
        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-[#2d2d2d]/40 dark:text-white/40 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
        />
      </button>
      
      {/* Companies grid/list */}
      <div 
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[3000px] opacity-100'
        }`}
      >
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
            : 'flex flex-col gap-2'
        }>
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              locale={locale}
              viewMode={viewMode}
              allLocations={locations}
              translations={cardTranslations}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
