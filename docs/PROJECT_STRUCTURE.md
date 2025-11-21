# Paragliding Web - Project Structure & Development Guide

> **პროექტის სრული სტრუქტურა, routing სისტემა, naming conventions და best practices**

---

## 📁 Project Overview

**Paragliding Web** არის Next.js 16 (App Router) აპლიკაცია Supabase backend-ით, რომელიც აგებულია TypeScript-ზე და იყენებს Apple-style glass morphism design system-ს.

### Core Technologies
- **Framework**: Next.js 16.0.1 (React 19.2.0)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 4 (Inline Themes)
- **UI**: Custom Glass Morphism Components
- **Forms**: React Hook Form + Zod
- **i18n**: 6 Languages (ka, en, ru, ar, de, tr)

---

## 🌲 Complete File Tree

```
paragliding-web/
│
├── 📁 app/                          # Next.js App Router
│   ├── favicon.ico
│   ├── globals.css                  # Tailwind imports + custom styles
│   ├── layout.tsx                   # Root layout (fonts, metadata)
│   ├── page.tsx                     # Root redirect to /ka
│   │
│   ├── 📁 [locale]/                 # Locale-based routing
│   │   ├── layout.tsx               # Locale layout (Header, Footer, Providers)
│   │   ├── page.tsx                 # Home page
│   │   │
│   │   ├── 📁 about/               # Static pages
│   │   │   └── page.tsx
│   │   ├── 📁 contact/
│   │   │   └── page.tsx
│   │   ├── 📁 privacy/
│   │   │   └── page.tsx
│   │   ├── 📁 terms/
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 locations/           # Dynamic location routes
│   │   │   ├── page.tsx            # All locations list
│   │   │   └── 📁 [country]/
│   │   │       ├── page.tsx        # Country page
│   │   │       └── 📁 [location]/
│   │   │           └── page.tsx    # Location detail page (SEO)
│   │   │
│   │   ├── 📁 promotions/          # Promotions page
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 bookings/            # User bookings
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 notifications/       # User notifications
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 profile/             # User profile
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 user-promotions/     # User specific promotions
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 login/               # Authentication
│   │   │   └── page.tsx
│   │   ├── 📁 register/
│   │   │   └── page.tsx
│   │   ├── 📁 forgot-password/
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 cms/                 # CMS Dashboard (Super Admin)
│   │   │   └── page.tsx
│   │   │
│   │   └── 📁 user/                # User dashboard placeholder
│   │       └── page.tsx
│   │
│   └── 📁 auth/                     # Supabase auth callback
│       └── 📁 callback/
│           └── route.ts
│
├── 📁 components/                   # React Components (Feature-based)
│   │
│   ├── 📁 ui/                       # Reusable UI primitives
│   │   ├── Button.tsx               # Black/White button variants
│   │   ├── Input.tsx                # Form input with validation
│   │   ├── Spinner.tsx              # Loading spinner
│   │   ├── Toast.tsx                # Toast notifications
│   │   ├── PasswordStrength.tsx     # Password strength indicator
│   │   ├── ConfirmDialog.tsx        # Confirmation modal
│   │   └── index.ts                 # Barrel exports
│   │
│   ├── 📁 header/                   # Header component + sub-components
│   │   ├── Header.tsx
│   │   ├── 📁 authbuttons/
│   │   │   └── AuthButtons.tsx
│   │   ├── 📁 languageswitch/
│   │   │   └── LanguageSwitch.tsx
│   │   ├── 📁 logo/
│   │   │   └── Logo.tsx
│   │   ├── 📁 mobilemenu/
│   │   │   └── MobileMenu.tsx
│   │   ├── 📁 navigation/
│   │   │   └── Navigation.tsx
│   │   ├── 📁 notifications/
│   │   │   └── NotificationBell.tsx
│   │   └── 📁 themetoggle/
│   │       └── ThemeToggle.tsx
│   │
│   ├── 📁 footer/
│   │   └── Footer.tsx
│   │
│   ├── 📁 themechanger/
│   │   └── ThemeProvider.tsx        # next-themes wrapper
│   │
│   ├── 📁 userbottomnav/            # Mobile bottom navigation
│   │   ├── UserBottomNav.tsx
│   │   ├── UserProfile.tsx          # User profile component
│   │   ├── UserBookings.tsx
│   │   ├── UserNotification.tsx
│   │   └── UserPromotions.tsx
│   │
│   ├── 📁 aboutus/
│   │   └── AboutUs.tsx
│   │
│   ├── 📁 contact/
│   │   └── ContactPage.tsx
│   │
│   ├── 📁 login/
│   │   └── LoginForm.tsx
│   │
│   ├── 📁 register/
│   │   └── RegisterForm.tsx
│   │
│   ├── 📁 globallocation/           # All locations grid
│   │   └── GlobalLocations.tsx
│   │
│   ├── 📁 countrypage/              # Country page component
│   │   └── CountryPage.tsx
│   │
│   ├── 📁 locationpage/             # Location detail page
│   │   └── LocationPage.tsx
│   │
│   ├── 📁 bookings/
│   │   └── BookingsPage.tsx
│   │
│   ├── 📁 promotions/
│   │   ├── PromotionPage.tsx
│   │   └── PromoCard.tsx
│   │
│   ├── 📁 rating/                   # Rating & Reviews system
│   │   ├── RatingDisplay.tsx        # Read-only rating stars
│   │   ├── RatingInput.tsx          # Interactive rating input
│   │   └── RatingModal.tsx          # Rating submission modal
│   │
│   ├── 📁 comments/                 # Comments system
│   │   ├── CommentsList.tsx
│   │   ├── CommentItem.tsx
│   │   └── CommentInput.tsx
│   │
│   ├── 📁 shared/                   # Shared components
│   │   └── RichTextEditor.tsx       # TipTap WYSIWYG editor
│   │
│   ├── 📁 session/                  # Session management
│   │   └── [session components]
│   │
│   └── 📁 superadmindashboard/      # CMS Dashboard
│       ├── SuperAdminDashboard.tsx
│       ├── 📁 addcountry/
│       │   ├── AddCountry.tsx
│       │   └── AddCountryPage.tsx
│       ├── 📁 addlocation/
│       │   ├── AddLocationFly.tsx
│       │   └── LocationsList.tsx
│       ├── 📁 bookings/
│       │   └── Bookings.tsx
│       ├── 📁 comments/
│       │   └── Comments.tsx
│       ├── 📁 promocode/
│       │   └── PromoCodeManager.tsx
│       └── 📁 promotions/
│           └── Promotions.tsx
│
├── 📁 lib/                          # Utility libraries
│   │
│   ├── 📁 supabase/                 # Supabase client
│   │   ├── client.ts                # Browser client
│   │   └── SupabaseProvider.tsx     # React context provider
│   │
│   ├── 📁 i18n/                     # Internationalization
│   │   └── config.ts                # Locale configuration
│   │
│   ├── 📁 types/                    # TypeScript types
│   │   └── location.ts              # Location/Country interfaces
│   │
│   ├── 📁 hooks/                    # Custom React hooks
│   │   └── [custom hooks]
│   │
│   └── 📁 validations/              # Zod schemas
│       └── profile.ts               # Profile validation schemas
│
├── 📁 supabase/                     # Supabase configuration
│   │
│   ├── 001_create_profiles.sql     # Initial setup scripts
│   ├── 002_create_super_admin.sql
│   ├── 003_create_countries_and_locations.sql
│   │
│   ├── 📁 migrations/               # Database migrations (27 files)
│   │   ├── 004_create_locations_table.sql
│   │   ├── 005_remove_slug_from_location_pages.sql
│   │   ├── 006_add_content_to_countries.sql
│   │   ├── 007_countries_rls_policies.sql
│   │   ├── 008_storage_countries_rls.sql
│   │   ├── 009_fix_countries_rls.sql
│   │   ├── 010_locations_public_read.sql
│   │   ├── 011_add_video_urls_to_locations.sql
│   │   ├── 012_add_prices_to_existing_flight_types.sql
│   │   ├── 013_create_ratings_system.sql
│   │   ├── 014_create_comments_system.sql
│   │   ├── 015_change_ratable_id_to_text.sql
│   │   ├── 016_add_cached_rating_to_countries.sql
│   │   ├── 017_add_location_details.sql
│   │   ├── 018_fix_ratings_rls_policies.sql
│   │   ├── 019_fix_ratings_trigger_security.sql
│   │   ├── 020_fix_comments_trigger_and_policies.sql
│   │   ├── 021_create_bookings_table.sql
│   │   ├── 022_increment_promo_usage_function.sql
│   │   ├── 023_create_promo_codes.sql
│   │   ├── 024_fix_bookings_rls.sql
│   │   ├── 025_grant_bookings_anon_permissions.sql
│   │   ├── 026_enhance_promo_codes.sql
│   │   ├── 027_add_is_published_to_promo_codes.sql
│   │   └── 027_create_avatars_bucket.sql
│   │
│   └── 📁 functions/                # Supabase Edge Functions
│       └── 📁 create-booking/
│           └── index.ts
│
├── 📁 docs/                         # Documentation
│   ├── DESIGN_SYSTEM.md             # Design system guidelines
│   ├── RATING_AND_COMMENTS_SYSTEM.md
│   ├── SUPABASE_PROVIDER_MIGRATION.md
│   ├── SETUP_USERPROFILE.md
│   ├── USER_PROFILE_COMPONENT.md
│   ├── UPGRADE_SUMMARY.md
│   ├── PROJECT_STRUCTURE.md         # This file
│   └── 📁 Seo/
│       ├── SEO_LOCATION_GEORGIA.md
│       └── SEO_LOCATION_GUDAURI.md
│
├── 📁 __tests__/                    # Jest tests
│   └── booking.test.ts
│
├── 📁 public/                       # Static assets
│   └── [images, fonts, etc.]
│
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
├── eslint.config.mjs                # ESLint config
├── jest.config.js                   # Jest config
├── postcss.config.mjs               # PostCSS config
├── proxy.ts                         # Proxy configuration
├── README.md
└── .env.local                       # Environment variables

```

