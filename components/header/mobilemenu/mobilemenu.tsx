'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItemsData } from '../navigation/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    window.location.href = `/${locale}`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-1.5 hover:bg-foreground/5 rounded-md transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-5 h-5 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-t border-foreground/10 shadow-lg z-50 max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col p-4">
            {navItemsData.map((item) => (
              <div key={item.href} className="border-b border-foreground/10 last:border-0">
                <button
                  onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                  className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
                >
                  <span>{item.label}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSubmenu === item.label ? 'rotate-180' : ''
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
                </button>

                {openSubmenu === item.label && (
                  <div className="pl-4 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={`/${locale}${subItem.href}`}
                        onClick={() => {
                          setIsOpen(false);
                          setOpenSubmenu(null);
                        }}
                        className="block px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
                      >
                        <div className="font-medium">{subItem.label}</div>
                        <div className="text-xs text-foreground/50 mt-0.5">{subItem.description}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Auth Buttons at Bottom */}
            <div className="pt-4 mt-4 border-t border-foreground/10">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/cms`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-center"
                  >
                    CMS
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all"
                  >
                    გასვლა
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-2.5 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all text-center"
                  >
                    შესვლა
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-center"
                  >
                    რეგისტრაცია
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
