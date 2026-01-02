'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface Company {
  id: string;
  name_ka?: string;
  name_en?: string;
  logo_url?: string;
  slug_ka?: string;
  slug_en?: string;
  cached_rating?: number;
}

interface CompanyLogosMarqueeProps {
  companies: Company[];
  locale: string;
  title?: string;
}

export default function CompanyLogosMarquee({ 
  companies, 
  locale,
  title 
}: CompanyLogosMarqueeProps) {
  // Don't render if no companies
  if (!companies || companies.length === 0) {
    return null;
  }

  const getLocalizedField = (company: Company, field: string) => {
    const localeKey = `${field}_${locale}` as keyof Company;
    const enKey = `${field}_en` as keyof Company;
    return (company[localeKey] as string) || (company[enKey] as string) || '';
  };

  return (
    <section className="my-8">
      {/* Section Title */}
      {title && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md bg-[rgba(70,151,210,0.1)] dark:bg-black/30 border border-[#4697D2]/20 dark:border-white/10">
            <Building2 className="w-4 h-4 text-[#4697D2] dark:text-white" />
            <span className="text-sm font-semibold text-[#1a1a1a] dark:text-white">
              {title}
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-[#4697D2]/30 dark:from-white/20 to-transparent" />
        </div>
      )}

      {/* Company Logos Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {companies.map((company) => {
          const name = getLocalizedField(company, 'name');
          const slug = getLocalizedField(company, 'slug');

          return (
            <Link 
              key={company.id}
              href={`/${locale}/companies/${slug}`}
              className="group"
            >
              <div className="
                relative aspect-square
                rounded-xl overflow-hidden
                backdrop-blur-md
                bg-white/60 dark:bg-black/40
                border border-[#4697D2]/20 dark:border-white/10
                shadow-sm
                transition-all duration-300 ease-out
                group-hover:scale-105 
                group-hover:shadow-lg group-hover:shadow-[#4697D2]/10 dark:group-hover:shadow-black/30
                group-hover:border-[#4697D2]/40 dark:group-hover:border-white/20
                group-hover:bg-white/80 dark:group-hover:bg-black/50
              ">
                {company.logo_url ? (
                  <Image
                    src={company.logo_url}
                    alt={name}
                    fill
                    className="object-contain p-3 transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-[#4697D2]/30 dark:text-white/20" />
                  </div>
                )}

                {/* Company name overlay on hover */}
                <div className="
                  absolute inset-x-0 bottom-0
                  px-2 py-1.5
                  bg-gradient-to-t from-black/70 to-transparent
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-300
                ">
                  <p className="text-[10px] font-medium text-white text-center truncate">
                    {name}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