---

## 🛣️ Routing System

### Next.js App Router Structure

#### 1. **Internationalization (i18n) - Locale-based Routing**

```
/                           → Redirect to /ka
/ka                        → ქართული
/en                        → English
/ru                        → Русский
/ar                        → العربية
/de                        → Deutsch
/tr                        → Türkçe
```

**Implementation**:
```typescript
// lib/i18n/config.ts
export const locales = ['ka', 'en', 'ru', 'ar', 'de', 'tr'] as const;
export const defaultLocale = 'ka' as const;
export type Locale = (typeof locales)[number];
```

**Folder**: `app/[locale]/`
- `[locale]` არის dynamic segment
- ყველა გვერდი locale-ის ქვეშ არის

#### 2. **Static Routes**

```
/{locale}/about              → app/[locale]/about/page.tsx
/{locale}/contact            → app/[locale]/contact/page.tsx
/{locale}/privacy            → app/[locale]/privacy/page.tsx
/{locale}/terms              → app/[locale]/terms/page.tsx
/{locale}/promotions         → app/[locale]/promotions/page.tsx
```

#### 3. **Dynamic Routes - Locations**

```
/{locale}/locations                              → ყველა ლოკაცია
/{locale}/locations/georgia                     → საქართველო (ქვეყანა)
/{locale}/locations/georgia/gudauri             → გუდაური (ლოკაცია)
```

