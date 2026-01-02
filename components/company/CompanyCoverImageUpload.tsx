'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImageIcon, X, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface CompanyCoverImageUploadProps {
  companyId: string;
  userId: string;
  coverImageUrl: string | null;
  onUpdate: (url: string | null) => void;
}

export default function CompanyCoverImageUpload({
  companyId,
  userId,
  coverImageUrl,
  onUpdate,
}: CompanyCoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('მხოლოდ სურათის ფორმატია დაშვებული');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('სურათი ძალიან დიდია (მაქს. 15MB)');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/cover/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update database
      const { error: updateError } = await supabase
        .from('companies')
        .update({ cover_image_url: publicUrl })
        .eq('id', companyId);

      if (updateError) throw updateError;

      onUpdate(publicUrl);
      toast.success('ქავერი წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Cover upload error:', error);
      toast.error('ატვირთვისას მოხდა შეცდომა');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!coverImageUrl) return;

    setRemoving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ cover_image_url: null })
        .eq('id', companyId);

      if (error) throw error;

      onUpdate(null);
      toast.success('ქავერი წაიშალა');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('წაშლისას მოხდა შეცდომა');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
          ქავერ ფოტო (Cover Image)
        </h4>
        <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
          ეს სურათი გამოჩნდება თქვენი კომპანიის პროფილის ზედა ნაწილში (რეკომენდებული: 1920x600px)
        </p>
      </div>

      {coverImageUrl ? (
        <div className="relative rounded-xl overflow-hidden group">
          {/* Preview */}
          <div className="relative w-full h-40 md:h-48">
            <Image
              src={coverImageUrl}
              alt="Cover image"
              fill
              className="object-cover"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                შეცვლა
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {removing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                წაშლა
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 md:h-48 rounded-xl border-2 border-dashed border-[#1a1a1a]/20 dark:border-white/20
            hover:border-[#4697D2]/50 transition-colors
            flex flex-col items-center justify-center gap-3
            bg-[#1a1a1a]/5 dark:bg-white/5"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#4697D2]" />
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-[#1a1a1a]/30 dark:text-white/30" />
              <div className="text-center">
                <p className="text-sm font-medium text-[#1a1a1a]/60 dark:text-white/60">
                  დააჭირეთ ქავერის ასატვირთად
                </p>
                <p className="text-xs text-[#1a1a1a]/40 dark:text-white/40 mt-1">
                  JPG, PNG • მაქს. 15MB
                </p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
