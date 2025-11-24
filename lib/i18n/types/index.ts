import type { Locale, Namespace } from '../config';

export type TranslationParams = Record<string, string | number>;

export interface TranslationFunction {
  (key: string, params?: TranslationParams): string;
}

export interface UseTranslationReturn {
  t: TranslationFunction;
  locale: Locale;
}

export type { Locale, Namespace };
