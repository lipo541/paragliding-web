# 🏢 კომპანიის პროფილის გაფართოება - დეტალური გეგმა

## 📋 მიმოხილვა

ამ გეგმის მიზანია კომპანიებს დაემატოს იგივე ფუნქციონალი რაც აქვთ პილოტებს:
- Cover Image (ჰერო სურათი)
- Gallery Images (ფოტო გალერეა)
- Video URLs (YouTube ვიდეოები)
- QR Code გაზიარება
- შეფასებები და კომენტარები
- პირდაპირი ჯავშანი კომპანიასთან

---

## 🗄️ ფაზა 1: მონაცემთა ბაზის მიგრაცია

### 1.1 ახალი ველების დამატება `companies` ცხრილში

```sql
-- ფაილი: supabase/migrations/YYYYMMDD_company_profile_enhancement.sql

-- 1. Cover Image (ჰერო სურათი პროფილისათვის)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 2. Gallery Images (JSONB ფორმატი როგორც pilots-ში)
-- სტრუქტურა: [{ "url": "...", "caption_ka": "...", "caption_en": "...", "order": 1 }, ...]
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- 3. Video URLs (YouTube ლინკების მასივი)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- 4. კომენტარები
COMMENT ON COLUMN public.companies.cover_image_url IS 'Hero/cover image URL for company profile page';
COMMENT ON COLUMN public.companies.gallery_images IS 'JSON array of gallery images: [{"url": "...", "caption_ka": "...", "caption_en": "...", "order": 1}]';
COMMENT ON COLUMN public.companies.video_urls IS 'Array of YouTube video URLs';
```

### 1.2 რეიტინგის სისტემა კომპანიებისათვის (თუ არ არსებობს)

```sql
-- დამატება ratings ცხრილში company ტიპის მხარდაჭერა
-- რადგან უკვე გვაქვს pilot, location, country, flight_type

-- შეამოწმეთ და დაამატეთ 'company' ratable_type-ში თუ არ არის
ALTER TYPE ratable_type ADD VALUE IF NOT EXISTS 'company';

-- cached_rating და cached_rating_count უკვე დამატებულია 20251217141719 მიგრაციით
```

### 1.3 კომენტარების მხარდაჭერა კომპანიებისათვის

comments ცხრილში უკვე უნდა იყოს commentable_type enum. შევამოწმოთ და დავამატოთ 'company' თუ საჭიროა.

---

## 📁 ფაზა 2: Storage Bucket-ის კონფიგურაცია

### 2.1 არსებული Bucket: `company-logos`
ეს bucket უკვე გამოიყენება ლოგოებისთვის.

### 2.2 ახალი ფოლდერების სტრუქტურა
```
company-logos/
  └── {user_id}/
      ├── logo.{ext}           # ლოგო (არსებული)
      ├── cover.{ext}          # Cover/Hero სურათი
      └── gallery/             # გალერეის სურათები
          ├── {timestamp}-{uuid}.{ext}
          └── ...
```

### 2.3 Storage Policy-ის განახლება
```sql
-- company-logos bucket-ისთვის policies:
-- Read: public (ყველას შეუძლია ნახვა)
-- Write: მხოლოდ კომპანიის მფლობელს (auth.uid() = user_id)
```

---

## 🎨 ფაზა 3: კომპონენტების შექმნა

### 3.1 კომპანიის პროფილის მართვის კომპონენტები

#### 3.1.1 `CompanyGalleryUpload.tsx`
```
components/company/CompanyGalleryUpload.tsx
```
- მსგავსი `PilotGalleryUpload.tsx`-ის
- ფუნქციები:
  - მრავალი სურათის ატვირთვა (drag & drop)
  - სურათების რიგის შეცვლა (drag & drop reorder)
  - სურათის წაშლა
  - Caption-ის რედაქტირება (ka/en)
  - მაქსიმუმ 20 სურათი

#### 3.1.2 `CompanyCoverImageUpload.tsx`
```
components/company/CompanyCoverImageUpload.tsx
```
- მსგავსი `PilotCoverImageUpload.tsx`-ის
- ფუნქციები:
  - Cover სურათის ატვირთვა
  - Preview
  - წაშლა
  - რეკომენდებული ზომა: 1920x600

#### 3.1.3 `CompanyVideoUrls.tsx`
```
components/company/CompanyVideoUrls.tsx
```
- მსგავსი `PilotVideoUrls.tsx`-ის
- ფუნქციები:
  - YouTube URL-ების დამატება
  - Playlist-ის მხარდაჭერა
  - URL-ის ვალიდაცია
  - Embed preview
  - წაშლა და რიგის შეცვლა

### 3.2 კომპანიის საჯარო პროფილის კომპონენტები

