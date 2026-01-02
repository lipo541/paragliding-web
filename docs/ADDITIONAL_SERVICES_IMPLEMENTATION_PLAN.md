# დამატებითი სერვისების სისტემის იმპლემენტაციის გეგმა

## მიზანი

უნივერსალური სერვისების პლატფორმა (დრონი, კვადროციკლი, ფოტო/ვიდეო და სხვა) ლოკაციების მიხედვით, კატეგორიზებული, მრავალენოვანი, SEO-ოპტიმიზებული სისტემა გალერეით, ვიდეოებით და მოქნილი ფასებით.

---

## ნაბიჯი 1: მონაცემთა ბაზის სქემა

**ფაილი:** `supabase/migrations/XXX_create_additional_services.sql`

### 1.1 კატეგორიების ცხრილი

```sql
-- სერვისების კატეგორიები (დინამიური, ადმინის მიერ მართვადი)
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  
  -- მულტი-ენობრივი სახელები
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  name_ar TEXT,
  name_de TEXT,
  name_tr TEXT,
  
  -- აიკონი (Lucide icon name)
  icon TEXT DEFAULT 'package',
  
  -- სორტირება და სტატუსი
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 სერვისების მთავარი ცხრილი

```sql
-- სერვისების სტატუსის ტიპი
CREATE TYPE public.service_status AS ENUM ('draft', 'pending', 'active', 'hidden');

-- დამატებითი სერვისების ცხრილი
CREATE TABLE IF NOT EXISTS public.additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- კატეგორია
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  
  -- მულტი-ენობრივი სახელები (6 ენა)
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  name_ar TEXT,
  name_de TEXT,
  name_tr TEXT,
  
  -- მულტი-ენობრივი აღწერები (6 ენა)
  description_ka TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_ar TEXT,
  description_de TEXT,
  description_tr TEXT,
  
  -- მულტი-ენობრივი slug-ები (6 ენა)
  slug_ka TEXT NOT NULL,
  slug_en TEXT NOT NULL,
  slug_ru TEXT,
  slug_ar TEXT,
  slug_de TEXT,
  slug_tr TEXT,
  
  -- SEO: Meta Title (6 ენა)
  seo_title_ka TEXT,
  seo_title_en TEXT,
  seo_title_ru TEXT,
  seo_title_ar TEXT,
  seo_title_de TEXT,
  seo_title_tr TEXT,
  
  -- SEO: Meta Description (6 ენა)
  seo_description_ka TEXT,
  seo_description_en TEXT,
  seo_description_ru TEXT,
  seo_description_ar TEXT,
  seo_description_de TEXT,
  seo_description_tr TEXT,
  
  -- OG: Title (6 ენა)
  og_title_ka TEXT,
  og_title_en TEXT,
  og_title_ru TEXT,
  og_title_ar TEXT,
  og_title_de TEXT,
  og_title_tr TEXT,
  
  -- OG: Description (6 ენა)
  og_description_ka TEXT,
  og_description_en TEXT,
  og_description_ru TEXT,
  og_description_ar TEXT,
  og_description_de TEXT,
  og_description_tr TEXT,
  
  -- OG Image (საერთო)
  og_image TEXT,
  
  -- ლოკაციები (UUID მასივი GIN ინდექსით)
  location_ids UUID[] DEFAULT '{}',
  
  -- გალერეა (JSONB)
  -- სტრუქტურა: [{ "url": "...", "alt_ka": "...", "alt_en": "...", "alt_ru": "...", "alt_ar": "...", "alt_de": "...", "alt_tr": "...", "order": 1 }]
  gallery_images JSONB DEFAULT '[]'::jsonb,
  
  -- ვიდეოები (YouTube/Vimeo URLs)
  video_urls TEXT[] DEFAULT '{}',
  
  -- ფასები (JSONB - shared/localized split pattern)
  -- სტრუქტურა:
  -- {
  --   "shared_pricing": [
  --     { "id": "option-1", "type": "fixed", "price_gel": 100, "price_usd": 35, "price_eur": 30 },
  --     { "id": "option-2", "type": "per_minute", "duration_minutes": 1, "price_gel": 50, "price_usd": 18, "price_eur": 16 }
  --   ],
  --   "ka": { "options": [{ "shared_id": "option-1", "name": "პაკეტი", "description": "..." }] },
  --   "en": { "options": [{ "shared_id": "option-1", "name": "Package", "description": "..." }] }
  -- }
  pricing JSONB DEFAULT '{}'::jsonb,
  
  -- სტატუსი
  status service_status DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ინდექსები
CREATE INDEX IF NOT EXISTS idx_additional_services_location_ids 
  ON public.additional_services USING GIN (location_ids);
