'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface Pilot {
  id: string;
  user_id: string;
  first_name_ka: string | null;
  last_name_ka: string | null;
  avatar_url: string | null;
  tandem_flights: number | null;
  solo_flights: number | null;
  years_experience: number | null;
  license_number: string | null;
  license_type: string | null;
  status: string;
  company_id: string | null;
  created_at: string;
}

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedFlights: number;
  rating: number;
  reviews: number;
}

export default function PilotDashboard() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const { t } = useTranslation('pilotdashboard');
  
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedFlights: 0,
    rating: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPilotData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch pilot data
      const { data: pilotData } = await supabase
        .from('pilots')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!pilotData) {
        setLoading(false);
        return;
      }

      setPilot(pilotData);

      // Fetch stats
      const [bookingsResult, completedResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, status', { count: 'exact' })
          .eq('pilot_id', pilotData.id),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('pilot_id', pilotData.id)
          .eq('status', 'completed'),
      ]);

      const pendingCount =
        bookingsResult.data?.filter((b: { status: string }) => b.status === 'pending').length || 0;

      setStats({
        totalBookings: bookingsResult.count || 0,
        pendingBookings: pendingCount,
        completedFlights: completedResult.count || 0,
        rating: 4.8, // TODO: Calculate from reviews
        reviews: 0, // TODO: Fetch from reviews table
      });

      setLoading(false);
    };

    fetchPilotData();
  }, [supabase]);

  const getPilotName = () => {
    if (!pilot) return '';
    const firstName = pilot.first_name_ka || '';
    const lastName = pilot.last_name_ka || '';
    return `${firstName} ${lastName}`.trim();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <svg className="mb-4 h-16 w-16 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-foreground/60">{t('noPilotProfile') || 'პილოტის პროფილი ვერ მოიძებნა'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/30">
            {pilot?.avatar_url ? (
              <Image
                src={pilot.avatar_url}
                alt={getPilotName()}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/20">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t('welcome') || 'გამარჯობა'}, {getPilotName()}!
            </h1>
            <p className="text-white/80">{t('welcomeSubtitle') || 'კეთილი იყოს შენი დაბრუნება პილოტის პანელზე'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
          <p className="text-sm text-foreground/60">{t('totalBookings') || 'სულ ჯავშანი'}</p>
        </div>

        <div className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.pendingBookings}</p>
          <p className="text-sm text-foreground/60">{t('pendingBookings') || 'მომლოდინე'}</p>
        </div>

        <div className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{pilot?.tandem_flights || 0}</p>
          <p className="text-sm text-foreground/60">{t('tandemFlights') || 'ტანდემ ფრენა'}</p>
        </div>

        <div className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.rating.toFixed(1)}</p>
          <p className="text-sm text-foreground/60">{t('rating') || 'რეიტინგი'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('quickActions') || 'სწრაფი მოქმედებები'}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <button className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-background p-4 transition-all hover:border-foreground/20 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
              <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="font-medium text-foreground">{t('editProfile') || 'პროფილის რედაქტირება'}</span>
          </button>

          <button className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-background p-4 transition-all hover:border-foreground/20 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
              <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-foreground">{t('manageSchedule') || 'განრიგის მართვა'}</span>
          </button>

          <button className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-background p-4 transition-all hover:border-foreground/20 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
              <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-medium text-foreground">{t('certificates') || 'სერთიფიკატები'}</span>
          </button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('recentBookings') || 'ბოლო ჯავშნები'}</h2>
          <button className="text-sm text-foreground/60 hover:text-foreground">
            {t('viewAll') || 'ყველას ნახვა'} →
          </button>
        </div>
        
        <div className="rounded-xl border border-foreground/10 bg-background">
          {stats.totalBookings === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-foreground/60">{t('noBookings') || 'ჯერ არ გაქვთ ჯავშნები'}</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/10">
              {/* Placeholder for booking items - will be populated later */}
              <div className="p-4 text-center text-foreground/60">
                {t('loadingBookings') || 'ჯავშნების ჩატვირთვა...'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
