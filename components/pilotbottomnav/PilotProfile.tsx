'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, User, Phone, Mail, Calendar, Plane, Shield, Lock, Eye, EyeOff, Trash2, Plus, FileText, ChevronDown, ChevronUp, Image as ImageIcon, Languages, MapPin, Video } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordStrength from '@/components/ui/PasswordStrength';
import toast from 'react-hot-toast';
import Image from 'next/image';

// New enhanced pilot profile components
import PilotGalleryUpload from '@/components/pilot/PilotGalleryUpload';
import PilotCoverImageUpload from '@/components/pilot/PilotCoverImageUpload';
import PilotLanguagesSelect from '@/components/pilot/PilotLanguagesSelect';
import PilotLocationsSelect from '@/components/pilot/PilotLocationsSelect';
import PilotVideoUrls from '@/components/pilot/PilotVideoUrls';
import type { GalleryImage, SupportedLanguage } from '@/lib/types/pilot';

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'მიმდინარე პაროლი აუცილებელია'),
  newPassword: z.string().min(8, 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'პაროლები არ ემთხვევა',
  path: ['confirmPassword'],
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface PilotData {
  id: string;
  user_id: string;
  status: string;
  // Personal info (Georgian only for pilot editing)
  first_name_ka: string | null;
  last_name_ka: string | null;
  // English names for international visitors
  first_name_en: string | null;
  last_name_en: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  avatar_url: string | null;
  // NEW: Cover image and gallery
  cover_image_url: string | null;
  gallery_images: GalleryImage[] | null;
  video_urls: string[] | null;
  // Languages and Locations
  languages: SupportedLanguage[] | null;
  location_ids: string[] | null;
  // Verification documents
  verification_documents: string[];
  // Experience
  commercial_start_date: string | null;
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
}

export default function PilotProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pilot, setPilot] = useState<PilotData | null>(null);
  const [formData, setFormData] = useState<Partial<PilotData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    experience: true,
    media: false, // NEW: Gallery, Cover, Videos
    locationsLanguages: false, // NEW: Locations & Languages
    equipment: false,
    documents: false,
    password: false,
  });

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
    watch: watchPassword,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const newPassword = watchPassword('newPassword');

  // Equipment upload states
  const [equipmentUploading, setEquipmentUploading] = useState<Record<string, boolean>>({});

  // Verification document upload
  const [uploadingVerification, setUploadingVerification] = useState(false);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const fetchPilot = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: pilotData } = await supabase
        .from('pilots')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pilotData) {
        setPilot(pilotData);
        setFormData(pilotData);
      }

      setLoading(false);
    };

    fetchPilot();
  }, [supabase]);

  const handleAvatarUpload = async (file: File) => {
    if (!pilot) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('სურათი ძალიან დიდია (მაქს. 10MB)');
      return;
    }
    
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${pilot.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pilot-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pilot-avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('pilots')
        .update({ avatar_url: publicUrl })
        .eq('id', pilot.id);

      if (updateError) throw updateError;

      setPilot(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('ავატარი წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('ავატარის ატვირთვისას მოხდა შეცდომა');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEquipmentDocUpload = async (type: string, file: File) => {
    if (!pilot) return;
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('ფაილი ძალიან დიდია (მაქს. 50MB)');
      return;
    }
    
    setEquipmentUploading(prev => ({ ...prev, [type]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${pilot.user_id}/equipment/${type}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pilot-certificates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pilot-certificates')
        .getPublicUrl(fileName);

      const certUrlKey = `${type}_certificate_url` as keyof PilotData;
      
      const { error: updateError } = await supabase
        .from('pilots')
        .update({ [certUrlKey]: publicUrl })
        .eq('id', pilot.id);

      if (updateError) throw updateError;

      setPilot(prev => prev ? { ...prev, [certUrlKey]: publicUrl } : null);
      setFormData(prev => ({ ...prev, [certUrlKey]: publicUrl }));
      toast.success('დოკუმენტი წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Error uploading equipment doc:', error);
      toast.error('დოკუმენტის ატვირთვისას მოხდა შეცდომა');
    } finally {
      setEquipmentUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleVerificationDocUpload = async (files: FileList) => {
    if (!pilot) return;
    
    setUploadingVerification(true);
    try {
      const newUrls: string[] = [...(pilot.verification_documents || [])];
      
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} ძალიან დიდია (მაქს. 50MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${pilot.user_id}/verification/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pilot-certificates')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pilot-certificates')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      const { error: updateError } = await supabase
        .from('pilots')
        .update({ verification_documents: newUrls })
        .eq('id', pilot.id);

      if (updateError) throw updateError;

      setPilot(prev => prev ? { ...prev, verification_documents: newUrls } : null);
      setFormData(prev => ({ ...prev, verification_documents: newUrls }));
      toast.success('დოკუმენტები წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Error uploading verification docs:', error);
      toast.error('დოკუმენტების ატვირთვისას მოხდა შეცდომა');
    } finally {
      setUploadingVerification(false);
    }
  };

  const removeVerificationDoc = async (index: number) => {
    if (!pilot) return;
    
    const newDocs = pilot.verification_documents.filter((_, i) => i !== index);
    
    try {
      const { error } = await supabase
        .from('pilots')
        .update({ verification_documents: newDocs })
        .eq('id', pilot.id);

      if (error) throw error;

      setPilot(prev => prev ? { ...prev, verification_documents: newDocs } : null);
      setFormData(prev => ({ ...prev, verification_documents: newDocs }));
      toast.success('დოკუმენტი წაიშალა');
    } catch (error) {
      console.error('Error removing doc:', error);
      toast.error('წაშლისას მოხდა შეცდომა');
    }
  };

  const handleSave = async () => {
    if (!pilot) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pilots')
        .update({
          first_name_ka: formData.first_name_ka,
          last_name_ka: formData.last_name_ka,
          // NEW: English names
          first_name_en: formData.first_name_en,
          last_name_en: formData.last_name_en,
          phone: formData.phone,
          email: formData.email,
          birth_date: formData.birth_date,
          gender: formData.gender,
          commercial_start_date: formData.commercial_start_date,
          total_flights: formData.total_flights,
          tandem_flights: formData.tandem_flights,
          wing_brand: formData.wing_brand,
          wing_model: formData.wing_model,
          pilot_harness_brand: formData.pilot_harness_brand,
          pilot_harness_model: formData.pilot_harness_model,
          passenger_harness_brand: formData.passenger_harness_brand,
          passenger_harness_model: formData.passenger_harness_model,
          reserve_brand: formData.reserve_brand,
          reserve_model: formData.reserve_model,
        })
        .eq('id', pilot.id);

      if (error) throw error;

      setPilot(prev => prev ? { ...prev, ...formData } : null);
      toast.success('პროფილი წარმატებით განახლდა');
    } catch (error) {
      console.error('Error saving pilot:', error);
      toast.error('შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordChange = async (data: PasswordChangeFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success('პაროლი წარმატებით შეიცვალა');
      resetPasswordForm();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'პაროლის შეცვლისას მოხდა შეცდომა');
    }
  };

  const getPilotName = () => {
    if (!pilot) return '';
    return `${pilot.first_name_ka || ''} ${pilot.last_name_ka || ''}`.trim();
  };

  const calculateExperience = () => {
    if (!pilot?.commercial_start_date) return 0;
    const start = new Date(pilot.commercial_start_date);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <p className="text-[#1a1a1a]/60 dark:text-white/60">პილოტის პროფილი ვერ მოიძებნა</p>
      </div>
    );
  }

  // Equipment config
  const equipmentTypes = [
    { key: 'wing', title: 'ფრთა (Wing)', brandKey: 'wing_brand', modelKey: 'wing_model', certKey: 'wing_certificate_url', icon: Plane },
    { key: 'pilot_harness', title: 'პილოტის ჰარნესი', brandKey: 'pilot_harness_brand', modelKey: 'pilot_harness_model', certKey: 'pilot_harness_certificate_url', icon: Shield },
    { key: 'passenger_harness', title: 'მგზავრის ჰარნესი', brandKey: 'passenger_harness_brand', modelKey: 'passenger_harness_model', certKey: 'passenger_harness_certificate_url', icon: User },
    { key: 'reserve', title: 'რეზერვი (Reserve)', brandKey: 'reserve_brand', modelKey: 'reserve_model', certKey: 'reserve_certificate_url', icon: Shield },
  ];

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pr-20 selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">პილოტის პროფილი</h1>
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">განაახლეთ თქვენი პირადი ინფორმაცია</p>
        </div>

        {/* Profile Card with Avatar */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              {pilot.avatar_url ? (
                <img
                  src={pilot.avatar_url}
                  alt={getPilotName()}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-[#4697D2]/30 dark:border-white/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <Spinner size="md" className="border-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-[#4697D2] rounded-full text-white hover:bg-[#4697D2]/80 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#1a1a1a] dark:text-white">{getPilotName() || 'პილოტი'}</h2>
              <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">{pilot.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  pilot.status === 'verified' 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : pilot.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    pilot.status === 'verified' ? 'bg-green-500' : pilot.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  {pilot.status === 'verified' ? 'ვერიფიცირებული' : pilot.status === 'pending' ? 'მომლოდინე' : 'დაბლოკილი'}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {pilot.tandem_flights || 0} ფრენა
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                  {calculateExperience()} წლის გამოცდილება
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('personal')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <User className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">პირადი ინფორმაცია</h2>
            </div>
            {expandedSections.personal ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.personal && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="სახელი"
                  value={formData.first_name_ka || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name_ka: e.target.value }))}
                />
                <Input
                  label="გვარი"
                  value={formData.last_name_ka || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name_ka: e.target.value }))}
                />
              </div>
              
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="დაბადების თარიღი"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white mb-2">სქესი</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30"
                  >
                    <option value="">-</option>
                    <option value="male">მამრობითი</option>
                    <option value="female">მდედრობითი</option>
                    <option value="other">სხვა</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('experience')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <Calendar className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">გამოცდილება</h2>
            </div>
            {expandedSections.experience ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.experience && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              <Input
                label="კომერციული ფრენების დაწყება"
                type="date"
                value={formData.commercial_start_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, commercial_start_date: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="სულ ფრენები"
                  type="number"
                  value={formData.total_flights?.toString() || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_flights: e.target.value ? parseInt(e.target.value) : null }))}
                />
                <Input
                  label="ტანდემ ფრენები"
                  type="number"
                  value={formData.tandem_flights?.toString() || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tandem_flights: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* NEW: Media Section (Gallery, Cover, Videos) */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('media')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <ImageIcon className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">მედია (ფოტო, ვიდეო)</h2>
            </div>
            {expandedSections.media ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.media && (
            <div className="px-5 pb-5 space-y-6 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              {/* Cover Image */}
              <PilotCoverImageUpload
                pilotId={pilot.id}
                userId={pilot.user_id}
                coverImageUrl={pilot.cover_image_url}
                onUpdate={(url) => {
                  setPilot(prev => prev ? { ...prev, cover_image_url: url } : null);
                }}
              />
              
              {/* Gallery */}
              <PilotGalleryUpload
                pilotId={pilot.id}
                userId={pilot.user_id}
                images={pilot.gallery_images || []}
                onUpdate={(images) => {
                  setPilot(prev => prev ? { ...prev, gallery_images: images } : null);
                }}
              />
              
              {/* Videos */}
              <PilotVideoUrls
                pilotId={pilot.id}
                videoUrls={pilot.video_urls || []}
                onUpdate={(urls) => {
                  setPilot(prev => prev ? { ...prev, video_urls: urls } : null);
                }}
              />
            </div>
          )}
        </div>

        {/* NEW: Locations & Languages Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('locationsLanguages')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <MapPin className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ლოკაციები და ენები</h2>
            </div>
            {expandedSections.locationsLanguages ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.locationsLanguages && (
            <div className="px-5 pb-5 space-y-6 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              {/* English Names */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-[#4697D2]" />
                  <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                    სახელი ინგლისურად (საერთაშორისო ვიზიტორებისთვის)
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="სახელი (EN)"
                    placeholder="First Name"
                    value={formData.first_name_en || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name_en: e.target.value }))}
                  />
                  <Input
                    label="გვარი (EN)"
                    placeholder="Last Name"
                    value={formData.last_name_en || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name_en: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Locations */}
              <PilotLocationsSelect
                pilotId={pilot.id}
                selectedLocationIds={pilot.location_ids || []}
                onUpdate={(ids) => {
                  setPilot(prev => prev ? { ...prev, location_ids: ids } : null);
                }}
              />
              
              {/* Languages */}
              <PilotLanguagesSelect
                pilotId={pilot.id}
                selectedLanguages={pilot.languages || []}
                onUpdate={(langs) => {
                  setPilot(prev => prev ? { ...prev, languages: langs } : null);
                }}
              />
            </div>
          )}
        </div>

        {/* Equipment Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('equipment')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <Plane className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">აღჭურვილობა</h2>
            </div>
            {expandedSections.equipment ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.equipment && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              {equipmentTypes.map((eq) => {
                const IconComponent = eq.icon;
                const certUrl = pilot[eq.certKey as keyof PilotData] as string | null;
                
                return (
                  <div key={eq.key} className="p-4 rounded-xl bg-white/50 dark:bg-black/20 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a] dark:text-white">
                      <IconComponent className="w-4 h-4 text-[#4697D2]" />
                      {eq.title}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="ბრენდი"
                        value={(formData[eq.brandKey as keyof PilotData] as string) || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [eq.brandKey]: e.target.value }))}
                        placeholder="მაგ: Ozone"
                      />
                      <Input
                        label="მოდელი"
                        value={(formData[eq.modelKey as keyof PilotData] as string) || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [eq.modelKey]: e.target.value }))}
                        placeholder="მაგ: Magnum 3"
                      />
                    </div>
                    
                    {/* Certificate Document */}
                    <div>
                      <label className="block text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60 mb-2">
                        სერთიფიკატი / ვარგისიანობის დოკუმენტი
                      </label>
                      {certUrl ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={certUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                          >
                            <FileText className="w-4 h-4" />
                            დოკუმენტის ნახვა
                          </a>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id={`eq-${eq.key}`}
                            onChange={(e) => e.target.files?.[0] && handleEquipmentDocUpload(eq.key, e.target.files[0])}
                          />
                          <label
                            htmlFor={`eq-${eq.key}`}
                            className="text-xs text-[#4697D2] cursor-pointer hover:underline"
                          >
                            შეცვლა
                          </label>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id={`eq-${eq.key}`}
                            onChange={(e) => e.target.files?.[0] && handleEquipmentDocUpload(eq.key, e.target.files[0])}
                          />
                          <label
                            htmlFor={`eq-${eq.key}`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#4697D2]/20 text-[#4697D2] rounded-lg text-sm cursor-pointer hover:bg-[#4697D2]/30 transition-colors"
                          >
                            {equipmentUploading[eq.key] ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
                            ატვირთვა
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verification Documents Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('documents')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <FileText className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">
                ვერიფიკაციის დოკუმენტები ({pilot.verification_documents?.length || 0})
              </h2>
            </div>
            {expandedSections.documents ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.documents && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              {/* Existing Documents */}
              {pilot.verification_documents && pilot.verification_documents.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pilot.verification_documents.map((url, index) => (
                    <div key={index} className="relative group">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square rounded-lg overflow-hidden border border-[#4697D2]/30"
                      >
                        <Image
                          src={url}
                          alt={`Document ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </a>
                      <button
                        onClick={() => removeVerificationDoc(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Button */}
              <div>
                <input
                  ref={verificationInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleVerificationDocUpload(e.target.files)}
                />
                <button
                  onClick={() => verificationInputRef.current?.click()}
                  disabled={uploadingVerification}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4697D2]/20 text-[#4697D2] rounded-lg text-sm hover:bg-[#4697D2]/30 transition-colors"
                >
                  {uploadingVerification ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
                  დოკუმენტის დამატება
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => toggleSection('password')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10">
                <Lock className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">პაროლის შეცვლა</h2>
            </div>
            {expandedSections.password ? <ChevronUp className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" /> : <ChevronDown className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />}
          </button>
          
          {expandedSections.password && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#4697D2]/20 dark:border-white/10 pt-4">
              <form onSubmit={handleSubmitPassword(onPasswordChange)} className="space-y-4">
                {/* Current Password */}
                <div className="relative">
                  <Input
                    label="მიმდინარე პაროლი"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...registerPassword('currentPassword')}
                    error={passwordErrors.currentPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-9 text-[#1a1a1a]/50 dark:text-white/50"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* New Password */}
                <div className="relative">
                  <Input
                    label="ახალი პაროლი"
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerPassword('newPassword')}
                    error={passwordErrors.newPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-9 text-[#1a1a1a]/50 dark:text-white/50"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && <PasswordStrength password={newPassword} />}

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    label="გაიმეორეთ პაროლი"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerPassword('confirmPassword')}
                    error={passwordErrors.confirmPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-[#1a1a1a]/50 dark:text-white/50"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isPasswordSubmitting}
                >
                  {isPasswordSubmitting ? <Spinner size="sm" className="mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  პაროლის შეცვლა
                </Button>
              </form>
            </div>
          )}
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
