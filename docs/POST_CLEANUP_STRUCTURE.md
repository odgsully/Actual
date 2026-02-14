# Post-Cleanup Monorepo Structure

> Expected state after completing all steps (0-18) in `02.13.26cleantime.md`

---

## Full Monorepo Tree

```mermaid
graph TB
    ROOT["sullivan_realestate/Actual/"]

    %% ─── ROOT DIRECTORIES ───
    ROOT --> APPS["apps/"]
    ROOT --> PACKAGES["packages/"]
    ROOT --> DOCS["docs/"]
    ROOT --> GITHUB[".github/"]
    ROOT --> HUSKY[".husky/"]
    ROOT --> GIT[".git/"]
    ROOT --> NODEMOD["node_modules/ (gitignored)"]
    ROOT --> VERCELDIR[".vercel/ (gitignored)"]
    ROOT --> CLAUDEDIR[".claude/ (gitignored)"]

    %% ─── ROOT CONFIG FILES ───
    ROOT --> CFG["Root Configs"]
    CFG --> PJ["package.json"]
    CFG --> PLJ["package-lock.json"]
    CFG --> TJ["turbo.json"]
    CFG --> GI[".gitignore"]
    CFG --> VI[".vercelignore"]
    CFG --> ESL[".eslintrc.json"]
    CFG --> VJ["vercel.json"]
    CFG --> VGJ["vercel.gsrealty.json"]
    CFG --> VPJ["vercel.pro.json"]
    CFG --> ENV[".env.sample"]

    %% ─── ROOT DOCS ───
    ROOT --> RDOCS["Root Docs (6)"]
    RDOCS --> README["README.md"]
    RDOCS --> CLAUDE["CLAUDE.md (rewritten)"]
    RDOCS --> CONTRIB["CONTRIBUTING.md"]
    RDOCS --> MPT["MIGRATION_PROGRESS_TRACKER.md"]
    RDOCS --> MSP["MIGRATION_SAFETY_PROTOCOLS.md"]
    RDOCS --> LC["load-cap.md"]

    %% ─── APPS ───
    APPS --> GS["gs-site/<br/><i>pickleballisapsyop.com :3003</i>"]
    APPS --> GSR["gsrealty-client/<br/><i>CRM Platform :3004</i>"]
    APPS --> WRE["wabbit-re/<br/><i>wabbit-rank.ai :3000</i>"]
    APPS --> GA["growthadvisory/<br/><i>growthadvisory.ai :3005</i>"]
    APPS --> WAB["wabbit/<br/><i>Legacy Reference</i>"]

    %% ─── GS-SITE ───
    GS --> GS_APP["app/ (admin, api, crm, jarvis...)"]
    GS --> GS_COMP["components/ (53 tiles + UI)"]
    GS --> GS_LIB["lib/ (lifx, notion, github, budget...)"]
    GS --> GS_HOOKS["hooks/"]
    GS --> GS_TILES["tiles/"]
    GS --> GS_DOCS["docs/ (8 phase/integration specs)"]
    GS --> GS_REF["ref/ (logos, screenshots)"]
    GS --> GS_MIG["migrations/"]
    GS --> GS_PUB["public/"]

    %% ─── GSREALTY-CLIENT ───
    GSR --> GSR_APP["app/ (admin, client, form, rank-feed...)"]
    GSR --> GSR_COMP["components/ (glassmorphism UI)"]
    GSR --> GSR_LIB["lib/ (scraping, pipeline, database...)"]
    GSR --> GSR_HOOKS["hooks/"]
    GSR --> GSR_CTX["contexts/"]
    GSR --> GSR_DOCS["docs/<br/><i>NEW: rename-gsrealty-to-crm.md</i>"]
    GSR --> GSR_REF["ref/ (CRM screenshots)"]
    GSR --> GSR_TESTS["tests/ (Playwright e2e)"]
    GSR --> GSR_PUB["public/"]

    %% ─── WABBIT-RE ───
    WRE --> WRE_APP["app/ (form, rank-feed, setup, api...)"]
    WRE --> WRE_COMP["components/"]
    WRE --> WRE_LIB["lib/ (database, scraping, supabase...)"]
    WRE --> WRE_HOOKS["hooks/"]
    WRE --> WRE_CTX["contexts/"]
    WRE --> WRE_DOCS["docs/<br/><i>+6 moved docs</i>"]
    WRE --> WRE_REF["ref/<br/><i>NEW directory</i>"]
    WRE --> WRE_MIG["migrations/"]
    WRE --> WRE_SCRIPTS["scripts/<br/><i>+verify-deployment.sh</i>"]
    WRE --> WRE_PUB["public/"]

    %% ─── WABBIT-RE REF (new) ───
    WRE_REF --> WRE_SQL["ref/sql/<br/><i>All SQL + migration files</i>"]
    WRE_REF --> WRE_DATA["ref/data/<br/><i>CSVs, PDFs, XLSX, client data</i>"]

    %% ─── WABBIT-RE DOCS (expanded) ───
    WRE_DOCS --> WRE_DOCS_EX["auth/, fixes/, setup/<br/>+ DEVELOPMENT_PLAN.md<br/>+ OPERATIONS_GUIDE.md<br/>+ USER_DELETION_GUIDE.md<br/>+ DASHBOARD_RESKIN_PLAN.md<br/>+ test-verification-flow.md"]

    %% GO-PLAN.md moved to gs-site, not wabbit-re
    GS_DOCS --> GS_GOPLAN["GO-PLAN.md (moved from root)"]

    %% ─── GROWTHADVISORY ───
    GA --> GA_APP["app/ (privacy, referral-wall, resources, services)"]
    GA --> GA_COMP["components/ (marketing)"]
    GA --> GA_LIB["lib/"]
    GA --> GA_DOCS["docs/<br/><i>NEW: growthadvisoryai-vercel.md</i>"]
    GA --> GA_ASSETS["assets/ (branding)"]
    GA --> GA_PUB["public/"]

    %% ─── WABBIT (legacy) ───
    WAB --> WAB_REF["ref/ (diagrams, docs, core)"]

    %% ─── PACKAGES ───
    PACKAGES --> PKG_AUTH["auth/<br/><i>AuthContext.tsx</i>"]
    PACKAGES --> PKG_SUPA["supabase/<br/><i>client, server, middleware, types</i>"]
    PACKAGES --> PKG_UI["ui/<br/><i>Shared UI components</i>"]
    PACKAGES --> PKG_UTILS["utils/<br/><i>Shared utilities</i>"]

    %% ─── DOCS (shared) ───
    DOCS --> DOCS_CORE["Core Docs"]
    DOCS --> DOCS_DEPLOY["deployment/ (8 files)"]
    DOCS --> DOCS_SUPA["supabase/ (4 files)"]

    DOCS_CORE --> D_ARCH["ARCHITECTURE.md"]
    DOCS_CORE --> D_DB["DATABASE_OWNERSHIP.md"]
    DOCS_CORE --> D_SAFE["SAFETY_PROTOCOLS.md"]
    DOCS_CORE --> D_ESC["ESCAPE_HATCHES.md"]
    DOCS_CORE --> D_RUN["RUNBOOK.md"]
    DOCS_CORE --> D_CROSS["CROSS_APP_API.md"]
    DOCS_CORE --> D_OC1["OPENCLAW_IMPLEMENTATION_PLAN.md"]
    DOCS_CORE --> D_OC2["OPENCLAW_WABBIT_ARCHITECTURE.md"]
    DOCS_CORE --> D_FIX["Fix_explain_09.05.md (moved from root)"]
    DOCS_CORE --> D_BACKUP["BACKUP_ORGANIZATION_GUIDE.md (moved from root)"]
    DOCS_CORE --> D_PRE["PRE_MONOREPO_DOCUMENTATION.md (moved from root)"]

    %% ─── GITHUB ───
    GITHUB --> GH_WF["workflows/"]
    GH_WF --> GH_PROD["deploy-production.yml"]
    GH_WF --> GH_STAGE["deploy-staging.yml"]
    GH_WF --> GH_TEST["test.yml"]

    %% ─── STYLING ───
    classDef newDir fill:#2d6a4f,stroke:#40916c,color:#fff
    classDef movedFile fill:#1d3557,stroke:#457b9d,color:#fff
    classDef app fill:#6a040f,stroke:#9d0208,color:#fff
    classDef pkg fill:#5a189a,stroke:#7b2cbf,color:#fff
    classDef config fill:#495057,stroke:#6c757d,color:#fff
    classDef root fill:#212529,stroke:#495057,color:#fff

    class ROOT root
    class GS,GSR,WRE,GA,WAB app
    class PKG_AUTH,PKG_SUPA,PKG_UI,PKG_UTILS pkg
    class CFG,PJ,PLJ,TJ,GI,VI,ESL,VJ,VGJ,VPJ,ENV config
    class WRE_REF,WRE_SQL,WRE_DATA,GSR_DOCS,GA_DOCS newDir
    class D_FIX,D_BACKUP,D_PRE,WRE_DOCS_EX movedFile
```

