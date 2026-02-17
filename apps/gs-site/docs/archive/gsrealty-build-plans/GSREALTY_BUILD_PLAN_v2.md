# GSRealty Client Management System - v2 Implementation Plan
## Monorepo-Aligned Architecture

## 📊 Executive Summary

**Project**: Real estate client management system for Maricopa County, Arizona realtor services
**Location**: `apps/gsrealty-client/` (separate app in monorepo)
**Deployment**: Vercel (unified with monorepo)
**Timeline**: 4-6 weeks
**Feasibility**: 9/10 ✅
**Risk Level**: LOW (proven architecture patterns)

---

## 🎯 Project Overview

### What Changed from v1?
- ❌ **Removed**: Django Ninja backend → **Using**: Next.js API routes
- ❌ **Removed**: Local filesystem storage → **Using**: Supabase Storage
- ❌ **Removed**: Standalone deployment → **Using**: Monorepo integration
- ✅ **Added**: Shared package usage (@gs/supabase, @gs/ui, @gs/utils)
- ✅ **Added**: Code reuse from wabbit-re (real estate patterns)
- ✅ **Added**: Consistent deployment with existing apps

### Core Features (Unchanged)
- Admin dashboard for client/property management
- Client portal for viewing their property data
- File upload system (CSV, XLSX, HTML)
- Excel template processing with complex sheet structures
- Automatic folder creation ("LastName MM.YY" format)
- MCAO-UI integration for APN lookups (Phase 2)
- Property data management with Supabase
- Role-based authentication (admin vs client)

---

## 🏗️ Architecture

### Tech Stack (Aligned with Monorepo)
```yaml
Frontend: Next.js 14+ with TypeScript, App Router
Styling: Tailwind CSS + shadcn/ui
Backend: Next.js API Routes (no Django!)
Database: Supabase (PostgreSQL with RLS)
Storage: Supabase Storage (no local filesystem!)
Authentication: Supabase Auth
Hosting: Vercel (monorepo deployment)
Build Tool: Turborepo (shared with all apps)
```

### Project Structure
```
apps/gsrealty-client/
├── app/
│   ├── (admin)/                    # Admin route group
│   │   ├── dashboard/              # Main admin dashboard
│   │   │   └── page.tsx
│   │   ├── clients/                # Client management
│   │   │   ├── page.tsx            # List view
│   │   │   ├── new/                # Create client
│   │   │   └── [id]/               # Edit/view client
│   │   ├── files/                  # File management
│   │   │   ├── upload/
│   │   │   └── process/
│   │   └── mcao/                   # MCAO integration tile (Phase 2)
│   ├── (client)/                   # Client route group
│   │   ├── portal/                 # Client dashboard
│   │   ├── properties/             # View properties
│   │   └── documents/              # View documents
│   ├── api/                        # Next.js API Routes
│   │   ├── clients/
│   │   │   ├── route.ts            # GET, POST /api/clients
│   │   │   └── [id]/route.ts       # GET, PUT, DELETE /api/clients/:id
│   │   ├── files/
│   │   │   ├── upload/route.ts     # POST /api/files/upload
│   │   │   ├── process/route.ts    # POST /api/files/process
│   │   │   └── [id]/route.ts       # GET, DELETE /api/files/:id
│   │   ├── properties/
│   │   │   └── [id]/route.ts
│   │   ├── mcao/                   # Phase 2
│   │   │   ├── search/route.ts
│   │   │   └── bulk/route.ts
│   │   └── auth/
│   │       ├── login/route.ts
│   │       └── activity/route.ts
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── layout.tsx
│   └── page.tsx                    # Landing/login redirect
├── components/
│   ├── admin/
│   │   ├── ClientTable.tsx
│   │   ├── FileUploader.tsx
│   │   ├── ExcelProcessor.tsx
│   │   └── QuickActions.tsx
│   ├── client/
│   │   ├── PropertyCard.tsx
│   │   ├── DocumentList.tsx
│   │   └── ActivityTimeline.tsx
│   ├── shared/
│   │   ├── Navigation.tsx
│   │   └── RoleGuard.tsx
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── excel/
│   │   ├── processor.ts            # Excel template processor
│   │   ├── validators.ts           # File validation
│   │   └── templates.ts            # Template definitions
│   ├── storage/
│   │   ├── client.ts               # Supabase Storage client
│   │   ├── upload.ts               # Upload utilities
│   │   └── folder-generator.ts     # "LastName MM.YY" logic
│   ├── mcao/                       # Phase 2
│   │   ├── api.ts                  # MCAO API integration
│   │   └── apn-lookup.ts           # APN lookup (TS port)
│   └── auth/
│       ├── middleware.ts
│       └── activity-tracker.ts
├── package.json
├── next.config.js                  # basePath: '/gsrealty'
├── tsconfig.json
└── .env.local -> ../../.env.local  # Symlink to root env
```

