# 🚀 დამატებითი სერვისების რესტრუქტურიზაციის გეგმა

## 📋 პროექტის მიმოხილვა

### მიზანი
დამატებითი სერვისების სისტემის რესტრუქტურიზაცია, რათა კომპანიებმა და პილოტებმა შეძლონ ლოკაციის მიხედვით სერვისების არჩევა და მომხმარებლებისთვის შეთავაზება.

### ძირითადი პრინციპები
1. **ადმინი** - ქმნის სერვისებს და ადგენს ფასებს (ფასები ფიქსირებულია)
2. **კომპანია** - ირჩევს რომელი სერვისები სურს (თავისი ლოკაციების მიხედვით)
3. **პილოტი** - ხედავს კომპანიის არჩეულ სერვისებს ავტომატურად
4. **მომხმარებელი** - ხედავს სერვისებს კალათაში და ჯავშნის ფორმაში

---

## 🗃️ ფაზა 1: მონაცემთა ბაზის ცვლილებები

### 1.1 ახალი მიგრაციის ფაილი

**ფაილი:** `supabase/migrations/20251227_company_selected_services.sql`

```sql
-- =====================================================
-- Company Selected Services Migration
-- Created: 2025-12-27
-- Description: Links companies to their selected additional services
-- =====================================================

-- =====================================================
-- 1. CREATE TABLE: company_selected_services
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_selected_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.additional_services(id) ON DELETE CASCADE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one company can select each service only once
    CONSTRAINT unique_company_service UNIQUE (company_id, service_id)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_company_selected_services_company 
    ON public.company_selected_services(company_id);

CREATE INDEX IF NOT EXISTS idx_company_selected_services_service 
    ON public.company_selected_services(service_id);

CREATE INDEX IF NOT EXISTS idx_company_selected_services_active 
    ON public.company_selected_services(is_active) 
    WHERE is_active = true;

-- =====================================================
-- 3. COMMENTS
-- =====================================================
COMMENT ON TABLE public.company_selected_services IS 
    'Junction table linking companies to their selected additional services';

COMMENT ON COLUMN public.company_selected_services.company_id IS 
    'Reference to the company that selected the service';

COMMENT ON COLUMN public.company_selected_services.service_id IS 
    'Reference to the additional service selected by the company';

COMMENT ON COLUMN public.company_selected_services.is_active IS 
    'Whether the service selection is currently active';

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.company_selected_services ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active selections for verified companies
CREATE POLICY "Public can view active company services"
    ON public.company_selected_services
    FOR SELECT
    USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.status = 'verified'
        )
    );

-- Policy: Company owners can manage their own service selections
CREATE POLICY "Company owners can manage own services"
    ON public.company_selected_services
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Policy: Super admin has full access
CREATE POLICY "Super admin full access to company services"
    ON public.company_selected_services
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 5. TRIGGER: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_company_selected_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER company_selected_services_updated_at_trigger
    BEFORE UPDATE ON public.company_selected_services
    FOR EACH ROW
    EXECUTE FUNCTION update_company_selected_services_updated_at();

-- =====================================================
-- 6. FUNCTION: Clean up services when company changes locations
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_company_services_on_location_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If location_ids changed, remove services that are no longer valid
    IF OLD.location_ids IS DISTINCT FROM NEW.location_ids THEN
        DELETE FROM public.company_selected_services css
        WHERE css.company_id = NEW.id
        AND NOT EXISTS (
            SELECT 1 FROM public.additional_services s
            WHERE s.id = css.service_id
            AND s.location_ids && NEW.location_ids  -- Array overlap
            AND s.status = 'active'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER company_location_change_cleanup_trigger
    AFTER UPDATE OF location_ids ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_company_services_on_location_change();
```

---

## 📁 ფაზა 2: TypeScript ტიპები

### 2.1 ახალი ტიპების ფაილი

**ფაილი:** `lib/types/company-services.ts`

