# Supabase Backup Instructions
## Date: January 2025

## Manual Backup Process

Since we don't have direct Supabase CLI access, please follow these steps to create a backup:

### 1. Export Database Schema

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (wabbit-realestate or similar)
3. Navigate to **SQL Editor**
4. Run this query to export schema (copy and paste exactly, without the markdown code blocks):
   ```sql
   SELECT
     'CREATE TABLE ' || c.table_schema || '.' || c.table_name || ' (' ||
     array_to_string(
       array_agg(
         c.column_name || ' ' || c.data_type ||
         CASE
           WHEN c.character_maximum_length IS NOT NULL
           THEN '(' || c.character_maximum_length || ')'
           ELSE ''
         END
         ORDER BY c.ordinal_position
       ), ', '
     ) || ');' AS create_statement
   FROM information_schema.columns c
   WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
   GROUP BY c.table_schema, c.table_name
   ORDER BY c.table_schema, c.table_name;
   ```
5. **Export Options in Supabase SQL Editor:**

   After running the query, you'll see the results in a table format. Use the export buttons above the results:

   - **Copy as markdown** (RECOMMENDED for schema backups):
     * Click this button to copy results as a formatted markdown table
     * Creates human-readable documentation that's also executable SQL
     * Perfect for version control (Git) and documentation
     * Format example:
       ```
       | create_statement |
       |-----------------|
       | CREATE TABLE auth.users (id uuid, email text, ...); |
       | CREATE TABLE public.properties (id uuid, address text, ...); |
       ```

   - **Download CSV**:
     * Downloads results as a comma-separated values file
     * Useful for importing into Excel, Google Sheets, or data processing scripts
     * File will be named like `query_result_2025-01-15T10-30-45.csv`
     * Good for programmatic parsing but less readable than markdown

   - **Copy as JSON**:
     * Copies results as a JSON array of objects
     * Format: `[{"create_statement": "CREATE TABLE..."}, ...]`
     * Best for integration with JavaScript/TypeScript applications
     * Useful for automated schema migration tools

