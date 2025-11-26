# SEO ოპტიმიზაციის სრული გზამკვლევი

## 🚨 პრიორიტეტული გეგმა (დაიწყე აქედან!)

### 📋 იმპლემენტაციის ქრონოლოგია (დამოკიდებულებების მიხედვით)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 1: ინფრასტრუქტურა (დღე 1)                                    │
│  ─────────────────────────────────                                  │
│  1.1 → lib/seo/urls.ts (Helper ფუნქციები)                          │
│  1.2 → lib/seo/constants.ts (BASE_URL, კონფიგურაცია)                │
│        ↓                                                            │
│  [ყველა მომდევნო ნაბიჯი ამას იყენებს]                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 2: Layout-ების გამოსწორება (დღე 1-2)                         │
│  ────────────────────────────────────────                           │
│  2.1 → app/[locale]/layout.tsx - Server Component-ად გადაკეთება    │
│  2.2 → app/layout.tsx - lang={locale} დინამიური                    │
│        ↓                                                            │
│  [Metadata API მუშაობას დაიწყებს]                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 3: Metadata + Hreflang (დღე 2-3)                             │
│  ─────────────────────────────────                                  │
│  3.1 → generateMetadata ყველა გვერდზე                              │
│  3.2 → Canonical URLs დამატება                                     │
│  3.3 → Hreflang alternates დამატება                                │
│        ↓                                                            │
│  [SEO Tags სწორად გამოვა HTML-ში]                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 4: Discovery (დღე 3-4)                                       │
│  ────────────────────                                               │
│  4.1 → app/sitemap.ts შექმნა                                       │
│  4.2 → app/robots.ts შექმნა                                        │
│        ↓                                                            │
│  [Google-მა იცის რა და სად უნდა დააინდექსოს]                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 5: next.config.ts (დღე 4)                                    │
│  ─────────────────────────                                          │
│  5.1 → trailingSlash კონფიგურაცია                                  │
│  5.2 → redirects (www, http, legacy URLs)                          │
│  5.3 → headers (security, caching)                                 │
│        ↓                                                            │
│  [URL ნორმალიზაცია და დუბლიკატების პრევენცია]                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 6: Rich Snippets (კვირა 2)                                   │
│  ──────────────────────────                                         │
│  6.1 → lib/seo/JsonLd.tsx კომპონენტები                             │
│  6.2 → JSON-LD სქემების დამატება გვერდებზე                         │
│        ↓                                                            │
│  [⭐ რეიტინგები, 🍞 Breadcrumbs Google-ში]                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ფაზა 7: Performance + Monitoring (კვირა 2)                        │
│  ───────────────────────────────────                                │
│  7.1 → generateStaticParams (ISR)                                  │
│  7.2 → Google Search Console რეგისტრაცია                           │
│  7.3 → Sitemap Submit                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 📊 დეტალური პრიორიტეტების ცხრილი

| # | ფაზა | დავალება | დამოკიდებულება | სტატუსი |
|---|------|----------|----------------|---------|
| **1.1** | 🔴 ინფრა | `lib/seo/urls.ts` შექმნა | - | ⬜ |
| **1.2** | 🔴 ინფრა | `lib/seo/constants.ts` შექმნა | - | ⬜ |
| **2.1** | 🔴 Layout | `[locale]/layout.tsx` → Server Component | - | ⬜ |
| **2.2** | 🔴 Layout | `app/layout.tsx` → `lang={locale}` | 2.1 | ⬜ |
| **3.1** | 🔴 Meta | `generateMetadata` ყველა გვერდზე | 1.1, 2.1 | ⬜ |
| **3.2** | 🔴 Meta | Canonical URLs დამატება | 1.1, 3.1 | ⬜ |
| **3.3** | 🔴 Meta | Hreflang alternates | 1.1, 3.1 | ⬜ |
| **4.1** | 🔴 Discovery | `app/sitemap.ts` | 1.1 | ⬜ |
| **4.2** | 🔴 Discovery | `app/robots.ts` | - | ⬜ |
| **5.1** | 🟡 Config | `next.config.ts` - trailingSlash | - | ⬜ |
| **5.2** | 🟡 Config | `next.config.ts` - redirects | - | ⬜ |
| **5.3** | 🟡 Config | `next.config.ts` - headers | - | ⬜ |
| **6.1** | 🟡 Schema | `lib/seo/JsonLd.tsx` | - | ⬜ |
| **6.2** | 🟡 Schema | JSON-LD გვერდებზე | 6.1 | ⬜ |
| **7.1** | 🟢 Perf | `generateStaticParams` | 1.1 | ⬜ |
| **7.2** | 🟢 Monitor | Google Search Console | 4.1 | ⬜ |

### ⚠️ კრიტიკული დამოკიდებულებები:

```
❌ არ გააკეთოთ Canonical/Hreflang სანამ:
   → lib/seo/urls.ts არ არსებობს
   → [locale]/layout.tsx არის Client Component

❌ არ გააკეთოთ sitemap.ts სანამ:
   → lib/seo/urls.ts არ არსებობს (slug helper-ები)

❌ არ დარეგისტრირდეთ Search Console-ში სანამ:
   → sitemap.ts არ მუშაობს
   → robots.ts არ არსებობს
```

### 🔧 Development vs Production კონფიგურაცია

```typescript
// lib/seo/constants.ts

// ✅ ავტომატური გადართვა environment-ის მიხედვით
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL 
  || (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://your-domain.com');

// ან .env ფაილებით:
// .env.local (development):
//   NEXT_PUBLIC_SITE_URL=http://localhost:3000
//
// .env.production (production):
//   NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**ტესტირების გეგმა:**

| გარემო | URL | მიზანი |
|--------|-----|--------|
| 🔧 Development | `http://localhost:3000` | კოდის ტესტირება, HTML შემოწმება |
| 🚀 Production | `https://your-domain.com` | Google Search Console, რეალური SEO |

**რა უნდა შემოწმდეს localhost-ზე:**

```bash
# 1. HTML Source შემოწმება (View Page Source):
#    - <link rel="canonical" href="http://localhost:3000/...">
#    - <link rel="alternate" hreflang="ka" href="http://localhost:3000/...">
#    - <html lang="ka"> (დინამიური)

# 2. sitemap.xml შემოწმება:
#    http://localhost:3000/sitemap.xml

# 3. robots.txt შემოწმება:
#    http://localhost:3000/robots.txt

# 4. JSON-LD შემოწმება (DevTools Console):
#    document.querySelectorAll('script[type="application/ld+json"]')
```

**Production-ზე გადასვლისას:**

```bash
# 1. შეცვალეთ .env.production ან Vercel Environment Variables:
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com

# 2. Rebuild & Deploy

# 3. შემოწმება:
#    - https://your-domain.com/sitemap.xml
#    - https://your-domain.com/robots.txt
#    - Google Rich Results Test
#    - Google Search Console Sitemap Submit
```

> 📝 **შენიშვნა:** როცა დომეინს მიაბამთ, მომწერეთ URL და ერთად განვაახლებთ კონფიგურაციას!

### 🎯 რა პრობლემას გადაჭრის თითოეული ფაზა:

| ფაზა | პრობლემა | გადაწყვეტის შემდეგ |
|------|----------|-------------------|
| **ფაზა 1** | Helper ფუნქციები არ არსებობს | ✅ ბაზიდან slug-ების წამოღება შესაძლებელია |
| **ფაზა 2** | Metadata არ მუშაობს (Client Component) | ✅ generateMetadata მუშაობას დაიწყებს |
| **ფაზა 3** | დუბლიკატი კონტენტის რისკი | ✅ Google-მა იცის რომ 6 ენა ერთი კონტენტია |
| **ფაზა 4** | Google ვერ პოულობს გვერდებს | ✅ ყველა URL აღმოჩენილია |
| **ფაზა 5** | URL-ების ნორმალიზაცია | ✅ www, trailing slash, redirects |
| **ფაზა 6** | Rich Snippets არ გვაქვს | ✅ ⭐ რეიტინგები Google-ში |
| **ფაზა 7** | Performance, მონიტორინგი | ✅ სწრაფი გვერდები, ანალიტიკა |

---

## 📊 Route-ების SEO აუდიტი (სრული სურათი)

### 🗄️ Database Schema (Supabase)

თქვენი ბაზა უკვე მზადაა SEO-სთვის! აქ არის ყველა საჭირო ველი:

**Countries Table:**
```sql
-- SEO Fields (6 ენაზე):
name_{locale}           -- ქვეყნის სახელი
slug_{locale}           -- URL slug (უნიკალური)
seo_title_{locale}      -- Meta Title
seo_description_{locale} -- Meta Description
og_title_{locale}       -- Open Graph Title
og_description_{locale} -- Open Graph Description
og_image_url            -- OG Image (საერთო)

-- Indexes (სწრაფი lookup):
idx_countries_slug_{locale} -- slug-ით ძებნა
```

**Locations Table:**
```sql
-- იგივე SEO fields + დამატებითი:
country_id              -- Foreign Key → countries
altitude                -- სიმაღლე (შეიძლება Schema-ში)
best_season_start/end   -- სეზონი (შეიძლება Schema-ში)
difficulty_level        -- სირთულე (შეიძლება Schema-ში)
cached_rating           -- რეიტინგი (Rich Snippets-ისთვის)
cached_rating_count     -- შეფასებების რაოდენობა
```

### ✅ რა გვაქვს ბაზაში (მზადაა გამოსაყენებლად):

| ველი | მიზანი | სტატუსი |
|------|--------|---------|
| `seo_title_{locale}` | Meta Title | ✅ აქვს |
| `seo_description_{locale}` | Meta Description | ✅ აქვს |
| `og_title_{locale}` | Open Graph Title | ✅ აქვს |
| `og_description_{locale}` | Open Graph Description | ✅ აქვს |
| `og_image_url` | OG Image | ✅ აქვს |
| `slug_{locale}` | URL Slugs (6 ენა) | ✅ აქვს + Indexes |
| `cached_rating` | Rating for Schema | ✅ აქვს |
| `cached_rating_count` | Review count | ✅ აქვს |

