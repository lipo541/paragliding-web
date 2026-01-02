'use client';

import { useState } from 'react';
import { 
  Camera, Plane, Car, Backpack, GraduationCap, Hotel, Package, Tags
} from 'lucide-react';
import type { ServiceCategory, ServiceCategoryInsert, ServiceCategoryUpdate } from '@/lib/types/services';

// Georgian to Latin transliteration map
const georgianToLatin: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
  'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

const transliterateToLatin = (text: string): string => {
  return text
    .split('')
    .map(char => georgianToLatin[char] || char)
    .join('');
};

// Available icons for categories
const availableIcons = [
  { name: 'camera', icon: Camera, label: 'კამერა' },
  { name: 'plane', icon: Plane, label: 'თვითმფრინავი/დრონი' },
  { name: 'car', icon: Car, label: 'მანქანა' },
  { name: 'backpack', icon: Backpack, label: 'ზურგჩანთა' },
  { name: 'graduation-cap', icon: GraduationCap, label: 'სწავლება' },
  { name: 'hotel', icon: Hotel, label: 'სასტუმრო' },
  { name: 'package', icon: Package, label: 'პაკეტი' },
  { name: 'tags', icon: Tags, label: 'ტეგები' },
];

interface ServiceCategoryFormProps {
  category?: ServiceCategory;
  onSubmit: (data: ServiceCategoryInsert | ServiceCategoryUpdate) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function ServiceCategoryForm({ 
  category, 
  onSubmit, 
  onCancel, 
  saving = false 
}: ServiceCategoryFormProps) {
  const [formData, setFormData] = useState({
    slug: category?.slug || '',
    name_ka: category?.name_ka || '',
    name_en: category?.name_en || '',
    name_ru: category?.name_ru || '',
    name_ar: category?.name_ar || '',
    name_de: category?.name_de || '',
    name_tr: category?.name_tr || '',
    icon: category?.icon || 'package',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slug || !formData.name_ka || !formData.name_en) {
      alert('გთხოვთ შეავსოთ სავალდებულო ველები (slug, სახელი KA, სახელი EN)');
      return;
    }
    
    onSubmit(formData);
  };

  const generateSlug = () => {
    // Use English name if available, otherwise transliterate Georgian
    const sourceName = formData.name_en || transliterateToLatin(formData.name_ka);
    const slug = sourceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    setFormData(prev => ({ ...prev, slug }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="photo-video"
              required
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-3 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-lg text-xs transition-colors"
              title="გენერაცია EN სახელიდან"
            >
              Auto
            </button>
          </div>
        </div>

        {/* Name KA */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სახელი (KA) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name_ka}
            onChange={(e) => setFormData(prev => ({ ...prev, name_ka: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="ფოტო/ვიდეო"
            required
          />
        </div>

        {/* Name EN */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სახელი (EN) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name_en}
            onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Photo/Video"
            required
          />
        </div>

        {/* Name RU */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სახელი (RU)
          </label>
          <input
            type="text"
            value={formData.name_ru || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Фото/Видео"
          />
        </div>

        {/* Name DE */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სახელი (DE)
          </label>
          <input
            type="text"
            value={formData.name_de || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name_de: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Foto/Video"
          />
        </div>

        {/* Name TR */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სახელი (TR)
          </label>
          <input
            type="text"
            value={formData.name_tr || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name_tr: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Fotoğraf/Video"
          />
        </div>

        {/* Name AR */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სახელი (AR)
          </label>
          <input
            type="text"
            value={formData.name_ar || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="صور/فيديو"
            dir="rtl"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            რიგითობა
          </label>
          <input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            min="0"
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center gap-3 pt-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-foreground/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            <span className="ms-3 text-sm font-medium text-foreground/70">აქტიური</span>
          </label>
        </div>
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          აიკონი
        </label>
        <div className="flex flex-wrap gap-2">
          {availableIcons.map(({ name, icon: Icon, label }) => (
            <button
              key={name}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                formData.icon === name
                  ? 'border-purple-500 bg-purple-500/20 text-purple-600 dark:text-purple-400'
                  : 'border-border hover:bg-foreground/5'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
          disabled={saving}
        >
          გაუქმება
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'შენახვა...' : category ? 'განახლება' : 'შექმნა'}
        </button>
      </div>
    </form>
  );
}
