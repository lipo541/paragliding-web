import { z } from 'zod';

// Profile validation schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს')
    .max(100, 'სახელი არ უნდა აღემატებოდეს 100 სიმბოლოს')
    .regex(/^[ა-ჰa-zA-Z\s'-]+$/, 'სახელი შეიცავს არასწორ სიმბოლოებს'),
  
  phone: z
    .string()
    .regex(/^\+?[0-9\s()-]+$/, 'ტელეფონის ნომერი შეიცავს არასწორ სიმბოლოებს')
    .min(9, 'ტელეფონის ნომერი ძალიან მოკლეა')
    .max(20, 'ტელეფონის ნომერი ძალიან გრძელია')
    .optional()
    .or(z.literal('')),
});

// Password change validation schema
export const passwordChangeSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს')
    .regex(/[A-Z]/, 'პაროლი უნდა შეიცავდეს მინიმუმ 1 დიდ ასოს')
    .regex(/[a-z]/, 'პაროლი უნდა შეიცავდეს მინიმუმ 1 პატარა ასოს')
    .regex(/[0-9]/, 'პაროლი უნდა შეიცავდეს მინიმუმ 1 ციფრს')
    .regex(/[^A-Za-z0-9]/, 'პაროლი უნდა შეიცავდეს მინიმუმ 1 სპეციალურ სიმბოლოს'),
  
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'პაროლები არ ემთხვევა',
  path: ['confirmPassword'],
});

// Types
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