### Monorepo Integration Points
```typescript
// Shared package imports
import { createServerClient } from '@gs/supabase'      // From packages/supabase
import { Button, Card, Input } from '@gs/ui'           // From packages/ui
import { formatDate, slugify } from '@gs/utils'        // From packages/utils

// Leverage wabbit-re patterns
// Copy from: apps/wabbit-re/lib/database/property-manager.ts
// Adapt for client management instead of property ranking
```

---

## 📋 Implementation Phases

## Phase 0: Pre-Flight & Monorepo Setup ✈️
*Duration: 3-5 days*
*Prerequisites: Complete after main monorepo Phase 2 or Phase 3*

### Decision Gate
- [ ] **DECISION**: Timing - Start now or wait for Phase 3 completion?
  - **Option A**: Start now (parallel to Phase 3) - Slower but earlier delivery
  - **Option B**: After Phase 3 - Faster build, proven integration patterns
  - **Recommendation**: After Phase 3 (learn from integration work)

### Monorepo Readiness Check
- [ ] Verify monorepo Phase 2 is complete (3+ apps running)
- [ ] Confirm shared packages are stable (@gs/supabase, @gs/ui, @gs/utils)
- [ ] Review wabbit-re codebase for reusable patterns
- [ ] Document current routing strategy (subdirectory paths)

### Environment Setup
- [ ] Verify Supabase project is accessible
- [ ] Confirm Supabase Storage is enabled
- [ ] Check MCAO API credentials (if available)
- [ ] Review .env.local for required variables

### Create Base Structure (FROM PROJECT ROOT!)
```bash
# NEVER use cd - always operate from root!

# Option 1: Fork from wabbit-re (RECOMMENDED)
cp -r apps/wabbit-re apps/gsrealty-client

# Clean out wabbit-re specific code
# Keep: Auth, Supabase setup, file structure, API patterns
# Remove: Property ranking, scraping, feeds

# Option 2: Start fresh
npx create-next-app@latest apps/gsrealty-client --typescript --tailwind --app
```

### Update Root Configuration
```bash
# Add to root package.json workspaces (already configured)
# Add scripts to root package.json
```

**Root package.json scripts to add:**
```json
{
  "scripts": {
    "dev:gsrealty": "turbo run dev --filter=gsrealty-client",
    "build:gsrealty": "turbo run build --filter=gsrealty-client",
    "test:gsrealty": "turbo run test --filter=gsrealty-client"
  }
}
```

### App Configuration
**Create `apps/gsrealty-client/package.json`:**
```json
{
  "name": "gsrealty-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3004",
    "build": "next build",
    "start": "next start -p 3004",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "xlsx": "^0.18.5",
    "papaparse": "^5.4.1",
    "date-fns": "^3.0.6",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/papaparse": "^5.3.14",
    "typescript": "^5",
    "tailwindcss": "^3.4.1"
  }
}
```

**Create `apps/gsrealty-client/next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/gsrealty',
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['YOUR_SUPABASE_PROJECT.supabase.co'],
  },
}

module.exports = nextConfig
```

### Environment Variables
```bash
# Create symlink to root .env.local
ln -s ../../.env.local apps/gsrealty-client/.env.local

# Verify required variables exist in root .env.local:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - MCAO_API_KEY (if available)
# - MCAO_API_BASE_URL (if available)
```

### Verification Checkpoint 0
```bash
# From project root:
npm install
npm run dev:gsrealty

# Should start on http://localhost:3004/gsrealty
# Should show Next.js default page (if fresh) or wabbit-re page (if forked)
```

---

## Phase 1: Database Schema & Supabase Storage 🗄️
*Duration: 3-5 days*

### Create Supabase Tables

**Run in Supabase SQL Editor:**

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.gsrealty_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  UNIQUE(auth_user_id)
);

-- Clients table
CREATE TABLE public.gsrealty_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.gsrealty_users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  property_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE public.gsrealty_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  apn TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'AZ',
  zip TEXT,
  property_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login activity tracking
CREATE TABLE public.gsrealty_login_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.gsrealty_users(id) ON DELETE CASCADE,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Uploaded files (metadata only, actual files in Supabase Storage)
CREATE TABLE public.gsrealty_uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'html', 'pdf')),
  storage_path TEXT NOT NULL, -- Supabase Storage path
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.gsrealty_users(id),
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processing_status TEXT,
  processing_errors JSONB
);

-- Admin settings
CREATE TABLE public.gsrealty_admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.gsrealty_users(id)
);

