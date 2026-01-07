'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { pilotSchema, type PilotFormData } from '@/lib/validations/pilot';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Upload,
  Loader2,
  ArrowLeft,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Plane,
  Shield,
  Briefcase,
  Plus,
  Trash2,
} from 'lucide-react';

interface AchievementEntry {
  id: string;
  title_ka: string;
  title_en: string;
  title_ru: string;
  title_de: string;
  title_tr: string;
  title_ar: string;
  description_ka: string;
  description_en: string;
  description_ru: string;
  description_de: string;
  description_tr: string;
  description_ar: string;
  achievement_date: string;
  certificate_file?: File;
}

export default function PilotRegisterForm() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split('/')[1] || 'ka';

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Verification documents state (multiple images)
  const [verificationDocs, setVerificationDocs] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);

  // Equipment documents state
  const [equipmentDocs, setEquipmentDocs] = useState<Record<string, File | null>>({
    wing: null,
    harness: null,
    passenger_harness: null,
    reserve: null,
  });
  const [equipmentPreviews, setEquipmentPreviews] = useState<Record<string, string | null>>({
    wing: null,
    harness: null,
    passenger_harness: null,
    reserve: null,
  });

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    experience: false,
    equipment: false,
    bio: false,
    achievements: false,
  });

  // Achievements state
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PilotFormData>({
    resolver: zodResolver(pilotSchema),
    defaultValues: {
      gender: 'male',
    },
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${currentLocale}/login?redirect=/profile/become-pilot`);
        return;
      }

      // Check if already a pilot
      const { data: existingPilot } = await supabase.from('pilots').select('id').eq('user_id', user.id).single();

      if (existingPilot) {
        router.push(`/${currentLocale}/profile`);
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router, currentLocale]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle verification documents upload (multiple files)
  const handleVerificationDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setVerificationDocs((prev) => [...prev, ...newFiles]);
      
      // Create previews for new files
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setVerificationPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove a verification document
  const removeVerificationDoc = (index: number) => {
    setVerificationDocs((prev) => prev.filter((_, i) => i !== index));
    setVerificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle equipment document upload
  const handleEquipmentDocChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEquipmentDocs((prev) => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onload = () => {
        setEquipmentPreviews((prev) => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove equipment document
  const removeEquipmentDoc = (type: string) => {
    setEquipmentDocs((prev) => ({ ...prev, [type]: null }));
    setEquipmentPreviews((prev) => ({ ...prev, [type]: null }));
  };

  const addAchievement = () => {
    setAchievements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title_ka: '',
        title_en: '',
        title_ru: '',
        title_de: '',
        title_tr: '',
        title_ar: '',
        description_ka: '',
        description_en: '',
        description_ru: '',
        description_de: '',
        description_tr: '',
        description_ar: '',
        achievement_date: '',
      },
    ]);
    setExpandedSections((prev) => ({ ...prev, achievements: true }));
  };

  const removeAchievement = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAchievement = (id: string, field: keyof AchievementEntry, value: string | File) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const onSubmit = async (data: PilotFormData) => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('გთხოვთ გაიაროთ ავტორიზაცია');
        return;
      }

      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pilot-avatars')
          .upload(fileName, avatarFile);

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          throw new Error('პროფილის ფოტოს ატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.');
        }
        
        const {
          data: { publicUrl },
        } = supabase.storage.from('pilot-avatars').getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      // Upload verification documents (multiple images)
      const verificationDocUrls: string[] = [];
      if (verificationDocs.length > 0) {
        for (const doc of verificationDocs) {
          const fileExt = doc.name.split('.').pop();
          const fileName = `${user.id}/verification/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('pilot-certificates')
            .upload(fileName, doc);

          if (uploadError) {
            console.error('Verification doc upload error:', uploadError);
            throw new Error('გადამოწმების დოკუმენტების ატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.');
          }
          
          const {
            data: { publicUrl },
          } = supabase.storage.from('pilot-certificates').getPublicUrl(fileName);
          verificationDocUrls.push(publicUrl);
        }
      }

      // Upload equipment documents
      const equipmentDocUrls: Record<string, string | null> = {
        wing: null,
        harness: null,
        passenger_harness: null,
        reserve: null,
      };

      for (const [type, file] of Object.entries(equipmentDocs)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/equipment/${type}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('pilot-certificates')
            .upload(fileName, file);

          if (uploadError) {
            console.error(`Equipment ${type} doc upload error:`, uploadError);
            const typeNames: Record<string, string> = {
              wing: 'ფრთის',
              harness: 'პილოტის ჰარნესის',
              passenger_harness: 'მგზავრის ჰარნესის',
              reserve: 'რეზერვის'
            };
            throw new Error(`${typeNames[type] || 'აღჭურვილობის'} სერტიფიკატის ატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.`);
          }
          
          const {
            data: { publicUrl },
          } = supabase.storage.from('pilot-certificates').getPublicUrl(fileName);
          equipmentDocUrls[type] = publicUrl;
        }
      }

      // Generate slug from name
      const generateSlug = (firstName: string, lastName: string): string => {
        const name = `${firstName} ${lastName}`.toLowerCase().trim();
        return name
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      };

      const baseSlug = generateSlug(
        data.first_name_ka || 'pilot',
        data.last_name_ka || ''
      );

      // Check for existing slugs and make unique if needed
      const { data: existingSlugs } = await supabase
        .from('pilots')
        .select('slug')
        .ilike('slug', `${baseSlug}%`);

      let finalSlug = baseSlug;
      if (existingSlugs && existingSlugs.length > 0) {
        finalSlug = `${baseSlug}-${existingSlugs.length + 1}`;
      }

      // Insert pilot record
      const { data: pilot, error: insertError } = await supabase
        .from('pilots')
        .insert({
          user_id: user.id,
          status: 'pending',
          slug: finalSlug,
          // Personal info
          first_name_ka: data.first_name_ka || null,
          first_name_ru: data.first_name_ru || null,
          first_name_de: data.first_name_de || null,
          first_name_tr: data.first_name_tr || null,
          first_name_ar: data.first_name_ar || null,
          last_name_ka: data.last_name_ka || null,
          last_name_ru: data.last_name_ru || null,
          last_name_de: data.last_name_de || null,
          last_name_tr: data.last_name_tr || null,
          last_name_ar: data.last_name_ar || null,
          phone: data.phone,
          email: data.email,
          birth_date: data.birth_date || null,
          gender: data.gender || null,
          avatar_url: avatarUrl,
          // Verification documents
          verification_documents: verificationDocUrls,
          // Experience
          commercial_start_date: data.commercial_start_date || null,
          total_flights: data.total_flights || null,
          tandem_flights: data.tandem_flights || null,
          // Wing equipment
          wing_brand: data.wing_brand || null,
          wing_model: data.wing_model || null,
          wing_certificate_url: equipmentDocUrls.wing,
          // Pilot Harness equipment (პილოტის)
          pilot_harness_brand: data.pilot_harness_brand || null,
          pilot_harness_model: data.pilot_harness_model || null,
          pilot_harness_certificate_url: equipmentDocUrls.harness,
          // Passenger harness equipment (მგზავრის)
          passenger_harness_brand: data.passenger_harness_brand || null,
          passenger_harness_model: data.passenger_harness_model || null,
          passenger_harness_certificate_url: equipmentDocUrls.passenger_harness,
          // Reserve equipment
          reserve_brand: data.reserve_brand || null,
          reserve_model: data.reserve_model || null,
          reserve_certificate_url: equipmentDocUrls.reserve,
          // Bio
          bio_ka: data.bio_ka || null,
          bio_en: data.bio_en || null,
          bio_ru: data.bio_ru || null,
          bio_de: data.bio_de || null,
          bio_tr: data.bio_tr || null,
          bio_ar: data.bio_ar || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Insert achievements if any
      if (pilot && achievements.length > 0) {
        for (const achievement of achievements) {
          let certificateUrl: string | null = null;

          // Upload certificate if exists
          if (achievement.certificate_file) {
            const fileExt = achievement.certificate_file.name.split('.').pop();
            const fileName = `${pilot.id}/${Date.now()}-${achievement.id}.${fileExt}`;

            const { error: certUploadError } = await supabase.storage
              .from('pilot-certificates')
              .upload(fileName, achievement.certificate_file);

            if (!certUploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from('pilot-certificates').getPublicUrl(fileName);
              certificateUrl = publicUrl;
            }
          }

          await supabase.from('pilot_achievements').insert({
            pilot_id: pilot.id,
            title_ka: achievement.title_ka || null,
            title_en: achievement.title_en || null,
            title_ru: achievement.title_ru || null,
            title_de: achievement.title_de || null,
            title_tr: achievement.title_tr || null,
            title_ar: achievement.title_ar || null,
            description_ka: achievement.description_ka || null,
            description_en: achievement.description_en || null,
            description_ru: achievement.description_ru || null,
            description_de: achievement.description_de || null,
            description_tr: achievement.description_tr || null,
            description_ar: achievement.description_ar || null,
            achievement_date: achievement.achievement_date || null,
            certificate_url: certificateUrl,
          });
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error registering pilot:', err);
      setError('რეგისტრაციის დროს მოხდა შეცდომა. გთხოვთ სცადოთ თავიდან.');
    } finally {
      setLoading(false);
    }
  };

  // Equipment type definitions
  type EquipmentKey = 'wing' | 'harness' | 'passenger_harness' | 'reserve';

  const equipmentConfig: Record<EquipmentKey, { 
    title: string; 
    docLabel: string; 
    brandField: keyof PilotFormData; 
    modelField: keyof PilotFormData;
    icon: React.ReactNode;
  }> = {
    wing: {
      title: 'ფრთა (Wing)',
      docLabel: 'ატვირთეთ ფრთის ვარგისიანობის დამადასტურებელი დოკუმენტი',
      brandField: 'wing_brand',
      modelField: 'wing_model',
      icon: <Plane className="h-5 w-5 text-[#4697D2]" />,
    },
    harness: {
      title: 'პილოტის ჰარნესი (Pilot Harness)',
      docLabel: 'ატვირთეთ ჰარნესის ვარგისიანობის დამადასტურებელი დოკუმენტი',
      brandField: 'pilot_harness_brand',
      modelField: 'pilot_harness_model',
      icon: <Shield className="h-5 w-5 text-[#4697D2]" />,
    },
    passenger_harness: {
      title: 'მგზავრის ჰარნესი (Passenger Harness)',
      docLabel: 'ატვირთეთ მგზავრის ჰარნესის ვარგისიანობის დამადასტურებელი დოკუმენტი',
      brandField: 'passenger_harness_brand',
      modelField: 'passenger_harness_model',
      icon: <User className="h-5 w-5 text-green-500" />,
    },
    reserve: {
      title: 'რეზერვი (Reserve)',
      docLabel: 'ატვირთეთ სარეზერვო პარაშუტის გადაკეცვის დამადასტურებელი დოკუმენტი',
      brandField: 'reserve_brand',
      modelField: 'reserve_model',
      icon: <Shield className="h-5 w-5 text-orange-500" />,
    },
  };

  // Equipment section renderer
  const renderEquipmentSection = (type: EquipmentKey) => {
    const config = equipmentConfig[type];

    return (
      <div className="rounded-lg border border-[#4697D2]/20 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          {config.icon}
          <h4 className="font-medium text-[#1a1a1a] dark:text-white">{config.title}</h4>
        </div>
        
        {/* Brand and Model */}
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-1">ბრენდი</label>
            <input
              type="text"
              {...register(config.brandField)}
              className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-3 py-2 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
              placeholder="მაგ: Ozone, Advance..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-1">მოდელი</label>
            <input
              type="text"
              {...register(config.modelField)}
              className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-3 py-2 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
              placeholder="მაგ: Magnum 3"
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="rounded-lg border-2 border-dashed border-red-500/50 dark:border-red-400/50 bg-red-500/5 dark:bg-red-400/5 p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
            <Upload className="h-4 w-4" />
            {config.docLabel} *
          </label>
          
          {equipmentPreviews[type] ? (
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-foreground/10">
                <Image
                  src={equipmentPreviews[type]!}
                  alt="Document preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEquipmentDoc(type)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 dark:border-red-400/30 bg-white/80 dark:bg-black/40 cursor-pointer hover:bg-red-500/10 dark:hover:bg-red-400/10 transition-colors">
              <Upload className="h-4 w-4 text-red-500 dark:text-red-400" />
              <span className="text-xs text-red-600 dark:text-red-400">აირჩიეთ ფაილი</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleEquipmentDocChange(type, e)}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <User className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">განაცხადი გაგზავნილია!</h2>
          <p className="text-gray-600 dark:text-white/70 mb-6">
            თქვენი პილოტის რეგისტრაციის განაცხადი მიღებულია. ადმინისტრატორი განიხილავს და დაგიკავშირდებათ.
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
          <User className="mx-auto h-12 w-12 text-[#4697D2] dark:text-white mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] dark:text-white">ტანდემ პილოტის რეგისტრაცია</h1>
          <p className="mt-2 text-[#1a1a1a]/60 dark:text-white/70">შეავსეთ ფორმა პილოტად დასარეგისტრირებლად</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 pb-4 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="relative h-24 w-24 rounded-full bg-white/50 dark:bg-white/10 border-2 border-dashed border-[#4697D2]/40 dark:border-white/30 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
              ) : (
                <Upload className="h-8 w-8 text-[#1a1a1a]/40 dark:text-white/50" />
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-2 text-sm text-[#1a1a1a] dark:text-white hover:border-[#4697D2] dark:hover:border-white/40 transition-all">
              ფოტოს ატვირთვა
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="პროფილის ფოტოს ატვირთვა"
              />
            </label>
          </div>

          {/* Section 1: Personal Info */}
          <div className="rounded-lg border border-[#4697D2]/30 dark:border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('personal')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#4697D2]/10 dark:bg-white/5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/15 dark:hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <User className="h-5 w-5" />
                პერსონალური ინფორმაცია
              </span>
              {expandedSections.personal ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedSections.personal && (
              <div className="p-4 space-y-4">
                {/* Names in Georgian (required) */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      🇬🇪 სახელი (ქართ.) *
                    </label>
                    <input
                      type="text"
                      {...register('first_name_ka')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                      placeholder="გიორგი"
                    />
                    {errors.first_name_ka && <p className="mt-1 text-sm text-red-500">{errors.first_name_ka.message}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      🇬🇪 გვარი (ქართ.) *
                    </label>
                    <input
                      type="text"
                      {...register('last_name_ka')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                      placeholder="გიორგაძე"
                    />
                    {errors.last_name_ka && <p className="mt-1 text-sm text-red-500">{errors.last_name_ka.message}</p>}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <Phone className="h-4 w-4" /> ტელეფონი *
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                      placeholder="+995 555 123 456"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <Mail className="h-4 w-4" /> ელ-ფოსტა *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                      placeholder="giorgi@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Birth Date & Gender */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <Calendar className="h-4 w-4" /> დაბადების თარიღი
                    </label>
                    <input
                      type="date"
                      {...register('birth_date')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <User className="h-4 w-4" /> სქესი
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                    >
                      <option value="male">მამრობითი</option>
                      <option value="female">მდედრობითი</option>
                      <option value="other">სხვა</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Experience & Licenses */}
          <div className="rounded-lg border border-[#4697D2]/30 dark:border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('experience')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#4697D2]/10 dark:bg-white/5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/15 dark:hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <Award className="h-5 w-5" />
                გამოცდილება და ლიცენზიები
              </span>
              {expandedSections.experience ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedSections.experience && (
              <div className="p-4 space-y-4">
                {/* Verification Documents Upload */}
                <div className="rounded-lg border-2 border-dashed border-red-500/50 dark:border-red-400/50 bg-red-500/5 dark:bg-red-400/5 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                    <Upload className="h-5 w-5" />
                    ატვირთეთ პილოტის დამადასტურებელი დოკუმენტი *
                  </label>
                  <p className="text-xs text-red-500/80 dark:text-red-400/70 mb-3">
                    ატვირთეთ თქვენი პილოტის ლიცენზიის ან სერთიფიკატის ფოტო/სკანი. შეგიძლიათ ატვირთოთ რამდენიმე სურათი.
                  </p>
                  
                  {/* Upload button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 dark:border-red-400/30 bg-white/80 dark:bg-black/40 cursor-pointer hover:bg-red-500/10 dark:hover:bg-red-400/10 transition-colors">
                    <Upload className="h-5 w-5 text-red-500 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400">აირჩიეთ სურათ(ებ)ი</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleVerificationDocsChange}
                      className="hidden"
                    />
                  </label>

                  {/* Preview uploaded documents */}
                  {verificationPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {verificationPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-foreground/10">
                            <Image
                              src={preview}
                              alt={`Document ${index + 1}`}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVerificationDoc(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {verificationDocs.length === 0 && (
                    <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                      * სავალდებულოა მინიმუმ ერთი დოკუმენტის ატვირთვა
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <Calendar className="h-4 w-4" /> კომერციული დაწყება
                    </label>
                    <input
                      type="date"
                      {...register('commercial_start_date')}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <Plane className="h-4 w-4" /> სულ ფრენები
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('total_flights', { valueAsNumber: true })}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                      <Plane className="h-4 w-4" /> ტანდემ ფრენები
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('tandem_flights', { valueAsNumber: true })}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20"
                      placeholder="3000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Equipment */}
          <div className="rounded-lg border border-[#4697D2]/30 dark:border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('equipment')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#4697D2]/10 dark:bg-white/5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/15 dark:hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <Briefcase className="h-5 w-5" />
                აღჭურვილობა
              </span>
              {expandedSections.equipment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedSections.equipment && (
              <div className="p-4 space-y-4">
                {renderEquipmentSection('wing')}
                {renderEquipmentSection('harness')}
                {renderEquipmentSection('passenger_harness')}
                {renderEquipmentSection('reserve')}
              </div>
            )}
          </div>

          {/* Section 4: Bio */}
          <div className="rounded-lg border border-[#4697D2]/30 dark:border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('bio')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#4697D2]/10 dark:bg-white/5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/15 dark:hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <FileText className="h-5 w-5" />
                ბიოგრაფია
              </span>
              {expandedSections.bio ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedSections.bio && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">მინიმუმ ერთ ენაზე შეავსეთ *</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                      🇬🇪 ქართულად
                    </label>
                    <textarea
                      {...register('bio_ka')}
                      rows={3}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                      placeholder="მოკლედ თქვენს შესახებ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                      🇬🇧 English
                    </label>
                    <textarea
                      {...register('bio_en')}
                      rows={3}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                      placeholder="Brief description about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                      🇷🇺 Русский
                    </label>
                    <textarea
                      {...register('bio_ru')}
                      rows={3}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                      placeholder="Краткое описание о себе..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                      🇩🇪 Deutsch
                    </label>
                    <textarea
                      {...register('bio_de')}
                      rows={3}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                      placeholder="Kurze Beschreibung über sich..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                      🇹🇷 Türkçe
                    </label>
                    <textarea
                      {...register('bio_tr')}
                      rows={3}
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                      placeholder="Kendiniz hakkında kısa açıklama..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a]/70 dark:text-white/70 mb-1">
                      🇸🇦 العربية
                    </label>
                    <textarea
                      {...register('bio_ar')}
                      rows={3}
                      dir="rtl"
                      className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 transition-all focus:outline-none focus:border-[#4697D2] focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:border-white/50 dark:focus:ring-white/20 resize-none"
                      placeholder="وصف موجز عن نفسك..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Achievements */}
          <div className="rounded-lg border border-[#4697D2]/30 dark:border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('achievements')}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#4697D2]/10 dark:bg-white/5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/15 dark:hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <Award className="h-5 w-5" />
                მიღწევები და სერტიფიკატები ({achievements.length})
              </span>
              {expandedSections.achievements ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedSections.achievements && (
              <div className="p-4 space-y-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className="rounded-lg border border-[#4697D2]/20 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-[#1a1a1a] dark:text-white">მიღწევა #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAchievement(achievement.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-1">
                          სათაური (ქართ.)
                        </label>
                        <input
                          type="text"
                          value={achievement.title_ka}
                          onChange={(e) => updateAchievement(achievement.id, 'title_ka', e.target.value)}
                          className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 text-sm text-[#1a1a1a] dark:text-white"
                          placeholder="მაგ: FAI სერტიფიკატი"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-1">
                          Title (English)
                        </label>
                        <input
                          type="text"
                          value={achievement.title_en}
                          onChange={(e) => updateAchievement(achievement.id, 'title_en', e.target.value)}
                          className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 text-sm text-[#1a1a1a] dark:text-white"
                          placeholder="e.g: FAI Certificate"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-1">
                          თარიღი
                        </label>
                        <input
                          type="date"
                          value={achievement.achievement_date}
                          onChange={(e) => updateAchievement(achievement.id, 'achievement_date', e.target.value)}
                          className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 text-sm text-[#1a1a1a] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-1">
                          სერტიფიკატი (PDF/სურათი)
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateAchievement(achievement.id, 'certificate_file', file);
                          }}
                          className="w-full rounded-lg border border-[#4697D2]/30 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 text-sm text-[#1a1a1a] dark:text-white file:mr-2 file:rounded file:border-0 file:bg-[#4697D2]/20 file:px-2 file:py-1 file:text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAchievement}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#4697D2]/40 dark:border-white/30 py-3 text-[#4697D2] dark:text-white/70 hover:bg-[#4697D2]/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  მიღწევის დამატება
                </button>
              </div>
            )}
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