### 📝 Hreflang Helper Function (Supabase-დან):

```typescript
// lib/seo/urls.ts

import { createClient } from '@/lib/supabase/server';
import { locales, Locale } from '@/lib/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

interface LocationSlugs {
  location: Record<Locale, string>;
  country: Record<Locale, string>;
}

/**
 * Fetches all localized slugs for a location from Supabase
 * Used for generating hreflang alternates
 */
export async function getLocationSlugs(
  locationSlug: string,
  sourceLocale: Locale
): Promise<LocationSlugs | null> {
  const supabase = await createClient();
  
  const slugColumn = `slug_${sourceLocale}`;
  
  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      )
    `)
    .eq(slugColumn, locationSlug)
    .single();

  if (error || !location) return null;

  return {
    location: {
      ka: location.slug_ka,
      en: location.slug_en,
      ru: location.slug_ru,
      de: location.slug_de || location.slug_en,
      tr: location.slug_tr || location.slug_en,
      ar: location.slug_ar || location.slug_en,
    },
    country: {
      ka: location.countries.slug_ka,
      en: location.countries.slug_en,
      ru: location.countries.slug_ru,
      de: location.countries.slug_de || location.countries.slug_en,
      tr: location.countries.slug_tr || location.countries.slug_en,
      ar: location.countries.slug_ar || location.countries.slug_en,
    },
  };
}

/**
 * Fetches all localized slugs for a country
 */
export async function getCountrySlugs(
  countrySlug: string,
  sourceLocale: Locale
): Promise<Record<Locale, string> | null> {
  const supabase = await createClient();
  
  const { data: country, error } = await supabase
    .from('countries')
    .select('slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar')
    .eq(`slug_${sourceLocale}`, countrySlug)
    .single();

  if (error || !country) return null;

  return {
    ka: country.slug_ka,
    en: country.slug_en,
    ru: country.slug_ru,
    de: country.slug_de || country.slug_en,
    tr: country.slug_tr || country.slug_en,
    ar: country.slug_ar || country.slug_en,
  };
}

/**
 * Generates hreflang alternates for location page
 */
export function buildLocationAlternates(slugs: LocationSlugs): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  locales.forEach(locale => {
    alternates[locale] = `${baseUrl}/${locale}/locations/${slugs.country[locale]}/${slugs.location[locale]}`;
  });
  
  alternates['x-default'] = alternates['en'];
  return alternates;
}

/**
 * Generates hreflang alternates for country page
 */
export function buildCountryAlternates(slugs: Record<Locale, string>): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  locales.forEach(locale => {
    alternates[locale] = `${baseUrl}/${locale}/locations/${slugs[locale]}`;
  });
  
  alternates['x-default'] = alternates['en'];
  return alternates;
}
```

### 📝 განახლებული Location Page Metadata:

```typescript
// app/[locale]/locations/[country]/[location]/page.tsx

