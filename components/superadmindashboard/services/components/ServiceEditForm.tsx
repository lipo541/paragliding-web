'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, FileText, MapPin, Image, DollarSign, Search } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import ServiceBasicInfoTab from './ServiceBasicInfoTab';
import ServiceLocationsTab from './ServiceLocationsTab';
import ServiceMediaTab from './ServiceMediaTab';
import ServicePricingTab from './ServicePricingTab';
import ServiceSeoTab from './ServiceSeoTab';
import type { 
  AdditionalService, 
  AdditionalServiceInsert,
  ServiceCategory, 
  ServicePricing,
  ServiceGalleryImage 
} from '@/lib/types/services';

type TabId = 'basic' | 'locations' | 'media' | 'pricing' | 'seo';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'basic', label: 'ძირითადი', icon: FileText },
  { id: 'locations', label: 'ლოკაციები', icon: MapPin },
  { id: 'media', label: 'მედია', icon: Image },
  { id: 'pricing', label: 'ფასები', icon: DollarSign },
  { id: 'seo', label: 'SEO', icon: Search },
];

interface ServiceEditFormProps {
  service?: AdditionalService;
  categories: ServiceCategory[];
  onSave: () => void;
  onCancel: () => void;
}

export default function ServiceEditForm({
  service,
  categories,
  onSave,
  onCancel,
}: ServiceEditFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<AdditionalService>>({
    category_id: service?.category_id || null,
    
    // Names
    name_ka: service?.name_ka || '',
    name_en: service?.name_en || '',
    name_ru: service?.name_ru || '',
    name_ar: service?.name_ar || '',
    name_de: service?.name_de || '',
    name_tr: service?.name_tr || '',
    
    // Descriptions
    description_ka: service?.description_ka || '',
    description_en: service?.description_en || '',
    description_ru: service?.description_ru || '',
    description_ar: service?.description_ar || '',
    description_de: service?.description_de || '',
    description_tr: service?.description_tr || '',
    
    // Slugs
    slug_ka: service?.slug_ka || '',
    slug_en: service?.slug_en || '',
    slug_ru: service?.slug_ru || '',
    slug_ar: service?.slug_ar || '',
    slug_de: service?.slug_de || '',
    slug_tr: service?.slug_tr || '',
    
    // SEO
    seo_title_ka: service?.seo_title_ka || '',
    seo_title_en: service?.seo_title_en || '',
    seo_title_ru: service?.seo_title_ru || '',
    seo_title_ar: service?.seo_title_ar || '',
    seo_title_de: service?.seo_title_de || '',
    seo_title_tr: service?.seo_title_tr || '',
    
    seo_description_ka: service?.seo_description_ka || '',
    seo_description_en: service?.seo_description_en || '',
    seo_description_ru: service?.seo_description_ru || '',
    seo_description_ar: service?.seo_description_ar || '',
    seo_description_de: service?.seo_description_de || '',
    seo_description_tr: service?.seo_description_tr || '',
    
    // OG
    og_title_ka: service?.og_title_ka || '',
    og_title_en: service?.og_title_en || '',
    og_title_ru: service?.og_title_ru || '',
    og_title_ar: service?.og_title_ar || '',
    og_title_de: service?.og_title_de || '',
    og_title_tr: service?.og_title_tr || '',
    
    og_description_ka: service?.og_description_ka || '',
    og_description_en: service?.og_description_en || '',
    og_description_ru: service?.og_description_ru || '',
    og_description_ar: service?.og_description_ar || '',
    og_description_de: service?.og_description_de || '',
    og_description_tr: service?.og_description_tr || '',
    
    og_image: service?.og_image || '',
    
    // Data
    location_ids: service?.location_ids || [],
    gallery_images: service?.gallery_images || [],
    video_urls: service?.video_urls || [],
    pricing: service?.pricing || { shared_pricing: [] },
    
    status: service?.status || 'draft',
  });

  const supabase = createClient();

  const updateFormData = (updates: Partial<AdditionalService>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name_ka || !formData.name_en) {
      alert('გთხოვთ შეავსოთ სახელი ქართულად და ინგლისურად');
      setActiveTab('basic');
      return;
    }
    
    if (!formData.slug_ka || !formData.slug_en) {
      alert('გთხოვთ შეავსოთ slug ქართულად და ინგლისურად');
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        category_id: formData.category_id,
        name_ka: formData.name_ka,
        name_en: formData.name_en,
        name_ru: formData.name_ru || null,
        name_ar: formData.name_ar || null,
        name_de: formData.name_de || null,
        name_tr: formData.name_tr || null,
        description_ka: formData.description_ka || null,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        description_ar: formData.description_ar || null,
        description_de: formData.description_de || null,
        description_tr: formData.description_tr || null,
        slug_ka: formData.slug_ka,
        slug_en: formData.slug_en,
        slug_ru: formData.slug_ru || null,
        slug_ar: formData.slug_ar || null,
        slug_de: formData.slug_de || null,
        slug_tr: formData.slug_tr || null,
        seo_title_ka: formData.seo_title_ka || null,
        seo_title_en: formData.seo_title_en || null,
        seo_title_ru: formData.seo_title_ru || null,
        seo_title_ar: formData.seo_title_ar || null,
        seo_title_de: formData.seo_title_de || null,
        seo_title_tr: formData.seo_title_tr || null,
        seo_description_ka: formData.seo_description_ka || null,
        seo_description_en: formData.seo_description_en || null,
        seo_description_ru: formData.seo_description_ru || null,
        seo_description_ar: formData.seo_description_ar || null,
        seo_description_de: formData.seo_description_de || null,
        seo_description_tr: formData.seo_description_tr || null,
        og_title_ka: formData.og_title_ka || null,
        og_title_en: formData.og_title_en || null,
        og_title_ru: formData.og_title_ru || null,
        og_title_ar: formData.og_title_ar || null,
        og_title_de: formData.og_title_de || null,
        og_title_tr: formData.og_title_tr || null,
        og_description_ka: formData.og_description_ka || null,
        og_description_en: formData.og_description_en || null,
        og_description_ru: formData.og_description_ru || null,
        og_description_ar: formData.og_description_ar || null,
        og_description_de: formData.og_description_de || null,
        og_description_tr: formData.og_description_tr || null,
        og_image: formData.og_image || null,
        location_ids: formData.location_ids || [],
        gallery_images: formData.gallery_images || [],
        video_urls: formData.video_urls || [],
        pricing: formData.pricing || { shared_pricing: [] },
        status: formData.status,
      };

      if (service?.id) {
        // Update existing
        const { error } = await supabase
          .from('additional_services')
          .update(dataToSave)
          .eq('id', service.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('additional_services')
          .insert([dataToSave]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving service:', error);
      if (error.code === '23505') {
        alert('ასეთი slug უკვე არსებობს. გთხოვთ შეცვალოთ.');
      } else {
        alert('შეცდომა სერვისის შენახვისას');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {service ? 'სერვისის რედაქტირება' : 'ახალი სერვისი'}
            </h2>
            <p className="text-sm text-foreground/60">
              {service ? formData.name_ka : 'შეავსეთ ინფორმაცია სერვისის შესახებ'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          შენახვა
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-background/50 backdrop-blur-sm border border-border rounded-xl p-6">
        {activeTab === 'basic' && (
          <ServiceBasicInfoTab
            formData={formData}
            categories={categories}
            onChange={updateFormData}
          />
        )}
        {activeTab === 'locations' && (
          <ServiceLocationsTab
            selectedLocationIds={formData.location_ids || []}
            onChange={(ids: string[]) => updateFormData({ location_ids: ids })}
          />
        )}
        {activeTab === 'media' && (
          <ServiceMediaTab
            galleryImages={formData.gallery_images || []}
            videoUrls={formData.video_urls || []}
            onGalleryChange={(images: ServiceGalleryImage[]) => updateFormData({ gallery_images: images })}
            onVideosChange={(urls: string[]) => updateFormData({ video_urls: urls })}
          />
        )}
        {activeTab === 'pricing' && (
          <ServicePricingTab
            pricing={formData.pricing || { shared_pricing: [] }}
            onChange={(pricing: ServicePricing) => updateFormData({ pricing })}
          />
        )}
        {activeTab === 'seo' && (
          <ServiceSeoTab
            formData={formData}
            onChange={updateFormData}
          />
        )}
      </div>
    </div>
  );
}