**Folder Structure**:
```
app/[locale]/locations/
├── page.tsx                    # All locations list
└── [country]/
    ├── page.tsx                # Country page
    └── [location]/
        └── page.tsx            # Location detail + SEO metadata
```

**URL Examples**:
- `/ka/locations` - ყველა ლოკაცია
- `/ka/locations/georgia` - საქართველოს გვერდი
- `/ka/locations/georgia/gudauri` - გუდაურის დეტალური გვერდი
- `/en/locations/turkey/oludeniz` - Ölüdeniz location (English)

**Slug Generation**:
- Database-ში ყველა locale-სთვის ცალკე slug: `slug_ka`, `slug_en`, `slug_ru`, etc.
- URL ავტომატურად იქმნება slug-ებიდან

#### 4. **User Routes**

```
/{locale}/login                 → ავტორიზაცია
/{locale}/register              → რეგისტრაცია
/{locale}/forgot-password       → პაროლის აღდგენა
/{locale}/profile               → პროფილი
/{locale}/bookings              → ჯავშნები
/{locale}/notifications         → შეტყობინებები
/{locale}/user-promotions       → აქციები
```

#### 5. **Admin Routes**

```
/{locale}/cms                   → CMS Dashboard (Super Admin only)
```

#### 6. **API Routes**

