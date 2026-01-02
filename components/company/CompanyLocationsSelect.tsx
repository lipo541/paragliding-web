'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name_ka: string | null;
  name_en: string | null;
  country_id: string;
}

interface Country {
  id: string;
  name_ka: string | null;
  name_en: string | null;
}

interface CompanyLocationsSelectProps {
  companyId: string;
  selectedLocationIds: string[];
  selectedCountryId?: string;
  onUpdate: (locationIds: string[]) => void;
  onCountryUpdate?: (countryId: string) => void;
}

export default function CompanyLocationsSelect({
  companyId,
  selectedLocationIds = [],
  selectedCountryId,
  onUpdate,
  onCountryUpdate,
}: CompanyLocationsSelectProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // Fetch all locations and countries
  useEffect(() => {
    const fetchData = async () => {
      const [locationsRes, countriesRes] = await Promise.all([
        supabase
          .from('locations')
          .select('id, name_ka, name_en, country_id')
          .order('name_ka'),
        supabase
          .from('countries')
          .select('id, name_ka, name_en')
          .eq('is_active', true)
          .order('name_ka')
      ]);

      if (locationsRes.error) {
        console.error('Error fetching locations:', locationsRes.error);
        toast.error('ლოკაციების ჩატვირთვისას მოხდა შეცდომა');
      } else {
        setLocations(locationsRes.data || []);
      }

      if (countriesRes.error) {
        console.error('Error fetching countries:', countriesRes.error);
      } else {
        setCountries(countriesRes.data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const toggleLocation = useCallback(async (locationId: string) => {
    setSaving(true);
    try {
      let updatedIds: string[];
      
      if (selectedLocationIds.includes(locationId)) {
        updatedIds = selectedLocationIds.filter(id => id !== locationId);
      } else {
        updatedIds = [...selectedLocationIds, locationId];
      }

      const { error } = await supabase
        .from('companies')
        .update({ location_ids: updatedIds })
        .eq('id', companyId);

      if (error) throw error;

      onUpdate(updatedIds);
      toast.success('ლოკაციები განახლდა');
    } catch (error) {
      console.error('Location update error:', error);
      toast.error('ლოკაციების შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  }, [selectedLocationIds, onUpdate, companyId, supabase]);

  const updateCountry = useCallback(async (countryId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ country_id: countryId })
        .eq('id', companyId);

      if (error) throw error;

      onCountryUpdate?.(countryId);
      toast.success('ქვეყანა განახლდა');
    } catch (error) {
      console.error('Country update error:', error);
      toast.error('ქვეყნის შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  }, [onCountryUpdate, companyId, supabase]);

  // Group locations by country
  const locationsByCountry = locations.reduce((acc, location) => {
    const countryId = location.country_id;
    if (!acc[countryId]) {
      acc[countryId] = [];
    }
    acc[countryId].push(location);
    return acc;
  }, {} as Record<string, Location[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#4697D2]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#4697D2]" />
          <div>
            <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
              ქვეყანა
            </h4>
            <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
              აირჩიეთ ქვეყანა სადაც კომპანია მუშაობს
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {countries.map((country) => {
            const isSelected = selectedCountryId === country.id;
            
            return (
              <button
                key={country.id}
                onClick={() => updateCountry(country.id)}
                disabled={saving}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  flex items-center gap-1.5
                  ${isSelected
                    ? 'bg-[#4697D2] text-white shadow-md'
                    : 'bg-[#1a1a1a]/5 dark:bg-white/10 text-[#1a1a1a]/70 dark:text-white/70 hover:bg-[#1a1a1a]/10 dark:hover:bg-white/15'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isSelected && <Check className="w-3 h-3" />}
                {country.name_ka || country.name_en || 'უცნობი'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Locations Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-500" />
          <div>
            <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
              ლოკაციები
            </h4>
            <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
              აირჩიეთ ლოკაციები სადაც კომპანია ასრულებს ფრენებს
            </p>
          </div>
        </div>

        {Object.entries(locationsByCountry).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(locationsByCountry).map(([countryId, countryLocations]) => {
              const country = countries.find(c => c.id === countryId);
              
              return (
                <div key={countryId} className="space-y-2">
                  <p className="text-xs font-medium text-[#4697D2] dark:text-[#4697D2]">
                    {country?.name_ka || country?.name_en || 'უცნობი ქვეყანა'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {countryLocations.map((location) => {
                      const isSelected = selectedLocationIds.includes(location.id);
                      
                      return (
                        <button
                          key={location.id}
                          onClick={() => toggleLocation(location.id)}
                          disabled={saving}
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                            flex items-center gap-1.5
                            ${isSelected
                              ? 'bg-green-500 text-white shadow-md'
                              : 'bg-[#1a1a1a]/5 dark:bg-white/10 text-[#1a1a1a]/70 dark:text-white/70 hover:bg-[#1a1a1a]/10 dark:hover:bg-white/15'
                            }
                            ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {location.name_ka || location.name_en || 'უცნობი'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">
            ლოკაციები ვერ მოიძებნა
          </p>
        )}

        {selectedLocationIds.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            რეკომენდებულია აირჩიოთ მინიმუმ ერთი ლოკაცია
          </p>
        )}
      </div>
    </div>
  );
}
