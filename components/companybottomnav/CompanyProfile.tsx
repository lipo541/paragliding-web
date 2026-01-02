'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Camera, Save, Image, Video, Globe, MapPin, Languages, ChevronDown, X, Check } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CompanyCoverImageUpload from '@/components/company/CompanyCoverImageUpload';
import CompanyGalleryUpload from '@/components/company/CompanyGalleryUpload';
import CompanyVideoUrls from '@/components/company/CompanyVideoUrls';
import toast from 'react-hot-toast';

interface GalleryImage {
  url: string;
  caption_ka?: string;
  caption_en?: string;
  order: number;
}

interface Country {
  id: string;
  name_ka: string;
  name_en: string | null;
}

interface Location {
  id: string;
  name_ka: string;
  name_en: string | null;
  country_id: string;
}

interface CompanyData {
  id: string;
  user_id: string;
  name_ka: string;
  name_en: string | null;
  name_ru: string | null;
  name_de: string | null;
  name_tr: string | null;
  name_ar: string | null;
  identification_code: string;
  phone: string;
  email: string | null;
  logo_url: string | null;
  founded_date: string | null;
  country_id: string | null;
  location_ids: string[] | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_de: string | null;
  description_tr: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  gallery_images: GalleryImage[] | null;
  video_urls: string[] | null;
}

