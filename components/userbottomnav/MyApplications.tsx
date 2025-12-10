'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Clock, CheckCircle, XCircle, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type CompanyStatus = 'pending' | 'verified' | 'blocked' | 'hidden';

interface CompanyApplication {
  id: string;
  name: string;
  status: CompanyStatus;
  created_at: string;
  logo_url: string | null;
}

const statusConfig = {
  pending: {
    label: 'მოლოდინში',
    labelEn: 'Pending',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  verified: {
    label: 'დადასტურებული',
    labelEn: 'Verified',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  blocked: {
    label: 'დაბლოკილი',
    labelEn: 'Blocked',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  hidden: {
    label: 'დამალული',
    labelEn: 'Hidden',
    icon: EyeOff,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
  },
};

export default function MyApplications() {
  const [companyApplication, setCompanyApplication] = useState<CompanyApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const supabase = createClient();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch company application
        const { data: company } = await supabase
          .from('companies')
          .select('id, name, status, created_at, logo_url')
          .eq('user_id', user.id)
          .single();

        if (company) {
          setCompanyApplication(company);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [supabase]);

  if (loading) {
    return (
      <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-4 animate-pulse">
        <div className="h-5 bg-[#4697D2]/10 dark:bg-white/10 rounded w-1/3 mb-3"></div>
        <div className="h-16 bg-[#4697D2]/5 dark:bg-white/5 rounded"></div>
      </div>
    );
  }

  // Don't show section if no applications
  if (!companyApplication) {
    return null;
  }

  const status = statusConfig[companyApplication.status];
  const StatusIcon = status.icon;

  return (
    <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-4 animate-fadeIn">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded bg-[#4697D2]/20 dark:bg-white/10 flex-shrink-0">
          <Building2 className="w-4 h-4 text-[#4697D2] dark:text-white/70" />
        </div>
        <h2 className="text-sm font-bold text-[#1a1a1a] dark:text-white">ჩემი განაცხადები</h2>
      </div>

      {/* Company Application Card */}
      <div className={`rounded-xl border ${status.border} ${status.bg} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Company Logo or Placeholder */}
            {companyApplication.logo_url ? (
              <img
                src={companyApplication.logo_url}
                alt={companyApplication.name}
                className="w-12 h-12 rounded-lg object-cover border border-[#4697D2]/20 dark:border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#4697D2]/10 dark:bg-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#4697D2]/60 dark:text-white/40" />
              </div>
            )}
            
            <div>
              <p className="font-semibold text-[#1a1a1a] dark:text-white text-sm">{companyApplication.name}</p>
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
                გაგზავნილია: {new Date(companyApplication.created_at).toLocaleDateString('ka-GE')}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} border ${status.border}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-3 pt-3 border-t border-[#4697D2]/20 dark:border-white/10">
          {companyApplication.status === 'pending' && (
            <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
              თქვენი განაცხადი განხილვის პროცესშია. პასუხს მიიღებთ{' '}
              <Link href={`/${locale}/user/notifications`} className="text-[#4697D2] hover:underline font-medium">
                შეტყობინებების სექციაში
              </Link>.
            </p>
          )}
          {companyApplication.status === 'verified' && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
                თქვენი კომპანია დადასტურებულია!
              </p>
              <Link
                href={`/${locale}/company/dashboard`}
                className="text-xs font-medium text-[#4697D2] hover:underline"
              >
                კომპანიის პანელი →
              </Link>
            </div>
          )}
          {companyApplication.status === 'blocked' && (
            <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
              თქვენი განაცხადი დაბლოკილია. დამატებითი ინფორმაციისთვის დაგვიკავშირდით.
            </p>
          )}
          {companyApplication.status === 'hidden' && (
            <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
              თქვენი კომპანია დროებით დამალულია.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
