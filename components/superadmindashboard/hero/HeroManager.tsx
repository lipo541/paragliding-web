'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeroSlide } from '@/lib/types/hero';
import HeroSlideList from './components/HeroSlideList';
import HeroSlideForm from './components/HeroSlideForm';

export default function HeroManager() {
  const supabase = createClient();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // სლაიდების ჩატვირთვა
  const fetchSlides = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('hero_slides')
      .select(`
        *,
        buttons:hero_slide_buttons(*)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching slides:', error);
    } else {
      setSlides(data || []);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // სლაიდის წაშლა
  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ სლაიდის წაშლა?')) return;

    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting slide:', error);
      alert('შეცდომა სლაიდის წაშლისას');
    } else {
      fetchSlides();
    }
  };

  // სლაიდის სტატუსის შეცვლა
  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('hero_slides')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      console.error('Error updating slide:', error);
    } else {
      fetchSlides();
    }
  };

  // სლაიდების გადალაგება
  const handleReorder = async (reorderedSlides: HeroSlide[]) => {
    const updates = reorderedSlides.map((slide, index) => ({
      id: slide.id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase
        .from('hero_slides')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    setSlides(reorderedSlides);
  };

  // ფორმის დახურვა და განახლება
  const handleFormClose = (refresh: boolean = false) => {
    setShowForm(false);
    setEditingSlide(null);
    if (refresh) {
      fetchSlides();
    }
  };

  // რედაქტირების გახსნა
  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hero სლაიდერი</h2>
          <p className="text-foreground/60 mt-1">მართეთ მთავარი გვერდის სლაიდერი</p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ახალი სლაიდი
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 bg-foreground/5 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">სლაიდები არ არის</h3>
          <p className="text-foreground/60 mb-4">დაამატეთ პირველი სლაიდი Hero სექციისთვის</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            დაამატე სლაიდი
          </button>
        </div>
      ) : (
        <HeroSlideList
          slides={slides}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onReorder={handleReorder}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <HeroSlideForm
          slide={editingSlide}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
