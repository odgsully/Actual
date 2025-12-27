# shadcn/ui Components Reference for GS Site

> Style: **Lyra** (boxy, sharp, mono fonts) | Base Color: **Zinc** | Icon Library: **Lucide**

## Quick Install

```bash
# Install any component
npx shadcn@latest add <component-name>

# Install multiple components at once
npx shadcn@latest add button card table chart calendar badge tabs dialog input select
```

---

## Core UI Components

### Tiles & Cards

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **card** | Container with header, content, footer sections | None | `npx shadcn@latest add card` |
| **dialog** | Modal overlay for focused interactions | `@radix-ui/react-dialog` | `npx shadcn@latest add dialog` |
| **sheet** | Slide-out panel (drawer) from edges | `@radix-ui/react-dialog` | `npx shadcn@latest add sheet` |
| **drawer** | Bottom sheet drawer component | `vaul` | `npx shadcn@latest add drawer` |
| **hover-card** | Card that appears on hover | `@radix-ui/react-hover-card` | `npx shadcn@latest add hover-card` |
| **popover** | Floating content panel | `@radix-ui/react-popover` | `npx shadcn@latest add popover` |

**Card Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Tile Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>Main content here</CardContent>
  <CardFooter>Actions or metadata</CardFooter>
</Card>
```

---

### Tables & Data Display

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **table** | Data table with header, body, rows, cells | None | `npx shadcn@latest add table` |
| **skeleton** | Loading placeholder animation | None | `npx shadcn@latest add skeleton` |
| **badge** | Status indicators and labels | `@radix-ui/react-slot` | `npx shadcn@latest add badge` |
| **avatar** | User/entity image with fallback | `@radix-ui/react-avatar` | `npx shadcn@latest add avatar` |
| **separator** | Visual divider line | `@radix-ui/react-separator` | `npx shadcn@latest add separator` |

**Table Usage:**
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell><Badge>Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Charts & Visualization

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **chart** | Recharts wrapper with theming | `recharts@2.15.4`, `lucide-react` | `npx shadcn@latest add chart` |

**Chart Types Available:**
- **Area Charts**: `chart-area-default`, `chart-area-stacked`, `chart-area-gradient`
- **Bar Charts**: `chart-bar-default`, `chart-bar-horizontal`, `chart-bar-stacked`
- **Line Charts**: `chart-line-default`, `chart-line-dots`, `chart-line-multiple`
- **Pie Charts**: `chart-pie-simple`, `chart-pie-donut`, `chart-pie-legend`
- **Radar Charts**: `chart-radar-default`, `chart-radar-grid-circle`
- **Radial Charts**: `chart-radial-simple`, `chart-radial-stacked`

**Chart Usage:**
```tsx
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis } from "recharts"

<ChartContainer config={chartConfig}>
  <AreaChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <Area dataKey="value" fill="var(--chart-1)" />
    <ChartTooltip />
  </AreaChart>
</ChartContainer>
```

---

### Buttons & Actions

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **button** | Primary action element with variants | `@radix-ui/react-slot` | `npx shadcn@latest add button` |
| **button-group** | Grouped button container | `@radix-ui/react-slot` | `npx shadcn@latest add button-group` |
| **toggle** | On/off button state | `@radix-ui/react-toggle` | `npx shadcn@latest add toggle` |
| **toggle-group** | Exclusive/multiple toggle selection | `@radix-ui/react-toggle-group` | `npx shadcn@latest add toggle-group` |

**Button Variants:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

---

### Form Inputs

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **input** | Text input field | None | `npx shadcn@latest add input` |
| **textarea** | Multi-line text input | None | `npx shadcn@latest add textarea` |
| **select** | Dropdown selection | `@radix-ui/react-select` | `npx shadcn@latest add select` |
| **checkbox** | Boolean checkbox | `@radix-ui/react-checkbox` | `npx shadcn@latest add checkbox` |
| **radio-group** | Single selection from options | `@radix-ui/react-radio-group` | `npx shadcn@latest add radio-group` |
| **switch** | Toggle switch | `@radix-ui/react-switch` | `npx shadcn@latest add switch` |
| **slider** | Range value selector | `@radix-ui/react-slider` | `npx shadcn@latest add slider` |
| **input-otp** | One-time password input | `input-otp` | `npx shadcn@latest add input-otp` |
| **form** | Form validation with react-hook-form | `react-hook-form`, `zod` | `npx shadcn@latest add form` |
| **label** | Form field labels | `@radix-ui/react-label` | `npx shadcn@latest add label` |

**Input Usage:**
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>
```

