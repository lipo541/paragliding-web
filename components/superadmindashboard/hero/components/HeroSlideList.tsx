'use client';

import { useState } from 'react';
import { HeroSlide } from '@/lib/types/hero';
import HeroSlideCard from './HeroSlideCard';

interface HeroSlideListProps {
  slides: HeroSlide[];
  onEdit: (slide: HeroSlide) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onReorder: (slides: HeroSlide[]) => void;
}

export default function HeroSlideList({
  slides,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder
}: HeroSlideListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedSlide);
    
    setDraggedIndex(index);
    onReorder(newSlides);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-foreground/60 mb-2">
        💡 გადაათრიეთ სლაიდები თანმიმდევრობის შესაცვლელად
      </div>
      
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
        >
          <HeroSlideCard
            slide={slide}
            index={index}
            onEdit={() => onEdit(slide)}
            onDelete={() => onDelete(slide.id)}
            onToggleActive={() => onToggleActive(slide.id, slide.is_active)}
          />
        </div>
      ))}
    </div>
  );
}