#### 3.2.1 `CompanyDetailPage.tsx` (განახლება)
```
components/companyprofilepage/CompanyProfilePage.tsx - განახლება
```
ან ახალი:
```
components/company/CompanyDetailPage.tsx
```

**დასამატებელი სექციები:**
1. **Hero Section** - Cover image + კომპანიის ლოგო
2. **Info Card** - სახელი, რეიტინგი, ვერიფიკაცია, QR
3. **About Section** - აღწერა (მულტი-ენა)
4. **Gallery Section** - Masonry layout ფოტო გალერეა
5. **Videos Section** - YouTube ვიდეოები carousel/grid
6. **Pilots Section** - კომპანიის პილოტების ჩამონათვალი
7. **Locations Section** - სად მუშაობს კომპანია
8. **Rating Section** - შეფასების ღილაკი და სტატისტიკა
9. **Comments Section** - კომენტარების სექცია
10. **Booking Section** - "დაჯავშნა" ღილაკი

### 3.3 კომპანიის Dashboard კომპონენტები

#### 3.3.1 `CompanyProfile.tsx` (კომპანიის პანელი)
```
components/companybottomnav/CompanyProfile.tsx - განახლება
```

**დასამატებელი სექციები:**
- მედია სექცია (Gallery, Cover, Videos)
- QR Code preview
- პროფილის preview ლინკი

---

## 📄 ფაზა 4: Route/Page განახლებები

### 4.1 კომპანიის საჯარო გვერდი
```
app/[locale]/company/[slug]/page.tsx - უკვე არსებობს, განახლება
```

**განახლებები:**
- Cover image-ის მეტადატა
- Gallery images-ის fetch
- Video URLs-ის fetch
- Comments/Ratings integration

### 4.2 კომპანიის Dashboard
```
app/[locale]/cms/page.tsx - კომპანიის პანელი
```

უკვე იყენებს `CompanyProfile.tsx`-ს, განახლება საჭირო.

---

## 🔗 ფაზა 5: API & Data Fetching

### 5.1 კომპანიის მონაცემების fetch განახლება

```typescript
// app/[locale]/company/[slug]/page.tsx-ში
const { data: company } = await supabase
  .from('companies')
  .select(`
    *,
    country:countries(id, name_ka, name_en, slug_ka)
  `)
  .eq('slug_ka', slug)
  .eq('status', 'verified')
  .single();

// ახალი ველები ავტომატურად მოვა: cover_image_url, gallery_images, video_urls
```

### 5.2 რეიტინგის API
- POST `/api/ratings` - უკვე არსებობს, კომპანიისთვის გამოყენება
- რეიტინგის cached მნიშვნელობის განახლება trigger-ით

### 5.3 კომენტარების API
- კომენტარების სისტემა უკვე არსებობს
- დამატება: `commentable_type = 'company'` მხარდაჭერა

---

## 🌍 ფაზა 6: i18n თარგმანები

### 6.1 `companyprofile.json` განახლება

```json
{
  "coverImage": "ქავერ ფოტო",
  "gallery": "ფოტო გალერეა",
  "videos": "ვიდეოები",
  "uploadCover": "ქავერის ატვირთვა",
  "uploadPhotos": "ფოტოების ატვირთვა",
  "addVideo": "ვიდეოს დამატება",
  "youtubeUrl": "YouTube ლინკი",
  "playlistUrl": "Playlist ლინკი",
  "viewAll": "ყველას ნახვა",
  "photoCount": "{count} ფოტო",
  "videoCount": "{count} ვიდეო",
  "bookWithCompany": "დაჯავშნე კომპანიასთან",
  "comments": "კომენტარები",
  "writeComment": "დაწერე კომენტარი",
  "qrCode": "QR კოდი",
  "scanToShare": "სკანირება გასაზიარებლად"
}
```

---

## ✅ ფაზა 7: იმპლემენტაციის რიგი

### ნაბიჯი 1: მონაცემთა ბაზა (1 დღე)
- [ ] მიგრაციის ფაილის შექმნა
- [ ] მიგრაციის გაშვება Supabase-ზე
- [ ] Storage policies განახლება

### ნაბიჯი 2: კომპონენტები - მართვა (2-3 დღე)
- [ ] `CompanyGalleryUpload.tsx`
- [ ] `CompanyCoverImageUpload.tsx`
- [ ] `CompanyVideoUrls.tsx`
- [ ] `CompanyProfile.tsx` განახლება (dashboard)

### ნაბიჯი 3: კომპონენტები - საჯარო (2-3 დღე)
- [ ] `CompanyDetailPage.tsx` ან `CompanyProfilePage.tsx` განახლება
- [ ] Gallery lightbox
- [ ] Video player/embed
- [ ] QR modal
- [ ] Rating integration
- [ ] Comments integration
- [ ] Booking button