-- Create indexes for performance
CREATE INDEX idx_clients_user_id ON public.gsrealty_clients(user_id);
CREATE INDEX idx_properties_client_id ON public.gsrealty_properties(client_id);
CREATE INDEX idx_files_client_id ON public.gsrealty_uploaded_files(client_id);
CREATE INDEX idx_login_activity_user_id ON public.gsrealty_login_activity(user_id);
CREATE INDEX idx_properties_apn ON public.gsrealty_properties(apn);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_gsrealty_clients_updated_at
  BEFORE UPDATE ON public.gsrealty_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gsrealty_properties_updated_at
  BEFORE UPDATE ON public.gsrealty_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.gsrealty_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsrealty_admin_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.gsrealty_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Full access to everything
CREATE POLICY "Admins have full access to users"
  ON public.gsrealty_users
  FOR ALL
  USING (is_admin());

CREATE POLICY "Admins have full access to clients"
  ON public.gsrealty_clients
  FOR ALL
  USING (is_admin());

CREATE POLICY "Admins have full access to properties"
  ON public.gsrealty_properties
  FOR ALL
  USING (is_admin());

CREATE POLICY "Admins have full access to files"
  ON public.gsrealty_uploaded_files
  FOR ALL
  USING (is_admin());

CREATE POLICY "Admins have full access to settings"
  ON public.gsrealty_admin_settings
  FOR ALL
  USING (is_admin());

-- Clients: Read own data only
CREATE POLICY "Clients can view own user record"
  ON public.gsrealty_users
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Clients can view own client record"
  ON public.gsrealty_clients
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.gsrealty_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own properties"
  ON public.gsrealty_properties
  FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM public.gsrealty_clients c
      JOIN public.gsrealty_users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own files"
  ON public.gsrealty_uploaded_files
  FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM public.gsrealty_clients c
      JOIN public.gsrealty_users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Login activity: Users can view own, admins can view all
CREATE POLICY "Users can view own login activity"
  ON public.gsrealty_login_activity
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.gsrealty_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all login activity"
  ON public.gsrealty_login_activity
  FOR SELECT
  USING (is_admin());
```

### Setup Supabase Storage

**In Supabase Dashboard → Storage:**

```sql
-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('gsrealty-documents', 'gsrealty-documents', false);

-- Storage policies for bucket
CREATE POLICY "Admins can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'gsrealty-documents'
    AND is_admin()
  );

CREATE POLICY "Admins can view all files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'gsrealty-documents'
    AND is_admin()
  );

CREATE POLICY "Clients can view own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'gsrealty-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::TEXT FROM public.gsrealty_clients c
      JOIN public.gsrealty_users u ON c.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'gsrealty-documents'
    AND is_admin()
  );
```

**Folder Structure in Supabase Storage:**
```
gsrealty-documents/
├── {client_id}/
│   ├── LastName_MM_YY/
│   │   ├── uploads/
│   │   │   ├── original.xlsx
│   │   │   └── data.csv
│   │   ├── processed/
│   │   │   └── template_filled.xlsx
│   │   └── html/
│   │       └── custom_page.html
│   └── documents/
│       └── contract.pdf
```

### Create Storage Utilities

**File: `apps/gsrealty-client/lib/storage/client.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const storage = createClient(supabaseUrl, supabaseKey).storage

export const BUCKET_NAME = 'gsrealty-documents'

/**
 * Generate folder name in format: LastName_MM.YY
 */
export function generateFolderName(lastName: string): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  return `${lastName}_${month}.${year}`
}

/**
 * Generate storage path for client files
 */
export function getClientPath(clientId: string, lastName: string): string {
  const folderName = generateFolderName(lastName)
  return `${clientId}/${folderName}`
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  clientId: string,
  lastName: string,
  subfolder: 'uploads' | 'processed' | 'html' | 'documents' = 'uploads'
) {
  const path = `${getClientPath(clientId, lastName)}/${subfolder}/${file.name}`

  const { data, error } = await storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error
  return { path: data.path, fullPath: `${BUCKET_NAME}/${data.path}` }
}

/**
 * Download file from Supabase Storage
 */
