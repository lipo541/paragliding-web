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
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>({ full_name: '', phone: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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
      toast.error('პროფილის ჩატვირთვა ვერ მოხერხდა');
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
      toast.success('პროფილი წარმატებით განახლდა!');
    } catch (error: any) {
      toast.error(error.message || 'დაფიქსირდა შეცდომა');
    }
  };

  const onSubmitPassword = async (data: PasswordChangeFormData) => {
    try {
      // Update password - Supabase requires active session
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success('პაროლი წარმატებით შეიცვალა!');
      resetPasswordForm();
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'პაროლის შეცვლა ვერ მოხერხდა');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('გთხოვთ აირჩიოთ სურათი');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('ფაილის ზომა არ უნდა აღემატებოდეს 2MB-ს');
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
      toast.success('ფოტო წარმატებით აიტვირთა!');
    } catch (error: any) {
      toast.error(error.message || 'ფოტოს ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !profile.avatar_url) return;

    if (!confirm('დარწმუნებული ხართ რომ გსურთ ფოტოს წაშლა?')) return;

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
      toast.success('ფოტო წაიშალა');
    } catch (error: any) {
      toast.error(error.message || 'ფოტოს წაშლა ვერ მოხერხდა');
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
      <div className="min-h-screen flex items-center justify-center pb-20 bg-zinc-50 dark:bg-black">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24 pt-6 px-4 selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto space-y-3">
        
        {/* Compact Header */}
        <div className="animate-fadeIn">
          <h1 className="text-lg lg:text-xl font-bold text-foreground mb-1">პროფილი</h1>
          <p className="text-xs text-foreground/50">განაახლეთ თქვენი პირადი ინფორმაცია</p>
        </div>

        {/* Avatar Upload Section - Glass Card */}
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm p-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0">
              <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-foreground">პროფილის ფოტო</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative group flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border border-foreground/10 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold shadow-md">
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
                  className="absolute -top-1 -right-1 bg-foreground text-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label="წაშალეთ ფოტო"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Upload Area - Minimal Glass */}
            <div
              className={`flex-1 border border-dashed rounded-lg p-4 text-center transition-all ${
                isDragging
                  ? 'border-foreground bg-foreground/5'
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
              
              <div className="space-y-1.5">
                <svg className="w-6 h-6 mx-auto text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-foreground/60">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-foreground font-medium hover:opacity-70 transition-opacity"
                  >
                    აირჩიეთ ფაილი
                  </button>
                  {' '}ან გადმოიტანეთ
                </p>
                <p className="text-[10px] text-foreground/40">მაქს. 2MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form - Glass Card */}
        <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm p-4 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-foreground/10">
            <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0">
              <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-foreground">ძირითადი ინფორმაცია</h2>
          </div>

          <Input
            {...registerProfile('full_name')}
            label="სრული სახელი"
            placeholder="შეიყვანეთ სახელი და გვარი"
            error={profileErrors.full_name?.message}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              ტელეფონის ნომერი
            </label>
            <PhoneInput
              international
              defaultCountry="GE"
              value={phoneValue}
              onChange={(value) => setValue('phone', value || '', { shouldDirty: true, shouldValidate: true })}
              className="phone-input w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            label="ელ. ფოსტა"
            value={user?.email || ''}
            disabled
            helperText="ელ. ფოსტის შეცვლა შეუძლებელია"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isProfileSubmitting}
            disabled={!isProfileDirty}
            fullWidth
          >
            შენახვა
          </Button>
        </form>

        {/* Password Change Section - Glass Card */}
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="w-full p-4 flex items-center justify-between hover:bg-foreground/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0">
                <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-foreground">პაროლის შეცვლა</h2>
            </div>
            <svg className={`w-5 h-5 text-foreground/60 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPasswordChange && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="p-4 pt-0 space-y-4 animate-fadeIn">
              <Input
                {...registerPassword('newPassword')}
                type="password"
                label="ახალი პაროლი"
                placeholder="შეიყვანეთ ახალი პაროლი"
                error={passwordErrors.newPassword?.message}
                required
                autoComplete="new-password"
              />

              {/* Password Strength Indicator */}
              <PasswordStrength password={newPassword || ''} />

              <Input
                {...registerPassword('confirmPassword')}
                type="password"
                label="გაიმეორეთ ახალი პაროლი"
                placeholder="გაიმეორეთ ახალი პაროლი"
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
                  გაუქმება
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPasswordSubmitting}
                  fullWidth
                >
                  შენახვა
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            if (isProfileDirty) {
              setShowLogoutDialog(true);
            } else {
              handleLogout();
            }
          }}
        >
          გასვლა
        </Button>

        {/* Logout Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showLogoutDialog}
          onClose={() => setShowLogoutDialog(false)}
          onConfirm={handleLogout}
          title="შეუნახავი ცვლილებები"
          message="გაქვთ შეუნახავი ცვლილებები. დარწმუნებული ხართ რომ გსურთ გასვლა?"
          confirmText="გასვლა"
          cancelText="გაუქმება"
          variant="danger"
        />
      </div>
    </div>
  );
}

async function handleLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/';
}
