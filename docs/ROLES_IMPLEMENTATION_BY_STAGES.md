# როლების სისტემის იმპლემენტაცია - ეტაპებად

## მიმოხილვა

**მიდგომა:** თითოეული როლი სრულად დავასრულოთ, შემდეგ გადავიდეთ შემდეგზე.

**თანმიმდევრობა:**
1. 🏢 **კომპანია** (პირველი, რადგან პილოტს კომპანია სჭირდება)
2. 🪂 **პილოტი** (მეორე, კომპანიასთან კავშირით)
3. 🎓 **სტუდენტი** (ბოლოს, ყველაზე მარტივი)

---

# 🏢 ეტაპი A: კომპანია

## A.1 - Database: companies ცხრილი

**ფაილი:** `supabase/migrations/033_create_companies_table.sql`

### ცხრილის სტრუქტურა:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users (კომპანიის მფლობელი) |
| name | TEXT | კომპანიის სახელი |
| phone | TEXT | ტელეფონი |
| email | TEXT | იმეილი |
| founded_date | DATE | დაარსების თარიღი |
| identification_code | TEXT | საიდენტიფიკაციო კოდი |
| description_ka | TEXT | აღწერა ქართულად |
| description_en | TEXT | აღწერა ინგლისურად |
| description_ru | TEXT | აღწერა რუსულად |
| description_ar | TEXT | აღწერა არაბულად |
| description_de | TEXT | აღწერა გერმანულად |
| description_tr | TEXT | აღწერა თურქულად |
| logo_url | TEXT | ლოგო |
| status | ENUM | pending, verified, blocked, hidden |
| created_at | TIMESTAMPTZ | შექმნის დრო |
| updated_at | TIMESTAMPTZ | განახლების დრო |

### სტატუსის ENUM:

```sql
CREATE TYPE company_status AS ENUM ('pending', 'verified', 'blocked', 'hidden');
```

### RLS Policies:
- SELECT: Public (verified კომპანიები), Own profile
- INSERT: Authenticated users
- UPDATE: Own profile + SUPER_ADMIN
- DELETE: SUPER_ADMIN only

---

## A.2 - Storage: company-logos bucket

**ფაილი:** `supabase/migrations/034_create_company_storage.sql`

- Bucket: `company-logos`
- Path pattern: `companies/{company_id}/{filename}`
- Public read access
- Authenticated upload (own folder)

---

## A.3 - Types & Validations

### TypeScript Types
**ფაილი:** `lib/types/company.ts`

```typescript
export type CompanyStatus = 'pending' | 'verified' | 'blocked' | 'hidden';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  founded_date: string;
  identification_code: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  description_ar?: string;
  description_de?: string;
  description_tr?: string;
  logo_url?: string;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}
```

### Zod Validation
**ფაილი:** `lib/validations/company.ts`

```typescript
export const companyRegistrationSchema = z.object({
  name: z.string().min(2, 'მინიმუმ 2 სიმბოლო'),
  phone: z.string().min(9, 'მინიმუმ 9 სიმბოლო'),
  email: z.string().email('არასწორი იმეილი'),
  founded_date: z.string(),
  identification_code: z.string().min(9, 'საიდენტიფიკაციო კოდი უნდა იყოს 9+ სიმბოლო'),
  description: z.string().min(50, 'მინიმუმ 50 სიმბოლო'),
});
```

---

## A.4 - კომპანიის რეგისტრაციის ფორმა

### გვერდი
**ფაილი:** `app/[locale]/profile/become-company/page.tsx`

### კომპონენტი
**ფაილი:** `components/company/CompanyRegistrationForm.tsx`

### ფორმის ველები:
1. **ლოგო** - FileUpload კომპონენტი
2. **კომპანიის სახელი** - Input
3. **ტელეფონი** - Input
4. **იმეილი** - Input
5. **დაარსების თარიღი** - DatePicker
6. **საიდენტიფიკაციო კოდი** - Input
7. **აღწერა** - Textarea

### ლოგიკა:
- ავტორიზაციის შემოწმება
- თუ უკვე კომპანიაა - redirect
- ფორმის submit → companies ცხრილში ჩაწერა (status: pending)
- წარმატების შემთხვევაში - "განაცხადი გაგზავნილია" შეტყობინება

---

## A.5 - Admin პანელი: კომპანიების მართვა

### კომპონენტები:

**ფაილი:** `components/superadmindashboard/companies/CompaniesManagement.tsx`
- Pending განაცხადების სია
- Verified კომპანიების სია
- ფილტრაცია სტატუსით

**ფაილი:** `components/superadmindashboard/companies/CompanyApplicationCard.tsx`
- კომპანიის ინფორმაცია
- დამტკიცება/უარყოფა ღილაკები

