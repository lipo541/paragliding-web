"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function GeorgianForm() {
  const { 
    selectedLocationId, 
    languageContent, 
    updateLanguageContent, 
    sharedImages, 
    setSharedImages,
    getSelectedLocation 
  } = useLocation();

  // Local state for form (დროებითი)
  const kaContent = languageContent.ka;
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ file: File; preview: string; alt: string }[]>([]);
  const [flightTypes, setFlightTypes] = useState<FlightType[]>(kaContent.flight_types || []);
  const [showFlightTypeForm, setShowFlightTypeForm] = useState(false);
  const [editingFlightTypeIndex, setEditingFlightTypeIndex] = useState<number | null>(null);
  const [flightTypeName, setFlightTypeName] = useState("");
  const [flightTypeDescription, setFlightTypeDescription] = useState("");
  const [flightTypeFeatures, setFlightTypeFeatures] = useState<string[]>([]);
  const [flightTypePriceGEL, setFlightTypePriceGEL] = useState("");
  const [flightTypePriceUSD, setFlightTypePriceUSD] = useState("");
  const [flightTypePriceEUR, setFlightTypePriceEUR] = useState("");

  const supabase = createClient();

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

  const handleFieldChange = (field: keyof typeof kaContent, value: any) => {
    updateLanguageContent('ka', { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          🇬🇪 ქართული ფორმა - შეავსეთ ყველა ველი
        </p>
      </div>

      {/* Note: georgian.tsx-ის სრული ფუნქციონალი Context-თან ადაპტირებული ვერსია */}
      <div className="text-center py-20 text-foreground/60">
        <p className="text-lg mb-2">Georgian Form - Refactoring in progress...</p>
        <p className="text-sm">Location ID: {selectedLocationId}</p>
      </div>
    </div>
  );
}
