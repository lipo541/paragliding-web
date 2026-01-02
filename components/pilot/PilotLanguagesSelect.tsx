'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Languages, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SupportedLanguage } from '@/lib/types/pilot';
import { LANGUAGE_NAMES } from '@/lib/types/pilot';

interface PilotLanguagesSelectProps {
  pilotId: string;
  selectedLanguages: SupportedLanguage[];
  onUpdate: (languages: SupportedLanguage[]) => void;
}

// All available languages
const ALL_LANGUAGES: SupportedLanguage[] = ['ka', 'en', 'ru', 'de', 'tr', 'ar', 'he', 'fr', 'es', 'it', 'zh'];

export default function PilotLanguagesSelect({
  pilotId,
  selectedLanguages = [],
  onUpdate,
}: PilotLanguagesSelectProps) {
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const toggleLanguage = useCallback(async (lang: SupportedLanguage) => {
    setSaving(true);
    try {
      let updatedLanguages: SupportedLanguage[];
      
      if (selectedLanguages.includes(lang)) {
        updatedLanguages = selectedLanguages.filter(l => l !== lang);
      } else {
        updatedLanguages = [...selectedLanguages, lang];
      }

      const { error } = await supabase
        .from('pilots')
        .update({ languages: updatedLanguages })
        .eq('id', pilotId);

      if (error) throw error;

      onUpdate(updatedLanguages);
    } catch (error) {
      console.error('Language update error:', error);
      toast.error('ენების შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  }, [selectedLanguages, onUpdate, pilotId, supabase]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-[#4697D2]" />
        <div>
          <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
            ენები
          </h4>
          <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
            აირჩიეთ ენები რომლებზეც შეგიძლიათ კლიენტებთან კომუნიკაცია
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguages.includes(lang);
          const langName = LANGUAGE_NAMES[lang];
          
          return (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
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
              {langName.ka}
            </button>
          );
        })}
      </div>

      {selectedLanguages.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          გთხოვთ აირჩიოთ მინიმუმ ერთი ენა
        </p>
      )}
    </div>
  );
}
