'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface HeroImageUploadProps {
  label: string;
  imageUrl: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  compact?: boolean;
}

export default function HeroImageUpload({
  label,
  imageUrl,
  onUpload,
  onRemove,
  compact = false
}: HeroImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('მხოლოდ JPEG, PNG, WebP ან GIF ფორმატი');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('სურათი არ უნდა აღემატებოდეს 5MB-ს');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `slides/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('შეცდომა სურათის ატვირთვისას');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/hero-images/');
      if (urlParts.length === 2) {
        const supabase = createClient();
        await supabase.storage.from('hero-images').remove([urlParts[1]]);
      }
    } catch (err) {
      console.error('Error removing image:', err);
    }

    onRemove();
  };

  return (
    <div className="space-y-1.5">
      <label className={`block font-medium text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
        {label} *
      </label>

      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-foreground/10">
          <div className={`relative bg-foreground/5 ${compact ? 'h-24' : 'h-40'}`}>
            <Image
              src={imageUrl}
              alt={label}
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleRemove}
              className={`bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ${compact ? 'p-1.5' : 'p-2'}`}
            >
              <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            compact ? 'h-24' : 'h-40'
          } ${
            isUploading
              ? 'border-primary bg-primary/5'
              : 'border-foreground/20 hover:border-foreground/40 bg-foreground/5'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className={`border-4 border-primary border-t-transparent rounded-full animate-spin ${compact ? 'w-5 h-5 mb-1' : 'w-8 h-8 mb-2'}`} />
              <span className={`text-foreground/60 ${compact ? 'text-xs' : 'text-sm'}`}>ატვირთვა...</span>
            </div>
          ) : (
            <>
              <svg className={`text-foreground/30 ${compact ? 'w-6 h-6 mb-1' : 'w-10 h-10 mb-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`text-foreground/60 ${compact ? 'text-xs' : 'text-sm'}`}>
                {compact ? 'ატვირთვა' : 'დააკლიკეთ ატვირთვისთვის'}
              </span>
              {!compact && <span className="text-xs text-foreground/40 mt-1">JPEG, PNG, WebP, GIF (max 5MB)</span>}
            </>
          )}
        </div>
      )}

      {error && (
        <p className={`text-red-500 ${compact ? 'text-xs' : 'text-sm'}`}>{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
