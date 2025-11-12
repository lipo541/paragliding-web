'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Logo() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';

  return (
    <Link href={`/${locale}`} className="flex items-center hover:opacity-80 transition-opacity">
      <div className="px-2 py-1 md:px-3 md:py-1.5 border-2 border-foreground rounded-md">
        <span className="text-xs md:text-base font-bold text-foreground tracking-tight">caucasus</span>
      </div>
    </Link>
  );
}
