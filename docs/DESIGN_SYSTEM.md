# Paragliding Web - Design System

## 🎨 დიზაინის ფილოსოფია

პროექტი იყენებს **Apple-style მინიმალისტურ დიზაინს** glass morphism ეფექტებით:
- **Black & White** - მხოლოდ შავი და თეთრი ფერები (გარდა danger/success)
- **Glass Cards** - backdrop-blur-xl და semi-transparent backgrounds
- **Compact** - ულტრა-კომპაქტური spacing და typography
- **Clean** - არანაირი ზედმეტი დეტალები

---

## 🪟 Glass Morphism (ახალი სტანდარტი)

### Glass Card - ძირითადი კომპონენტი
```tsx
// ნათელი რეჟიმი: თეთრი glass
// ბნელი რეჟიმი: შავი glass
className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm"
```

### Glass Card Variations
```tsx
// მთავარი glass card
bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10

// hover ეფექტი
hover:bg-foreground/5

// nested section ფონი
bg-foreground/5
```

### Border სტილები
```tsx
// ღია border (ძირითადი)
border-foreground/10

// medium border
border-foreground/20

// divider line
border-b border-foreground/10
```

---

## 📐 Layout & Spacing (Compact Style)

### კონტეინერები
```tsx
// მთავარი კონტეინერი - Apple style
<div className="min-h-screen bg-zinc-50 dark:bg-black selection:bg-blue-500/30">

// კონტენტის wrapper - კომპაქტური
<div className="max-w-2xl mx-auto px-4 py-6">

// Card/Section spacing - პატარა gaps
<div className="space-y-3">  // არა 4, 5, 6 - მხოლოდ 3!
```

### Padding & Margin (Compact!)
- **Card padding**: `p-4` (არა 6!)
- **Small elements**: `p-2`, `px-3 py-2`
- **Vertical spacing**: `space-y-3` (არა 4-5-6)
- **Section gaps**: `gap-2`, `gap-3`, `gap-4`

⚠️ **არ გამოიყენო** `p-6`, `p-8`, `space-y-6` - ზედმეტად დიდია!

---

## 🎯 Colors (Theme-aware)

### ძირითადი ფერები
```tsx
// Background
bg-background          // მთავარი ფონი
bg-foreground/5        // ღია ფონი (5%)
bg-foreground/10       // card ფონი

// Text
text-foreground        // მთავარი ტექსტი
text-foreground/60     // secondary ტექსტი
text-foreground/70     // hover ტექსტი

// Borders
border-foreground/10   // ღია border
border-foreground/20   // medium border
```

### Accent ფერები
```tsx
// Primary (Blue)
bg-blue-600 hover:bg-blue-700
text-blue-600
border-blue-500

// Success (Green)
bg-green-600 hover:bg-green-700
from-green-600 to-green-700  // gradient

// Danger (Red)
bg-red-600 hover:bg-red-700
text-red-600

// Warning (Amber)
bg-amber-500
text-amber-600
```

---

## 🔘 Buttons (Black & WhiteOnly!)

### Primary Button - Black/White (ძირითადი!)
```tsx
// ❌ არ გამოიყენო ლურჯი gradient!
// ✅ მხოლოდ შავი-თეთრი
className="bg-foreground hover:bg-foreground/90 text-background rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
```

### Secondary Button (Cancel/Ghost)
```tsx
className="bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/20 rounded-lg font-medium transition-colors"
```

### Danger Button (წაშლა/გასვლა)
```tsx
// ეს ერთადერთია gradient-ით!
className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium shadow-lg"
```

### Icon Button (Small)
```tsx
className="p-2 bg-foreground/10 hover:bg-foreground/20 rounded-lg transition-colors"
```

### Navigation Active State
```tsx
className={`${
  isActive 
    ? 'bg-foreground text-background' 
    : 'text-foreground/70 hover:bg-foreground/5'
}`}
```

⚠️ **არასდროს არ გამოიყენო:**
- ❌ `bg-blue-600` primary button-ებისთვის
- ❌ `gradient` primary button-ებისთვის  
- ❌ `bg-green-600` save button-ებისთვის
- ✅ **მხოლოდ** `bg-foreground` + `text-background`