import { Metadata } from 'next';
import { getLocationSlugs, buildLocationAlternates } from '@/lib/seo/urls';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, location } = await params;
  const supabase = await createClient();

  // Fetch location with all SEO fields
  const { data } = await supabase
    .from('locations')
    .select(`
      *,
      countries!inner(*)
    `)
    .eq(\`slug_\${locale}\`, location)
    .single();

  if (!data) {
    return { title: 'Location Not Found' };
  }

  // Get localized fields
  const seoTitle = data[\`seo_title_\${locale}\`] || data.seo_title_en;
  const seoDescription = data[\`seo_description_\${locale}\`] || data.seo_description_en;
  const ogTitle = data[\`og_title_\${locale}\`] || seoTitle;
  const ogDescription = data[\`og_description_\${locale}\`] || seoDescription;
  const locationName = data[\`name_\${locale}\`] || data.name_en;
  const countryName = data.countries[\`name_\${locale}\`] || data.countries.name_en;

  // Get all slugs for hreflang
  const slugs = await getLocationSlugs(location, locale as Locale);
  const alternates = slugs ? buildLocationAlternates(slugs) : {};

  return {
    title: seoTitle || \`\${locationName} - \${countryName} | Paragliding\`,
    description: seoDescription || \`Paragliding in \${locationName}, \${countryName}\`,
    
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: \`\${baseUrl}/\${locale}/locations/\${country}/\${location}\`,
      siteName: 'Paragliding Georgia',
      locale: locale,
      type: 'website',
      images: data.og_image_url ? [{ url: data.og_image_url }] : undefined,
    },
    
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: data.og_image_url ? [data.og_image_url] : undefined,
    },
    
    // ✅ Canonical + Hreflang (მთავარი!)
    alternates: {
      canonical: \`\${baseUrl}/\${locale}/locations/\${country}/\${location}\`,
      languages: alternates,
    },
  };
}
```

---

### ყველა Route-ის სტატუსი:

| Route | Metadata | ინდექსაცია | ტიპი | პრიორიტეტი |
|-------|----------|------------|------|------------|
| `/[locale]` (მთავარი) | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🔴 Critical |
| `/[locale]/about` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🔴 Critical |
| `/[locale]/contact` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🟡 High |
| `/[locale]/locations` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🔴 Critical |
| `/[locale]/locations/[country]` | ✅ **აქვს** | ✅ დაინდექსდეს | Dynamic | ✅ Done |
| `/[locale]/locations/[country]/[location]` | ✅ **აქვს** | ✅ დაინდექსდეს | Dynamic | ✅ Done |
| `/[locale]/bookings` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🟡 High |
| `/[locale]/promotions` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🟡 High |
| `/[locale]/terms` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🟢 Low |
| `/[locale]/privacy` | ❌ არ აქვს | ✅ დაინდექსდეს | Static | 🟢 Low |
| `/[locale]/login` | ❌ არ აქვს | ❌ **noindex** | Static | 🟢 Low |
| `/[locale]/register` | ❌ არ აქვს | ❌ **noindex** | Static | 🟢 Low |
| `/[locale]/forgot-password` | ❌ არ აქვს | ❌ **noindex** | Static | 🟢 Low |
| `/[locale]/profile` | ❌ არ აქვს | ❌ **noindex** | Client | 🟡 High |
| `/[locale]/cms/*` | ❌ არ აქვს | ❌ **noindex** | Client | 🟡 High |
| `/[locale]/user/*` | ❌ არ აქვს | ❌ **noindex** | Client | 🟢 Low |
| `/[locale]/notifications` | ❌ არ აქვს | ❌ **noindex** | Client | 🟢 Low |
| `/[locale]/user-promotions` | ❌ არ აქვს | ❌ **noindex** | Client | 🟢 Low |

### 📈 სტატისტიკა:
- **Metadata აქვს**: 2 გვერდს (მხოლოდ location და country!)
- **Metadata არ აქვს**: 16+ გვერდს
- **უნდა დაინდექსდეს**: 10 გვერდი
- **არ უნდა დაინდექსდეს**: 8+ გვერდი (auth, admin, user)

### ⚠️ კრიტიკული პრობლემები:

1. **მთავარი გვერდი** (`/[locale]`) - არ აქვს საკუთარი metadata!
2. **About გვერდი** - არ აქვს metadata (ეს SEO-სთვის მნიშვნელოვანია)
3. **Locations listing** (`/[locale]/locations`) - არ აქვს metadata
4. **CMS გვერდი** - Client Component, ვერ დაემატება `generateMetadata`

---

## 🗺️ Sitemap-ში ჩასამატებელი Routes:

```typescript
// ✅ უნდა იყოს sitemap-ში (public, indexable):
const indexableRoutes = [
  '/',                    // მთავარი
  '/about',               // შესახებ
  '/contact',             // კონტაქტი
  '/locations',           // ყველა ლოკაცია
  '/locations/[country]', // ქვეყნის გვერდები
  '/locations/[country]/[location]', // ლოკაციის გვერდები
  '/bookings',            // დაჯავშნა
  '/promotions',          // აქციები
  '/terms',               // წესები
  '/privacy',             // კონფიდენციალურობა
];

// ❌ არ უნდა იყოს sitemap-ში (private, noindex):
const noindexRoutes = [
  '/login',
  '/register', 
  '/forgot-password',
  '/profile',
  '/cms/*',
  '/user/*',
  '/notifications',
  '/user-promotions',
];
```

---

## 📋 სარჩევი

1. [პროექტის SEO აუდიტი](#1-პროექტის-seo-აუდიტი)
2. [URL/Slug სისტემის ანალიზი](#2-urlslug-სისტემის-ანალიზი)
3. [რეკომენდაციები და გეგმა](#3-რეკომენდაციები-და-გეგმა)
4. [საჭირო ფაილები და ფოლდერები](#4-საჭირო-ფაილები-და-ფოლდერები)
5. [იმპლემენტაციის ნაბიჯები](#5-იმპლემენტაციის-ნაბიჯები)
6. [Technical SEO ჩეკლისტი](#6-technical-seo-ჩეკლისტი)
7. [Content SEO რეკომენდაციები](#7-content-seo-რეკომენდაციები)
8. [Performance და Core Web Vitals](#8-performance-და-core-web-vitals)
9. [მონიტორინგი და ინსტრუმენტები](#9-მონიტორინგი-და-ინსტრუმენტები)

---

## 🛡️ დუბლიკატების 0%-მდე დაყვანის სტრატეგია

> ეს სექცია აღწერს, როგორ ავირიდოთ **100%-ით** დუბლიკატი კონტენტი Google-ში ჩვენი მულტი-ენოვანი საიტისთვის.

### 📝 გვერდების Metadata იმპლემენტაციის კოდი

#### მთავარი გვერდი (`app/[locale]/page.tsx`):

```typescript
import { Metadata } from 'next';
import { locales } from '@/lib/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    ka: 'პარაპლანით ფრენა საქართველოში | Paragliding Georgia',
    en: 'Paragliding in Georgia | Tandem Flights & Tours',
    ru: 'Параглайдинг в Грузии | Тандемные полёты',
    de: 'Paragliding in Georgien | Tandemflüge',
    tr: 'Gürcistan\'da Yamaç Paraşütü | Tandem Uçuşlar',
    ar: 'الطيران الشراعي في جورجيا | رحلات ترادفية',
  };

  const descriptions: Record<string, string> = {
    ka: 'საქართველოში პარაპლანით ფრენა საუკეთესო ლოკაციებიდან. გუდაური, თბილისი, სვანეთი. დაჯავშნე ტანდემ ფრენა ახლავე!',
    en: 'Experience paragliding in Georgia from the best locations. Gudauri, Tbilisi, Svaneti. Book your tandem flight today!',
    ru: 'Параглайдинг в Грузии с лучших локаций. Гудаури, Тбилиси, Сванети. Забронируйте тандемный полёт сейчас!',
    de: 'Paragliding in Georgien von den besten Standorten. Gudauri, Tiflis, Swanetien. Buchen Sie Ihren Tandemflug jetzt!',
    tr: 'Gürcistan\'ın en iyi lokasyonlarından yamaç paraşütü. Gudauri, Tiflis, Svaneti. Tandem uçuşunuzu şimdi rezerve edin!',
    ar: 'تجربة الطيران الشراعي في جورجيا من أفضل المواقع. جودوري، تبليسي، سفانيتي. احجز رحلتك الترادفية الآن!',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      url: `${baseUrl}/${locale}`,
      siteName: 'Paragliding Georgia',
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map(l => [l, `${baseUrl}/${l}`])),
        'x-default': `${baseUrl}/en`,
      },
    },
  };
}
```

#### About გვერდი (`app/[locale]/about/page.tsx`):

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    ka: 'ჩვენს შესახებ | Paragliding Georgia',
    en: 'About Us | Paragliding Georgia',
    ru: 'О нас | Paragliding Georgia',
    // ... სხვა ენები
  };

  return {
    title: titles[locale] || titles.en,
    description: '...',
    alternates: {
      canonical: `${baseUrl}/${locale}/about`,
      languages: {
        ...Object.fromEntries(locales.map(l => [l, `${baseUrl}/${l}/about`])),
        'x-default': `${baseUrl}/en/about`,
      },
    },
  };
}
```

#### Locations Listing (`app/[locale]/locations/page.tsx`):

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  // Fetch locations count
  const { count } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true });

  const titles: Record<string, string> = {
    ka: `პარაპლანის ლოკაციები საქართველოში (${count}) | Paragliding Georgia`,
    en: `Paragliding Locations in Georgia (${count}) | Book Now`,
    // ...
  };

  return {
    title: titles[locale],
    alternates: {
      canonical: `${baseUrl}/${locale}/locations`,
      languages: {
        ...Object.fromEntries(locales.map(l => [l, `${baseUrl}/${l}/locations`])),
        'x-default': `${baseUrl}/en/locations`,
      },
    },
  };
}
```

#### noindex გვერდებისთვის (login, register, profile, cms):

```typescript
export const metadata: Metadata = {
  title: 'Login | Paragliding Georgia',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};
```

### თანამედროვე პრაქტიკა (2024-2025)

#### ✅ მთავარი პრინციპი: Self-Referencing Canonical + Hreflang Clusters

```
📖 Google-ის ოფიციალური პოზიცია:
"Localized versions of a page are only considered duplicates 
if the main content of the page remains untranslated."
                    — developers.google.com

📖 Ahrefs-ის პოზიცია:
"This is not a concern for translated pages since they are 
not considered duplicates by Google."
                    — ahrefs.com/blog/hreflang-tags
```

**რას ნიშნავს ეს ჩვენთვის?**

| სცენარი | არის დუბლიკატი? | გადაწყვეტა |
|---------|-----------------|------------|
| `/ka/gudauri` vs `/en/gudauri` (სხვადასხვა ენა) | ❌ არა | hreflang |
| `/en-us/page` vs `/en-gb/page` (იგივე ენა, ფასი განსხვავდება) | ⚠️ შესაძლოა | hreflang + unique content |
| `/page` vs `/page/` (trailing slash) | ✅ დიახ | 301 redirect |
| `http://` vs `https://` | ✅ დიახ | 301 redirect |
| `www.` vs non-www | ✅ დიახ | 301 redirect |
| `/page?sort=asc` vs `/page` | ✅ დიახ | canonical |

### 🎯 3-საფეხურიანი დაცვა

#### საფეხური 1: Hreflang Clusters (მულტი-ენა)

```html
<!-- ყველა ენის გვერდზე იდენტური cluster -->
<link rel="alternate" hreflang="ka" href="https://site.com/ka/..." />
<link rel="alternate" hreflang="en" href="https://site.com/en/..." />
<link rel="alternate" hreflang="ru" href="https://site.com/ru/..." />
<link rel="alternate" hreflang="de" href="https://site.com/de/..." />
<link rel="alternate" hreflang="tr" href="https://site.com/tr/..." />
<link rel="alternate" hreflang="ar" href="https://site.com/ar/..." />
<link rel="alternate" hreflang="x-default" href="https://site.com/en/..." />
```

**წესები (Google + Ahrefs):**
- ✅ **Bidirectional**: თუ A→B, მაშინ B→A აუცილებელია
- ✅ **Self-referencing**: ყველა გვერდი თავის თავსაც შეიცავს
- ✅ **x-default**: fallback ენა მომხმარებლებისთვის
- ✅ **Absolute URLs**: მხოლოდ სრული URL-ები
- ✅ **Consistent**: ყველა გვერდზე იდენტური cluster

#### საფეხური 2: Technical Redirects (301 Permanent)

```typescript
// next.config.ts - ტექნიკური დუბლიკატების აღმოფხვრა
const nextConfig: NextConfig = {
  // Trailing slash consistency
  trailingSlash: false, // ან true, მთავარია თანმიმდევრულობა
  
  async redirects() {
    return [
      // www → non-www (ან პირიქით)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.your-domain.com' }],
        destination: 'https://your-domain.com/:path*',
        permanent: true, // 301
      },
      // Root → Default locale
      {
        source: '/',
        destination: '/ka',
        permanent: true,
      },
      // Old URLs (თუ გაქვთ)
      {
        source: '/old-location/:slug',
        destination: '/ka/locations/georgia/:slug',
        permanent: true,
      },
    ];
  },
};
```

#### საფეხური 3: Canonical + Robots (Query Params)

```typescript
// robots.ts - Query parameters დაბლოკვა
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/*?sort=*',      // ფილტრები
          '/*?filter=*',    // ფილტრები
          '/*?page=*',      // პაგინაცია (თუ არ გსურთ ინდექსაცია)
          '/*?utm_*',       // UTM პარამეტრები
          '/*?ref=*',       // Referral პარამეტრები
        ],
      },
    ],
    sitemap: 'https://your-domain.com/sitemap.xml',
  };
}
```

### 📊 დუბლიკატების მატრიცა (ჩვენი საიტისთვის)

| დუბლიკატის ტიპი | რისკი | გადაწყვეტა | სტატუსი |
|-----------------|-------|------------|---------|
| 6 ენის ვერსია | ❌ არა | hreflang cluster | ⬜ TODO |
| www vs non-www | 🔴 HIGH | 301 redirect | ⬜ TODO |
| http vs https | 🔴 HIGH | 301 redirect (hosting) | ⬜ TODO |
| trailing slash | 🟡 MEDIUM | trailingSlash config | ⬜ TODO |
| Query params | 🟡 MEDIUM | robots.txt disallow | ⬜ TODO |
| Pagination | 🟢 LOW | canonical → page 1 | ⬜ TODO |

### 🧪 ვალიდაციის ინსტრუმენტები

```
1. Google Search Console → URL Inspection
   - "User-declared canonical" vs "Google-selected canonical"
   - თუ არ ემთხვევა = პრობლემაა

2. Ahrefs Site Audit → Localization Report
   - hreflang errors
   - missing return tags
   - non-canonical hreflang targets

3. Merkle SEO hreflang Validator
   - https://technicalseo.com/tools/hreflang/

4. Hreflang Tags Generator Tool
   - https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/
```

### ⚠️ გავრცელებული შეცდომები (Google-მ შეიძლება იგნორირება)

| შეცდომა | Google-ის რეაქცია |
|---------|-------------------|
| `en_US` ნაცვლად `en-US` (underscore) | 🟡 გაასწორებს |
| `en-UK` ნაცვლად `en-GB` | 🟡 გაასწორებს |
| Self-reference-ის გარეშე | 🟡 იმუშავებს, მაგრამ bad practice |
| Relative URLs | 🔴 იგნორირება |
| Missing return tags | 🔴 იგნორირება |
| Non-canonical hreflang target | 🔴 კონფლიქტი |

### ⛔ არასოდეს გააკეთოთ: IP/Geo-based Auto-Redirect

```
❌ არასწორი მიდგომა:
მომხმარებელი საქართველოდან → ავტომატური redirect → /ka/...
Google crawler (USA) → ვერ ხედავს ქართულ ვერსიას

📖 Google-ის ოფიციალური პოზიცია:
"Do not use IP analysis to adapt your content. Google may not 
be able to crawl variations of your site properly."
                    — developers.google.com

✅ სწორი მიდგომა:
1. არ გააკეთოთ auto-redirect
2. აჩვენეთ მცირე banner-ი: "გსურთ ქართულ ვერსიაზე გადასვლა?"
3. მომხმარებელმა თავად აირჩიოს
4. შეინახეთ არჩევანი cookie-ში
```

**სწორი Language Selector Banner:**
```tsx
// components/LanguageSuggestionBanner.tsx
export function LanguageSuggestionBanner({ 
  detectedLocale, 
  currentLocale 
}: Props) {
  if (detectedLocale === currentLocale) return null;
  
  return (
    <div className="fixed bottom-4 left-4 bg-white shadow-lg rounded-lg p-4 max-w-sm">
      <p>გსურთ საიტის ნახვა {localeNames[detectedLocale]} ენაზე?</p>
      <div className="flex gap-2 mt-2">
        <Link href={`/${detectedLocale}${pathname}`}>
          დიახ, გადავიდე
        </Link>
        <button onClick={dismiss}>
          არა, დავრჩე
        </button>
      </div>
    </div>
  );
}
```

---

## 1. პროექტის SEO აუდიტი

### ✅ რა გვაქვს უკვე:

| კომპონენტი | სტატუსი | კომენტარი |
|------------|---------|-----------|
| Metadata API | ✅ | `generateMetadata` გამოყენებულია location/country გვერდებზე |
| Open Graph | ✅ | OG tags იმპლემენტირებულია |
| Twitter Cards | ✅ | Summary Large Image კარტები |
| Localized Slugs | ✅ | 6 ენაზე (ka, en, ru, ar, de, tr) |
| Dynamic Routes | ✅ | `[locale]/[country]/[location]` |
| Structured Data | ❌ | არ გვაქვს JSON-LD schema |
| Sitemap | ❌ | არ გვაქვს sitemap.xml |
| Robots.txt | ❌ | არ გვაქვს robots.txt |
| Canonical URLs | ❌ | არ გვაქვს canonical tags |
| Alternate Links | ❌ | hreflang ალტერნატივები |
| Static Generation | ❌ | generateStaticParams არ გვაქვს |

### ⚠️ კრიტიკული პრობლემები:

1. **Root Layout** - `lang="ka"` hardcoded არის, უნდა იყოს დინამიური
2. **sitemap.xml არ არსებობს** - Google ვერ პოულობს ყველა გვერდს
3. **robots.txt არ არსებობს** - Crawling კონტროლი არ გვაქვს
4. **JSON-LD Schema არ არის** - Rich Snippets არ გვაქვს Google-ში
5. **Canonical URLs არ არის** - დუპლიკატი კონტენტის რისკი

---

## 2. URL/Slug სისტემის ანალიზი

### მიმდინარე URL სტრუქტურა:

```
/                           → მთავარი (redirect to /ka)
/[locale]                   → ენის მთავარი გვერდი
/[locale]/locations         → ყველა ლოკაცია
/[locale]/locations/[country]         → ქვეყნის გვერდი
/[locale]/locations/[country]/[location]  → ლოკაციის გვერდი
/[locale]/about             → შესახებ
/[locale]/contact           → კონტაქტი
/[locale]/bookings          → დაჯავშნა
/[locale]/promotions        → აქციები
/[locale]/login             → შესვლა
/[locale]/register          → რეგისტრაცია
/[locale]/profile           → პროფილი
/[locale]/terms             → წესები და პირობები
/[locale]/privacy           → კონფიდენციალურობა
```

### ✅ დადებითი მხარეები:

1. **ლოკალიზებული URL-ები** - კარგია SEO-სთვის
   - `/ka/locations/sakartvelo/gudauri` (ქართული)
   - `/en/locations/georgia/gudauri` (ინგლისური)
   - `/ru/locations/gruzia/gudauri` (რუსული)

2. **სემანტიკური იერარქია** - გასაგები სტრუქტურა
   - ენა → კატეგორია → ქვეყანა → ლოკაცია

3. **მოკლე და გასაგები** - user-friendly URLs

### ⚠️ გასაუმჯობესებელი:

| პრობლემა | მიმდინარე | რეკომენდაცია |
|----------|-----------|--------------|
| www vs non-www | არ არის კონფიგურირებული | მკაცრი redirect |
| Trailing slashes | არ არის სტანდარტი | ერთიანი სტანდარტი |
| Locale default | redirect ხდება | უკეთესი handling |

### 📊 რეკომენდებული URL Patterns:

```typescript
// ოპტიმალური URL სტრუქტურა ბიზნესისთვის:

// ვარიანტი A: მიმდინარე (კარგია)
/ka/locations/sakartvelo/tbilisi

// ვარიანტი B: უფრო მოკლე (გასათვალისწინებელი)
/ka/sakartvelo/tbilisi
/ka/paragliding-tbilisi

// რეკომენდაცია: დარჩით ვარიანტი A-ზე, 
// რადგან `/locations` სეგმენტი semantic value აქვს
```

---

## 3. რეკომენდაციები და გეგმა

### 🎯 პრიორიტეტი 1: კრიტიკული (დაუყოვნებლივ)

#### 3.1 Self-Referencing Canonical + Hreflang (ყველაზე მნიშვნელოვანი!)

> ⚠️ **Google-ის ოფიციალური რეკომენდაცია**: მულტი-ენოვანი საიტებისთვის ყველა გვერდი უნდა იყოს კანონიკური (self-referencing) და hreflang-ით დაკავშირებული.

**რატომ არის ეს საუკეთესო არჩევანი:**

1. **ყველა ენა ინდექსდება** - Google ცალ-ცალკე დააინდექსებს ყველა ენის ვერსიას
2. **სწორი შედეგები** - ქართველ მომხმარებელს ქართული გვერდი გამოუჩნდება, რუსს - რუსული
3. **არ არის დუპლიკატი** - hreflang Google-ს ეუბნება რომ ეს სხვადასხვა ენის ვერსიებია, არა დუპლიკატები
4. **Google-ის პრეფერენცია** - "Google prefers URLs in hreflang clusters" (ოფიციალური დოკუ)

**როგორ მუშაობს:**

```
/ka/locations/sakartvelo/gudauri  →  canonical: საკუთარ თავზე
/en/locations/georgia/gudauri    →  canonical: საკუთარ თავზე  
/ru/locations/gruzia/gudauri     →  canonical: საკუთარ თავზე
        ↓ ↓ ↓
    ყველა დაკავშირებულია hreflang-ით
        ↓ ↓ ↓
    ყველა ინდექსდება Google-ში ✅
```

**HTML შედეგი ყველა გვერდზე:**

```html
<!-- /ka/locations/sakartvelo/gudauri გვერდზე: -->
<head>
  <!-- Self-referencing canonical -->
  <link rel="canonical" href="https://site.com/ka/locations/sakartvelo/gudauri" />
  
  <!-- Hreflang cluster - ყველა ენის ვერსია -->
  <link rel="alternate" hreflang="ka" href="https://site.com/ka/locations/sakartvelo/gudauri" />
  <link rel="alternate" hreflang="en" href="https://site.com/en/locations/georgia/gudauri" />
  <link rel="alternate" hreflang="ru" href="https://site.com/ru/locations/gruzia/gudauri" />
  <link rel="alternate" hreflang="de" href="https://site.com/de/locations/georgien/gudauri" />
  <link rel="alternate" hreflang="tr" href="https://site.com/tr/locations/gurcistan/gudauri" />
  <link rel="alternate" hreflang="ar" href="https://site.com/ar/locations/georgia/gudauri" />
  
  <!-- x-default: fallback ენისთვის რომელიც არ არის მხარდაჭერილი -->
  <link rel="alternate" hreflang="x-default" href="https://site.com/en/locations/georgia/gudauri" />
</head>
```

**Next.js იმპლემენტაცია:**

```typescript
// app/[locale]/locations/[country]/[location]/page.tsx

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, location } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
  
  // Fetch all localized slugs
  const slugs = await getLocalizedSlugs(location);
  
  return {
    // ... title, description, openGraph ...
    
    alternates: {
      // ✅ Self-referencing canonical
      canonical: `${baseUrl}/${locale}/locations/${country}/${location}`,
      
      // ✅ Hreflang for all languages
      languages: {
        'ka': `${baseUrl}/ka/locations/${slugs.country_ka}/${slugs.location_ka}`,
        'en': `${baseUrl}/en/locations/${slugs.country_en}/${slugs.location_en}`,
        'ru': `${baseUrl}/ru/locations/${slugs.country_ru}/${slugs.location_ru}`,
        'de': `${baseUrl}/de/locations/${slugs.country_de}/${slugs.location_de}`,
        'tr': `${baseUrl}/tr/locations/${slugs.country_tr}/${slugs.location_tr}`,
        'ar': `${baseUrl}/ar/locations/${slugs.country_ar}/${slugs.location_ar}`,
        'x-default': `${baseUrl}/en/locations/${slugs.country_en}/${slugs.location_en}`,
      },
    },
  };
}
```

**მნიშვნელოვანი წესები (Google-დან):**

| წესი | აღწერა |
|------|--------|
| **Bidirectional linking** | თუ A→B, მაშინ B→A აუცილებელია |
| **Self-reference** | ყველა გვერდი თავის თავსაც უნდა შეიცავდეს hreflang-ში |
| **x-default** | fallback ენა მომხმარებლებისთვის რომელთა ენა არ არის მხარდაჭერილი |
| **Absolute URLs** | მხოლოდ სრული URL-ები: `https://site.com/...` |
| **Correct codes** | ISO 639-1 (ენა) + ISO 3166-1 Alpha 2 (რეგიონი) |

---

#### 3.2 Sitemap.xml შექმნა (with Hreflang Annotations)

> **Best Practice**: Sitemap-ში hreflang დამატება უკეთესია ვიდრე HTML-ში, რადგან:
> 1. ერთ ფაილში მართავთ ყველაფერს
> 2. არ ამძიმებს HTML-ს
> 3. Google-ისთვის უფრო ეფექტურია

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { locales, Locale } from '@/lib/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  
  // Static pages with hreflang
  const staticPages = ['', '/about', '/contact', '/locations', '/promotions'];
  
  const staticUrls = staticPages.flatMap(page => 
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.8,
      // ✅ Hreflang in sitemap (Best Practice!)
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map(l => [l, `${baseUrl}/${l}${page}`])
          ),
          'x-default': `${baseUrl}/en${page}`, // English as fallback
        },
      },
    }))
  );

  // Dynamic location pages from Supabase
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id,
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      updated_at,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      )
    `);
  
  const locationUrls = locations?.flatMap(loc => 
    locales.map(locale => {
      const localeKey = `slug_${locale}` as keyof typeof loc;
      const countryLocaleKey = `slug_${locale}` as keyof typeof loc.countries;
      
      return {
        url: `${baseUrl}/${locale}/locations/${loc.countries[countryLocaleKey]}/${loc[localeKey]}`,
        lastModified: new Date(loc.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        // ✅ Hreflang for each location
        alternates: {
          languages: {
            ...Object.fromEntries(
              locales.map(l => {
                const lKey = `slug_${l}` as keyof typeof loc;
                const cKey = `slug_${l}` as keyof typeof loc.countries;
                return [l, `${baseUrl}/${l}/locations/${loc.countries[cKey]}/${loc[lKey]}`];
              })
            ),
            'x-default': `${baseUrl}/en/locations/${loc.countries.slug_en}/${loc.slug_en}`,
          },
        },
      };
    })
  ) || [];

  // Country pages
  const { data: countries } = await supabase
    .from('countries')
    .select('slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar, updated_at');

  const countryUrls = countries?.flatMap(country =>
    locales.map(locale => {
      const localeKey = `slug_${locale}` as keyof typeof country;
      return {
        url: `${baseUrl}/${locale}/locations/${country[localeKey]}`,
        lastModified: new Date(country.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        alternates: {
          languages: {
            ...Object.fromEntries(
              locales.map(l => {
                const lKey = `slug_${l}` as keyof typeof country;
                return [l, `${baseUrl}/${l}/locations/${country[lKey]}`];
              })
            ),
            'x-default': `${baseUrl}/en/locations/${country.slug_en}`,
          },
        },
      };
    })
  ) || [];

  return [...staticUrls, ...countryUrls, ...locationUrls];
}
```

**შედეგი (sitemap.xml):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://site.com/ka/locations/sakartvelo/gudauri</loc>
    <lastmod>2025-11-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="ka" 
                href="https://site.com/ka/locations/sakartvelo/gudauri"/>
    <xhtml:link rel="alternate" hreflang="en" 
                href="https://site.com/en/locations/georgia/gudauri"/>
    <xhtml:link rel="alternate" hreflang="ru" 
                href="https://site.com/ru/locations/gruzia/gudauri"/>
    <xhtml:link rel="alternate" hreflang="de" 
                href="https://site.com/de/locations/georgien/gudauri"/>
    <xhtml:link rel="alternate" hreflang="tr" 
                href="https://site.com/tr/locations/gurcistan/gudauri"/>
    <xhtml:link rel="alternate" hreflang="ar" 
                href="https://site.com/ar/locations/georgia/gudauri"/>
    <xhtml:link rel="alternate" hreflang="x-default" 
                href="https://site.com/en/locations/georgia/gudauri"/>
  </url>
  <!-- ... მეორდება ყველა ენისა და ლოკაციისთვის -->
</urlset>
```

#### 3.2 Robots.txt შექმნა (დუბლიკატების პრევენცია)

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Private/Auth pages
          '/api/',
          '/auth/',
          '/cms/',
          '/profile/',
          '/user/',
          '/admin/',
          '/login',
          '/register',
          '/forgot-password',
          
          // ✅ Query parameters (დუბლიკატების პრევენცია!)
          '/*?sort=*',
          '/*?filter=*',
          '/*?order=*',
          '/*?page=*',        // თუ პაგინაცია canonical-ით არ არის დაცული
          '/*?utm_*',         // Marketing parameters
          '/*?ref=*',
          '/*?fbclid=*',
          '/*?gclid=*',
          '/*?mc_*',
          
          // Preview/Draft content
          '/*?preview=*',
          '/*?draft=*',
        ],
      },
      // Googlebot-specific rules (optional)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/auth/', '/cms/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
```

**შედეგი (robots.txt):**
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /cms/
Disallow: /*?sort=*
Disallow: /*?utm_*
...

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /cms/

Sitemap: https://your-domain.com/sitemap.xml
Host: https://your-domain.com
```

#### 3.3 JSON-LD Structured Data

```typescript
// components/seo/JsonLd.tsx
export function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          "name": "Paragliding Georgia",
          "description": "Professional paragliding tandem flights in Georgia",
          "url": "https://your-domain.com",
          "image": "https://your-domain.com/og-image.jpg",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "GE",
            "addressLocality": "Tbilisi"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 41.7151,
            "longitude": 44.8271
          },
          "priceRange": "$$",
          "telephone": "+995-XXX-XXX-XXX",
          "sameAs": [
            "https://facebook.com/yourpage",
            "https://instagram.com/yourpage"
          ]
        }),
      }}
    />
  );
}

export function LocationJsonLd({ location, country, locale }: LocationJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          "name": location.name,
          "description": location.description,
          "image": location.og_image_url,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": country.code,
            "addressRegion": location.name
          },
          "aggregateRating": location.cached_rating ? {
            "@type": "AggregateRating",
            "ratingValue": location.cached_rating,
            "reviewCount": location.cached_rating_count
          } : undefined,
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "GEL",
            "lowPrice": location.min_price,
            "offerCount": location.flight_types_count
          }
        }),
      }}
    />
  );
}

// ✅ განახლებული - ბაზის ველების გამოყენებით:
export function LocationJsonLdFromDB({ 
  location, 
  country, 
  locale 
}: { 
  location: Database['public']['Tables']['locations']['Row'];
  country: Database['public']['Tables']['countries']['Row'];
  locale: string;
}) {
  const name = location[`name_${locale}` as keyof typeof location] || location.name_en;
  const description = location[`seo_description_${locale}` as keyof typeof location] || location.seo_description_en;
  const countryName = country[`name_${locale}` as keyof typeof country] || country.name_en;

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": name,
    "description": description,
    "image": location.og_image_url,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE", // ISO code
      "addressRegion": countryName,
      "addressLocality": name
    },
    // ✅ Rating from cached_rating fields
    ...(location.cached_rating && location.cached_rating_count > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": Number(location.cached_rating).toFixed(1),
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": location.cached_rating_count
      }
    }),
    // ✅ Additional location-specific data
    ...(location.altitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "elevation": location.altitude
      }
    }),
    // ✅ Best season info
    ...(location.best_season_start && location.best_season_end && {
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "description": `Best season: Month ${location.best_season_start} to ${location.best_season_end}`
      }
    }),
    // ✅ Difficulty level
    ...(location.difficulty_level && {
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "Difficulty Level",
        "value": location.difficulty_level
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        }),
      }}
    />
  );
}

// ✅ SportsActivityLocation Schema - პარაგლაიდინგისთვის სპეციფიკური
export function ParaglidingActivityJsonLd({ 
  location, 
  country,
  locale 
}: { 
  location: Database['public']['Tables']['locations']['Row'];
  country: Database['public']['Tables']['countries']['Row'];
  locale: string;
}) {
  const name = location[`name_${locale}` as keyof typeof location] || location.name_en;
  const countryName = country[`name_${locale}` as keyof typeof country] || country.name_en;
  const description = location[`seo_description_${locale}` as keyof typeof location] || location.seo_description_en;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": `${name} - Paragliding`,
    "description": description,
    "image": location.og_image_url,
    "sport": "Paragliding",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE",
      "addressRegion": countryName,
      "addressLocality": name
    },
    ...(location.altitude && {
      "maximumAttendeeCapacity": location.altitude, // as elevation indicator
      "geo": {
        "@type": "GeoCoordinates",
        "elevation": `${location.altitude}m`
      }
    }),
    ...(location.cached_rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": Number(location.cached_rating).toFixed(1),
        "bestRating": "5",
        "reviewCount": location.cached_rating_count
      }
    }),
    // ✅ Difficulty as amenity feature
    "amenityFeature": [
      ...(location.difficulty_level ? [{
        "@type": "LocationFeatureSpecification",
        "name": "Difficulty Level",
        "value": location.difficulty_level
      }] : []),
      ...(location.altitude ? [{
        "@type": "LocationFeatureSpecification", 
        "name": "Launch Altitude",
        "value": `${location.altitude}m`
      }] : [])
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ✅ LocalBusiness Schema - თუ ადგილობრივ ბიზნესად გსურთ
export function LocalBusinessJsonLd({ businessName, locale }: { businessName: string; locale: string }) {
  const descriptions: Record<string, string> = {
    ka: 'საქართველოში პარაგლაიდინგის საუკეთესო ადგილების პლატფორმა',
    en: 'Best paragliding locations platform in Georgia',
    ru: 'Лучшая платформа для параглайдинга в Грузии',
    de: 'Beste Gleitschirmfliegen-Standorte Plattform in Georgien',
    tr: 'Gürcistan\'da en iyi yamaç paraşütü platformu',
    ar: 'أفضل منصة لمواقع الطيران المظلي في جورجيا'
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency", // or "LocalBusiness"
    "name": businessName,
    "description": descriptions[locale] || descriptions.en,
    "url": `https://your-domain.com/${locale}`,
    "logo": "https://your-domain.com/logo.png",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE"
    },
    "sameAs": [
      "https://www.facebook.com/your-page",
      "https://www.instagram.com/your-page",
      "https://twitter.com/your-page"
    ],
    "inLanguage": [locale, "ka", "en", "ru", "de", "tr", "ar"],
    "areaServed": {
      "@type": "Country",
      "name": "Georgia"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ✅ FAQ Schema - ხშირად დასმული კითხვებისთვის
export function FAQJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ✅ Review Schema - კონკრეტული მიმოხილვებისთვის
export function ReviewJsonLd({ 
  review, 
  locationName 
}: { 
  review: { author: string; rating: number; text: string; date: string };
  locationName: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "TouristAttraction",
      "name": locationName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewBody": review.text,
    "datePublished": review.date
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

#### 3.3.2 JSON-LD გამოყენების მაგალითი Location გვერდზე

```typescript
// app/[locale]/locations/[country]/[location]/page.tsx

import { 
  LocationJsonLdFromDB, 
  BreadcrumbJsonLd, 
  ParaglidingActivityJsonLd,
  ReviewJsonLd 
} from '@/lib/seo/JsonLd';

export default async function LocationPage({ params }: PageProps) {
  const { locale, country: countrySlug, location: locationSlug } = await params;
  
  // ბაზიდან მონაცემების წამოღება
  const supabase = createClient();
  const { data: locationData } = await supabase
    .from('locations')
    .select(`
      *,
      countries!inner(*)
    `)
    .eq(`slug_${locale}`, locationSlug)
    .single();

  const baseUrl = 'https://your-domain.com';
  const breadcrumbItems = [
    { name: 'Home', url: `${baseUrl}/${locale}` },
    { name: 'Locations', url: `${baseUrl}/${locale}/locations` },
    { name: locationData.countries[`name_${locale}`], url: `${baseUrl}/${locale}/locations/${countrySlug}` },
    { name: locationData[`name_${locale}`], url: `${baseUrl}/${locale}/locations/${countrySlug}/${locationSlug}` },
  ];

  return (
    <>
      {/* JSON-LD Schemas - <head>-ში ან <body>-ის დასაწყისში */}
      <LocationJsonLdFromDB 
        location={locationData} 
        country={locationData.countries} 
        locale={locale} 
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ParaglidingActivityJsonLd 
        location={locationData}
        country={locationData.countries}
        locale={locale}
      />
      
      {/* გვერდის კონტენტი */}
      <LocationPageContent location={locationData} locale={locale} />
      
      {/* Review Schemas - თითოეული მიმოხილვისთვის (პირველი 10 საკმარისია) */}
      {locationData.reviews?.slice(0, 10).map(review => (
        <ReviewJsonLd 
          key={review.id}
          review={{
            author: review.user_name,
            rating: review.rating,
            text: review.text,
            date: review.created_at
          }}
          locationName={locationData[`name_${locale}`]}
        />
      ))}
    </>
  );
}
```

#### 3.3.3 Rich Results ტესტირება

```
🔧 Google Rich Results Test:
   https://search.google.com/test/rich-results

