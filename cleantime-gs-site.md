# cleantime-gs-site.md — GS-Site Cleanup Plan

## Current State

**Root-level items: ~33 files + 15 directories = ~48 items**
(Target: ~20 items, matching growthadvisory's cleanliness)

**App is fully isolated** — zero cross-app file imports, zero shared package usage. All 488 internal imports use `@/` aliases. This makes cosmetic moves **low risk** as long as we don't touch `app/`, `lib/`, `components/`, or `hooks/`.

---

## Phase 1: Root Markdown Cleanup

Move 10 scattered research/planning docs from root into `docs/` subdirectories:

### Create new doc subdirectories:

```
docs/
├── archive/          # Session notes, dated docs, backups
├── research/         # Voice AI, audio agents, planning
├── reference/        # Component inventories, tile specs
└── (existing files)  # Keep EATING_CHALLENGE, integration guides, phase docs
```

### Moves:

| File                           | Destination       | Rationale                          |
| ------------------------------ | ----------------- | ---------------------------------- |
| `decouplenotion.md` (36 KB)   | `docs/archive/`   | Historical - decoupling is complete |
| `audio-agents-plan.md` (29 KB) | `docs/research/`  | Future planning doc                |
| `VOICE_AI_RESEARCH.md` (19 KB) | `docs/research/`  | Research doc                       |
| `VOICE_AI_RESEARCH_v2.md` (28 KB) | `docs/research/` | Research doc v2                   |
| `push-to-main-jan1.md` (6.5 KB) | `docs/archive/`  | Dated session note                 |
| `update-dec28-notion.md` (9.3 KB) | `docs/archive/` | Dated session note                 |
| `tiles-dialed-i-i.md` (18.7 KB) | `docs/archive/`  | Historical tile work               |
| `gs-site-notion-sum.md` (18.7 KB) | `docs/reference/` | Tile implementation specs        |
| `SHADCN_COMPONENTS.md` (14 KB) | `docs/reference/` | Component inventory               |

### Delete:

| File                                | Rationale                    |
| ----------------------------------- | ---------------------------- |
| `gs-site-notion-sum.md.backup` (10.5 KB) | Backup file, original exists |

### Keep at root (essential):

- `CLAUDE.md` — Claude Code instructions
- `README.md` — Project overview
- `SKILLS.md` — Slash command skills
- `tile-logic-untile.md` (62 KB) — Active implementation plan (Phases 0-8)

**Impact: NONE** — These are documentation files with zero import references.

---

## Phase 2: Delete Artifacts & Sensitive Files

### Delete:

| Item                        | Size   | Rationale                                |
| --------------------------- | ------ | ---------------------------------------- |
| `tsconfig.tsbuildinfo`      | 351 KB | Build cache, regenerated on build        |
| `.DS_Store`                 | 10 KB  | macOS metadata                           |
| `ngrok_recovery_codes.txt`  | Small  | Sensitive — should NOT be in repo        |
| `hooks/useTiles.ts.backup`  | Small  | Backup file, original exists             |

### Update `.gitignore` (add these entries):

```gitignore
# Build artifacts
tsconfig.tsbuildinfo
.DS_Store

# Sensitive files
ngrok_recovery_codes.txt

# Temp outputs
scheduler/output/
```

**Impact: NONE** — Build artifacts and backups have zero runtime references.

---

## Phase 3: Clean Up `/tiles/` Directory (Orphaned)

This directory is confusing — actual tile components live in `components/tiles/` and definitions in `lib/data/tiles.ts`. The `/tiles/` root directory contains:

```
tiles/
├── CleanShot 2025-12-29 at 17.03.34@2x.png  # Screenshot
├── gsrealty-client/                            # Legacy build plans
│   ├── GSREALTY_BUILD_PLAN.md
│   └── GSREALTY_BUILD_PLAN_v2.md
└── notion/                                     # Empty directory
```

### Actions:

| Item                            | Action | Destination                          |
| ------------------------------- | ------ | ------------------------------------ |
| `tiles/gsrealty-client/*.md`    | Move   | `docs/archive/gsrealty-build-plans/` |
| `tiles/CleanShot*.png`          | Delete | Screenshot artifact                  |
| `tiles/notion/`                 | Delete | Empty directory                      |
| `tiles/`                        | Delete | Remove empty orphaned directory      |

**Impact: NONE** — No code imports from this directory.

---

## Phase 4: Clean Up `/jarvis-integration/`

This contains a Python subproject that may or may not still be active:

```
jarvis-integration/
├── __init__.py, example_integration.py, pdf_generator.py
├── supabase_writer.py, requirements.txt
├── schema.sql (duplicates migration)
├── README.md, QUICKSTART.md, FILES_OVERVIEW.txt
├── INTEGRATION_SUMMARY.md, JARVIS_FRONTEND_README.md
```

### Decision needed:

- **If still active**: Keep as-is, it's a self-contained Python module
- **If deprecated**: Move to `ref/jarvis-integration-archive/` or delete

**Impact assessment**: The Next.js app has its own Jarvis route (`app/jarvis/`) and lib (`lib/jarvis/`) that do NOT import from this Python directory. Safe to archive.

---

## Phase 5: Clean Up `/agent-team/` Directory

```
agent-team/
├── agent-team-12.25.md     # Dated research doc
├── my-hardware.md           # Hardware specs
└── profile-pics/            # Agent profile images
```

### Actions:

| Item                              | Action | Destination             |
| --------------------------------- | ------ | ----------------------- |
| `agent-team/agent-team-12.25.md`  | Move   | `docs/archive/`         |
| `agent-team/my-hardware.md`       | Move   | `docs/reference/`       |
| `agent-team/profile-pics/`        | Move   | `public/agent-team/` (already exists there) |

Then check if `public/agent-team/` already has these pics. If so, delete the duplicate `agent-team/` root directory entirely.

**Impact: LOW** — Need to verify no code references `agent-team/` directly vs `public/agent-team/`.

---

## Phase 6: Clean Up `/scripts/` (Minor)

```
scripts/
├── sync-notion-tiles.ts     # DEPRECATED per CLAUDE.md
├── archive/                 # Already has archive dir
└── (active scripts)         # Keep as-is
```

### Actions:

| Item                            | Action | Destination        |
| ------------------------------- | ------ | ------------------ |
| `scripts/sync-notion-tiles.ts`  | Move   | `scripts/archive/` |
| `scripts/merged-tiles.json`     | Move   | `scripts/archive/` (output artifact) |

**Impact: NONE** — Script is deprecated, no runtime references.

---

## Phase 7: Organize `/ref/` Directory

Current state:

```
ref/
├── Clients/           # Reference client data
├── google-form/       # Form templates
├── life-in-weeks/     # Visualization reference
├── optimized/         # Optimized assets
├── screentime-shots/  # Screenshots
└── FORM_REFERENCE.md  # Form docs
```

### Action:

No structural changes needed — this is already a reference directory. Just verify nothing here is actively imported by code. If `screentime-shots/` and `optimized/` are one-time outputs, consider adding them to `.gitignore`.

---

## Phase 8: Verify `/scheduler/` Status

```
scheduler/
├── scripts/     # Print automation scripts (hardcode localhost:3003)
├── launchd/     # macOS plist files
├── templates/   # Print templates
└── README.md
```

### Decision needed:

- **If actively used**: Keep as-is (macOS-specific local automation)
- **If Vercel crons replaced this**: Archive to `ref/scheduler-archive/`

**Impact: NONE for archiving** — These are local macOS launchd scripts, not referenced by Next.js code.

---

## Deployment Impact Assessment

### Zero Impact (Safe)

| System                    | Why Safe                                                  |
| ------------------------- | --------------------------------------------------------- |
| **Vercel deployment**     | No code files moved, only docs/artifacts                  |
| **Supabase**              | No migration files touched                                |
| **OAuth callbacks**       | No route files moved                                      |
| **Cron jobs**             | No API routes moved                                       |
| **TypeScript compilation** | No `.ts/.tsx` source files moved                         |
| **Tailwind**              | Content paths (`./app/**`, `./components/**`) unchanged   |
| **`@/` imports**          | No source directories restructured                        |

### Low Impact (Verify)

| Item                          | Verification                                              |
| ----------------------------- | --------------------------------------------------------- |
| `.gitignore` updates          | Run `git status` after to confirm no untracked files missed |
| `agent-team/` move            | Grep for `agent-team` in source to confirm no code refs   |
| `jarvis-integration/` archive | Confirm no Python scripts are called from Next.js         |

---

## Execution Checklist

```
[ ] Phase 1: Create docs/archive/, docs/research/, docs/reference/
[ ] Phase 1: Move 9 root markdown files to new docs subdirs
[ ] Phase 1: Delete gs-site-notion-sum.md.backup
[ ] Phase 2: Delete tsconfig.tsbuildinfo, .DS_Store, ngrok_recovery_codes.txt
[ ] Phase 2: Delete hooks/useTiles.ts.backup
[ ] Phase 2: Update .gitignore with new entries
[ ] Phase 3: Move tiles/gsrealty-client/*.md to docs/archive/
[ ] Phase 3: Delete tiles/ directory entirely
[ ] Phase 4: Archive jarvis-integration/ (if deprecated)
[ ] Phase 5: Consolidate agent-team/ (move docs, verify pics)
[ ] Phase 6: Move deprecated scripts to scripts/archive/
[ ] Phase 7: Review ref/ for gitignore candidates
[ ] Phase 8: Decide on scheduler/ status
[ ] VERIFY: Run `npm run typecheck` to confirm no breakage
[ ] VERIFY: Run `npm run build` to confirm build succeeds
[ ] VERIFY: Run `git status` to review all changes
```

---

## Target Root Structure (Post-Cleanup)

```
apps/gs-site/                    # ~22 items (down from ~48)
├── app/                         # Next.js routes - UNTOUCHED
├── components/                  # React components - UNTOUCHED
├── hooks/                       # Custom hooks - UNTOUCHED
├── lib/                         # Core library - UNTOUCHED
├── public/                      # Static assets - UNTOUCHED
├── styles/                      # CSS - UNTOUCHED
├── migrations/                  # DB migrations - UNTOUCHED
├── supabase/                    # Supabase config - UNTOUCHED
├── scripts/                     # Utility scripts (cleaned)
│   └── archive/                 # Deprecated scripts
├── docs/                        # ALL documentation (reorganized)
│   ├── archive/                 # Historical docs, session notes
│   ├── research/                # Voice AI, audio agents
│   ├── reference/               # Component inventory, hardware
│   └── (existing integration guides)
├── ref/                         # Reference data - UNTOUCHED
├── data/                        # Claude stats - UNTOUCHED
├── scheduler/                   # Local automation (review status)
├── __tests__/                   # Tests - UNTOUCHED
├── CLAUDE.md                    # Essential
├── README.md                    # Essential
├── SKILLS.md                    # Essential
├── tile-logic-untile.md         # Active plan
└── [config files]               # 10 config files
```

**Net result: ~48 items → ~22 items (54% reduction)** with zero risk to runtime, deployment, or database functionality.
