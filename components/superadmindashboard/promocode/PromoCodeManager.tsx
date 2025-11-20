'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tag, Plus, Edit2, Trash2, Check, X, Calendar, Users, TrendingUp } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  description: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export default function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (err: any) {
      console.error('Error fetching promo codes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountPercentage(10);
    setDescription('');
    setIsActive(true);
    setUsageLimit(null);
    setValidFrom('');
    setValidUntil('');
    setEditingId(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const promoData = {
        code: code.trim().toUpperCase(),
        discount_percentage: discountPercentage,
        description: description.trim(),
        is_active: isActive,
        usage_limit: usageLimit,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
      };

      if (editingId) {
        // Update existing promo code
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingId);

        if (error) throw error;
        setSuccess('პრომო კოდი წარმატებით განახლდა');
      } else {
        // Create new promo code
        const { error } = await supabase
          .from('promo_codes')
          .insert([promoData]);

        if (error) throw error;
        setSuccess('პრომო კოდი წარმატებით შეიქმნა');
      }

      await fetchPromoCodes();
      setTimeout(resetForm, 1500);
    } catch (err: any) {
      console.error('Error saving promo code:', err);
      setError(err.message || 'დაფიქსირდა შეცდომა');
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setCode(promo.code);
    setDiscountPercentage(promo.discount_percentage);
    setDescription(promo.description || '');
    setIsActive(promo.is_active);
    setUsageLimit(promo.usage_limit);
    setValidFrom(promo.valid_from ? promo.valid_from.split('T')[0] : '');
    setValidUntil(promo.valid_until ? promo.valid_until.split('T')[0] : '');
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ პრომო კოდის წაშლა?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('პრომო კოდი წარმატებით წაიშალა');
      await fetchPromoCodes();
    } catch (err: any) {
      console.error('Error deleting promo code:', err);
      setError(err.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchPromoCodes();
    } catch (err: any) {
      console.error('Error toggling promo code:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">პრომო კოდები</h2>
            <p className="text-sm text-foreground/60">შექმენით და მართეთ ფასდაკლების კოდები</p>
          </div>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-4 h-4" />
            ახალი პრომო კოდი
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingId ? 'პრომო კოდის რედაქტირება' : 'ახალი პრომო კოდი'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Code & Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  კოდი <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  required
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white font-mono uppercase"
                  placeholder="მაგ: SUMMER2024"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">მხოლოდ დიდი ასოები და ციფრები</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ფასდაკლება (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    required
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">%</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                აღწერა
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white resize-none"
                placeholder="პრომო კოდის აღწერა..."
              />
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                გამოყენების ლიმიტი
              </label>
              <input
                type="number"
                value={usageLimit || ''}
                onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white"
                placeholder="დატოვეთ ცარიელი შეუზღუდავი გამოყენებისთვის"
              />
            </div>

            {/* Valid Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  მოქმედების დასაწყისი
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  მოქმედების დასასრული
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black/20 rounded-xl">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                აქტიური (გამოჩნდება ჯავშნის გვერდზე)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                {editingId ? 'განახლება' : 'შექმნა'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium"
              >
                გაუქმება
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Promo Codes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promoCodes.map((promo) => (
          <div
            key={promo.id}
            className={`relative bg-white dark:bg-zinc-900 rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
              promo.is_active
                ? 'border-purple-200 dark:border-purple-900/50'
                : 'border-gray-200 dark:border-white/10 opacity-60'
            }`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <button
                onClick={() => toggleActive(promo.id, promo.is_active)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  promo.is_active
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {promo.is_active ? 'აქტიური' : 'არააქტიური'}
              </button>
            </div>

            <div className="p-5">
              {/* Code */}
              <div className="mb-4">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-mono font-bold text-lg">
                  {promo.code}
                </div>
              </div>

              {/* Discount */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {promo.discount_percentage}%
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">ფასდაკლება</span>
                </div>
              </div>

              {/* Description */}
              {promo.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {promo.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                {promo.usage_limit && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{promo.usage_count} / {promo.usage_limit}</span>
                  </div>
                )}
                {promo.valid_until && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(promo.valid_until).toLocaleDateString('ka-GE')}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => handleEdit(promo)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  რედაქტირება
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {promoCodes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">პრომო კოდები არ არის</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">შექმენით პირველი პრომო კოდი</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              შექმნა
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
