'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Image as ImageIcon, Video, Upload, Trash2, GripVertical, 
  Plus, X, Eye, Link as LinkIcon 
} from 'lucide-react';
import Image from 'next/image';
import Spinner from '@/components/ui/Spinner';
import type { ServiceGalleryImage } from '@/lib/types/services';

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

const languages: { code: Language; label: string }[] = [
  { code: 'ka', label: 'KA' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'de', label: 'DE' },
  { code: 'tr', label: 'TR' },
  { code: 'ar', label: 'AR' },
];

interface ServiceMediaTabProps {
  galleryImages: ServiceGalleryImage[];
  videoUrls: string[];
  onGalleryChange: (images: ServiceGalleryImage[]) => void;
  onVideosChange: (urls: string[]) => void;
}

export default function ServiceMediaTab({
  galleryImages,
  videoUrls,
  onGalleryChange,
  onVideosChange,
}: ServiceMediaTabProps) {
  const [uploading, setUploading] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [activeAltLang, setActiveAltLang] = useState<Language>('ka');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  // Upload image to storage
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: ServiceGalleryImage[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `services/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(filePath);

        newImages.push({
          url: publicUrl,
          alt_ka: '',
          alt_en: '',
          alt_ru: '',
          alt_ar: '',
          alt_de: '',
          alt_tr: '',
          order: galleryImages.length + newImages.length,
        });
      }

      onGalleryChange([...galleryImages, ...newImages]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('შეცდომა სურათის ატვირთვისას');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete image
  const handleDeleteImage = async (index: number) => {
    const image = galleryImages[index];
    
    // Try to delete from storage
    try {
      const urlParts = image.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `services/${fileName}`;
      
      await supabase.storage
        .from('service-images')
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }

    const newImages = galleryImages.filter((_, i) => i !== index);
    // Update order
    newImages.forEach((img, i) => {
      img.order = i;
    });
    onGalleryChange(newImages);
  };

  // Update image alt text
  const updateImageAlt = (index: number, lang: Language, value: string) => {
    const newImages = [...galleryImages];
    newImages[index] = {
      ...newImages[index],
      [`alt_${lang}`]: value,
    };
    onGalleryChange(newImages);
  };

  // Add video URL
  const addVideoUrl = () => {
    if (!newVideoUrl.trim()) return;
    
    // Validate YouTube/Vimeo URL
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    
    if (!youtubeRegex.test(newVideoUrl) && !vimeoRegex.test(newVideoUrl)) {
      alert('გთხოვთ შეიყვანოთ სწორი YouTube ან Vimeo ლინკი');
      return;
    }

    onVideosChange([...videoUrls, newVideoUrl.trim()]);
    setNewVideoUrl('');
  };

  // Delete video URL
  const deleteVideoUrl = (index: number) => {
    onVideosChange(videoUrls.filter((_, i) => i !== index));
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Gallery Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-foreground/60" />
            <h3 className="font-medium">გალერეა</h3>
            <span className="text-sm text-foreground/50">({galleryImages.length} სურათი)</span>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            ატვირთვა
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative group bg-foreground/5 rounded-lg overflow-hidden"
            >
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.alt_ka || ''}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setEditingImageIndex(index)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="ALT ტექსტის რედაქტირება"
                >
                  <Eye className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors"
                  title="წაშლა"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Order badge */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Add more placeholder */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-foreground/20 rounded-lg flex flex-col items-center justify-center gap-2 text-foreground/40 hover:text-foreground/60 hover:border-foreground/40 transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm">დამატება</span>
          </button>
        </div>

        {/* Image ALT Edit Modal */}
        {editingImageIndex !== null && galleryImages[editingImageIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">ALT ტექსტის რედაქტირება</h4>
                <button
                  onClick={() => setEditingImageIndex(null)}
                  className="p-1 hover:bg-foreground/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                <Image
                  src={galleryImages[editingImageIndex].url}
                  alt=""
                  fill
                  className="object-contain bg-foreground/5"
                />
              </div>

              <div className="flex gap-2 mb-4">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setActiveAltLang(lang.code)}
                    className={`px-3 py-1 rounded text-sm ${
                      activeAltLang === lang.code
                        ? 'bg-blue-500 text-white'
                        : 'bg-foreground/10 text-foreground/70'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={(galleryImages[editingImageIndex][`alt_${activeAltLang}` as keyof ServiceGalleryImage] as string) || ''}
                onChange={(e) => updateImageAlt(editingImageIndex, activeAltLang, e.target.value)}
                placeholder={`ALT ტექსტი (${activeAltLang.toUpperCase()})`}
                className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-sm"
                dir={activeAltLang === 'ar' ? 'rtl' : 'ltr'}
              />

              <button
                onClick={() => setEditingImageIndex(null)}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                დახურვა
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-5 h-5 text-foreground/60" />
          <h3 className="font-medium">ვიდეოები</h3>
          <span className="text-sm text-foreground/50">({videoUrls.length} ვიდეო)</span>
        </div>

        {/* Add Video Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVideoUrl()}
              placeholder="YouTube ან Vimeo ლინკი..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={addVideoUrl}
            disabled={!newVideoUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoUrls.map((url, index) => {
            const thumbnail = getYouTubeThumbnail(url);
            return (
              <div
                key={index}
                className="relative group bg-foreground/5 rounded-lg overflow-hidden"
              >
                <div className="aspect-video relative">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={`Video ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-foreground/10">
                      <Video className="w-8 h-8 text-foreground/30" />
                    </div>
                  )}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={() => deleteVideoUrl(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                
                {/* URL preview */}
                <div className="p-2 text-xs text-foreground/50 truncate">
                  {url}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
