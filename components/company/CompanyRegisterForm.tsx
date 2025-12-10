'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Phone, Mail, Calendar, FileText, Upload, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import { companySchema, type CompanyFormData } from '@/lib/validations/company';

export default function CompanyRegisterForm() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka';
  const { t } = useTranslation('company');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push(`/${currentLocale}/login`);
          return;
        }

        // Check if user already has a company
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id, status')
          .eq('user_id', session.user.id)
          .single();

        if (existingCompany) {
          if (existingCompany.status === 'pending') {
            setError('თქვენი კომპანიის განაცხადი უკვე გაგზავნილია და მოლოდინშია');
          } else if (existingCompany.status === 'verified') {
            router.push(`/${currentLocale}/company/dashboard`);
            return;
          }
        }

        setUserId(session.user.id);
        setCheckingAuth(false);
      } catch {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, router, currentLocale]);

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('ლოგოს ზომა არ უნდა აღემატებოდეს 5MB-ს');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);

    try {
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${userId}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Insert company
      const { error: insertError } = await supabase
        .from('companies')
        .insert({
          user_id: userId,
          name_ka: data.name_ka,
          phone: data.phone,
          email: data.email,
          founded_date: data.founded_date || null,
          identification_code: data.identification_code,
          description_ka: data.description_ka || null,
          description_en: data.description_en || null,
          description_ru: data.description_ru || null,
          description_ar: data.description_ar || null,
          description_de: data.description_de || null,
          description_tr: data.description_tr || null,
          logo_url: logoUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccess(true);
    } catch (err) {
      console.error('Company registration error:', err);
      setError('რეგისტრაციის შეცდომა. სცადეთ თავიდან.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <Building2 className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">განაცხადი გაგზავნილია!</h2>
          <p className="text-gray-600 dark:text-white/70 mb-6">
            თქვენი კომპანიის რეგისტრაციის განაცხადი მიღებულია. 
            ადმინისტრატორი განიხილავს და დაგიკავშირდებათ.
          </p>
          <Link
            href={`/${currentLocale}`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-white hover:bg-sky-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-6 md:p-8">
        <div className="mb-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-[#4697D2] dark:text-white mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] dark:text-white">კომპანიის რეგისტრაცია</h1>
          <p className="mt-2 text-[#1a1a1a]/60 dark:text-white/70">შეავსეთ ფორმა კომპანიის დასარეგისტრირებლად</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 rounded-full bg-white/50 dark:bg-white/10 border-2 border-dashed border-[#4697D2]/40 dark:border-white/30 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo" fill className="object-cover" />
              ) : (
                <Upload className="h-8 w-8 text-[#1a1a1a]/40 dark:text-white/50" />
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-2 text-sm text-[#1a1a1a] dark:text-white hover:border-[#4697D2] dark:hover:border-white/40 transition-all">
              ლოგოს ატვირთვა
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
                aria-label="კომპანიის ლოგოს ატვირთვა"
              />
            </label>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Name */}
            <div>
              <label htmlFor="name_ka" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                <Building2 className="h-4 w-4" /> კომპანიის სახელი *
              </label>
              <input
                id="name_ka"
                type="text"
                {...register('name_ka')}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                placeholder="შპს პარაგლაიდინგ ჯორჯია"
              />
              {errors.name_ka && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name_ka.message}</p>}
            </div>

            {/* ID Code */}
            <div>
              <label htmlFor="identification_code" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                <FileText className="h-4 w-4" /> საიდენტიფიკაციო კოდი *
              </label>
              <input
                id="identification_code"
                type="text"
                {...register('identification_code')}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                placeholder="123456789"
              />
              {errors.identification_code && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.identification_code.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                <Phone className="h-4 w-4" /> ტელეფონი *
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                placeholder="+995 555 123 456"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.phone.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                <Mail className="h-4 w-4" /> ელ-ფოსტა *
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                placeholder="info@company.ge"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>}
            </div>

            {/* Founded Date */}
            <div className="md:col-span-2">
              <label htmlFor="founded_date" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                <Calendar className="h-4 w-4" /> დაფუძნების თარიღი
              </label>
              <input
                id="founded_date"
                type="date"
                {...register('founded_date')}
                className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
              />
              {errors.founded_date && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.founded_date.message}</p>}
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">აღწერა</h3>
              <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">მინიმუმ ერთ ენაზე შეავსეთ *</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="description_ka" className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                  🇬🇪 ქართულად
                </label>
                <textarea
                  id="description_ka"
                  {...register('description_ka')}
                  rows={3}
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                  placeholder="კომპანიის აღწერა ქართულად..."
                />
              </div>

              <div>
                <label htmlFor="description_en" className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                  🇬🇧 English
                </label>
                <textarea
                  id="description_en"
                  {...register('description_en')}
                  rows={3}
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                  placeholder="Company description in English..."
                />
              </div>

              <div>
                <label htmlFor="description_ru" className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                  🇷🇺 Русский
                </label>
                <textarea
                  id="description_ru"
                  {...register('description_ru')}
                  rows={3}
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                  placeholder="Описание компании на русском..."
                />
              </div>

              <div>
                <label htmlFor="description_de" className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                  🇩🇪 Deutsch
                </label>
                <textarea
                  id="description_de"
                  {...register('description_de')}
                  rows={3}
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                  placeholder="Firmenbeschreibung auf Deutsch..."
                />
              </div>

              <div>
                <label htmlFor="description_tr" className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                  🇹🇷 Türkçe
                </label>
                <textarea
                  id="description_tr"
                  {...register('description_tr')}
                  rows={3}
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                  placeholder="Şirket açıklaması Türkçe..."
                />
              </div>

              <div>
                <label htmlFor="description_ar" className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                  🇸🇦 العربية
                </label>
                <textarea
                  id="description_ar"
                  {...register('description_ar')}
                  rows={3}
                  dir="rtl"
                  className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                  placeholder="وصف الشركة بالعربية..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 rounded-lg border border-[#1a1a1a] dark:border-white bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] px-5 py-4 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-transparent hover:text-[#1a1a1a] dark:hover:bg-transparent dark:hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#4697D2]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                იგზავნება...
              </>
            ) : (
              'განაცხადის გაგზავნა'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
