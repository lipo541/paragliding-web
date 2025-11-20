'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';

export default function Notifications() {
  const [notificationCount] = useState(3);
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { client, session } = useSupabase();

  useEffect(() => {
    const user = session?.user;
    const loadRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      setUserRole(profile?.role || null);
    };
    loadRole();
  }, [client, session]);

  // Don't show notifications bell for regular users (they have it in bottom nav)
  if (userRole === 'USER') return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 md:p-2 hover:bg-foreground/5 rounded-md transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 md:w-6 md:h-6 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] md:min-w-[16px] md:h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full px-0.5 md:px-1">
            {notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-foreground/10 rounded-lg shadow-lg p-4 z-50">
          <h3 className="font-semibold mb-2 text-foreground">Notifications</h3>
          <p className="text-sm text-foreground/60">No new notifications</p>
        </div>
      )}
    </div>
  );
}
