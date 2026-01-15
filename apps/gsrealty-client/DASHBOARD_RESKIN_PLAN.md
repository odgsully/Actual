# GSRealty Admin Dashboard Glassmorphism Reskin Plan

**Created**: January 15, 2026
**Status**: Pending Implementation
**Branch**: `tile-dialed` (or create `dashboard-glassmorphism`)

---

## Executive Summary

Transform the admin Dashboard from a light-themed bordered-card design to a modern **glassmorphism 3-column layout** while preserving 100% of existing business logic, navigation, authentication, and downstream functionality.

**Key Constraint**: Zero changes to `/lib/database/*`, `/lib/supabase/*`, `/app/api/*`, `/contexts/*`

---

## Current State Analysis

### Current Dashboard (`/app/admin/page.tsx` - 230 lines)
- Light theme with `bg-white` cards and `border-2` borders
- 2-column layout (sidebar + main content)
- **No database calls** - all stats hardcoded as placeholders (0 values)
- Uses: `useAuth()` for user.email, `CreateEventModal` with state management
- Data arrays: `stats` (4), `quickActions` (4), `features` (4)

### Current Layout (`/app/admin/layout.tsx` - 179 lines)
- Fixed 264px sidebar with `bg-brand-black`
- 6 navigation items (Dashboard, Clients, Upload MLS, ReportIt, MCAO Lookup, Settings)
- Mobile responsive with slide-in sidebar
- Uses: `useAuth()` for user/signOut, `BRAND` constants, `usePathname()`

### Template (`/new-template/crm-dash-templ/components/crm-dashboard.tsx` - 577 lines)
- Dark background with fractal glass image
- 12-column grid: `col-span-2` + `col-span-8` + `col-span-2`
- Glassmorphism: `backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl`
- Hover animations: `duration-700 ease-out hover:scale-[1.02]`

---

## Architecture Decisions

### Decision 1: Stay on Current Stack
- **Keep**: Next.js 14.2.33, React 18, Tailwind v3.4.1
- **Don't upgrade**: Next 15, React 19, Tailwind v4 (too risky)
- **Rationale**: Template patterns work in v3, no need for breaking changes

### Decision 2: Selective Template Adoption
**ADOPT**:
- 3-column grid layout (2-8-2)
- Glassmorphism card styling
- Dark background with glass overlay
- Hover scale animations
- Stat cards, header card patterns

**REMOVE** (not relevant):
- Sales Pipeline, Calendar, Campaigns nav items
- Sales Target card with progress bars
- Premium upgrade cards/banners
- AI Xperia chat card
- Contact list (replace with Features Overview)

### Decision 3: Component Strategy
- Create minimal new UI components (Input, Badge, Avatar)
- Reuse existing Card, Button components with new classNames
- No new state management or context needed

---

## Implementation Phases

### Phase 1: Foundation (No Breaking Changes)

#### 1.1 Install Dependencies
```bash
cd apps/gsrealty-client
npm install @radix-ui/react-avatar @radix-ui/react-progress
```

#### 1.2 Create `/components/ui/input.tsx`
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border bg-white/5 px-3 py-2 text-sm",
          "border-white/20 text-white placeholder:text-white/40",
          "focus:border-white/40 focus:bg-white/10 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

#### 1.3 Create `/components/ui/badge.tsx`
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

#### 1.4 Create `/components/ui/avatar.tsx`
```typescript
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-white/20 text-white",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```

---

### Phase 2: Styling Configuration

#### 2.1 Update `/tailwind.config.js`

Add to `theme.extend`:
```javascript
module.exports = {
  // ... existing config
  theme: {
    extend: {
      // ... existing extends

      // ADD THESE:
      colors: {
        // ... existing colors
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          'white-hover': 'rgba(255, 255, 255, 0.15)',
          border: 'rgba(255, 255, 255, 0.2)',
          'border-hover': 'rgba(255, 255, 255, 0.3)',
        },
      },
      transitionDuration: {
        '700': '700ms',
      },
      scale: {
        '102': '1.02',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Figtree', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xl': '24px',
      },
    },
  },
}
```

#### 2.2 Update `/app/globals.css`

Add at top after existing imports:
```css
/* Figtree Font */
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap');

/* Glassmorphism Utility Classes */
@layer components {
  .glass-card {
    @apply backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl;
  }

  .glass-card-hover {
    @apply transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15;
  }

  .glass-button {
    @apply bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30
           text-white transition-all duration-700 ease-out hover:scale-[1.02];
  }

  .glass-input {
    @apply bg-white/5 border border-white/20 rounded-xl text-white
           placeholder:text-white/40 focus:border-white/40 focus:bg-white/10;
  }

  .glass-nav-item {
    @apply w-full justify-start text-base text-white/80 hover:bg-white/10
           hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11;
  }

  .glass-nav-active {
    @apply bg-white/20 text-white border border-white/30;
  }
}

/* Backdrop-blur fallback for older browsers */
@supports not (backdrop-filter: blur(24px)) {
  .glass-card {
    @apply bg-black/80;
  }
}
```