```
/auth/callback                  → Supabase auth callback (Server Component)
```

### generateMetadata() - SEO

ყველა location page იყენებს Next.js `generateMetadata()` function-ს:

```typescript
// app/[locale]/locations/[country]/[location]/page.tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, location } = await params;
  
  // Fetch from Supabase
  const locationData = await fetchLocationBySlug(location, locale);
  
  return {
    title: locationData.seo_title,
    description: locationData.seo_description,
    openGraph: {
      title: locationData.og_title,
      description: locationData.og_description,
      images: [{ url: locationData.og_image_url }],
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}
```

---

## 🧩 Component Organization

### 1. **Feature-based Structure**

Components დაჯგუფებულია ფუნქციონალობის მიხედვით:

```
components/
├── ui/                  # Reusable primitives
├── header/              # Header + sub-components
├── footer/              # Footer
├── locationpage/        # Location page logic
├── bookings/            # Booking system
├── rating/              # Rating system
└── superadmindashboard/ # CMS components
```

### 2. **Component Hierarchy**

#### **UI Primitives** (`components/ui/`)
- არიან **reusable**, **atomic** კომპონენტები
- არ არიან დამოკიდებული business logic-ზე
- იყენებენ Glass Morphism design system-ს

```typescript
// components/ui/Button.tsx
export const Button = ({ variant, children, ...props }) => {
  const variants = {
    primary: 'bg-foreground text-background',   // Black/White
    danger: 'bg-gradient-to-r from-red-500 to-red-600',
    ghost: 'bg-transparent hover:bg-foreground/5',
  };
  // ...
};
```

#### **Feature Components** (e.g., `components/header/`)
- აერთიანებენ UI primitives-ს
- შეიცავენ sub-components ფოლდერებში
- მთავარი component ფოლდერის root-ში

```
header/
├── Header.tsx              # Main component
├── authbuttons/
│   └── AuthButtons.tsx
├── logo/
│   └── Logo.tsx
└── navigation/
    └── Navigation.tsx
```

#### **Page Components** (e.g., `components/locationpage/`)
- არიან **client components** (`'use client'`)
- იძახებენ Supabase-ს
- მართავენ state-ს
- იყენებენ UI და feature components-ს

```typescript
// components/locationpage/LocationPage.tsx
'use client';

export default function LocationPage({ countrySlug, locationSlug, locale }) {
  const [location, setLocation] = useState(null);
  
  useEffect(() => {
    fetchLocationData();
  }, []);
  
  return (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl">
      {/* Page content */}
    </div>
  );
}
```

### 3. **Naming Conventions**

#### Files & Folders
```
✅ PascalCase for components:      Header.tsx, UserProfile.tsx
✅ camelCase for utilities:        client.ts, config.ts
✅ lowercase for routes:           page.tsx, layout.tsx
✅ kebab-case for slugs:           forgot-password/
```

