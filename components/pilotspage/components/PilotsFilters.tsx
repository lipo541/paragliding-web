'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Filter, LayoutGrid, List, SortAsc, ChevronDown, Check, MapPin, Building2 } from 'lucide-react';
import { ViewMode, SortOption, Country, Location, Company } from '../hooks/usePilotsFilter';
import { SupportedLocale, getLocalizedField } from '../utils/pilotHelpers';

interface PilotsFiltersProps {
  countries: Country[];
  locations: Location[];
  companies: Company[];
  selectedCountry: string;
  selectedLocation: string;
  selectedCompany: string;
  onCountryChange: (countryId: string) => void;
  onLocationChange: (locationId: string) => void;
  onCompanyChange: (companyId: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  locale: SupportedLocale;
  translations: {
    allCountries: string;
    allLocations: string;
    allCompanies: string;
    independent: string;
    sortByName: string;
    sortByExperience: string;
    sortByFlights: string;
    sortByRating: string;
    filterBy: string;
    sortBy: string;
  };
}

export default function PilotsFilters({
  countries,
  locations,
  companies,
  selectedCountry,
  selectedLocation,
  selectedCompany,
  onCountryChange,
  onLocationChange,
  onCompanyChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  locale,
  translations
}: PilotsFiltersProps) {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Filter locations by selected country
  const filteredLocations = useMemo(() => {
    if (selectedCountry === 'all') {
      return locations;
    }
    return locations.filter(loc => loc.country_id === selectedCountry);
  }, [locations, selectedCountry]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setIsLocationOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setIsCompanyOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset location when country changes
  useEffect(() => {
    if (selectedCountry !== 'all' && selectedLocation !== 'all') {
      const locationCountry = locations.find(l => l.id === selectedLocation)?.country_id;
      if (locationCountry !== selectedCountry) {
        onLocationChange('all');
      }
    }
  }, [selectedCountry, selectedLocation, locations, onLocationChange]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name', label: translations.sortByName },
    { value: 'experience', label: translations.sortByExperience },
    { value: 'flights', label: translations.sortByFlights },
    { value: 'rating', label: translations.sortByRating },
  ];

  const getSelectedCountryName = () => {
    if (selectedCountry === 'all') return translations.allCountries;
    const country = countries.find(c => c.id === selectedCountry);
    return country ? getLocalizedField(country, 'name', locale) : translations.allCountries;
  };

  const getSelectedLocationName = () => {
    if (selectedLocation === 'all') return translations.allLocations;
    const location = locations.find(l => l.id === selectedLocation);
    return location ? getLocalizedField(location, 'name', locale) : translations.allLocations;
  };

  const getSelectedCompanyName = () => {
    if (selectedCompany === 'all') return translations.allCompanies;
    if (selectedCompany === 'independent') return translations.independent;
    const company = companies.find(c => c.id === selectedCompany);
    return company ? getLocalizedField(company, 'name', locale) : translations.allCompanies;
  };

  const getSelectedSortLabel = () => {
    return sortOptions.find(o => o.value === sortBy)?.label || translations.sortByName;
  };

  return (
    <div className="sticky top-0 z-20 mb-3">
      {/* Glass container */}
      <div className="relative rounded-lg backdrop-blur-md bg-white/60 dark:bg-black/40 border border-[#4697D2]/15 dark:border-white/10 p-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Country filter dropdown */}
          <div ref={countryRef} className="relative">
            <button
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#4697D2]/10 dark:bg-white/10 hover:bg-[#4697D2]/15 dark:hover:bg-white/15 border border-[#4697D2]/15 dark:border-white/10 transition-all text-xs"
              aria-expanded={isCountryOpen}
              aria-haspopup="listbox"
            >
              <Filter className="w-3.5 h-3.5 text-[#4697D2] dark:text-white/70" />
              <span className="font-medium text-[#1a1a1a] dark:text-white max-w-[80px] md:max-w-[120px] truncate">
                {getSelectedCountryName()}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#2d2d2d]/50 dark:text-white/40 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Country dropdown */}
            {isCountryOpen && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg backdrop-blur-xl bg-white/95 dark:bg-black/90 border border-[#4697D2]/15 dark:border-white/10 shadow-lg z-30 min-w-[140px] max-h-48 overflow-y-auto">
                <button
                  onClick={() => { onCountryChange('all'); setIsCountryOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors ${selectedCountry === 'all' ? 'text-[#4697D2] dark:text-white font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                >
                  {translations.allCountries}
                  {selectedCountry === 'all' && <Check className="w-3 h-3" />}
                </button>
                {countries.map(country => (
                  <button
                    key={country.id}
                    onClick={() => { onCountryChange(country.id); setIsCountryOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors ${selectedCountry === country.id ? 'text-[#4697D2] dark:text-white font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                  >
                    {getLocalizedField(country, 'name', locale)}
                    {selectedCountry === country.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location filter dropdown */}
          <div ref={locationRef} className="relative">
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-green-500/10 dark:bg-green-500/20 hover:bg-green-500/15 dark:hover:bg-green-500/25 border border-green-500/20 dark:border-green-500/30 transition-all text-xs"
              aria-expanded={isLocationOpen}
              aria-haspopup="listbox"
            >
              <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-[#1a1a1a] dark:text-white max-w-[80px] md:max-w-[120px] truncate">
                {getSelectedLocationName()}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#2d2d2d]/50 dark:text-white/40 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Location dropdown */}
            {isLocationOpen && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg backdrop-blur-xl bg-white/95 dark:bg-black/90 border border-green-500/20 dark:border-green-500/30 shadow-lg z-30 min-w-[160px] max-h-48 overflow-y-auto">
                <button
                  onClick={() => { onLocationChange('all'); setIsLocationOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-colors ${selectedLocation === 'all' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                >
                  {translations.allLocations}
                  {selectedLocation === 'all' && <Check className="w-3 h-3" />}
                </button>
                {filteredLocations.map(location => (
                  <button
                    key={location.id}
                    onClick={() => { onLocationChange(location.id); setIsLocationOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-colors ${selectedLocation === location.id ? 'text-green-600 dark:text-green-400 font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                  >
                    {getLocalizedField(location, 'name', locale)}
                    {selectedLocation === location.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company filter dropdown */}
          <div ref={companyRef} className="relative">
            <button
              onClick={() => setIsCompanyOpen(!isCompanyOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-purple-500/10 dark:bg-purple-500/20 hover:bg-purple-500/15 dark:hover:bg-purple-500/25 border border-purple-500/20 dark:border-purple-500/30 transition-all text-xs"
              aria-expanded={isCompanyOpen}
              aria-haspopup="listbox"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-[#1a1a1a] dark:text-white max-w-[80px] md:max-w-[120px] truncate">
                {getSelectedCompanyName()}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#2d2d2d]/50 dark:text-white/40 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Company dropdown */}
            {isCompanyOpen && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg backdrop-blur-xl bg-white/95 dark:bg-black/90 border border-purple-500/20 dark:border-purple-500/30 shadow-lg z-30 min-w-[160px] max-h-48 overflow-y-auto">
                <button
                  onClick={() => { onCompanyChange('all'); setIsCompanyOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-colors ${selectedCompany === 'all' ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                >
                  {translations.allCompanies}
                  {selectedCompany === 'all' && <Check className="w-3 h-3" />}
                </button>
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => { onCompanyChange(company.id); setIsCompanyOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-colors ${selectedCompany === company.id ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                  >
                    {getLocalizedField(company, 'name', locale)}
                    {selectedCompany === company.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Sort dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#4697D2]/10 dark:bg-white/10 hover:bg-[#4697D2]/15 dark:hover:bg-white/15 border border-[#4697D2]/15 dark:border-white/10 transition-all text-xs"
              aria-expanded={isSortOpen}
              aria-haspopup="listbox"
            >
              <SortAsc className="w-3.5 h-3.5 text-[#4697D2] dark:text-white/70" />
              <span className="font-medium text-[#1a1a1a] dark:text-white max-w-[60px] md:max-w-[100px] truncate">
                {getSelectedSortLabel()}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#2d2d2d]/50 dark:text-white/40 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Sort dropdown */}
            {isSortOpen && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg backdrop-blur-xl bg-white/95 dark:bg-black/90 border border-[#4697D2]/15 dark:border-white/10 shadow-lg z-30 min-w-[120px]">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { onSortChange(option.value); setIsSortOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors ${sortBy === option.value ? 'text-[#4697D2] dark:text-white font-medium' : 'text-[#1a1a1a] dark:text-white/80'}`}
                  >
                    {option.label}
                    {sortBy === option.value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* View mode toggle */}
          <div className="flex items-center rounded-md bg-[#4697D2]/10 dark:bg-white/10 border border-[#4697D2]/15 dark:border-white/10 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-[#4697D2] text-white' : 'text-[#2d2d2d]/60 dark:text-white/50 hover:bg-[#4697D2]/10 dark:hover:bg-white/10'}`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-[#4697D2] text-white' : 'text-[#2d2d2d]/60 dark:text-white/50 hover:bg-[#4697D2]/10 dark:hover:bg-white/10'}`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