#### 2.3 Add Background Image

Option A: Copy from template URL to `/public/assets/crm-background.jpg`
```
Source: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg
```

Option B: Use inline URL temporarily (works but adds external dependency)

---

### Phase 3: Layout Restructure

#### File: `/app/admin/layout.tsx`

**Key Transformations:**

1. **Background Layer**
```jsx
// BEFORE: <div className="min-h-screen bg-gray-50">
// AFTER:
<div className="min-h-screen relative overflow-hidden">
  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: 'url(/assets/crm-background.jpg)' }}
  />
  {/* Dark Overlay */}
  <div className="bg-black/30 absolute inset-0" />
```

2. **Grid Layout**
```jsx
// BEFORE: <div className="lg:ml-64">
// AFTER:
<div className="relative z-10 p-6 grid grid-cols-12 gap-6 min-h-screen">
  {/* Left Sidebar */}
  <Card className="col-span-2 glass-card p-6 h-fit hidden lg:flex flex-col">
    ...
  </Card>

  {/* Main Content */}
  <div className="col-span-12 lg:col-span-8 space-y-6 overflow-y-auto max-h-screen">
    {children}
  </div>

  {/* Right Sidebar - Dashboard only */}
  {pathname === '/admin' && (
    <Card className="col-span-2 glass-card p-6 h-fit hidden lg:block">
      <QuickActionsPanel quickActions={quickActions} />
    </Card>
  )}
</div>
```

3. **Navigation Styling**
```jsx
// BEFORE:
className={`${active ? 'bg-brand-red text-white' : 'text-gray-300 hover:bg-gray-800'}`}

// AFTER:
className={cn(
  "glass-nav-item",
  active && "glass-nav-active"
)}
```

4. **Keep Mobile Sidebar As-Is** (it overlays, so dark background not needed)

**Preserved Code Blocks** (copy exactly):
- `navigation` array (6 items)
- `isActive()` function
- `sidebarOpen` state
- `signOut` call
- BRAND logo/name rendering

---

### Phase 4: Dashboard Page Reskin

#### File: `/app/admin/page.tsx`

**Section-by-Section Transformation:**

#### 4.1 Header Card
```jsx
// BEFORE:
<div className="bg-white rounded-lg border-2 border-brand-black p-6">

// AFTER:
<Card className="glass-card p-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">
        Welcome back, {user?.email?.split('@')[0] || 'Admin'}! 📊
      </h1>
      <p className="text-white/60">
        Manage your clients and properties
      </p>
    </div>
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
        <Input className="pl-10 w-64" placeholder="Search..." />
      </div>
      <Button
        onClick={() => setIsEventModalOpen(true)}
        className="glass-button"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Event
      </Button>
    </div>
  </div>
</Card>
```

#### 4.2 Stats Grid
```jsx
// BEFORE:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat) => (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-brand-red">

// AFTER:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat) => {
    const Icon = stat.icon
    return (
      <Card key={stat.name} className="glass-card glass-card-hover p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">{stat.name}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-sm text-blue-400 mt-1">{stat.change}</p>
          </div>
          <Icon className={`h-8 w-8 ${stat.color.replace('bg-', 'text-').replace('-500', '-400')}`} />
        </div>
      </Card>
    )
  })}
</div>
```

