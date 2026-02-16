-- Wave 1: Enable Realtime on core tables for live collaboration updates
alter publication supabase_realtime add table rankings, collections, records, collaborators;
