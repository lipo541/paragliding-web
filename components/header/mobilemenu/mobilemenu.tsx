'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string;
  slug_de: string;
  slug_tr: string;
  country_id: string;
}

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string;
  slug_de: string;
  slug_tr: string;
}

interface CountryWithLocations extends Country {
  locations: Location[];
}

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [countriesWithLocations, setCountriesWithLocations] = useState<CountryWithLocations[]>([]);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';
  const supabase = createClient();
  const { t } = useTranslation('navigation');
  const { t: tAuth } = useTranslation('auth');

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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Fetch user role
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setUserRole(profile?.role || null);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUser();
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    async function fetchLocationsData() {
      try {
        const { data: countries } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr')
          .eq('is_active', true)
          .order('name_ka');

        const { data: locations } = await supabase
          .from('locations')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, country_id')
          .order('name_ka');

        const grouped: CountryWithLocations[] = (countries || []).map((country: any) => ({
          ...country,
          locations: (locations || []).filter((loc: any) => loc.country_id === country.id)
        }));

        setCountriesWithLocations(grouped);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    }

    fetchLocationsData();
  }, []);

  const getLocalizedName = (item: Country | Location) => {
    const name = (item as any)[`name_${locale}`];
    if (name) return name;
    // Fallback: ar/de/tr → en → ka
    if (['ar', 'de', 'tr'].includes(locale)) {
      return item.name_en || item.name_ka;
    }
    return item.name_ka || item.name_en;
  };

  const getLocalizedSlug = (item: Country | Location) => {
    const slug = (item as any)[`slug_${locale}`];
    if (slug) return slug;
    // Fallback: ar/de/tr → en → ka
    if (['ar', 'de', 'tr'].includes(locale)) {
      return item.slug_en || item.slug_ka;
    }
    return item.slug_ka || item.slug_en;
  };

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
                <div className="flex items-center">
                  {/* Left side - Link to page */}
                  <Link
                    href={item.label === t('menu.locations') ? `/${locale}/locations` : `/${locale}${item.href}`}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-3 py-3 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    {item.label}
                  </Link>
                  
                  {/* Right side - Toggle submenu (only if has submenu) */}
                  {item.submenu?.length && item.submenu.length > 0 && (
                    <button
                      onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                      className="px-3 py-3 hover:bg-foreground/5 transition-colors"
                      aria-label={`Toggle ${item.label} submenu`}
                    >
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
                  )}
                </div>

                {openSubmenu === item.label && (
                  <div className="pl-4 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Special handling for Locations menu */}
                    {item.label === t('menu.locations') ? (
                      <>
                        {countriesWithLocations.map((country) => (
                          <div key={country.id} className="border-b border-foreground/5 last:border-0">
                            <div className="flex items-center">
                              {/* Left side - Link to country page */}
                              <Link
                                href={`/${locale}/locations/${getLocalizedSlug(country)}`}
                                onClick={() => setIsOpen(false)}
                                className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-foreground/90 hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
                              >
                                <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">{getLocalizedName(country)}</span>
                                <span className="text-xs text-foreground/40">({country.locations.length})</span>
                              </Link>
                              
                              {/* Right side - Toggle locations submenu */}
                              <button
                                onClick={() => setOpenCountry(openCountry === country.id ? null : country.id)}
                                className="px-3 py-2 hover:bg-foreground/5 rounded-md transition-colors"
                                aria-label={`Toggle ${getLocalizedName(country)} locations`}
                              >
                                <svg
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    openCountry === country.id ? 'rotate-180' : ''
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
                            </div>

                            {openCountry === country.id && (
                              <div className="pl-6 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Individual locations */}
                                {country.locations.map((location) => (
                                  <Link
                                    key={location.id}
                                    href={`/${locale}/locations/${getLocalizedSlug(country)}/${getLocalizedSlug(location)}`}
                                    onClick={() => {
                                      setIsOpen(false);
                                      setOpenSubmenu(null);
                                      setOpenCountry(null);
                                    }}
                                    className="block px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <svg className="w-3 h-3 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span>{getLocalizedName(location)}</span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      // Regular submenu for other items
                      <>
                        {item.submenu?.map((subItem) => (
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
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Auth Buttons at Bottom */}
            <div className="pt-4 mt-4 border-t border-foreground/10">
              {user ? (
                <div className="space-y-2">
                  {/* Show CMS and logout only for SUPER_ADMIN */}
                  {userRole === 'SUPER_ADMIN' && (
                    <>
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
                        {tAuth('logout')}
                      </button>
                    </>
                  )}
                  {/* Regular USER - no buttons (logout in bottom nav) */}
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-2.5 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all text-center"
                  >
                    {tAuth('login')}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-center"
                  >
                    {tAuth('register')}
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