export async function downloadFile(path: string) {
  const { data, error } = await storage
    .from(BUCKET_NAME)
    .download(path)

  if (error) throw error
  return data
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600) {
  const { data, error } = await storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

/**
 * List files in a client folder
 */
export async function listClientFiles(clientId: string) {
  const { data, error } = await storage
    .from(BUCKET_NAME)
    .list(clientId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) throw error
  return data
}
```

### Verification Checkpoint 1
- [ ] All tables created in Supabase
- [ ] RLS policies active and tested
- [ ] Storage bucket created
- [ ] Storage policies configured
- [ ] Can upload test file to storage
- [ ] Can retrieve file from storage
- [ ] Admin can access all data
- [ ] Client can only access own data

---

## Phase 2: Authentication & User Management 🔐
*Duration: 3-4 days*

### Setup Supabase Auth Helpers

**File: `apps/gsrealty-client/lib/auth/server.ts`**
```typescript
import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(): Promise<'admin' | 'client' | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('gsrealty_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  return data?.role as 'admin' | 'client' | null
}
```

**File: `apps/gsrealty-client/lib/auth/client.ts`**
```typescript
'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClientComponent() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Login Activity Tracker

**File: `apps/gsrealty-client/lib/auth/activity-tracker.ts`**
```typescript
import { createServerClient } from './server'

export async function trackLoginActivity(userId: string, request: Request) {
  const supabase = await createServerClient()

  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  await supabase.from('gsrealty_login_activity').insert({
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}

export async function updateLastLogin(userId: string) {
  const supabase = await createServerClient()

  await supabase
    .from('gsrealty_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId)
}
```

### Auth Middleware

**File: `apps/gsrealty-client/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/gsrealty/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/gsrealty/auth/login', request.url))
    }

    // Check if user is admin
    const { data } = await supabase
      .from('gsrealty_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (data?.role !== 'admin') {
      return NextResponse.redirect(new URL('/gsrealty/portal', request.url))
    }
  }

  // Protected client routes
  if (request.nextUrl.pathname.startsWith('/gsrealty/portal')) {
    if (!user) {
      return NextResponse.redirect(new URL('/gsrealty/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/gsrealty/dashboard/:path*', '/gsrealty/portal/:path*']
}
```

### Login Page

**File: `apps/gsrealty-client/app/auth/login/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponent } from '@/lib/auth/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponent()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check user role and redirect accordingly
    const { data: userData } = await supabase
      .from('gsrealty_users')
      .select('role')
      .eq('auth_user_id', data.user.id)
      .single()

    if (userData?.role === 'admin') {
      router.push('/gsrealty/dashboard')
    } else {
      router.push('/gsrealty/portal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">GSRealty Login</h2>
          <p className="mt-2 text-center text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### Verification Checkpoint 2
- [ ] Can create admin user in Supabase
- [ ] Can create client user in Supabase
- [ ] Login page works
- [ ] Admin redirects to /gsrealty/dashboard
- [ ] Client redirects to /gsrealty/portal
- [ ] Login activity tracked
- [ ] Last login updated
- [ ] Middleware protects routes

---

## Phase 3: Admin Dashboard - Core Features 📊
*Duration: 5-7 days*

### Dashboard Layout

**File: `apps/gsrealty-client/app/(admin)/layout.tsx`**
```typescript
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth/server'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = await getUserRole()

  if (role !== 'admin') {
    redirect('/gsrealty/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

### Client Management API

**File: `apps/gsrealty-client/app/api/clients/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: clients, error } = await supabase
    .from('gsrealty_clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(clients)
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data: client, error } = await supabase
    .from('gsrealty_clients')
    .insert({
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      property_address: body.propertyAddress,
      notes: body.notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(client, { status: 201 })
}
```

**File: `apps/gsrealty-client/app/api/clients/[id]/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

// GET /api/clients/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()

  const { data: client, error } = await supabase
    .from('gsrealty_clients')
    .select('*, gsrealty_properties(*), gsrealty_uploaded_files(*)')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(client)
}

// PUT /api/clients/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data: client, error } = await supabase
    .from('gsrealty_clients')
    .update({
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      property_address: body.propertyAddress,
      notes: body.notes,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(client)
}

// DELETE /api/clients/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('gsrealty_clients')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### Client List View

**File: `apps/gsrealty-client/app/(admin)/dashboard/clients/page.tsx`**
```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const res = await fetch('/gsrealty/api/clients')
    const data = await res.json()
    setClients(data)
    setLoading(false)
  }

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Link
          href="/gsrealty/dashboard/clients/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Client
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/gsrealty/dashboard/clients/${client.id}`} className="text-blue-600 hover:underline">
                      {client.first_name} {client.last_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(client.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/gsrealty/dashboard/clients/${client.id}`} className="text-blue-600 hover:underline mr-4">
                      Edit
                    </Link>
                    <button className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

### Verification Checkpoint 3
- [ ] Admin dashboard layout renders
- [ ] Can create new client
- [ ] Can list all clients
- [ ] Can search/filter clients
- [ ] Can view client details
- [ ] Can edit client
- [ ] Can delete client
- [ ] All API routes work

---

## Phase 4: File Upload & Processing System 📁
*Duration: 5-7 days*

### File Upload API

**File: `apps/gsrealty-client/app/api/files/upload/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'
import { uploadFile } from '@/lib/storage/client'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const formData = await request.formData()

  const file = formData.get('file') as File
  const clientId = formData.get('clientId') as string
  const lastName = formData.get('lastName') as string

  if (!file || !clientId || !lastName) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  try {
    // Upload to Supabase Storage
    const { path, fullPath } = await uploadFile(file, clientId, lastName)

    // Save metadata to database
    const { data: fileRecord, error } = await supabase
      .from('gsrealty_uploaded_files')
      .insert({
        client_id: clientId,
        file_name: file.name,
        file_type: file.name.endsWith('.xlsx') ? 'xlsx' :
                   file.name.endsWith('.csv') ? 'csv' :
                   file.name.endsWith('.html') ? 'html' : 'pdf',
        storage_path: path,
        file_size: file.size,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      file: fileRecord,
      path: fullPath
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### Excel Template Processor

**File: `apps/gsrealty-client/lib/excel/processor.ts`**
```typescript
import * as XLSX from 'xlsx'

export interface ExcelTemplate {
  comps?: any[]
  full_api_call?: any[]
  analysis?: any[]
  calcs?: any[]
  maricopa?: any[]
  half_mile?: any[]
  lot?: any[]
}

/**
 * Process uploaded Excel file according to template structure
 */
export async function processExcelTemplate(file: File): Promise<ExcelTemplate> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const template: ExcelTemplate = {}

  // Process each sheet according to template rules
  const sheetNames = workbook.SheetNames

  sheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName]

    switch (sheetName.toLowerCase()) {
      case 'comps':
        // Column A blank (manual notes), MLS data starts Column B
        template.comps = XLSX.utils.sheet_to_json(worksheet, {
          range: 'B:Z', // Start from column B
          defval: ''
        })
        break

      case 'full_api_call':
        // Column A blank, MLS data starts Column B
        template.full_api_call = XLSX.utils.sheet_to_json(worksheet, {
          range: 'B:Z',
          defval: ''
        })
        break

      case 'analysis':
        // Full data processing
        template.analysis = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        break

      case 'calcs':
        // Calculations sheet
        template.calcs = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        break

      case 'maricopa':
        // Rows 2-24 in Column C, matrix from row 26
        const maricopaData: any = {
          columnC_rows_2_24: [],
          matrix: []
        }

        // Extract rows 2-24 from Column C
        for (let row = 2; row <= 24; row++) {
          const cellAddress = `C${row}`
          const cellValue = worksheet[cellAddress]?.v
          maricopaData.columnC_rows_2_24.push(cellValue)
        }

        // Extract matrix starting from row 26
        const matrixRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        matrixRange.s.r = 25 // Start from row 26 (0-indexed, so 25)

        const matrixSheet = Object.keys(worksheet)
          .filter(key => {
            const decoded = XLSX.utils.decode_cell(key)
            return decoded.r >= 25
          })
          .reduce((obj, key) => {
            obj[key] = worksheet[key]
            return obj
          }, {} as any)

        maricopaData.matrix = XLSX.utils.sheet_to_json(matrixSheet, { defval: '' })
        template.maricopa = maricopaData
        break

      case '0.5mile':
        // Half-mile radius comps
        template.half_mile = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        break

      case 'lot':
        // All cells light grey background (metadata only, process normally)
        template.lot = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        break
    }
  })

  return template
}

