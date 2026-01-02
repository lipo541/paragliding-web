# პილოტების გვერდის იმპლემენტაციის გეგმა

## 📋 მიმოხილვა

პილოტების გვერდი ზუსტად იგივე პრინციპით იქნება აწყობილი როგორც კომპანიების გვერდი (`/companies`), მაგრამ პილოტების სპეციფიკური ინფორმაციით.

## 📁 ფოლდერის სტრუქტურა

```
components/
└── pilotspage/
    ├── PilotsPage.tsx           # მთავარი კომპონენტი
    ├── components/
    │   ├── index.ts             # ექსპორტები
    │   ├── PilotsHero.tsx       # Hero სექცია
    │   ├── PilotsSearch.tsx     # საძიებო ველი
    │   ├── PilotsFilters.tsx    # ფილტრები
    │   ├── PilotCard.tsx        # პილოტის ქარდი
    │   ├── CountrySection.tsx   # ქვეყნის სექცია (დასაკეცი)
    │   ├── EmptyState.tsx       # ცარიელი მდგომარეობა
    │   └── PilotsJsonLd.tsx     # SEO Schema
    ├── hooks/
    │   └── usePilotsFilter.ts   # ფილტრაცია/სორტირება hook
    └── utils/
        └── pilotHelpers.ts      # დამხმარე ფუნქციები

app/
└── [locale]/
    └── pilots/
        └── page.tsx             # Server component / Route
```

## 🗂️ ფაილების აღწერა

### 1. `utils/pilotHelpers.ts`
- `SupportedLocale` ტიპი
- `getLocalizedField()` - ლოკალიზებული ველის მიღება
- `getPilotName()` - პილოტის სრული სახელი
- `calculateExperience()` - გამოცდილების წლები
- `getPilotUrl()` - პილოტის პროფილის URL

### 2. `hooks/usePilotsFilter.ts`
- **State:**
  - `searchQuery` - საძიებო ტექსტი
  - `viewMode` - 'grid' | 'list'
  - `selectedCountry` - არჩეული ქვეყანა
  - `selectedLocation` - არჩეული ლოკაცია
  - `selectedCompany` - არჩეული კომპანია
  - `sortBy` - 'name' | 'experience' | 'flights' | 'rating'
  - `collapsedCountries` - დაკეცილი ქვეყნები

- **Filtering:**
  - ქვეყნით ფილტრაცია (location_ids → country_id)
  - ლოკაციით ფილტრაცია (location_ids)
  - კომპანიით ფილტრაცია (company_id)
  - სახელით/bio-თი ძებნა

- **Sorting:**
  - სახელით (ა-ჰ)
  - გამოცდილებით (წლები)
  - ფრენების რაოდენობით
  - რეიტინგით

### 3. `components/PilotsHero.tsx`
- ლამაზი Hero სექცია
- სათაური: "პარაგლაიდინგის პილოტები"
- ქვესათაური: "აღმოაჩინეთ გამოცდილი ტანდემ პილოტები"
- Badge: "სერტიფიცირებული პილოტები"

### 4. `components/PilotsSearch.tsx`
- საძიებო input ველი
- შედეგების რაოდენობის ჩვენება
- Placeholder: "მოძებნეთ პილოტი სახელით..."

### 5. `components/PilotsFilters.tsx`
- **ქვეყნის ფილტრი** (dropdown - ლურჯი)
- **ლოკაციის ფილტრი** (dropdown - მწვანე)
- **კომპანიის ფილტრი** (dropdown - მეწამული)
- **სორტირების ფილტრი** (dropdown)
- **View Mode** toggle (grid/list)

### 6. `components/PilotCard.tsx`
- **Grid View:**
  - ავატარი (მრგვალი)
  - სახელი
  - კომპანიის სახელი (თუ არის)
  - გამოცდილება (წლები)
  - ფრენების რაოდენობა
  - რეიტინგი (5 ვარსკვლავი)
  - ენები
  
- **List View:**
  - ჰორიზონტალური layout
  - დამატებითი ინფორმაცია

### 7. `components/CountrySection.tsx`
- ქვეყნის სახელი
- პილოტების რაოდენობა
- Collapse/Expand ფუნქციონალი

### 8. `components/EmptyState.tsx`
- ცარიელი მდგომარეობის UI
- "პილოტები ვერ მოიძებნა"
- ძებნის გასუფთავების ღილაკი

