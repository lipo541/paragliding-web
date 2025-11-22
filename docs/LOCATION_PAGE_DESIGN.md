# Location Page Design System

## Transitions & Animations

### Hero → Background Crossfade
```javascript
// Hero fade-out
opacity: Math.max(0, 1 - (scrollY / 550))
transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)'

// Background fade-in
opacity: Math.min(1, Math.max(0, (scrollY - 150) / 400))
transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)'
```

**Timing:** 400ms - Material Design standard  
**Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` - natural acceleration/deceleration  
**GPU:** `will-change-opacity`, `will-change-transform`

## Color System

### Text Hierarchy (Light backgrounds)
- **Headings:** `text-foreground/95`
- **Body text:** `text-foreground/90`
- **Secondary:** `text-foreground/85`
- **Tertiary:** `text-foreground/75`
- **Muted:** `text-foreground/65`
- **Icons:** `text-foreground/80-85`

### Glass Morphism
```css
backdrop-blur-md
bg-white/20 dark:bg-black/20
border border-white/30 dark:border-white/20
shadow-lg
```

## Layout

### Hero Section
- Height: `100vh + 4rem (lg:5rem)` - compensates for header
- Static image (no Ken Burns animation)
- Scroll-based opacity fade
- GPU-accelerated transforms

### Background
- Fixed position: `fixed inset-0 -z-10`
- Single static mountain image
- Dark overlay: `bg-black/40 dark:bg-black/60`
- Fades in on scroll

### Content Grid
- Max width: `max-w-[1280px]`
- Left column: `lg:col-span-3` (main content)
- Right column: `lg:col-span-1` (sidebar)

## Components

### Section Titles
```jsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md bg-white/20">
  <Icon className="w-5 h-5 text-foreground/85" />
  <h2 className="text-lg font-semibold text-foreground/95">{title}</h2>
</div>
```

### Cards
```jsx
className="rounded-xl backdrop-blur-md bg-white/20 dark:bg-black/20 
          border border-white/30 dark:border-white/20 
          hover:bg-white/30 hover:shadow-2xl hover:scale-[1.02] 
          transition-all duration-300"
```

### Buttons
- Primary: `bg-foreground text-background`
- Secondary: `bg-white/10 backdrop-blur-md border border-white/20`
- Hover: `hover:scale-105` or `hover:scale-[1.02]`
- Transition: `transition-all duration-300`

## Glass Morphism Cards

All cards use consistent glass morphism design:

```jsx
className="backdrop-blur-md bg-white/20 dark:bg-black/20 
          border border-white/30 dark:border-white/20 
          hover:bg-white/30 dark:hover:bg-black/30 
          hover:border-white/50 dark:hover:border-white/30 
          shadow-lg hover:shadow-xl hover:scale-[1.02] 
          transition-all duration-300"
```

**Applied to:**
- History/About cards
- Gallery containers
- Video player cards
- Sidebar info cards
- Location links
- Comments section
- Quick stats cards

## Best Practices

1. **Smooth Scrolling:** Use `scrollIntoView({ behavior: 'smooth', block: 'start' })`
2. **GPU Acceleration:** Add `will-change-opacity` for animating elements
3. **Responsive:** Mobile-first approach with `lg:` breakpoints
4. **Accessibility:** Maintain contrast ratios with darker text on light backgrounds
5. **Performance:** Single background image, no slideshow animations
6. **Glass Morphism:** Use `backdrop-blur-md` with `bg-white/20` for all cards

## Typography

- **H1 (Hero):** `text-xl lg:text-3xl font-bold text-white`
- **H2 (Sections):** `text-lg font-semibold text-foreground/95`
- **H3 (Cards):** `text-base md:text-lg font-bold text-foreground/95`
- **Body:** `text-xs lg:text-sm text-foreground/90`
- **Small text:** `text-[10px] md:text-xs text-foreground/65`

## Spacing

- Section gaps: `space-y-4`
- Card padding: `p-4 md:p-5`
- Element gaps: `gap-2`, `gap-3`, `gap-4`
- Page padding: `px-4 py-5 lg:py-8`
