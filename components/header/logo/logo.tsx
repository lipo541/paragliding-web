'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Logo() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';

  return (
    <Link href={`/${locale}`} className="flex items-center hover:opacity-80 transition-opacity">
      <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">caucasus</span>
    </Link>
  );
}
