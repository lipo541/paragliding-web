"use client";

import { useState, useEffect } from "react";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { useLocation } from "../LocationContext";

interface FlightType {
  name: string;
  description: string;
  features: string[];
  priceGEL: string;
  priceUSD: string;
  priceEUR: string;
}

export default function GermanForm() {
  const { 
    selectedLocationId, 
    languageContent, 
    updateLanguageContent,
    pendingImages,
    setPendingImages,
    imagePreviews,
    sharedImages,
    setSharedImages
  } = useLocation();

  const deContent = languageContent.de;
  
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

  // Load flight types from Context on mount
  useEffect(() => {
    if (deContent.flight_types && deContent.flight_types.length > 0) {
      setFlightTypes(deContent.flight_types);
    }
  }, [selectedLocationId]);

  // Update Context when flight types change
  useEffect(() => {
    updateLanguageContent('de', { flight_types: flightTypes });
  }, [flightTypes]);

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
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
          <span>🇩🇪</span>
          <span>გერმანული ფორმა - შეავსეთ გერმანულად</span>
        </p>
      </div>

      {/* Images Info */}
      {imagePreviews.heroPreview && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            სურათები ატვირთულია ქართულ ფორმაში. ამ ფორმაში მხოლოდ ALT ტექსტები დაწერეთ გერმანულად.
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
            <span className="text-orange-600 dark:text-orange-400">*</span> მთავარი სურათის ALT ტექსტი (გერმანულად)
          </label>
          <div className="space-y-3">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-foreground/20">
              <img src={imagePreviews.heroPreview} alt="Hero" className="w-full h-full object-cover" />
            </div>
            <input
              type="text"
              value={pendingImages.heroImage?.alt_de || sharedImages.hero_image?.alt_de || ""}
              onChange={(e) => {
                // Update pendingImages if exists (before save)
                if (pendingImages.heroImage) {
                  setPendingImages({
                    ...pendingImages,
                    heroImage: { ...pendingImages.heroImage, alt_de: e.target.value }
                  });
                }
                // Also update sharedImages if exists (after save)
                if (sharedImages.hero_image) {
                  setSharedImages({
                    ...sharedImages,
                    hero_image: { ...sharedImages.hero_image, alt_de: e.target.value }
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
              placeholder="z.B: Gleitschirmfliegen über Gudauri Bergen"
            />
            <p className="text-xs text-foreground/60">
              ⚠️ გერმანულად დაწერეთ ALT აღწერა ამ სურათისთვის
            </p>
          </div>
        </div>
      )}

      {/* Gallery ALT (if uploaded in Georgian) */}
      {imagePreviews.galleryPreviews.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <span className="text-orange-600 dark:text-orange-400">*</span> გალერეის სურათების ALT ტექსტები (გერმანულად)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {imagePreviews.galleryPreviews.map((img, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden border border-foreground/20">
                  <img src={img.preview} alt={img.alt} className="w-full h-full object-cover" />
                </div>
                <input
                  type="text"
                  value={pendingImages.galleryImages[index]?.alt_de || sharedImages.gallery[index]?.alt_de || ""}
                  onChange={(e) => {
                    // Update pendingImages if exists (before save)
                    if (pendingImages.galleryImages[index]) {
                      const updatedGallery = [...pendingImages.galleryImages];
                      updatedGallery[index] = {
                        ...updatedGallery[index],
                        alt_de: e.target.value
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
                        alt_de: e.target.value
                      };
                      setSharedImages({
                        ...sharedImages,
                        gallery: updatedGallery
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-foreground/20 rounded bg-background text-foreground"
                  placeholder="ALT-Text auf Deutsch"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* H1 Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${deContent.h1_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H1 Tag
        </label>
        <input
          type="text"
          value={deContent.h1_tag || ""}
          onChange={(e) => updateLanguageContent('de', { h1_tag: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="z.B: Gleitschirmfliegen in Gudauri"
        />
      </div>

      {/* P Tag */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${deContent.p_tag?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> P Tag (აღწერა)
        </label>
        <textarea
          value={deContent.p_tag || ""}
          onChange={(e) => {
            updateLanguageContent('de', { p_tag: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '80px' }}
          placeholder="z.B: Entdecken Sie ein einzigartiges Flugerlebnis in Georgiens schönster Bergregion..."
        />
      </div>

      {/* H2 - History */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${deContent.h2_history?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H2 Tag (ისტორია)
        </label>
        <input
          type="text"
          value={deContent.h2_history || ""}
          onChange={(e) => updateLanguageContent('de', { h2_history: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="z.B: Geschichte von Gudauri"
        />
      </div>

      {/* History Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${deContent.history_text?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> ისტორიის ტექსტი
        </label>
        <RichTextEditor
          value={deContent.history_text || ""}
          onChange={(value) => updateLanguageContent('de', { history_text: value })}
          placeholder="z.B: Gudauri ist eines der ältesten und beliebtesten Skigebiete Georgiens..."
          minHeight="200px"
        />
      </div>

      {/* Gallery Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${deContent.gallery_description?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> გალერეის აღწერა
        </label>
        <textarea
          value={deContent.gallery_description || ""}
          onChange={(e) => {
            updateLanguageContent('de', { gallery_description: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none overflow-hidden"
          style={{ minHeight: '60px' }}
          placeholder="z.B: Fotos aus verschiedenen Blickwinkeln des Fluges und Panoramablicke..."
        />
      </div>

      {/* H3 Tag - Flight Types */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className={`${deContent.h3_flight_types?.trim() ? 'text-green-600 dark:text-green-400' : 'text-foreground/40'}`}>○</span> H3 Tag (ფრენის ტიპები)
        </label>
        <input
          type="text"
          value={deContent.h3_flight_types || ""}
          onChange={(e) => updateLanguageContent('de', { h3_flight_types: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
          placeholder="z.B: Flugtypen in Gudauri"
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
          {flightTypes.map((type, index) => (
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
                      setFlightTypePriceGEL(type.priceGEL);
                      setFlightTypePriceUSD(type.priceUSD);
                      setFlightTypePriceEUR(type.priceEUR);
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
                      setFlightTypes(flightTypes.filter((_, i) => i !== index));
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

              <div className="flex gap-3 text-sm">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                  {type.priceGEL} ₾
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  ${type.priceUSD}
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                  €{type.priceEUR}
                </span>
              </div>
            </div>
          ))}
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
                placeholder="z.B: Tandemflug"
              />
            </div>

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
              placeholder="z.B: Ideal für Anfänger..."
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
                    placeholder="z.B: Flugdauer: 15-20 Minuten"
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
                if (flightTypeName.trim() && flightTypeDescription.trim() && flightTypePriceGEL && flightTypePriceUSD && flightTypePriceEUR) {
                  const newFlightType = {
                    name: flightTypeName,
                    description: flightTypeDescription,
                    features: flightTypeFeatures.filter(f => f.trim()),
                    priceGEL: flightTypePriceGEL,
                    priceUSD: flightTypePriceUSD,
                    priceEUR: flightTypePriceEUR,
                  };

                  if (editingFlightTypeIndex !== null) {
                    const updated = [...flightTypes];
                    updated[editingFlightTypeIndex] = newFlightType;
                    setFlightTypes(updated);
                  } else {
                    setFlightTypes([...flightTypes, newFlightType]);
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
