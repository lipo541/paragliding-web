'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Logo() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';

  return (
    <Link 
      href={`/${locale}`} 
      className="flex items-center hover:opacity-80 transition-opacity"
      aria-label="XParagliding - მთავარი გვერდი"
    >
      {/* Vercel logo - თეთრ ფონზე შავი, შავ ფონზე თეთრი */}
      <Image
        src="/vercel.svg"
        alt="XParagliding Logo"
        width={32}
        height={8}
        className="invert dark:invert-0"
        priority
      />
      <span className="sr-only">XParagliding - პარაგლაიდინგის დაჯავშნა საქართველოში</span>
    </Link>
  );
}