/**
 * Generate Excel file from template data
 */
export function generateExcelFromTemplate(template: ExcelTemplate): Buffer {
  const workbook = XLSX.utils.book_new()

  // Create each sheet
  if (template.comps) {
    const ws = XLSX.utils.json_to_sheet(template.comps)
    XLSX.utils.book_append_sheet(workbook, ws, 'comps')
  }

  if (template.full_api_call) {
    const ws = XLSX.utils.json_to_sheet(template.full_api_call)
    XLSX.utils.book_append_sheet(workbook, ws, 'Full_API_call')
  }

  if (template.analysis) {
    const ws = XLSX.utils.json_to_sheet(template.analysis)
    XLSX.utils.book_append_sheet(workbook, ws, 'Analysis')
  }

  if (template.calcs) {
    const ws = XLSX.utils.json_to_sheet(template.calcs)
    XLSX.utils.book_append_sheet(workbook, ws, 'Calcs')
  }

  if (template.maricopa) {
    // Complex sheet with specific structure
    const ws = XLSX.utils.aoa_to_sheet([[]])

    // Add Column C rows 2-24
    if (Array.isArray(template.maricopa.columnC_rows_2_24)) {
      template.maricopa.columnC_rows_2_24.forEach((value: any, index: number) => {
        const cellAddress = `C${index + 2}`
        XLSX.utils.sheet_add_aoa(ws, [[value]], { origin: cellAddress })
      })
    }

    // Add matrix from row 26
    if (template.maricopa.matrix) {
      XLSX.utils.sheet_add_json(ws, template.maricopa.matrix, {
        origin: 'A26',
        skipHeader: false
      })
    }

    XLSX.utils.book_append_sheet(workbook, ws, 'Maricopa')
  }

  if (template.half_mile) {
    const ws = XLSX.utils.json_to_sheet(template.half_mile)
    XLSX.utils.book_append_sheet(workbook, ws, '0.5mile')
  }

  if (template.lot) {
    const ws = XLSX.utils.json_to_sheet(template.lot)
    // Add light grey background styling (requires xlsx-style or similar)
    XLSX.utils.book_append_sheet(workbook, ws, 'Lot')
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
```

### File Upload Component

**File: `apps/gsrealty-client/components/admin/FileUploader.tsx`**
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploaderProps {
  clientId: string
  lastName: string
  onUploadComplete?: (file: any) => void
}

export default function FileUploader({
  clientId,
  lastName,
  onUploadComplete
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)
    formData.append('lastName', lastName)

    try {
      const res = await fetch('/gsrealty/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setProgress(100)
        onUploadComplete?.(data.file)
      } else {
        alert(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Upload error: ${error}`)
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }, [clientId, lastName, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/html': ['.html'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <p className="text-lg font-medium">Uploading...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the file here'
                : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              XLSX, CSV, HTML, or PDF (max 10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Verification Checkpoint 4
- [ ] Can upload Excel files
- [ ] Can upload CSV files
- [ ] Can upload HTML files
- [ ] Files stored in Supabase Storage
- [ ] File metadata saved to database
- [ ] Folder structure follows "LastName MM.YY" format
- [ ] Excel processor handles all sheet types
- [ ] Can generate Excel from template data

---

## Phase 5: Client Portal 👤
*Duration: 3-4 days*

### Client Portal Layout

**File: `apps/gsrealty-client/app/(client)/layout.tsx`**
```typescript
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/server'
import ClientNav from '@/components/client/ClientNav'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/gsrealty/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

### Client Dashboard

**File: `apps/gsrealty-client/app/(client)/portal/page.tsx`**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClientComponent } from '@/lib/auth/client'

export default function ClientPortalPage() {
  const [client, setClient] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const supabase = createClientComponent()

  useEffect(() => {
    loadClientData()
  }, [])

  async function loadClientData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get client record
    const { data: userData } = await supabase
      .from('gsrealty_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData) return

    const { data: clientData } = await supabase
      .from('gsrealty_clients')
      .select('*')
      .eq('user_id', userData.id)
      .single()

    setClient(clientData)

    if (clientData) {
      // Load properties
      const { data: props } = await supabase
        .from('gsrealty_properties')
        .select('*')
        .eq('client_id', clientData.id)

      setProperties(props || [])

      // Load documents
      const { data: docs } = await supabase
        .from('gsrealty_uploaded_files')
        .select('*')
        .eq('client_id', clientData.id)

      setDocuments(docs || [])
    }
  }

  if (!client) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {client.first_name}!</h1>
        <p className="text-gray-600 mt-2">View your properties and documents</p>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Properties</h2>
        {properties.length === 0 ? (
          <p className="text-gray-500">No properties yet</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{property.address}</h3>
                <p className="text-sm text-gray-600">
                  {property.city}, {property.state} {property.zip}
                </p>
                {property.apn && (
                  <p className="text-xs text-gray-500 mt-2">APN: {property.apn}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents available</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between border-b py-3">
                <div>
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded {new Date(doc.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Verification Checkpoint 5
- [ ] Client can log in
- [ ] Client portal dashboard renders
- [ ] Client can view their properties
- [ ] Client can view their documents
- [ ] Client can download files
- [ ] Client cannot access admin routes
- [ ] Client cannot view other clients' data

---

## Phase 6: MCAO Integration & APN Lookup (OPTIONAL - Phase 2) 🗺️
*Duration: 5-7 days*
*Can be deferred to post-launch*

### Decision Point
- [ ] **DECISION**: Include MCAO integration in MVP or defer to Phase 2?
  - **Option A**: Include now - Adds 5-7 days, complete feature set
  - **Option B**: Defer to Phase 2 - Ship faster, add later
  - **Recommendation**: Defer to Phase 2 unless critical for launch

### MCAO API Integration (if proceeding)

**File: `apps/gsrealty-client/lib/mcao/api.ts`**
```typescript
const MCAO_API_KEY = process.env.MCAO_API_KEY!
const MCAO_BASE_URL = process.env.MCAO_API_BASE_URL!

export async function searchByAPN(apn: string) {
  const response = await fetch(`${MCAO_BASE_URL}/search?apn=${apn}`, {
    headers: {
      'Authorization': `Bearer ${MCAO_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error('MCAO API request failed')
  }

  return response.json()
}

export async function bulkAPNSearch(apns: string[]) {
  const response = await fetch(`${MCAO_BASE_URL}/bulk-search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MCAO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apns }),
  })

  if (!response.ok) {
    throw new Error('MCAO bulk search failed')
  }

  return response.json()
}
```

### APN Lookup (TypeScript Port)

**File: `apps/gsrealty-client/lib/mcao/apn-lookup.ts`**
```typescript
/**
 * TypeScript port of apn_lookup.py
 * Uses MCAO API for APN lookups from addresses
 */

interface Address {
  street: string
  city: string
  state: string
  zip?: string
}

export async function lookupAPNFromAddress(address: Address): Promise<string | null> {
  // Implement address parsing and MCAO API call
  // This would use the MCAO API's geocoding/search functionality

  try {
    const searchQuery = `${address.street}, ${address.city}, ${address.state} ${address.zip || ''}`
    const response = await searchByAPN(searchQuery)

    return response.apn || null
  } catch (error) {
    console.error('APN lookup failed:', error)
    return null
  }
}

export async function bulkAddressToAPN(addresses: Address[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // Process addresses in batches
  const batchSize = 10
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize)

    // Process batch (implement batch processing logic)
    // For now, sequential processing
    for (const address of batch) {
      const apn = await lookupAPNFromAddress(address)
      if (apn) {
        const key = `${address.street}, ${address.city}`
        results.set(key, apn)
      }
    }
  }

  return results
}
```

### MCAO Tile Component

**File: `apps/gsrealty-client/app/(admin)/dashboard/mcao/page.tsx`**
```typescript
'use client'

