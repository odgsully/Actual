# GSRealty Client CRM — SKILLS.md

> Slash-command skills for Claude Code development on the real estate CRM platform.
>
> **Port:** 3004 | **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase PostgreSQL
> **Design Language:** Glassmorphism (dark backgrounds, frosted glass effects)

---

## Quick Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/crm-model-audit` | Analyze complete CRM data model | Starting new feature |
| `/add-crm-field` | Add field with type safety + validation | New data requirement |
| `/generate-crud` | Generate full CRUD module | New table operations |
| `/pipeline-stage-add` | Add deal pipeline stage | Extending sales flow |
| `/glass-component` | Scaffold glassmorphism component | New UI element |
| `/add-admin-page` | Create admin dashboard page | New admin feature |
| `/add-form-field` | Add validated form field | Extending forms |
| `/form-to-db` | Connect form to Supabase | Wiring up submissions |
| `/db-migrate` | Create database migration | Schema changes |
| `/rls-policy` | Create Row Level Security policy | Access control |
| `/query-builder` | Generate type-safe Supabase query | Data fetching |
| `/mls-upload-flow` | Build MLS data upload pipeline | Property data import |
| `/mcao-lookup` | Maricopa County Assessor lookup | Property research |
| `/deal-pipeline` | Create kanban pipeline board | Deal management |
| `/property-card` | Generate property display card | Property UI |
| `/auth-flow-setup` | Configure auth system | Auth implementation |
| `/protect-route` | Add auth guard to route | Route protection |
| `/test-db-ops` | Generate database operation tests | Testing data layer |
| `/validation-schema` | Create Zod validation schema | Input validation |
| `/deploy-vercel` | Deploy to production | Shipping changes |
| `/health-check` | System health monitoring | Diagnostics |

---

## CRM Data Layer

### /crm-model-audit

**Analyze and document the complete CRM data model**

**Output:**
- Current table relationships (clients, deals, properties, comps, MCAO data, events)
- Field inventory per table with types and constraints
- Foreign key relationships
- Active Zod validation schemas
- Suggested schema updates for feature requests

**Files traversed:** `lib/database/*.ts`, `lib/types/*.ts`, `lib/validation/`

---

### /add-crm-field [TABLE] [FIELD] [TYPE] [OPTIONS]

**Add a new field with full type safety and validation**

**Parameters:**
- `TABLE`: `gsrealty_clients` | `gsrealty_deals` | `gsrealty_properties` | `gsrealty_comps` | `gsrealty_mcao_data` | `gsrealty_events` | `gsrealty_areas`
- `FIELD`: snake_case identifier
- `TYPE`: `text` | `uuid` | `integer` | `decimal` | `boolean` | `timestamp` | `jsonb` | `text[]`
- `OPTIONS`: `optional` | `required` | `readonly` | `default:[value]`

**Creates/Updates:**
1. Database interface in `lib/database/[TABLE].ts`
2. Zod validation schema in `lib/validation/[TABLE]-schema.ts`
3. SQL migration template
4. TypeScript type exports

**Example:** `/add-crm-field gsrealty_clients source_channel text required`

---

### /generate-crud [TABLE]

**Generate complete CRUD operations module**

**Options:** `--with-auth` (RLS checks) | `--with-relations` (foreign keys) | `--with-hooks` (React hooks)

**Creates:**
- `lib/database/[TABLE].ts` — create, read, update, delete, list, filter
- Full TypeScript interfaces and input types
- Error handling with consistent logging
- Test file template

---

### /pipeline-stage-add [STAGE_NAME] [DESCRIPTION] [POSITION]

**Add new stage to the sales pipeline**

Pipeline stages: `on_radar` → `official_representation` → `touring` → `offers_in` → `under_contract` → `closed`

**Creates/Updates:**
- `lib/database/deals.ts` with new stage
- Migration for database enum update
- `PipelineBoard.tsx` drag-drop columns
- Stage transition API routes

---

## UI Components (Glassmorphism)

### /glass-component [NAME] [TYPE]

**Scaffold component using the glassmorphism design system**

**Types:** `Card` | `Button` | `Input` | `Modal` | `Panel` | `List` | `Form` | `Dashboard`