#### Components
```typescript
// ✅ PascalCase function name matches filename
// components/header/Header.tsx
export default function Header() { ... }

// ✅ Named exports for sub-components
// components/ui/Button.tsx
export const Button = () => { ... };
```

#### Props
```typescript
// ✅ Interface naming: ComponentNameProps
interface UserProfileProps {
  userId: string;
  onUpdate: () => void;
}

export default function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // ...
}
```

#### CSS Classes
```typescript
// ✅ Tailwind utility classes (no custom CSS)
className="bg-white/60 dark:bg-black/40 backdrop-blur-xl"

// ✅ Conditional classes with template literals
className={`px-4 py-2 ${isActive ? 'bg-foreground text-background' : 'bg-transparent'}`}
```

---

## 🗄️ Database Schema (Supabase)

### Main Tables

#### 1. **profiles**
```sql
id              UUID (FK to auth.users)
email           TEXT UNIQUE
full_name       TEXT
role            user_role (USER | SUPER_ADMIN)
avatar_url      TEXT
phone           TEXT
bio             TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 2. **countries**
```sql
id              UUID PRIMARY KEY
name_ka         TEXT
name_en         TEXT (+ ru, ar, de, tr)
slug_ka         TEXT UNIQUE
slug_en         TEXT UNIQUE (+ ru, ar, de, tr)
description_ka  TEXT
description_en  TEXT (+ ru, ar, de, tr)
content         JSONB (rich text)
flag_url        TEXT
hero_image_url  TEXT
is_published    BOOLEAN
cached_avg_rating NUMERIC
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 3. **locations**
```sql
id              UUID PRIMARY KEY
country_id      UUID (FK to countries)
name_ka         TEXT
name_en         TEXT (+ ru, ar, de, tr)
slug_ka         TEXT
slug_en         TEXT (+ ru, ar, de, tr)
description_ka  TEXT
description_en  TEXT (+ ru, ar, de, tr)
latitude        NUMERIC
longitude       NUMERIC
altitude        INTEGER
best_season_start INTEGER (month)
best_season_end   INTEGER (month)
difficulty_level  TEXT
flight_duration   INTEGER (minutes)
content         JSONB (rich text + flight types + images)
video_urls      TEXT[] (YouTube URLs)
is_published    BOOLEAN
cached_avg_rating NUMERIC
seo_title_ka    TEXT (+ en, ru, ar, de, tr)
seo_description_ka TEXT (+ en, ru, ar, de, tr)
og_title_ka     TEXT (+ en, ru, ar, de, tr)
og_description_ka TEXT (+ en, ru, ar, de, tr)
og_image_url    TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 4. **bookings**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to auth.users, nullable)
full_name       TEXT
phone           TEXT
country_id      UUID
country_name    TEXT
location_id     UUID
location_name   TEXT
flight_type_id  TEXT
flight_type_name TEXT
selected_date   DATE
number_of_people INTEGER
contact_method  TEXT (whatsapp | telegram | viber)
promo_code      TEXT
promo_discount  INTEGER
special_requests TEXT
status          TEXT (pending | confirmed | completed | cancelled)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 5. **promo_codes**
```sql
id              UUID PRIMARY KEY
code            TEXT UNIQUE
discount_percent INTEGER
max_uses        INTEGER
current_uses    INTEGER
valid_from      DATE
valid_until     DATE
is_published    BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 6. **ratings**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to auth.users)
ratable_type    TEXT (country | location)
ratable_id      TEXT
rating          INTEGER (1-5)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 7. **comments**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to auth.users)
commentable_type TEXT (country | location)
commentable_id  TEXT
comment_text    TEXT
parent_id       UUID (for replies)
is_approved     BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Storage Buckets

#### 1. **profile-IMG-bucket**
```
Structure:
├── users/
│   ├── {user_id_1}/
│   │   └── 1763723290618.png
│   └── {user_id_2}/
│       └── 1763721536851.jpeg
└── [future roles: admins/, pilots/]
```

**Policies**:
- Public read
- Users can upload/update/delete own avatars only
- Folder: `users/{user_id}/`

