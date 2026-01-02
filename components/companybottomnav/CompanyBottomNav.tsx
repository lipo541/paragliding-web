'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface CompanyProfile {
  name: string | null;
  logo_url: string | null;
}

export default function CompanyBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const supabase = createClient();

  // Extract locale from pathname
  const locale = useMemo(() => pathname.split('/')[1] || 'ka', [pathname]);
  const { t } = useTranslation('companybottomnav');

  // Get active tab
  const activeTab = useMemo(() => {
    if (pathname.includes('/company/dashboard')) return 'dashboard';
    if (pathname.includes('/company/profile')) return 'profile';
    if (pathname.includes('/user/notifications')) return 'notifications';
    if (pathname.includes('/company/bookings')) return 'bookings';
    if (pathname.includes('/company/pilots')) return 'pilots';
    if (pathname.includes('/company/services')) return 'services';
    return '';
  }, [pathname]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.role === 'COMPANY') {
          setIsVisible(true);
          
          // Fetch company profile
          const { data: company } = await supabase
            .from('companies')
            .select('id, name_ka, name_en, logo_url')
            .eq('user_id', user.id)
            .single();

          if (company) {
            setCompanyProfile({
              name: company.name_ka || company.name_en || '',
              logo_url: company.logo_url,
            });
            setCompanyId(company.id);
            
            // Fetch pending booking count for this company
            fetchPendingBookings(company.id);
          }

          // Fetch unread message count
          fetchUnreadCount(user.id);
        }
      }
    };

    const fetchUnreadCount = async (userId: string) => {
      const { count, error } = await supabase
        .from('message_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error && count !== null) {
        setNotificationCount(count);
      }
    };

    const fetchPendingBookings = async (companyId: string) => {
      // Count unseen bookings for this company
      const { count, error } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('seen_by_company', false);

      if (!error && count !== null) {
        setBookingCount(count);
      }
    };

    checkUser();

    // Real-time subscription for company updates
    const companyChannel = supabase
      .channel('company-profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
        },
        async (payload: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new.user_id === user.id) {
            setCompanyProfile({
              name: payload.new.name,
              logo_url: payload.new.logo_url,
            });
          }
        }
      )
      .subscribe();

    // Real-time subscription for new messages
    const messagesChannel = supabase
      .channel('company-messages-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_recipients',
        },
        async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            fetchUnreadCount(user.id);
          }
        }
      )
      .subscribe();

    // Listen for custom event when message is marked as read
    const handleMessageReadUpdated = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchUnreadCount(user.id);
      }
    };
    window.addEventListener('message-read-updated', handleMessageReadUpdated);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        checkUser();
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(companyChannel);
      supabase.removeChannel(messagesChannel);
      window.removeEventListener('message-read-updated', handleMessageReadUpdated);
    };
  }, [supabase]);

  // Separate effect for bookings subscription that depends on companyId
  useEffect(() => {
    if (!companyId) return;

    const fetchUnseenBookings = async () => {
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('seen_by_company', false);
      
      setBookingCount(count || 0);
    };

    // Initial fetch
    fetchUnseenBookings();

    // Listen for custom event from CompanyBookings when marking as seen
    const handleBookingSeenUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'company') {
        fetchUnseenBookings();
      }
    };
    window.addEventListener('booking-seen-updated', handleBookingSeenUpdated);

    // Subscribe to booking changes for this company
    const channel = supabase
      .channel('company-unseen-bookings-' + companyId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          fetchUnseenBookings();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('booking-seen-updated', handleBookingSeenUpdated);
      supabase.removeChannel(channel);
    };
  }, [supabase, companyId]);

  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: t('dashboard'),
      path: `/${locale}/company/dashboard`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      id: 'bookings',
      label: t('bookings'),
      path: `/${locale}/company/bookings`,
      badge: bookingCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'pilots',
      label: t('pilots'),
      path: `/${locale}/company/pilots`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'services',
      label: t('services'),
      path: `/${locale}/company/services`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: t('notifications'),
      path: `/${locale}/user/notifications`,
      badge: notificationCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: t('profile'),
      path: `/${locale}/company/profile`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ], [locale, notificationCount, bookingCount, t]);

  if (!isVisible) return null;

  // Don't show on CMS pages
  if (pathname.includes('/cms')) return null;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ease-out ${
                  isActive
                    ? 'text-foreground scale-105'
                    : 'text-foreground/50 hover:text-foreground/80 hover:scale-105 active:scale-95'
                }`}
                aria-label={item.label}
              >
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                )}
                
                <div className="relative">
                  <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-lg' : ''}`}>
                    {item.icon}
                  </div>
                  
                  {/* Pulsing dot for notifications */}
                  {item.id === 'notifications' && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                  
                  {/* Badge with count for bookings */}
                  {item.id !== 'notifications' && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-lg animate-bounce">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                
                <span className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* Logout button for mobile */}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = `/${locale}`;
            }}
            className="relative flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ease-out text-red-500 hover:text-red-600 hover:scale-105 active:scale-95"
            aria-label={t('logout')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-medium">{t('logout')}</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar Navigation - Ultra Modern Glass */}
      <nav className="hidden md:flex fixed right-0 top-[56px] bottom-0 w-16 hover:w-60 backdrop-blur-xl bg-background/60 supports-[backdrop-filter]:bg-background/50 border-l border-foreground/20 z-40 transition-all duration-500 ease-out overflow-hidden group/sidebar shadow-sm">
        {/* Ambient gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-600/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col items-center w-full h-full py-6 px-2">
          {/* Company Profile Logo with enhanced effects */}
          <div className="mb-4 flex flex-col items-center group/avatar">
            <div className="relative mb-3">
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover/avatar:opacity-20 blur-xl transition-all duration-500" />
              
              {companyProfile?.logo_url ? (
                <img
                  src={companyProfile.logo_url}
                  alt="Company Logo"
                  className="relative w-10 h-10 rounded-2xl object-cover shadow-2xl border border-white/10 ring-2 ring-transparent group-hover/avatar:ring-blue-500/30 transition-all duration-300"
                />
              ) : (
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-2xl ring-2 ring-transparent group-hover/avatar:ring-blue-500/30 transition-all duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Company info - shown on hover */}
            <div className="opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible transition-all duration-300 text-center px-2">
              <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                {companyProfile?.name || t('company')}
              </p>
              <p className="text-[10px] text-foreground/60 truncate max-w-[200px]">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Navigation Items with enhanced modern styling */}
          <div className="flex-1 flex flex-col gap-0.5 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`relative flex items-center gap-4 px-2 py-1.5 rounded-2xl transition-all duration-300 group/item ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-purple-600/15 text-foreground shadow-lg shadow-blue-500/10'
                      : 'text-foreground/50 hover:text-foreground hover:bg-white/5 hover:shadow-md'
                  }`}
                  aria-label={item.label}
                >
                  {/* Modern active indicator - animated bar */}
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 via-blue-500 to-purple-600 rounded-r-full shadow-lg shadow-blue-500/50" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-600/5 animate-pulse" />
                    </>
                  )}
                  
                  {/* Icon container with modern effects - centered */}
                  <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center mx-auto group-hover/sidebar:mx-0">
                    <div className={`transition-all duration-300 ${
                      isActive 
                        ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                        : 'group-hover/item:scale-105'
                    }`}>
                      {item.icon}
                    </div>
                    
                    {/* Pulsing dot for notifications */}
                    {item.id === 'notifications' && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 ring-2 ring-background"></span>
                      </span>
                    )}
                    
                    {/* Enhanced badge with animation for bookings */}
                    {item.id !== 'notifications' && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold text-white bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-full shadow-lg shadow-red-500/50 ring-2 ring-background animate-bounce">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/0 group-hover/item:bg-blue-500/10 blur-xl transition-all duration-500" />
                  </div>
                  
                  {/* Label with smooth reveal */}
                  <span className={`whitespace-nowrap overflow-hidden text-sm font-medium transition-all duration-500 ${
                    isActive ? 'font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' : ''
                  } opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto group-hover/sidebar:delay-100`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Logout button */}
          <div className="mt-auto pt-4 border-t border-white/5">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = `/${locale}`;
              }}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer group/logout"
            >
              {/* Logout icon - centered when collapsed */}
              <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center mx-auto group-hover/sidebar:mx-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              
              {/* Logout label - shown on hover */}
              <span className="whitespace-nowrap overflow-hidden text-sm font-medium transition-all duration-500 opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto group-hover/sidebar:delay-100">
                {t('logout')}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for desktop content */}
      <div className="hidden md:block w-16 flex-shrink-0" />
    </>
  );
}
