import { z } from 'zod';

// =====================================================
// Pilot Registration Validation Schema
// =====================================================

// Helper for date validation
const dateValidation = z
  .string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'არასწორი თარიღი');

// Helper for birth date validation (must be at least 18 years old)
const birthDateValidation = z
  .string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, 'პილოტი უნდა იყოს მინიმუმ 18 წლის');

// Main pilot registration schema - aligned with database structure
export const pilotSchema = z.object({
  // Personal Information - Multi-language names
  first_name_ka: z
    .string()
    .min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')
    .max(50, 'სახელი არ უნდა აღემატებოდეს 50 სიმბოლოს'),
  first_name_ru: z.string().max(50).optional(),
  first_name_de: z.string().max(50).optional(),
  first_name_tr: z.string().max(50).optional(),
  first_name_ar: z.string().max(50).optional(),
  
  last_name_ka: z
    .string()
    .min(2, 'გვარი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')
    .max(50, 'გვარი არ უნდა აღემატებოდეს 50 სიმბოლოს'),
  last_name_ru: z.string().max(50).optional(),
  last_name_de: z.string().max(50).optional(),
  last_name_tr: z.string().max(50).optional(),
  last_name_ar: z.string().max(50).optional(),
  
  birth_date: birthDateValidation,
  gender: z.enum(['male', 'female', 'other']).optional(),
  
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]+$/, 'ტელეფონის ნომერი შეიცავს არასწორ სიმბოლოებს')
    .min(9, 'ტელეფონის ნომერი ძალიან მოკლეა')
    .max(20, 'ტელეფონის ნომერი ძალიან გრძელია'),
  
  email: z
    .string()
    .email('არასწორი ელ-ფოსტის ფორმატი'),
  
  // Experience
  commercial_start_date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'კომერციული ფრენის დაწყების თარიღი არასწორია'),
  
  total_flights: z.number().int().min(0).optional(),
  tandem_flights: z.number().int().min(0).optional(),
  
  // Wing Equipment (ფრთა)
  wing_brand: z.string().max(100).optional(),
  wing_model: z.string().max(100).optional(),
  
  // Pilot Harness Equipment (პილოტის ჰარნესი)
  pilot_harness_brand: z.string().max(100).optional(),
  pilot_harness_model: z.string().max(100).optional(),
  
  // Passenger Harness Equipment (მგზავრის ჰარნესი)
  passenger_harness_brand: z.string().max(100).optional(),
  passenger_harness_model: z.string().max(100).optional(),
  
  // Reserve Equipment (რეზერვი)
  reserve_brand: z.string().max(100).optional(),
  reserve_model: z.string().max(100).optional(),
  
  // Multi-language bio
  bio_ka: z.string().max(3000, 'ბიოგრაფია ძალიან გრძელია').optional(),
  bio_en: z.string().max(3000, 'Biography is too long').optional(),
  bio_ru: z.string().max(3000, 'Биография слишком длинная').optional(),
  bio_ar: z.string().max(3000, 'السيرة الذاتية طويلة جدا').optional(),
  bio_de: z.string().max(3000, 'Biografie ist zu lang').optional(),
  bio_tr: z.string().max(3000, 'Biyografi çok uzun').optional(),
});

export type PilotFormData = z.infer<typeof pilotSchema>;

// =====================================================
// Pilot Achievement Validation Schema
// =====================================================

export const pilotAchievementSchema = z.object({
  title_ka: z
    .string()
    .min(2, 'სათაური უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')
    .max(200, 'სათაური ძალიან გრძელია'),
  
  title_en: z.string().max(200, 'Title is too long').optional(),
  title_ru: z.string().max(200, 'Заголовок слишком длинный').optional(),
  title_ar: z.string().max(200, 'العنوان طويل جدا').optional(),
  title_de: z.string().max(200, 'Titel ist zu lang').optional(),
  title_tr: z.string().max(200, 'Başlık çok uzun').optional(),
  
  description_ka: z.string().max(1000, 'აღწერა ძალიან გრძელია').optional(),
  description_en: z.string().max(1000, 'Description is too long').optional(),
  description_ru: z.string().max(1000, 'Описание слишком длинное').optional(),
  description_ar: z.string().max(1000, 'الوصف طويل جدا').optional(),
  description_de: z.string().max(1000, 'Beschreibung ist zu lang').optional(),
  description_tr: z.string().max(1000, 'Açıklama çok uzun').optional(),
  
  achievement_date: dateValidation,
});

export type PilotAchievementFormData = z.infer<typeof pilotAchievementSchema>;

// =====================================================
// Pilot Company Request Validation Schema
// =====================================================

export const pilotCompanyRequestSchema = z.object({
  company_id: z.string().uuid('არასწორი კომპანიის ID'),
  message: z
    .string()
    .max(500, 'შეტყობინება ძალიან გრძელია')
    .optional(),
});

export type PilotCompanyRequestFormData = z.infer<typeof pilotCompanyRequestSchema>;

// =====================================================
// Helper function to calculate experience
// =====================================================

export function calculateExperience(startDate: string | null | undefined): {
  years: number;
  months: number;
  displayText: string;
} {
  if (!startDate) {
    return { years: 0, months: 0, displayText: '-' };
  }

  const start = new Date(startDate);
  const now = new Date();
  
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Adjust if day hasn't passed yet
  if (now.getDate() < start.getDate() && months > 0) {
    months--;
  }
  
  // Build display text
  let displayText = '';
  if (years > 0) {
    displayText = `${years} წელი`;
    if (months > 0) {
      displayText += ` და ${months} თვე`;
    }
  } else if (months > 0) {
    displayText = `${months} თვე`;
  } else {
    displayText = 'ახლად დაწყებული';
  }
  
  return { years, months, displayText };
}

// =====================================================
// Helper function to get full name
// =====================================================

export function getPilotFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  locale: string = 'ka'
): string {
  const first = firstName || '';
  const last = lastName || '';
  
  if (!first && !last) return locale === 'ka' ? 'უცნობი პილოტი' : 'Unknown Pilot';
  
  return `${first} ${last}`.trim();
}
