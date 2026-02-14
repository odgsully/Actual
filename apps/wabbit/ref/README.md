# Wabbit

Gesture-driven ranking/scoring tool with async collaboration.

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Backend + DB | Supabase (Postgres) | Auth, data, RLS, Edge Functions |
| Web App | Vite + React SPA + Tailwind + Zustand | Browser ranking UI (behind auth — no SSR needed) |
| Landing Page | Astro (static HTML) | SEO/GEO-optimized marketing page with React islands |
| iOS App | Swift (SwiftUI + UIKit gestures) | Native gesture-driven ranking |
| Slack | Supabase Edge Functions + Slack API | Notifications + interactive ranking |

## Web App Layout

Three-column layout inspired by OneNote's file system navigation:

- **Sidebar (280px)** — Two-level folder tree (user-created Folders > Wabbs), search, content type filter chips, sort/filter. Wabb items show rank mode icon + color-coded progress dot.
- **Main Content (flex)** — Record display + ranking controls. Settings gear icon (top-right) opens Wabb overview/config popup.
- **Context Panel (320px, collapsed by default)** — RAVG display, team progress, Wabb stats. Toggle open via button.

## Project Structure

```
wabbit/
├── ref/                   # Reference materials & documentation
│   ├── docs/              # Synthesized docs (PRD, Architecture, Glossary, Tasks, Integrations)
│   ├── core/              # Core concept docs
│   ├── schema.sql         # Reference database schema
│   ├── page.tsx           # Reference web page component
│   └── RankingGestureView.swift  # Reference iOS gesture view
├── supabase/              # Database schema, migrations, edge functions
│   └── schema.sql         # Core tables (profiles, folders, collections, records, rankings, collaborators) + RLS
├── web/                   # Vite + React SPA (ranking app)
│   └── src/
│       ├── app/           # Routes (React Router)
│       ├── components/    # React components (Sidebar, FolderTree, RankingControls, ContextPanel, etc.)
│       ├── lib/           # Supabase clients, Zustand store, types
│       └── types/         # TypeScript types
├── landing/               # Astro static marketing site
│   └── src/
│       ├── pages/         # Static HTML pages
│       └── islands/       # React interactive components
├── ios/                   # Native iOS application
│   └── Wabbit/
│       ├── Views/         # SwiftUI views
│       ├── Gestures/      # UIKit gesture recognizer bridge
│       ├── Models/        # Data models
│       └── Services/      # Supabase SDK integration
└── slack/                 # Slack app integration
    └── functions/         # Edge functions for Slack events
```

## Phase Roadmap

- **Phase 1**: Web app + Supabase backend (validate data model + ranking flow)
- **Phase 2**: Native iOS app (gesture system is the star)
- **Phase 3**: Slack integration (notifications → interactive ranking)

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase CLI (`npm install -g supabase`)
- Xcode 15+ (for iOS)

### Web App (Vite + React SPA)
```bash
cd web
cp .env.local.example .env.local  # Add your Supabase keys
npm install
npm run dev                        # Starts on localhost:5173
```

### Landing Page (Astro)
```bash
cd landing
npm install
npm run dev                        # Starts on localhost:4321
```

### Database
```bash
supabase start                     # Local Supabase instance
supabase db reset                  # Apply schema.sql
```

### iOS
Open `ios/Wabbit.xcodeproj` in Xcode. Update `SupabaseService.swift` with your project URL and anon key.
