'use client';

import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import { usePilotsFilter, Pilot, Country, Location, Company } from './hooks/usePilotsFilter';
import { SupportedLocale } from './utils/pilotHelpers';
import Breadcrumbs, { buildBreadcrumbs, type Locale } from '@/components/shared/Breadcrumbs';
import {
  PilotsHero,
  PilotsSearch,
  PilotsFilters,
  PilotCard,
  CountrySection,
  EmptyState,
  PilotsJsonLd
} from './components';

interface PilotsPageProps {
  initialPilots: Pilot[];
  initialCountries: Country[];
  initialLocations: Location[];
  initialCompanies: Company[];
  locale: SupportedLocale;
}

export default function PilotsPage({
  initialPilots,
  initialCountries,
  initialLocations,
  initialCompanies,
  locale
}: PilotsPageProps) {
  const { t } = useTranslation('pilots');
  
  const {
    searchQuery,
    viewMode,
    selectedCountry,
    selectedLocation,
    selectedCompany,
    sortBy,
    collapsedCountries,
    filteredLocations,
    setSearchQuery,
    setViewMode,
    setSelectedCountry,
    setSelectedLocation,
    setSelectedCompany,
    setSortBy,
    toggleCountryCollapse,
    filteredPilots,
    groupedByCountry,
    hasResults,
    totalCount
  } = usePilotsFilter({
    pilots: initialPilots,
    countries: initialCountries,
    locations: initialLocations,
    companies: initialCompanies,
    locale
  });

  // Translations object for child components
  const heroTranslations = {
    title: t('hero.title'),
    subtitle: t('hero.subtitle'),
    badge: t('hero.badge')
  };

  const searchTranslations = {
    placeholder: t('search.placeholder'),
    resultText: t('search.resultText')
  };

  const filterTranslations = {
    allCountries: t('filters.allCountries'),
    allLocations: t('filters.allLocations'),
    allCompanies: t('filters.allCompanies'),
    independent: t('filters.independent'),
    sortByName: t('filters.sortByName'),
    sortByExperience: t('filters.sortByExperience'),
    sortByFlights: t('filters.sortByFlights'),
    sortByRating: t('filters.sortByRating'),
    filterBy: t('filters.filterBy'),
    sortBy: t('filters.sortBy')
  };

  const cardTranslations = {
    experience: t('card.experience'),
    years: t('card.years'),
    flights: t('card.flights'),
    languages: t('card.languages'),
    viewProfile: t('card.viewProfile'),
    independent: t('card.independent')
  };

  const emptyTranslations = {
    noResults: t('empty.noResults'),
    noResultsDescription: t('empty.noResultsDescription'),
    noPilots: t('empty.noPilots'),
    noPilotsDescription: t('empty.noPilotsDescription'),
    clearSearch: t('empty.clearSearch')
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://paragliding.ge';

  return (
    <>
      {/* JSON-LD for SEO */}
      <PilotsJsonLd
        pilots={initialPilots}
        countries={initialCountries}
        baseUrl={baseUrl}
        locale={locale}
      />

      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={buildBreadcrumbs(locale as Locale, ['pilots'])} />
          </div>

          {/* Hero Section */}
          <PilotsHero
            title={heroTranslations.title}
            subtitle={heroTranslations.subtitle}
            badge={heroTranslations.badge}
            totalCount={totalCount}
          />

          {/* Search */}
          <PilotsSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchTranslations.placeholder}
            resultCount={totalCount}
            resultText={searchTranslations.resultText}
          />

          {/* Filters */}
          <PilotsFilters
            countries={initialCountries}
            locations={filteredLocations}
            companies={initialCompanies}
            selectedCountry={selectedCountry}
            selectedLocation={selectedLocation}
            selectedCompany={selectedCompany}
            onCountryChange={setSelectedCountry}
            onLocationChange={setSelectedLocation}
            onCompanyChange={setSelectedCompany}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            locale={locale}
            translations={filterTranslations}
          />

          {/* Content */}
          {hasResults ? (
            selectedCountry === 'all' ? (
              // Grouped by country view
              <div>
                {Array.from(groupedByCountry.entries()).map(([countryId, { country, pilots }]) => (
                  <CountrySection
                    key={countryId}
                    country={country}
                    pilots={pilots}
                    companies={initialCompanies}
                    locale={locale}
                    viewMode={viewMode}
                    isCollapsed={collapsedCountries.has(countryId)}
                    onToggleCollapse={() => toggleCountryCollapse(countryId)}
                    cardTranslations={cardTranslations}
                  />
                ))}
              </div>
            ) : (
              // Flat grid view when country is selected
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center'
                  : 'flex flex-col gap-3'
              }>
                {filteredPilots.map((pilot) => (
                  <PilotCard
                    key={pilot.id}
                    pilot={pilot}
                    company={initialCompanies.find(c => c.id === pilot.company_id)}
                    locale={locale}
                    viewMode={viewMode}
                    translations={cardTranslations}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyState
              hasSearchQuery={!!searchQuery}
              translations={emptyTranslations}
              onClearSearch={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>
    </>
  );
}
