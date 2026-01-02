'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImagePlus, X, GripVertical, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { GalleryImage } from '@/lib/types/pilot';

interface PilotGalleryUploadProps {
  pilotId: string;
  userId: string;
  images: GalleryImage[];
  onUpdate: (images: GalleryImage[]) => void;
  maxImages?: number;
}

export default function PilotGalleryUpload({
  pilotId,
  userId,
  images = [],
  onUpdate,
  maxImages = 12,
}: PilotGalleryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`მაქსიმუმ ${maxImages} სურათი შეგიძლიათ ატვირთოთ`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    setUploading(true);
    try {
      const newImages: GalleryImage[] = [];

      for (const file of filesToUpload) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} არ არის სურათი`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} ძალიან დიდია (მაქს. 10MB)`);
          continue;
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/gallery/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pilot-gallery')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`${file.name} ვერ აიტვირთა`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pilot-gallery')
          .getPublicUrl(fileName);

        newImages.push({
          url: publicUrl,
          caption_ka: '',
          caption_en: '',
          order: images.length + newImages.length,
        });
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        
        // Update database
        const { error: updateError } = await supabase
          .from('pilots')
          .update({ gallery_images: updatedImages })
          .eq('id', pilotId);

        if (updateError) throw updateError;

        onUpdate(updatedImages);
        toast.success(`${newImages.length} სურათი აიტვირთა`);
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      toast.error('სურათების ატვირთვისას მოხდა შეცდომა');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [images, maxImages, onUpdate, pilotId, supabase, userId]);

  const handleRemove = useCallback(async (index: number) => {
    try {
      const updatedImages = images.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from('pilots')
        .update({ gallery_images: updatedImages })
        .eq('id', pilotId);

      if (error) throw error;

      onUpdate(updatedImages);
      toast.success('სურათი წაიშალა');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('წაშლისას მოხდა შეცდომა');
    }
  }, [images, onUpdate, pilotId, supabase]);

  const handleCaptionChange = useCallback(async (index: number, lang: 'ka' | 'en', value: string) => {
    const updatedImages = [...images];
    if (lang === 'ka') {
      updatedImages[index] = { ...updatedImages[index], caption_ka: value };
    } else {
      updatedImages[index] = { ...updatedImages[index], caption_en: value };
    }
    
    // Debounced save
    const { error } = await supabase
      .from('pilots')
      .update({ gallery_images: updatedImages })
      .eq('id', pilotId);

    if (!error) {
      onUpdate(updatedImages);
    }
  }, [images, onUpdate, pilotId, supabase]);

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedImages = [...images];
    const [draggedItem] = updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(index, 0, draggedItem);
    
    // Update order numbers
    updatedImages.forEach((img, i) => {
      img.order = i;
    });

    onUpdate(updatedImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      // Save new order to database
      const { error } = await supabase
        .from('pilots')
        .update({ gallery_images: images })
        .eq('id', pilotId);

      if (error) {
        console.error('Reorder error:', error);
        toast.error('თანმიმდევრობის შენახვისას მოხდა შეცდომა');
      }
    }
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
            გალერეა ({images.length}/{maxImages})
          </h4>
          <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
            ატვირთეთ თქვენი საუკეთესო ფრენების ფოტოები
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            bg-[#4697D2]/20 hover:bg-[#4697D2]/30 text-[#4697D2] dark:text-[#4697D2]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          სურათის დამატება
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Gallery grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-xl overflow-hidden bg-[#1a1a1a]/5 dark:bg-white/5
                border-2 transition-all duration-200
                ${draggedIndex === index 
                  ? 'border-[#4697D2] opacity-50' 
                  : 'border-transparent hover:border-[#4697D2]/30'}`}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.caption_ka || image.caption_en || `გალერეა ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drag handle */}
                <div className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Order badge */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#4697D2] text-white text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Caption input */}
              <div className="p-2 space-y-1">
                <input
                  type="text"
                  placeholder="აღწერა (ქართულად)"
                  value={image.caption_ka || ''}
                  onChange={(e) => handleCaptionChange(index, 'ka', e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg bg-[#1a1a1a]/5 dark:bg-white/5 
                    border border-transparent focus:border-[#4697D2]/30 
                    text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/30 dark:placeholder:text-white/30
                    focus:outline-none transition-colors"
                />
                <input
                  type="text"
                  placeholder="Caption (English)"
                  value={image.caption_en || ''}
                  onChange={(e) => handleCaptionChange(index, 'en', e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg bg-[#1a1a1a]/5 dark:bg-white/5 
                    border border-transparent focus:border-[#4697D2]/30 
                    text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/30 dark:placeholder:text-white/30
                    focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#1a1a1a]/20 dark:border-white/20 rounded-xl p-8 text-center">
          <ImagePlus className="w-10 h-10 mx-auto mb-2 text-[#1a1a1a]/30 dark:text-white/30" />
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">
            ჯერ სურათები არ არის ატვირთული
          </p>
          <p className="text-xs text-[#1a1a1a]/30 dark:text-white/30 mt-1">
            დააჭირეთ &quot;სურათის დამატება&quot; ღილაკს
          </p>
        </div>
      )}
    </div>
  );
}
