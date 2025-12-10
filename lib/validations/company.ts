import { z } from 'zod';

// Company registration validation schema
export const companySchema = z.object({
  name_ka: z
    .string()
    .min(2, 'კომპანიის სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')
    .max(100, 'კომპანიის სახელი არ უნდა აღემატებოდეს 100 სიმბოლოს'),
  
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]+$/, 'ტელეფონის ნომერი შეიცავს არასწორ სიმბოლოებს')
    .min(9, 'ტელეფონის ნომერი ძალიან მოკლეა')
    .max(20, 'ტელეფონის ნომერი ძალიან გრძელია'),
  
  email: z
    .string()
    .email('არასწორი ელ-ფოსტის ფორმატი'),
  
  founded_date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'არასწორი თარიღი'),
  
  identification_code: z
    .string()
    .min(9, 'საიდენტიფიკაციო კოდი უნდა შეიცავდეს მინიმუმ 9 სიმბოლოს')
    .max(20, 'საიდენტიფიკაციო კოდი ძალიან გრძელია')
    .regex(/^[0-9]+$/, 'საიდენტიფიკაციო კოდი უნდა შეიცავდეს მხოლოდ ციფრებს'),
  
  description_ka: z.string().max(2000, 'აღწერა ძალიან გრძელია').optional(),
  description_en: z.string().max(2000, 'Description is too long').optional(),
  description_ru: z.string().max(2000, 'Описание слишком длинное').optional(),
  description_ar: z.string().max(2000, 'الوصف طويل جدا').optional(),
  description_de: z.string().max(2000, 'Beschreibung ist zu lang').optional(),
  description_tr: z.string().max(2000, 'Açıklama çok uzun').optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
