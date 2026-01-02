'use client';

import { useSuperAdminBooking } from '@/lib/context/SuperAdminBookingContext';
import { Search, X } from 'lucide-react';

export default function SuperAdminBookingFilters() {
  const { filters, setFilters, pilots, companies } = useSuperAdminBooking();

  return (
    <div className="space-y-3">
      {/* Search + Quick Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            placeholder="ძებნა სახელით, ტელეფონით..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {filters.searchTerm && (
            <button
              onClick={() => setFilters({ ...filters, searchTerm: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pilot Filter */}
        <select
          value={filters.pilotId || ''}
          onChange={(e) => setFilters({ ...filters, pilotId: e.target.value || null })}
          title="პილოტის ფილტრი"
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          <option value="">ყველა პილოტი</option>
          {pilots.map((pilot) => (
            <option key={pilot.id} value={pilot.id}>
              {pilot.first_name_ka} {pilot.last_name_ka}
            </option>
          ))}
        </select>

        {/* Company Filter */}
        <select
          value={filters.companyId || ''}
          onChange={(e) => setFilters({ ...filters, companyId: e.target.value || null })}
          title="კომპანიის ფილტრი"
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          <option value="">ყველა კომპანია</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name_ka}
            </option>
          ))}
        </select>

        {/* Payment Status Filter */}
        <select
          value={filters.paymentStatus}
          onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value as typeof filters.paymentStatus })}
          title="გადახდის სტატუსი"
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          <option value="all">ყველა გადახდა</option>
          <option value="pending_deposit">დეპოზიტი მოლოდინში</option>
          <option value="deposit_paid">დეპოზიტი გადახდილი</option>
          <option value="fully_paid">სრულად გადახდილი</option>
          <option value="refunded">დაბრუნებული</option>
        </select>

        {/* Reset Filters */}
        {(filters.searchTerm || filters.pilotId || filters.companyId || filters.paymentStatus !== 'all' || filters.status !== 'all') && (
          <button
            onClick={() => setFilters({
              status: 'all',
              paymentStatus: 'all',
              source: 'all',
              pilotId: null,
              companyId: null,
              dateFrom: null,
              dateTo: null,
              searchTerm: '',
              priority: 'all'
            })}
            title="ფილტრების გასუფთავება"
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            გასუფთავება
          </button>
        )}
      </div>
    </div>
  );
}
