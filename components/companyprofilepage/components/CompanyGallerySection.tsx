'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  url: string;
  caption_ka?: string;
  caption_en?: string;
  order: number;
}

interface CompanyGallerySectionProps {
  images: GalleryImage[];
  locale: string;
  translations: {
    gallery: string;
    photos: string;
  };
}

export default function CompanyGallerySection({ images, locale, translations }: CompanyGallerySectionProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  const getCaption = (img: GalleryImage) => {
    if (locale === 'ka' && img.caption_ka) return img.caption_ka;
    if (img.caption_en) return img.caption_en;
    return img.caption_ka || '';
  };

  return (
    <>
      <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
          <ImageIcon className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
          {translations.gallery}
          <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50 text-zinc-600 dark:text-white/80">
            {sortedImages.length} {translations.photos}
          </span>
        </h2>

        {/* Masonry Grid */}
        <div className="columns-2 lg:columns-3 gap-2">
          {sortedImages.map((img, i) => (
            <div key={i} className="break-inside-avoid mb-2">
              <button
                onClick={() => setLightbox(i)}
                className="relative rounded-lg overflow-hidden border border-[#4697D2]/30 dark:border-white/10 hover:border-[#4697D2]/50 dark:hover:border-white/20 hover:shadow-md transition-all group w-full cursor-pointer"
              >
                <Image
                  src={img.url}
                  alt={getCaption(img) || ''}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all scale-0 group-hover:scale-100">
                    <ImageIcon className="w-4 h-4 text-zinc-800" />
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && sortedImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox - 1 + sortedImages.length) % sortedImages.length);
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox + 1) % sortedImages.length);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {lightbox + 1} / {sortedImages.length}
          </div>
          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={sortedImages[lightbox].url}
              alt={getCaption(sortedImages[lightbox]) || ''}
              width={1200}
              height={800}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {getCaption(sortedImages[lightbox]) && (
              <p className="absolute bottom-0 left-0 right-0 text-center text-white bg-black/50 py-2 px-4 text-sm rounded-b-lg">
                {getCaption(sortedImages[lightbox])}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