export default function CompanyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyData>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch countries
      const { data: countriesData } = await supabase
        .from('countries')
        .select('id, name_ka, name_en')
        .order('name_ka');

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name_ka, name_en, country_id')
        .order('name_ka');

      if (companyData) {
        setCompany(companyData);
        setFormData(companyData);
      }
      if (countriesData) setCountries(countriesData);
      if (locationsData) setLocations(locationsData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleLogoUpload = async (file: File) => {
    if (!company) return;
    
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update company
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', company.id);

      if (updateError) throw updateError;

      setCompany(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('ლოგო წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('ლოგოს ატვირთვისას მოხდა შეცდომა');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name_ka: formData.name_ka,
          name_en: formData.name_en,
          name_ru: formData.name_ru,
          name_de: formData.name_de,
          name_tr: formData.name_tr,
          name_ar: formData.name_ar,
          phone: formData.phone,
          email: formData.email,
          founded_date: formData.founded_date,
          country_id: formData.country_id,
          location_ids: formData.location_ids || [],
          description_ka: formData.description_ka,
          description_en: formData.description_en,
          description_ru: formData.description_ru,
          description_de: formData.description_de,
          description_tr: formData.description_tr,
          description_ar: formData.description_ar,
        })
        .eq('id', company.id);

      if (error) throw error;

      setCompany(prev => prev ? { ...prev, ...formData } : null);
      toast.success('პროფილი წარმატებით განახლდა');
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <p className="text-[#1a1a1a]/60 dark:text-white/60">კომპანია ვერ მოიძებნა</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pr-20 selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">კომპანიის პროფილი</h1>
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">განაახლეთ თქვენი კომპანიის ინფორმაცია</p>
        </div>

        {/* Logo Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Camera className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ლოგო</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name_ka}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-[#4697D2]/30 dark:border-white/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-[#4697D2] dark:bg-white flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white dark:text-[#1a1a1a]" />
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <Spinner size="md" className="border-white" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <Camera className="w-4 h-4 mr-2" />
                ლოგოს შეცვლა
              </Button>
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mt-2">
                მაქსიმუმ 2MB, JPG ან PNG
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ძირითადი ინფორმაცია</h2>
          </div>
          
          <Input
            label="კომპანიის სახელი"
            value={formData.name_ka || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name_ka: e.target.value }))}
          />

          <Input
            label="საიდენტიფიკაციო კოდი"
            value={company.identification_code}
            disabled
            helperText="საიდენტიფიკაციო კოდი ვერ შეიცვლება"
          />

          <Input
            label="ტელეფონი"
            value={formData.phone || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />

          <Input
            label="ელ. ფოსტა"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />

          <Input
            label="დაარსების თარიღი"
            type="date"
            value={formData.founded_date || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, founded_date: e.target.value }))}
          />
        </div>

        {/* Company Name (English only) */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Languages className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">კომპანიის სახელი</h2>
          </div>
          
          <Input
            label="🇬🇧 Company Name (English)"
            value={formData.name_en || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
          />
          <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
            სხვა ენებზე თარგმანს ადმინი დაამატებს
          </p>
        </div>

        {/* Country & Locations */}
        <div className="relative z-20 rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Globe className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ქვეყანა და ლოკაციები</h2>
          </div>
          
          {/* Country Dropdown */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              ქვეყანა
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white text-left"
              >
                <span>
                  {formData.country_id 
                    ? countries.find(c => c.id === formData.country_id)?.name_ka || 'აირჩიეთ ქვეყანა'
                    : 'აირჩიეთ ქვეყანა'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCountryDropdownOpen && (
                <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-[#4697D2]/30 dark:border-white/20 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, country_id: null, location_ids: [] }));
                      setIsCountryDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#1a1a1a]/60 dark:text-white/60 hover:bg-[#4697D2]/10"
                  >
                    — არჩევის გარეშე —
                  </button>
                  {countries.map(country => (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, country_id: country.id, location_ids: [] }));
                        setIsCountryDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[#4697D2]/10 ${
                        formData.country_id === country.id 
                          ? 'bg-[#4697D2]/20 text-[#4697D2] dark:text-white font-medium' 
                          : 'text-[#1a1a1a] dark:text-white'
                      }`}
                    >
                      {country.name_ka}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Locations Multi-select */}
          {formData.country_id && (
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white mb-3">
                <MapPin className="w-4 h-4 inline mr-1" />
                ლოკაციები (სადაც მოქმედებთ)
              </label>
              
              {/* All locations as clickable tags */}
              <div className="flex flex-wrap gap-2">
                {locations
                  .filter(loc => loc.country_id === formData.country_id)
                  .map(loc => {
                    const isSelected = formData.location_ids?.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData(prev => ({
                              ...prev,
                              location_ids: prev.location_ids?.filter(id => id !== loc.id) || []
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              location_ids: [...(prev.location_ids || []), loc.id]
                            }));
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#4697D2] dark:bg-[#4697D2] text-white border-[#4697D2] shadow-lg shadow-[#4697D2]/30'
                            : 'bg-white/50 dark:bg-black/30 text-[#1a1a1a] dark:text-white border-[#4697D2]/30 dark:border-white/20 hover:border-[#4697D2] hover:bg-[#4697D2]/10'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {loc.name_ka}
                      </button>
                    );
                  })}
              </div>
              
              {locations.filter(loc => loc.country_id === formData.country_id).length === 0 && (
                <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">
                  ამ ქვეყანაში ლოკაციები არ არის
                </p>
              )}
              
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mt-3">
                დააკლიკეთ ლოკაციებს რომ აირჩიოთ ან მოხსნათ მონიშვნა
              </p>
            </div>
          )}
        </div>

        {/* Descriptions (Georgian & English) */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">აღწერა</h2>
          </div>
          
          <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60 -mt-2">
            შეავსეთ ერთ-ერთი ენა მაინც. სხვა ენებზე თარგმანს ადმინი დაამატებს
          </p>
          
          {/* Georgian */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              <span>🇬🇪</span> ქართული
            </label>
            <textarea
              value={formData.description_ka || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description_ka: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
              rows={3}
              placeholder="კომპანიის აღწერა ქართულად..."
            />
          </div>

          {/* English */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              <span>🇬🇧</span> English
            </label>
            <textarea
              value={formData.description_en || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
              rows={3}
              placeholder="Company description in English..."
            />
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Image className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ქავერ ფოტო</h2>
          </div>
          <CompanyCoverImageUpload
            companyId={company.id}
            userId={company.user_id}
            coverImageUrl={company.cover_image_url}
            onUpdate={(url) => setCompany(prev => prev ? { ...prev, cover_image_url: url } : null)}
          />
        </div>

        {/* Gallery Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Image className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">გალერეა</h2>
          </div>
          <CompanyGalleryUpload
            companyId={company.id}
            userId={company.user_id}
            images={company.gallery_images || []}
            onUpdate={(images) => setCompany(prev => prev ? { ...prev, gallery_images: images } : null)}
          />
        </div>

        {/* Videos Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Video className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ვიდეოები</h2>
          </div>
          <CompanyVideoUrls
            companyId={company.id}
            videoUrls={company.video_urls || []}
            onUpdate={(urls) => setCompany(prev => prev ? { ...prev, video_urls: urls } : null)}
          />
        </div>

        {/* Save Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Spinner size="sm" className="mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          შენახვა
        </Button>
      </div>
    </div>
  );
}
