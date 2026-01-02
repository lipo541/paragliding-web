'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Users, Calendar, TrendingUp, Star } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface CompanyData {
  id: string;
  name_ka: string;
  name_en?: string | null;
  logo_url: string | null;
  status: string;
}

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  totalPilots: number;
  averageRating: number;
}

export default function CompanyDashboard() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    totalPilots: 0,
    averageRating: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (companyData) {
        setCompany(companyData);
        // TODO: Fetch real stats when tables are ready
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <p className="text-[#1a1a1a]/60 dark:text-white/60">კომპანია ვერ მოიძებნა</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pr-20 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fadeIn">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name_ka}
              className="w-16 h-16 rounded-xl object-cover border-2 border-[#4697D2]/30 dark:border-white/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#4697D2] dark:bg-white flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white dark:text-[#1a1a1a]" />
            </div>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-white">{company.name_ka}</h1>
            <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">კომპანიის დეშბორდი</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">სულ ჯავშნები</p>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white mt-1">{stats.totalBookings}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#4697D2]/20 dark:bg-white/10">
                <Calendar className="w-5 h-5 text-[#4697D2] dark:text-white" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">მოლოდინში</p>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white mt-1">{stats.pendingBookings}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">პილოტები</p>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white mt-1">{stats.totalPilots}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">რეიტინგი</p>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white mt-1">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Star className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">სწრაფი მოქმედებები</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button className="p-4 rounded-xl bg-[#4697D2]/10 dark:bg-white/5 hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors text-left">
              <Users className="w-6 h-6 text-[#4697D2] dark:text-white mb-2" />
              <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">პილოტის დამატება</p>
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">მალე</p>
            </button>
            <button className="p-4 rounded-xl bg-[#4697D2]/10 dark:bg-white/5 hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors text-left">
              <Calendar className="w-6 h-6 text-[#4697D2] dark:text-white mb-2" />
              <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">ჯავშნების ნახვა</p>
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">მალე</p>
            </button>
            <button className="p-4 rounded-xl bg-[#4697D2]/10 dark:bg-white/5 hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors text-left">
              <Building2 className="w-6 h-6 text-[#4697D2] dark:text-white mb-2" />
              <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">პროფილის რედაქტირება</p>
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">მალე</p>
            </button>
            <button className="p-4 rounded-xl bg-[#4697D2]/10 dark:bg-white/5 hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors text-left">
              <Star className="w-6 h-6 text-[#4697D2] dark:text-white mb-2" />
              <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">შეფასებები</p>
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">მალე</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-[#4697D2]/20 dark:border-white/10 mb-4">
            <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
            </div>
            <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ბოლო აქტივობა</h2>
          </div>
          <div className="text-center py-8 text-[#1a1a1a]/50 dark:text-white/50">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ჯერ არანაირი აქტივობა არ არის</p>
          </div>
        </div>
      </div>
    </div>
  );
}
