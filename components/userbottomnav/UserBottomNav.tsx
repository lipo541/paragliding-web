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

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

export default function UserBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const supabase = createClient();

  // Extract locale from pathname
  const locale = useMemo(() => pathname.split('/')[1] || 'ka', [pathname]);

  // Get active tab
  const activeTab = useMemo(() => {
    if (pathname.includes('/user/profile')) return 'profile';
    if (pathname.includes('/user/notifications')) return 'notifications';
    if (pathname.includes('/user/bookings')) return 'bookings';
    return '';
  }, [pathname]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.role === 'USER') {
          setIsVisible(true);
          setUserProfile({
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          });
          // Fetch unread message count
          fetchUnreadCount(user.id);
        }
      }
    };

    const fetchUnreadCount = async (userId: string) => {
      const { data, error } = await supabase
        .from('message_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error && data !== null) {
        setNotificationCount(data.length || 0);
      }
    };

    checkUser();

    // Real-time subscription for profile updates
    const profileChannel = supabase
      .channel('user-profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        async (payload: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new.id === user.id) {
            setUserProfile({
              full_name: payload.new.full_name,
              avatar_url: payload.new.avatar_url,
            });
          }
        }
      )
      .subscribe();

    // Real-time subscription for new messages
    const messagesChannel = supabase
      .channel('user-messages-badge')
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        checkUser();
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [supabase]);

  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'profile',
      label: 'პროფილი',
      path: `/${locale}/user/profile`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'შეტყობინებები',
      path: `/${locale}/user/notifications`,
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
      path: `/${locale}/user/bookings`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ], [locale, notificationCount]);

  if (!isVisible) return null;

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
                  
                  {item.badge !== undefined && item.badge > 0 && (
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
            aria-label="გასვლა"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-medium">გასვლა</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar Navigation - Ultra Modern Glass */}
      <nav className="hidden md:flex fixed right-0 top-[56px] bottom-0 w-16 hover:w-60 backdrop-blur-xl bg-background/60 supports-[backdrop-filter]:bg-background/50 border-l border-foreground/20 z-40 transition-all duration-500 ease-out overflow-hidden group/sidebar shadow-sm">
        {/* Ambient gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-600/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col items-center w-full h-full py-6 px-2">
          {/* User Profile Avatar with enhanced effects */}
          <div className="mb-4 flex flex-col items-center group/avatar">
            <div className="relative mb-3">
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover/avatar:opacity-20 blur-xl transition-all duration-500" />
              
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Profile"
                  className="relative w-10 h-10 rounded-2xl object-cover shadow-2xl border border-white/10 ring-2 ring-transparent group-hover/avatar:ring-blue-500/30 transition-all duration-300"
                />
              ) : (
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-2xl ring-2 ring-transparent group-hover/avatar:ring-blue-500/30 transition-all duration-300">
                  <span className="text-lg font-bold text-white drop-shadow-lg">
                    {userProfile?.full_name?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'P'}
                  </span>
                </div>
              )}
            </div>
            
            {/* User info - shown on hover */}
            <div className="opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible transition-all duration-300 text-center px-2">
              <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                {userProfile?.full_name || 'User'}
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
                    
                    {/* Enhanced badge with animation */}
                    {item.badge !== undefined && item.badge > 0 && (
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
                გასვლა
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
