'use client';

import { Search, Filter, X } from 'lucide-react';
import type { ServiceCategory, ServiceStatus } from '@/lib/types/services';

interface ServiceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: ServiceStatus | 'all';
  onStatusChange: (value: ServiceStatus | 'all') => void;
  categoryFilter: string | 'all';
  onCategoryChange: (value: string | 'all') => void;
  categories: ServiceCategory[];
}

const statusOptions: { value: ServiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ყველა სტატუსი' },
  { value: 'active', label: 'აქტიური' },
  { value: 'pending', label: 'მოლოდინში' },
  { value: 'draft', label: 'დრაფტი' },
  { value: 'hidden', label: 'დამალული' },
];

export default function ServiceFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  categories,
}: ServiceFiltersProps) {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCategoryChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ძებნა სახელით ან slug-ით..."
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as ServiceStatus | 'all')}
          className="pl-10 pr-8 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[160px]"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className="relative">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="all">ყველა კატეგორია</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name_ka}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/60 hover:text-foreground border border-border rounded-lg hover:bg-foreground/5 transition-colors"
        >
          <X className="w-4 h-4" />
          გასუფთავება
        </button>
      )}
    </div>
  );
}
