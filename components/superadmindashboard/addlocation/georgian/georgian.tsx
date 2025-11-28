"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { useLocation } from "../LocationContext";

interface PendingImages {
  heroImage: { file: File; alt: string } | null;
  galleryImages: { file: File; alt: string }[];
}

interface FlightType {
  shared_id: string;
  name: string;
  description: string;
  features: string[];
}

interface FlightTypeFormData {
  name: string;
  description: string;
  features: string[];
  priceGEL: string;
  priceUSD: string;
  priceEUR: string;
}

// Helper function to generate unique ID from name
const generateFlightTypeId = (name: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/-+/g, '-')       // Replace multiple - with single -
    .trim();
  return `${slug}-${timestamp}-${randomStr}`;
};

export default function GeorgianForm() {
  const { 
    selectedLocationId, 
    languageContent, 
    updateLanguageContent, 
    pendingImages,
    setPendingImages,
    imagePreviews,
    setImagePreviews,
    sharedVideos,
    setSharedVideos,
    sharedFlightTypes,
    setSharedFlightTypes,
    getSelectedLocation,
    deleteHeroImage,
    deleteGalleryImage
  } = useLocation();

  const kaContent = languageContent.ka;
  const [newVideoUrl, setNewVideoUrl] = useState("");
  
  // Flight Types local state
  const [flightTypes, setFlightTypes] = useState<FlightType[]>([]);
  const [showFlightTypeForm, setShowFlightTypeForm] = useState(false);
  const [editingFlightTypeIndex, setEditingFlightTypeIndex] = useState<number | null>(null);
  const [flightTypeName, setFlightTypeName] = useState("");
  const [flightTypeDescription, setFlightTypeDescription] = useState("");
  const [flightTypeFeatures, setFlightTypeFeatures] = useState<string[]>([]);
  const [flightTypePriceGEL, setFlightTypePriceGEL] = useState("");
  const [flightTypePriceUSD, setFlightTypePriceUSD] = useState("");
  const [flightTypePriceEUR, setFlightTypePriceEUR] = useState("");

  const supabase = createClient();

  // Load flight types from Context on mount
  useEffect(() => {
    if (kaContent.flight_types && kaContent.flight_types.length > 0) {
      setFlightTypes(kaContent.flight_types);
    }
  }, [selectedLocationId]);

  // Update Context when flight types change
  useEffect(() => {
    updateLanguageContent('ka', { flight_types: flightTypes });
  }, [flightTypes]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
          <span>🇬🇪</span>
          <span>ქართული ფორმა - შეავსეთ ყველა ველი</span>
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${pendingImages.heroImage ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> სურათი
        </label>
        
        {imagePreviews.heroPreview ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-foreground/20 flex-shrink-0">
                <img src={imagePreviews.heroPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <label className="cursor-pointer">
                <div className="border border-foreground/20 rounded-lg px-3 py-1.5 hover:bg-foreground/5 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs text-foreground">შეცვალე</span>
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
                          alt_ka: pendingImages.heroImage?.alt_ka || "",
                          alt_en: pendingImages.heroImage?.alt_en || "",
                          alt_ru: pendingImages.heroImage?.alt_ru || "",
                          alt_ar: pendingImages.heroImage?.alt_ar || "",
                          alt_de: pendingImages.heroImage?.alt_de || "",
                          alt_tr: pendingImages.heroImage?.alt_tr || ""
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
              <button
                onClick={() => deleteHeroImage()}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              <input
                type="text"
                value={pendingImages.heroImage?.alt_ka || ""}
                onChange={(e) => setPendingImages({
                  ...pendingImages,
                  heroImage: pendingImages.heroImage ? { ...pendingImages.heroImage, alt_ka: e.target.value } : null
                })}
                className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                placeholder="ALT ტექსტი (სურათის აღწერა)"
              />
            </div>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-foreground/20 rounded-lg p-4 hover:border-foreground/40 transition-colors bg-foreground/5">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-foreground/60">აირჩიე სურათი</span>
              </div>
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
                      alt_ka: pendingImages.heroImage?.alt_ka || "",
                      alt_en: pendingImages.heroImage?.alt_en || "",
                      alt_ru: pendingImages.heroImage?.alt_ru || "",
                      alt_ar: pendingImages.heroImage?.alt_ar || "",
                      alt_de: pendingImages.heroImage?.alt_de || "",
                      alt_tr: pendingImages.heroImage?.alt_tr || ""
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
          <span className={`${kaContent.h1_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> H1 Tag
        </label>
        <input
          type="text"
          value={kaContent.h1_tag || ""}
          onChange={(e) => updateLanguageContent('ka', { h1_tag: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="მაგ: პარაპლანერიზმი გუდაურში"
        />
      </div>

      {/* P Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.p_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> P Tag (აღწერა)
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
          placeholder="მაგ: აღმოაჩინე უნიკალური ფრენის გამოცდილება საქართველოს ულამაზეს მთიან რეგიონში..."
        />
      </div>

      {/* H2 - History */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.h2_history?.trim() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> H2 Tag (ისტორია)
        </label>
        <input
          type="text"
          value={kaContent.h2_history || ""}
          onChange={(e) => updateLanguageContent('ka', { h2_history: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="მაგ: გუდაურის ისტორია"
        />
      </div>

      {/* History Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.history_text?.trim() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> ისტორიის ტექსტი
        </label>
        <RichTextEditor
          value={kaContent.history_text || ""}
          onChange={(value) => updateLanguageContent('ka', { history_text: value })}
          placeholder="მაგ: გუდაური არის საქართველოს ერთ-ერთი უძველესი და ყველაზე პოპულარული სათხილამურო კურორტი..."
          minHeight="200px"
        />
      </div>

      {/* Gallery Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.gallery_description?.trim() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> გალერეის აღწერა
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
          placeholder="მაგ: ფოტოები ფრენის სხვადასხვა კუთხიდან და პანორამული ხედები..."
        />
      </div>

      {/* Gallery */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${imagePreviews.galleryPreviews.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> გალერეა
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {imagePreviews.galleryPreviews.map((img, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-foreground/20">
                <img src={img.preview} alt={img.alt} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => deleteGalleryImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <input
                type="text"
                value={img.alt}
                onChange={(e) => {
                  const updatedPreviews = [...imagePreviews.galleryPreviews];
                  updatedPreviews[index].alt = e.target.value;
                  setImagePreviews({ ...imagePreviews, galleryPreviews: updatedPreviews });
                  
                  const updatedPending = [...pendingImages.galleryImages];
                  updatedPending[index].alt_ka = e.target.value;
                  setPendingImages({ ...pendingImages, galleryImages: updatedPending });
                }}
                className="mt-2 w-full px-2 py-1 text-xs border border-foreground/20 rounded bg-background text-foreground"
                placeholder="ALT ტექსტი"
              />
            </div>
          ))}

          <label className="aspect-square border-2 border-dashed border-foreground/20 rounded-lg hover:border-foreground/40 transition-colors cursor-pointer flex items-center justify-center bg-foreground/5">
            <div className="text-center">
              <svg className="w-8 h-8 text-foreground/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-foreground/60 mt-1 block">დაამატე</span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                
                // Read all files as data URLs
                const previewPromises = files.map(file => {
                  return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                  });
                });
                
                const newPreviews = await Promise.all(previewPromises);
                
                // Update previews
                setImagePreviews({
                  ...imagePreviews,
                  galleryPreviews: [
                    ...imagePreviews.galleryPreviews,
                    ...newPreviews.map(preview => ({ preview, alt: "" }))
                  ]
                });
                
                // Update pending images
                setPendingImages({
                  ...pendingImages,
                  galleryImages: [
                    ...pendingImages.galleryImages, 
                    ...files.map(f => ({ 
                      file: f, 
                      alt_ka: "",
                      alt_en: "",
                      alt_ru: "",
                      alt_ar: "",
                      alt_de: "",
                      alt_tr: ""
                    }))
                  ]
                });
                e.target.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* H3 Tag - Flight Types */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${kaContent.h3_flight_types?.trim() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> H3 Tag (ფრენის ტიპები)
        </label>
        <input
          type="text"
          value={kaContent.h3_flight_types || ""}
          onChange={(e) => updateLanguageContent('ka', { h3_flight_types: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="მაგ: ფრენის ტიპები გუდაურში"
        />
      </div>

      {/* Create Flight Type Button */}
      {!showFlightTypeForm && (
        <div>
          <button
            onClick={() => setShowFlightTypeForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            შექმენი ფრენის ტიპი
          </button>
        </div>
      )}

      {/* Saved Flight Types */}
      {flightTypes.length > 0 && (
        <div className="space-y-3">
          {flightTypes.map((type, index) => {
            // Find corresponding shared flight type for prices
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
                      // Load prices from shared flight type
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
                      const sharedIdToDelete = type.shared_id;
                      
                      // Remove from Georgian flight types
                      setFlightTypes(flightTypes.filter((_, i) => i !== index));
                      
                      // Remove from shared flight types
                      setSharedFlightTypes(sharedFlightTypes.filter(s => s.id !== sharedIdToDelete));
                      
                      // Remove translations from all other languages
                      (['en', 'ru', 'ar', 'de', 'tr'] as const).forEach(lang => {
                        const currentLangContent = languageContent[lang];
                        if (currentLangContent?.flight_types) {
                          updateLanguageContent(lang, {
                            ...currentLangContent,
                            flight_types: currentLangContent.flight_types.filter(
                              (ft: any) => ft.shared_id !== sharedIdToDelete
                            )
                          });
                        }
                      });
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
        <div className="border border-foreground/20 rounded-lg p-4 space-y-4 bg-foreground/5">
          <div className="flex items-center justify-between mb-2">
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

          {/* Flight Type Name */}
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
                placeholder="მაგ: ტანდემ ფრენა"
              />
            </div>

            {/* Price - Compact Row */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                <span className="text-red-600">*</span> ფასი (₾ / $ / €)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={flightTypePriceGEL}
                  onChange={(e) => setFlightTypePriceGEL(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                  placeholder="₾"
                />
                <input
                  type="number"
                  value={flightTypePriceUSD}
                  onChange={(e) => setFlightTypePriceUSD(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                  placeholder="$"
                />
                <input
                  type="number"
                  value={flightTypePriceEUR}
                  onChange={(e) => setFlightTypePriceEUR(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
                  placeholder="€"
                />
              </div>
            </div>
          </div>

          {/* Flight Type Description */}
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
              className="w-full px-3 py-1.5 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
              style={{ minHeight: '50px' }}
              placeholder="მაგ: იდეალური დამწყებთათვის..."
            />
          </div>

          {/* Features */}
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
                    placeholder="მაგ: ფრენის ხანგრძლივობა: 15-20 წუთი"
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

          {/* Save Button */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (flightTypeName.trim() && flightTypeDescription.trim() && flightTypePriceGEL && flightTypePriceUSD && flightTypePriceEUR) {
                  
                  let sharedId: string;
                  
                  if (editingFlightTypeIndex !== null) {
                    // Editing existing - keep the same shared_id
                    sharedId = flightTypes[editingFlightTypeIndex].shared_id;
                    
                    // Update shared flight type prices
                    const updatedShared = sharedFlightTypes.map(s => 
                      s.id === sharedId 
                        ? {
                            ...s,
                            price_gel: parseFloat(flightTypePriceGEL),
                            price_usd: parseFloat(flightTypePriceUSD),
                            price_eur: parseFloat(flightTypePriceEUR)
                          }
                        : s
                    );
                    setSharedFlightTypes(updatedShared);
                    
                    // Update language-specific content
                    const updated = [...flightTypes];
                    updated[editingFlightTypeIndex] = {
                      shared_id: sharedId,
                      name: flightTypeName,
                      description: flightTypeDescription,
                      features: flightTypeFeatures.filter(f => f.trim())
                    };
                    setFlightTypes(updated);
                  } else {
                    // Creating new - generate new ID
                    sharedId = generateFlightTypeId(flightTypeName);
                    
                    // Add to shared flight types
                    setSharedFlightTypes([
                      ...sharedFlightTypes,
                      {
                        id: sharedId,
                        price_gel: parseFloat(flightTypePriceGEL),
                        price_usd: parseFloat(flightTypePriceUSD),
                        price_eur: parseFloat(flightTypePriceEUR)
                      }
                    ]);
                    
                    // Add to language-specific flight types
                    setFlightTypes([
                      ...flightTypes,
                      {
                        shared_id: sharedId,
                        name: flightTypeName,
                        description: flightTypeDescription,
                        features: flightTypeFeatures.filter(f => f.trim())
                      }
                    ]);
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