🔧 Schema.org Validator:
   https://validator.schema.org/

📋 რა Rich Snippets შეიძლება მივიღოთ:

1. ⭐ Review Stars - AggregateRating-დან
2. 🍞 Breadcrumbs - BreadcrumbList-დან
3. ❓ FAQ Accordion - FAQPage-დან
4. 📍 Location Info - TouristAttraction-დან
```

### 🎯 პრიორიტეტი 2: მნიშვნელოვანი (1 კვირა)

#### 3.4 Canonical URLs და Hreflang

```typescript
// app/[locale]/locations/[country]/[location]/page.tsx

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, location } = await params;
  const baseUrl = 'https://your-domain.com';
  
  // ... existing code ...

  return {
    // ... existing metadata ...
    
    alternates: {
      canonical: `${baseUrl}/${locale}/locations/${country}/${location}`,
      languages: {
        'ka': `${baseUrl}/ka/locations/${slugs.ka.country}/${slugs.ka.location}`,
        'en': `${baseUrl}/en/locations/${slugs.en.country}/${slugs.en.location}`,
        'ru': `${baseUrl}/ru/locations/${slugs.ru.country}/${slugs.ru.location}`,
        'de': `${baseUrl}/de/locations/${slugs.de.country}/${slugs.de.location}`,
        'tr': `${baseUrl}/tr/locations/${slugs.tr.country}/${slugs.tr.location}`,
        'ar': `${baseUrl}/ar/locations/${slugs.ar.country}/${slugs.ar.location}`,
        'x-default': `${baseUrl}/en/locations/${slugs.en.country}/${slugs.en.location}`,
      },
    },
  };
}
```

#### 3.5 Dynamic Lang Attribute

```typescript
// app/layout.tsx - გაასწორეთ:

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale || 'ka'} suppressHydrationWarning>
      {/* ... */}
    </html>
  );
}
```

### 🎯 პრიორიტეტი 3: გაუმჯობესება (2 კვირა)

#### 3.6 Static Generation (ISR)

```typescript
// app/[locale]/locations/[country]/[location]/page.tsx