---

## What Was Removed

```mermaid
graph LR
    DELETED["Deleted / Removed from Root"]

    DELETED --> T1["Tier 1: Build Caches (~1.6 GB)"]
    T1 --> T1A[".turbo/"]
    T1 --> T1B[".next/ (x5)"]
    T1 --> T1C[".DS_Store (x22)"]
    T1 --> T1D["tsconfig.tsbuildinfo"]

    DELETED --> T2["Tier 2: Legacy Files"]
    T2 --> T2A["ecosystem.config.js"]
    T2 --> T2B["deploy-phase4.sh"]
    T2 --> T2C["server-deploy.sh"]
    T2 --> T2D["setup-demo-properties.sh"]
    T2 --> T2E["deployment/ (entire dir)"]
    T2 --> T2F["scripts/rollback.sh"]
    T2 --> T2G["scripts/run-rls-migration.mjs"]
    T2 --> T2H["app/admin/ (orphaned legacy)"]

    DELETED --> T2S["Tier 2: Stale Docs"]
    T2S --> T2S1["git-clean.md"]
    T2S --> T2S2["gs-site-merge-plan-2026-01-22.md"]
    T2S --> T2S3["admin-security-merge-plan.md"]
    T2S --> T2S4["git commit message 12.18.25"]

    DELETED --> T4["Tier 4: Dead Files (~85 MB)"]
    T4 --> T4A["gsrealty-client/tmp/ (74 MB)"]
    T4 --> T4B["gsrealty-client/_scripts_WABBIT_RE_DO_NOT_USE/"]
    T4 --> T4C["gs-site/ref/GA LOGO- 2/"]
    T4 --> T4D["Empty dirs: /ref, new-template/, test-results/, test-output/"]
    T4 --> T4E["Duplicate archives: GA LOGO-.zip, files.zip"]

    DELETED --> DIRS["Root Dirs Eliminated"]
    DIRS --> D1["dev_buildout/"]
    DIRS --> D2["logs/"]
    DIRS --> D3["_deprecated/"]
    DIRS --> D4["Wabbit-core/ (already staged)"]
    DIRS --> D5["growth-advisory/ (already staged)"]
    DIRS --> D6["clients/ (moved)"]
    DIRS --> D7["migrations/ (moved)"]
    DIRS --> D8["supabase/migrations/ (placeholders)"]
    DIRS --> D9["scripts/ (moved)"]

    DELETED --> EXT["Moved to External Storage"]
    EXT --> E1["supabase-backups-2025-01-15/"]
    EXT --> E2["supabase-backup-2025-01-15.tar.gz"]

    classDef deleted fill:#d00000,stroke:#9d0208,color:#fff
    classDef moved fill:#e85d04,stroke:#dc2f02,color:#fff
    classDef ext fill:#7b2cbf,stroke:#5a189a,color:#fff

    class DELETED,T1,T2,T2S,T4,DIRS deleted
    class T1A,T1B,T1C,T1D,T2A,T2B,T2C,T2D,T2E,T2F,T2G,T2H,T2S1,T2S2,T2S3,T2S4,T4A,T4B,T4C,T4D,T4E deleted
    class D1,D2,D3,D4,D5,D6,D7,D8,D9 moved
    class EXT,E1,E2 ext
```