### ნაბიჯი 4: Routes & Pages (1 დღე)
- [ ] `app/[locale]/company/[slug]/page.tsx` განახლება
- [ ] Metadata განახლება (OG images, etc.)

### ნაბიჯი 5: i18n (0.5 დღე)
- [ ] თარგმანების დამატება 6 ენაზე

### ნაბიჯი 6: ტესტირება (1 დღე)
- [ ] Upload ფუნქციონალის ტესტი
- [ ] Display ფუნქციონალის ტესტი
- [ ] Mobile responsive ტესტი
- [ ] Rating/Comments ტესტი

---

## 📊 შედარება: პილოტი vs კომპანია

| ფუნქცია | პილოტი | კომპანია (დასამატებელი) |
|---------|--------|------------------------|
| Cover Image | ✅ | 🔲 |
| Gallery Images | ✅ | 🔲 |
| Video URLs | ✅ | 🔲 |
| QR Code | ✅ | ✅ (უკვე აქვს) |
| Rating | ✅ | ✅ (უკვე აქვს) |
| Comments | ✅ | 🔲 |
| Booking | ✅ | 🔲 |
| Share | ✅ | ✅ (უკვე აქვს) |
| Languages | ✅ | ❌ (არ სჭირდება) |
| Locations | ✅ | ✅ (უკვე აქვს) |
| Equipment | ✅ | ❌ (არ სჭირდება) |
| Pilots List | ❌ | ✅ (უკვე აქვს) |

---

## 🗂️ ფაილების სტრუქტურა

```
components/
├── company/                           # კომპანიის კომპონენტები
│   ├── CompanyGalleryUpload.tsx      # 🆕 გალერეის ატვირთვა
│   ├── CompanyCoverImageUpload.tsx   # 🆕 Cover-ის ატვირთვა
│   ├── CompanyVideoUrls.tsx          # 🆕 ვიდეოების მართვა
│   └── CompanyDetailPage.tsx         # 🆕 ან არსებულის განახლება
│
├── companyprofilepage/               # არსებული - განახლება
│   ├── CompanyProfilePage.tsx        # ✏️ განახლება
│   └── components/
│       ├── CompanyHeader.tsx         # ✏️ Cover image დამატება
│       ├── CompanyGallery.tsx        # 🆕 გალერეის ჩვენება
│       ├── CompanyVideos.tsx         # 🆕 ვიდეოების ჩვენება
│       ├── CompanyComments.tsx       # 🆕 კომენტარები
│       └── ...
│
├── companybottomnav/                 # კომპანიის dashboard
│   └── CompanyProfile.tsx            # ✏️ მედია სექცია დამატება
│
supabase/
└── migrations/
    └── YYYYMMDD_company_profile_enhancement.sql  # 🆕

lib/
├── i18n/
│   └── locales/
│       ├── ka/companyprofile.json    # ✏️ განახლება
│       ├── en/companyprofile.json    # ✏️ განახლება
│       └── ...

app/
└── [locale]/
    └── company/
        └── [slug]/
            └── page.tsx              # ✏️ განახლება
```

---

## 🔐 უსაფრთხოება

### Storage RLS
- კომპანიის მფლობელს შეუძლია მხოლოდ საკუთარი ფოლდერის მართვა
- საჯარო read access ვერიფიცირებული კომპანიებისთვის

### Database RLS
- კომპანიის მონაცემების რედაქტირება მხოლოდ მფლობელს
- საჯარო ნახვა მხოლოდ `status = 'verified'`

---

## 📝 შენიშვნები

1. **YouTube Embed**: გამოიყენეთ `youtube-nocookie.com` privacy-enhanced mode
2. **Image Optimization**: Next.js Image კომპონენტი ავტომატურად აოპტიმიზებს
3. **Lazy Loading**: Gallery და Videos lazy load გააკეთეთ
4. **SEO**: Gallery images-ს alt ტექსტი დაამატეთ
5. **Performance**: მძიმე კომპონენტები dynamic import-ით

---

## ⏱️ სავარაუდო დრო

| ფაზა | დრო |
|------|-----|
| Database Migration | 1 დღე |
| Upload Components | 2-3 დღე |
| Public Page Components | 2-3 დღე |
| Routes & Integration | 1 დღე |
| i18n | 0.5 დღე |
| Testing | 1 დღე |
| **სულ** | **7-9 დღე** |

---

**შემდეგი ნაბიჯი**: გსურთ დავიწყოთ იმპლემენტაცია ფაზა 1-დან (Database Migration)?
