'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Save, RefreshCw, User, Plane, Award, FileText } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Image from 'next/image';

interface PilotData {
  id: string;
  user_id: string;
  company_id: string | null;
  status: string;
  // Slugs (multi-language)
  slug: string | null;
  slug_ka: string | null;
  slug_en: string | null;
  slug_ru: string | null;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  // Personal info
  first_name_ka: string | null;
  first_name_ru: string | null;
  first_name_de: string | null;
  first_name_tr: string | null;
  first_name_ar: string | null;
  last_name_ka: string | null;
  last_name_ru: string | null;
  last_name_de: string | null;
  last_name_tr: string | null;
  last_name_ar: string | null;
  phone: string;
  email: string;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  avatar_url: string | null;
  // Verification Documents
  verification_documents: string[];
  commercial_start_date: string | null;
  // Experience
  total_flights: number | null;
  tandem_flights: number | null;
  // Equipment - Wing
  wing_brand: string | null;
  wing_model: string | null;
  wing_certificate_url: string | null;
  // Equipment - Pilot Harness
  pilot_harness_brand: string | null;
  pilot_harness_model: string | null;
  pilot_harness_certificate_url: string | null;
  // Equipment - Passenger Harness
  passenger_harness_brand: string | null;
  passenger_harness_model: string | null;
  passenger_harness_certificate_url: string | null;
  // Equipment - Reserve
  reserve_brand: string | null;
  reserve_model: string | null;
  reserve_certificate_url: string | null;
  // Bio
  bio_ka: string | null;
  bio_en: string | null;
  bio_ru: string | null;
  bio_de: string | null;
  bio_tr: string | null;
  bio_ar: string | null;
  // SEO Titles (multi-language)
  seo_title_ka: string | null;
  seo_title_en: string | null;
  seo_title_ru: string | null;
  seo_title_ar: string | null;
  seo_title_de: string | null;
  seo_title_tr: string | null;
  // SEO Descriptions (multi-language)
  seo_description_ka: string | null;
  seo_description_en: string | null;
  seo_description_ru: string | null;
  seo_description_ar: string | null;
  seo_description_de: string | null;
  seo_description_tr: string | null;
  // OG Titles (multi-language)
  og_title_ka: string | null;
  og_title_en: string | null;
  og_title_ru: string | null;
  og_title_ar: string | null;
  og_title_de: string | null;
  og_title_tr: string | null;
  // OG Descriptions (multi-language)
  og_description_ka: string | null;
  og_description_en: string | null;
  og_description_ru: string | null;
  og_description_ar: string | null;
  og_description_de: string | null;
  og_description_tr: string | null;
  // Shared OG image
  og_image: string | null;
}

interface PilotEditFormProps {
  pilot: PilotData;
  onCancel: () => void;
  onSave: (updatedPilot: PilotData) => void;
}

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';
type EditTab = 'personal' | 'experience' | 'equipment' | 'bio' | 'seo';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'ka', name: 'ქარ', flag: '🇬🇪' },
  { code: 'en', name: 'Eng', flag: '🇬🇧' },
  { code: 'ru', name: 'Рус', flag: '🇷🇺' },
  { code: 'ar', name: 'عرب', flag: '🇸🇦' },
  { code: 'de', name: 'Deu', flag: '🇩🇪' },
  { code: 'tr', name: 'Tür', flag: '🇹🇷' },
];

