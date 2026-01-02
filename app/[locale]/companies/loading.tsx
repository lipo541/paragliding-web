import { Building2 } from 'lucide-react';

export default function CompaniesLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2]/20 via-transparent to-[#4697D2]/10 dark:from-[#4697D2]/10 dark:to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-4">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4697D2]/10 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 animate-pulse">
              <Building2 className="w-4 h-4 text-[#4697D2] dark:text-white" />
              <div className="h-4 w-20 bg-[#4697D2]/20 rounded" />
            </div>
            <div className="h-12 w-96 max-w-full mx-auto bg-[#4697D2]/10 rounded-lg animate-pulse" />
            <div className="h-6 w-[500px] max-w-full mx-auto bg-[#4697D2]/10 rounded animate-pulse" />
          </div>

          {/* Search Skeleton */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="h-12 bg-white/50 dark:bg-black/30 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-[#4697D2]/10 dark:bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-[#4697D2]/20 rounded w-3/4" />
                <div className="h-4 bg-[#4697D2]/10 rounded w-full" />
                <div className="h-4 bg-[#4697D2]/10 rounded w-2/3" />
                <div className="flex justify-between pt-2 border-t border-[#4697D2]/10">
                  <div className="h-3 bg-[#4697D2]/10 rounded w-24" />
                  <div className="h-3 bg-[#4697D2]/10 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