```typescript
// =====================================================
// Company Services Types
// =====================================================
// TypeScript types for company-service relationship
// =====================================================

import { AdditionalService, ServiceCategory } from './services';

// =====================================================
// Company Selected Service
// =====================================================
export interface CompanySelectedService {
  id: string;
  company_id: string;
  service_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// With service details (JOIN)
export interface CompanySelectedServiceWithDetails extends CompanySelectedService {
  service: AdditionalService & {
    category?: ServiceCategory;
  };
}

// Grouped by location
export interface ServicesByLocation {
  location_id: string;
  location_name_ka: string;
  location_name_en: string;
  location_name_ru?: string;
  location_name_ar?: string;
  location_name_de?: string;
  location_name_tr?: string;
  services: CompanySelectedServiceWithDetails[];
}

// For selection UI
export interface AvailableServiceForSelection {
  service: AdditionalService & {
    category?: ServiceCategory;
  };
  is_selected: boolean;
  location_ids: string[];
}

// Insert type
export interface CompanySelectedServiceInsert {
  company_id: string;
  service_id: string;
  is_active?: boolean;
}

// Update type
export interface CompanySelectedServiceUpdate {
  is_active?: boolean;
}
```

### 2.2 ტიპების ექსპორტი

**ფაილში დამატება:** `lib/types/index.ts`

```typescript
export * from './company-services';
```

---

## 📊 ფაზა 3: Data Fetching ფუნქციები

### 3.1 ახალი data ფაილი

**ფაილი:** `lib/data/company-services.ts`

```typescript
// =====================================================
// Company Services Data Functions
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { 
  CompanySelectedService, 
  CompanySelectedServiceWithDetails,
  ServicesByLocation,
  AvailableServiceForSelection 
} from '@/lib/types/company-services';
import { AdditionalService } from '@/lib/types/services';

// =====================================================
// GET: Available services for company (based on locations)
// =====================================================
export async function getAvailableServicesForCompany(
  companyId: string
): Promise<AvailableServiceForSelection[]> {
  const supabase = createClient();
  
  // 1. Get company's location_ids
  const { data: company } = await supabase
    .from('companies')
    .select('location_ids')
    .eq('id', companyId)
    .single();
  
  if (!company?.location_ids?.length) return [];
  
  // 2. Get all active services for those locations
  const { data: services } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .overlaps('location_ids', company.location_ids);
  
  // 3. Get company's already selected services
  const { data: selectedServices } = await supabase
    .from('company_selected_services')
    .select('service_id')
    .eq('company_id', companyId);
  
  const selectedIds = new Set(selectedServices?.map(s => s.service_id) || []);
  
  // 4. Map to AvailableServiceForSelection
  return (services || []).map(service => ({
    service,
    is_selected: selectedIds.has(service.id),
    location_ids: service.location_ids
  }));
}

// =====================================================
// GET: Company's selected services
// =====================================================
export async function getCompanySelectedServices(
  companyId: string
): Promise<CompanySelectedServiceWithDetails[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('company_selected_services')
    .select(`
      *,
      service:additional_services(
        *,
        category:service_categories(*)
      )
    `)
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  if (error) throw error;
  return data || [];
}

// =====================================================
// GET: Company's services grouped by location
// =====================================================
export async function getCompanyServicesGroupedByLocation(
  companyId: string,
  locale: string = 'ka'
): Promise<ServicesByLocation[]> {
  const supabase = createClient();
  
  // 1. Get company with location_ids
  const { data: company } = await supabase
    .from('companies')
    .select('location_ids')
    .eq('id', companyId)
    .single();
  
  if (!company?.location_ids?.length) return [];
  
  // 2. Get locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr')
    .in('id', company.location_ids);
  
  // 3. Get selected services with details
  const { data: selectedServices } = await supabase
    .from('company_selected_services')
    .select(`
      *,
      service:additional_services(
        *,
        category:service_categories(*)
      )
    `)
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  // 4. Group by location
  return (locations || []).map(location => ({
    location_id: location.id,
    location_name_ka: location.name_ka,
    location_name_en: location.name_en,
    location_name_ru: location.name_ru,
    location_name_ar: location.name_ar,
    location_name_de: location.name_de,
    location_name_tr: location.name_tr,
    services: (selectedServices || []).filter(ss => 
      ss.service?.location_ids?.includes(location.id)
    )
  })).filter(group => group.services.length > 0);
}

// =====================================================
// GET: Services for location (from all verified companies)
// Used for XParagliding bookings
// =====================================================
export async function getActiveServicesForLocation(
  locationId: string
): Promise<AdditionalService[]> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .contains('location_ids', [locationId]);
  
  return data || [];
}

// =====================================================
// GET: Services for pilot (from their company)
// =====================================================
export async function getPilotCompanyServices(
  pilotId: string
): Promise<ServicesByLocation[]> {
  const supabase = createClient();
  
  // 1. Get pilot's company_id
  const { data: pilot } = await supabase
    .from('pilots')
    .select('company_id')
    .eq('id', pilotId)
    .single();
  
  if (!pilot?.company_id) return [];
  
  // 2. Use company services function
  return getCompanyServicesGroupedByLocation(pilot.company_id);
}

// =====================================================
// TOGGLE: Select/Deselect service for company
// =====================================================
export async function toggleCompanyService(
  companyId: string,
  serviceId: string,
  isActive: boolean
): Promise<CompanySelectedService | null> {
  const supabase = createClient();
  
  if (isActive) {
    // Insert or update to active
    const { data, error } = await supabase
      .from('company_selected_services')
      .upsert({
        company_id: companyId,
        service_id: serviceId,
        is_active: true
      }, {
        onConflict: 'company_id,service_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Set to inactive (soft delete)
    const { data, error } = await supabase
      .from('company_selected_services')
      .update({ is_active: false })
      .eq('company_id', companyId)
      .eq('service_id', serviceId)
      .select()
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

// =====================================================
// BULK: Select multiple services at once
// =====================================================
export async function bulkSelectCompanyServices(
  companyId: string,
  serviceIds: string[]
): Promise<void> {
  const supabase = createClient();
  
  const records = serviceIds.map(serviceId => ({
    company_id: companyId,
    service_id: serviceId,
    is_active: true
  }));
  
  const { error } = await supabase
    .from('company_selected_services')
    .upsert(records, {
      onConflict: 'company_id,service_id'
    });
  
  if (error) throw error;
}
```