import { useState } from 'react'

export default function MCAOPage() {
  const [apn, setApn] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    setLoading(true)
    try {
      const res = await fetch('/gsrealty/api/mcao/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apn }),
      })

      const data = await res.json()
      setResults(data)
    } catch (error) {
      alert('Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">MCAO Property Lookup</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={apn}
            onChange={(e) => setApn(e.target.value)}
            placeholder="Enter APN..."
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {results && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Phase 7: Testing & Deployment 🚀
*Duration: 4-5 days*

### Update Vercel Configuration

**Add to root `vercel.json`:**
```json
{
  "buildCommand": "turbo run build",
  "rewrites": [
    {
      "source": "/wabbit-re/:path*",
      "destination": "/apps/wabbit-re/:path*"
    },
    {
      "source": "/wabbit/:path*",
      "destination": "/apps/wabbit/:path*"
    },
    {
      "source": "/gsrealty/:path*",
      "destination": "/apps/gsrealty-client/:path*"
    }
  ]
}
```

### Update Turbo Configuration

**In root `turbo.json`:**
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Pre-Deployment Testing

```bash
# From project root

# 1. Install all dependencies
npm install

# 2. Run builds for all apps
npm run build

# 3. Test gsrealty specifically
npm run build:gsrealty

# 4. Test dev server
npm run dev:gsrealty
# Access at http://localhost:3004/gsrealty

# 5. Test production build locally
npm run build:gsrealty
npm --prefix apps/gsrealty-client start
# Access at http://localhost:3004/gsrealty
```

### Environment Variables in Vercel

**Configure in Vercel Dashboard:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
MCAO_API_KEY=your-mcao-key (if using)
MCAO_API_BASE_URL=https://mcao-api.com (if using)
```

### Deploy to Vercel

```bash
# From project root

# First deployment
vercel

# Verify preview deployment works
# Test all routes:
# - https://your-app.vercel.app/gsrealty
# - https://your-app.vercel.app/gsrealty/auth/login
# - https://your-app.vercel.app/gsrealty/dashboard
# - https://your-app.vercel.app/gsrealty/portal

# If preview looks good, deploy to production
vercel --prod
```

### Post-Deployment Checklist
- [ ] All apps accessible via subdirectory paths
- [ ] GSRealty accessible at `/gsrealty`
- [ ] Admin login works
- [ ] Client login works
- [ ] File uploads work in production
- [ ] Supabase Storage accessible
- [ ] Database queries work
- [ ] RLS policies enforced
- [ ] No console errors
- [ ] Mobile responsive

---

## 📊 Final Verification Checklist

### Core Features
- [ ] Admin can create/edit/delete clients
- [ ] Admin can upload files (XLSX, CSV, HTML)
- [ ] Files stored in Supabase Storage with "LastName MM.YY" structure
- [ ] Excel templates processed correctly
- [ ] Client can view their properties
- [ ] Client can view/download their documents
- [ ] Login activity tracked
- [ ] RLS policies prevent unauthorized access

### Technical
- [ ] Monorepo integration complete
- [ ] Shared packages used (@gs/supabase, @gs/ui, @gs/utils)
- [ ] Environment variables via symlink
- [ ] Build succeeds with turbo
- [ ] No TypeScript errors
- [ ] All API routes functional
- [ ] Routing works with basePath

### Deployment
- [ ] Deployed to Vercel
- [ ] Accessible via subdirectory
- [ ] All routes work in production
- [ ] File uploads work in production
- [ ] Database connections work
- [ ] No breaking errors

---

## 🎯 Success Criteria

### MVP Features (Must Have)
✅ Admin dashboard with client management
✅ File upload system with Supabase Storage
✅ Excel template processing
✅ Client portal for viewing data
✅ Role-based authentication
✅ "LastName MM.YY" folder generation
✅ Monorepo integration
✅ Production deployment

### Phase 2 Features (Nice to Have)
⏳ MCAO integration tile
⏳ APN lookup functionality
⏳ Advanced Excel analytics
⏳ Email notifications
⏳ Bulk operations

---

## 📚 Documentation to Create

### Required Documentation
- [ ] **template-fields.md** - Excel template structure and field definitions
- [ ] **API_DOCUMENTATION.md** - All API endpoints and usage
- [ ] **ADMIN_GUIDE.md** - How to use admin dashboard
- [ ] **CLIENT_GUIDE.md** - How clients access their portal
- [ ] **DEPLOYMENT.md** - Deployment process and troubleshooting

### Template Fields Documentation

**Create: `apps/gsrealty-client/docs/template-fields.md`**
```markdown
# Excel Template Field Definitions

## Sheet: comps
- **Column A**: Manual notes (blank in uploaded files, populated manually)
- **Column B onwards**: MLS data
  - Address, Price, Beds, Baths, Sqft, etc.

## Sheet: Full_API_call
- **Column A**: Manual notes (blank)
- **Column B onwards**: Complete MLS API response data

## Sheet: Analysis
- Full data processing with all fields populated

## Sheet: Calcs
- Calculation formulas and derived metrics

## Sheet: Maricopa
- **Rows 2-24, Column C**: County-specific data points
- **Row 26 onwards**: Data matrix with multiple columns

## Sheet: 0.5mile
- Properties within half-mile radius
- Comparable sales and listings

## Sheet: Lot
- Lot-specific data
- All cells styled with light grey background
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Environment Variables Not Loading
**Solution:**
```bash
# Recreate symlink
rm apps/gsrealty-client/.env.local
ln -s ../../.env.local apps/gsrealty-client/.env.local

# Verify
ls -la apps/gsrealty-client/.env.local
```

### Issue 2: Supabase Storage Upload Fails
**Solution:**
- Check bucket exists in Supabase
- Verify RLS policies on storage.objects
- Confirm user is authenticated
- Check file size limits

### Issue 3: Routing Not Working
**Solution:**
- Verify `basePath: '/gsrealty'` in next.config.js
- Check vercel.json rewrites
- Update all internal links to include basePath

### Issue 4: Build Fails in Vercel
**Solution:**
- Check TypeScript errors locally first
- Verify all environment variables set in Vercel
- Check build logs for missing dependencies
- Ensure turbo.json configured correctly

---

## 🎬 Next Steps After Launch

### Immediate (Week 1-2 post-launch)
1. Monitor error logs
2. Collect user feedback
3. Fix critical bugs
4. Optimize performance

### Phase 2 (Month 2)
1. Add MCAO integration
2. Implement APN lookup
3. Build bulk operations
4. Add email notifications

### Phase 3 (Month 3+)
1. Advanced analytics dashboard
2. Automated report generation
3. Integration with other MLS systems
4. Mobile app version

---

## 📞 Support & Resources

### Useful Links
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

### Monorepo Commands Reference
```bash
# All commands from project root!

# Development
npm run dev:gsrealty          # Start gsrealty dev server
npm run dev                   # Start all apps

# Building
npm run build:gsrealty        # Build gsrealty only
npm run build                 # Build all apps

# Testing
npm run test:gsrealty         # Test gsrealty
npm test                      # Test all apps

# Database
npm run db:migrate            # Run migrations
```

---

## ✅ Final Notes

### What's Different from v1?
- ✅ **No Django** - All Next.js API routes (consistent with monorepo)
- ✅ **Supabase Storage** - No local filesystem (Vercel compatible)
- ✅ **Monorepo Integration** - Shared packages and deployment
- ✅ **Proven Patterns** - Leverages wabbit-re architecture
- ✅ **Realistic Timeline** - 4-6 weeks vs 8-10 weeks

### Why This Works
- Aligns with existing monorepo architecture
- Reuses proven patterns from wabbit-re
- No new deployment strategies needed
- Consistent tech stack across all apps
- Lower risk, faster delivery

### Estimated Timeline
- **Phase 0**: 3-5 days (setup)
- **Phase 1**: 3-5 days (database)
- **Phase 2**: 3-4 days (auth)
- **Phase 3**: 5-7 days (admin dashboard)
- **Phase 4**: 5-7 days (file processing)
- **Phase 5**: 3-4 days (client portal)
- **Phase 6**: DEFERRED (MCAO integration)
- **Phase 7**: 4-5 days (testing & deployment)

**Total: 4-6 weeks for MVP** (without MCAO)

---

**Status**: Ready for implementation
**Version**: 2.0 - Monorepo Aligned
**Last Updated**: October 14, 2025
**Feasibility**: 9/10 ✅
**Recommendation**: Proceed after completing monorepo Phase 3

---

*This plan is designed to integrate seamlessly with your existing monorepo architecture while maintaining the core features from the original plan. All architectural conflicts have been resolved.*
