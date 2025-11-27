'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { User } from '@supabase/supabase-js';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

export default function AuthButtons() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; role: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const { client, session } = useSupabase();
  const { t } = useTranslation('auth');

  useEffect(() => {
    // Check current user
    const activeUser = session?.user || null;
    setUser(activeUser);
    const loadProfile = async () => {
      if (!activeUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await client
        .from('profiles')
        .select('full_name, role')
        .eq('id', activeUser.id)
        .single();
      setUserProfile(profile);
      setLoading(false);
    };
    loadProfile();
  }, [client, session]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 md:gap-2">
        <div className="h-8 w-16 md:h-9 md:w-20 bg-foreground/10 rounded-md animate-pulse" />
        <div className="h-8 w-20 md:h-9 md:w-24 bg-foreground/10 rounded-md animate-pulse" />
      </div>
    );
  }

  // If user is logged in, show appropriate buttons based on role
  if (user) {
    const handleLogout = async () => {
      await client.auth.signOut();
      window.location.href = `/${locale}`;
    };
    
    const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

    // SUPER_ADMIN gets CMS button
    if (isSuperAdmin) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/cms`}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
            style={{ backgroundColor: '#CAFA00', color: '#1a1a1a' }}
          >
            CMS
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-[#1a1a1a] dark:text-white border border-[#4697D2]/30 dark:border-white/30 rounded-md hover:border-[#4697D2]/50 dark:hover:border-white/50 hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-all"
          >
            {t('logout')}
          </button>
        </div>
      );
    }
    
    // Regular USER - No buttons (they have logout in sidebar)
    return null;
  }

  // If user is not logged in, show Login and Register buttons
  return (
    <div className="flex items-center gap-2">
      <Link 
        href={`/${locale}/login`}
        className="px-4 py-2 text-sm font-medium backdrop-blur-sm rounded-md transition-all bg-white/80 text-[#1a1a1a] border border-[#4697D2]/40 hover:bg-white hover:border-[#4697D2] dark:bg-black/40 dark:text-white dark:border-white/30 dark:hover:bg-black/60 dark:hover:border-white/60"
      >
        {t('login')}
      </Link>
      <Link
        href={`/${locale}/register`}
        className="px-4 py-2 text-sm font-medium rounded-md transition-all bg-[#4697D2] text-[#1a1a1a] hover:bg-[#3a7bb0] dark:text-white dark:hover:bg-[#3a7bb0]"
      >
        {t('register')}
      </Link>
    </div>
  );
}
