'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Tags, Plus, Pencil, Trash2, Check, X, GripVertical,
  Camera, Plane, Car, Backpack, GraduationCap, Hotel, Package
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { ServiceCategoryForm } from './components';
import type { ServiceCategory, ServiceCategoryInsert, ServiceCategoryUpdate } from '@/lib/types/services';

// Icon mapping for Lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'camera': Camera,
  'plane': Plane,
  'car': Car,
  'backpack': Backpack,
  'graduation-cap': GraduationCap,
  'hotel': Hotel,
  'package': Package,
  'tags': Tags,
};

export default function ServiceCategoriesManager() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit/Create state
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: ServiceCategoryInsert) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('service_categories')
        .insert([data]);

      if (error) throw error;
      
      await fetchCategories();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('შეცდომა კატეგორიის შექმნისას');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: ServiceCategoryUpdate) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('service_categories')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      await fetchCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('შეცდომა კატეგორიის განახლებისას');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(c => c.id !== id));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('შეცდომა კატეგორიის წაშლისას');
    }
  };

  const toggleActive = async (category: ServiceCategory) => {
    await handleUpdate(category.id, { is_active: !category.is_active });
  };

  const getIcon = (iconName: string | null) => {
    const IconComponent = iconMap[iconName || 'package'] || Package;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Tags className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">სერვისის კატეგორიები</h2>
            <p className="text-sm text-foreground/60">მართეთ სერვისების კატეგორიები</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          დამატება
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-background/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">ახალი კატეგორია</h3>
          <ServiceCategoryForm
            onSubmit={(data) => handleCreate(data as ServiceCategoryInsert)}
            onCancel={() => setIsCreating(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Categories List */}
      <div className="bg-background/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-foreground/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">აიკონი</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">სახელი (KA)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">სახელი (EN)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">რიგი</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">სტატუსი</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-foreground/60 uppercase">მოქმედებები</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => {
              const IconComponent = getIcon(category.icon ?? null);
              const isEditing = editingCategory?.id === category.id;
              const isDeleting = deletingId === category.id;
              
              if (isEditing) {
                return (
                  <tr key={category.id} className="bg-foreground/5">
                    <td colSpan={7} className="p-4">
                      <ServiceCategoryForm
                        category={category}
                        onSubmit={(data) => handleUpdate(category.id, data as ServiceCategoryUpdate)}
                        onCancel={() => setEditingCategory(null)}
                        saving={saving}
                      />
                    </td>
                  </tr>
                );
              }
              
              return (
                <tr key={category.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-foreground/70" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{category.name_ka}</td>
                  <td className="px-4 py-3 text-foreground/70">{category.name_en}</td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-foreground/10 rounded text-xs">{category.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{category.sort_order}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(category)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        category.is_active
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {category.is_active ? 'აქტიური' : 'არააქტიური'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                        title="რედაქტირება"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                            title="დადასტურება"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/60 transition-colors"
                            title="გაუქმება"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(category.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/60 hover:text-red-500 transition-colors"
                          title="წაშლა"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-foreground/60">
                  კატეგორიები არ მოიძებნა
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
