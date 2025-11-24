'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface NavigationProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

export default function Navigation({ activeMenu, setActiveMenu }: NavigationProps) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const { t } = useTranslation('navigation');

  const navItemsData = [
    {
      href: '/locations',
      label: t('menu.locations'),
      submenu: [
        { 
          href: '/locations/all', 
          label: t('submenu.locations.all'), 
          description: t('submenu.locations.allDescription')
        },
        { 
          href: '/locations/popular', 
          label: t('submenu.locations.popular'), 
          description: t('submenu.locations.popularDescription')
        },
        { 
          href: '/locations/beginner', 
          label: t('submenu.locations.beginner'), 
          description: t('submenu.locations.beginnerDescription')
        },
        { 
          href: '/locations/advanced', 
          label: t('submenu.locations.advanced'), 
          description: t('submenu.locations.advancedDescription')
        },
      ],
    },
    {
      href: '/bookings',
      label: t('menu.bookings'),
      submenu: undefined,
    },
    {
      href: '/promotions',
      label: t('menu.promotions'),
      submenu: undefined,
    },
    {
      href: '/about',
      label: t('menu.about'),
      submenu: undefined,
    },
    {
      href: '/contact',
      label: t('menu.contact'),
      submenu: undefined,
    },
  ];

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
