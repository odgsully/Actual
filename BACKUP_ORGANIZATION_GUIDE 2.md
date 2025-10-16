# Backup Organization Guide
## Date: January 15, 2025

## Current Backup Files Status

### ✅ Completed Backups
You have successfully created the following backup files:

1. **`db_cluster-15-09-2025@04-53-02.backup.gz`**
   - Type: Full database backup (compressed)
   - Created: January 15, 2025 @ 04:53:02
   - Contents: Complete database dump including all data
   - Format: PostgreSQL binary backup (gzip compressed)

2. **`supabase-schema-backup-9.15.md`**
   - Type: Schema structure export
   - Contents: CREATE TABLE statements for all tables
   - Format: Markdown with SQL statements

3. **`supabase-all-tables.md`**
   - Type: Table listing with row counts
   - Contents: All tables with their current row counts
   - Format: Markdown table

4. **`supabase-rls-policies-backup-9.15.md`**
   - Type: Row Level Security policies
   - Contents: All RLS policies for data access control
   - Format: Markdown with SQL statements

5. **`supabase-functions-triggers.md`**
   - Type: Database functions and triggers
   - Contents: Custom functions and automated triggers
   - Format: Markdown with SQL statements

## Recommended Folder Organization

Create this structure to properly organize your backups:

```
supabase-backups-2025-01-15/
│
├── full-backup/
│   └── db_cluster-15-09-2025@04-53-02.backup.gz
│
├── schema/
│   ├── supabase-schema-backup-9.15.md
│   ├── supabase-all-tables.md
│   └── indexes-constraints.md (TO CREATE)
│
├── security/
│   └── supabase-rls-policies-backup-9.15.md
│
├── functions/
│   └── supabase-functions-triggers.md
│
├── data/
│   ├── users-export.csv (TO CREATE)
│   ├── properties-export.csv (TO CREATE)
│   └── other-tables/ (TO CREATE)
│
├── documentation/
│   ├── BACKUP_ORGANIZATION_GUIDE.md (this file)
│   ├── SUPABASE_BACKUP_INSTRUCTIONS.md
│   └── restore-instructions.md (TO CREATE)
│
└── README.md (TO CREATE - backup metadata)
```

## Next Steps to Complete Your Backup

### 🔴 Immediate Actions Required

1. **Organize existing files into proper structure:**
   ```bash
   # Create backup folder structure
   mkdir -p supabase-backups-2025-01-15/{full-backup,schema,security,functions,data,documentation}

   # Move existing files to organized folders
   mv db_cluster-15-09-2025@04-53-02.backup.gz supabase-backups-2025-01-15/full-backup/
   mv supabase-schema-backup-9.15.md supabase-backups-2025-01-15/schema/
   mv supabase-all-tables.md supabase-backups-2025-01-15/schema/
   mv supabase-rls-policies-backup-9.15.md supabase-backups-2025-01-15/security/
   mv supabase-functions-triggers.md supabase-backups-2025-01-15/functions/
   cp SUPABASE_BACKUP_INSTRUCTIONS.md supabase-backups-2025-01-15/documentation/
   cp BACKUP_ORGANIZATION_GUIDE.md supabase-backups-2025-01-15/documentation/
   ```