---

## File Move Map

```mermaid
flowchart LR
    subgraph ROOT_FILES["Root (source)"]
        direction TB
        RF1["DEVELOPMENT_PLAN.md"]
        RF2["OPERATIONS_GUIDE.md"]
        RF3["USER_DELETION_GUIDE.md"]
        RF4["DASHBOARD_RESKIN_PLAN.md"]
        RF5["GO-PLAN.md"]
        RF6["test-verification-flow.md"]
        RF7["Fix_explain_09.05.md"]
        RF8["BACKUP_ORGANIZATION_GUIDE.md"]
        RF9["PRE_MONOREPO_DOCUMENTATION.md"]
        RF10["rename-gsrealty-to-crm.md"]
        RF11["growthadvisoryai-vercel.md"]
    end

    subgraph SQL_FILES["Root SQL (source)"]
        direction TB
        SF1["database-schema.sql"]
        SF2["fix-rls-comprehensive.sql"]
        SF3["database-migration-temp-preferences.sql"]
        SF4["create-test-user.sql"]
        SF5["fix-auth-issues.sql"]
        SF6["migrations/ (10 files)"]
        SF7["migrations/007_*.sql (git tracked)"]
        SF8["supabase/migrations/2025*.sql (git tracked)"]
    end

    subgraph DATA_FILES["Root Data (source)"]
        direction TB
        DF1["gbs_properties.pdf"]
        DF2["gbs_properties.csv"]
        DF3["test_data_support.csv"]
        DF4["CRM-Buyer-preferences.xlsx"]
        DF5["clients/client1.csv"]
    end

    subgraph SCRIPT_FILES["Root Scripts (source)"]
        direction TB
        SC1["scripts/verify-deployment.sh"]
        SC2["scripts/verify-rls-policies.sql"]
        SC4["scripts/validate-cleanup-paths.sh"]
    end

    subgraph DEST_WRE["apps/wabbit-re/"]
        direction TB
        D_DOCS["docs/"]
        D_SQL["ref/sql/"]
        D_DATA["ref/data/"]
        D_SCR["scripts/"]
    end

    subgraph DEST_DOCS["docs/"]
        direction TB
        DD1["Fix_explain_09.05.md"]
        DD2["BACKUP_ORGANIZATION_GUIDE.md"]
        DD3["PRE_MONOREPO_DOCUMENTATION.md"]
    end

    subgraph DEST_GSR["apps/gsrealty-client/"]
        direction TB
        DG1["docs/rename-gsrealty-to-crm.md"]
    end

    subgraph DEST_GA["apps/growthadvisory/"]
        direction TB
        DGA1["docs/growthadvisoryai-vercel.md"]
    end

    RF1 & RF2 & RF3 & RF4 & RF6 --> D_DOCS
    RF5 --> GS_GOPLAN
    RF7 --> DD1
    RF8 --> DD2
    RF9 --> DD3
    RF10 --> DG1
    RF11 --> DGA1

    SF1 & SF2 & SF3 & SF4 & SF5 & SF6 & SF7 & SF8 --> D_SQL
    DF1 & DF2 & DF3 & DF4 & DF5 --> D_DATA
    SC1 & SC2 & SC4 --> D_SCR

    classDef source fill:#264653,stroke:#2a9d8f,color:#fff
    classDef dest fill:#2d6a4f,stroke:#40916c,color:#fff

    class ROOT_FILES,SQL_FILES,DATA_FILES,SCRIPT_FILES source
    class DEST_WRE,DEST_DOCS,DEST_GSR,DEST_GA dest
```

---

## Stats Summary

| Metric | Before | After |
|--------|--------|-------|
| Root directories | ~20+ | 9 |
| Root loose files | ~40+ | ~20 (6 docs + 14 configs) |
| Disk recovered | — | ~1.7 GB |
| Root `/scripts/` | 6+ files | eliminated |
| Root `/migrations/` | 10 files | eliminated |
| Root SQL files | 5 files | eliminated |
| Root planning docs | 15+ | 0 (all moved/deleted) |
| `apps/wabbit-re/ref/` | did not exist | `sql/` (15+ files) + `data/` (5+ files) |
