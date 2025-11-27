# 🎨 Unified Design System - Light/Dark Mode

> **Last Updated:** November 2025  
> **Version:** 2.0 - Global Background + Pure Black Dark Mode

ეს დოკუმენტი შეიცავს პროექტის უახლეს დიზაინ სისტემას, რომელიც გამოყენებულია `LocationPage`-ზე და უნდა გამოიყენოს ყველა სხვა გვერდზე თანმიმდევრულობისთვის.

---

## 📍 Table of Contents

1. [Global Background System](#global-background-system)
2. [Color Palette](#color-palette)
3. [Glass Morphism Components](#glass-morphism-components)
4. [Buttons & CTAs](#buttons--ctas)
5. [Typography](#typography)
6. [Borders & Dividers](#borders--dividers)
7. [Shadows](#shadows)
8. [Interactive Elements](#interactive-elements)
9. [Component Examples](#component-examples)

---

## 🌍 Global Background System

გლობალური ბექგრაუნდი დაყენებულია `app/layout.tsx`-ში და მოქმედებს ყველა გვერდზე.

### კომპონენტი: `components/background/GlobalBackground.tsx`

```tsx
// ორი ციური სურათი Ken Burns ეფექტით
const backgroundImages = [
  'https://res.cloudinary.com/dgsemkiaf/image/upload/v1764242941/pexels-photo-314726_a3cnf7.jpg',
  'https://res.cloudinary.com/dgsemkiaf/image/upload/v1764243316/light-blue-sky-high-resolution-clouds-hswmztfo862ydkpm_vckkka.jpg'
];
```

### სტრუქტურა:

| Layer | Light Mode | Dark Mode |
|-------|-----------|-----------|
| **Base** | `bg-sky-100` | `bg-sky-100` (იგივე სურათი) |
| **Overlay** | `from-white/60 via-white/20 to-transparent` | `bg-black/80` |
| **Accent** | Subtle blue-purple gradient | Same (low opacity) |

### კოდი:

```tsx
{/* Light Mode Overlay */}
<div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-transparent dark:hidden" />

{/* Dark Mode Overlay - 80% შავი */}
<div className="absolute inset-0 hidden dark:block bg-black/80" />
```

### ანიმაციები:

```css
@keyframes globalKenBurnsZoom {
  0%, 100% { transform: scale(1.02) translate(0, 0); }
  50% { transform: scale(1.08) translate(-0.5%, -0.3%); }
}

@keyframes globalGradientShift {
  0%, 100% { opacity: 1; transform: translateX(0) translateY(0); }
  50% { opacity: 0.7; transform: translateX(2%) translateY(-1%); }
}
```

---

## 🎨 Color Palette

### Primary Colors

| ფერი | HEX | გამოყენება |
|------|-----|-----------|
| **Blue Primary** | `#4697D2` | Glass borders, accents, icons |
| **Green Accent** | `#CAFA00` | Hover states, highlights |
| **Golden** | `#ffc107` → `#ffa000` | Rating buttons gradient |
| **Booking Blue** | `#2196f3` | Book/CTA buttons |

### Text Colors

| Mode | Primary | Secondary | Muted |
|------|---------|-----------|-------|
| **Light** | `text-[#1a1a1a]` | `text-[#2d2d2d]` | `text-[#2d2d2d]/70` |
| **Dark** | `dark:text-white` | `dark:text-white/90` | `dark:text-white/70` |

### ⚠️ CRITICAL TEXT COLOR RULES

> **Light Mode-ში ტექსტი ყოველთვის შავი უნდა იყოს!**

#### ❌ არასწორი - ლურჯი ტექსტი Light Mode-ში:
```tsx
// არასწორი! ლურჯი ტექსტი light mode-ში არ უნდა იყოს
className="text-[#4697D2]/70"
className="text-[#4697D2]/60" 
className="text-[#4697D2]"
```

#### ✅ სწორი - შავი ტექსტი Light Mode-ში:
```tsx
// სწორი! შავი light-ში, თეთრი dark-ში
className="text-[#1a1a1a] dark:text-white"
className="text-[#1a1a1a]/70 dark:text-white/70"
className="text-[#1a1a1a]/60 dark:text-white/60"
className="text-[#2d2d2d] dark:text-white/90"
```

#### Icon-ების ფერები:
```tsx
// Icon-ები: შავი light-ში, თეთრი ან ლურჯი dark-ში
className="text-[#1a1a1a] dark:text-white"
className="text-[#1a1a1a] dark:text-[#4697D2]"  // ლურჯი მხოლოდ dark-ში!
className="text-[#1a1a1a]/60 dark:text-white/60"
```

#### Placeholder ტექსტი:
```tsx
className="placeholder:text-[#1a1a1a]/50 dark:placeholder:text-white/50"
```

#### გამონაკლისები (როცა თეთრი ტექსტი სწორია):
```tsx
// ფერადი ფონზე - თეთრი ტექსტი ორივე mode-ში
className="bg-blue-500 text-white"           // ლურჯი badge
className="bg-green-500 text-white"          // მწვანე badge  
className="bg-black/70 text-white"           // შავი ფონის badge
className="bg-gradient-to-r from-[#2196f3] to-[#1976d2] text-white"  // booking button
```

#### Hover States:
```tsx
// Hover-ზე შეიძლება ლურჯი გახდეს
className="text-[#1a1a1a] dark:text-white group-hover:text-[#4697D2]"
className="hover:text-[#4697D2]"  // მხოლოდ hover state-ში
```

### Background Scheme

| Mode | Glass BG | Glass Border |
|------|----------|--------------|
| **Light** | `bg-[rgba(70,151,210,0.15)]` | `border-[#4697D2]/30` |
| **Dark** | `dark:bg-black/40` | `dark:border-white/10` |

---

## 🪟 Glass Morphism Components

### Standard Glass Card

ყველა card-ისა და section-ის საბაზისო სტილი:

```tsx
<div className="
  relative rounded-xl backdrop-blur-md 
  shadow-xl shadow-black/5 dark:shadow-black/30 
  overflow-hidden transition-all duration-500 
  hover:shadow-2xl hover:-translate-y-0.5 
  border border-[#4697D2]/30 dark:border-white/10 
  bg-[rgba(70,151,210,0.15)] dark:bg-black/40
">
  {/* Gradient Border Effect - hidden in dark mode */}
  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-transparent dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
  
  {/* Top Highlight Line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
  
  {/* Content */}
</div>
```

### Glass Card Variations

#### მინიმალური (Badges, Pills):
```tsx
className="
  backdrop-blur-md 
  bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] 
  dark:from-transparent dark:to-transparent dark:bg-black/40 
  border border-[#4697D2]/40 dark:border-white/10 
  shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30
"
```

#### Hover ეფექტიანი Card:
```tsx
className="
  p-4 md:p-5 rounded-xl backdrop-blur-md 
  border border-[#4697D2]/30 dark:border-white/10 
  hover:border-[#4697D2]/50 dark:hover:border-white/20 
  shadow-xl hover:shadow-2xl hover:scale-[1.02] 
  transition-all duration-300 
  bg-[rgba(70,151,210,0.15)] dark:bg-black/40
"
```

---

## 🔘 Buttons & CTAs

### Primary Button (Booking/CTA)

```tsx
<button
  className="
    group relative flex items-center gap-1.5 lg:gap-2 
    px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl 
    transition-all duration-300 text-xs lg:text-sm font-semibold 
    shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden
  "
  style={{ 
    backgroundColor: '#2196f3',
    color: '#ffffff',
    boxShadow: '0 10px 15px -3px rgba(33, 150, 243, 0.3)'
  }}
>
  {/* Shine effect */}
  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
  <span className="relative">Button Text</span>
</button>
```

### Secondary Button (Glass)

```tsx
<button className="
  group flex items-center gap-1.5 lg:gap-2 
  px-3 lg:px-5 py-2.5 lg:py-3 
  bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] 
  dark:from-transparent dark:to-transparent dark:bg-black/40 
  backdrop-blur-md 
  border border-[#4697D2]/40 dark:border-white/10 
  text-[#1a1a1a] dark:text-white rounded-xl 
  hover:from-[rgba(70,151,210,0.5)] hover:to-[rgba(70,151,210,0.4)] 
  dark:hover:bg-black/50 
  hover:border-[#CAFA00]/50 dark:hover:border-white/20 
  transition-all duration-300 text-xs lg:text-sm font-medium 
  shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30 hover:shadow-xl
">
```

### Golden Rate Button

```tsx
<button
  className="
    group relative flex items-center gap-1.5 lg:gap-2 
    px-3 lg:px-5 py-2.5 lg:py-3 
    text-white rounded-xl transition-all duration-300 
    text-xs lg:text-sm font-semibold 
    shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden
  "
  style={{
    background: 'linear-gradient(135deg, #ffc107 0%, #ffa000 100%)',
    boxShadow: '0 10px 15px -3px rgba(255, 193, 7, 0.3)'
  }}
>
```

### Social Link Buttons (Header/Footer Style)

```tsx
<a className="
  group flex items-center gap-1.5 px-3 py-1.5 
  bg-[#4697D2]/20 hover:bg-[#CAFA00]/30 
  dark:bg-white/90 dark:hover:bg-white 
  text-[#1a1a1a] dark:text-gray-800 
  rounded-md transition-all duration-200 
  text-xs font-medium shadow-sm 
  border border-[#4697D2]/30 hover:border-[#CAFA00]/50 
  dark:border-transparent
">
  <Icon className="w-4 h-4" />
  <span>Label</span>
</a>
```

---

## 📝 Typography

### Headings

```tsx
// H1 - Main Title
<h1 className="text-xl lg:text-4xl font-bold text-[#1a1a1a] dark:text-white drop-shadow-sm dark:drop-shadow-2xl">

// H2 - Section Title
<h2 className="text-sm lg:text-lg font-bold text-[#1a1a1a] dark:text-white">

// H3 - Card Title
<h3 className="text-base md:text-lg font-bold text-[#1a1a1a] dark:text-white">
```

### Body Text

```tsx
// Primary Paragraph
<p className="text-xs lg:text-sm text-[#2d2d2d] dark:text-white/90 leading-relaxed">

// Secondary/Muted
<span className="text-[10px] lg:text-xs text-[#2d2d2d]/70 dark:text-white/70">

// Label/Small
<span className="text-[11px] font-medium text-[#1a1a1a] dark:text-white">
```

---

## 🔲 Borders & Dividers

### Standard Border

```tsx
// Light: Blue tint | Dark: White subtle
className="border border-[#4697D2]/30 dark:border-white/10"

// Hover state
className="hover:border-[#4697D2]/50 dark:hover:border-white/20"

// Green hover (accent)
className="hover:border-[#CAFA00]/50"
```

### Section Divider

```tsx
<div className="border-t border-[#4697D2]/30 dark:border-white/20 my-6" />
```

### Internal Card Divider

```tsx
<div className="h-px bg-[#4697D2]/30 dark:bg-white/20" />
```

---

## 🌟 Shadows

### Light Mode

```tsx
shadow-xl shadow-black/5        // Standard
shadow-lg shadow-[#4697D2]/10   // Blue tinted (for pills/badges)
hover:shadow-2xl                // Hover state
```

### Dark Mode

```tsx
dark:shadow-black/30            // Standard
dark:shadow-black/40            // Intense
```

---

## ✨ Interactive Elements

### Shine Effect (on hover)

```tsx
{/* Add inside button with group class */}
<div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
```

### Scale on Hover

```tsx
className="hover:scale-[1.02] transition-all duration-300"
```

### Icon Animation

```tsx
// Rotate on hover
<Icon className="group-hover:rotate-12 transition-transform" />

// Scale on hover
<Icon className="group-hover:scale-110 transition-transform" />
```

---

## 📦 Component Examples

### Section Title Component

```tsx
const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-1.5 rounded bg-[rgba(70,151,210,0.3)] dark:bg-white/10">
      <Icon className="w-4 h-4 text-[#4697D2] dark:text-white" />
    </div>
    <h2 className="text-base lg:text-xl font-bold text-[#1a1a1a] dark:text-white">
      {title}
    </h2>
  </div>
);
```

### Info Badge/Pill

```tsx
<div className="inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full backdrop-blur-md bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] dark:from-transparent dark:to-transparent dark:bg-black/40 border border-[#4697D2]/40 dark:border-white/10 shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30">
  <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#CAFA00]" />
  <span className="text-xs lg:text-sm font-medium text-[#1a1a1a] dark:text-white">
    Label
  </span>
</div>
```

### Rating Stars (5-Star Display)

```tsx
<div className="flex items-center gap-0.5">
  {[1, 2, 3, 4, 5].map((star) => {
    const filled = star <= Math.floor(rating);
    const partial = star === Math.ceil(rating) && rating % 1 !== 0;
    const fillPercent = partial ? (rating % 1) * 100 : 0;
    
    return (
      <div key={star} className="relative">
        {/* Empty star */}
        <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/30" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {/* Filled overlay */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: filled ? '100%' : partial ? `${fillPercent}%` : '0%' }}
        >
          <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" style={{ color: '#ffc107' }} fill="currentColor" viewBox="0 0 20 20">
            <path d="..." />
          </svg>
        </div>
      </div>
    );
  })}
</div>
```

---

## 🔑 Key Principles

### 1. Dark Mode = Pure Black

❌ არასწორი:
```tsx
dark:bg-gradient-to-r dark:from-[rgba(70,151,210,0.3)] dark:to-[rgba(70,151,210,0.2)]
```

✅ სწორი:
```tsx
dark:from-transparent dark:to-transparent dark:bg-black/40
```

### 2. ერთიანი Border სისტემა

- Light: `border-[#4697D2]/30`
- Dark: `dark:border-white/10`
- Hover Light: `hover:border-[#4697D2]/50` ან `hover:border-[#CAFA00]/50`
- Hover Dark: `dark:hover:border-white/20`

### 3. ⚠️ ტექსტის ფერები - CRITICAL RULE

> **Light Mode-ში ტექსტი ყოველთვის შავი (`#1a1a1a` ან `#2d2d2d`) უნდა იყოს!**
> **არასდროს გამოიყენო `text-[#4697D2]` light mode-ში!**

- Light mode ძირითადი: `text-[#1a1a1a]`
- Light mode secondary: `text-[#2d2d2d]`
- Light mode muted: `text-[#1a1a1a]/60` ან `text-[#2d2d2d]/70`
- Dark mode ძირითადი: `dark:text-white`
- Dark mode muted: `dark:text-white/70`

❌ არასწორი:
```tsx
className="text-[#4697D2]/70 dark:text-white/70"  // ლურჯი light-ში!
className="text-[#4697D2]"  // ლურჯი ტექსტი
```

✅ სწორი:
```tsx
className="text-[#1a1a1a]/70 dark:text-white/70"
className="text-[#1a1a1a] dark:text-white"
```

### 4. Icon ფერები

- Light mode: `text-[#1a1a1a]` ან `text-[#1a1a1a]/60`
- Dark mode: `dark:text-white` ან `dark:text-[#4697D2]` (ლურჯი მხოლოდ dark-ში!)

### 5. Backdrop Blur

ყველა glass ელემენტს უნდა ჰქონდეს:
```tsx
backdrop-blur-md  // ან backdrop-blur-xl უფრო ინტენსიურისთვის
```

### 6. Dropdown-ები (No Glass Morphism)

Dropdown მენიუებში **არ გამოიყენო** `backdrop-blur`:
```tsx
// Dropdown background
className="bg-[rgba(70,151,210,0.95)] dark:bg-[#1a1a1a]"

// Dropdown text - შავი light-ში!
className="text-[#1a1a1a] dark:text-white"
```

---

## 📁 Related Files

- `components/background/GlobalBackground.tsx` - გლობალური ბექგრაუნდი
- `components/locationpage/LocationPage.tsx` - სრული რეფერენსი
- `components/footer/Footer.tsx` - Footer სტილი
- `components/header/Header.tsx` - Header სტილი
- `app/globals.css` - გლობალური CSS

---

## ✅ Checklist for New Pages

- [ ] არ გჭირდება ბექგრაუნდის დამატება (გლობალურია)
- [ ] Glass cards იყენებენ `bg-[rgba(70,151,210,0.15)] dark:bg-black/40`
- [ ] Dark mode-ში არ არის ლურჯი გრადიენტები
- [ ] **⚠️ Light mode ტექსტი შავია:** `text-[#1a1a1a]` ან `text-[#2d2d2d]`
- [ ] **⚠️ არ გამოიყენო `text-[#4697D2]` light mode-ში!**
- [ ] Dark mode ტექსტი: `dark:text-white`
- [ ] Icon-ები light-ში: `text-[#1a1a1a]` (არა ლურჯი!)
- [ ] Borders: `border-[#4697D2]/30 dark:border-white/10`
- [ ] Shadows: `shadow-xl shadow-black/5 dark:shadow-black/30`
- [ ] Hover states აქვს `transition-all duration-300`
- [ ] `backdrop-blur-md` დამატებულია glass ელემენტებზე
- [ ] Dropdown-ებში არ არის blur, აქვს solid background
