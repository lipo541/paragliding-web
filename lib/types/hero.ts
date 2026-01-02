// =====================================================
// Hero Slider Types
// =====================================================
// Type definitions for Hero slider system
// =====================================================

/**
 * ღილაკის მოქმედების ტიპები
 */
export type HeroButtonActionType = 
  | 'link'        // პირდაპირი URL
  | 'contact'     // კონტაქტის გვერდი
  | 'pilot'       // პილოტის პროფილი
  | 'location'    // ლოკაციის გვერდი
  | 'company'     // კომპანიის გვერდი
  | 'service';    // სერვისის გვერდი

/**
 * ღილაკის სტილის ვარიანტები (ფერები)
 */
export type HeroButtonVariant = 'glass-dark' | 'glass-light' | 'glass-primary';

/**
 * ღილაკის ფორმა
 */
export type HeroButtonShape = 'rounded' | 'pill' | 'square';

/**
 * Hero სლაიდის ღილაკი
 */
export interface HeroSlideButton {
  id: string;
  slide_id: string;
  
  // ღილაკის ტექსტი (6 ენაზე)
  text_ka: string;
  text_en: string;
  text_ru: string;
  text_ar: string;
  text_de: string;
  text_tr: string;
  
  // მოქმედების სისტემა
  action_type: HeroButtonActionType;
  action_url?: string | null;
  pilot_id?: string | null;
  location_id?: string | null;
  company_id?: string | null;
  service_id?: string | null;
  
  // გარე ბმულის ოფცია
  open_in_new_tab: boolean;
  
  // სტილი
  variant: HeroButtonVariant;
  shape: HeroButtonShape;
  display_order: number;
  
  created_at: string;
}

/**
 * Hero სლაიდი
 */
export interface HeroSlide {
  id: string;
  
  // სურათები (Light/Dark რეჟიმი)
  image_url_light: string;
  image_url_dark: string;
  
  // მრავალენოვანი ტექსტი (6 ენაზე)
  title_ka: string;
  title_en: string;
  title_ru: string;
  title_ar: string;
  title_de: string;
  title_tr: string;
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  
  // კონტროლი
  display_order: number;
  is_active: boolean;
  
  // მეტადატა
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  
  // ურთიერთობა
  buttons?: HeroSlideButton[];
}

/**
 * Hero სლაიდის შექმნის DTO
 */
export interface CreateHeroSlideDTO {
  image_url_light: string;
  image_url_dark: string;
  title_ka: string;
  title_en: string;
  title_ru: string;
  title_ar: string;
  title_de: string;
  title_tr: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  description_ar?: string;
  description_de?: string;
  description_tr?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Hero სლაიდის განახლების DTO
 */
export interface UpdateHeroSlideDTO extends Partial<CreateHeroSlideDTO> {
  id: string;
}

/**
 * Hero ღილაკის შექმნის DTO
 */
export interface CreateHeroButtonDTO {
  slide_id: string;
  text_ka: string;
  text_en: string;
  text_ru: string;
  text_ar: string;
  text_de: string;
  text_tr: string;
  action_type: HeroButtonActionType;
  action_url?: string;
  pilot_id?: string;
  location_id?: string;
  company_id?: string;
  service_id?: string;
  open_in_new_tab?: boolean;
  variant?: HeroButtonVariant;
  display_order?: number;
}

/**
 * Hero ღილაკის განახლების DTO
 */
export interface UpdateHeroButtonDTO extends Partial<CreateHeroButtonDTO> {
  id: string;
}

/**
 * ენის ტიპი (6 ენა)
 */
export type HeroLocale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

/**
 * სლაიდის ტექსტის მიღება ენის მიხედვით
 */
export function getSlideTitle(slide: HeroSlide, locale: HeroLocale): string {
  return slide[`title_${locale}`] || slide.title_ka;
}

export function getSlideDescription(slide: HeroSlide, locale: HeroLocale): string | null {
  return slide[`description_${locale}`] || slide.description_ka || null;
}

export function getButtonText(button: HeroSlideButton, locale: HeroLocale): string {
  return button[`text_${locale}`] || button.text_ka;
}