---

### Calendar & Date Pickers

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **calendar** | Date selection calendar | `react-day-picker`, `date-fns` | `npx shadcn@latest add calendar` |

**Calendar Blocks Available:**
- `calendar-01` - Simple calendar
- `calendar-13` - With month/year dropdown
- `calendar-16` - With time picker
- `calendar-22` - Date picker (popover)
- `calendar-23` - Date range picker
- `calendar-31` - With event slots

**Calendar Usage:**
```tsx
import { Calendar } from "@/components/ui/calendar"

const [date, setDate] = useState<Date | undefined>(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="border"
/>
```

---

### Navigation

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **tabs** | Tabbed content sections | `@radix-ui/react-tabs` | `npx shadcn@latest add tabs` |
| **navigation-menu** | Site navigation with dropdowns | `@radix-ui/react-navigation-menu` | `npx shadcn@latest add navigation-menu` |
| **menubar** | Application menu bar | `@radix-ui/react-menubar` | `npx shadcn@latest add menubar` |
| **breadcrumb** | Page hierarchy breadcrumbs | None | `npx shadcn@latest add breadcrumb` |
| **pagination** | Page navigation controls | None | `npx shadcn@latest add pagination` |
| **sidebar** | Collapsible side navigation | Multiple | `npx shadcn@latest add sidebar` |

**Tabs Usage:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="analytics">Analytics content</TabsContent>
</Tabs>
```

---

### Menus & Dropdowns

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **dropdown-menu** | Action menu dropdown | `@radix-ui/react-dropdown-menu` | `npx shadcn@latest add dropdown-menu` |
| **context-menu** | Right-click context menu | `@radix-ui/react-context-menu` | `npx shadcn@latest add context-menu` |
| **command** | Command palette (⌘K) | `cmdk` | `npx shadcn@latest add command` |

---

### Feedback & Status

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **alert** | Status message banners | None | `npx shadcn@latest add alert` |
| **alert-dialog** | Confirmation dialog | `@radix-ui/react-alert-dialog` | `npx shadcn@latest add alert-dialog` |
| **progress** | Progress bar indicator | `@radix-ui/react-progress` | `npx shadcn@latest add progress` |
| **spinner** | Loading spinner | None | `npx shadcn@latest add spinner` |
| **sonner** | Toast notifications | `sonner` | `npx shadcn@latest add sonner` |
| **tooltip** | Hover information | `@radix-ui/react-tooltip` | `npx shadcn@latest add tooltip` |

**Progress Usage:**
```tsx
import { Progress } from "@/components/ui/progress"