#### 2. **countries** (bucket for country images)
- Hero images
- Flag images

---

## 🎨 Styling System

### Tailwind CSS 4 (Inline Themes)

#### Configuration
```typescript
// app/globals.css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  --background: #000000;
  --foreground: #ededed;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

#### Design Tokens
```
bg-background      → White (light) / Black (dark)
text-foreground    → Black (light) / White (dark)

bg-foreground      → Inverted colors (for buttons)
text-background    → Inverted text
```

### Glass Morphism Classes

```tsx
// Main glass card
className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm"

// Hover effect
hover:bg-foreground/5

// Nested section
bg-foreground/5

// Border styles
border-foreground/10   // light border
border-foreground/20   // medium border
```

### Typography Scale (Compact)

```tsx
// Headings
text-2xl font-bold     // Main page title (არა 3xl, არა 4xl!)
text-xl font-bold      // Section title
text-lg font-semibold  // Subsection

// Body
text-sm                // Main text (default)
text-xs                // Helper text, labels

// Spacing
space-y-3              // Between sections (არა 6-8!)
p-4                    // Card padding (არა 6-8!)
```

### Button Variants

```tsx
// Primary (Black or White based on theme)
bg-foreground hover:bg-foreground/90 text-background

// Danger (Red gradient - only exception to black & white rule)
bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700

// Ghost
bg-transparent hover:bg-foreground/5 text-foreground
```

### Animations

```css
/* globals.css */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

---

## 🔐 Authentication & Authorization

### Supabase Auth Flow

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### User Roles

```typescript
type UserRole = 'USER' | 'SUPER_ADMIN';
```

### Protected Routes (Pattern)

```typescript
'use client';

export default function ProtectedPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/ka/login');
        return;
      }
      
      setUser(session.user);
    };
    
    checkAuth();
  }, []);

  if (!user) return <Spinner />;

  return <div>Protected content</div>;
}
```

---

## 📝 Form Handling

### React Hook Form + Zod Pattern

```typescript
// lib/validations/profile.ts
import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9\s()-]+$/).optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

```typescript
// Component
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormData } from '@/lib/validations/profile';

export default function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('full_name')}
        label="სრული სახელი"
        error={errors.full_name?.message}
      />
      <Button type="submit">შენახვა</Button>
    </form>
  );
}
```

---

## 🌍 Internationalization (i18n)

### Current Implementation

- **6 languages**: ka (default), en, ru, ar, de, tr
- **Locale routing**: `app/[locale]/`
- **Database fields**: Every text field has locale variants (e.g., `name_ka`, `name_en`)

### Adding New Language

1. Add to config:
```typescript
// lib/i18n/config.ts
export const locales = ['ka', 'en', 'ru', 'ar', 'de', 'tr', 'fr'] as const;
```

2. Add database columns:
```sql
ALTER TABLE countries ADD COLUMN name_fr TEXT;
ALTER TABLE countries ADD COLUMN slug_fr TEXT;
-- etc.
```

3. Update CMS forms to include new language inputs

---

## 🧪 Testing

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### Test Structure

```typescript
// __tests__/booking.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Booking System', () => {
  it('should create a booking', () => {
    // Test implementation
  });
});
```

---

## 📦 Dependencies Overview

### Core Dependencies
- **next**: 16.0.1 - React framework
- **react**: 19.2.0 - UI library
- **typescript**: 5 - Type safety
- **tailwindcss**: 4 - Styling

### Supabase
- **@supabase/supabase-js**: 2.81.1 - Client library
- **@supabase/ssr**: 0.7.0 - SSR support

### Forms & Validation
- **react-hook-form**: 7.66.1 - Form management
- **zod**: 4.1.12 - Schema validation
- **@hookform/resolvers**: 5.2.2 - Zod resolver

### UI Libraries
- **react-hot-toast**: 2.6.0 - Toast notifications
- **react-phone-number-input**: 3.4.14 - Phone input
- **lucide-react**: 0.553.0 - Icons
- **react-icons**: 5.5.0 - Additional icons
- **next-themes**: 0.4.6 - Theme switching

### Rich Text Editor
- **@tiptap/react**: 3.10.7 - Editor framework
- **@tiptap/starter-kit**: 3.10.7 - Basic extensions
- Plus 10+ TipTap extensions (image, link, youtube, etc.)

### Dev Dependencies
- **@jest/globals**: 30.2.0 - Testing
- **eslint**: 9 - Linting
- **babel-plugin-react-compiler**: 1.0.0 - React Compiler

---

## 🚀 Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Run Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### Run Tests

```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