CREATE INDEX IF NOT EXISTS idx_additional_services_category_id 
  ON public.additional_services (category_id);
CREATE INDEX IF NOT EXISTS idx_additional_services_status 
  ON public.additional_services (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_services_slug_ka 
  ON public.additional_services (slug_ka);
CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_services_slug_en 
  ON public.additional_services (slug_en);

-- RLS Policies
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;

-- Public read access for active items
CREATE POLICY "Public can view active categories" ON public.service_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active services" ON public.additional_services
  FOR SELECT USING (status = 'active');

-- Super admin full access
CREATE POLICY "Super admins can manage categories" ON public.service_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "Super admins can manage services" ON public.additional_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );
```

---

## ნაბიჯი 2: TypeScript ტიპები

**ფაილი:** `lib/types/services.ts`

```typescript
export interface ServiceCategory {
  id: string;
  slug: string;
  name_ka: string;
  name_en: string;
  name_ru: string | null;
  name_ar: string | null;
  name_de: string | null;
  name_tr: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceGalleryImage {
  url: string;
  alt_ka?: string;
  alt_en?: string;
  alt_ru?: string;
  alt_ar?: string;
  alt_de?: string;
  alt_tr?: string;
  order: number;
}

export interface SharedPricingOption {
  id: string;
  type: 'fixed' | 'per_minute' | 'per_hour' | 'per_person';
  duration_minutes?: number;
  price_gel: number;
  price_usd: number;
  price_eur: number;
}

export interface LocalizedPricingOption {
  shared_id: string;
  name: string;
  description?: string;
  features?: string[];
}

export interface ServicePricing {
  shared_pricing: SharedPricingOption[];
  ka?: { options: LocalizedPricingOption[] };
  en?: { options: LocalizedPricingOption[] };
  ru?: { options: LocalizedPricingOption[] };
  ar?: { options: LocalizedPricingOption[] };
  de?: { options: LocalizedPricingOption[] };
  tr?: { options: LocalizedPricingOption[] };
}

export interface AdditionalService {
  id: string;
  category_id: string | null;
  category?: ServiceCategory;
  
  // Names
  name_ka: string;
  name_en: string;
  name_ru: string | null;
  name_ar: string | null;
  name_de: string | null;
  name_tr: string | null;
  
  // Descriptions
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_ar: string | null;
  description_de: string | null;
  description_tr: string | null;
  
  // Slugs
  slug_ka: string;
  slug_en: string;
  slug_ru: string | null;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  
  // SEO
  seo_title_ka: string | null;
  seo_title_en: string | null;
  seo_title_ru: string | null;
  seo_title_ar: string | null;
  seo_title_de: string | null;
  seo_title_tr: string | null;
  
  seo_description_ka: string | null;
  seo_description_en: string | null;
  seo_description_ru: string | null;
  seo_description_ar: string | null;
  seo_description_de: string | null;
  seo_description_tr: string | null;
  
  // OG
  og_title_ka: string | null;
  og_title_en: string | null;
  og_title_ru: string | null;
  og_title_ar: string | null;
  og_title_de: string | null;
  og_title_tr: string | null;
  
  og_description_ka: string | null;
  og_description_en: string | null;
  og_description_ru: string | null;
  og_description_ar: string | null;
  og_description_de: string | null;
  og_description_tr: string | null;
  
  og_image: string | null;
  
  // Relationships
  location_ids: string[];
  
  // Media
  gallery_images: ServiceGalleryImage[];
  video_urls: string[];
  
  // Pricing
  pricing: ServicePricing;
  
  // Status
  status: 'draft' | 'pending' | 'active' | 'hidden';
  
