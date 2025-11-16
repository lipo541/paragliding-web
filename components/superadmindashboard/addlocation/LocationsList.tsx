'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LocationPage } from '@/lib/types/location';

interface LocationsListProps {
  onEdit?: (locationId: string) => void;
}

interface LocationWithDetails extends LocationPage {
  location_name?: string;
  country_name?: string;
}

export default function LocationsList({ onEdit }: LocationsListProps) {
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('location_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        setLocations([]);
        return;
      }

      // Fetch location and country names separately
      const transformedData = await Promise.all(
        data.map(async (item: any) => {
          let locationName = '';
          let countryName = '';

          // Fetch location name
          if (item.location_id) {
            const { data: locationData } = await supabase
              .from('locations')
              .select('name_ka')
              .eq('id', item.location_id)
              .single();
            locationName = locationData?.name_ka || '';
          }

          // Fetch country name
          if (item.country_id) {
            const { data: countryData } = await supabase
              .from('countries')
              .select('name_ka')
              .eq('id', item.country_id)
              .single();
            countryName = countryData?.name_ka || '';
          }

          return {
            ...item,
            location_name: locationName,
            country_name: countryName,
          };
        })
      );

      setLocations(transformedData);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, locationName: string) => {
    if (!confirm(`დარწმუნებული ხართ, რომ გსურთ ${locationName}-ის წაშლა?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('location_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh list
      fetchLocations();
      alert('ლოკაცია წარმატებით წაიშალა!');
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('შეცდომა ლოკაციის წაშლისას!');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, locationName: string) => {
    try {
      const { error } = await supabase
        .from('location_pages')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Refresh list
      fetchLocations();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert(`შეცდომა ${locationName}-ის სტატუსის შეცვლისას!`);
    }
  };

  const getAvailableLanguages = (content: any) => {
    if (!content) return [];
    
    const languageMap: { [key: string]: string } = {
      ka: 'ka',
      en: 'en',
      ru: 'ru',
      ar: 'ar',
      de: 'de',
      tr: 'tr',
    };

    const allLanguages = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
    
    return allLanguages.map(lang => ({
      code: languageMap[lang],
      filled: content[lang] && Object.keys(content[lang]).length > 0
    }));
  };

  const toggleCountry = (countryId: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  };

  // Group locations by country
  const groupedLocations = locations.reduce((acc, location) => {
    const countryId = location.country_id;
    const countryName = location.country_name || 'Unknown';
    
    if (!acc[countryId]) {
      acc[countryId] = {
        countryId,
        countryName,
        locations: []
      };
    }
    
    acc[countryId].locations.push(location);
    return acc;
  }, {} as Record<string, { countryId: string; countryName: string; locations: LocationWithDetails[] }>);

  const countriesArray = Object.values(groupedLocations).sort((a, b) => 
    a.countryName.localeCompare(b.countryName, 'ka')
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-foreground/60">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-foreground">ჯერ არ არის დამატებული ლოკაციები</h3>
        <p className="mt-2 text-sm text-foreground/60">
          დააჭირეთ &quot;დაამატე ლოკაცია&quot; ღილაკს ახალი ლოკაციის დასამატებლად
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground/60">
          დამატებული ლოკაციები ({locations.length})
        </h3>
      </div>

      {/* Grouped by Country */}
      <div className="space-y-3">
        {countriesArray.map((country) => {
          const isExpanded = expandedCountries.has(country.countryId);
          
          return (
            <div key={country.countryId} className="space-y-1">
              {/* Country Header */}
              <button
                onClick={() => toggleCountry(country.countryId)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-foreground/10 hover:border-foreground/20 transition-colors bg-foreground/[0.02]"
              >
                {/* Expand/Collapse Icon */}
                <svg 
                  className={`w-4 h-4 text-foreground/60 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                {/* Country Name */}
                <span className="text-sm font-semibold text-foreground">
                  {country.countryName}
                </span>

                {/* Location Count */}
                <span className="text-xs text-foreground/40">
                  ({country.locations.length})
                </span>
              </button>

              {/* Locations List */}
              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {country.locations.map((location) => {
                    const availableLanguages = getAvailableLanguages(location.content);

                    return (
                      <div
                        key={location.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md border border-foreground/5"
                      >
                        {/* Location Icon */}
                        <svg className="w-4 h-4 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>

                        {/* Location Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {location.location_name}
                            </span>
                            
                            {/* Languages */}
                            <div className="flex gap-1">
                              {availableLanguages.map((lang, idx) => (
                                <span 
                                  key={idx} 
                                  className={`text-xs font-medium ${lang.filled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                >
                                  {lang.code}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {/* Toggle Switch */}
                          <button
                            onClick={() => location.id && handleToggleActive(location.id, location.is_active, location.location_name || '')}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              location.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={location.is_active ? 'აქტიური - დაკლიკებით გამორთვა' : 'გამორთული - დაკლიკებით ჩართვა'}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                location.is_active ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => location.id && onEdit?.(location.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                            title="რედაქტირება"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => location.id && handleDelete(location.id, location.location_name || '')}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                            title="წაშლა"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
