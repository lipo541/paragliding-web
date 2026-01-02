'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeroSlide, HeroSlideButton, HeroButtonActionType, HeroButtonVariant, HeroButtonShape } from '@/lib/types/hero';
import HeroImageUpload from './HeroImageUpload';
import HeroButtonEditor from './HeroButtonEditor';

interface HeroSlideFormProps {
  slide: HeroSlide | null;
  onClose: (refresh?: boolean) => void;
}

type TabType = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

interface FormData {
  image_url_light: string;
  image_url_dark: string;
  title_ka: string;
  title_en: string;
  title_ru: string;
  title_ar: string;
  title_de: string;
  title_tr: string;
  description_ka: string;
  description_en: string;
  description_ru: string;
  description_ar: string;
  description_de: string;
  description_tr: string;
  is_active: boolean;
}

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

export default function HeroSlideForm({ slide, onClose }: HeroSlideFormProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabType>('ka');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    image_url_light: '',
    image_url_dark: '',
    title_ka: '',
    title_en: '',
    title_ru: '',
    title_ar: '',
    title_de: '',
    title_tr: '',
    description_ka: '',
    description_en: '',
    description_ru: '',
    description_ar: '',
    description_de: '',
    description_tr: '',
    is_active: true
  });

  const [buttons, setButtons] = useState<ButtonFormData[]>([]);

  // Initialize form with slide data
  useEffect(() => {
    if (slide) {
      setFormData({
        image_url_light: slide.image_url_light || '',
        image_url_dark: slide.image_url_dark || '',
        title_ka: slide.title_ka || '',
        title_en: slide.title_en || '',
        title_ru: slide.title_ru || '',
        title_ar: slide.title_ar || '',
        title_de: slide.title_de || '',
        title_tr: slide.title_tr || '',
        description_ka: slide.description_ka || '',
        description_en: slide.description_en || '',
        description_ru: slide.description_ru || '',
        description_ar: slide.description_ar || '',
        description_de: slide.description_de || '',
        description_tr: slide.description_tr || '',
        is_active: slide.is_active
      });

      if (slide.buttons) {
        setButtons(slide.buttons.map(btn => ({
          id: btn.id,
          text_ka: btn.text_ka || '',
          text_en: btn.text_en || '',
          text_ru: btn.text_ru || '',
          text_ar: btn.text_ar || '',
          text_de: btn.text_de || '',
          text_tr: btn.text_tr || '',
          action_type: btn.action_type,
          action_url: btn.action_url || '',
          pilot_id: btn.pilot_id || '',
          location_id: btn.location_id || '',
          company_id: btn.company_id || '',
          service_id: btn.service_id || '',
          open_in_new_tab: btn.open_in_new_tab || false,
          variant: btn.variant || 'glass-dark',
          shape: btn.shape || 'rounded'
        })));
      }
    }
  }, [slide]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.image_url_light || !formData.image_url_dark) {
      alert('გთხოვთ ატვირთოთ ორივე სურათი (Light და Dark რეჟიმისთვის)');
      return;
    }
    if (!formData.title_ka || !formData.title_en || !formData.title_ru || 
        !formData.title_ar || !formData.title_de || !formData.title_tr) {
      alert('გთხოვთ შეავსოთ სათაური ყველა ენაზე (6 ენა)');
      return;
    }

    setIsSaving(true);

    try {
      let slideId = slide?.id;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (slide) {
        // Update existing slide
        const { error } = await supabase
          .from('hero_slides')
          .update({
            image_url_light: formData.image_url_light,
            image_url_dark: formData.image_url_dark,
            title_ka: formData.title_ka,
            title_en: formData.title_en,
            title_ru: formData.title_ru,
            title_ar: formData.title_ar,
            title_de: formData.title_de,
            title_tr: formData.title_tr,
            description_ka: formData.description_ka || null,
            description_en: formData.description_en || null,
            description_ru: formData.description_ru || null,
            description_ar: formData.description_ar || null,
            description_de: formData.description_de || null,
            description_tr: formData.description_tr || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', slide.id);

        if (error) throw error;
      } else {
        // Create new slide
        const { data: maxOrderData } = await supabase
          .from('hero_slides')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1)
          .single();

        const newOrder = (maxOrderData?.display_order ?? -1) + 1;

        const { data: newSlide, error } = await supabase
          .from('hero_slides')
          .insert({
            image_url_light: formData.image_url_light,
            image_url_dark: formData.image_url_dark,
            title_ka: formData.title_ka,
            title_en: formData.title_en,
            title_ru: formData.title_ru,
            title_ar: formData.title_ar,
            title_de: formData.title_de,
            title_tr: formData.title_tr,
            description_ka: formData.description_ka || null,
            description_en: formData.description_en || null,
            description_ru: formData.description_ru || null,
            description_ar: formData.description_ar || null,
            description_de: formData.description_de || null,
            description_tr: formData.description_tr || null,
            is_active: formData.is_active,
            display_order: newOrder,
            created_by: user?.id || null
          })
          .select()
          .single();

        if (error) throw error;
        slideId = newSlide.id;
      }

      // Handle buttons
      if (slideId) {
        // Delete removed buttons
        if (slide?.buttons) {
          const currentButtonIds = buttons.filter(b => b.id).map(b => b.id);
          const buttonsToDelete = slide.buttons.filter(b => !currentButtonIds.includes(b.id));
          
          for (const btn of buttonsToDelete) {
            await supabase.from('hero_slide_buttons').delete().eq('id', btn.id);
          }
        }

        // Update/Create buttons
        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i];
          const buttonData = {
            slide_id: slideId,
            text_ka: btn.text_ka,
            text_en: btn.text_en,
            text_ru: btn.text_ru,
            text_ar: btn.text_ar,
            text_de: btn.text_de,
            text_tr: btn.text_tr,
            action_type: btn.action_type,
            action_url: btn.action_type === 'link' && btn.action_url ? btn.action_url : null,
            pilot_id: btn.action_type === 'pilot' && btn.pilot_id ? btn.pilot_id : null,
            location_id: btn.action_type === 'location' && btn.location_id ? btn.location_id : null,
            company_id: btn.action_type === 'company' && btn.company_id ? btn.company_id : null,
            service_id: btn.action_type === 'service' && btn.service_id ? btn.service_id : null,
            open_in_new_tab: btn.open_in_new_tab,
            variant: btn.variant,
            shape: btn.shape || 'rounded',
            display_order: i
          };

          if (btn.id) {
            const { error: updateError } = await supabase.from('hero_slide_buttons').update(buttonData).eq('id', btn.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase.from('hero_slide_buttons').insert(buttonData);
            if (insertError) throw insertError;
          }
        }
      }

      onClose(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error saving slide:', errorMessage, error);
      alert(`შეცდომა სლაიდის შენახვისას: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'ka', label: '🇬🇪 KA' },
    { key: 'en', label: '🇬🇧 EN' },
    { key: 'ru', label: '🇷🇺 RU' },
    { key: 'ar', label: '🇸🇦 AR' },
    { key: 'de', label: '🇩🇪 DE' },
    { key: 'tr', label: '🇹🇷 TR' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16 pb-4 px-4 overflow-y-auto">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 sticky top-0 bg-background z-10">
          <h2 className="text-lg font-semibold text-foreground">
            {slide ? 'სლაიდის რედაქტირება' : 'ახალი სლაიდი'}
          </h2>
          <button
            onClick={() => onClose()}
            className="p-1.5 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            <HeroImageUpload
              label="Light Mode"
              imageUrl={formData.image_url_light}
              onUpload={(url: string) => handleInputChange('image_url_light', url)}
              onRemove={() => handleInputChange('image_url_light', '')}
              compact
            />
            <HeroImageUpload
              label="Dark Mode"
              imageUrl={formData.image_url_dark}
              onUpload={(url: string) => handleInputChange('image_url_dark', url)}
              onRemove={() => handleInputChange('image_url_dark', '')}
              compact
            />
          </div>

          {/* Language Tabs */}
          <div>
            <div className="flex border-b border-foreground/10 mb-3">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Title & Description for current tab */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1">
                  სათაური *
                </label>
                <input
                  type="text"
                  value={formData[`title_${activeTab}`]}
                  onChange={(e) => handleInputChange(`title_${activeTab}`, e.target.value)}
                  placeholder={`სათაური ${tabs.find(t => t.key === activeTab)?.label || ''}`}
                  dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
                  className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1">
                  აღწერა
                </label>
                <textarea
                  value={formData[`description_${activeTab}`]}
                  onChange={(e) => handleInputChange(`description_${activeTab}`, e.target.value)}
                  placeholder={`აღწერა ${tabs.find(t => t.key === activeTab)?.label || ''}`}
                  dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">ღილაკები</h3>
              <button
                onClick={() => setButtons([...buttons, {
                  text_ka: '',
                  text_en: '',
                  text_ru: '',
                  text_ar: '',
                  text_de: '',
                  text_tr: '',
                  action_type: 'link',
                  action_url: '',
                  pilot_id: '',
                  location_id: '',
                  company_id: '',
                  service_id: '',
                  open_in_new_tab: false,
                  variant: 'glass-dark',
                  shape: 'rounded'
                }])}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                + დამატება
              </button>
            </div>

            <HeroButtonEditor
              buttons={buttons}
              onChange={setButtons}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary/50"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              აქტიური
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-foreground/10 bg-foreground/5">
          <button
            onClick={() => onClose()}
            className="px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                შენახვა...
              </>
            ) : (
              'შენახვა'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