export async function generateStaticParams() {
  const supabase = createClient();
  const locales = ['ka', 'en', 'ru', 'de', 'tr', 'ar'];
  
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      countries!inner(slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar)
    `);

  return locations?.flatMap(loc => 
    locales.map(locale => ({
      locale,
      country: loc.countries[`slug_${locale}`],
      location: loc[`slug_${locale}`],
    }))
  ) || [];
}

// Revalidate every hour
export const revalidate = 3600;
```

---

## 4. საჭირო ფაილები და ფოლდერები

### 📁 შესაქმნელი ფაილები:

```
app/
├── sitemap.ts              # ✨ NEW - დინამიური sitemap
├── robots.ts               # ✨ NEW - robots.txt
├── manifest.ts             # ✨ NEW - PWA manifest
├── [locale]/
│   ├── layout.tsx          # 🔧 UPDATE - dynamic lang
│   └── opengraph-image.tsx # ✨ NEW - OG image generation
│
components/
├── seo/                    # ✨ NEW FOLDER
│   ├── JsonLd.tsx          # Structured data
│   ├── Breadcrumbs.tsx     # SEO breadcrumbs
│   ├── MetaTags.tsx        # Custom meta tags
│   └── index.ts            # Exports
│
lib/
├── seo/                    # ✨ NEW FOLDER
│   ├── metadata.ts         # Metadata generators
│   ├── schemas.ts          # JSON-LD schemas
│   ├── urls.ts             # URL builders
│   └── constants.ts        # SEO constants
│
public/
├── robots.txt              # Fallback (optional)
├── sitemap.xml             # Generated (optional)
├── favicon.ico             # ✅ EXISTS
├── apple-touch-icon.png    # ✨ NEW
├── android-chrome-192.png  # ✨ NEW
├── android-chrome-512.png  # ✨ NEW
└── site.webmanifest        # ✨ NEW
```

### 📁 ფოლდერის სტრუქტურა:

```
docs/
└── Seo/
    ├── SEO_OPTIMIZATION_GUIDE.md     # ეს დოკუმენტი
    ├── CONTENT_TBILISI_KA.md         # ✅ EXISTS
    ├── CONTENT_GUDAURI_KA.md         # ✅ EXISTS
    ├── CONTENT_GEORGIA_KA.md         # ✅ EXISTS
    ├── SEO_CHECKLIST.md              # ✨ NEW - ჩეკლისტი
    └── KEYWORD_RESEARCH.md           # ✨ NEW - კვლევა
```

---

## 5. იმპლემენტაციის ნაბიჯები

### ფაზა 1: ტექნიკური საფუძველი (3-5 დღე)

| # | დავალება | პრიორიტეტი | სტატუსი |
|---|----------|------------|---------|
| 1 | **Self-Referencing Canonical + Hreflang** | 🔴 CRITICAL | ⬜ |
| 2 | შექმენით `lib/seo/urls.ts` (slugs helper) | 🔴 CRITICAL | ⬜ |

**`lib/seo/urls.ts` - Hreflang Helper ფუნქციები:**

```typescript
// lib/seo/urls.ts
import { createClient } from '@/lib/supabase/server';
import { locales, Locale } from '@/lib/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

interface LocalizedSlugs {
  location: Record<Locale, string>;
  country: Record<Locale, string>;
}

/**
 * Fetches all localized slugs for a location
 * Used for generating hreflang alternates
 */
export async function getLocalizedSlugs(
  locationSlug: string,
  sourceLocale: Locale
): Promise<LocalizedSlugs | null> {
  const supabase = await createClient();
  
  const slugColumn = `slug_${sourceLocale}`;
  
  const { data: location } = await supabase
    .from('locations')
    .select(`
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      )
    `)
    .eq(slugColumn, locationSlug)
    .single();

  if (!location) return null;

  return {
    location: {
      ka: location.slug_ka,
      en: location.slug_en,
      ru: location.slug_ru,
      de: location.slug_de,
      tr: location.slug_tr,
      ar: location.slug_ar,
    },
    country: {
      ka: location.countries.slug_ka,
      en: location.countries.slug_en,
      ru: location.countries.slug_ru,
      de: location.countries.slug_de,
      tr: location.countries.slug_tr,
      ar: location.countries.slug_ar,
    },
  };
}

/**
 * Generates hreflang alternates object for Next.js metadata
 */
export function generateHreflangAlternates(
  slugs: LocalizedSlugs,
  pathTemplate: 'location' | 'country'
): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  locales.forEach(locale => {
    if (pathTemplate === 'location') {
      alternates[locale] = `${baseUrl}/${locale}/locations/${slugs.country[locale]}/${slugs.location[locale]}`;
    } else {
      alternates[locale] = `${baseUrl}/${locale}/locations/${slugs.country[locale]}`;
    }
  });
  
  // x-default = English version
  alternates['x-default'] = alternates['en'];
  
  return alternates;
}

/**
 * Builds canonical URL for current page
 */
export function buildCanonicalUrl(
  locale: Locale,
  path: string
): string {
  return `${baseUrl}/${locale}${path}`;
}
```

