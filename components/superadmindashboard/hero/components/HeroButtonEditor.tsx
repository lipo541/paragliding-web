'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeroButtonActionType, HeroButtonVariant, HeroButtonShape } from '@/lib/types/hero';

interface ButtonFormData {
  id?: string;
  text_ka: string;
  text_en: string;
  text_ru: string;
  text_ar: string;
  text_de: string;
  text_tr: string;
  action_type: HeroButtonActionType;
  action_url: string;
  pilot_id: string;
  location_id: string;
  company_id: string;
  service_id: string;
  open_in_new_tab: boolean;
  variant: HeroButtonVariant;
  shape: HeroButtonShape;
}

interface HeroButtonEditorProps {
  buttons: ButtonFormData[];
  onChange: (buttons: ButtonFormData[]) => void;
}

interface SelectOption {
  id: string;
  name: string;
}

export default function HeroButtonEditor({ buttons, onChange }: HeroButtonEditorProps) {
  const [pilots, setPilots] = useState<SelectOption[]>([]);
  const [locations, setLocations] = useState<SelectOption[]>([]);
  const [companies, setCompanies] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [expandedButton, setExpandedButton] = useState<number | null>(null);

  // Load options for dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient();

      // Fetch pilots
      const { data: pilotsData } = await supabase
        .from('pilots')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setPilots(pilotsData || []);

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name_ka')
        .order('name_ka');
      setLocations((locationsData || []).map((l: { id: string; name_ka: string }) => ({ id: l.id, name: l.name_ka })));

      // Fetch companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('verified', true)
        .order('name');
      setCompanies(companiesData || []);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name_ka')
        .eq('is_active', true)
        .order('name_ka');
      setServices((servicesData || []).map((s: { id: string; name_ka: string }) => ({ id: s.id, name: s.name_ka })));
    };

    fetchOptions();
  }, []);

  const updateButton = (index: number, field: keyof ButtonFormData, value: string | boolean) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  const moveButton = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= buttons.length) return;

    const updated = [...buttons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const actionTypes: { value: HeroButtonActionType; label: string }[] = [
    { value: 'link', label: 'პირდაპირი URL' },
    { value: 'contact', label: 'კონტაქტი' },
    { value: 'pilot', label: 'პილოტი' },
    { value: 'location', label: 'ლოკაცია' },
    { value: 'company', label: 'კომპანია' },
    { value: 'service', label: 'სერვისი' }
  ];

  const variants: { value: HeroButtonVariant; label: string; preview: string }[] = [
    { value: 'glass-dark', label: '🖤 შავი Glass', preview: 'bg-black/40 border border-white/20 text-white backdrop-blur-sm' },
    { value: 'glass-light', label: '🤍 თეთრი Glass', preview: 'bg-white/90 border border-white/50 text-black' },
    { value: 'glass-primary', label: '💙 ლურჯი Glass', preview: 'bg-[rgba(70,151,210,0.4)] border border-[#4697D2]/50 text-white backdrop-blur-sm' }
  ];

  const shapes: { value: HeroButtonShape; label: string; preview: string }[] = [
    { value: 'rounded', label: 'მრგვალი კუთხეები', preview: 'rounded-xl' },
    { value: 'pill', label: 'აბი (Pill)', preview: 'rounded-full' },
    { value: 'square', label: 'კვადრატული', preview: 'rounded-lg' }
  ];

  if (buttons.length === 0) {
    return (
      <div className="text-center py-8 bg-foreground/5 rounded-lg text-foreground/60">
        <p>ღილაკები არ არის დამატებული</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {buttons.map((button, index) => (
        <div
          key={index}
          className="border border-foreground/10 rounded-lg overflow-hidden"
        >
          {/* Button Header */}
          <div
            className="flex items-center justify-between p-3 bg-foreground/5 cursor-pointer"
            onClick={() => setExpandedButton(expandedButton === index ? null : index)}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); moveButton(index, 'up'); }}
                  disabled={index === 0}
                  className="p-0.5 text-foreground/40 hover:text-foreground disabled:opacity-30"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveButton(index, 'down'); }}
                  disabled={index === buttons.length - 1}
                  className="p-0.5 text-foreground/40 hover:text-foreground disabled:opacity-30"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded ${variants.find(v => v.value === button.variant)?.preview}`}>
                {button.text_ka || `ღილაკი ${index + 1}`}
              </span>
              <span className="text-xs text-foreground/50">
                {actionTypes.find(a => a.value === button.action_type)?.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); removeButton(index); }}
                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <svg
                className={`w-4 h-4 transition-transform ${expandedButton === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Button Details */}
          {expandedButton === index && (
            <div className="p-4 space-y-4">
              {/* Text in all languages */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    🇬🇪 ქართ.
                  </label>
                  <input
                    type="text"
                    value={button.text_ka}
                    onChange={(e) => updateButton(index, 'text_ka', e.target.value)}
                    placeholder="დაჯავშნე"
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    🇬🇧 EN
                  </label>
                  <input
                    type="text"
                    value={button.text_en}
                    onChange={(e) => updateButton(index, 'text_en', e.target.value)}
                    placeholder="Book Now"
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    🇷🇺 RU
                  </label>
                  <input
                    type="text"
                    value={button.text_ru}
                    onChange={(e) => updateButton(index, 'text_ru', e.target.value)}
                    placeholder="Забронировать"
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    🇸🇦 AR
                  </label>
                  <input
                    type="text"
                    value={button.text_ar}
                    onChange={(e) => updateButton(index, 'text_ar', e.target.value)}
                    placeholder="احجز الآن"
                    dir="rtl"
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    🇩🇪 DE
                  </label>
                  <input
                    type="text"
                    value={button.text_de}
                    onChange={(e) => updateButton(index, 'text_de', e.target.value)}
                    placeholder="Jetzt buchen"
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    🇹🇷 TR
                  </label>
                  <input
                    type="text"
                    value={button.text_tr}
                    onChange={(e) => updateButton(index, 'text_tr', e.target.value)}
                    placeholder="Şimdi Rezerve Et"
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  />
                </div>
              </div>

              {/* Action Type, Variant & Shape */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    მოქმედების ტიპი
                  </label>
                  <select
                    value={button.action_type}
                    onChange={(e) => updateButton(index, 'action_type', e.target.value as HeroButtonActionType)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    {actionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    ფერი (სტილი)
                  </label>
                  <select
                    value={button.variant}
                    onChange={(e) => updateButton(index, 'variant', e.target.value as HeroButtonVariant)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    {variants.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    ფორმა
                  </label>
                  <select
                    value={button.shape || 'rounded'}
                    onChange={(e) => updateButton(index, 'shape', e.target.value as HeroButtonShape)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    {shapes.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action-specific fields */}
              {button.action_type === 'link' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground/60 mb-1">
                      URL მისამართი
                    </label>
                    <input
                      type="text"
                      value={button.action_url}
                      onChange={(e) => updateButton(index, 'action_url', e.target.value)}
                      placeholder="https://example.com ან /ka/about"
                      className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={button.open_in_new_tab}
                      onChange={(e) => updateButton(index, 'open_in_new_tab', e.target.checked)}
                      className="rounded border-foreground/20"
                    />
                    ახალ ტაბში გახსნა
                  </label>
                </div>
              )}

              {button.action_type === 'pilot' && (
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    აირჩიეთ პილოტი
                  </label>
                  <select
                    value={button.pilot_id}
                    onChange={(e) => updateButton(index, 'pilot_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    <option value="">-- აირჩიეთ პილოტი --</option>
                    {pilots.map(pilot => (
                      <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {button.action_type === 'location' && (
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    აირჩიეთ ლოკაცია
                  </label>
                  <select
                    value={button.location_id}
                    onChange={(e) => updateButton(index, 'location_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    <option value="">-- აირჩიეთ ლოკაცია --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {button.action_type === 'company' && (
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    აირჩიეთ კომპანია
                  </label>
                  <select
                    value={button.company_id}
                    onChange={(e) => updateButton(index, 'company_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    <option value="">-- აირჩიეთ კომპანია --</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {button.action_type === 'service' && (
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">
                    აირჩიეთ სერვისი
                  </label>
                  <select
                    value={button.service_id}
                    onChange={(e) => updateButton(index, 'service_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background"
                  >
                    <option value="">-- აირჩიეთ სერვისი --</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