  created_at: string;
  updated_at: string;
}

// Helper type for localized field access
export type ServiceLocale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

// Utility function for getting localized field
export function getServiceLocalizedField<T extends AdditionalService | ServiceCategory>(
  item: T,
  field: string,
  locale: ServiceLocale,
  fallbackLocale: ServiceLocale = 'ka'
): string {
  const localizedKey = `${field}_${locale}` as keyof T;
  const fallbackKey = `${field}_${fallbackLocale}` as keyof T;
  return (item[localizedKey] as string) || (item[fallbackKey] as string) || '';
}
```

---

## ნაბიჯი 3: ადმინ პანელის კომპონენტები

**ფოლდერი:** `components/superadmindashboard/services/`

### 3.1 ფაილების სტრუქტურა

```
services/
├── index.ts                    # ექსპორტები
├── ServicesManager.tsx         # სერვისების სიის მენეჯერი
├── ServiceEditForm.tsx         # რედაქტირების მთავარი ფორმა
├── ServiceBasicInfoForm.tsx    # ძირითადი ინფო (სახელი, აღწერა, კატეგორია)
├── ServiceSeoForm.tsx          # SEO/OG ველები
├── ServiceLocationsForm.tsx    # ლოკაციების არჩევა
├── ServiceGalleryEditor.tsx    # სურათების გალერეა
├── ServiceVideosEditor.tsx     # ვიდეოების მართვა
├── ServicePricingEditor.tsx    # ფასების რედაქტორი
├── ServiceCategoriesManager.tsx # კატეგორიების CRUD
└── ServiceCategoryForm.tsx     # კატეგორიის ფორმა
```

### 3.2 კომპონენტების აღწერა

| კომპონენტი | ფუნქცია |
|------------|---------|
| `ServicesManager.tsx` | სერვისების სია ფილტრაციით (კატეგორია, სტატუსი, ძებნა), სტატუსის ცვლილება, წაშლა |
| `ServiceEditForm.tsx` | ტაბებით ორგანიზებული ფორმა (ძირითადი, SEO, მედია, ფასები), 6 ენის მხარდაჭერა |
| `ServiceGalleryEditor.tsx` | Drag & drop სურათების ატვირთვა, alt ტექსტები 6 ენაზე, რეორგანიზაცია |
| `ServiceVideosEditor.tsx` | YouTube/Vimeo URL-ების დამატება, preview thumbnails |
| `ServicePricingEditor.tsx` | ფასების ოფციები (ფიქსირებული/წუთობრივი), მულტი-ვალუტა, მულტი-ენა |
| `ServiceCategoriesManager.tsx` | კატეგორიების CRUD, icon არჩევა, სორტირება |

---

## ნაბიჯი 4: SuperAdminDashboard Sidebar ინტეგრაცია

**ფაილი:** `components/superadmindashboard/SuperAdminDashboard.tsx`

### დასამატებელი:

1. Import-ები:
   ```typescript
   import { Wrench, Tags } from 'lucide-react';
   import { ServicesManager, ServiceCategoriesManager } from './services';
   ```

2. Sidebar ღილაკები (კომპანიების შემდეგ):
   ```tsx
   {/* სერვისები */}
   <button onClick={() => setActiveTab('services')}>
     <Wrench className="w-5 h-5" />
     სერვისები
   </button>
   
   {/* სერვისების კატეგორიები */}
   <button onClick={() => setActiveTab('serviceCategories')}>
     <Tags className="w-5 h-5" />
     კატეგორიები
   </button>
   ```

3. Content area რენდერინგი:
   ```tsx
   {activeTab === 'services' && <ServicesManager />}
   {activeTab === 'serviceCategories' && <ServiceCategoriesManager />}
   ```

---

## ნაბიჯი 5: სერვისის დინამიური გვერდი

**ფოლდერი:** `app/[locale]/services/[slug]/`

### 5.1 page.tsx

```typescript
// Metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  // Fetch service by slug (or query across all slug fields)
  // Return SEO metadata from seo_title_*, seo_description_*, og_*
}

// Static params for SSG
export async function generateStaticParams() {
  // Return array of { locale, slug } for all active services
}

// Page component
export default async function ServicePage({ params }: PageProps) {
  // Fetch service, render ServiceDetailPage component
}
```

---

## ნაბიჯი 6: სერვისის კომპონენტები

**ფოლდერი:** `components/servicepage/`

### 6.1 ფაილების სტრუქტურა

```
servicepage/
├── index.ts                # ექსპორტები
├── ServiceDetailPage.tsx   # მთავარი wrapper კომპონენტი
├── ServiceHero.tsx         # Hero სექცია (სურათი, სახელი, კატეგორია)
├── ServiceDescription.tsx  # აღწერა, მახასიათებლები
├── ServicePricing.tsx      # ფასების ბარათები + კალათაში დამატება
├── ServiceGallery.tsx      # Masonry grid + Lightbox
├── ServiceVideos.tsx       # YouTube ემბედი
├── ServiceLocations.tsx    # ხელმისაწვდომი ლოკაციების ბეჯები
└── ServiceJsonLd.tsx       # Structured data
```

---

## ნაბიჯი 7: ლოკაციის გვერდზე ინტეგრაცია

**ფაილები:**
- `components/locationpage/ServicesList.tsx` - სერვისების სია ლოკაციისთვის
- `components/locationpage/ServiceCard.tsx` - სერვისის ბარათი

### მოთხოვნის პატერნი:
```typescript
const { data: services } = await supabase
  .from('additional_services')
  .select('*, category:service_categories(*)')
  .contains('location_ids', [locationId])
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

