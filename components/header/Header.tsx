'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './logo/logo';
import Navigation, { navItemsData } from './navigation/navigation';
import AuthButtons from './authbuttons/authbuttons';
import LanguageSwitch from './languageswitch/languageswitch';
import ThemeToggle from './themetoggle/themetoggle';
import Notifications from './notifications/notifications';
import MobileMenu from './mobilemenu/mobilemenu';

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';

  return (
    <header 
      className="sticky top-0 z-50 w-full bg-background border-b border-foreground/10"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="relative">
        <div className="mx-auto max-w-[1280px] px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <Navigation activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

            {/* Right side actions */}
            <div 
              className="flex items-center gap-2"
              onMouseEnter={() => setActiveMenu(null)}
            >
              <ThemeToggle />
              <LanguageSwitch />
              <Notifications />
              <div className="hidden md:block">
                <AuthButtons />
              </div>
              <MobileMenu />
            </div>
          </div>
        </div>

        {/* Dropdown Mega Menu */}
        {activeMenu && (
          <div
            className="absolute left-0 right-0 top-full bg-background border-t border-b border-foreground/10 shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200"
            onMouseEnter={() => setActiveMenu(activeMenu)}
          >
            <div className="mx-auto max-w-[1280px] px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {navItemsData
                  .find((item) => item.label === activeMenu)
                  ?.submenu.map((subItem, index) => (
                    <Link
                      key={subItem.href}
                      href={`/${locale}${subItem.href}`}
                      className="group block p-4 rounded-lg hover:bg-foreground/5 transition-all duration-200"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <h3 className="font-semibold text-foreground group-hover:text-foreground/80 mb-1 transition-colors">
                        {subItem.label}
                      </h3>
                      <p className="text-sm text-foreground/60 group-hover:text-foreground/70 transition-colors">
                        {subItem.description}
                      </p>
                    </Link>
                  ))}
              </div>

              {/* Mini Footer */}
              <div className="mt-6 pt-4 border-t border-foreground/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-foreground/40">
                    Follow us for updates
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-foreground dark:bg-background text-background dark:text-foreground border border-transparent dark:border-foreground/20 rounded-md hover:bg-foreground/90 dark:hover:bg-foreground/5 transition-all duration-200 text-xs font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-foreground dark:bg-background text-background dark:text-foreground border border-transparent dark:border-foreground/20 rounded-md hover:bg-foreground/90 dark:hover:bg-foreground/5 transition-all duration-200 text-xs font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-foreground dark:bg-background text-background dark:text-foreground border border-transparent dark:border-foreground/20 rounded-md hover:bg-foreground/90 dark:hover:bg-foreground/5 transition-all duration-200 text-xs font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>Twitter</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
