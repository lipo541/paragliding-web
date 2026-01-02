'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { profileSchema, passwordChangeSchema, ProfileFormData, PasswordChangeFormData } from '@/lib/validations/profile';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import MyApplications from './MyApplications';
import Breadcrumbs, { buildBreadcrumbs, type Locale } from '@/components/shared/Breadcrumbs';

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default function UserProfile() {
  const { t, locale } = useTranslation('userprofile');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>({ full_name: '', phone: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const supabase = createClient();

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty, isSubmitting: isProfileSubmitting },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
    },
  });

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

  const phoneValue = watch('phone');
  const newPassword = watchPassword('newPassword');

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProfileDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProfileDirty]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setValue('full_name', data.full_name || '');
        setValue('phone', data.phone || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('form.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, full_name: data.full_name, phone: data.phone || null }));
      toast.success(t('form.updateSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('form.updateError'));
    }
  };

  const onSubmitPassword = async (data: PasswordChangeFormData) => {
    try {
      // Update password - Supabase requires active session
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success(t('password.changeSuccess'));
      resetPasswordForm();
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || t('password.changeError'));
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(t('avatar.invalidType'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('avatar.tooLarge'));
      return;
    }

    setUploadingAvatar(true);

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        // Extract the path from URL
        const urlParts = profile.avatar_url.split('/profile-IMG-bucket/');
        if (urlParts.length > 1) {
          const oldPath = urlParts[1];
          await supabase.storage.from('profile-IMG-bucket').remove([oldPath]);
        }
      }

      // Upload new avatar - ფოლდერის სტრუქტურა: users/{user_id}/{filename}
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `users/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-IMG-bucket')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-IMG-bucket')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success(t('avatar.uploadSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('avatar.uploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !profile.avatar_url) return;

    if (!confirm(t('avatar.deleteConfirm'))) return;

    try {
      // Extract the path from URL
      const urlParts = profile.avatar_url.split('/profile-IMG-bucket/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('profile-IMG-bucket').remove([filePath]);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, avatar_url: null }));
      toast.success(t('avatar.deleteSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('avatar.deleteError'));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarUpload(file);
  }, [user, profile.avatar_url]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pr-20 selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Breadcrumbs */}
        <div className="animate-fadeIn">
          <Breadcrumbs items={buildBreadcrumbs(locale as Locale, ['profile'])} />
        </div>
        
        {/* Compact Header */}
        <div className="animate-fadeIn">
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">{t('title')}</h1>
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">{t('subtitle')}</p>
        </div>

        {/* My Applications Section */}
        <MyApplications />

        {/* Avatar Upload Section - Glass Card */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">{t('avatar.title')}</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative group flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border border-[#4697D2]/20 dark:border-white/10 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#4697D2] dark:bg-white text-white dark:text-[#1a1a1a] flex items-center justify-center text-2xl font-bold shadow-md">
                  {profile.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Spinner size="md" className="border-white border-t-transparent" />
                </div>
              )}

              {profile.avatar_url && !uploadingAvatar && (
                <button
                  onClick={handleDeleteAvatar}
                  className="absolute -top-1 -right-1 bg-[#4697D2] dark:bg-white text-white dark:text-[#1a1a1a] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label={t('avatar.delete')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Upload Area - Minimal Glass */}
            <div
              className={`flex-1 border border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[#4697D2] dark:border-white bg-[#4697D2]/5 dark:bg-white/5'
                  : 'border-[#4697D2]/30 dark:border-white/20 hover:border-[#4697D2]/60 dark:hover:border-white/40 hover:bg-[#4697D2]/5 dark:hover:bg-white/5'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                aria-label="Upload avatar image"
              />
              
              <div className="space-y-1.5 pointer-events-none">
                <svg className="w-6 h-6 mx-auto text-[#1a1a1a]/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
                  <span className="text-[#1a1a1a] dark:text-white font-medium">{t('avatar.choose')}</span> {t('avatar.or')}
                </p>
                <p className="text-[10px] text-[#1a1a1a]/40 dark:text-white/40">{t('avatar.maxSize')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form - Glass Card */}
        <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">{t('form.title')}</h2>
          </div>

          <Input
            {...registerProfile('full_name')}
            label={t('form.fullName.label')}
            placeholder={t('form.fullName.placeholder')}
            error={profileErrors.full_name?.message}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1a1a1a] dark:text-white">
              {t('form.phone.label')}
            </label>
            <PhoneInput
              international
              defaultCountry="GE"
              value={phoneValue}
              onChange={(value) => setValue('phone', value || '', { shouldDirty: true, shouldValidate: true })}
              className="phone-input w-full px-4 py-3 bg-white/80 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg text-[#1a1a1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4697D2]/30 dark:focus:ring-white/20"
            />
            {profileErrors.phone && (
              <p className="text-sm text-red-600 flex items-center gap-1 animate-fadeIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {profileErrors.phone.message}
              </p>
            )}
          </div>

          <Input
            type="email"
            label={t('form.email.label')}
            value={user?.email || ''}
            disabled
            helperText={t('form.email.helperText')}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isProfileSubmitting}
            disabled={!isProfileDirty}
            fullWidth
          >
            {t('form.save')}
          </Button>
        </form>

        {/* Password Change Section - Glass Card */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl overflow-hidden animate-fadeIn">
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="w-full p-5 flex items-center justify-between hover:bg-[#4697D2]/10 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
                <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">{t('password.title')}</h2>
            </div>
            <svg className={`w-5 h-5 text-[#1a1a1a]/60 dark:text-white/60 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPasswordChange && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="p-5 pt-0 space-y-4 animate-fadeIn">
              <Input
                {...registerPassword('newPassword')}
                type="password"
                label={t('password.newPassword.label')}
                placeholder={t('password.newPassword.placeholder')}
                error={passwordErrors.newPassword?.message}
                required
                autoComplete="new-password"
              />

              {/* Password Strength Indicator */}
              <PasswordStrength password={newPassword || ''} />

              <Input
                {...registerPassword('confirmPassword')}
                type="password"
                label={t('password.confirmPassword.label')}
                placeholder={t('password.confirmPassword.placeholder')}
                error={passwordErrors.confirmPassword?.message}
                required
                autoComplete="new-password"
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    resetPasswordForm();
                    setShowPasswordChange(false);
                  }}
                >
                  {t('password.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPasswordSubmitting}
                  fullWidth
                >
                  {t('password.save')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