**ფაილი:** `components/superadmindashboard/companies/CompanyDetailsModal.tsx`
- სრული დეტალების ნახვა
- სტატუსის შეცვლა (verified, blocked, hidden)

**ფაილი:** `components/superadmindashboard/companies/CompanyTranslationForm.tsx`
- 6 ენაზე description-ის თარგმანი
- ტაბები: ka, en, ru, ar, de, tr

### Admin Actions:
- **დამტკიცება:** 
  - `companies.status = 'verified'`
  - `profiles.role = 'COMPANY'`
- **უარყოფა:** `companies.status = 'rejected'`
- **დაბლოკვა:** `companies.status = 'blocked'`
- **დამალვა:** `companies.status = 'hidden'`

### SuperAdminDashboard.tsx განახლება:
- "კომპანიები" ტაბის იმპლემენტაცია
- Badge pending რაოდენობით

---

## A.6 - კომპანიის პანელი

### Routes:
```
app/[locale]/company/
├── layout.tsx          # Layout + RoleGuard + Nav
├── page.tsx            # Dashboard
└── profile/
    └── page.tsx        # პროფილის რედაქტირება
```

### Layout
**ფაილი:** `app/[locale]/company/layout.tsx`
- RoleGuard: allowedRoles=['COMPANY']
- CompanyNav კომპონენტი

### Dashboard
**ფაილი:** `app/[locale]/company/page.tsx`
- მოგესალმება
- სტატისტიკა (მომავალში: პილოტების რაოდენობა)

### პროფილის რედაქტირება
**ფაილი:** `app/[locale]/company/profile/page.tsx`
- ლოგოს შეცვლა
- ინფორმაციის განახლება

### ნავიგაცია
**ფაილი:** `components/company/CompanyNav.tsx`
- მთავარი
- პროფილი
- (მომავალში: პილოტები, მოთხოვნები)

---

## A.7 - Footer და Register Flow

### Footer განახლება
**ფაილი:** `components/footer/Footer.tsx`

დავამატოთ "შემოგვიერთდი" სექცია:
- "გაწევრიანდი როგორც კომპანია"
- არაავტორიზებული: `/register?type=company&redirect=/profile/become-company`
- ავტორიზებული: `/profile/become-company`

### Register Form განახლება
**ფაილი:** `components/register/RegisterForm.tsx`

- წაიკითხოს `?type=company` პარამეტრი
- აჩვენოს: "რეგისტრაცია კომპანიად"
- რეგისტრაციის შემდეგ redirect `/profile/become-company`-ზე

---

## A.8 - Header განახლება

**ფაილი:** `components/header/Header.tsx`

როლის მიხედვით ნავიგაცია:
- `COMPANY` → `/company` (კომპანიის პანელი)

---

## A.9 - i18n თარგმანები (კომპანია)

### ფაილები:
```
lib/i18n/locales/ka/company.json
lib/i18n/locales/en/company.json
lib/i18n/locales/ru/company.json
lib/i18n/locales/ar/company.json
lib/i18n/locales/de/company.json
lib/i18n/locales/tr/company.json
```

### თარგმანების სტრუქტურა:
```json
{
  "registration": {
    "title": "კომპანიის რეგისტრაცია",
    "subtitle": "შეავსეთ ფორმა კომპანიის დასარეგისტრირებლად",
    "submit": "განაცხადის გაგზავნა",
    "success": "განაცხადი წარმატებით გაიგზავნა"
  },
  "form": {
    "logo": "კომპანიის ლოგო",
    "name": "კომპანიის სახელი",
    "phone": "ტელეფონი",
    "email": "იმეილი",
    "foundedDate": "დაარსების თარიღი",
    "identificationCode": "საიდენტიფიკაციო კოდი",
    "description": "კომპანიის შესახებ"
  },
  "status": {
    "pending": "განხილვაშია",
    "verified": "ვერიფიცირებული",
    "blocked": "დაბლოკილი",
    "hidden": "დამალული"
  },
  "dashboard": {
    "title": "კომპანიის პანელი",
    "welcome": "მოგესალმებით"
  },
  "nav": {
    "dashboard": "მთავარი",
    "profile": "პროფილი",
    "pilots": "პილოტები",
    "requests": "მოთხოვნები"
  }
}
```

---

## ეტაპი A - ჩეკლისტი

- [ ] A.1 - Database: companies ცხრილი
- [ ] A.2 - Storage: company-logos bucket
- [ ] A.3 - Types & Validations
- [ ] A.4 - კომპანიის რეგისტრაციის ფორმა
- [ ] A.5 - Admin პანელი: კომპანიების მართვა
- [ ] A.6 - კომპანიის პანელი
- [ ] A.7 - Footer და Register Flow
- [ ] A.8 - Header განახლება
- [ ] A.9 - i18n თარგმანები

**სავარაუდო დრო:** 3-4 დღე

---

# 🪂 ეტაპი B: პილოტი