---

## 📝 Input Fields (Compact & Clean)

### Standard Input
```tsx
// ❌ არ გამოიყენო ring-blue-500
// ✅ ring-foreground/30
className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/30"
```

### Disabled Input
```tsx
className="w-full px-4 py-2 rounded-md bg-foreground/5 border border-foreground/10 text-foreground/50 cursor-not-allowed"
```

### Textarea
```tsx
className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/30 min-h-[100px] resize-none"
```

### Input with Icon
```tsx
<div className="relative">
  <div className="absolute left-3 top-1/2 -translate-y-1/2">
    <Icon className="w-4 h-4 text-foreground/40" />
  </div>
  <input className="w-full pl-10 pr-4 py-2 ..." />
</div>
```

---

## 🏷️ Labels & Typography (Compact)

### Card Header with Icon
```tsx
<div className="flex items-center gap-2 pb-3 border-b border-foreground/10">
  <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0">
    <Icon className="w-4 h-4 text-foreground/70" />
  </div>
  <h2 className="text-sm font-bold text-foreground">სათაური</h2>
</div>
```

### Standard Label
```tsx
className="block text-sm font-medium text-foreground mb-2"
```

### Secondary Label
```tsx
className="text-xs text-foreground/50"  // არა /60 - უფრო ღია!
```

### Helper Text
```tsx
className="text-[10px] text-foreground/40"  // ძალიან პატარა
```

---

## 📦 Cards (Glass Morphism - ძირითადი!)

### ⭐ Glass Card - ძირითადი სტილი
```tsx
// ეს არის ახალი სტანდარტი!
className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm p-4"
```

### Glass Card with Sections
```tsx
<div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm">
  {/* Header */}
  <div className="p-4 border-b border-foreground/10">
    <h2>სათაური</h2>
  </div>
  
  {/* Content */}
  <div className="p-4 space-y-3">
    {/* content */}
  </div>
</div>
```

### Nested Section (inside glass card)
```tsx
className="bg-foreground/5 rounded-lg p-3"
```

### Interactive Glass Card
```tsx
className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm p-4 hover:bg-foreground/5 transition-all cursor-pointer"
```

⚠️ **ახალი წესი:** ყველა მთავარი card უნდა იყოს glass morphism სტილის!

---

## 🎭 Modals & Overlays

### Modal Background
```tsx
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
```

### Modal Content
```tsx
className="bg-background rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
```

---

## ⚡ Animations & Transitions

### Standard Transition
```tsx
className="transition-colors" // ფერები
className="transition-all"    // ყველაფერი
```

### Hover Effects
```tsx
hover:bg-foreground/5
hover:scale-[1.02]
hover:shadow-lg
```

### Active Effects
```tsx
active:scale-[0.98]
```

### Loading Spinner
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
```

---

## 📱 Responsive Design

### Mobile First
```tsx
// Base (mobile)
className="px-4 py-2"

// Tablet და Desktop
className="px-4 py-2 sm:px-6 md:px-8"
```

### Hidden on Mobile
```tsx
className="hidden lg:flex"
```

---

## ✅ Success/Error Messages

### Success Message
```tsx
className="p-4 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 text-sm font-medium"
```

### Error Message
```tsx
className="p-4 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 text-sm font-medium"
```

---

## 🎯 Typography (Compact & Clean)

### Page Title (Compact!)
```tsx
<h1 className="text-lg lg:text-xl font-bold text-foreground mb-1">
<p className="text-xs text-foreground/50">subtitle</p>
```

### Card Title
```tsx
<h2 className="text-sm font-bold text-foreground">
```

### Section Title with Icon
```tsx
<div className="flex items-center gap-2">
  <div className="p-1.5 rounded bg-foreground/10">
    <Icon className="w-4 h-4 text-foreground/70" />
  </div>
  <h2 className="text-sm font-bold text-foreground">სათაური</h2>
