'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Wrench, Plus, Search, Filter, ChevronDown, Clock, CheckCircle, 
  XCircle, EyeOff, FileEdit, Pencil, Trash2, Check, X, Eye
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { ServiceEditForm, ServicesList, ServiceFilters } from './components';
import type { AdditionalService, ServiceCategory, ServiceStatus } from '@/lib/types/services';

const statusConfig: Record<ServiceStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  draft: {
    label: 'დრაფტი',
    icon: FileEdit,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-500/10',
  },
  pending: {
    label: 'მოლოდინში',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  active: {
    label: 'აქტიური',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  hidden: {
    label: 'დამალული',
    icon: EyeOff,
    color: 'text-foreground/60',
    bg: 'bg-foreground/5',
  },
};

export default function ServicesManager() {
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  
  // Edit/Create state
  const [editingService, setEditingService] = useState<AdditionalService | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch services with category
      const { data: servicesData, error: servicesError } = await supabase
        .from('additional_services')
        .select('*, category:service_categories(*)')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateServiceStatus = async (serviceId: string, newStatus: ServiceStatus) => {
    setUpdatingStatus(serviceId);
    try {
      const { error } = await supabase
        .from('additional_services')
        .update({ status: newStatus })
        .eq('id', serviceId);

      if (error) throw error;
      
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('შეცდომა სტატუსის განახლებისას');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('additional_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setServices(prev => prev.filter(s => s.id !== id));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('შეცდომა სერვისის წაშლისას');
    }
  };

  const handleSave = async () => {
    await fetchData();
    setEditingService(null);
    setIsCreating(false);
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        service.name_ka?.toLowerCase().includes(searchLower) ||
        service.name_en?.toLowerCase().includes(searchLower) ||
        service.slug_ka?.toLowerCase().includes(searchLower) ||
        service.slug_en?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || service.category_id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [services, searchQuery, statusFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter(s => s.status === 'active').length,
    pending: services.filter(s => s.status === 'pending').length,
    draft: services.filter(s => s.status === 'draft').length,
  }), [services]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // Show edit form
  if (editingService || isCreating) {
    return (
      <ServiceEditForm
        service={editingService || undefined}
        categories={categories}
        onSave={handleSave}
        onCancel={() => {
          setEditingService(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">დამატებითი სერვისები</h2>
            <p className="text-sm text-foreground/60">
              სულ: {stats.total} | აქტიური: {stats.active} | მოლოდინში: {stats.pending}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          სერვისის დამატება
        </button>
      </div>

      {/* Filters */}
      <ServiceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      {/* Services List */}
      <ServicesList
        services={filteredServices}
        categories={categories}
        statusConfig={statusConfig}
        onEdit={setEditingService}
        onDelete={handleDelete}
        onStatusChange={updateServiceStatus}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        updatingStatus={updatingStatus}
      />
    </div>
  );
}