---

## 🖥️ ფაზა 4: კომპანიის პანელის კომპონენტები

### 4.1 ფაილების სტრუქტურა

```
components/
└── companybottomnav/
    ├── CompanyBottomNav.tsx          ← საიდბარში "სერვისები" დამატება
    ├── CompanyDashboard.tsx
    ├── CompanyProfile.tsx
    ├── CompanyBookings.tsx
    ├── CompanyPilots.tsx
    └── CompanyServices.tsx           ← ახალი ფაილი
```

### 4.2 ახალი კომპონენტი

**ფაილი:** `components/companybottomnav/CompanyServices.tsx`

**ფუნქციონალი:**
- კომპანიის ლოკაციების მიხედვით სერვისების ჩვენება
- Toggle სერვისების ჩართვა/გამორთვა
- ლოკაციებით დაჯგუფება (tabs ან accordion)
- ფილტრაცია კატეგორიების მიხედვით
- Real-time განახლება

### 4.3 App Route

**ფაილი:** `app/[locale]/company/services/page.tsx`

```typescript
import CompanyServices from '@/components/companybottomnav/CompanyServices';

export default function CompanyServicesPage() {
  return <CompanyServices />;
}
```

---

## 👤 ფაზა 5: კომპანიის პროფილის გვერდი

### 5.1 სერვისების სექცია

**ფაილი:** `components/companyprofilepage/components/CompanyServicesSection.tsx`