### 9. `components/PilotsJsonLd.tsx`
- Schema.org JSON-LD
- Person schema პილოტებისთვის

### 10. `PilotsPage.tsx`
- მთავარი კლიენტ კომპონენტი
- ყველა sub-კომპონენტის ინტეგრაცია
- Props: `initialPilots`, `initialCountries`, `initialLocations`, `initialCompanies`, `locale`

### 11. `app/[locale]/pilots/page.tsx`
- Server Component
- მონაცემების fetch Supabase-დან
- Metadata generation
- `dynamic = 'force-dynamic'`

## 🔗 Header Navigation

Navigation.tsx-ში დაემატება:
```typescript
{
  href: '/pilots',
  label: 'პილოტები', // ან t('menu.pilots')
  submenu: undefined,
}
```

## 📊 Database Query

```sql
SELECT 
  id, user_id, status,
  first_name_ka, first_name_en, first_name_ru,
  last_name_ka, last_name_en, last_name_ru,
  avatar_url, bio_ka, bio_en, bio_ru,
  commercial_start_date, tandem_flights, languages,
  company_id, location_ids,
  slug_ka, slug_en, slug_ru,
  cached_rating, cached_rating_count
FROM pilots
WHERE status = 'verified'
ORDER BY first_name_ka;
```

## 🌐 i18n Translations

`lib/i18n/locales/{locale}/pilots.json`:
```json
{
  "hero": {
    "title": "პარაგლაიდინგის პილოტები",
    "subtitle": "აღმოაჩინეთ გამოცდილი ტანდემ პილოტები",
    "badge": "სერტიფიცირებული"
  },
  "search": {
    "placeholder": "მოძებნეთ პილოტი...",
    "resultText": "ნაპოვნია {count} პილოტი"
  },
  "filters": {
    "allCountries": "ყველა ქვეყანა",
    "allLocations": "ყველა ლოკაცია",
    "allCompanies": "ყველა კომპანია",
    "sortByName": "სახელით",
    "sortByExperience": "გამოცდილებით",
    "sortByFlights": "ფრენებით",
    "sortByRating": "რეიტინგით"
  },
  "card": {
    "experience": "გამოცდილება",
    "years": "წელი",
    "flights": "ფრენა",
    "languages": "ენები",
    "viewProfile": "პროფილის ნახვა",
    "independent": "დამოუკიდებელი"
  },
  "empty": {
    "noResults": "პილოტები ვერ მოიძებნა",
    "noResultsDescription": "სცადეთ სხვა საძიებო სიტყვები",
    "clearSearch": "ძებნის გასუფთავება"
  }
}
```

## ✅ იმპლემენტაციის თანმიმდევრობა

1. ✅ გეგმის შექმნა (ეს დოკუმენტი)
2. ⬜ Header-ში პილოტების ლინკის დამატება
3. ⬜ `pilotspage` ფოლდერის სტრუქტურის შექმნა
4. ⬜ `utils/pilotHelpers.ts` შექმნა
5. ⬜ `hooks/usePilotsFilter.ts` შექმნა
6. ⬜ კომპონენტების შექმნა:
   - PilotsHero.tsx
   - PilotsSearch.tsx
   - PilotsFilters.tsx
   - PilotCard.tsx
   - CountrySection.tsx
   - EmptyState.tsx
   - PilotsJsonLd.tsx
   - index.ts
7. ⬜ PilotsPage.tsx მთავარი კომპონენტი
8. ⬜ Route შექმნა (`app/[locale]/pilots/page.tsx`)
9. ⬜ i18n თარგმანები (6 ენაზე)

## 🎨 დიზაინი

- Glass morphism სტილი (როგორც კომპანიებში)
- კომპაქტური ქარდები
- მრგვალი ავატარი (border-radius: 50%)
- 5-ვარსკვლავიანი რეიტინგი
- Responsive grid (mobile, tablet, desktop)

## 📝 შენიშვნები

- პილოტებს აქვთ `location_ids` (UUID[]) - მრავალი ლოკაცია
- პილოტებს აქვთ `company_id` - შეიძლება იყოს null (დამოუკიდებელი)
- პილოტებს აქვთ `languages` (SupportedLanguage[]) - ენები რომლებზეც საუბრობენ
- გამოცდილება გამოითვლება `commercial_start_date`-დან
