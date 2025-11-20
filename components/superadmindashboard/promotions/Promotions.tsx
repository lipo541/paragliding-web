'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Tag, Upload, MapPin, Calendar, Percent, TrendingUp, Eye, Trash2, Edit2, Plus, X } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  is_published: boolean;
  image_path: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_ar: string | null;
  description_de: string | null;
  description_tr: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  country_id: string;
}

interface PromoLocation {
  location_id: string;
}

export default function Promotions() {
  const supabase = createClient();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    valid_from: '',
    valid_until: '',
    usage_limit: null as number | null,
    is_active: true,
    is_published: false,
    description_ka: '',
    description_en: '',
    description_ru: '',
    description_ar: '',
    description_de: '',
    description_tr: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch promo codes
      const { data: promos } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      setPromoCodes(promos || []);

      // Fetch locations
      const { data: locs } = await supabase
        .from('locations')
        .select('id, name_ka, name_en, country_id')
        .order('name_ka');

      setLocations(locs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPromoLocations = async (promoId: string) => {
    const { data } = await supabase
      .from('promo_code_locations')
      .select('location_id')
      .eq('promo_code_id', promoId);

    return data?.map((pl: PromoLocation) => pl.location_id) || [];
  };

  const handleEdit = async (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      valid_from: promo.valid_from || '',
      valid_until: promo.valid_until || '',
      usage_limit: promo.usage_limit,
      is_active: promo.is_active,
      is_published: promo.is_published,
      description_ka: promo.description_ka || '',
      description_en: promo.description_en || '',
      description_ru: promo.description_ru || '',
      description_ar: promo.description_ar || '',
      description_de: promo.description_de || '',
      description_tr: promo.description_tr || '',
    });

    // Fetch locations for this promo
    const promoLocs = await fetchPromoLocations(promo.id);
    setSelectedLocations(promoLocs);

    // Set image preview if exists
    if (promo.image_path) {
      const { data } = supabase.storage.from('Promo').getPublicUrl(promo.image_path);
      setImagePreview(data.publicUrl);
    }

    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (promoId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${promoId}/banner.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('Promo')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imagePath = editingPromo?.image_path || null;

      if (editingPromo) {
        // Update existing promo
        if (imageFile) {
          imagePath = await uploadImage(editingPromo.id, imageFile);
        }

        const { error } = await supabase
          .from('promo_codes')
          .update({
            ...formData,
            image_path: imagePath,
          })
          .eq('id', editingPromo.id);

        if (error) throw error;

        // Update locations
        await supabase
          .from('promo_code_locations')
          .delete()
          .eq('promo_code_id', editingPromo.id);

        if (selectedLocations.length > 0) {
          await supabase.from('promo_code_locations').insert(
            selectedLocations.map((locId) => ({
              promo_code_id: editingPromo.id,
              location_id: locId,
            }))
          );
        }

        alert('პრომო კოდი განახლდა!');
      } else {
        // Create new promo
        const { data: newPromo, error } = await supabase
          .from('promo_codes')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        if (imageFile && newPromo) {
          imagePath = await uploadImage(newPromo.id, imageFile);
          await supabase
            .from('promo_codes')
            .update({ image_path: imagePath })
            .eq('id', newPromo.id);
        }

        // Add locations
        if (selectedLocations.length > 0 && newPromo) {
          await supabase.from('promo_code_locations').insert(
            selectedLocations.map((locId) => ({
              promo_code_id: newPromo.id,
              location_id: locId,
            }))
          );
        }

        alert('პრომო კოდი შეიქმნა!');
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving promo code:', error);
      alert('შეცდომა!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხარ რომ გსურს წაშლა?')) return;

    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
      alert('პრომო კოდი წაიშალა!');
      fetchData();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('შეცდომა!');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      alert(currentStatus ? 'პრომო კოდი დეაქტივირდა!' : 'პრომო კოდი აქტივირდა!');
      fetchData();
    } catch (error) {
      console.error('Error toggling promo code status:', error);
      alert('შეცდომა!');
    }
  };

  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      alert(currentStatus ? 'პრომო კოდი დაიმალა საჯარო გვერდიდან!' : 'პრომო კოდი გამოქვეყნდა!');
      fetchData();
    } catch (error) {
      console.error('Error toggling promo code published status:', error);
      alert('შეცდომა!');
    }
  };

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPromo(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedLocations([]);
    setFormData({
      code: '',
      discount_percentage: 10,
      valid_from: '',
      valid_until: '',
      usage_limit: null,
      is_active: true,
      is_published: false,
      description_ka: '',
      description_en: '',
      description_ru: '',
      description_ar: '',
      description_de: '',
      description_tr: '',
    });
  };

  const filteredPromos = promoCodes.filter((promo) => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && promo.is_active) ||
      (filterStatus === 'inactive' && !promo.is_active);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter((p) => p.is_active).length,
    totalUsage: promoCodes.reduce((sum, p) => sum + p.usage_count, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">პრომო-აქციები</h2>
          <p className="text-sm text-foreground/60 mt-1">მართე პრომო კოდები და აქციები</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          ახალი პრომო კოდი
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">სულ პრომო კოდი</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">აქტიური</p>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">გამოყენებები</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="ძებნა კოდით..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="all">ყველა</option>
          <option value="active">აქტიური</option>
          <option value="inactive">არააქტიური</option>
        </select>
      </div>

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.map((promo) => {
          const imageUrl = promo.image_path
            ? supabase.storage.from('Promo').getPublicUrl(promo.image_path).data.publicUrl
            : null;

          return (
            <div
              key={promo.id}
              className="group relative rounded-lg border border-foreground/10 bg-foreground/5 overflow-hidden hover:border-foreground/20 transition-all"
            >
              {/* Image */}
              {imageUrl && (
                <div className="relative h-32 bg-foreground/10">
                  <Image
                    src={imageUrl}
                    alt={promo.code}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{promo.code}</h3>
                    <p className="text-sm text-foreground/60">{promo.discount_percentage}% ფასდაკლება</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      promo.is_active
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {promo.is_active ? 'აქტიური' : 'არააქტიური'}
                  </span>
                </div>

                {promo.description_ka && (
                  <p className="text-xs text-foreground/70 line-clamp-2">{promo.description_ka}</p>
                )}

                <div className="space-y-1 text-xs text-foreground/60">
                  {promo.valid_from && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>დან: {new Date(promo.valid_from).toLocaleDateString('ka')}</span>
                    </div>
                  )}
                  {promo.valid_until && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>მდე: {new Date(promo.valid_until).toLocaleDateString('ka')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>
                      გამოყენებები: {promo.usage_count}
                      {promo.usage_limit ? ` / ${promo.usage_limit}` : ''}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      რედაქტირება
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      წაშლა
                    </button>
                  </div>
                  <button
                    onClick={() => handleToggleActive(promo.id, promo.is_active)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      promo.is_active
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400'
                    }`}
                  >
                    {promo.is_active ? 'დეაქტივაცია' : 'აქტივაცია'}
                  </button>
                  <button
                    onClick={() => handleTogglePublished(promo.id, promo.is_published)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      promo.is_published
                        ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {promo.is_published ? '🔓 გამოქვეყნებული' : '🔒 დამალული'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPromos.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
          <p className="text-foreground/60">პრომო კოდები არ მოიძებნა</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingPromo ? 'პრომო კოდის რედაქტირება' : 'ახალი პრომო კოდი'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded hover:bg-foreground/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  სურათი
                </label>
                <div className="flex flex-col gap-3">
                  {imagePreview && (
                    <div className="relative h-40 rounded-lg overflow-hidden border border-foreground/20">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-foreground/20 rounded-lg hover:border-foreground/40 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">სურათის ატვირთვა</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  პრომო კოდი *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="SUMMER2025"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ფასდაკლება (%) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ვადა (დან)
                  </label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ვადა (მდე)
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  გამოყენების ლიმიტი (ოფციონალური)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usage_limit: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="შეუზღუდავი"
                />
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">აღწერა (ყველა ენა)</label>
                <textarea
                  value={formData.description_ka}
                  onChange={(e) => setFormData({ ...formData, description_ka: e.target.value })}
                  placeholder="🇬🇪 ქართული"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                />
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="🇬🇧 English"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                />
                <textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                  placeholder="🇷🇺 Русский"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                />
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder="🇸🇦 العربية"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                />
                <textarea
                  value={formData.description_de}
                  onChange={(e) => setFormData({ ...formData, description_de: e.target.value })}
                  placeholder="🇩🇪 Deutsch"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                />
                <textarea
                  value={formData.description_tr}
                  onChange={(e) => setFormData({ ...formData, description_tr: e.target.value })}
                  placeholder="🇹🇷 Türkçe"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                />
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ლოკაციები (თუ არ აირჩევა - მოქმედებს ყველაზე)
                </label>
                <div className="max-h-40 overflow-y-auto border border-foreground/20 rounded-lg p-3 space-y-2">
                  {locations.map((loc) => (
                    <label key={loc.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc.id)}
                        onChange={() => toggleLocationSelection(loc.id)}
                        className="w-4 h-4 rounded border-foreground/20"
                      />
                      <span className="text-sm text-foreground">{loc.name_ka}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="space-y-3 p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded border-foreground/20"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">გამოქვეყნებული</span>
                    <p className="text-xs text-foreground/60">გამოჩნდება პრომო აქციების საჯარო გვერდზე</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-foreground/20"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">აქტიური</span>
                    <p className="text-xs text-foreground/60">შესაძლებელია კოდის გამოყენება (პერსონალურ შეთავაზებებშიც)</p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 rounded-lg border border-foreground/20 hover:bg-foreground/5 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium"
                >
                  {editingPromo ? 'განახლება' : 'შექმნა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