| 3 | განაახლეთ location page `generateMetadata` | 🔴 CRITICAL | ⬜ |
| 4 | განაახლეთ country page `generateMetadata` | 🔴 CRITICAL | ⬜ |
| 5 | შექმენით `app/sitemap.ts` (with hreflang) | 🔴 HIGH | ⬜ |
| 6 | შექმენით `app/robots.ts` | 🔴 HIGH | ⬜ |
| 7 | შექმენით `components/seo/JsonLd.tsx` | 🔴 HIGH | ⬜ |
| 8 | გაასწორეთ root layout lang attribute | 🔴 HIGH | ⬜ |

### ფაზა 2: კონტენტ ოპტიმიზაცია (1 კვირა)

| # | დავალება | პრიორიტეტი | სტატუსი |
|---|----------|------------|---------|
| 7 | გადახედეთ ყველა title tags | 🟡 MEDIUM | ⬜ |
| 8 | ოპტიმიზება meta descriptions | 🟡 MEDIUM | ⬜ |
| 9 | H1-H6 hierarchy check | 🟡 MEDIUM | ⬜ |
| 10 | Image alt texts | 🟡 MEDIUM | ⬜ |
| 11 | Internal linking strategy | 🟢 LOW | ⬜ |

### ფაზა 3: Performance (1-2 კვირა)

