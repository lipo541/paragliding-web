'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { User } from '@supabase/supabase-js';

export default function AuthButtons() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; role: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const { client, session } = useSupabase();

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

    // SUPER_ADMIN gets CMS button (traditional style)
    if (isSuperAdmin) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/cms`}
            className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
          >
            CMS
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all"
          >
            გასვლა
          </button>
        </div>
      );
    }
    
    // Regular USER - Hide profile (they have it in bottom nav)
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all"
        >
          გასვლა
        </button>
      </div>
    );
  }

  // If user is not logged in, show Login and Register buttons
  return (
    <div className="flex items-center gap-2">
      <Link 
        href={`/${locale}/login`}
        className="px-4 py-2 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all"
      >
        შესვლა
      </Link>
      <Link
        href={`/${locale}/register`}
        className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
      >
        რეგისტრაცია
      </Link>
    </div>
  );
}
