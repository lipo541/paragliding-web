# LocationPage.tsx Refactoring Plan

## 📋 მიმდინარე მდგომარეობა
- **ფაილი:** `components/locationpage/LocationPage.tsx`
- **ხაზების რაოდენობა:** 1570 lines
- **პრობლემა:** ძალიან დიდი monolithic component

## 🎯 მიზანი
LocationPage.tsx-ის დაშლა მცირე, reusable კომპონენტებად Context API-ის გამოყენებით

## 📁 ახალი სტრუქტურა

```
components/locationpage/
├── LocationPage.tsx                    // მთავარი orchestrator (~200-250 lines)
├── context/
│   └── LocationPageContext.tsx         // Context API (state management)
└── locationpagecomponents/
    ├── LocationHero.tsx                // Hero section + background slideshow (~200 lines)
    ├── LocationMap.tsx                 // Google Maps iframe (~50 lines)
    ├── LocationHistory.tsx             // History section with rich text (~100 lines)
    ├── LocationGallery.tsx             // Image gallery with lightbox (~250 lines)
    ├── LocationVideos.tsx              // YouTube videos grid (~150 lines)
    ├── FlightTypeCard.tsx              // Single flight type card (~200 lines)
    ├── FlightTypesList.tsx             // Flight types list wrapper (~100 lines)
    ├── LocationRatings.tsx             // Rating display + modal (~150 lines)
    └── LocationComments.tsx            // Comments wrapper (~50 lines)
```

## 🔧 იმპლემენტაციის ნაბიჯები

### 1. Context API შექმნა
```tsx
// context/LocationPageContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'

interface LocationPageContextType {
  location: Location | null
  locationPage: LocationPageData | null
  locale: string
  isAuthenticated: boolean
  isLoading: boolean
  userRating: number | null
  flightTypeRatings: any
  // ... სხვა state-ები
}

export function LocationPageProvider({ children, countrySlug, locationSlug, locale }) {
  const [location, setLocation] = useState(null)
  const [locationPage, setLocationPage] = useState(null)
  // ... სხვა states
  
  // Data fetching logic აქ
  useEffect(() => {
    fetchLocationData()
  }, [locationSlug])
  
  return (
    <LocationPageContext.Provider value={{ location, locationPage, locale, ... }}>
      {children}
    </LocationPageContext.Provider>
  )
}

export function useLocationPage() {
  const context = useContext(LocationPageContext)
  if (!context) throw new Error('useLocationPage must be used within LocationPageProvider')
  return context
}
```

### 2. მთავარი LocationPage.tsx refactor
```tsx
// LocationPage.tsx
import { LocationPageProvider } from './context/LocationPageContext'
import LocationHero from './locationpagecomponents/LocationHero'
import LocationMap from './locationpagecomponents/LocationMap'
import LocationHistory from './locationpagecomponents/LocationHistory'
import LocationGallery from './locationpagecomponents/LocationGallery'
import LocationVideos from './locationpagecomponents/LocationVideos'
import FlightTypesList from './locationpagecomponents/FlightTypesList'
import LocationRatings from './locationpagecomponents/LocationRatings'
import LocationComments from './locationpagecomponents/LocationComments'

export default function LocationPage({ countrySlug, locationSlug, locale }: LocationPageProps) {
  return (
    <LocationPageProvider countrySlug={countrySlug} locationSlug={locationSlug} locale={locale}>
      <LocationHero />
      <LocationMap />
      <LocationHistory />
      <LocationGallery />
      <LocationVideos />
      <FlightTypesList />
      <LocationRatings />
      <LocationComments />
    </LocationPageProvider>
  )
}
```

### 3. თითოეული კომპონენტის შექმნა

#### LocationHero.tsx
```tsx
import { useLocationPage } from '../context/LocationPageContext'

export default function LocationHero() {
  const { location, locationPage, locale } = useLocationPage()
  
  // Hero section logic + background slideshow
  
  return (
    <section>
      {/* Hero UI */}
    </section>
  )
}
```

#### LocationGallery.tsx
```tsx
import { useLocationPage } from '../context/LocationPageContext'

export default function LocationGallery() {
  const { locationPage, locale } = useLocationPage()
  const images = locationPage?.content?.shared_images?.gallery || []
  
  // Gallery logic + lightbox
  
  return (
    <section>
      {/* Gallery UI */}
    </section>
  )
}
```

#### FlightTypesList.tsx & FlightTypeCard.tsx
```tsx
// FlightTypesList.tsx
import { useLocationPage } from '../context/LocationPageContext'
import FlightTypeCard from './FlightTypeCard'

export default function FlightTypesList() {
  const { locationPage, locale } = useLocationPage()
  const flightTypes = locationPage?.content?.[locale]?.flight_types || []
  
  return (
    <section>
      {flightTypes.map(type => (
        <FlightTypeCard key={type.shared_id} flightType={type} />
      ))}
    </section>
  )
}

// FlightTypeCard.tsx
export default function FlightTypeCard({ flightType }: { flightType: FlightType }) {
  const { flightTypeRatings } = useLocationPage()
  
  return (
    <div>
      {/* Flight type card UI */}
    </div>
  )
}
```

## ✅ უპირატესობები

1. **კოდის სიწმინდე**: თითოეული component 50-250 lines
2. **Reusability**: კომპონენტები შეიძლება გამოყენებულ იქნას სხვა გვერდებზე
3. **Maintainability**: ადვილი debugging და განახლება
4. **Testability**: თითოეული component ცალ-ცალკე ტესტირდება
5. **Performance**: შეიძლება lazy loading (`React.lazy`)
6. **Scalability**: ახალი features-ების დამატება მარტივია

## 📝 დამატებითი ოპტიმიზაცია

### Database Query Optimization
```tsx
// ახლა: 4 ცალკე query
// შემდეგ: 1 query with JOIN

const { data } = await supabase
  .from('locations')
  .select(`
    *,
    location_pages!inner(*),
    cached_rating,
    cached_rating_count
  `)
  .eq(`slug_${locale}`, locationSlug)
  .eq('location_pages.is_active', true)
  .single()
```

## 🚀 იმპლემენტაციის რიგითობა

1. ✅ შევქმნათ `context/` folder და `LocationPageContext.tsx`
2. ✅ გადავიტანოთ ყველა state და data fetching logic Context-ში
3. ✅ შევქმნათ `locationpagecomponents/` folder
4. ✅ შევქმნათ თითოეული component ცალ-ცალკე
5. ✅ განვაახლოთ მთავარი `LocationPage.tsx`
6. ✅ ვატესტოთ ყველა ფუნქციონალი
7. ✅ Build და deploy

## ⚠️ გასათვალისწინებელი

- Context-ში არ ჩავდოთ ძალიან ბევრი re-render trigger
- `useMemo` და `useCallback` გამოვიყენოთ performance-სთვის
- Error boundaries დავამატოთ თითოეულ component-ზე
- Loading states სწორად მოვაწყოთ

---

**შენიშვნა:** ეს refactoring არ ცვლის არსებულ ფუნქციონალს, მხოლოდ აუმჯობესებს კოდის სტრუქტურას და maintainability-ს.