</div>
```

### Body Text
```tsx
<p className="text-xs text-foreground/60">   // ძირითადი
<p className="text-[10px] text-foreground/40">  // helper text
```

⚠️ **ახალი მიდგომა:**
- ❌ არა `text-2xl`, `text-xl` - ძალიან დიდია!
- ✅ `text-lg`, `text-sm`, `text-xs` - კომპაქტური!
- ❌ არა `mb-4`, `mb-6` 
- ✅ `mb-1`, `mb-2`, `mb-3` - მცირე gaps!

---

## 🚫 არასწორი მაგალითები (განახლებული!)

❌ **არასდროს არ გამოიყენო:**
- `bg-blue-600`, `bg-green-600` primary buttons-ზე
- `gradient` primary buttons-ზე (მხოლოდ danger!)
- `bg-foreground/5` როგორც card ფონი (უნდა იყოს glass!)
- `rounded-lg` inputs-ზე (მხოლოდ `rounded-md`)
- `p-6`, `p-8`, `space-y-6` (ძალიან დიდია - კომპაქტური უნდა იყოს!)
- `text-2xl`, `text-3xl` titles-ისთვის (ძალიან დიდია!)

✅ **ახალი სტანდარტი:**
- `bg-white/60 dark:bg-black/40 backdrop-blur-xl` card-ებისთვის
- `bg-foreground text-background` primary button-ებისთვის
- `rounded-2xl` glass cards-ისთვის
- `rounded-md` inputs-ისთვის
- `p-4`, `space-y-3` - კომპაქტური spacing
- `text-lg`, `text-sm` - კომპაქტური typography
- `border-white/20 dark:border-white/10` glass cards borders

---

## 📋 Component Patterns (Apple Style)

### Glass Card with Header & Content
```tsx
<div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm p-4 space-y-4">
  {/* Header with Icon */}
  <div className="flex items-center gap-2 pb-3 border-b border-foreground/10">
    <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0">
      <Icon className="w-4 h-4 text-foreground/70" />
    </div>
    <h2 className="text-sm font-bold text-foreground">სათაური</h2>
  </div>
  
  {/* Content */}
  <div className="space-y-3">
    {/* form fields, content... */}
  </div>
</div>
```

### Form Section (Compact)
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-foreground">სახელი</label>
  <input
    type="text"
    className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/30"
  />
</div>
```

### Action Buttons Row (Black & White!)
```tsx
<div className="flex gap-2">
  <button className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/20 rounded-lg font-medium transition-colors">
    გაუქმება
  </button>
  <button className="flex-1 px-4 py-2 bg-foreground hover:bg-foreground/90 text-background rounded-lg font-medium shadow-md transition-all">
    შენახვა
  </button>
</div>
```

### Collapsible Section (Accordion Style)
```tsx
<div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
  <button className="w-full p-4 flex items-center justify-between hover:bg-foreground/5 transition-colors">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded bg-foreground/10">
        <Icon className="w-4 h-4 text-foreground/70" />
      </div>
      <h2 className="text-sm font-bold text-foreground">სათაური</h2>
    </div>
    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
  </button>
  
  {isOpen && (
    <div className="p-4 pt-0 space-y-4">
      {/* content */}
    </div>
  )}
</div>
```

---

## 🎨 Design Principles

1. **Consistency** - იყავი თანმიმდევრული spacing, colors, borders-ში
2. **Simplicity** - არ გადატვირთო ზედმეტი effects-ით
3. **Accessibility** - focus states, hover states აუცილებელია
4. **Theme Support** - ყოველთვის იყენე `foreground/background` ნაცვლად hard-coded ფერებისა
5. **Performance** - მარტივი transitions, არა რთული animations

---

## ⚠️ მნიშვნელოვანი წესები

1. **არასდროს** გამოიყენო inline styles
2. **ყოველთვის** დაიცვა theme-aware colors
3. **Input-ები** ყოველთვის უნდა იყოს `rounded-md` (არა xl/2xl)
4. **Gradient buttons** მხოლოდ primary actions-ისთვის
5. **Spacing** დაიცვა consistency: 2, 3, 4, 5, 6 (არა random ციფრები)
