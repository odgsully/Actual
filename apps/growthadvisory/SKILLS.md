# Growth Advisory Marketing Site — SKILLS.md

> Slash-command skills for Claude Code development on the B2B consulting marketing site.
>
> **Port:** 3005 | **Domain:** growthadvisory.ai | **Stack:** Next.js 14.2, React 18, TypeScript 5, Tailwind CSS
> **Design:** Glassmorphism + Aurora effects | **Backend:** None (static marketing site)

---

## Quick Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/ga-hero` | Update hero section messaging | Changing headlines/CTAs |
| `/ga-add-testimonial` | Add client testimonial | New social proof |
| `/ga-service-page` | Create/update service page | New offering |
| `/ga-add-nav-item` | Add navigation link | Site restructure |
| `/ga-seo-metadata` | Update SEO tags | Page optimization |
| `/ga-client-logos` | Add logo to carousel | New client showcase |
| `/ga-styling-guide` | Reference design system | Building new components |
| `/ga-animation-tweak` | Adjust animations | Polish timing/easing |
| `/ga-add-section` | Add homepage section | New content block |
| `/ga-responsive-check` | Verify all breakpoints | Before deployment |
| `/ga-accessibility` | WCAG 2.1 AA audit | Accessibility review |
| `/ga-content-audit` | Review marketing copy | Conversion optimization |
| `/ga-deploy-vercel` | Deploy to production | Shipping changes |

---

## Content Management

### /ga-hero

**Update hero section messaging and CTAs**

**Edits:** Headline, subheadline, eyebrow text, primary/secondary CTA buttons, booking URL

**File:** `lib/marketing-data.ts` → `heroContent` object

Auto-reloads in dev due to server-side imports.

---

### /ga-add-testimonial

**Add new client testimonial to the referral wall**

**File:** `lib/marketing-data.ts` → `testimonials` array

**Data Structure:**
```typescript
{
  quote: "...",
  name: "Client Name",
  initials: "CN",
  company: "Company Name",
  role: "Job Title",
  category: 'ai' | 'operations' | 'development',
  rating: 5,
  featured: true | false,
  outcome: "X% improvement in Y"
}
```

Featured testimonials get larger cards in the masonry layout. Categories enable filtering on the referral wall page.

---

### /ga-service-page [service-slug]

**Create or update a service detail page**

**Creates:** `app/services/[service-slug]/page.tsx`

**5-Section Template:**
1. **Hero** — Title, subheading, dual CTAs (booking + link)
2. **Problem** — 2-column grid (copy + stats card)
3. **Solution** — Feature list with gradient border cards
4. **Process** — 4-step timeline (phase, duration, description)
5. **CTA** — Gradient button + secondary action

Includes SEO metadata (title, description, canonical URL). Uses `SubpageLayout` wrapper for consistent styling.

---

### /ga-client-logos

**Add client logo to carousel**

**File:** `lib/marketing-data.ts` → `clientLogos` array

**Data Structure:**
```typescript
{
  name: "Company Name",
  src: "/assets/company-logo.webp",
}
```

Logos display grayscale by default, brighten on hover. Carousel auto-loops with hover pause.

**Image placement:** `public/assets/` (PNG or WebP, ~180px wide)

---

### /ga-content-audit

**Review all marketing copy for clarity and conversion**

**Audits:** `lib/marketing-data.ts` + all page components

**Checklist:**
- Headlines are specific, not generic
- Pain points are data-backed
- Solutions directly address pain points
- CTAs are action-oriented ("Book a Call", not "Submit")
- Testimonials highlight quantified outcomes
- No internal jargon

---

## Navigation & Structure

### /ga-add-nav-item

**Add navigation link or dropdown to header**

**File:** `lib/marketing-data.ts` → `navLinks` array

**Data Structure:**
```typescript
{
  label: "New Section",
  href: "/new-section",
  hasDropdown: true | false,
  children: [
    {
      label: "Subsection",
      href: "/new-section/subsection",
      description: "Brief description"
    }
  ]
}
```

Navigation is data-driven — `MarketingNav.tsx` renders from data, no component changes needed. Mobile accordion menu updates automatically.

---

### /ga-add-section

**Add new horizontal section to homepage**

**File:** `app/page.tsx` — insert component in `<main>` JSX

**Pattern:**
```tsx
import { SectionDivider, MyNewSection } from '@/components/marketing';

// In <main>:
<SectionDivider />
<MyNewSection />
<SectionDivider />
```

Create component in `components/marketing/` and add to barrel export in `index.ts`.

---

## SEO & Performance

### /ga-seo-metadata

**Update page metadata, structured data, and SEO tags**

**Files:**
- Page `page.tsx` → `metadata` export
- `app/layout.tsx` → global metadata
- `lib/structured-data.ts` → JSON-LD schema generators
- `app/robots.ts` → crawl rules
- `app/sitemap.ts` → page list

**Metadata Template:**
```typescript
export const metadata: Metadata = {
  title: "Page Title | Growth Advisory",
  description: "Clear description (155 chars)",
  openGraph: {
    title: "...",
    description: "...",
    url: "https://growthadvisory.ai/page",
  },
  alternates: {
    canonical: "https://growthadvisory.ai/page",
  },
};
```

Supports JSON-LD schemas: Organization, Service, FAQ.

---

## Design System

### /ga-styling-guide