**ფუნქციონალი:**
- ლოკაციებით დაჯგუფებული სერვისები
- თითოეული ლოკაციისთვის ცალკე სექცია
- მაგალითი:
  ```
  📍 გუდაური - დამატებითი სერვისები
  ├── 🎥 დრონით გადაღება - 150₾
  ├── 📸 ფოტო პაკეტი - 80₾
  └── 🚗 ტრანსპორტი - 50₾
  
  📍 რუსთავი - დამატებითი სერვისები  
  ├── 🎥 დრონით გადაღება - 120₾
  └── 📸 ფოტო პაკეტი - 60₾
  ```

### 5.2 CompanyProfilePage-ში ინტეგრაცია

**ფაილი:** `components/companyprofilepage/CompanyProfilePage.tsx`

დამატება: `<CompanyServicesSection companyId={company.id} locale={locale} />`

---

## 👨‍✈️ ფაზა 6: პილოტის პროფილის გვერდი

### 6.1 სერვისების სექცია

**ფაილი:** `components/pilotspage/components/PilotServicesSection.tsx`

**ფუნქციონალი:**
- პილოტის კომპანიის სერვისების ჩვენება
- იგივე ფორმატი როგორც კომპანიის გვერდზე
- თუ პილოტს არ აქვს კომპანია - არ ჩანს

### 6.2 PilotProfilePage-ში ინტეგრაცია

**ფაილი:** `components/pilotspage/PilotProfilePage.tsx`

დამატება: `<PilotServicesSection pilotId={pilot.id} locale={locale} />`

---

## 🛒 ფაზა 7: კალათის ინტეგრაცია

### 7.1 ახალი კომპონენტი

**ფაილი:** `components/cart/components/AdditionalServicesUpsell.tsx`

**ფუნქციონალი:**
- კომპაქტური სერვისების ბარათები
- "დამატება" ღილაკი
- ფასის ჩვენება (ადმინის მიერ დადგენილი)
- ერთი დაკლიკით კალათაში დამატება

### 7.2 ლოგიკა

```typescript
// კალათაში არსებული item-ის ტიპის მიხედვით:

if (item.company?.id) {
  // კომპანიის ჯავშანი → კომპანიის არჩეული სერვისები
  services = await getCompanyServicesGroupedByLocation(item.company.id);
}

else if (item.pilot?.id) {
  // პილოტის ჯავშანი → პილოტის კომპანიის სერვისები
  services = await getPilotCompanyServices(item.pilot.id);
}

else if (item.location?.id) {
  // XParagliding ჯავშანი → ლოკაციის ყველა აქტიური სერვისი
  services = await getActiveServicesForLocation(item.location.id);
}
```

### 7.3 CartPage-ში ინტეგრაცია

**ფაილი:** `components/cart/CartPage.tsx`

```tsx
{cartItems.map(item => (
  <>
    <CartItem key={item.id} item={item} ... />
    <AdditionalServicesUpsell 
      cartItem={item}
      locale={locale}
      onAddService={handleAddService}
    />
  </>
))}
```

### 7.4 CartItem ტიპის განახლება

**ფაილი:** `components/cart/types/cart.ts`

უკვე არსებობს service ველი, მხოლოდ გაფართოება:

```typescript
service?: {
  id: string;
  name: string;
  slug: string;
  categoryName?: string;
  pricingOptionId?: string;
  pricingOptionName?: string;
  thumbnailUrl?: string;
  // New fields
  companyId?: string;     // რომელმა კომპანიამ შეგვთავაზა
  companyName?: string;
  locationId?: string;    // რომელ ლოკაციაზე
};
```

---

## 📅 ფაზა 8: ჯავშნის ფორმის ინტეგრაცია

### 8.1 BookingForm-ში დამატება

**ფაილი:** `components/bookings/BookingForm.tsx`

**ლოგიკა:**
- ლოკაციის არჩევის შემდეგ სერვისების შეთავაზება
- იგივე `AdditionalServicesUpsell` კომპონენტის გამოყენება
- არჩეული სერვისები booking-ში შენახვა

---

## 📁 ფაზა 9: ფაილების სრული სტრუქტურა

