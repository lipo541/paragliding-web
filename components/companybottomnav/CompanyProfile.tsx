'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Camera, Save } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface CompanyData {
  id: string;
  name_ka: string;
  identification_code: string;
  phone: string;
  email: string | null;
  logo_url: string | null;
  founded_date: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_de: string | null;
  description_tr: string | null;
  description_ar: string | null;
}

export default function CompanyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCompany = async () => {
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

      if (companyData) {
        setCompany(companyData);
        setFormData(companyData);
      }

      setLoading(false);
    };

    fetchCompany();
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
          phone: formData.phone,
          email: formData.email,
          founded_date: formData.founded_date,
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

        {/* Descriptions */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">აღწერა (6 ენაზე)</h2>
          </div>
          
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
            />
          </div>

          {/* Russian */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              <span>🇷🇺</span> Русский
            </label>
            <textarea
              value={formData.description_ru || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
              rows={3}
            />
          </div>

          {/* German */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              <span>🇩🇪</span> Deutsch
            </label>
            <textarea
              value={formData.description_de || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description_de: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
              rows={3}
            />
          </div>

          {/* Turkish */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              <span>🇹🇷</span> Türkçe
            </label>
            <textarea
              value={formData.description_tr || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description_tr: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
              rows={3}
            />
          </div>

          {/* Arabic */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">
              <span>🇸🇦</span> العربية
            </label>
            <textarea
              value={formData.description_ar || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
              rows={3}
              dir="rtl"
            />
          </div>
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