**Reference guide for the design system**

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.glass-card` | Frosted glass container with subtle hover |
| `.btn-gradient` | Animated rainbow gradient button |
| `.btn-ghost` | Transparent button with border |
| `.gradient-text` | Animated gradient text |
| `.gradient-text-static` | Static gradient text |
| `.reveal` | Scroll-triggered fade-in |
| `.reveal-delay-1` through `.reveal-delay-3` | Staggered reveal delays |

### Color Palette
- **Gold accents:** Hero highlights, premium feel
- **Purple accents:** Service differentiation
- **Teal accents:** Focus states, links

### Typography
- **Display:** Fraunces (serif, elegant headings)
- **Body:** Inter (sans-serif, readable)
- **Fluid scaling:** `clamp(40px, 6vw, 64px)` for headlines

### Animation Patterns
1. **Scroll reveal:** `className="reveal reveal-delay-1"` — triggers on intersection
2. **Continuous aurora:** `className="animate-aurora-1"` — loops infinitely
3. **Gradient shift:** `className="animate-gradient"` — background animation

### CSS Files
- `app/globals.css` — all utilities, keyframes, design tokens
- `tailwind.config.js` — color definitions, font families

---

### /ga-animation-tweak

**Adjust animation timing, easing, and scroll-reveal thresholds**

**Common Tweaks:**
- Duration: Change `18s` to `15s` in `@keyframes aurora-float-1`
- Delay stagger: Add `.reveal-delay-4` class
- Threshold: Modify `threshold = 0.12` in `useScrollRevealAll()`
- Root margin: Adjust `rootMargin = '0px 0px -40px 0px'`

**Files:**
- `app/globals.css` → keyframes and animation utilities
- `hooks/useScrollReveal.ts` → IntersectionObserver options

**Accessibility:** `@media (prefers-reduced-motion: reduce)` disables all animations

---

## Quality Assurance

### /ga-responsive-check

**Verify site on all breakpoints**

**Breakpoints:** xs (320px), sm (640px), md (768px), lg (1024px), xl (1280px)

**Checks:**
- Mobile menu opens/closes without scroll trap
- Font sizes scale correctly (clamp)
- No horizontal scroll
- Touch targets >= 44px
- Glass cards and gradients render properly
- Grid layouts collapse correctly (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

---

### /ga-accessibility

**WCAG 2.1 AA compliance audit**

**Checks:**
- Focus states and keyboard navigation (Tab, Enter, Esc)
- Color contrast ratios (4.5:1 minimum)
- Screen reader compatibility
- `prefers-reduced-motion` respected
- `aria-expanded`, `aria-hidden` on mobile menu
- `aria-label` on icon buttons

**Tools:** Lighthouse, axe DevTools, VoiceOver

---

## Deployment

### /ga-deploy-vercel

**Deploy to production**

**Checklist:**
- [ ] `npm run build` succeeds locally
- [ ] No TypeScript errors
- [ ] All links use absolute URLs
- [ ] Environment variables set in Vercel (if any)
- [ ] DNS: A record → Vercel IP (Cloudflare)
- [ ] SSL active (Vercel auto-provisions)
- [ ] Test homepage, service pages, referral wall
- [ ] Test mobile responsive

**Deployment:** Push to `main` → auto-deploys to Vercel

---

## Data Management Pattern

All content lives in TypeScript — no CMS, no database.

```typescript
// Add to data file
// lib/marketing-data.ts
export const myContent = { ... }

// Import in component
import { myContent } from '@/lib/marketing-data';
```

---

## Component Structure

```
components/
  marketing/
    index.ts          # Barrel export
    HeroSection.tsx
    MarketingNav.tsx
    ServicesSection.tsx
    TestimonialsSection.tsx
    LogoCarousel.tsx
    MarketingFooter.tsx
    SubpageLayout.tsx
    SectionDivider.tsx
    ...
```

Import from barrel:
```typescript
import { HeroSection, ServicesSection } from '@/components/marketing';
```

---

## File Structure

```
apps/growthadvisory/
├── app/
│   ├── layout.tsx              # Global metadata + fonts
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Design tokens + animations
│   ├── robots.ts               # SEO crawl rules
│   ├── sitemap.ts              # SEO sitemap
│   ├── services/[slug]/        # Service detail pages
│   ├── resources/              # Case studies, podcast, newsletter
│   ├── referral-wall/          # Testimonials page
│   └── privacy/                # Privacy policy
├── components/marketing/       # All marketing components
├── lib/
│   ├── marketing-data.ts       # All copy, testimonials, nav links
│   ├── structured-data.ts      # JSON-LD schema generators
│   └── utils.ts                # clsx + tailwind-merge
├── hooks/
│   ├── useScrollReveal.ts      # IntersectionObserver
│   └── useDropdownNav.ts       # Dropdown state
├── public/assets/              # Logos, images
├── tailwind.config.js          # Colors, fonts
└── next.config.js              # Standalone output
```

## External Services

| Service | Integration |
|---------|-------------|
| Booking | Notion Calendar (external link, no integration needed) |
| Email | hello@growthadvisory.ai |
| DNS | Cloudflare (growthadvisory.ai) |
| Hosting | Vercel (auto-deploy on push) |

## Common Commands

```bash
npm run dev              # Start dev server (port 3005)
npm run build            # Production build
npm run start            # Local production server
npm run lint             # ESLint check
```
