"use client";

import { useState } from "react";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { useCountry } from "../CountryContext";

export default function GeorgianForm() {
  const { 
    selectedCountryId, 
    languageContent, 
    updateLanguageContent, 
    pendingImages,
    setPendingImages,
    imagePreviews,
    setImagePreviews,
    sharedImages,
    setSharedImages,
    sharedVideos,
    setSharedVideos,
    deleteHeroImage,
    deleteGalleryImage
  } = useCountry();

  const [newVideoUrl, setNewVideoUrl] = useState("");

  const kaContent = languageContent.ka;

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
      {/* Header */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
          <span>🇬🇪</span>
          <span>ქართული ფორმა - სურათები და კონტენტი</span>
        </p>
      </div>

      {/* Hero Image Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${imagePreviews.heroPreview ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>○</span> მთავარი სურათი
        </label>
        
        {imagePreviews.heroPreview ? (
          <div className="space-y-3">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-foreground/20">
              <img src={imagePreviews.heroPreview} alt="Hero" className="w-full h-full object-cover" />
              <button
                onClick={() => deleteHeroImage()}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={pendingImages.heroImage?.alt_ka || sharedImages.hero_image?.alt_ka || ""}
              onChange={(e) => {
                if (pendingImages.heroImage) {
                  setPendingImages({
                    ...pendingImages,
                    heroImage: { ...pendingImages.heroImage, alt_ka: e.target.value }
                  });
                }
                if (sharedImages.hero_image) {
                  setSharedImages({
                    ...sharedImages,
                    hero_image: { ...sharedImages.hero_image, alt_ka: e.target.value }
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
              placeholder="ALT ტექსტი (სურათის აღწერა ქართულად)"
            />
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-foreground/20 rounded-lg p-8 hover:border-foreground/40 transition-colors bg-foreground/5 text-center">
              <svg className="w-12 h-12 text-foreground/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-foreground/60">აირჩიე მთავარი სურათი</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPendingImages({
                    ...pendingImages,
                    heroImage: { 
                      file, 
                      alt_ka: "",
                      alt_en: "",
                      alt_ru: "",
                      alt_ar: "",
                      alt_de: "",
                      alt_tr: ""
                    }
                  });
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreviews({
                      ...imagePreviews,
                      heroPreview: reader.result as string
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Gallery Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${imagePreviews.galleryPreviews.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> გალერეის სურათები
        </label>
        
        <div className="space-y-3">
          {imagePreviews.galleryPreviews.map((img, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-foreground/20 flex-shrink-0">
                <img src={img.preview} alt={img.alt} className="w-full h-full object-cover" />
              </div>
              <input
                type="text"
                value={pendingImages.galleryImages[index]?.alt_ka || sharedImages.gallery[index]?.alt_ka || ""}
                onChange={(e) => {
                  if (pendingImages.galleryImages[index]) {
                    const updated = [...pendingImages.galleryImages];
                    updated[index] = { ...updated[index], alt_ka: e.target.value };
                    setPendingImages({ ...pendingImages, galleryImages: updated });
                  }
                  if (sharedImages.gallery[index]) {
                    const updatedGallery = [...sharedImages.gallery];
                    updatedGallery[index] = { ...updatedGallery[index], alt_ka: e.target.value };
                    setSharedImages({ ...sharedImages, gallery: updatedGallery });
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                placeholder="ALT ტექსტი ქართულად"
              />
              <button
                onClick={() => deleteGalleryImage(index)}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-foreground/20 rounded-lg p-4 hover:border-foreground/40 transition-colors bg-foreground/5 text-center">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-foreground/60">დაამატე სურათი გალერეაში</span>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach((file) => {
                  const newImage = {
                    file,
                    alt_ka: "",
                    alt_en: "",
                    alt_ru: "",
                    alt_ar: "",
                    alt_de: "",
                    alt_tr: ""
                  };
                  setPendingImages({
                    ...pendingImages,
                    galleryImages: [...pendingImages.galleryImages, newImage]
                  });
                  
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreviews({
                      ...imagePreviews,
                      galleryPreviews: [...imagePreviews.galleryPreviews, { preview: reader.result as string, alt: "" }]
                    });
                  };
                  reader.readAsDataURL(file);
                });
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* YouTube Videos Section */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${sharedVideos.videoUrls.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> YouTube ვიდეოები
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
                      alt={`Video ${index + 1}`}
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
                  <p className="text-xs text-foreground/60 mb-1">ვიდეო #{index + 1}</p>
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
                  title="წაშლა"
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
                      alert('გთხოვთ ჩასვათ YouTube ვიდეოს ბმული');
                    }
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-background text-foreground"
                placeholder="https://www.youtube.com/watch?v=... ან https://youtu.be/..."
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
                      alert('გთხოვთ ჩასვათ YouTube ვიდეოს ბმული');
                    }
                  }
                }}
                disabled={!newVideoUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                დამატება
              </button>
            </div>
            <p className="text-xs text-foreground/60 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              ჩასვით YouTube ვიდეოს სრული ბმული და დააჭირეთ Enter-ს ან დამატების ღილაკს
            </p>
          </div>
        </div>
      </div>

      {/* H1 Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.h1_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H1 Tag
        </label>
        <input
          type="text"
          value={kaContent.h1_tag || ""}
          onChange={(e) => updateLanguageContent('ka', { h1_tag: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="მაგ: პარაპლანერიზმი საქართველოში"
        />
      </div>

      {/* P Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.p_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> P Tag (აღწერა)
        </label>
        <textarea
          value={kaContent.p_tag || ""}
          onChange={(e) => {
            updateLanguageContent('ka', { p_tag: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '80px' }}
          placeholder="მაგ: საქართველო - პარაპლანერიზმის სამოთხე..."
        />
      </div>

      {/* H2 - History */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.h2_history?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H2 Tag (ისტორია)
        </label>
        <input
          type="text"
          value={kaContent.h2_history || ""}
          onChange={(e) => updateLanguageContent('ka', { h2_history: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="მაგ: საქართველოს ისტორია"
        />
      </div>

      {/* History Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.history_text?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> ისტორიის ტექსტი
        </label>
        <RichTextEditor
          value={kaContent.history_text || ""}
          onChange={(value) => updateLanguageContent('ka', { history_text: value })}
          placeholder="მაგ: საქართველო არის უძველესი ქვეყანა..."
          minHeight="200px"
        />
      </div>

      {/* Gallery Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.gallery_description?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> გალერეის აღწერა
        </label>
        <textarea
          value={kaContent.gallery_description || ""}
          onChange={(e) => {
            updateLanguageContent('ka', { gallery_description: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '60px' }}
          placeholder="მაგ: ფოტოები საქართველოს სხვადასხვა ლოკაციიდან..."
        />
      </div>
    </div>
  );
}
