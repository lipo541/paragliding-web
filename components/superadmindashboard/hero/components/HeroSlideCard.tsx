'use client';

import Image from 'next/image';
import { HeroSlide } from '@/lib/types/hero';

interface HeroSlideCardProps {
  slide: HeroSlide;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export default function HeroSlideCard({
  slide,
  index,
  onEdit,
  onDelete,
  onToggleActive
}: HeroSlideCardProps) {
  return (
    <div className="bg-background border border-foreground/10 rounded-lg overflow-hidden hover:border-foreground/20 transition-colors">
      <div className="flex flex-col md:flex-row">
        {/* Preview Image */}
        <div className="relative w-full md:w-64 h-40 bg-foreground/5 flex-shrink-0">
          {slide.image_url_light ? (
            <Image
              src={slide.image_url_light}
              alt={slide.title_ka}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-foreground/30">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Order Badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            #{index + 1}
          </div>
          {/* Drag Handle */}
          <div className="absolute top-2 right-2 cursor-grab active:cursor-grabbing bg-black/70 text-white p-1.5 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-foreground truncate">{slide.title_ka}</h3>
              
              {/* Translations Preview */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-foreground/10 px-2 py-0.5 rounded">
                  EN: {slide.title_en?.slice(0, 30) || '-'}...
                </span>
                <span className="text-xs bg-foreground/10 px-2 py-0.5 rounded">
                  RU: {slide.title_ru?.slice(0, 30) || '-'}...
                </span>
              </div>

              {/* Description */}
              {slide.description_ka && (
                <p className="text-sm text-foreground/60 mt-2 line-clamp-2">
                  {slide.description_ka}
                </p>
              )}

              {/* Buttons Count */}
              <div className="flex items-center gap-4 mt-3 text-sm text-foreground/60">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  {slide.buttons?.length || 0} ღილაკი
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Active Toggle */}
              <button
                onClick={onToggleActive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  slide.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {slide.is_active ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    აქტიური
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    გამორთული
                  </>
                )}
              </button>

              {/* Edit */}
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                რედაქტირება
              </button>

              {/* Delete */}
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                წაშლა
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