### LocationPage.tsx-ში დასამატებელი:
```tsx
{/* Additional Services Section */}
<section id="services-section">
  <SectionTitle icon={Wrench} title={t('services.title')} />
  <ServicesList 
    locationId={location.id}
    locale={locale}
  />
</section>
```

---

## ნაბიჯი 8: კალათის გაფართოება

**ფაილი:** `lib/context/CartContext.tsx`

### CartItem-ის გაფართოება:
```typescript
export interface CartItem {
  // ... existing fields
  
  // New: Service support
  service?: {
    id: string;
    name: string;
    imageUrl?: string;
    categoryName?: string;
  };
  
  // New: Pricing option type
  pricingType?: 'fixed' | 'per_minute' | 'per_hour' | 'per_person';
  duration?: number; // minutes/hours if applicable
}
```

### ახალი კომპონენტი:
- `components/servicepage/ServicePricingModal.tsx` - ფასის ოფციის არჩევის მოდალი

---

## ნაბიჯი 9: თარგმანები

**ფაილები:** `lib/i18n/locales/{ka,en,ru,ar,de,tr}/services.json`

```json
{
  "title": "დამატებითი სერვისები",
  "viewAll": "ყველას ნახვა",
  "addToCart": "კალათაში დამატება",
  "bookNow": "დაჯავშნა",
  "priceFrom": "ფასი იწყება",
  "perMinute": "წუთში",
  "perHour": "საათში",
  "perPerson": "ადამიანზე",
  "fixedPrice": "ფიქსირებული",
  "availableAt": "ხელმისაწვდომია",
  "locations": "ლოკაციაზე",
  "gallery": "გალერეა",
  "videos": "ვიდეოები",
  "description": "აღწერა",
  "features": "რა შედის",
  "categories": {
    "photo_video": "ფოტო/ვიდეო",
    "transport": "ტრანსპორტი",
    "equipment": "აღჭურვილობა",
    "other": "სხვა"
  }
}
```

### config.ts-ში დამატება:
```typescript
export const namespaces = [
  // ... existing
  'services',
] as const;
```

---

## ნაბიჯი 10: დამატებითი ინტეგრაციები

### 10.1 Sitemap
**ფაილი:** `app/sitemap.ts`

დავამატოთ სერვისების გვერდები sitemap-ში.

### 10.2 JSON-LD Schema
**ფაილი:** `lib/seo/JsonLd.tsx`

დავამატოთ `ServiceJsonLd` კომპონენტი Service/Product schema.org-ით.

---

## იმპლემენტაციის თანმიმდევრობა

| # | ნაბიჯი | სტატუსი | შენიშვნა |
|---|--------|---------|----------|
| 1 | DB Migration | ✅ DONE | 20251223100000_create_additional_services.sql - შექმნილია service_categories (7 კატეგორია) და additional_services ცხრილები |
| 2 | TypeScript Types | ✅ DONE | lib/types/services.ts - ServiceCategory, AdditionalService, ServicePricing, utility functions |
| 3 | Admin: Categories | ⬜ TODO | CRUD კატეგორიებისთვის |
| 4 | Admin: Services Manager | ⬜ TODO | სია + ფილტრები |
| 5 | Admin: Service Edit Form | ⬜ TODO | ძირითადი ველები + ენები |
| 6 | Admin: Gallery Editor | ⬜ TODO | სურათების ატვირთვა |
| 7 | Admin: Videos Editor | ⬜ TODO | YouTube URLs |
| 8 | Admin: Pricing Editor | ⬜ TODO | ფასების ოფციები |
| 9 | Admin: Sidebar Integration | ⬜ TODO | ნავიგაციაში დამატება |
| 10 | Service Detail Page | ⬜ TODO | app/[locale]/services/[slug] |
| 11 | Service Components | ⬜ TODO | Hero, Gallery, Pricing, etc. |
| 12 | Location Page Integration | ⬜ TODO | ServicesList, ServiceCard |
| 13 | Cart Extension | ⬜ TODO | Service support in cart |
| 14 | Translations | ⬜ TODO | 6 ენა |
| 15 | Sitemap & SEO | ⬜ TODO | Schema.org, sitemap |

---

## შენიშვნები

- ფაილების სისტემა: context-ით მონაცემთა გადაცემა, page.tsx-ში მხოლოდ კომპონენტის გამოძახება
- კომპონენტების დაშლა: თითოეული ფუნქცია ცალკე კომპონენტად
- არსებული პატერნების გამოყენება: CompanyGallery, CompanyVideosSection, FlightTypes-ის ანალოგიით
