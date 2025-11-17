"use client";

import CountryTabsForm from "./CountryTabsForm";
import CountriesList from "./CountriesList";
import { CountryProvider, useCountry } from "./CountryContext";
import { useState } from "react";

function AddCountryContent() {
  const { selectedCountryId, setSelectedCountryId, resetAllFields } = useCountry();
  const [showList, setShowList] = useState(true);

  const handleEdit = (countryId: string) => {
    setSelectedCountryId(countryId);
    setShowList(false);
  };

  const handleBackToList = () => {
    resetAllFields();
    setShowList(true);
  };

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!showList && (
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-foreground/20 hover:bg-foreground/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              სიაში დაბრუნება
            </button>
          )}
          <h2 className="text-xl font-bold text-foreground">
            {showList ? 'ქვეყნების კონტენტი' : 'ქვეყნის კონტენტის რედაქტირება'}
          </h2>
        </div>
      </div>

      {/* Main Content */}
      {showList ? (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📝 ინსტრუქცია
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>აირჩიეთ ქვეყანა სიიდან და დააწკაპუნეთ რედაქტირების ღილაკზე</li>
              <li>ქართულ ფორმაში ატვირთეთ მთავარი სურათი და გალერეა</li>
              <li>შეავსეთ კონტენტი ყველა 6 ენაზე (ქარ, ინგ, რუს, არაბ, გერმ, თურქ)</li>
              <li>ყოველ ენაზე დაწერეთ ALT ტექსტები სურათებისთვის</li>
              <li>შენახვის შემდეგ ავტომატურად დაბრუნდებით სიაში</li>
            </ul>
          </div>

          <CountriesList onEdit={handleEdit} />
        </div>
      ) : (
        <CountryTabsForm />
      )}
    </div>
  );
}

export default function AddCountryPage() {
  return (
    <CountryProvider>
      <AddCountryContent />
    </CountryProvider>
  );
}