### Build & Deploy

```bash
npm run build         # Production build
npm start             # Run production server
```

---

## 📋 Best Practices

### 1. **Component Creation**

✅ **DO:**
- Use `'use client'` for client-side components
- Create feature-based folders with sub-components
- Export default for main component, named for utilities
- Use TypeScript interfaces for props

❌ **DON'T:**
- Mix server and client components in same file
- Create giant components (split into smaller ones)
- Use inline styles (use Tailwind)

### 2. **Styling**

✅ **DO:**
- Use glass morphism for cards: `bg-white/60 dark:bg-black/40 backdrop-blur-xl`
- Keep spacing compact: `space-y-3`, `p-4`
- Use small typography: `text-sm`, `text-xs`
- Black & white buttons only (except danger red)

❌ **DON'T:**
- Use blue, green, or other colored buttons
- Use large spacing: `space-y-8`, `p-8`
- Use huge text: `text-3xl`, `text-4xl`
- Add custom CSS (use Tailwind utilities)

### 3. **Data Fetching**

✅ **DO:**
- Use Supabase client in client components
- Handle loading states with `<Spinner />`
- Show error messages with `toast.error()`
- Use RLS policies for security

❌ **DON'T:**
- Fetch data without error handling
- Skip loading states
- Bypass RLS policies

### 4. **Routing**

✅ **DO:**
- Use dynamic routes with `[param]/page.tsx`
- Implement `generateMetadata()` for SEO
- Use locale prefix for all routes: `/{locale}/...`

❌ **DON'T:**
- Hardcode URLs
- Skip SEO metadata
- Create routes outside `[locale]` folder

### 5. **Forms**

✅ **DO:**
- Use React Hook Form + Zod
- Create validation schemas in `lib/validations/`
- Show field errors with `Input` component
- Use toast for success/error messages

❌ **DON'T:**
- Use uncontrolled forms
- Skip validation
- Handle errors silently

---

## 🎯 Quick Reference

### Create New Page

```bash
# 1. Create page file
app/[locale]/my-page/page.tsx

# 2. Create component
components/mypage/MyPage.tsx

# 3. Import in page.tsx
import MyPage from '@/components/mypage/MyPage';
export default function Page() {
  return <MyPage />;
}
```

### Create New Component

```bash
# 1. Create folder and file
components/feature/Feature.tsx

# 2. Add sub-components if needed
components/feature/SubComponent.tsx

# 3. Export
export default function Feature() { ... }
```

### Add Database Migration

```bash
# 1. Create new SQL file
supabase/migrations/028_description.sql

# 2. Write SQL
CREATE TABLE ...

# 3. Run in Supabase Dashboard → SQL Editor
```

### Add Validation Schema

```typescript
// lib/validations/feature.ts
import { z } from 'zod';

export const featureSchema = z.object({
  field: z.string().min(1, 'Required'),
});

export type FeatureFormData = z.infer<typeof featureSchema>;
```

---

## 📚 Additional Documentation

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Complete design guidelines
- [RATING_AND_COMMENTS_SYSTEM.md](./RATING_AND_COMMENTS_SYSTEM.md) - Rating system
- [USER_PROFILE_COMPONENT.md](./USER_PROFILE_COMPONENT.md) - Profile component docs

---

**Last Updated**: November 21, 2025  
**Version**: 1.0.0  
**Maintainer**: Paragliding Web Team
