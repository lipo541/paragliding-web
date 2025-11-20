'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export default function UserBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const supabase = createClient();

  // Extract locale from pathname
  const locale = useMemo(() => pathname.split('/')[1] || 'ka', [pathname]);

  // Get active tab
  const activeTab = useMemo(() => {
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/notifications')) return 'notifications';
    if (pathname.includes('/bookings')) return 'bookings';
    if (pathname.includes('/promotions')) return 'promotions';
    return '';
  }, [pathname]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.role === 'USER') {
          setIsVisible(true);
          // TODO: Implement real notification count when notification system is ready
          setNotificationCount(0);
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setIsVisible(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'profile',
      label: 'პროფილი',
      path: `/${locale}/profile`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'შეტყობინებები',
      path: `/${locale}/notifications`,
      badge: notificationCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'bookings',
      label: 'ჯავშნები',
      path: `/${locale}/bookings`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'promotions',
      label: 'აქციები',
      path: `/${locale}/promotions`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
  ], [locale, notificationCount]);

  if (!isVisible) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 z-50 shadow-lg">
      <div className="max-w-screen-xl mx-auto flex items-center justify-around px-2 py-2 sm:py-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`relative flex flex-col items-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300 ease-out ${
                isActive
                  ? 'text-foreground scale-105'
                  : 'text-foreground/50 hover:text-foreground/80 hover:scale-105 active:scale-95'
              }`}
              aria-label={item.label}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
              )}
              
              {/* Icon container with badge */}
              <div className="relative">
                <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-lg' : ''}`}>
                  {item.icon}
                </div>
                
                {/* Badge for counts */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-lg animate-bounce">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-[10px] sm:text-xs font-medium transition-all duration-300 ${
                isActive ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
              
              {/* Ripple effect on click */}
              <span className="absolute inset-0 rounded-xl overflow-hidden">
                <span className={`absolute inset-0 bg-foreground/5 rounded-xl transition-transform duration-300 ${
                  isActive ? 'scale-100' : 'scale-0'
                }`} />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
