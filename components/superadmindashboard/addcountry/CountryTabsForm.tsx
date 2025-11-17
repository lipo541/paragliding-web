"use client";

import { useState } from "react";
import { useCountry } from "./CountryContext";
import GeorgianForm from "./georgian/georgian";
import EnglishForm from "./english/english";
import RussianForm from "./russian/russian";
import GermanForm from "./german/german";
import ArabicForm from "./arabic/arabic";
import TurkishForm from "./turkish/turkish";

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

const LANGUAGES = [
  { code: 'ka' as Language, label: 'ქართული', flag: '🇬🇪' },
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'ru' as Language, label: 'Русский', flag: '🇷🇺' },
  { code: 'ar' as Language, label: 'العربية', flag: '🇸🇦' },
  { code: 'de' as Language, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr' as Language, label: 'Türkçe', flag: '🇹🇷' },
];

export default function CountryTabsForm() {
  const {
    activeLanguage,
    setActiveLanguage,
    countries,
    isLoading,
    selectedCountryId,
    setSelectedCountryId,
    getCountryName,
    isSaving,
    isEditMode,
    saveAllLanguages
  } = useCountry();

  return (
    <div className="space-y-6">
      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">რედაქტირების რეჟიმი</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                ამ ქვეყანას უკვე აქვს კონტენტი. შეგიძლიათ შეცვალოთ მონაცემები და შეინახოთ ცვლილებები.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Country Selector */}
      <div className="bg-foreground/5 border border-foreground/20 rounded-lg p-4">
        <label className="block text-sm font-medium text-foreground mb-3">
          <span className={`${selectedCountryId ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>*</span> 
          {' '}აირჩიე ქვეყანა
        </label>

        {isLoading ? (
          <div className="text-sm text-foreground/60">იტვირთება...</div>
        ) : (
          <div className="space-y-1">
            {countries.map((country) => {
              const isSelected = selectedCountryId === country.id;
              return (
                <button
                  key={country.id}
                  onClick={() => setSelectedCountryId(isSelected ? null : country.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-md hover:bg-foreground/10 transition-colors text-left ${
                    isSelected 
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30" 
                      : "text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? "border-green-600 dark:border-green-400 bg-green-600 dark:bg-green-400" 
                        : "border-foreground/30"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {getCountryName(country)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Language Tabs */}
      <div className="border-b border-foreground/20">
        <div className="flex gap-2 overflow-x-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.code)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeLanguage === lang.code
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Forms */}
      <div className="bg-background rounded-lg border border-foreground/10 p-6">
        {activeLanguage === 'ka' && <GeorgianForm />}
        {activeLanguage === 'en' && <EnglishForm />}
        {activeLanguage === 'ru' && <RussianForm />}
        {activeLanguage === 'ar' && <ArabicForm />}
        {activeLanguage === 'de' && <GermanForm />}
        {activeLanguage === 'tr' && <TurkishForm />}
      </div>

      {/* Global Save Button */}
      {selectedCountryId && (
        <div className="sticky bottom-0 bg-background border-t border-foreground/20 p-4 -mx-4 -mb-4 mt-6">
          <button
            onClick={saveAllLanguages}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-foreground/20 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ინახება...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                ყველა ენის შენახვა
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
