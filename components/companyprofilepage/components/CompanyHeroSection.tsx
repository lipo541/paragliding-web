'use client';

import Image from 'next/image';

interface CompanyHeroSectionProps {
  coverImageUrl?: string | null;
  companyName: string;
}

export default function CompanyHeroSection({ coverImageUrl, companyName }: CompanyHeroSectionProps) {
  return (
    <section className="relative -mt-20">
      {/* Cover Image - Extended to go behind header */}
      <div className="relative h-[280px] sm:h-[360px] lg:h-[440px] w-full overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={companyName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2] via-[#4697D2]/80 to-[#CAFA00]/30 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-transparent to-black/20" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
    </section>
  );
}