## B.1 - Database: pilots ცხრილი

**ფაილი:** `supabase/migrations/035_create_pilots_table.sql`

### ცხრილის სტრუქტურა:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| first_name | TEXT | სახელი |
| last_name | TEXT | გვარი |
| birth_date | DATE | დაბადების თარიღი |
| phone | TEXT | ტელეფონი |
| email | TEXT | იმეილი |
| commercial_start_date | DATE | კომერციული ფრენის დაწყება |
| bio_ka, bio_en, bio_ru, bio_ar, bio_de, bio_tr | TEXT | ბიოგრაფია 6 ენაზე |
| avatar_url | TEXT | პროფილის სურათი |
| wing_model | TEXT | ფრთის მოდელი |
| wing_certificate_url | TEXT | ფრთის სერთიფიკატი |
| pilot_harness_model | TEXT | პილოტის სავარძელი |
| pilot_harness_certificate_url | TEXT | სერთიფიკატი |
| passenger_harness_model | TEXT | მგზავრის სავარძელი |
| passenger_harness_certificate_url | TEXT | სერთიფიკატი |
| reserve_model | TEXT | სარეზერვო პარაშუტი |
| reserve_certificate_url | TEXT | სერთიფიკატი |
| tandem_certificate_url | TEXT | ტანდემ სერთიფიკატი |
| company_id | UUID | FK → companies (nullable) |
| status | ENUM | pending, verified, blocked, hidden |
| created_at, updated_at | TIMESTAMPTZ | |

---

## B.2 - Database: pilot_achievements

**ფაილი:** `supabase/migrations/036_create_pilot_achievements.sql`

| Column | Type |
|--------|------|
| id | UUID |
| pilot_id | UUID FK |
| title_ka, title_en, title_ru, title_ar, title_de, title_tr | TEXT |
| description_ka, description_en... | TEXT |
| date | DATE |
| created_at | TIMESTAMPTZ |

---

## B.3 - Database: pilot_company_requests

**ფაილი:** `supabase/migrations/037_create_pilot_company_requests.sql`

| Column | Type |
|--------|------|
| id | UUID |
| pilot_id | UUID FK |
| company_id | UUID FK |
| status | ENUM (pending, approved, rejected) |
| message | TEXT |
| created_at, updated_at | TIMESTAMPTZ |

---

## B.4 - Storage Buckets

**ფაილი:** `supabase/migrations/038_create_pilot_storage.sql`

- `pilot-avatars` - პილოტის სურათები
- `pilot-certificates` - სერთიფიკატები

---

## B.5 - Types & Validations

**ფაილები:**
- `lib/types/pilot.ts`
- `lib/validations/pilot.ts`

---

## B.6 - Helper: გამოცდილების გამოთვლა

**ფაილი:** `lib/utils/experience.ts`

```typescript
export function calculateExperience(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  
  if (months < 0) { years--; months += 12; }
  
  return {
    years,
    months,
    displayText: `${years} წელი${months > 0 ? ` და ${months} თვე` : ''}`
  };
}
```

**ფაილი:** `lib/hooks/useExperience.ts`

---

## B.7 - პილოტის რეგისტრაციის ფორმა

**ფაილები:**
- `app/[locale]/profile/become-pilot/page.tsx`
- `components/pilot/PilotRegistrationForm.tsx`

### ფორმის სექციები:
1. **პირადი ინფორმაცია** - avatar, სახელი, გვარი, დაბადების თარიღი, ტელ, იმეილი
2. **გამოცდილება** - კომერციული ფრენის დაწყება, ბიოგრაფია
3. **აღჭურვილობა** - 4 ტიპი (მოდელი + სერთიფიკატი)
4. **სერთიფიკაცია** - ტანდემ სერთიფიკატი
5. **მიღწევები** - დინამიური (+ღილაკი)

---

## B.8 - Admin პანელი: პილოტების მართვა

**ფაილები:**
- `components/superadmindashboard/pilots/PilotsManagement.tsx`
- `components/superadmindashboard/pilots/PilotApplicationCard.tsx`
- `components/superadmindashboard/pilots/PilotDetailsModal.tsx`
- `components/superadmindashboard/pilots/PilotTranslationForm.tsx`

### Actions:
- დამტკიცება → `profiles.role = 'TANDEM_PILOT'`
- 6 ენაზე bio და achievements თარგმანი

---

## B.9 - პილოტის პანელი

### Routes:
```
app/[locale]/pilot/
├── layout.tsx
├── page.tsx              # Dashboard
├── profile/page.tsx      # პროფილი
├── equipment/page.tsx    # აღჭურვილობა
├── achievements/page.tsx # მიღწევები
└── company/page.tsx      # კომპანიასთან მიერთება
```

---

## B.10 - პილოტ-კომპანია კავშირი

