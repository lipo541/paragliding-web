"use client";

import { useState, useEffect } from "react";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { useLocation } from "../LocationContext";

interface FlightType {
  shared_id: string;
  name: string;
  description: string;
  features: string[];
}

export default function RussianForm() {
  const { 
    selectedLocationId, 
    languageContent, 
    updateLanguageContent,
    pendingImages,
    setPendingImages,
    imagePreviews,
    sharedImages,
    setSharedImages,
    sharedVideos,
    setSharedVideos,
    sharedFlightTypes
  } = useLocation();

  const ruContent = languageContent.ru;
  const [newVideoUrl, setNewVideoUrl] = useState("");
  
  // Flight Types form state (temporary only)
  const [showFlightTypeForm, setShowFlightTypeForm] = useState(false);
  const [editingFlightTypeIndex, setEditingFlightTypeIndex] = useState<number | null>(null);
  const [flightTypeName, setFlightTypeName] = useState("");
  const [flightTypeDescription, setFlightTypeDescription] = useState("");
  const [flightTypeFeatures, setFlightTypeFeatures] = useState<string[]>([]);
  const [flightTypePriceGEL, setFlightTypePriceGEL] = useState("");
  const [flightTypePriceUSD, setFlightTypePriceUSD] = useState("");
  const [flightTypePriceEUR, setFlightTypePriceEUR] = useState("");

  // Direct access to flight types from Context
  const flightTypes = ruContent.flight_types || [];

  console.log('🔴 RU Form Render - flightTypes:', flightTypes);
  console.log('🔴 RU Form Render - ruContent:', ruContent);

  if (!selectedLocationId) {
    return (
      <div className="text-center py-20 text-foreground/40">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg">გთხოვთ აირჩიოთ ლოკაცია ზემოთ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
          <span>🇷🇺</span>
          <span>რუსული ფორმა - შეავსეთ რუსულად</span>
        </p>
      </div>

      {/* Images Info */}
      {imagePreviews.heroPreview && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            სურათები ატვირთულია ქართულ ფორმაში. ამ ფორმაში მხოლოდ ALT ტექსტები დაწერეთ რუსულად.
          </p>
        </div>
      )}

      {!imagePreviews.heroPreview && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            სურათების ატვირთვა ქართულ ფორმაში უნდა მოხდეს!
          </p>
        </div>
      )}

      {/* Hero Image ALT (if uploaded in Georgian) */}
      {imagePreviews.heroPreview && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <span className="text-orange-600 dark:text-orange-400">*</span> მთავარი სურათის ALT ტექსტი (რუსულად)
          </label>
          <div className="space-y-3">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-foreground/20">
              <img src={imagePreviews.heroPreview} alt="Hero" className="w-full h-full object-cover" />
            </div>
            <input
              type="text"
              value={pendingImages.heroImage?.alt_ru || sharedImages.hero_image?.alt_ru || ""}
              onChange={(e) => {
                // Update pendingImages if exists (before save)
                if (pendingImages.heroImage) {
                  setPendingImages({
                    ...pendingImages,
                    heroImage: { ...pendingImages.heroImage, alt_ru: e.target.value }
                  });
                }
                // Also update sharedImages if exists (after save)
                if (sharedImages.hero_image) {
                  setSharedImages({
                    ...sharedImages,
                    hero_image: { ...sharedImages.hero_image, alt_ru: e.target.value }
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
              placeholder="например: Параглайдинг над горами Гудаури"
            />
            <p className="text-xs text-foreground/60">
              ⚠️ რუსულად დაწერეთ ALT აღწერა ამ სურათისთვის
            </p>
          </div>
        </div>
      )}

      {/* Gallery ALT (if uploaded in Georgian) */}
      {imagePreviews.galleryPreviews.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <span className="text-orange-600 dark:text-orange-400">*</span> გალერეის სურათების ALT ტექსტები (რუსულად)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {imagePreviews.galleryPreviews.map((img, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden border border-foreground/20">
                  <img src={img.preview} alt={img.alt} className="w-full h-full object-cover" />
                </div>
                <input
                  type="text"
                  value={pendingImages.galleryImages[index]?.alt_ru || sharedImages.gallery[index]?.alt_ru || ""}
                  onChange={(e) => {
                    // Update pendingImages if exists (before save)
                    if (pendingImages.galleryImages[index]) {
                      const updatedGallery = [...pendingImages.galleryImages];
                      updatedGallery[index] = {
                        ...updatedGallery[index],
                        alt_ru: e.target.value
                      };
                      setPendingImages({
                        ...pendingImages,
                        galleryImages: updatedGallery
                      });
                    }
                    // Also update sharedImages if exists (after save)
                    if (sharedImages.gallery[index]) {
                      const updatedGallery = [...sharedImages.gallery];
                      updatedGallery[index] = {
                        ...updatedGallery[index],
                        alt_ru: e.target.value
                      };
                      setSharedImages({
                        ...sharedImages,
                        gallery: updatedGallery
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-foreground/20 rounded bg-background text-foreground"
                  placeholder="ALT текст на русском"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Videos Section */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${sharedVideos.videoUrls.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> YouTube видео
        </label>
        
        <div className="space-y-3">
          {/* Existing Videos */}
          {sharedVideos.videoUrls.map((url, index) => {
            // Extract video ID for preview
            const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&?]+)/)?.[1] || '';
            
            return (
              <div key={index} className="flex items-center gap-3 bg-foreground/5 p-3 rounded-lg border border-foreground/20">
                {/* Video Thumbnail Preview */}
                {videoId && (
                  <div className="relative w-32 h-20 rounded overflow-hidden border border-foreground/20 flex-shrink-0">
                    <img 
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={`Видео ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* URL Display */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/60 mb-1">Видео #{index + 1}</p>
                  <p className="text-sm text-foreground break-all">{url}</p>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={() => {
                    const updated = [...sharedVideos.videoUrls];
                    updated.splice(index, 1);
                    setSharedVideos({ videoUrls: updated });
                  }}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                  title="Удалить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
          
          {/* Add New Video */}
          <div className="border-2 border-dashed border-foreground/20 rounded-lg p-4 bg-foreground/5">
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newVideoUrl.trim()) {
                    e.preventDefault();
                    if (newVideoUrl.includes('youtube.com') || newVideoUrl.includes('youtu.be')) {
                      setSharedVideos({ 
                        videoUrls: [...sharedVideos.videoUrls, newVideoUrl.trim()] 
                      });
                      setNewVideoUrl("");
                    } else {
                      alert('Пожалуйста, вставьте URL YouTube видео');
                    }
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-background text-foreground"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              />
              <button
                onClick={() => {
                  if (newVideoUrl.trim()) {
                    if (newVideoUrl.includes('youtube.com') || newVideoUrl.includes('youtu.be')) {
                      setSharedVideos({ 
                        videoUrls: [...sharedVideos.videoUrls, newVideoUrl.trim()] 
                      });
                      setNewVideoUrl("");
                    } else {
                      alert('Пожалуйста, вставьте URL YouTube видео');
                    }
                  }
                }}
                disabled={!newVideoUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить
              </button>
            </div>
            <p className="text-xs text-foreground/60 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Вставьте полный URL YouTube видео и нажмите Enter или кнопку Добавить
            </p>
          </div>
        </div>
      </div>

      {/* H1 Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${ruContent.h1_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H1 Tag
        </label>
        <input
          type="text"
          value={ruContent.h1_tag || ""}
          onChange={(e) => updateLanguageContent('ru', { h1_tag: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="например: Параглайдинг в Гудаури"
        />
      </div>

      {/* P Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${ruContent.p_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> P Tag (აღწერა)
        </label>
        <textarea
          value={ruContent.p_tag || ""}
          onChange={(e) => {
            updateLanguageContent('ru', { p_tag: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '80px' }}
          placeholder="например: Откройте для себя уникальный опыт полетов в самом красивом горном регионе Грузии..."
        />
      </div>

      {/* H2 - History */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${ruContent.h2_history?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H2 Tag (ისტორია)
        </label>
        <input
          type="text"
          value={ruContent.h2_history || ""}
          onChange={(e) => updateLanguageContent('ru', { h2_history: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="например: История Гудаури"
        />
      </div>

      {/* History Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${ruContent.history_text?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> ისტორიის ტექსტი
        </label>
        <RichTextEditor
          value={ruContent.history_text || ""}
          onChange={(value) => updateLanguageContent('ru', { history_text: value })}
          placeholder="например: Гудаури - один из старейших и самых популярных горнолыжных курортов Грузии..."
          minHeight="200px"
        />
      </div>

      {/* Gallery Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${ruContent.gallery_description?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> გალერეის აღწერა
        </label>
        <textarea
          value={ruContent.gallery_description || ""}
          onChange={(e) => {
            updateLanguageContent('ru', { gallery_description: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '60px' }}
          placeholder="например: Фотографии с разных ракурсов полета и панорамные виды..."
        />
      </div>

      {/* H3 Tag - Flight Types */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${ruContent.h3_flight_types?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H3 Tag (ფრენის ტიპები)
        </label>
        <input
          type="text"
          value={ruContent.h3_flight_types || ""}
          onChange={(e) => updateLanguageContent('ru', { h3_flight_types: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="например: Типы полетов в Гудаури"
        />
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Примечание:</strong> Новые типы полетов необходимо создавать в грузинской форме. Здесь можно только переводить существующие типы полетов.</span>
        </p>
      </div>

      {/* Untranslated Flight Types */}
      {sharedFlightTypes.length > 0 && (() => {
        const translatedIds = flightTypes.map(ft => ft.shared_id);
        const untranslated = sharedFlightTypes.filter(st => !translatedIds.includes(st.id));
        const kaFlightTypes = languageContent.ka.flight_types || [];
        return untranslated.length > 0 && (
          <div className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-900/10">
            <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Типы полетов, требующие перевода
            </h4>
            <div className="space-y-2">
              {untranslated.map((sharedType) => {
                const georgianVersion = kaFlightTypes.find(kt => kt.shared_id === sharedType.id);
                return (
                  <div key={sharedType.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {georgianVersion ? georgianVersion.name : sharedType.id}
                        </p>
                        {georgianVersion && georgianVersion.description && (
                          <p className="text-xs text-foreground/60 mt-0.5 line-clamp-1">{georgianVersion.description}</p>
                        )}
                        <div className="flex gap-2 mt-1.5 text-xs">
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                            {sharedType.price_gel} ₾
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            ${sharedType.price_usd}
                          </span>
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                            €{sharedType.price_eur}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          console.log('🔴 RU: Translate button clicked', sharedType.id);
                          // Clear editing index to create NEW translation
                          setEditingFlightTypeIndex(null);
                          setFlightTypePriceGEL(sharedType.price_gel.toString());
                          setFlightTypePriceUSD(sharedType.price_usd.toString());
                          setFlightTypePriceEUR(sharedType.price_eur.toString());
                          setFlightTypeName("");
                          setFlightTypeDescription("");
                          setFlightTypeFeatures([]);
                          console.log('🔴 RU: Setting showFlightTypeForm to true');
                          setShowFlightTypeForm(true);
                          (window as any).__translatingSharedId = sharedType.id;
                          console.log('🔴 RU: Should show form now');
                        }}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-1 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Перевести
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Saved Flight Types */}
      {flightTypes.length > 0 && (
        <div className="space-y-3">
          {flightTypes.map((type, index) => {
            const sharedType = sharedFlightTypes.find(s => s.id === type.shared_id);
            return (
              <div key={index} className="border border-foreground/20 rounded-lg p-4 bg-foreground/5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{type.name}</h4>
                    <p className="text-sm text-foreground/70 mt-1">{type.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingFlightTypeIndex(index);
                        setFlightTypeName(type.name);
                        setFlightTypeDescription(type.description);
                        setFlightTypeFeatures(type.features);
                        if (sharedType) {
                          setFlightTypePriceGEL(sharedType.price_gel.toString());
                          setFlightTypePriceUSD(sharedType.price_usd.toString());
                          setFlightTypePriceEUR(sharedType.price_eur.toString());
                        }
                        setShowFlightTypeForm(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const updatedFlightTypes = flightTypes.filter((_, i) => i !== index);
                        updateLanguageContent('ru', { ...ruContent, flight_types: updatedFlightTypes });
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {type.features.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {type.features.map((feature, fIndex) => (
                      <li key={fIndex} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-foreground/40 mt-0.5">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {sharedType && (
                  <div className="flex gap-3 text-sm">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      {sharedType.price_gel} ₾
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      ${sharedType.price_usd}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      €{sharedType.price_eur}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Flight Type Form */}
      {showFlightTypeForm && (
        <div className="border border-foreground/20 rounded-lg p-4 space-y-3 bg-foreground/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {editingFlightTypeIndex !== null ? 'ფრენის ტიპის რედაქტირება' : 'ახალი ფრენის ტიპი'}
            </h3>
            <button
              onClick={() => {
                setShowFlightTypeForm(false);
                setEditingFlightTypeIndex(null);
                setFlightTypeName("");
                setFlightTypeDescription("");
                setFlightTypeFeatures([]);
                setFlightTypePriceGEL("");
                setFlightTypePriceUSD("");
                setFlightTypePriceEUR("");
              }}
              className="text-foreground/60 hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                <span className="text-red-600">*</span> ფრენის ტიპი
              </label>
              <input
                type="text"
                value={flightTypeName}
                onChange={(e) => setFlightTypeName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                placeholder="например: Тандем полет"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                ფასი (₾ / $ / €) <span className="text-foreground/50 text-xs">(Set in Georgian form)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={flightTypePriceGEL}
                  disabled
                  className="flex-1 px-2 py-1.5 text-sm border border-foreground/20 rounded-lg bg-foreground/5 text-foreground/50 cursor-not-allowed"
                  placeholder="₾"
                />
                <input
                  type="number"
                  value={flightTypePriceUSD}
                  disabled
                  className="flex-1 px-2 py-1.5 text-sm border border-foreground/20 rounded-lg bg-foreground/5 text-foreground/50 cursor-not-allowed"
                  placeholder="$"
                />
                <input
                  type="number"
                  value={flightTypePriceEUR}
                  disabled
                  className="flex-1 px-2 py-1.5 text-sm border border-foreground/20 rounded-lg bg-foreground/5 text-foreground/50 cursor-not-allowed"
                  placeholder="€"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              <span className="text-red-600">*</span> მოკლე აღწერა
            </label>
            <textarea
              value={flightTypeDescription}
              onChange={(e) => {
                setFlightTypeDescription(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
              style={{ minHeight: '50px' }}
              placeholder="например: Идеально для новичков..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              მახასიათებლები
            </label>
            <div className="space-y-1.5">
              {flightTypeFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const updated = [...flightTypeFeatures];
                      updated[index] = e.target.value;
                      setFlightTypeFeatures(updated);
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-foreground/20 rounded focus:ring-1 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                    placeholder="например: Продолжительность полета: 15-20 минут"
                  />
                  <button
                    onClick={() => {
                      setFlightTypeFeatures(flightTypeFeatures.filter((_, i) => i !== index));
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => setFlightTypeFeatures([...flightTypeFeatures, ""])}
                className="w-full px-2 py-1.5 border border-dashed border-foreground/20 rounded hover:border-foreground/40 hover:bg-foreground/5 transition-colors text-xs text-foreground/60 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                დაამატე
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (flightTypeName.trim() && flightTypeDescription.trim()) {
                  if (editingFlightTypeIndex !== null) {
                    // Editing existing translation
                    const updatedFlightTypes = flightTypes.map((ft, i) => 
                      i === editingFlightTypeIndex ? {
                        shared_id: ft.shared_id,
                        name: flightTypeName,
                        description: flightTypeDescription,
                        features: flightTypeFeatures.filter(f => f.trim())
                      } : ft
                    );
                    updateLanguageContent('ru', { 
                      ...ruContent,
                      flight_types: updatedFlightTypes 
                    });
                  } else {
                    // Creating new translation from untranslated shared flight type
                    const sharedId = (window as any).__translatingSharedId;
                    if (sharedId) {
                      const newTranslation = {
                        shared_id: sharedId,
                        name: flightTypeName,
                        description: flightTypeDescription,
                        features: flightTypeFeatures.filter(f => f.trim())
                      };
                      updateLanguageContent('ru', { 
                        ...ruContent,
                        flight_types: [...flightTypes, newTranslation]
                      });
                      delete (window as any).__translatingSharedId;
                    }
                  }

                  setShowFlightTypeForm(false);
                  setEditingFlightTypeIndex(null);
                  setFlightTypeName("");
                  setFlightTypeDescription("");
                  setFlightTypeFeatures([]);
                  setFlightTypePriceGEL("");
                  setFlightTypePriceUSD("");
                  setFlightTypePriceEUR("");
                }
              }}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              {editingFlightTypeIndex !== null ? 'განახლება' : 'შენახვა'}
            </button>
            <button
              onClick={() => {
                setShowFlightTypeForm(false);
                setEditingFlightTypeIndex(null);
                setFlightTypeName("");
                setFlightTypeDescription("");
                setFlightTypeFeatures([]);
                setFlightTypePriceGEL("");
                setFlightTypePriceUSD("");
                setFlightTypePriceEUR("");
              }}
              className="px-3 py-1.5 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors text-sm font-medium"
            >
              გაუქმება
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
