'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import UserProfile from '@/components/userbottomnav/UserProfile';

type UserRole = 'USER' | 'SUPER_ADMIN' | 'TANDEM_PILOT' | 'SOLO_PILOT' | 'COMPANY';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push(`/${locale}/login`);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          const userRole = profile.role as UserRole;
          setRole(userRole);

          // Redirect based on role
          switch (userRole) {
            case 'SUPER_ADMIN':
              router.replace(`/${locale}/cms`);
              return;
            case 'COMPANY':
              router.replace(`/${locale}/cms`);
              return;
            case 'TANDEM_PILOT':
            case 'SOLO_PILOT':
              router.replace(`/${locale}/pilot/dashboard`);
              return;
            default:
              // USER - stay on this page
              break;
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [supabase, router, locale]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Only USER role sees this page - others are redirected
  return <UserProfile />;
}