**Style Guarantees:**
- White text with transparency (`text-white`, `text-white/60`, `text-white/80`)
- Card backgrounds: `bg-white/5`, `bg-white/10`, `bg-white/15`
- Borders: `border-white/10`, `border-white/20`, `border-white/30`
- Hover effects: `hover:scale-[1.02]`, `hover:bg-white/15`
- Transitions: `duration-700 ease-out`
- Rounded corners: `rounded-xl`, `rounded-3xl`

**Pre-configured with:** `.glass-card`, `.glass-button`, `.glass-input` classes, Lucide icons, TypeScript interfaces

---

### /add-admin-page [PAGE_NAME] [ROUTE_PATH]

**Create new admin dashboard page with sidebar navigation**

**Creates:**
- Page at `app/admin/[route_path]/page.tsx`
- Layout with AdminSidebar integration
- Header with title and user menu
- Grid container with glass-card sections
- Sidebar navigation entry
- Authentication guard (admin-only)
- Error boundary + loading states

---

### /add-form-field [FORM_NAME] [FIELD_NAME] [FIELD_TYPE] [VALIDATION]

**Add validated form field to existing form**

**Field Types:** `text` | `email` | `tel` | `select` | `textarea` | `date` | `checkbox` | `number` | `multiselect`

**Creates:**
- React Hook Form integration with validation
- Zod schema update
- `glass-input` styled field
- Error message display
- Type-safe submission handler

---

### /form-to-db [FORM_NAME] [TABLE_NAME] [OPERATION]

**Connect form submission to Supabase**

**Operations:** `create` | `update` | `upsert`

**Creates:**
- Submission handler with API call
- Request/response typing
- Loading + error states
- Toast notifications
- Optimistic update patterns

---

## Database & Supabase

### /db-migrate [MIGRATION_NAME] [DESCRIPTION]

**Create and apply a new database migration**

**Creates:**
- SQL migration in `supabase/migrations/` with timestamp
- UP and DOWN statements
- RLS policy updates if applicable
- Rollback procedure documentation

---

### /rls-policy [TABLE_NAME] [POLICY_NAME] [ROLE] [OPERATION]

**Create Row Level Security policy**

**Roles:** `authenticated` | `admin_role` | `client_role` | `anon`
**Operations:** `select` | `insert` | `update` | `delete` | `all`

**Creates:**
- SQL RLS policy statement
- Migration file
- Verification query
- Documentation of restrictions

---

### /query-builder [TABLE] [FILTERS] [SORT] [LIMIT]

**Generate type-safe Supabase query**

**Creates:**
- TypeScript function with proper typing
- Supabase client call with error handling
- Result type inference
- Example usage

---

## Real Estate Specific

### /mls-upload-flow

**Create MLS property data upload and processing pipeline**

**Creates:**
- File upload UI with client selection
- Upload type selector (residential, lease, land, commercial)
- CSV/XLSX processing with error handling
- Property record creation/update
- Comparable sales linking
- Progress tracking and results summary

---

### /mcao-lookup

**Set up Maricopa County Assessor property lookup**

**Creates:**
- APN or address search form
- Single property lookup endpoint
- Bulk batch lookup with queue management
- Results display with formatted data
- Excel export for results
- Caching and rate limiting

---

### /deal-pipeline

**Create kanban-style deal pipeline board**

**Creates:**
- Drag-and-drop board (dnd-kit)
- 6 stages: on_radar → official_representation → touring → offers_in → under_contract → closed
- Deal card component
- Stage transition handlers
- Commission calculation display
- Filter by deal type (buyer/seller)

---

### /property-card [VARIANT]

**Generate reusable property display card**

**Variants:**
- `minimal` — address + price
- `detailed` — + beds/baths/sqft
- `full` — + MCAO data + comps

Glassmorphism-styled, responsive, with action buttons (favorite, view, export).

---

## Authentication & Authorization

### /auth-flow-setup

**Configure complete auth system**

**Creates:**
- Supabase Auth setup guide
- Sign-in page with email/password
- Password reset flow
- Client invitation system with token generation
- Account setup via invitation link (`setup/[token]`)
- Role-based redirects (admin vs client)
- Session persistence
- Logout functionality

