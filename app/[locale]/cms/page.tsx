'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SuperAdminDashboard from '@/components/superadmindashboard/SuperAdminDashboard';

export default function CMSPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          // Not logged in - redirect to login
          router.push('/ka/login');
          return;
        }

        // Check user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          router.push('/ka');
          return;
        }

        // Only SUPER_ADMIN can access
        if (profile?.role !== 'SUPER_ADMIN') {
          // Unauthorized - redirect to home
          router.push('/ka');
          return;
        }

        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/ka/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground"></div>
          <p className="text-sm text-foreground/60">მიმდინარეობს ავტორიზაციის შემოწმება...</p>
        </div>
      </div>
    );
  }

  // Only render dashboard if authorized
  if (!isAuthorized) {
    return null; // Redirect is happening
  }

  return <SuperAdminDashboard />;
}