export default function PilotEditForm({ pilot, onCancel, onSave }: PilotEditFormProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('personal');
  const [activeLang, setActiveLang] = useState<Language>('ka');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PilotData>({ ...pilot });
  const supabase = createClient();

  // Transliterate non-Latin characters to Latin
  const transliterate = (text: string): string => {
    const georgianMap: { [key: string]: string } = {
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 'th', 'ი': 'i',
      'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's',
      'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts',
      'ძ': 'dz', 'წ': 'w', 'ჭ': 'tch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
    };

    const russianMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
      'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    const arabicMap: { [key: string]: string } = {
      'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
      'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
      'ي': 'y', 'ى': 'a', 'ة': 'h', 'ؤ': 'o', 'ئ': 'e', 'ء': ''
    };

    return text.split('').map(char => {
      const lower = char.toLowerCase();
      return georgianMap[lower] || russianMap[lower] || arabicMap[char] || char;
    }).join('');
  };

  // Generate slug from name with language prefix
  const generateSlug = (firstName: string, lastName: string, lang: Language): string => {
    const fullName = `${firstName} ${lastName}`.trim();
    const transliterated = transliterate(fullName);
    const slug = transliterated
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${lang}-${slug}`;
  };

  // Auto-generate slug for current language
  const handleAutoGenerateSlug = () => {
    const firstNameKey = `first_name_${activeLang}` as keyof PilotData;
    const lastNameKey = `last_name_${activeLang}` as keyof PilotData;
    const slugKey = `slug_${activeLang}` as keyof PilotData;
    const firstName = (formData[firstNameKey] as string) || '';
    const lastName = (formData[lastNameKey] as string) || '';
    
    if (firstName || lastName) {
      setFormData(prev => ({
        ...prev,
        [slugKey]: generateSlug(firstName, lastName, activeLang),
        // Also update base slug if ka
        ...(activeLang === 'ka' ? { slug: generateSlug(firstName, lastName, activeLang) } : {}),
      }));
    }
  };

  // Auto-generate all slugs
  const handleAutoGenerateAllSlugs = () => {
    const newSlugs: Record<string, string | null> = {};
    languages.forEach(lang => {
      const firstNameKey = `first_name_${lang.code}` as keyof PilotData;
      const lastNameKey = `last_name_${lang.code}` as keyof PilotData;
      const slugKey = `slug_${lang.code}`;
      const firstName = (formData[firstNameKey] as string) || formData.first_name_ka || '';
      const lastName = (formData[lastNameKey] as string) || formData.last_name_ka || '';
      
      if (firstName || lastName) {
        newSlugs[slugKey] = generateSlug(firstName, lastName, lang.code);
      }
    });
    // Set base slug as ka slug
    if (newSlugs.slug_ka) {
      newSlugs.slug = newSlugs.slug_ka;
    }
    setFormData(prev => ({ ...prev, ...newSlugs }));
  };

  // Handle field change
  const handleFieldChange = (field: keyof PilotData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pilots')
        .update({
          // Slugs
          slug: formData.slug,
          slug_ka: formData.slug_ka,
          slug_en: formData.slug_en,
          slug_ru: formData.slug_ru,
          slug_ar: formData.slug_ar,
          slug_de: formData.slug_de,
          slug_tr: formData.slug_tr,
          // Names
          first_name_ka: formData.first_name_ka,
          first_name_ru: formData.first_name_ru,
          first_name_de: formData.first_name_de,
          first_name_tr: formData.first_name_tr,
          first_name_ar: formData.first_name_ar,
          last_name_ka: formData.last_name_ka,
          last_name_ru: formData.last_name_ru,
          last_name_de: formData.last_name_de,
          last_name_tr: formData.last_name_tr,
          last_name_ar: formData.last_name_ar,
          // Contact
          phone: formData.phone,
          email: formData.email,
          birth_date: formData.birth_date,
          gender: formData.gender,
          // Experience
          commercial_start_date: formData.commercial_start_date,
          total_flights: formData.total_flights,
          tandem_flights: formData.tandem_flights,
          // Wing equipment
          wing_brand: formData.wing_brand,
          wing_model: formData.wing_model,
          // Pilot Harness equipment
          pilot_harness_brand: formData.pilot_harness_brand,
          pilot_harness_model: formData.pilot_harness_model,
          // Passenger Harness equipment
          passenger_harness_brand: formData.passenger_harness_brand,
          passenger_harness_model: formData.passenger_harness_model,
          // Reserve equipment
          reserve_brand: formData.reserve_brand,
          reserve_model: formData.reserve_model,
          // Bio
          bio_ka: formData.bio_ka,
          bio_en: formData.bio_en,
          bio_ru: formData.bio_ru,
          bio_de: formData.bio_de,
          bio_tr: formData.bio_tr,
          bio_ar: formData.bio_ar,
          // SEO Titles
          seo_title_ka: formData.seo_title_ka,
          seo_title_en: formData.seo_title_en,
          seo_title_ru: formData.seo_title_ru,
          seo_title_ar: formData.seo_title_ar,
          seo_title_de: formData.seo_title_de,
          seo_title_tr: formData.seo_title_tr,
          // SEO Descriptions
          seo_description_ka: formData.seo_description_ka,
          seo_description_en: formData.seo_description_en,
          seo_description_ru: formData.seo_description_ru,
          seo_description_ar: formData.seo_description_ar,
          seo_description_de: formData.seo_description_de,
          seo_description_tr: formData.seo_description_tr,
          // OG Titles
          og_title_ka: formData.og_title_ka,
          og_title_en: formData.og_title_en,
          og_title_ru: formData.og_title_ru,
          og_title_ar: formData.og_title_ar,
          og_title_de: formData.og_title_de,
          og_title_tr: formData.og_title_tr,
          // OG Descriptions
          og_description_ka: formData.og_description_ka,
          og_description_en: formData.og_description_en,
          og_description_ru: formData.og_description_ru,
          og_description_ar: formData.og_description_ar,
          og_description_de: formData.og_description_de,
          og_description_tr: formData.og_description_tr,
          // OG Image
          og_image: formData.og_image,
        })
        .eq('id', pilot.id);

      if (error) throw error;

      onSave(formData);
    } catch (error) {
      console.error('Error saving pilot:', error);
      alert('შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  // Equipment config
  type EquipmentKey = 'wing' | 'pilot_harness' | 'passenger_harness' | 'reserve';
  
  const equipmentConfig: Record<EquipmentKey, {
    title: string;
    docLabel: string;
    brandKey: keyof PilotData;
    modelKey: keyof PilotData;
    certUrlKey: keyof PilotData;
    icon: React.ReactNode;
  }> = {
    wing: {
      title: 'ფრთა (Wing)',
      docLabel: 'ფრთის ვარგისიანობის დოკუმენტი',
      brandKey: 'wing_brand',
      modelKey: 'wing_model',
      certUrlKey: 'wing_certificate_url',
      icon: <Plane className="h-4 w-4 text-blue-500" />,
    },
    pilot_harness: {
      title: 'პილოტის ჰარნესი',
      docLabel: 'ჰარნესის ვარგისიანობის დოკუმენტი',
      brandKey: 'pilot_harness_brand',
      modelKey: 'pilot_harness_model',
      certUrlKey: 'pilot_harness_certificate_url',
      icon: <Award className="h-4 w-4 text-purple-500" />,
    },
    passenger_harness: {
      title: 'მგზავრის ჰარნესი',
      docLabel: 'მგზავრის ჰარნესის დოკუმენტი',
      brandKey: 'passenger_harness_brand',
      modelKey: 'passenger_harness_model',
      certUrlKey: 'passenger_harness_certificate_url',
      icon: <User className="h-4 w-4 text-green-500" />,
    },
    reserve: {
      title: 'რეზერვი (Reserve)',
      docLabel: 'პარაშუტის გადაკეცვის დოკუმენტი',
      brandKey: 'reserve_brand',
      modelKey: 'reserve_model',
      certUrlKey: 'reserve_certificate_url',
      icon: <Award className="h-4 w-4 text-orange-500" />,
    },
  };

  // Equipment field renderer
  const renderEquipmentField = (type: EquipmentKey) => {
    const config = equipmentConfig[type];

    return (
      <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
          {config.icon}
          {config.title}
        </h4>
        <div className="grid gap-3 md:grid-cols-2 mb-3">
          <div>
            <label className="mb-1 block text-xs text-foreground/60">ბრენდი</label>
            <input
              type="text"
              value={(formData[config.brandKey] as string) || ''}
              onChange={(e) => handleFieldChange(config.brandKey, e.target.value || null)}
              className="w-full rounded border border-foreground/10 bg-background px-2 py-1.5 text-sm focus:border-foreground/30 focus:outline-none"
              placeholder="მაგ: Ozone, Advance..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/60">მოდელი</label>
            <input
              type="text"
              value={(formData[config.modelKey] as string) || ''}
              onChange={(e) => handleFieldChange(config.modelKey, e.target.value || null)}
              className="w-full rounded border border-foreground/10 bg-background px-2 py-1.5 text-sm focus:border-foreground/30 focus:outline-none"
              placeholder="მაგ: Magnum 3"
            />
          </div>
        </div>
        
        {/* Document Display */}
        <div className="rounded border border-foreground/10 bg-background p-2">
          <label className="mb-2 block text-xs text-foreground/60">{config.docLabel}</label>
          {formData[config.certUrlKey] ? (
            <a
              href={formData[config.certUrlKey] as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-blue-500 hover:text-blue-600"
            >
              <FileText className="h-4 w-4" />
              დოკუმენტის ნახვა
            </a>
          ) : (
            <span className="text-xs text-foreground/40">დოკუმენტი არ არის ატვირთული</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-foreground/20 bg-background p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {formData.avatar_url && (
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image src={formData.avatar_url} alt="Avatar" fill className="object-cover" />
            </div>
          )}
          <div>
            <h3 className="font-medium">
              {formData.first_name_ka}{' '}
              {formData.last_name_ka}
            </h3>
            <p className="text-xs text-foreground/60">პილოტის რედაქტირება</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded p-2 hover:bg-foreground/10"
            title="გაუქმება"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-foreground/10 pb-2">
        {[
          { id: 'personal' as EditTab, label: 'პერსონალური', icon: User },
          { id: 'experience' as EditTab, label: 'გამოცდილება', icon: Award },
          { id: 'equipment' as EditTab, label: 'აღჭურვილობა', icon: Plane },
          { id: 'bio' as EditTab, label: 'ბიოგრაფია', icon: FileText },
          { id: 'seo' as EditTab, label: 'SEO', icon: RefreshCw },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'hover:bg-foreground/10'
              }`}
            >
              <TabIcon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Personal */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          {/* Language selector for names */}
          <div className="flex gap-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  activeLang === lang.code
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/10 hover:bg-foreground/20'
                }`}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>

          {/* Names for selected language */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                სახელი ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={(formData[`first_name_${activeLang}` as keyof PilotData] as string) || ''}
                onChange={(e) =>
                  handleFieldChange(`first_name_${activeLang}` as keyof PilotData, e.target.value || null)
                }
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                გვარი ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={(formData[`last_name_${activeLang}` as keyof PilotData] as string) || ''}
                onChange={(e) =>
                  handleFieldChange(`last_name_${activeLang}` as keyof PilotData, e.target.value || null)
                }
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Common fields */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">ტელეფონი</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">ელ-ფოსტა</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">დაბადების თარიღი</label>
              <input
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => handleFieldChange('birth_date', e.target.value || null)}
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">სქესი</label>
              <select
                value={formData.gender || ''}
                onChange={(e) =>
                  handleFieldChange('gender', (e.target.value as 'male' | 'female' | 'other') || null)
                }
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              >
                <option value="">-</option>
                <option value="male">მამრობითი</option>
                <option value="female">მდედრობითი</option>
                <option value="other">სხვა</option>
              </select>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground/60">
              Slug
              <button
                type="button"
                onClick={handleAutoGenerateSlug}
                className="inline-flex items-center gap-1 rounded bg-foreground/10 px-1.5 py-0.5 text-xs hover:bg-foreground/20"
              >
                <RefreshCw className="h-3 w-3" />
                გენერაცია
              </button>
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => handleFieldChange('slug', e.target.value || null)}
              className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              placeholder="pilot-name"
            />
          </div>
        </div>
      )}

      {/* Tab: Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-4">
          {/* Verification Documents Display */}
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
            <label className="mb-2 block text-xs font-medium text-foreground/60">
              დამადასტურებელი დოკუმენტები ({formData.verification_documents?.length || 0})
            </label>
            {formData.verification_documents && formData.verification_documents.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {formData.verification_documents.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded overflow-hidden border border-foreground/10 hover:border-foreground/30 transition-colors"
                  >
                    <Image
                      src={url}
                      alt={`Document ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/50">დოკუმენტები არ არის ატვირთული</p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                კომერციული დაწყება
              </label>
              <input
                type="date"
                value={formData.commercial_start_date || ''}
                onChange={(e) => handleFieldChange('commercial_start_date', e.target.value || null)}
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">სულ ფრენები</label>
              <input
                type="number"
                min="0"
                value={formData.total_flights ?? ''}
                onChange={(e) =>
                  handleFieldChange('total_flights', e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">ტანდემ ფრენები</label>
              <input
                type="number"
                min="0"
                value={formData.tandem_flights ?? ''}
                onChange={(e) =>
                  handleFieldChange('tandem_flights', e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Equipment */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          {renderEquipmentField('wing')}
          {renderEquipmentField('pilot_harness')}
          {renderEquipmentField('passenger_harness')}
          {renderEquipmentField('reserve')}
        </div>
      )}

      {/* Tab: Bio */}
      {activeTab === 'bio' && (
        <div className="space-y-4">
          {/* Language selector */}
          <div className="flex gap-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  activeLang === lang.code
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/10 hover:bg-foreground/20'
                }`}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">
              ბიოგრაფია ({activeLang.toUpperCase()})
            </label>
            <textarea
              value={(formData[`bio_${activeLang}` as keyof PilotData] as string) || ''}
              onChange={(e) =>
                handleFieldChange(`bio_${activeLang}` as keyof PilotData, e.target.value || null)
              }
              rows={6}
              className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none resize-none"
              placeholder="პილოტის შესახებ..."
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          {/* Language Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeLang === lang.code
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>

          {/* Slug Section */}
          <div className="pt-3 border-t border-foreground/10">
            <p className="text-xs font-medium text-foreground/60 mb-3 flex items-center gap-1.5">
              🔗 URL Slug ({languages.find(l => l.code === activeLang)?.flag})
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/40">/</span>
              <input
                type="text"
                value={(formData[`slug_${activeLang}` as keyof PilotData] as string) || ''}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
                  handleFieldChange(`slug_${activeLang}` as keyof PilotData, value || null);
                }}
                className="flex-1 rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm font-mono focus:border-foreground/30 focus:outline-none"
                placeholder={`${activeLang}-pilot-name`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleAutoGenerateSlug}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="ავტომატური გენერაცია ამ ენისთვის"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleAutoGenerateAllSlugs}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                title="ყველა ენისთვის გენერაცია"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SEO Section */}
          <div className="pt-3 border-t border-foreground/10">
            <p className="text-xs font-medium text-foreground/60 mb-3 flex items-center gap-1.5">
              🔍 SEO ({languages.find(l => l.code === activeLang)?.flag})
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/70">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={(formData[`seo_title_${activeLang}` as keyof PilotData] as string) || ''}
                  onChange={(e) => handleFieldChange(`seo_title_${activeLang}` as keyof PilotData, e.target.value || null)}
                  className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                  placeholder="SEO სათაური (50-60 სიმბ.)"
                  dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                />
                <p className="text-[10px] text-foreground/40 mt-0.5">
                  {((formData[`seo_title_${activeLang}` as keyof PilotData] as string) || '').length}/60
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/70">
                  Meta Description
                </label>
                <input
                  type="text"
                  value={(formData[`seo_description_${activeLang}` as keyof PilotData] as string) || ''}
                  onChange={(e) => handleFieldChange(`seo_description_${activeLang}` as keyof PilotData, e.target.value || null)}
                  className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                  placeholder="SEO აღწერა (150-160 სიმბ.)"
                  dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                />
                <p className="text-[10px] text-foreground/40 mt-0.5">
                  {((formData[`seo_description_${activeLang}` as keyof PilotData] as string) || '').length}/160
                </p>
              </div>
            </div>
          </div>

          {/* Open Graph Section */}
          <div className="pt-3 border-t border-foreground/10">
            <p className="text-xs font-medium text-foreground/60 mb-3 flex items-center gap-1.5">
              📱 Open Graph ({languages.find(l => l.code === activeLang)?.flag})
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/70">
                  OG Title
                </label>
                <input
                  type="text"
                  value={(formData[`og_title_${activeLang}` as keyof PilotData] as string) || ''}
                  onChange={(e) => handleFieldChange(`og_title_${activeLang}` as keyof PilotData, e.target.value || null)}
                  className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                  placeholder="სოციალური სათაური"
                  dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/70">
                  OG Description
                </label>
                <input
                  type="text"
                  value={(formData[`og_description_${activeLang}` as keyof PilotData] as string) || ''}
                  onChange={(e) => handleFieldChange(`og_description_${activeLang}` as keyof PilotData, e.target.value || null)}
                  className="w-full rounded border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                  placeholder="სოციალური აღწერა"
                  dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* OG Image - Auto from Avatar */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-foreground/70">
                OG სურათი
              </label>
              <div className="flex items-center gap-3">
                {(formData.og_image || formData.avatar_url) ? (
                  <div className="relative">
                    <img
                      src={formData.og_image || formData.avatar_url || ''}
                      alt="OG"
                      className="w-24 h-14 object-cover rounded-lg border border-foreground/10"
                    />
                    {formData.og_image && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('og_image', null)}
                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-14 bg-foreground/5 rounded-lg border border-dashed border-foreground/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-foreground/30" />
                  </div>
                )}
                <div className="space-y-1">
                  {formData.avatar_url && !formData.og_image && (
                    <p className="text-[10px] text-green-600">✓ ავატარი გამოიყენება OG სურათად</p>
                  )}
                  {formData.og_image && formData.og_image !== formData.avatar_url && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('og_image', formData.avatar_url)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 text-foreground/70 rounded-lg text-xs hover:bg-foreground/10 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      ავატარზე დაბრუნება
                    </button>
                  )}
                  {!formData.avatar_url && (
                    <p className="text-[10px] text-foreground/40">ავატარი არ არის ატვირთული</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-4 flex justify-end gap-2 border-t border-foreground/10 pt-4">
        <button
          onClick={onCancel}
          className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
        >
          გაუქმება
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
          შენახვა
        </button>
      </div>
    </div>
  );
}
