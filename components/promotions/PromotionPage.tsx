'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PromoCard from '@/components/promotions/PromoCard';
import { Search, Tag, TrendingUp, Filter, ChevronDown, X } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'discount' | 'expiring'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Fetch data
  useEffect(() => {
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

    fetchData();
  }, [supabase]);

  // Helper functions
  const getLocationName = (location: Location) => {
    if (locale === 'en') return location.name_en || location.name_ka;
    if (locale === 'ru') return location.name_ru || location.name_ka;
    return location.name_ka;
  };

  // Filtering & Sorting
  const filteredPromos = promoCodes.filter((promo) => {
    const matchesSearch =
      promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description_ka?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description_ru?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      selectedLocation === 'all' ||
      promo.promo_code_locations.length === 0 ||
      promo.promo_code_locations.some((pl) => pl.location_id === selectedLocation);

    const now = new Date();
    const isValid =
      (!promo.valid_from || new Date(promo.valid_from) <= now) &&
      (!promo.valid_until || new Date(promo.valid_until) >= now);

    const hasUsageLeft =
      promo.usage_limit === null || promo.usage_count < promo.usage_limit;

    return matchesSearch && matchesLocation && isValid && hasUsageLeft;
  });

  const sortedPromos = [...filteredPromos].sort((a, b) => {
    if (sortBy === 'discount') {
      return b.discount_percentage - a.discount_percentage;
    } else if (sortBy === 'expiring') {
      if (!a.valid_until) return 1;
      if (!b.valid_until) return -1;
      return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Stats
  const stats = useMemo(() => {
    const active = sortedPromos.length;
    const avgDiscount =
      active > 0
        ? Math.round(sortedPromos.reduce((sum, p) => sum + p.discount_percentage, 0) / active)
        : 0;
    const maxDiscount = active > 0 ? Math.max(...sortedPromos.map((p) => p.discount_percentage)) : 0;

    return { active, avgDiscount, maxDiscount };
  }, [sortedPromos]);

  // Translations
  const t = {
    title: locale === 'ka' ? 'აქციები' : locale === 'en' ? 'Promotions' : 'Акции',
    search: locale === 'ka' ? 'ძებნა...' : locale === 'en' ? 'Search...' : 'Поиск...',
    allLocations: locale === 'ka' ? 'ყველა' : locale === 'en' ? 'All' : 'Все',
    sortBy: locale === 'ka' ? 'სორტირება' : locale === 'en' ? 'Sort' : 'Сортировка',
    newest: locale === 'ka' ? 'ახალი' : locale === 'en' ? 'Newest' : 'Новые',
    highestDiscount: locale === 'ka' ? 'ფასდაკლება' : locale === 'en' ? 'Discount' : 'Скидка',
    expiringSoon: locale === 'ka' ? 'იწურება' : locale === 'en' ? 'Expiring' : 'Истекает',
    noPromos: locale === 'ka' ? 'არ მოიძებნა' : locale === 'en' ? 'Not found' : 'Не найдено',
    clearFilters: locale === 'ka' ? 'გასუფთავება' : locale === 'en' ? 'Clear' : 'Очистить',
    found: locale === 'ka' ? 'ნაპოვნია' : locale === 'en' ? 'Found' : 'Найдено',
  };

  const hasActiveFilters = selectedLocation !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setSelectedLocation('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-foreground/60 animate-pulse">იტვირთება პრომოები...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="py-2 lg:py-3 border-b border-foreground/10">
        <div className="max-w-[1280px] mx-auto px-2 lg:px-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-foreground/10">
              <Tag className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-foreground" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-bold text-foreground">{t.title}</h1>
              <p className="text-[10px] text-foreground/60">{sortedPromos.length} აქტიური</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 20/80 Split Layout */}
      <div className="max-w-[1280px] mx-auto px-2 lg:px-3 py-2 lg:py-3">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
          
          {/* Left Side - Filters Panel (20%) */}
          <div className="w-full lg:w-1/5 space-y-2">
            {/* Filters Card */}
            <div className="bg-white/95 dark:bg-black/90 rounded-lg border border-white/20 p-3 shadow-lg sticky top-[50px]">
              <h2 className="text-xs lg:text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                ფილტრები
              </h2>

              <div className="space-y-2">
                {/* Search */}
                <div>
                  <label className="block text-[10px] font-medium text-foreground/80 mb-1">ძებნა</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.search}
                      className="w-full pl-7 pr-7 py-1.5 text-[10px] rounded-md bg-foreground/5 border border-foreground/10 focus:border-blue-500 focus:bg-foreground/10 outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                        <X className="w-3 h-3 text-foreground/40 hover:text-foreground/60" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-[10px] font-medium text-foreground/80 mb-1">ლოკაცია</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="w-full px-2 py-1.5 text-[10px] text-left rounded-md bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 flex items-center justify-between"
                    >
                      <span className="truncate">
                        {selectedLocation === 'all' ? t.allLocations : getLocationName(locations.find(l => l.id === selectedLocation)!)}
                      </span>
                      <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFilterOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 dark:bg-black/95 border border-foreground/10 rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedLocation('all'); setIsFilterOpen(false); }}
                          className={`w-full px-2 py-1.5 text-[10px] text-left hover:bg-foreground/10 ${
                            selectedLocation === 'all' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-foreground'
                          }`}
                        >
                          {t.allLocations}
                        </button>
                        {locations.map((location) => (
                          <button
                            key={location.id}
                            onClick={() => { setSelectedLocation(location.id); setIsFilterOpen(false); }}
                            className={`w-full px-2 py-1.5 text-[10px] text-left hover:bg-foreground/10 ${
                              selectedLocation === location.id ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-foreground'
                            }`}
                          >
                            {getLocationName(location)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-[10px] font-medium text-foreground/80 mb-1">სორტირება</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`w-full px-2 py-1.5 text-[10px] text-left rounded-md transition-all flex items-center gap-1.5 ${
                        sortBy === 'newest' 
                          ? 'bg-blue-500 text-white font-medium' 
                          : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {t.newest}
                    </button>
                    <button
                      onClick={() => setSortBy('discount')}
                      className={`w-full px-2 py-1.5 text-[10px] text-left rounded-md transition-all flex items-center gap-1.5 ${
                        sortBy === 'discount' 
                          ? 'bg-blue-500 text-white font-medium' 
                          : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {t.highestDiscount}
                    </button>
                    <button
                      onClick={() => setSortBy('expiring')}
                      className={`w-full px-2 py-1.5 text-[10px] text-left rounded-md transition-all flex items-center gap-1.5 ${
                        sortBy === 'expiring' 
                          ? 'bg-blue-500 text-white font-medium' 
                          : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      {t.expiringSoon}
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-2 py-1.5 text-[10px] rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3 h-3" />
                    {t.clearFilters}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Promo Cards Grid (80%) */}
          <div className="w-full lg:w-4/5">
            {sortedPromos.length === 0 ? (
              <div className="text-center py-8 bg-white/95 dark:bg-black/90 rounded-lg border border-white/20">
                <Tag className="w-8 h-8 mx-auto mb-2 text-foreground/30" />
                <p className="text-xs text-foreground/60 font-medium">{t.noPromos}</p>
                <button onClick={clearFilters} className="mt-3 px-4 py-1.5 text-[10px] rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors font-medium">
                  {t.clearFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {sortedPromos.map((promo: PromoCode) => (
                  <PromoCard key={promo.id} promo={promo} locale={locale} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
