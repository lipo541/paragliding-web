"use client";

import { useState } from "react";
import { georgianTranslations } from "./georgian/georgian";
import { englishTranslations } from "./english/english";
import { russianTranslations } from "./russian/russian";
import { arabicTranslations } from "./arabic/arabic";
import { germanTranslations } from "./german/german";
import { turkishTranslations } from "./turkish/turkish";

type Language = "georgian" | "english" | "russian" | "arabic" | "german" | "turkish";

const translations = {
  georgian: georgianTranslations,
  english: englishTranslations,
  russian: russianTranslations,
  arabic: arabicTranslations,
  german: germanTranslations,
  turkish: turkishTranslations,
};

const languageLabels = {
  georgian: "ქართული",
  english: "English",
  russian: "Русский",
  arabic: "العربية",
  german: "Deutsch",
  turkish: "Türkçe",
};

export default function AddLocation() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("georgian");
  const t = translations[selectedLanguage];

  return (
    <div className="p-6">
      {/* Language Switcher */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(Object.keys(languageLabels) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedLanguage === lang
                ? "bg-foreground text-background"
                : "bg-foreground/10 text-foreground hover:bg-foreground/20"
            }`}
          >
            {languageLabels[lang]}
          </button>
        ))}
      </div>

      {/* Content */}
      <h2 className="text-2xl font-bold text-foreground mb-4">{t.formTitle}</h2>
      <p className="text-foreground/60">ფორმა განვითარების პროცესშია</p>
    </div>
  );
}

