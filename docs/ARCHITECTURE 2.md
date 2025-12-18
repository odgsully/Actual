# System Architecture

> Last Updated: December 2025
> Status: Phase 2 of Monorepo Migration (75% Complete)

## Overview

This is a **monorepo** containing a suite of real estate and property management applications built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MONOREPO ROOT                            │
├─────────────────────────────────────────────────────────────────┤
│  apps/                    │  packages/                          │
│  ├── gsrealty-client     │  ├── supabase (shared DB utils)     │
│  ├── wabbit-re           │  ├── ui (shared components)         │
│  ├── wabbit              │  └── utils (common utilities)       │
│  └── gs-site             │                                      │
├─────────────────────────────────────────────────────────────────┤
│                     SHARED INFRASTRUCTURE                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Supabase   │  │   Vercel     │  │   Hetzner    │          │
│  │  (Database)  │  │  (Hosting)   │  │  (Backup)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Applications

### 1. gsrealty-client (Port 3004) - PRIMARY

**Purpose**: Real estate CRM for managing clients, properties, and reports.

**Key Features**:
- MCAO (Maricopa County Assessor) property lookup
- ReportIt PDF/Excel generation system
- Client management and invitations
- MLS data upload and processing
- File storage and management

**Primary Tables**: `clients`, `files`, `mcao_cache`, `invitations`, `events`

**Status**: Active development, most feature-rich

---

### 2. wabbit-re (Port 3000)

**Purpose**: Property ranking platform for home buyers.

**Key Features**:
- 4-tile property evaluation interface
- User preference questionnaires
- Property matching algorithm
- Multi-user collaboration

**Primary Tables**: `properties`, `rankings`, `user_preferences`, `property_notifications`

**Status**: Functional, pending Supabase integration

---

### 3. wabbit (Port 3002)

**Purpose**: General-purpose ranking platform (non-real estate).

**Key Features**:
- Generic ranking interface
- Blog content ranking
- Social voting system

**Primary Tables**: `rankings_general`, `content_items`

**Status**: Minimal development

---

### 4. gs-site (Port 3003)

**Purpose**: Personal dashboard hub connecting all applications.

**Key Features**:
- Notion integration
- CRM overview widget
- App navigation hub

**Primary Tables**: None (read-only aggregator)

**Status**: Basic implementation

---

## Shared Packages

### packages/supabase
```typescript
// Shared Supabase client configuration
// Database types and utilities
// Connection management
```
**Status**: Created, not fully integrated

### packages/ui
```typescript
// Shared UI components (Button, Card, Modal)
// Theme configuration
// Design tokens
```
**Status**: Created, not fully integrated

### packages/utils
```typescript
// Common utilities (formatting, validation)
// Safety utilities (see docs/SAFETY_PROTOCOLS.md)
// Shared types
```
**Status**: Created, needs safety.ts

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Input    │────▶│   Next.js API   │────▶│    Supabase     │
│  (Browser/CLI)  │     │    Routes       │     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  External APIs  │
                        │  - MCAO/ArcGIS  │
                        │  - Google Maps  │
                        │  - OpenAI       │
                        └─────────────────┘
```

---

## Port Assignments

| App | Development Port | Production |
|-----|-----------------|------------|
| gsrealty-client | 3004 | Vercel/Hetzner |
| wabbit-re | 3000 | Vercel |
| wabbit | 3002 | Vercel |
| gs-site | 3003 | Vercel |

---

## Build System

**Turborepo** orchestrates builds across all apps:

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": {}
  }
}
```

**Commands**:
- `npm run dev` - Run all apps in parallel
- `npm run dev:gsrealty` - Run gsrealty-client only
- `npm run build` - Build all apps
- `turbo run build --filter=gsrealty-client` - Build specific app

---

## Environment Configuration

Each app has its own environment:
```
apps/gsrealty-client/.env.local
apps/wabbit-re/.env.local
apps/wabbit/.env.local
apps/gs-site/.env.local
```

Shared variables in root `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

App-specific variables:
```
# gsrealty-client
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=

# wabbit-re
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
```

---

## Related Documentation

- [Database Ownership](./DATABASE_OWNERSHIP.md) - Table ownership and access rules
- [Safety Protocols](./SAFETY_PROTOCOLS.md) - Guardrails and protection measures
- [Cross-App API](./CROSS_APP_API.md) - Inter-app communication patterns
- [Runbook](./RUNBOOK.md) - Emergency procedures