---

### /protect-route [ROUTE_PATH] [REQUIRED_ROLE]

**Add authentication guard to page or API route**

**Roles:** `admin` | `client` | `authenticated`

**Creates:**
- Middleware function
- Role verification
- Redirect to signin if unauthenticated
- 403 page if insufficient permissions
- User context population

---

## Testing & Validation

### /test-db-ops [MODULE_NAME]

**Generate Jest tests for database operations**

**Creates:**
- Test file at `lib/database/__tests__/[MODULE].test.ts`
- Mock Supabase client setup
- CRUD operation test cases
- Error handling tests
- Mock data generators

---

### /validation-schema [SCHEMA_NAME] [FIELDS]

**Create Zod validation schema**

**Creates:**
- Zod schema with validation rules
- TypeScript type inference (`z.infer`)
- Error message customization
- Placed in `lib/validation/[schema-name]-schema.ts`

---

## Deployment

### /deploy-vercel

**Deploy to Vercel with full checklist**

**Pre-deployment:**
- `npm run typecheck` — verify types
- `npm run lint` — check code style
- `npm run build` — build production

**Post-deployment:**
- Verify environment variables in Vercel Dashboard
- Test auth flows on production domain
- Check health endpoint

---

### /health-check

**System health monitoring**

**Checks:**
- Database connectivity
- Auth service status
- Storage bucket access
- API endpoint response times

---

## Design System Reference

### Glassmorphism Classes (from `globals.css`)

| Class | Use Case |
|-------|----------|
| `.glass-card` | Cards, panels, containers |
| `.glass-card-hover` | Interactive cards |
| `.glass-button` | Secondary/ghost buttons |
| `.glass-input` | Form inputs |
| `.glass-nav-item` | Sidebar navigation |
| `.glass-nav-active` | Active nav state |

### Color Conventions

| Element | Pattern |
|---------|---------|
| Text primary | `text-white` |
| Text secondary | `text-white/60` or `text-white/80` |
| Card backgrounds | `bg-white/5`, `bg-white/10`, `bg-white/15` |
| Borders | `border-white/10`, `border-white/20`, `border-white/30` |
| Primary CTA | `bg-brand-red` with `hover:bg-brand-red-hover` |
| Icons | Colored: `text-blue-400`, `text-green-400`, `text-yellow-400`, `text-purple-400` |

### Animation Conventions

- Transitions: `duration-700 ease-out`
- Hover scale: `hover:scale-[1.02]`
- Background: `hover:bg-white/15` or `hover:bg-white/20`

### Do's and Don'ts

**DO:** Use `.glass-card` for containers, white text with transparency, backdrop-blur, rounded corners
**DON'T:** Use solid opaque backgrounds, black text, sharp corners, fast transitions (`duration-150`)

---

## Common Workflows

### Adding a New CRM Field
1. `/add-crm-field [TABLE] [FIELD] [TYPE]`
2. `/db-migrate add_[field]_to_[table]`
3. Update display component
4. `/test-db-ops [TABLE]`

### Creating a New Admin Feature
1. `/add-admin-page [NAME] [ROUTE]`
2. `/generate-crud [TABLE]` (if new data)
3. `/form-to-db [FORM] [TABLE] [OP]`
4. `/protect-route /admin/[route] admin`

### Deploying to Production
1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. `/deploy-vercel`
5. `/health-check`

---

## File Structure

```
apps/gsrealty-client/
├── app/admin/              # Admin pages
├── app/client/             # Client portal pages
├── app/api/                # API routes
├── components/             # React components
├── lib/database/           # Data access layer (CRUD)
├── lib/supabase/           # Supabase client + auth
├── lib/validation/         # Zod validation schemas
├── lib/types/              # TypeScript interfaces
├── app/globals.css         # Tailwind + glassmorphism utilities
└── supabase/migrations/    # SQL migrations
```

## Common Commands

```bash
npm run dev              # Start dev server (port 3004)
npm run build            # Production build
npm run typecheck        # Type safety check
npm run lint             # Code quality
npm run test             # Unit tests
```
