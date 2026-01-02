'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name_ka: string | null;
  name_en: string | null;
}

interface PilotLocationsSelectProps {
  pilotId: string;
  selectedLocationIds: string[];
  onUpdate: (locationIds: string[]) => void;
}

export default function PilotLocationsSelect({
  pilotId,
  selectedLocationIds = [],
  onUpdate,
}: PilotLocationsSelectProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // Fetch all locations
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name_ka, name_en')
        .order('name_ka');

      if (error) {
        console.error('Error fetching locations:', error);
        toast.error('ლოკაციების ჩატვირთვისას მოხდა შეცდომა');
      } else {
        setLocations(data || []);
      }
      setLoading(false);
    };

    fetchLocations();
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
        .from('pilots')
        .update({ location_ids: updatedIds })
        .eq('id', pilotId);

      if (error) throw error;

      onUpdate(updatedIds);
    } catch (error) {
      console.error('Location update error:', error);
      toast.error('ლოკაციების შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  }, [selectedLocationIds, onUpdate, pilotId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#4697D2]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#4697D2]" />
        <div>
          <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
            ლოკაციები
          </h4>
          <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
            აირჩიეთ ლოკაციები სადაც ასრულებთ ფრენებს
          </p>
        </div>
      </div>

      {locations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {locations.map((location) => {
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
                    ? 'bg-[#4697D2] text-white shadow-md'
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
      ) : (
        <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">
          ლოკაციები ვერ მოიძებნა
        </p>
      )}

      {selectedLocationIds.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          გთხოვთ აირჩიოთ მინიმუმ ერთი ლოკაცია
        </p>
      )}
    </div>
  );
}