#### 4.3 Two-Column Cards Section
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Features Card */}
  <Card className="glass-card p-6">
    <h3 className="text-xl font-semibold text-white mb-4">Available Features</h3>
    <div className="space-y-3">
      {features.map((feature) => {
        const Icon = feature.icon
        return (
          <div key={feature.name} className="flex items-start space-x-4 p-3 bg-white/5 rounded-xl">
            <div className="bg-brand-red/80 rounded-lg p-2 flex-shrink-0">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">{feature.name}</p>
              <p className="text-sm text-white/60">{feature.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  </Card>

  {/* Quick Links Card */}
  <Card className="glass-card p-6">
    <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
    <div className="space-y-3">
      {quickActions.map((action) => {
        const Icon = action.icon
        return (
          <a
            key={action.title}
            href={action.href}
            className="flex items-center space-x-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            <div className={`${action.color} rounded-lg p-2 flex-shrink-0`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">{action.title}</p>
              <p className="text-sm text-white/60">{action.description}</p>
            </div>
          </a>
        )
      })}
    </div>
  </Card>
</div>
```

#### 4.4 Keep CreateEventModal Unchanged
```jsx
{/* Event Creation Modal - NO CHANGES */}
<CreateEventModal
  isOpen={isEventModalOpen}
  onClose={() => setIsEventModalOpen(false)}
  onEventCreated={() => {
    console.log('Event created successfully')
  }}
/>
```

---

### Phase 5: Right Sidebar Component

#### Create `/components/admin/QuickActionsPanel.tsx`
```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Upload, Search, Settings, Plus, Bell, Calendar } from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

interface QuickActionsPanelProps {
  quickActions: QuickAction[]
}

export function QuickActionsPanel({ quickActions }: QuickActionsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions ⚡</h3>
        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant="ghost"
                asChild
                className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02]"
              >
                <a href={action.href}>
                  <Icon className="mr-3 h-4 w-4" />
                  {action.title}
                </a>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity 📈</h3>
        <div className="space-y-3">
          {[
            { action: 'Dashboard viewed', time: 'Just now', type: 'info' },
            { action: 'System ready', time: '1 min ago', type: 'success' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
              <div
                className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'info' ? 'bg-blue-400' : 'bg-white/60'
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-white">{activity.action}</p>
                <p className="text-xs text-white/60">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started Tip */}
      <Card className="bg-blue-500/10 border-blue-400/30 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <span className="font-semibold">💡 Tip:</span> Add your first client, then upload their MLS data to start generating reports.
        </p>
      </Card>
    </div>
  )
}
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `components/ui/input.tsx` | CREATE | Glassmorphism text input |
| `components/ui/badge.tsx` | CREATE | Status badge component |
| `components/ui/avatar.tsx` | CREATE | User avatar with fallback |
| `components/admin/QuickActionsPanel.tsx` | CREATE | Right sidebar content |
| `tailwind.config.js` | MODIFY | Add glass colors, scale, duration |
| `app/globals.css` | MODIFY | Figtree font, glass utilities |
| `app/admin/layout.tsx` | REWRITE | 3-column glassmorphism layout |
| `app/admin/page.tsx` | REWRITE | Glassmorphism dashboard cards |
| `public/assets/crm-background.jpg` | ADD | Background image |

---

## Dependency Graph

```
Phase 1 (Components)
    │
    ├── input.tsx ──────┐
    ├── badge.tsx ──────┤
    └── avatar.tsx ─────┤
                        │
Phase 2 (Styling) ──────┤
    │                   │
    ├── tailwind.config.js
    └── globals.css     │
                        │
Phase 3 (Layout) ───────┤
    │                   │
    └── layout.tsx      │
                        │
Phase 4 (Dashboard) ────┤
    │                   │
    └── page.tsx        │
                        │
Phase 5 (Sidebar) ──────┘
    │
    └── QuickActionsPanel.tsx
```

---

## Verification Checklist

### Build & Type Check
```bash
npm run typecheck  # Should pass with no errors
npm run build      # Should complete successfully
npm run dev        # Should start on port 3004
```

### Visual Verification
- [ ] Navigate to `/admin` - dark background with glass cards
- [ ] Glassmorphism blur effect visible on cards
- [ ] Hover over stat cards - scale animation triggers
- [ ] Figtree font renders (check Network tab)
- [ ] 3-column layout: sidebar (2) | main (8) | quick actions (2)

### Functional Verification
- [ ] Click "Dashboard" nav - stays on `/admin`
- [ ] Click "Clients" nav - goes to `/admin/clients`
- [ ] Click "Upload MLS" nav - goes to `/admin/upload`
- [ ] Click "ReportIt" nav - goes to `/admin/reportit`
- [ ] Click "MCAO Lookup" nav - goes to `/admin/mcao`
- [ ] Click "Settings" nav - goes to `/admin/settings`
- [ ] Click "Sign Out" - logs out user
- [ ] Click "New Event" button - modal opens
- [ ] Submit event in modal - API call succeeds
- [ ] User email displays in welcome message
- [ ] BRAND logo displays in sidebar

### Responsive Verification
- [ ] Resize to tablet (768px) - right sidebar hidden
- [ ] Resize to mobile (375px) - left sidebar hidden
- [ ] Tap hamburger menu - sidebar slides in
- [ ] Tap backdrop - sidebar closes

### Browser Compatibility
- [ ] Chrome - backdrop-blur works
- [ ] Safari - backdrop-blur works
- [ ] Firefox - backdrop-blur works (may need fallback)
- [ ] Edge - backdrop-blur works

---

## Rollback Plan

If critical issues arise:

```bash
# Revert modified files
git checkout HEAD -- app/admin/layout.tsx
git checkout HEAD -- app/admin/page.tsx
git checkout HEAD -- tailwind.config.js
git checkout HEAD -- app/globals.css

# Delete new files
rm components/ui/input.tsx
rm components/ui/badge.tsx
rm components/ui/avatar.tsx
rm components/admin/QuickActionsPanel.tsx
rm public/assets/crm-background.jpg
```

---

## Future Enhancements (Out of Scope)

After this dashboard reskin is tested and stable:

1. **Phase 2**: Apply glassmorphism to Clients list page
2. **Phase 3**: Apply glassmorphism to Upload MLS page
3. **Phase 4**: Apply glassmorphism to ReportIt page
4. **Phase 5**: Apply glassmorphism to MCAO Lookup page
5. **Phase 6**: Apply glassmorphism to Settings page
6. **Phase 7**: Update CreateEventModal to match glass theme
7. **Phase 8**: Add real-time stats from database (replace placeholders)
