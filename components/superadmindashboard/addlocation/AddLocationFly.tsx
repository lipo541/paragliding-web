"use client";

import { useEffect } from "react";
import { LocationProvider, useLocation } from "./LocationContext";
import LanguageTabsForm from "./LanguageTabsForm";

interface AddLocationFlyProps {
  onBack?: () => void;
  editLocationId?: string | null;
}

function AddLocationContent({ onBack, editLocationId }: AddLocationFlyProps) {
  const { loadLocationForEdit, isEditMode } = useLocation();

  useEffect(() => {
    if (editLocationId) {
      loadLocationForEdit(editLocationId);
    }
  }, [editLocationId]);

  return (
    <div className="p-6">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-foreground/70 hover:text-foreground mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">უკან დაბრუნება</span>
        </button>
      )}

      <h1 className="text-3xl font-bold mb-6">
        {isEditMode || editLocationId ? 'ლოკაციის რედაქტირება' : 'ლოკაციის დამატება'}
      </h1>
      
      <LanguageTabsForm />
    </div>
  );
}

export default function AddLocationFly({ onBack, editLocationId }: AddLocationFlyProps) {
  return (
    <LocationProvider>
      <AddLocationContent onBack={onBack} editLocationId={editLocationId} />
    </LocationProvider>
  );
}

