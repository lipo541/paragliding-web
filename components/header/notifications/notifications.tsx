'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';

export default function Notifications() {
  const { itemCount } = useCart();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { client, session } = useSupabase();
  const params = useParams();
  const locale = (params?.locale as string) || 'ka';

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

  // Show cart for all logged-in users (USER, PILOT, COMPANY, SUPER_ADMIN)
  // Don't show if not logged in (userRole is null)
  if (userRole === null) return null;

  return (
    <Link
      href={`/${locale}/cart`}
      className="relative p-1.5 md:p-2 hover:bg-[#4697D2]/10 dark:hover:bg-white/10 rounded-md transition-colors"
      aria-label="Shopping Cart"
    >
      <svg
        className="w-5 h-5 md:w-6 md:h-6 text-[#1a1a1a] dark:text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] md:min-w-[16px] md:h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full px-0.5 md:px-1">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