2. **Export missing components from Supabase:**

   a. **Export Indexes and Constraints:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT
     schemaname,
     tablename,
     indexname,
     indexdef
   FROM pg_indexes
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   ORDER BY schemaname, tablename, indexname;
   ```
   Save as: `schema/indexes-constraints.md`

   b. **Export Individual Table Data (if needed):**
   - Go to Supabase Dashboard → Table Editor
   - Select each important table
   - Click "Export" → "Export to CSV"
   - Save in `data/` folder

3. **Create backup metadata README:**
   ```bash
   cat > supabase-backups-2025-01-15/README.md << 'EOF'
   # Supabase Backup - January 15, 2025

   ## Backup Summary
   - **Date:** January 15, 2025
   - **Time:** 04:53 AM UTC
   - **Database:** wabbit-realestate
   - **Total Files:** 6 core backup files
   - **Backup Size:** [Calculate total size]

   ## Files Included
   - ✅ Full database backup (compressed)
   - ✅ Schema structure
   - ✅ Table listings with counts
   - ✅ RLS policies
   - ✅ Functions and triggers
   - ⏳ Indexes and constraints (pending)
   - ⏳ Individual table CSV exports (optional)

   ## Verification Checklist
   - [ ] All files properly organized in folders
   - [ ] Backup tested on local PostgreSQL
   - [ ] Files uploaded to cloud storage
   - [ ] Backup documented in project log

   ## Restore Priority
   1. Schema (supabase-schema-backup-9.15.md)
   2. Full backup (db_cluster-15-09-2025@04-53-02.backup.gz)
   3. RLS policies
   4. Functions and triggers
   EOF
   ```

### 🟡 Storage and Security Actions

4. **Compress the entire backup folder:**
   ```bash
   tar -czf supabase-backup-2025-01-15.tar.gz supabase-backups-2025-01-15/
   ```

5. **Upload to multiple locations:**
   - **Google Drive:** Upload `supabase-backup-2025-01-15.tar.gz`
   - **GitHub Private Repo:** Push schema files only (no data)
   - **Local External Drive:** Copy entire folder

6. **Encrypt sensitive backup (optional but recommended):**
   ```bash
   # Encrypt with GPG
   gpg --symmetric --cipher-algo AES256 supabase-backup-2025-01-15.tar.gz
   # This creates supabase-backup-2025-01-15.tar.gz.gpg
   ```

### 🟢 Verification Steps

7. **Test the backup restoration locally:**
   ```bash
   # Install PostgreSQL locally if not already installed
   brew install postgresql

   # Create test database
   createdb wabbit_test

   # Test restore from backup
   gunzip -c db_cluster-15-09-2025@04-53-02.backup.gz | psql wabbit_test

   # Verify tables exist
   psql wabbit_test -c "\dt"
   ```

8. **Document restoration process:**
   Create `supabase-backups-2025-01-15/documentation/restore-instructions.md`:
   ```markdown
   # Restore Instructions

   ## From Full Backup (.backup.gz)
   1. Create new Supabase project or local PostgreSQL database
   2. Get connection string from Supabase Dashboard
   3. Restore: `gunzip -c db_cluster-15-09-2025@04-53-02.backup.gz | psql [CONNECTION_STRING]`

   ## From Schema Files
   1. Run schema creation: Copy content from supabase-schema-backup-9.15.md
   2. Apply RLS policies: Copy content from supabase-rls-policies-backup-9.15.md
   3. Add functions: Copy content from supabase-functions-triggers.md
   ```

## Backup Schedule Going Forward

### Daily (Automated via Supabase Dashboard)
- Rely on Supabase's automatic daily backups

### Weekly (Manual)
- Every Sunday: Export schema changes only
- Keep last 4 weekly backups

### Monthly (Full Manual Backup)
- First Sunday of month: Complete backup like today
- Keep last 12 monthly backups

### Before Major Changes
- Always create full backup before:
  - Database migrations
  - Schema changes
  - Production deployments
  - Supabase plan changes

## Important Reminders

⚠️ **Security Notes:**
- Never commit `.backup.gz` files to public repositories
- Always encrypt backups containing user data
- Store encryption passwords separately from backups
- Test restore process quarterly

📝 **Documentation:**
- Update this guide after each backup
- Log all backups in a central tracking sheet
- Document any issues encountered during backup/restore

🔄 **Maintenance:**
- Delete local backups older than 3 months (keep cloud copies)
- Verify cloud backups are accessible monthly
- Update backup scripts if schema changes significantly

## Quick Commands Reference

```bash
# View backup file info
file db_cluster-15-09-2025@04-53-02.backup.gz

# Check backup size
du -h supabase-backups-2025-01-15/

# List all backup files with dates
ls -lah supabase-backups-2025-01-15/**/*

# Find all backup files on system
find ~ -name "*supabase*backup*" -type f 2>/dev/null
```

## Contact for Issues

If restoration fails or you need the encryption password:
- Primary: [Your email]
- Backup: [Team member email]
- Documentation: This guide + SUPABASE_BACKUP_INSTRUCTIONS.md