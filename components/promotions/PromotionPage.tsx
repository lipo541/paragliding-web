'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import PromoCard from '@/components/promotions/PromoCard';
import { Search, Tag, TrendingUp, Filter, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import Breadcrumbs, { buildBreadcrumbs, type Locale } from '@/components/shared/Breadcrumbs';
import type { PromoCode, PromoLocation } from '@/lib/data/promotions';

interface PromotionPageProps {
  locale: string;
  initialPromoCodes?: PromoCode[];
  initialLocations?: PromoLocation[];
}

export default function PromotionPage({ 
  locale, 
  initialPromoCodes = [], 
  initialLocations = [] 
}: PromotionPageProps) {
  const supabase = createClient();
  const { t } = useTranslation('promotionpage');
  // ✅ Initialize with server-fetched data for SSR
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes);
  const [locations, setLocations] = useState<PromoLocation[]>(initialLocations);
  // ✅ Not loading if we have initial data
  const [isLoading, setIsLoading] = useState(initialPromoCodes.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'discount' | 'expiring'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Helper function to get localized name
  const getLocalizedName = (item: any) => {
    const nameKey = `name_${locale}` as keyof typeof item;
    return item[nameKey] || item.name_ka || '';
  };

  // ✅ Only fetch client-side if no initial data was provided (fallback)
  useEffect(() => {
    // Skip if we already have server-provided data
    if (initialPromoCodes.length > 0) {
      return;
    }
    
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
                name_ru,
                name_ar,
                name_de,
                name_tr
              )
            )
          `)
          .eq('is_active', true)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        const { data: locs } = await supabase
          .from('locations')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr')
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
  }, [supabase, initialPromoCodes.length]);



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

  const hasActiveFilters = selectedLocation !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setSelectedLocation('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 rounded-2xl p-8 border border-[#4697D2]/30 dark:border-white/10 shadow-xl">
          <div className="w-12 h-12 border-3 border-[#4697D2]/20 border-t-[#4697D2] rounded-full animate-spin" />
          <p className="text-sm text-[#1a1a1a] dark:text-white/60 animate-pulse">{t('page.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={buildBreadcrumbs(locale as Locale, ['promotions'])} />
        </div>

        {/* Hero Section with H1 and P for SEO */}
        <section className="relative overflow-hidden rounded-xl mb-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2]/15 via-[#4697D2]/5 to-transparent dark:from-[#4697D2]/25 dark:via-[#4697D2]/10 dark:to-transparent" />
        
        {/* Glass effect */}
        <div className="absolute inset-0 backdrop-blur-md" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4697D2]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        {/* Content */}
        <div className="relative z-10 px-4 py-5 md:px-6 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1">
              {/* Title - H1 for SEO */}
              <h1 className="text-xl md:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">
                {t('hero.title')}
              </h1>
              
              {/* Subtitle - P for SEO */}
              <p className="text-sm text-[#2d2d2d]/70 dark:text-white/60 max-w-xl">
                {t('hero.subtitle')}
              </p>
            </div>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4697D2]/15 dark:bg-[#4697D2]/25 border border-[#4697D2]/20 dark:border-[#4697D2]/30 self-start md:self-center">
              <Tag className="w-3.5 h-3.5 text-[#4697D2] dark:text-white" />
              <span className="text-xs font-medium text-[#1a1a1a] dark:text-white">
                {t('page.active')}
              </span>
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-[#4697D2] text-white min-w-[20px] text-center">
                {sortedPromos.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Bottom border glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4697D2]/30 to-transparent" />
      </section>

      {/* Main Content - 20/80 Split Layout */}
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mt-4">
          
          {/* Left Side - Filters Panel (25%) */}
          <div className="w-full lg:w-1/4 space-y-3">
            {/* Filters Card */}
            <div className="backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 rounded-xl border border-[#4697D2]/30 dark:border-white/10 p-4 shadow-xl sticky top-[60px]">
              <h2 className="text-sm lg:text-base font-bold text-[#1a1a1a] dark:text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#4697D2]" />
                {t('filters.title')}
              </h2>

              <div className="space-y-3">
                {/* Search */}
                <div>
                  <label className="block text-xs font-medium text-[#1a1a1a]/80 dark:text-white/80 mb-1.5">{t('filters.search')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4697D2]/60" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('filters.searchPlaceholder')}
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-lg bg-white/80 dark:bg-black/40 backdrop-blur-sm border border-[#4697D2]/30 dark:border-white/20 focus:border-[#4697D2] focus:ring-1 focus:ring-[#4697D2]/30 outline-none transition-all text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60 dark:text-white/40 dark:hover:text-white/60" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-xs font-medium text-[#1a1a1a]/80 dark:text-white/80 mb-1.5">{t('filters.location')}</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="w-full px-3 py-2 text-xs text-left rounded-lg bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/50 text-[#1a1a1a] dark:text-white border border-[#4697D2]/30 dark:border-white/20 flex items-center justify-between transition-all"
                    >
                      <span className="truncate">
                        {selectedLocation === 'all' ? t('filters.allLocations') : getLocalizedName(locations.find(l => l.id === selectedLocation)!)}
                      </span>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform text-[#4697D2] ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFilterOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-md bg-white/95 dark:bg-black/90 border border-[#4697D2]/30 dark:border-white/20 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedLocation('all'); setIsFilterOpen(false); }}
                          className={`w-full px-3 py-2 text-xs text-left hover:bg-[#4697D2]/10 ${
                            selectedLocation === 'all' ? 'bg-[#4697D2]/20 text-[#4697D2] font-medium' : 'text-[#1a1a1a] dark:text-white'
                          }`}
                        >
                          {t('filters.allLocations')}
                        </button>
                        {locations.map((location) => (
                          <button
                            key={location.id}
                            onClick={() => { setSelectedLocation(location.id); setIsFilterOpen(false); }}
                            className={`w-full px-3 py-2 text-xs text-left hover:bg-[#4697D2]/10 ${
                              selectedLocation === location.id ? 'bg-[#4697D2]/20 text-[#4697D2] font-medium' : 'text-[#1a1a1a] dark:text-white'
                            }`}
                          >
                            {getLocalizedName(location)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs font-medium text-[#1a1a1a]/80 dark:text-white/80 mb-1.5">{t('filters.sort')}</label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`w-full px-3 py-2 text-xs text-left rounded-lg transition-all flex items-center gap-2 ${
                        sortBy === 'newest' 
                          ? 'bg-[#4697D2] text-white font-medium' 
                          : 'bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/40 text-[#1a1a1a] dark:text-white border border-[#4697D2]/20 dark:border-white/10'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      {t('filters.newest')}
                    </button>
                    <button
                      onClick={() => setSortBy('discount')}
                      className={`w-full px-3 py-2 text-xs text-left rounded-lg transition-all flex items-center gap-2 ${
                        sortBy === 'discount' 
                          ? 'bg-[#4697D2] text-white font-medium' 
                          : 'bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/40 text-[#1a1a1a] dark:text-white border border-[#4697D2]/20 dark:border-white/10'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      {t('filters.highestDiscount')}
                    </button>
                    <button
                      onClick={() => setSortBy('expiring')}
                      className={`w-full px-3 py-2 text-xs text-left rounded-lg transition-all flex items-center gap-2 ${
                        sortBy === 'expiring' 
                          ? 'bg-[#4697D2] text-white font-medium' 
                          : 'bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/40 text-[#1a1a1a] dark:text-white border border-[#4697D2]/20 dark:border-white/10'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      {t('filters.expiringSoon')}
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-red-500/20 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 font-medium transition-all flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <X className="w-4 h-4" />
                    {t('filters.clearFilters')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Promo Cards Grid (75%) */}
          <div className="w-full lg:w-3/4">
            {sortedPromos.length === 0 ? (
              <div className="text-center py-8 backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 rounded-lg border border-[#4697D2]/30 dark:border-white/10 shadow-xl">
                <Tag className="w-8 h-8 mx-auto mb-2 text-[#4697D2]/50" />
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60 font-medium">{t('empty.title')}</p>
                <button onClick={clearFilters} className="mt-3 px-4 py-1.5 text-[10px] rounded-md bg-[#4697D2] hover:bg-[#3a7bb0] text-white transition-colors font-medium">
                  {t('empty.clearButton')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 auto-rows-fr">
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