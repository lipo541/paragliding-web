'use client';

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PromoCard from '@/components/promotions/PromoCard';
import { Search, SlidersHorizontal, Tag, TrendingUp, Sparkles, MapPin, Calendar, Percent, Filter, X, ChevronDown } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  image_path: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_ar: string | null;
  description_de: string | null;
  description_tr: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  promo_code_locations: Array<{
    location_id: string;
    locations: {
      id: string;
      name_ka: string;
      name_en: string;
      name_ru: string;
    };
  }>;
}

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
}

export default function PromotionPage({ locale }: { locale: string }) {
  const supabase = createClient();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'discount' | 'expiring'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: promos } = await supabase
        .from('promo_codes')
        .select(`
          *,
          promo_code_locations (
            location_id,
            locations (
              id,
              name_ka,
              name_en,
              name_ru
            )
          )
        `)
        .eq('is_active', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      const { data: locs } = await supabase
        .from('locations')
        .select('id, name_ka, name_en, name_ru')
        .order('name_ka');

      setPromoCodes(promos || []);
      setLocations(locs || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationName = (location: Location) => {
    if (locale === 'en') return location.name_en || location.name_ka;
    if (locale === 'ru') return location.name_ru || location.name_ka;
    return location.name_ka;
  };

  const filteredAndSortedPromos = useMemo(() => {
    let filtered = promoCodes.filter((promo) => {
      // Search filter
      const matchesSearch =
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description_ka?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description_ru?.toLowerCase().includes(searchTerm.toLowerCase());

      // Location filter
      const matchesLocation =
        selectedLocation === 'all' ||
        promo.promo_code_locations.length === 0 ||
        promo.promo_code_locations.some((pl) => pl.location_id === selectedLocation);

      // Validity check
      const now = new Date();
      const isValid =
        (!promo.valid_from || new Date(promo.valid_from) <= now) &&
        (!promo.valid_until || new Date(promo.valid_until) >= now);

      const hasUsageLeft =
        promo.usage_limit === null || promo.usage_count < promo.usage_limit;

      return matchesSearch && matchesLocation && isValid && hasUsageLeft;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'discount') {
        return b.discount_percentage - a.discount_percentage;
      } else if (sortBy === 'expiring') {
        if (!a.valid_until) return 1;
        if (!b.valid_until) return -1;
        return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
      } else {
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [promoCodes, searchTerm, selectedLocation, sortBy]);

  const stats = useMemo(() => {
    const active = filteredAndSortedPromos.length;
    const avgDiscount =
      active > 0
        ? Math.round(
            filteredAndSortedPromos.reduce((sum, p) => sum + p.discount_percentage, 0) / active
          )
        : 0;
    const maxDiscount = active > 0 ? Math.max(...filteredAndSortedPromos.map((p) => p.discount_percentage)) : 0;

    return { active, avgDiscount, maxDiscount };
  }, [filteredAndSortedPromos]);

  const t = {
    title: locale === 'ka' ? 'პრომო-აქციები' : locale === 'en' ? 'Promotions' : 'Акции',
    subtitle:
      locale === 'ka'
        ? 'გამოიყენე პრომო კოდები და დაზოგე შენს შემდეგ ფრენაზე'
        : locale === 'en'
        ? 'Use promo codes and save on your next flight'
        : 'Используйте промо-коды и сэкономьте на следующем полете',
    search: locale === 'ka' ? 'ძებნა პრომო კოდით...' : locale === 'en' ? 'Search promo codes...' : 'Поиск промо-кодов...',
    filters: locale === 'ka' ? 'ფილტრები' : locale === 'en' ? 'Filters' : 'Фильтры',
    allLocations: locale === 'ka' ? 'ყველა ლოკაცია' : locale === 'en' ? 'All Locations' : 'Все локации',
    sortBy: locale === 'ka' ? 'სორტირება' : locale === 'en' ? 'Sort By' : 'Сортировка',
    newest: locale === 'ka' ? 'ახალი' : locale === 'en' ? 'Newest' : 'Новые',
    highestDiscount: locale === 'ka' ? 'ყველაზე დიდი ფასდაკლება' : locale === 'en' ? 'Highest Discount' : 'Наибольшая скидка',
    expiringSoon: locale === 'ka' ? 'მალე იწურება' : locale === 'en' ? 'Expiring Soon' : 'Скоро истекает',
    activePromos: locale === 'ka' ? 'აქტიური აქციები' : locale === 'en' ? 'Active Promos' : 'Активные акции',
    avgDiscount: locale === 'ka' ? 'საშუალო ფასდაკლება' : locale === 'en' ? 'Avg. Discount' : 'Ср. скидка',
    maxDiscount: locale === 'ka' ? 'მაქს. ფასდაკლება' : locale === 'en' ? 'Max Discount' : 'Макс. скидка',
    noPromos: locale === 'ka' ? 'პრომო კოდები არ მოიძებნა' : locale === 'en' ? 'No promotions found' : 'Промо-коды не найдены',
    noPromosDesc:
      locale === 'ka'
        ? 'შეცვალე ფილტრები ან სცადე სხვა საძიებო სიტყვა'
        : locale === 'en'
        ? 'Try changing filters or search term'
        : 'Попробуйте изменить фильтры или поисковый запрос',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-foreground/60 text-sm">
            {locale === 'ka' ? 'იტვირთება...' : locale === 'en' ? 'Loading...' : 'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Compact */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-foreground/10">
              <Sparkles className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {t.title}
              </h1>
              <p className="text-sm text-foreground/60 mt-0.5">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-foreground/60">{t.activePromos}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
          </div>

          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-foreground/60">{t.avgDiscount}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgDiscount}%</p>
          </div>

          <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              <p className="text-xs text-foreground/60">{t.maxDiscount}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.maxDiscount}%</p>
          </div>
        </div>

        {/* Compact Search & Filters */}
        <div className="mb-6">
          <div className="flex gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-foreground/10 transition-all"
              />
            </div>

            {/* Filter Toggle - Compact */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                showFilters
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
                  : 'bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{t.filters}</span>
            </button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-3 p-4 rounded-xl bg-foreground/5 border border-foreground/10 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Location Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-foreground/60 mb-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {t.allLocations}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    >
                      <option value="all">{t.allLocations}</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {getLocationName(loc)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-foreground/60 mb-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {t.sortBy}
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    >
                      <option value="newest">{t.newest}</option>
                      <option value="discount">{t.highestDiscount}</option>
                      <option value="expiring">{t.expiringSoon}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Promo Cards Grid - Compact */}
        {filteredAndSortedPromos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPromos.map((promo) => (
              <PromoCard key={promo.id} promo={promo} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center p-4 bg-foreground/5 rounded-xl border border-foreground/10 mb-4">
              <Tag className="w-12 h-12 text-foreground/20" />
            </div>
            <h2 className="text-xl font-semibold text-foreground/70 mb-2">{t.noPromos}</h2>
            <p className="text-sm text-foreground/50">{t.noPromosDesc}</p>
          </div>
        )}
      </div>
    </main>
  );
}
