'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function AuthButtons() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; role: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Fetch user profile if user exists
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      }
      
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Fetch profile when user logs in
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();
        
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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
      await supabase.auth.signOut();
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