```
paragliding-web/
├── supabase/
│   └── migrations/
│       └── 20251227_company_selected_services.sql    ← ახალი
│
├── lib/
│   ├── types/
│   │   ├── services.ts                               ← არსებული
│   │   ├── company.ts                                ← არსებული
│   │   ├── company-services.ts                       ← ახალი
│   │   └── index.ts                                  ← განახლება
│   │
│   └── data/
│       ├── services.ts                               ← არსებული
│       └── company-services.ts                       ← ახალი
│
├── components/
│   ├── companybottomnav/
│   │   ├── CompanyBottomNav.tsx                      ← განახლება (sidebar)
│   │   └── CompanyServices.tsx                       ← ახალი
│   │
│   ├── companyprofilepage/
│   │   ├── CompanyProfilePage.tsx                    ← განახლება
│   │   └── components/
│   │       ├── index.ts                              ← განახლება
│   │       └── CompanyServicesSection.tsx            ← ახალი
│   │
│   ├── pilotspage/
│   │   ├── PilotProfilePage.tsx                      ← განახლება
│   │   └── components/
│   │       ├── index.ts                              ← განახლება
│   │       └── PilotServicesSection.tsx              ← ახალი
│   │
│   ├── cart/
│   │   ├── CartPage.tsx                              ← განახლება
│   │   ├── types/
│   │   │   └── cart.ts                               ← განახლება
│   │   └── components/
│   │       ├── index.ts                              ← განახლება
│   │       └── AdditionalServicesUpsell.tsx          ← ახალი
│   │
│   └── bookings/
│       └── BookingForm.tsx                           ← განახლება
│
├── app/
│   └── [locale]/
│       └── company/
│           └── services/
│               └── page.tsx                          ← ახალი
│
└── docs/
    └── COMPANY_SERVICES_RESTRUCTURE_PLAN.md          ← ეს ფაილი
```

---

## 📋 იმპლემენტაციის რიგი

| # | დავალება | ფაილ(ებ)ი | პრიორიტეტი | სტატუსი |
|---|----------|-----------|------------|---------|
| 1 | DB მიგრაცია | `20251227_company_selected_services.sql` | 🔴 მაღალი | ⬜ TODO |
| 2 | TypeScript ტიპები | `lib/types/company-services.ts` | 🔴 მაღალი | ⬜ TODO |
| 3 | Data fetching ფუნქციები | `lib/data/company-services.ts` | 🔴 მაღალი | ⬜ TODO |
| 4 | კომპანიის სერვისების გვერდი | `CompanyServices.tsx` | 🔴 მაღალი | ⬜ TODO |
| 5 | კომპანიის საიდბარი განახლება | `CompanyBottomNav.tsx` | 🟡 საშუალო | ⬜ TODO |
| 6 | App route | `app/[locale]/company/services/page.tsx` | 🟡 საშუალო | ⬜ TODO |
| 7 | კომპანიის პროფილის სერვისები | `CompanyServicesSection.tsx` | 🔴 მაღალი | ⬜ TODO |
| 8 | პილოტის პროფილის სერვისები | `PilotServicesSection.tsx` | 🔴 მაღალი | ⬜ TODO |
| 9 | კალათის სერვისების შეთავაზება | `AdditionalServicesUpsell.tsx` | 🔴 მაღალი | ⬜ TODO |
| 10 | CartPage ინტეგრაცია | `CartPage.tsx` | 🔴 მაღალი | ⬜ TODO |
| 11 | BookingForm ინტეგრაცია | `BookingForm.tsx` | 🟡 საშუალო | ⬜ TODO |
| 12 | თარგმანები | `locales/*/companybottomnav.json` | 🟢 დაბალი | ⬜ TODO |
| 13 | ტესტირება | - | 🔴 მაღალი | ⬜ TODO |

---