<Progress value={66} className="w-full" />
```

---

### Layout & Structure

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **accordion** | Collapsible content sections | `@radix-ui/react-accordion` | `npx shadcn@latest add accordion` |
| **collapsible** | Show/hide content toggle | `@radix-ui/react-collapsible` | `npx shadcn@latest add collapsible` |
| **resizable** | Resizable panel layout | `react-resizable-panels` | `npx shadcn@latest add resizable` |
| **scroll-area** | Custom scrollbar container | `@radix-ui/react-scroll-area` | `npx shadcn@latest add scroll-area` |
| **aspect-ratio** | Fixed aspect ratio container | `@radix-ui/react-aspect-ratio` | `npx shadcn@latest add aspect-ratio` |
| **carousel** | Sliding content carousel | `embla-carousel-react` | `npx shadcn@latest add carousel` |

---

### Utility Components

| Component | Description | Dependencies | Install |
|-----------|-------------|--------------|---------|
| **kbd** | Keyboard shortcut display | None | `npx shadcn@latest add kbd` |
| **empty** | Empty state placeholder | None | `npx shadcn@latest add empty` |

---

## Pre-built Blocks

### Dashboard Blocks
```bash
npx shadcn@latest add dashboard-01  # Full dashboard with sidebar, charts, data table
```

### Sidebar Variations
```bash
npx shadcn@latest add sidebar-01    # Simple grouped navigation
npx shadcn@latest add sidebar-07    # Collapses to icons
npx shadcn@latest add sidebar-12    # With calendar
```

### Authentication Pages
```bash
npx shadcn@latest add login-01      # Simple login form
npx shadcn@latest add login-02      # Two column with cover image
npx shadcn@latest add signup-01     # Simple signup form
```

---

## Theme Colors (CSS Variables)

Current gs-site dark theme configuration:

| Variable | HSL Value | Use Case |
|----------|-----------|----------|
| `--background` | `240 10% 10%` | Page background (dark zinc) |
| `--foreground` | `0 0% 95%` | Primary text |
| `--card` | `240 6% 14%` | Card/tile backgrounds |
| `--card-foreground` | `0 0% 95%` | Card text |
| `--primary` | `0 0% 98%` | Primary buttons |
| `--secondary` | `240 5% 20%` | Secondary elements |
| `--muted` | `240 5% 18%` | Muted backgrounds |
| `--muted-foreground` | `240 5% 55%` | Subdued text |
| `--accent` | `240 5% 22%` | Hover states |
| `--border` | `240 5% 22%` | Border color |
| `--destructive` | `0 62.8% 50%` | Error/danger states |

### Chart Colors
| Variable | HSL Value | Color |
|----------|-----------|-------|
| `--chart-1` | `220 70% 55%` | Blue |
| `--chart-2` | `160 60% 50%` | Teal |
| `--chart-3` | `30 80% 55%` | Orange |
| `--chart-4` | `280 65% 60%` | Purple |
| `--chart-5` | `340 75% 55%` | Pink |

---

## Lyra Style Guidelines

The **Lyra** style applies these characteristics:

1. **Border Radius**: `0px` - All corners are sharp, no rounding
2. **Font**: Mono fonts (JetBrains Mono) for boxy aesthetic
3. **Spacing**: Standard spacing, clean layouts
4. **Borders**: Visible, subtle borders for definition

### Applying Lyra to Components

Components will automatically inherit Lyra styling through CSS variables. The `--radius: 0rem` setting ensures all components have sharp corners.

---

## Recommended Components for GS Dashboard

Based on current tiles, consider installing:

```bash
# Essential for dashboard tiles
npx shadcn@latest add card button badge

# For GS Scheduler tile
npx shadcn@latest add calendar

# For data display
npx shadcn@latest add table chart progress

# For EPSN3 Bin upload
npx shadcn@latest add input dialog

# For Whoop Insights dashboard
npx shadcn@latest add chart tabs

# For navigation
npx shadcn@latest add dropdown-menu tooltip

# For feedback
npx shadcn@latest add sonner skeleton
```

---

## File Structure After Installation

```
apps/gs-site/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── chart.tsx
│       ├── calendar.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       └── ...
├── lib/
│   └── utils.ts          # cn() utility (already exists)
└── components.json       # shadcn config (style: lyra)
```

---

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Theming Guide](https://ui.shadcn.com/docs/theming)
- [Component Examples](https://ui.shadcn.com/examples)
- [Lyra Style Preview](https://ui.shadcn.com/create?style=lyra)
