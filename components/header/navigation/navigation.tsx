'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

export const navItemsData = [
  {
    href: '/locations',
    label: 'ლოკაციები',
    submenu: [
      { href: '/locations/all', label: 'ყველა ლოკაცია', description: 'პარაგლაიდინგის ლოკაციები საქართველოში' },
      { href: '/locations/popular', label: 'პოპულარული', description: 'ყველაზე პოპულარული ადგილები' },
      { href: '/locations/beginner', label: 'დამწყებთათვის', description: 'უსაფრთხო ადგილები სწავლისთვის' },
      { href: '/locations/advanced', label: 'გამოცდილებისთვის', description: 'რთული და ექსტრემალური ადგილები' },
    ],
  },
  {
    href: '/bookings',
    label: 'ჯავშნები',
    submenu: undefined,
  },
  {
    href: '/promotions',
    label: 'პრომო-აქციები',
    submenu: undefined,
  },
  {
    href: '/about',
    label: 'ჩვენს შესახებ',
    submenu: undefined,
  },
  {
    href: '/contact',
    label: 'კონტაქტი',
    submenu: undefined,
  },
];

export default function Navigation({ activeMenu, setActiveMenu }: NavigationProps) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItemsData.map((item) => (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => item.submenu?.length ? setActiveMenu(item.label) : null}
        >
          <Link
            href={`/${locale}${item.href}`}
            className="group flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
          >
            <span>{item.label}</span>
            {item.submenu?.length && item.submenu.length > 0 && (
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${
                  activeMenu === item.label ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </Link>
        </div>
      ))}
    </nav>
  );
}
