'use client';

import { useMemo, useState, useCallback } from 'react';
import { SupportedLocale, getLocalizedField } from '../utils/companyHelpers';

export interface Company {
  id: string;
  name_ka?: string;
  name_en?: string;
  name_ru?: string;
  name_ar?: string;
  name_de?: string;
  name_tr?: string;
  slug_ka?: string;
  slug_en?: string;
  slug_ru?: string;
  slug_ar?: string;
  slug_de?: string;
  slug_tr?: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  description_ar?: string;
  description_de?: string;
  description_tr?: string;
  logo_url?: string;
  status: 'pending' | 'verified' | 'blocked' | 'hidden';
  country_id?: string;
  location_ids?: string[];
  cached_rating?: number;
  cached_rating_count?: number;
  created_at?: string;
  pilot_count?: number;
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
  code?: string;
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

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'date' | 'rating' | 'pilots';

interface UseCompaniesFilterProps {
  companies: Company[];
  countries: Country[];
  locations: Location[];
  locale: SupportedLocale;
}

interface UseCompaniesFilterReturn {
  // State
  searchQuery: string;
  viewMode: ViewMode;
  selectedCountry: string;
  selectedLocation: string;
  sortBy: SortOption;
  collapsedCountries: Set<string>;
  
  // Setters
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCountry: (countryId: string) => void;
  setSelectedLocation: (locationId: string) => void;
  setSortBy: (sort: SortOption) => void;
  toggleCountryCollapse: (countryId: string) => void;
  
  // Computed
  filteredCompanies: Company[];
  groupedByCountry: Map<string, { country: Country; companies: Company[] }>;
  hasResults: boolean;
  totalCount: number;
}

export function useCompaniesFilter({
  companies,
  countries,
  locations,
  locale
}: UseCompaniesFilterProps): UseCompaniesFilterReturn {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
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

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(company => {
        const name = getLocalizedField(company, 'name', locale).toLowerCase();
        const description = getLocalizedField(company, 'description', locale).toLowerCase();
        return name.includes(query) || description.includes(query);
      });
    }

    // Country filter
    if (selectedCountry !== 'all') {
      result = result.filter(company => company.country_id === selectedCountry);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      result = result.filter(company => 
        company.location_ids?.includes(selectedLocation)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return getLocalizedField(a, 'name', locale).localeCompare(
            getLocalizedField(b, 'name', locale),
            locale
          );
        case 'date':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'rating':
          return (b.cached_rating || 0) - (a.cached_rating || 0);
        case 'pilots':
          return (b.pilot_count || 0) - (a.pilot_count || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [companies, searchQuery, selectedCountry, selectedLocation, sortBy, locale]);

  // Group by country
  const groupedByCountry = useMemo(() => {
    const groups = new Map<string, { country: Country; companies: Company[] }>();
    
    // Create groups for each country
    countries.forEach(country => {
      groups.set(country.id, { country, companies: [] });
    });

    // Add "unknown" group for companies without country
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
      companies: [] 
    });

    // Distribute companies
    filteredCompanies.forEach(company => {
      const countryId = company.country_id || 'unknown';
      const group = groups.get(countryId);
      if (group) {
        group.companies.push(company);
      } else {
        groups.get('unknown')?.companies.push(company);
      }
    });

    // Remove empty groups
    groups.forEach((value, key) => {
      if (value.companies.length === 0) {
        groups.delete(key);
      }
    });

    return groups;
  }, [filteredCompanies, countries]);

  return {
    searchQuery,
    viewMode,
    selectedCountry,
    selectedLocation,
    sortBy,
    collapsedCountries,
    setSearchQuery,
    setViewMode,
    setSelectedCountry,
    setSelectedLocation,
    setSortBy,
    toggleCountryCollapse,
    filteredCompanies,
    groupedByCountry,
    hasResults: filteredCompanies.length > 0,
    totalCount: filteredCompanies.length
  };
}
