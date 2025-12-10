'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

export default function CompanyBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // TODO: Fetch company bookings when the system is ready
      // For now, just show empty state
      
      setLoading(false);
    };

    fetchBookings();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pr-20 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">ჯავშნები</h1>
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">კომპანიის ჯავშნების მართვა</p>
        </div>

        {/* Bookings List or Empty State */}
        {bookings.length === 0 ? (
          <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-12 text-center animate-fadeIn">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-[#4697D2]/30 dark:text-white/30" />
            <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-2">ჯავშნები ჯერ არ არის</h3>
            <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
              როცა მომხმარებლები დაჯავშნიან ფრენას თქვენს კომპანიაში, ისინი აქ გამოჩნდებიან
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* TODO: Render bookings */}
          </div>
        )}
      </div>
    </div>
  );
}