| # | დავალება | პრიორიტეტი | სტატუსი |
|---|----------|------------|---------|
| 12 | Enable ISR/SSG | 🟡 MEDIUM | ⬜ |
| 13 | Image optimization audit | 🟡 MEDIUM | ⬜ |
| 14 | Core Web Vitals check | 🟡 MEDIUM | ⬜ |
| 15 | Mobile responsiveness audit | 🟢 LOW | ⬜ |

### ფაზა 4: მონიტორინგი (მუდმივი)

| # | დავალება | პრიორიტეტი | სტატუსი |
|---|----------|------------|---------|
| 16 | Google Search Console setup | 🔴 HIGH | ⬜ |
| 17 | Google Analytics 4 setup | 🟡 MEDIUM | ⬜ |
| 18 | Bing Webmaster Tools | 🟢 LOW | ⬜ |
| 19 | Schema validation | 🟢 LOW | ⬜ |

---

## 6. Technical SEO ჩეკლისტი

### 6.1 Metadata ჩეკლისტი

```typescript
// ოპტიმალური metadata template:

export async function generateMetadata(): Promise<Metadata> {
  return {
    // ✅ Title: 50-60 სიმბოლო, keyword წინ
    title: 'პარაპლანით ფრენა გუდაურში | Paragliding Georgia',
    
    // ✅ Description: 150-160 სიმბოლო, CTA-ით
    description: 'გუდაურში პარაპლანით ფრენა 150₾-დან. უსაფრთხო ტანდემ ფრენები პროფესიონალ პილოტებთან. დაჯავშნე ახლავე!',
    
    // ✅ Keywords (არ არის რანჟირების ფაქტორი, მაგრამ სასარგებლოა)
    keywords: ['პარაპლანი', 'გუდაური', 'ტანდემ ფრენა', 'paragliding gudauri'],
    
    // ✅ Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // ✅ Open Graph
    openGraph: {
      title: 'პარაპლანით ფრენა გუდაურში',
      description: '...',
      url: 'https://your-domain.com/ka/locations/georgia/gudauri',
      siteName: 'Paragliding Georgia',
      locale: 'ka_GE',
      type: 'website',
      images: [{
        url: '/og/gudauri.jpg',
        width: 1200,
        height: 630,
        alt: 'პარაპლანით ფრენა გუდაურის თავზე',
      }],
    },
    
    // ✅ Twitter
    twitter: {
      card: 'summary_large_image',
      title: 'პარაპლანით ფრენა გუდაურში',
      description: '...',
      images: ['/og/gudauri.jpg'],
    },
    
    // ✅ Alternates (ძალიან მნიშვნელოვანი!)
    alternates: {
      canonical: 'https://your-domain.com/ka/locations/georgia/gudauri',
      languages: {
        'ka': 'https://your-domain.com/ka/locations/sakartvelo/gudauri',
        'en': 'https://your-domain.com/en/locations/georgia/gudauri',
        'ru': 'https://your-domain.com/ru/locations/gruzia/gudauri',
        'x-default': 'https://your-domain.com/en/locations/georgia/gudauri',
      },
    },
    
    // ✅ Verification
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
    },
  };
}
```

### 6.2 URL Best Practices

```
✅ კარგი URL-ები:
/ka/locations/sakartvelo/gudauri
/en/locations/georgia/gudauri
/ka/bookings

❌ ცუდი URL-ები:
/location?id=123
/page/1/2/3/4/gudauri
/ka/locations/საქართველო/გუდაური (Unicode slugs - ზოგჯერ პრობლემურია)
```

### 6.3 Image SEO

```typescript
// ✅ ოპტიმალური Image კომპონენტი:
<Image
  src="/images/gudauri-paragliding.webp"
  alt="პარაპლანით ფრენა გუდაურში - პანორამული ხედი კავკასიონის მთებზე"
  width={1200}
  height={630}
  priority // LCP image-სთვის
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## 7. Content SEO რეკომენდაციები

### 7.1 Title Tag ფორმულები

```
ლოკაციის გვერდი:
"[Activity] [Location]-ში | [Brand]"
→ "პარაპლანით ფრენა გუდაურში | Paragliding Georgia"

ქვეყნის გვერდი:
"[Activity] [Country]-ში - [Count] ლოკაცია | [Brand]"
→ "პარაპლანით ფრენა საქართველოში - 5 ლოკაცია | Paragliding Georgia"

მთავარი:
"[Brand] - [Tagline]"
→ "Paragliding Georgia - ტანდემ ფრენები საქართველოში"
```

### 7.2 Meta Description Templates

```
ლოკაციის გვერდი (160 სიმბოლომდე):
"[Location]-ში პარაპლანით ფრენა [Price]-დან. [Unique Selling Point]. [CTA]!"
→ "გუდაურში პარაპლანით ფრენა 150₾-დან. 2200მ სიმაღლიდან კავკასიონის თვალწარმტაცი ხედები. დაჯავშნე ახლავე!"

ქვეყნის გვერდი:
"[Country]-ში პარაპლანით ფრენა [Count] ლოკაციიდან. [Brief description]. [CTA]!"
→ "საქართველოში პარაპლანით ფრენა 5 საუკეთესო ლოკაციიდან. გუდაური, თბილისი, სვანეთი და სხვა. შეარჩიე შენი თავგადასავალი!"
```

### 7.3 H1-H6 Hierarchy

```html
<!-- ლოკაციის გვერდის სწორი სტრუქტურა: -->
<h1>პარაპლანით ფრენა გუდაურში - თავგადასავალი კავკასიონის თავზე</h1>
  <h2>რატომ გუდაური?</h2>
    <h3>უნიკალური გეოგრაფია</h3>
    <h3>იდეალური ამინდი</h3>
  <h2>ფრენის პაკეტები და ფასები</h2>
    <h3>სტანდარტული ფრენა</h3>
    <h3>პრემიუმ ფრენა</h3>
  <h2>გალერეა</h2>
  <h2>მომხმარებლების შეფასებები</h2>
  <h2>როგორ დაჯავშნო?</h2>
```

### 7.4 Keyword Strategy

```
Primary Keywords (მთავარი):
- პარაპლანით ფრენა საქართველოში
- paragliding georgia
- ტანდემ ფრენა

Secondary Keywords (მეორეული):
- პარაპლანი გუდაურში
- პარაპლანის ფასი
- paragliding tbilisi
- თბილისში პარაპლანით ფრენა

Long-tail Keywords:
- რამდენი ღირს პარაპლანით ფრენა გუდაურში
- საუკეთესო ადგილი პარაპლანისთვის საქართველოში
- პარაპლანით ფრენა თბილისის მახლობლად
```

---

## 8. Performance და Core Web Vitals

### 8.1 Core Web Vitals მეტრიკები

| მეტრიკა | კარგი | საჭიროებს გაუმჯობესებას | ცუდი |
|---------|-------|-------------------------|------|
| LCP (Largest Contentful Paint) | ≤2.5s | 2.5s-4s | >4s |
| INP (Interaction to Next Paint) | ≤200ms | 200ms-500ms | >500ms |
| CLS (Cumulative Layout Shift) | ≤0.1 | 0.1-0.25 | >0.25 |

### 8.2 Next.js ოპტიმიზაციები

```typescript
// next.config.ts გაუმჯობესებები:

const nextConfig: NextConfig = {
  // ✅ Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // ✅ Compression
  compress: true,
  
  // ✅ Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // ✅ Redirects for SEO
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ka',
        permanent: true,
      },
      {
        source: '/locations/:path*',
        destination: '/ka/locations/:path*',
        permanent: true,
      },
    ];
  },
};
```

### 8.3 Image Optimization Checklist

```
✅ გამოიყენეთ WebP/AVIF ფორმატი
✅ გამოიყენეთ responsive sizes
✅ დაამატეთ width/height (CLS prevention)
✅ გამოიყენეთ priority LCP images-ზე
✅ გამოიყენეთ blur placeholder
✅ Lazy load below-the-fold images
```

---

## 9. მონიტორინგი და ინსტრუმენტები

### 9.1 აუცილებელი ინსტრუმენტები

| ინსტრუმენტი | მიზანი | პრიორიტეტი |
|-------------|--------|------------|
| Google Search Console | Indexing, Errors, Performance | 🔴 HIGH |
| Google Analytics 4 | Traffic, Behavior | 🔴 HIGH |
| PageSpeed Insights | Core Web Vitals | 🟡 MEDIUM |
| Ahrefs/SEMrush | Keyword tracking | 🟢 LOW |
| Schema Validator | Structured data | 🟢 LOW |

### 9.2 Google Search Console Setup

```
1. გადაამოწმეთ საიტი (DNS/HTML tag/file)
2. დაამატეთ sitemap.xml
3. შეამოწმეთ Coverage report
4. დააყენეთ Performance alerts
5. შეამოწმეთ Mobile Usability
6. შეამოწმეთ Core Web Vitals report
```

### 9.3 რეგულარული აუდიტის ჩეკლისტი

```markdown
## ყოველკვირეული:
- [ ] Search Console errors check
- [ ] New indexed pages review
- [ ] Click/Impression trends

