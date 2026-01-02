'use client';

import { useMemo, useState, useCallback } from 'react';
import { SupportedLocale, getLocalizedField, getPilotName } from '../utils/pilotHelpers';

export interface Pilot {
  id: string;
  user_id: string;
  first_name_ka?: string;
  first_name_en?: string;
  first_name_ru?: string;
  first_name_ar?: string;
  first_name_de?: string;
  first_name_tr?: string;
  last_name_ka?: string;
  last_name_en?: string;
  last_name_ru?: string;
  last_name_ar?: string;
  last_name_de?: string;
  last_name_tr?: string;
  slug_ka?: string;
  slug_en?: string;
  slug_ru?: string;
  slug_ar?: string;
  slug_de?: string;
  slug_tr?: string;
  bio_ka?: string;
  bio_en?: string;
  bio_ru?: string;
  bio_ar?: string;
  bio_de?: string;
  bio_tr?: string;
  avatar_url?: string;
  status: 'pending' | 'verified' | 'blocked' | 'hidden';
  company_id?: string;
  location_ids?: string[];
  languages?: string[];
  commercial_start_date?: string;
  tandem_flights?: number;
  cached_rating?: number;
  cached_rating_count?: number;
  created_at?: string;
}

export interface Country {
  id: string;
  name_ka?: string;
  name_en?: string;
  name_ru?: string;
  name_ar?: string;
  name_de?: string;
  name_tr?: string;
  slug_ka?: string;
  slug_en?: string;
}

export interface Location {
  id: string;
  name_ka?: string;
  name_en?: string;
  name_ru?: string;
  name_ar?: string;
  name_de?: string;
  name_tr?: string;
  country_id: string;
}

export interface Company {
  id: string;
  name_ka?: string;
  name_en?: string;
  name_ru?: string;
  name_ar?: string;
  name_de?: string;
  name_tr?: string;
  logo_url?: string;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'experience' | 'flights' | 'rating';

interface UsePilotsFilterProps {
  pilots: Pilot[];
  countries: Country[];
  locations: Location[];
  companies: Company[];
  locale: SupportedLocale;
}

interface UsePilotsFilterReturn {
  // State
  searchQuery: string;
  viewMode: ViewMode;
  selectedCountry: string;
  selectedLocation: string;
  selectedCompany: string;
  sortBy: SortOption;
  collapsedCountries: Set<string>;
  
  // Setters
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCountry: (countryId: string) => void;
  setSelectedLocation: (locationId: string) => void;
  setSelectedCompany: (companyId: string) => void;
  setSortBy: (sort: SortOption) => void;
  toggleCountryCollapse: (countryId: string) => void;
  
  // Computed
  filteredPilots: Pilot[];
  groupedByCountry: Map<string, { country: Country; pilots: Pilot[] }>;
  filteredLocations: Location[];
  hasResults: boolean;
  totalCount: number;
}

// Helper to get country_id from location_ids
function getCountryFromLocations(
  locationIds: string[] | undefined,
  locations: Location[]
): string | undefined {
  if (!locationIds || locationIds.length === 0) return undefined;
  const location = locations.find(loc => locationIds.includes(loc.id));
  return location?.country_id;
}

export function usePilotsFilter({
  pilots,
  countries,
  locations,
  companies,
  locale
}: UsePilotsFilterProps): UsePilotsFilterReturn {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [collapsedCountries, setCollapsedCountries] = useState<Set<string>>(new Set());

  // Toggle country collapse
  const toggleCountryCollapse = useCallback((countryId: string) => {
    setCollapsedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  }, []);

  // Filter locations by selected country
  const filteredLocations = useMemo(() => {
    if (selectedCountry === 'all') return locations;
    return locations.filter(loc => loc.country_id === selectedCountry);
  }, [locations, selectedCountry]);

  // Reset location when country changes
  const handleSetSelectedCountry = useCallback((countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedLocation('all');
  }, []);

  // Filter and sort pilots
  const filteredPilots = useMemo(() => {
    let result = [...pilots];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(pilot => {
        const name = getPilotName(pilot, locale).toLowerCase();
        const bio = getLocalizedField(pilot, 'bio', locale).toLowerCase();
        return name.includes(query) || bio.includes(query);
      });
    }

    // Country filter (through location_ids)
    if (selectedCountry !== 'all') {
      result = result.filter(pilot => {
        const countryId = getCountryFromLocations(pilot.location_ids, locations);
        return countryId === selectedCountry;
      });
    }

    // Location filter
    if (selectedLocation !== 'all') {
      result = result.filter(pilot => 
        pilot.location_ids?.includes(selectedLocation)
      );
    }

    // Company filter
    if (selectedCompany !== 'all') {
      result = result.filter(pilot => pilot.company_id === selectedCompany);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return getPilotName(a, locale).localeCompare(
            getPilotName(b, locale),
            locale
          );
        case 'experience': {
          const expA = a.commercial_start_date ? new Date(a.commercial_start_date).getTime() : Date.now();
          const expB = b.commercial_start_date ? new Date(b.commercial_start_date).getTime() : Date.now();
          return expA - expB; // Earlier date = more experience
        }
        case 'flights':
          return (b.tandem_flights || 0) - (a.tandem_flights || 0);
        case 'rating':
          return (b.cached_rating || 0) - (a.cached_rating || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [pilots, searchQuery, selectedCountry, selectedLocation, selectedCompany, sortBy, locale, locations]);

  // Group by country
  const groupedByCountry = useMemo(() => {
    const groups = new Map<string, { country: Country; pilots: Pilot[] }>();
    
    // Create groups for each country
    countries.forEach(country => {
      groups.set(country.id, { country, pilots: [] });
    });

    // Add "unknown" group for pilots without location
    groups.set('unknown', { 
      country: { 
        id: 'unknown', 
        name_ka: 'სხვა', 
        name_en: 'Other',
        name_ru: 'Другое',
        name_de: 'Andere',
        name_tr: 'Diğer',
        name_ar: 'أخرى'
      }, 
      pilots: [] 
    });

    // Distribute pilots
    filteredPilots.forEach(pilot => {
      const countryId = getCountryFromLocations(pilot.location_ids, locations) || 'unknown';
      const group = groups.get(countryId);
      if (group) {
        group.pilots.push(pilot);
      } else {
        groups.get('unknown')?.pilots.push(pilot);
      }
    });

    // Remove empty groups
    groups.forEach((value, key) => {
      if (value.pilots.length === 0) {
        groups.delete(key);
      }
    });

    return groups;
  }, [filteredPilots, countries, locations]);

  return {
    searchQuery,
    viewMode,
    selectedCountry,
    selectedLocation,
    selectedCompany,
    sortBy,
    collapsedCountries,
    setSearchQuery,
    setViewMode,
    setSelectedCountry: handleSetSelectedCountry,
    setSelectedLocation,
    setSelectedCompany,
    setSortBy,
    toggleCountryCollapse,
    filteredPilots,
    groupedByCountry,
    filteredLocations,
    hasResults: filteredPilots.length > 0,
    totalCount: filteredPilots.length
  };
}
