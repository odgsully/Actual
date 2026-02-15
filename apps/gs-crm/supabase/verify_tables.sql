-- Verify GSRealty tables were created
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'gsrealty_%'
ORDER BY tablename;
