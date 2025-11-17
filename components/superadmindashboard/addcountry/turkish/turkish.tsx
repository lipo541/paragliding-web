"use client";

import RichTextEditor from "@/components/shared/RichTextEditor";
import { useCountry } from "../CountryContext";

export default function TurkishForm() {
  const { 
    selectedCountryId, 
    languageContent, 
    updateLanguageContent,
    pendingImages,
    setPendingImages,
    imagePreviews,
    sharedImages,
    setSharedImages
  } = useCountry();

  const trContent = languageContent.tr;

  if (!selectedCountryId) {
    return (
      <div className="text-center py-20 text-foreground/40">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg">გთხოვთ აირჩიოთ ქვეყანა ზემოთ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
        <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <span>🇹🇷</span>
          <span>თურქული ფორმა - შეავსეთ თურქულად</span>
        </p>
      </div>

      {imagePreviews.heroPreview && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            სურათები ატვირთულია ქართულ ფორმაში. ამ ფორმაში მხოლოდ ALT ტექსტები დაწერეთ თურქულად.
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

      {imagePreviews.heroPreview && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <span className="text-orange-600 dark:text-orange-400">*</span> მთავარი სურათის ALT ტექსტი (თურქულად)
          </label>
          <div className="space-y-3">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-foreground/20">
              <img src={imagePreviews.heroPreview} alt="Hero" className="w-full h-full object-cover" />
            </div>
            <input
              type="text"
              value={pendingImages.heroImage?.alt_tr || sharedImages.hero_image?.alt_tr || ""}
              onChange={(e) => {
                if (pendingImages.heroImage) {
                  setPendingImages({
                    ...pendingImages,
                    heroImage: { ...pendingImages.heroImage, alt_tr: e.target.value }
                  });
                }
                if (sharedImages.hero_image) {
                  setSharedImages({
                    ...sharedImages,
                    hero_image: { ...sharedImages.hero_image, alt_tr: e.target.value }
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
              placeholder="Örnek: Gudauri dağları üzerinde yamaç paraşütü"
            />
            <p className="text-xs text-foreground/60">⚠️ თურქულად დაწერეთ ALT აღწერა ამ სურათისთვის</p>
          </div>
        </div>
      )}

      {imagePreviews.galleryPreviews.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <span className="text-orange-600 dark:text-orange-400">*</span> გალერეის სურათების ALT ტექსტები (თურქულად)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {imagePreviews.galleryPreviews.map((img, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden border border-foreground/20">
                  <img src={img.preview} alt={img.alt} className="w-full h-full object-cover" />
                </div>
                <input
                  type="text"
                  value={pendingImages.galleryImages[index]?.alt_tr || sharedImages.gallery[index]?.alt_tr || ""}
                  onChange={(e) => {
                    if (pendingImages.galleryImages[index]) {
                      const updatedGallery = [...pendingImages.galleryImages];
                      updatedGallery[index] = { ...updatedGallery[index], alt_tr: e.target.value };
                      setPendingImages({ ...pendingImages, galleryImages: updatedGallery });
                    }
                    if (sharedImages.gallery[index]) {
                      const updatedGallery = [...sharedImages.gallery];
                      updatedGallery[index] = { ...updatedGallery[index], alt_tr: e.target.value };
                      setSharedImages({ ...sharedImages, gallery: updatedGallery });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-foreground/20 rounded bg-background text-foreground"
                  placeholder="Türkçe ALT metni"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${trContent.h1_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H1 Tag
        </label>
        <input
          type="text"
          value={trContent.h1_tag || ""}
          onChange={(e) => updateLanguageContent('tr', { h1_tag: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="Örnek: Gürcistan'da Yamaç Paraşütü"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${trContent.p_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> P Tag (აღწერა)
        </label>
        <textarea
          value={trContent.p_tag || ""}
          onChange={(e) => {
            updateLanguageContent('tr', { p_tag: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '80px' }}
          placeholder="Örnek: Gürcistan'ın en güzel dağlık bölgesinde benzersiz bir uçuş deneyimi keşfedin..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${trContent.h2_history?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H2 Tag (ისტორია)
        </label>
        <input
          type="text"
          value={trContent.h2_history || ""}
          onChange={(e) => updateLanguageContent('tr', { h2_history: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="Örnek: Gürcistan Tarihi"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${trContent.history_text?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> ისტორიის ტექსტი
        </label>
        <RichTextEditor
          value={trContent.history_text || ""}
          onChange={(value) => updateLanguageContent('tr', { history_text: value })}
          placeholder="Örnek: Gürcistan dünyanın en eski ülkelerinden biridir..."
          minHeight="200px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${trContent.gallery_description?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> გალერეის აღწერა
        </label>
        <textarea
          value={trContent.gallery_description || ""}
          onChange={(e) => {
            updateLanguageContent('tr', { gallery_description: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '60px' }}
          placeholder="Örnek: Farklı açılardan fotoğraflar ve panoramik görünümler..."
        />
      </div>
    </div>
  );
}