## 🔄 მონაცემთა ნაკადი (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL                              │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ service_        │    │ additional_     │                     │
│  │ categories      │───▶│ services        │                     │
│  │ (კატეგორიები)   │    │ (სერვისები)     │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                         location_ids[]                           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        COMPANY PANEL                             │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────────────┐             │
│  │ companies       │    │ company_selected_       │             │
│  │ (location_ids[])│───▶│ services                │             │
│  └─────────────────┘    │ (company_id, service_id)│             │
│                         └─────────────────────────┘             │
│                                                                  │
│  კომპანია ხედავს მხოლოდ იმ სერვისებს, რომლებიც               │
│  მისი ლოკაციებისთვისაა განკუთვნილი                            │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC PAGES                              │
│                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │ Company Profile Page  │  │ Pilot Profile Page    │          │
│  │ ლოკაციებით გაყოფილი │  │ კომპანიის სერვისები  │          │
│  │ სერვისები            │  │ (თუ აქვს კომპანია)   │          │
│  └───────────────────────┘  └───────────────────────┘          │
│                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │ Cart Page             │  │ Booking Form          │          │
│  │ სერვისების შეთავაზება │  │ სერვისების შეთავაზება │          │
│  │ (upsell)             │  │ ლოკაციის არჩევისას   │          │
│  └───────────────────────┘  └───────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX მითითებები

### კომპანიის სერვისების არჩევის გვერდი

```
┌────────────────────────────────────────────────────┐
│ 🛠️ აირჩიე დამატებითი სერვისები                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📍 გუდაური                          [ჩართულია: 3] │
│ ┌──────────────────────────────────────────────┐  │
│ │ ☑️ დრონით გადაღება           150₾           │  │
│ │ ☑️ ფოტო პაკეტი               80₾            │  │
│ │ ☐ ტრანსპორტი                50₾            │  │
│ │ ☑️ ATV ტური                  200₾           │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ 📍 რუსთავი                         [ჩართულია: 1] │
│ ┌──────────────────────────────────────────────┐  │
│ │ ☑️ დრონით გადაღება           120₾           │  │
│ │ ☐ ფოტო პაკეტი               60₾            │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### კალათაში სერვისების შეთავაზება

```
┌────────────────────────────────────────────────────┐
│ 🛒 თქვენი კალათა                                   │
├────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐  │
│ │ ✈️ ტანდემ ფრენა - გუდაური                    │  │
│ │ კომპანია: SkyGeo                            │  │
│ │ ფასი: 300₾                                   │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ 💡 გსურთ დაამატოთ?                               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│ │ 🎥      │ │ 📸      │ │ 🚗      │              │
│ │ დრონი  │ │ ფოტო    │ │ ტრანსპ. │              │
│ │ 150₾   │ │ 80₾     │ │ 50₾     │              │
│ │ [+Add] │ │ [+Add]  │ │ [+Add]  │              │
│ └─────────┘ └─────────┘ └─────────┘              │
│                                                    │
├────────────────────────────────────────────────────┤
│ სულ: 300₾                      [გადახდაზე გასვლა] │
└────────────────────────────────────────────────────┘
```

---

## ⚠️ მნიშვნელოვანი შენიშვნები

1. **ფასები ფიქსირებულია** - კომპანია ვერ შეცვლის ადმინის მიერ დადგენილ ფასებს

2. **ლოკაციის ცვლილება** - როცა კომპანია ლოკაციას შეცვლის, ავტომატურად წაიშლება ის სერვისები რომლებიც ახალ ლოკაციას არ შეესაბამება

3. **პილოტის სერვისები** - პილოტი ვერ ირჩევს სერვისებს დამოუკიდებლად, მხოლოდ კომპანიის არჩეულს ხედავს

4. **XParagliding ჯავშანი** - ეს არის პლატფორმის ჯავშანი, აჩვენებს ლოკაციის ყველა აქტიურ სერვისს ყველა verified კომპანიიდან

5. **Glass Morphism** - ყველა ახალი კომპონენტი უნდა იყოს `GLASS_MORPHISM_GUIDE.md`-ის შესაბამისად

---

## 📅 შექმნის თარიღი

- **შექმნილია:** 2025-12-27
- **ავტორი:** Development Team
- **სტატუსი:** 📝 დაგეგმილი

---

## ✅ მზად არის იმპლემენტაციისთვის

დავიწყოთ ფაზა 1-დან: მონაცემთა ბაზის მიგრაცია?