### პილოტის მხრიდან:
- კომპანიების სიის ნახვა
- მოთხოვნის გაგზავნა
- კომპანიიდან წასვლა

### კომპანიის მხრიდან (პანელის განახლება):
- `app/[locale]/company/pilots/page.tsx` - პილოტების სია
- `app/[locale]/company/requests/page.tsx` - მოთხოვნები
- დამტკიცება/უარყოფა

---

## B.11 - Footer განახლება

- "გაწევრიანდი როგორც პილოტი" ლინკი

---

## B.12 - i18n თარგმანები (პილოტი)

```
lib/i18n/locales/{locale}/pilot.json
```

---

## ეტაპი B - ჩეკლისტი

- [ ] B.1 - Database: pilots
- [ ] B.2 - Database: pilot_achievements
- [ ] B.3 - Database: pilot_company_requests
- [ ] B.4 - Storage buckets
- [ ] B.5 - Types & Validations
- [ ] B.6 - გამოცდილების helper
- [ ] B.7 - პილოტის რეგისტრაციის ფორმა
- [ ] B.8 - Admin პანელი
- [ ] B.9 - პილოტის პანელი
- [ ] B.10 - პილოტ-კომპანია კავშირი
- [ ] B.11 - Footer განახლება
- [ ] B.12 - i18n თარგმანები

**სავარაუდო დრო:** 5-6 დღე

---

# 🎓 ეტაპი C: სტუდენტი

## C.1 - Database: STUDENT როლი + students ცხრილი

**ფაილი:** `supabase/migrations/039_add_student_role.sql`
```sql
ALTER TYPE user_role ADD VALUE 'STUDENT';
```

**ფაილი:** `supabase/migrations/040_create_students_table.sql`

| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID FK |
| first_name | TEXT |
| last_name | TEXT |
| birth_date | DATE |
| phone | TEXT |
| email | TEXT |
| status | ENUM (pending, active, blocked, hidden) |
| created_at, updated_at | TIMESTAMPTZ |

---

## C.2 - Types & Validations

**ფაილები:**
- `lib/types/student.ts`
- `lib/validations/student.ts`

---

## C.3 - სტუდენტის რეგისტრაციის ფორმა

**ფაილები:**
- `app/[locale]/profile/become-student/page.tsx`
- `components/student/StudentRegistrationForm.tsx`

### ფორმის ველები:
- სახელი
- გვარი
- დაბადების თარიღი
- ტელეფონი
- იმეილი

---

## C.4 - Admin პანელი: სტუდენტების მართვა

**ფაილები:**
- `components/superadmindashboard/students/StudentsManagement.tsx`
- `components/superadmindashboard/students/StudentApplicationCard.tsx`
- `components/superadmindashboard/students/StudentDetailsModal.tsx`

### Actions:
- დამტკიცება → `profiles.role = 'STUDENT'`, `students.status = 'active'`

---

## C.5 - სტუდენტის პანელი

### Routes:
```
app/[locale]/student/
├── layout.tsx
├── page.tsx          # Dashboard
└── profile/page.tsx  # პროფილი
```

---

## C.6 - Footer განახლება

- "გახდი სტუდენტი - ისწავლე ფრენა" ლინკი

---

## C.7 - i18n თარგმანები (სტუდენტი)

```
lib/i18n/locales/{locale}/student.json
```

---

## ეტაპი C - ჩეკლისტი

- [ ] C.1 - Database: STUDENT როლი + students
- [ ] C.2 - Types & Validations
- [ ] C.3 - სტუდენტის რეგისტრაციის ფორმა
- [ ] C.4 - Admin პანელი
- [ ] C.5 - სტუდენტის პანელი
- [ ] C.6 - Footer განახლება
- [ ] C.7 - i18n თარგმანები

**სავარაუდო დრო:** 2 დღე

---

# საერთო კომპონენტები (ყველა ეტაპისთვის)

## RoleGuard კომპონენტი

**ფაილი:** `components/roles/RoleGuard.tsx`

```typescript
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackUrl?: string;
}
```

---

## StatusBadge კომპონენტი

**ფაილი:** `components/roles/StatusBadge.tsx`

სტატუსის ვიზუალიზაცია:
- pending - ყვითელი
- verified/active - მწვანე
- blocked - წითელი
- hidden - ნაცრისფერი

---

# შეჯამება

| ეტაპი | აღწერა | დრო |
|-------|--------|-----|
| A | 🏢 კომპანია | 3-4 დღე |
| B | 🪂 პილოტი | 5-6 დღე |
| C | 🎓 სტუდენტი | 2 დღე |
| **სულ** | | **10-12 დღე** |

---

# მიმდინარე სტატუსი

**აქტიური ეტაპი:** ⏳ A - კომპანია

**მიმდინარე ამოცანა:** A.1 - Database: companies ცხრილი