6. **Save and Organize Your Backup:**

   Based on your chosen export format:

   **If using "Copy as markdown" (Recommended):**
   - Open a text editor (VS Code, Notepad++, etc.)
   - Paste the copied markdown content
   - Save as: `supabase-schema-backup-2025-01-15.md` (use today's date)
   - Store in: `/database-backups/` or `/migrations/` folder in your project

   **If using "Download CSV":**
   - File will auto-download to your Downloads folder
   - Rename from `query_result_[timestamp].csv` to `supabase-schema-backup-2025-01-15.csv`
   - Move to your project's backup folder

   **If using "Copy as JSON":**
   - Open a text editor
   - Paste the JSON content
   - Save as: `supabase-schema-backup-2025-01-15.json`
   - Can be directly imported by schema migration tools

   **Important:** After saving, verify the backup by:
   - Opening the file to ensure all tables are included
   - Checking that CREATE TABLE statements are complete
   - Confirming column definitions include data types and constraints
   - Making sure both `auth` and `public` schemas are present

### 2. Export Data

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Look for **Database Backups** section
3. Click **Download backup** to get the latest automated backup
4. Save as `supabase-data-backup-[date].sql`

### Alternative: Use pg_dump

If you have the database connection string:

```bash
# Export schema and data
pg_dump "postgresql://[user]:[password]@[host]:[port]/postgres" > supabase-full-backup-$(date +%Y%m%d).sql

# Export schema only
pg_dump --schema-only "postgresql://[user]:[password]@[host]:[port]/postgres" > supabase-schema-backup-$(date +%Y%m%d).sql

# Export data only
pg_dump --data-only "postgresql://[user]:[password]@[host]:[port]/postgres" > supabase-data-backup-$(date +%Y%m%d).sql
```

### 3. Export RLS Policies

In SQL Editor, run:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

Save the output as `supabase-rls-policies-backup-[date].sql`

### 4. Export Functions and Triggers

```sql
-- Export functions
SELECT
  routine_schema,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema');

-- Export triggers
SELECT
  trigger_schema,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema');
```

### 5. Document Current Tables

**Verify and document all tables in your database:**

Run this query in Supabase SQL Editor to list all your tables with row counts:
```sql
SELECT
  schemaname as schema,
  relname as table_name,
  n_live_tup as approximate_row_count
FROM pg_stat_user_tables
ORDER BY schemaname, relname;
```

**Expected tables in your Wabbit Real Estate project:**

**Core User Tables:**
- `users` - User accounts and authentication data
- `user_preferences` - User search preferences and criteria
- `search_areas` - User-defined geographic search areas

**Property Tables:**
- `properties` - Main property listings table
- `user_properties` - Properties saved/favorited by users
- `user_rankings` - User ratings and rankings of properties
- `property_price_history` - Historical price tracking

**Notification System:**
- `property_notifications` - Alert configurations for users
- `notification_queue` - Pending email notifications
- `user_notification_preferences` - User notification settings

**Scraping System:**
- `user_scraping_quota` - API usage limits per user
- `scraping_metrics` - Performance and usage tracking

**Additional tables to check for:**
- Any custom functions or stored procedures
- Any views or materialized views
- Any custom types or enums

**Create a backup checklist file** (`backup-checklist.md`):
```markdown
# Backup Checklist - [DATE]

## Tables Backed Up:
- [ ] auth.users
- [ ] public.users
- [ ] public.user_preferences
- [ ] public.properties
- [ ] public.user_properties
- [ ] public.user_rankings
- [ ] public.property_notifications
- [ ] public.notification_queue
- [ ] public.user_notification_preferences
- [ ] public.user_scraping_quota
- [ ] public.scraping_metrics
- [ ] public.property_price_history
- [ ] public.search_areas

## Export Files Created:
- [ ] Schema backup (CREATE TABLE statements)
- [ ] Data export (INSERT statements or CSV)
- [ ] RLS policies export
- [ ] Functions and triggers export
- [ ] Indexes and constraints export

## Verification:
- [ ] All tables have complete schemas
- [ ] Row counts match production
- [ ] Test restore performed successfully
```

### 6. Store Backups Safely

**Create organized backup structure:**

1. **Create main backup folder with timestamp:**
   ```
   supabase-backups-2025-01-15/
   ├── schema/
   │   ├── supabase-schema-backup-2025-01-15.md
   │   ├── rls-policies-2025-01-15.sql
   │   ├── functions-triggers-2025-01-15.sql
   │   └── indexes-constraints-2025-01-15.sql
   ├── data/
   │   ├── full-data-export-2025-01-15.sql
   │   └── tables/
   │       ├── users-2025-01-15.csv
   │       ├── properties-2025-01-15.csv
   │       └── [other-tables].csv
   ├── documentation/
   │   ├── backup-checklist.md
   │   ├── table-row-counts.txt
   │   └── restore-instructions.md
   └── README.md (backup metadata and notes)
   ```

2. **Create backup README.md with metadata:**
   ```markdown
   # Supabase Backup - 2025-01-15

   ## Backup Details
   - **Date:** January 15, 2025
   - **Time:** 10:30 AM EST
   - **Database:** wabbit-realestate
   - **Environment:** Production
   - **Backup Type:** Manual/Full
   - **Created By:** [Your Name]

   ## Contents
   - Complete schema export (all tables, constraints, indexes)
   - Full data export (all rows from all tables)
   - RLS policies
   - Functions and triggers

   ## Statistics
   - Total tables: 14
   - Total rows: [count]
   - Backup size: [size] MB

   ## Restore Instructions
   See documentation/restore-instructions.md
   ```

3. **Store in multiple locations (3-2-1 backup rule):**

   **Local Storage:**
   - Primary: `/Users/[username]/Documents/DatabaseBackups/supabase/`
   - Secondary: External drive or NAS

   **Cloud Storage (choose 2+):**
   - **Google Drive:** Create folder `Supabase-Backups/wabbit-realestate/`
   - **Dropbox:** Create folder `Apps/Supabase-Backups/`
   - **GitHub (Private Repo):**
     ```bash
     # Create private backup repo
     git init supabase-backups
     git remote add origin https://github.com/[username]/wabbit-backups-private.git

     # Add .gitignore for sensitive data
     echo "*.env" >> .gitignore
     echo "data/*.sql" >> .gitignore  # Exclude data exports with sensitive info

     # Commit schema only (no sensitive data)
     git add schema/ documentation/
     git commit -m "Backup: database schema 2025-01-15"
     git push -u origin main
     ```
   - **AWS S3 or Backblaze B2:** For automated backups

4. **Implement backup rotation schedule:**
   - **Daily:** Keep last 7 days (delete older)
   - **Weekly:** Keep last 4 weeks (Sunday backups)
   - **Monthly:** Keep last 12 months (1st of month)
   - **Yearly:** Keep indefinitely (January 1st)

5. **Security considerations:**
   - Encrypt sensitive data exports before cloud storage
   - Never commit raw data exports to public repositories
   - Use strong passwords for backup archives
   - Document which backups contain PII/sensitive data

## Restore Process

To restore from backup:

1. Create new Supabase project (if needed)
2. In SQL Editor, run schema backup first
3. Then run data backup
4. Finally, apply RLS policies and functions
5. Update environment variables with new credentials

## Important Notes

- Supabase provides automatic daily backups on paid plans
- Point-in-time recovery available on Pro plan and above
- Always test restore process with a test database first
- Keep multiple generations of backups (daily, weekly, monthly)

## Next Steps

Please complete the manual backup process through the Supabase Dashboard before proceeding with the monorepo migration.