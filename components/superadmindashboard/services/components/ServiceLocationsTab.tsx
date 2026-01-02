'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Search, Check, X } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  country?: {
    name_ka: string;
    name_en: string;
  };
}

interface ServiceLocationsTabProps {
  selectedLocationIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ServiceLocationsTab({
  selectedLocationIds,
  onChange,
}: ServiceLocationsTabProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name_ka,
          name_en,
          country:countries(name_ka, name_en)
        `)
        .order('name_ka');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    if (selectedLocationIds.includes(locationId)) {
      onChange(selectedLocationIds.filter(id => id !== locationId));
    } else {
      onChange([...selectedLocationIds, locationId]);
    }
  };

  const selectAll = () => {
    onChange(filteredLocations.map(l => l.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const filteredLocations = locations.filter(location => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      location.name_ka?.toLowerCase().includes(query) ||
      location.name_en?.toLowerCase().includes(query) ||
      location.country?.name_ka?.toLowerCase().includes(query) ||
      location.country?.name_en?.toLowerCase().includes(query)
    );
  });

  // Group locations by country
  const groupedLocations = filteredLocations.reduce((acc, location) => {
    const countryName = location.country?.name_ka || 'სხვა';
    if (!acc[countryName]) {
      acc[countryName] = [];
    }
    acc[countryName].push(location);
    return acc;
  }, {} as Record<string, Location[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-foreground/60" />
          <span className="text-sm text-foreground/60">
            არჩეულია: <strong className="text-foreground">{selectedLocationIds.length}</strong> ლოკაცია
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            ყველას არჩევა
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs bg-foreground/10 text-foreground/60 rounded-lg hover:bg-foreground/20 transition-colors"
          >
            გასუფთავება
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ძებნა ლოკაციის ან ქვეყნის სახელით..."
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Locations Grid */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(groupedLocations).map(([countryName, countryLocations]) => (
          <div key={countryName}>
            <h4 className="text-sm font-medium text-foreground/70 mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
              {countryName} ({countryLocations.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {countryLocations.map(location => {
                const isSelected = selectedLocationIds.includes(location.id);
                return (
                  <button
                    key={location.id}
                    onClick={() => toggleLocation(location.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-foreground'
                        : 'border-border bg-background hover:bg-foreground/5 text-foreground/70'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{location.name_ka}</p>
                      <p className="text-xs text-foreground/50 truncate">{location.name_en}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredLocations.length === 0 && (
          <div className="text-center py-8 text-foreground/50">
            ლოკაციები არ მოიძებნა
          </div>
        )}
      </div>

      {/* Selected locations summary */}
      {selectedLocationIds.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground/70 mb-2">არჩეული ლოკაციები:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedLocationIds.map(id => {
              const location = locations.find(l => l.id === id);
              if (!location) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs"
                >
                  {location.name_ka}
                  <button
                    onClick={() => toggleLocation(id)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
