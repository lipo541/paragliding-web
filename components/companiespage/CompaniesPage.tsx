'use client';

import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import { useCompaniesFilter, Company, Country, Location } from './hooks/useCompaniesFilter';
import { SupportedLocale } from './utils/companyHelpers';
import Breadcrumbs, { buildBreadcrumbs, type Locale } from '@/components/shared/Breadcrumbs';
import {
  CompaniesHero,
  CompaniesSearch,
  CompaniesFilters,
  CompanyCard,
  CountrySection,
  EmptyState,
  CompaniesJsonLd
} from './components';

interface CompaniesPageProps {
  initialCompanies: Company[];
  initialCountries: Country[];
  initialLocations: Location[];
  locale: SupportedLocale;
}

export default function CompaniesPage({
  initialCompanies,
  initialCountries,
  initialLocations,
  locale
}: CompaniesPageProps) {
  const { t } = useTranslation('companies');
  
  const {
    searchQuery,
    viewMode,
    selectedCountry,
    selectedLocation,
    sortBy,
    collapsedCountries,
    setSearchQuery,
    setViewMode,
    setSelectedCountry,
    setSelectedLocation,
    setSortBy,
    toggleCountryCollapse,
    filteredCompanies,
    groupedByCountry,
    hasResults,
    totalCount
  } = useCompaniesFilter({
    companies: initialCompanies,
    countries: initialCountries,
    locations: initialLocations,
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
    sortByName: t('filters.sortByName'),
    sortByDate: t('filters.sortByDate'),
    sortByRating: t('filters.sortByRating'),
    sortByPilots: t('filters.sortByPilots'),
    filterBy: t('filters.filterBy'),
    sortBy: t('filters.sortBy')
  };

  const cardTranslations = {
    verified: t('card.verified'),
    pilots: t('card.pilots'),
    reviews: t('card.reviews'),
    viewDetails: t('card.viewDetails')
  };

  const emptyTranslations = {
    noResults: t('empty.noResults'),
    noResultsDescription: t('empty.noResultsDescription'),
    noCompanies: t('empty.noCompanies'),
    noCompaniesDescription: t('empty.noCompaniesDescription'),
    clearSearch: t('empty.clearSearch')
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://paragliding.ge';

  return (
    <>
      {/* JSON-LD for SEO */}
      <CompaniesJsonLd
        companies={initialCompanies}
        countries={initialCountries}
        locale={locale}
        baseUrl={baseUrl}
      />

      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={buildBreadcrumbs(locale as Locale, ['companies'])} />
          </div>

          {/* Hero Section */}
          <CompaniesHero
            title={heroTranslations.title}
            subtitle={heroTranslations.subtitle}
            badge={heroTranslations.badge}
            totalCount={totalCount}
          />

          {/* Search */}
          <CompaniesSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchTranslations.placeholder}
            resultCount={totalCount}
            resultText={searchTranslations.resultText}
          />

          {/* Filters */}
          <CompaniesFilters
            countries={initialCountries}
            locations={initialLocations}
            selectedCountry={selectedCountry}
            selectedLocation={selectedLocation}
            onCountryChange={setSelectedCountry}
            onLocationChange={setSelectedLocation}
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
                {Array.from(groupedByCountry.entries()).map(([countryId, { country, companies }]) => (
                  <CountrySection
                    key={countryId}
                    country={country}
                    companies={companies}
                    locations={initialLocations}
                    locale={locale}
                    viewMode={viewMode}
                    isCollapsed={collapsedCountries.has(countryId)}
                    onToggle={() => toggleCountryCollapse(countryId)}
                    cardTranslations={cardTranslations}
                  />
                ))}
              </div>
            ) : (
              // Flat grid view when country is selected
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'
                  : 'flex flex-col gap-3'
              }>
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    locale={locale}
                    viewMode={viewMode}
                    allLocations={initialLocations}
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