## ყოველთვიური:
- [ ] Core Web Vitals audit
- [ ] Broken links check
- [ ] New content optimization
- [ ] Competitor analysis

## ყოველკვარტალური:
- [ ] Full technical SEO audit
- [ ] Content refresh/update
- [ ] Schema markup review
- [ ] International SEO check
```

---

## 📊 KPI და Success Metrics

### Organic Traffic Goals

| მეტრიკა | 3 თვე | 6 თვე | 12 თვე |
|---------|-------|-------|--------|
| Indexed Pages | 100% | 100% | 100% |
| Organic Traffic | +50% | +150% | +300% |
| Top 10 Keywords | 5 | 15 | 30 |
| Avg. Position | <20 | <10 | <5 |
| CTR | >3% | >5% | >7% |

### Technical Metrics

| მეტრიკა | Target |
|---------|--------|
| LCP | <2.5s |
| INP | <200ms |
| CLS | <0.1 |
| Mobile Score | >90 |
| Desktop Score | >95 |

---

## 🚀 დასკვნა და შემდეგი ნაბიჯები

### დაუყოვნებლად (ეს კვირა):
1. ✨ შექმენით `sitemap.ts`
2. ✨ შექმენით `robots.ts`  
3. 🔧 გაასწორეთ root layout lang
4. 📝 დარეგისტრირდით Google Search Console-ზე

### მოკლევადიანი (2 კვირა):
5. ✨ დაამატეთ JSON-LD schemas
6. ✨ დაამატეთ canonical/hreflang
7. 🔧 Enable ISR for location pages
8. 📊 Core Web Vitals audit

### გრძელვადიანი (1 თვე+):
9. 📝 Content optimization
10. 🔗 Internal linking strategy
11. 📊 Keyword tracking setup
12. 🔄 Regular SEO audits

---

*დოკუმენტი შექმნილია: 2025-11-25*  
*ავტორი: SEO Optimization Guide for Paragliding Georgia*  
*ვერსია: 1.0*

---

## 10. 🔴 კრიტიკული პრობლემები (გამოვლენილი აუდიტის შედეგად)

### 10.1 `app/layout.tsx` - Hardcoded Lang

**პრობლემა:**
```tsx
// ❌ ახლანდელი (არასწორი):
<html lang="ka" suppressHydrationWarning>
```

**რატომ არის პრობლემა:**
- Google Crawler ხედავს `lang="ka"` ყველა გვერდზე, მაშინაც კი როცა `/en/...` გვერდზეა
- Screen readers არასწორად წაიკითხავს კონტენტს
- Bing და სხვა საძიებო სისტემები `lang` ატრიბუტს იყენებენ ენის დასადგენად

**გამოსავალი:**
Root layout-ი ვერ მიიღებს `locale` პარამეტრს, ამიტომ საჭიროა სტრუქტურის ცვლილება:

```tsx
// ვარიანტი 1: გადაიტანეთ <html> app/[locale]/layout.tsx-ში
// app/[locale]/layout.tsx
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {/* ... */}
        {children}
      </body>
    </html>
  );
}

// app/layout.tsx - მხოლოდ providers
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children; // html tag აქ არ უნდა იყოს!
}
```

---

### 10.2 `[locale]/layout.tsx` - 'use client' პრობლემა

**პრობლემა:**
```tsx
// ❌ ახლანდელი:
'use client';
// ...
export async function generateMetadata() // ვერ იმუშავებს!
```

**რატომ არის პრობლემა:**
- Client Component-ში `generateMetadata` არ მუშაობს
- SEO metadata სერვერზე უნდა დაგენერირდეს
- Google Crawler არ შეასრულებს JavaScript-ს metadata-სთვის

**გამოსავალი:**
```tsx
// app/[locale]/layout.tsx - Server Component უნდა იყოს
import { Metadata } from 'next';

// ✅ სწორი - Server Component
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    // ...
  };
}

// Auth logic გაიტანეთ ცალკე Client Component-ში
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  
  return (
    <html lang={locale}>
      <body>
        <AuthProvider> {/* Client Component */}
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### 10.3 არ არსებობს `sitemap.ts` და `robots.ts`

**პრობლემა:**
- Google-ს არ აქვს სრული URL list
- Crawl Budget არაეფექტურად იხარჯება
- Private გვერდები შეიძლება დაინდექსდეს

**სტატუსი:** ⬜ TODO - შესაქმნელია

---

### 10.4 არ არის Canonical და Hreflang

**პრობლემა (location page):**
```tsx
// ❌ ახლანდელი generateMetadata:
return {
  title: seoTitle,
  description: seoDescription,
  openGraph: { ... },
  twitter: { ... },
  // ❌ canonical არ არის!
  // ❌ alternates.languages არ არის!
};
```

**გამოსავალი:**
```tsx
return {
  title: seoTitle,
  description: seoDescription,
  openGraph: { ... },
  twitter: { ... },
  // ✅ დაამატეთ:
  alternates: {
    canonical: `${baseUrl}/${locale}/locations/${country}/${location}`,
    languages: {
      'ka': `${baseUrl}/ka/locations/${slugs.country_ka}/${slugs.location_ka}`,
      'en': `${baseUrl}/en/locations/${slugs.country_en}/${slugs.location_en}`,
      // ... სხვა ენები
      'x-default': `${baseUrl}/en/locations/${slugs.country_en}/${slugs.location_en}`,
    },
  },
};
```

---

### 10.5 `next.config.ts` - არ არის SEO კონფიგურაცია

**ახლანდელი:**
```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { ... },
  // ❌ არ არის: trailingSlash, redirects, headers
};
```

**დასამატებელი:**
```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { ... },
  
  // ✅ SEO კონფიგურაცია:
  trailingSlash: false, // თანმიმდევრულობა
  
  async redirects() {
    return [
      // Root → Default locale
      {
        source: '/',
        destination: '/ka',
        permanent: true,
      },
      // www → non-www (თუ საჭიროა)
      // Old URLs migration
    ];
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
      // Static assets caching
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

---

## 11. 📋 გამოვლენილი SEO ჩეკლისტი

### კრიტიკული (დაბლოკავს ინდექსაციას):

| # | პრობლემა | გავლენა | სტატუსი |
|---|----------|---------|---------|
| 1 | `lang="ka"` hardcoded | 🔴 ყველა ენისთვის არასწორი | ⬜ |
| 2 | `[locale]/layout.tsx` არის Client Component | 🔴 Metadata არ მუშაობს | ⬜ |
| 3 | `sitemap.ts` არ არსებობს | 🔴 Google ვერ პოულობს გვერდებს | ⬜ |
| 4 | `robots.ts` არ არსებობს | 🔴 Private გვერდები ინდექსდება | ⬜ |
| 5 | Canonical URLs არ არის | 🔴 დუბლიკატის რისკი | ⬜ |
| 6 | Hreflang არ არის | 🔴 ენები არ არის დაკავშირებული | ⬜ |

### მნიშვნელოვანი (აუარესებს რანჟირებას):

| # | პრობლემა | გავლენა | სტატუსი |
|---|----------|---------|---------|
| 7 | JSON-LD Schema არ არის | 🟡 Rich Snippets არ გვაქვს | ⬜ |
| 8 | `trailingSlash` არ არის | 🟡 ტექნიკური დუბლიკატები | ⬜ |
| 9 | OG Image არ არის optimized | 🟡 Social sharing სუსტია | ⬜ |
| 10 | Internal linking სუსტია | 🟡 Page Authority არ ნაწილდება | ⬜ |

### რეკომენდებული (გააუმჯობესებს):

| # | პრობლემა | გავლენა | სტატუსი |
|---|----------|---------|---------|
| 11 | `generateStaticParams` არ არის | 🟢 Slower initial load | ⬜ |
| 12 | Breadcrumb Schema არ არის | 🟢 Better SERP display | ⬜ |
| 13 | FAQ Schema (თუ გაქვთ FAQ) | 🟢 Rich results | ⬜ |
| 14 | LocalBusiness Schema | 🟢 Google Maps/Local | ⬜ |

---

## 12. 🛠️ სწრაფი გამოსწორების გეგმა

### დღე 1: კრიტიკული Layout ცვლილებები
```
1. app/layout.tsx → Providers only (no <html>)
2. app/[locale]/layout.tsx → Server Component + <html lang={locale}>
3. შექმენით app/sitemap.ts
4. შექმენით app/robots.ts
```

### დღე 2: Metadata გაუმჯობესება
```
5. Location page → დაამატეთ alternates (canonical + hreflang)
6. Country page → დაამატეთ alternates
7. Static pages → დაამატეთ alternates
```

### დღე 3: კონფიგურაცია
```
8. next.config.ts → trailingSlash, redirects, headers
9. JSON-LD components შექმნა
10. Google Search Console registration
```

---

## 13. 📚 დამატებითი რესურსები

### Google-ის ოფიციალური გაიდები:
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [International SEO](https://developers.google.com/search/docs/specialty/international)
- [Core Web Vitals](https://web.dev/articles/vitals)

### Next.js SEO:
- [generateMetadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)

### ვალიდატორები:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Hreflang Validator](https://technicalseo.com/tools/hreflang/)
- [Schema Validator](https://validator.schema.org/)

---

*ვერსია: 1.1 - დამატებულია კრიტიკული პრობლემების სექცია*  
*განახლებულია: 2025-11-25*
