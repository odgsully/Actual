-- Wabbit v2 Initial Schema
-- Tables: profiles, folders, collections, records, rankings, collaborators
-- Enums: wab_type, ranking_mode, output_type, collaborator_role, agent_optimization_level
-- Views: record_scores, record_choices, collection_leaderboard, user_progress
-- Triggers: auto-create profile on signup, auto-add owner as collaborator

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE wab_type AS ENUM ('standard', 'vetted_ref');
CREATE TYPE ranking_mode AS ENUM ('one_axis', 'two_axis', 'quaternary', 'binary');
CREATE TYPE output_type AS ENUM ('image', 'video', 'text', '3d', 'audio', 'deck');
CREATE TYPE collaborator_role AS ENUM ('owner', 'contributor', 'viewer');
CREATE TYPE agent_optimization_level AS ENUM ('none', 'low', 'medium', 'high');

-- ============================================================
-- TABLES
-- ============================================================

-- Extends Supabase Auth users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sidebar file system containers
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wabbs (projects/collections)
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  output_type output_type NOT NULL DEFAULT 'image',
  wab_type wab_type NOT NULL DEFAULT 'standard',
  ranking_mode ranking_mode NOT NULL DEFAULT 'one_axis',
  quaternary_labels JSONB DEFAULT '{"a": "A", "b": "B", "c": "C", "d": "D"}',
  agent_optimization_level agent_optimization_level NOT NULL DEFAULT 'none',
  window_duration INTERVAL,
  current_window INTEGER NOT NULL DEFAULT 1,
  parent_collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  collaboration_mode TEXT NOT NULL DEFAULT 'solo' CHECK (collaboration_mode IN ('solo', 'team')),
  ravg_formula TEXT NOT NULL DEFAULT 'simple_mean' CHECK (ravg_formula IN ('simple_mean', 'weighted_by_role', 'exclude_outliers', 'custom')),
  ravg_member_weights JSONB NOT NULL DEFAULT '{}',
  supervisor_weight NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  branch_carry_over JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items to rank
CREATE TABLE records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  window_number INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User scores/choices per record
CREATE TABLE rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_id UUID REFERENCES records(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC(4,1) CHECK (score >= 0.0 AND score <= 10.0),
  choice TEXT CHECK (choice IN ('a', 'b', 'c', 'd', 'yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, record_id)
);

-- User access to collections
CREATE TABLE collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  role collaborator_role NOT NULL DEFAULT 'contributor',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, collection_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_folders_owner ON folders(owner_id);
CREATE INDEX idx_collections_owner ON collections(owner_id);
CREATE INDEX idx_collections_folder ON collections(folder_id);
CREATE INDEX idx_records_collection ON records(collection_id);
CREATE INDEX idx_records_window ON records(collection_id, window_number);
CREATE INDEX idx_rankings_record ON rankings(record_id);
CREATE INDEX idx_rankings_user_collection ON rankings(user_id, collection_id);
CREATE INDEX idx_collaborators_user ON collaborators(user_id);
CREATE INDEX idx_collaborators_collection ON collaborators(collection_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- Per-record aggregate scores (quantitative modes)
CREATE VIEW record_scores AS
SELECT
  r.id AS record_id,
  r.collection_id,
  COUNT(rk.id) AS rank_count,
  AVG(rk.score) AS avg_score,
  MIN(rk.score) AS min_score,
  MAX(rk.score) AS max_score,
  STDDEV(rk.score) AS stddev_score
FROM records r
LEFT JOIN rankings rk ON rk.record_id = r.id AND rk.score IS NOT NULL
GROUP BY r.id, r.collection_id;

-- Per-record choice tallies (quaternary/binary modes)
CREATE VIEW record_choices AS
SELECT
  r.id AS record_id,
  r.collection_id,
  COUNT(rk.id) AS total_votes,
  COUNT(*) FILTER (WHERE rk.choice = 'a') AS choice_a,
  COUNT(*) FILTER (WHERE rk.choice = 'b') AS choice_b,
  COUNT(*) FILTER (WHERE rk.choice = 'c') AS choice_c,
  COUNT(*) FILTER (WHERE rk.choice = 'd') AS choice_d,
  COUNT(*) FILTER (WHERE rk.choice = 'yes') AS choice_yes,
  COUNT(*) FILTER (WHERE rk.choice = 'no') AS choice_no
FROM records r
LEFT JOIN rankings rk ON rk.record_id = r.id AND rk.choice IS NOT NULL
GROUP BY r.id, r.collection_id;

-- Records ranked by avg score with rank()
CREATE VIEW collection_leaderboard AS
SELECT
  rs.record_id,
  rs.collection_id,
  r.title,
  rs.avg_score,
  rs.rank_count,
  RANK() OVER (PARTITION BY rs.collection_id ORDER BY rs.avg_score DESC) AS position
FROM record_scores rs
JOIN records r ON r.id = rs.record_id
WHERE rs.rank_count > 0;

-- Completion % per user per collection
CREATE VIEW user_progress AS
SELECT
  c.user_id,
  col.id AS collection_id,
  col.title AS collection_title,
  COUNT(DISTINCT rec.id) AS total_records,
  COUNT(DISTINCT rk.record_id) AS ranked_records,
  CASE
    WHEN COUNT(DISTINCT rec.id) = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(DISTINCT rk.record_id) / COUNT(DISTINCT rec.id), 1)
  END AS completion_pct
FROM collaborators c
JOIN collections col ON col.id = c.collection_id
LEFT JOIN records rec ON rec.collection_id = col.id
LEFT JOIN rankings rk ON rk.record_id = rec.id AND rk.user_id = c.user_id
GROUP BY c.user_id, col.id, col.title;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles: viewable by everyone, updatable by self
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Folders: owner-scoped full CRUD
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE USING (auth.uid() = owner_id);

-- Collections: visible to owner + collaborators; CRUD by owner
CREATE POLICY "Collections visible to owner and collaborators"
  ON collections FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.collection_id = collections.id
      AND collaborators.user_id = auth.uid()
    )
  );
CREATE POLICY "Owner can create collections"
  ON collections FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update collections"
  ON collections FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete collections"
  ON collections FOR DELETE USING (auth.uid() = owner_id);

-- Records: visible to collaborators; insertable by owner/contributor
CREATE POLICY "Records visible to collaborators"
  ON records FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.collection_id = records.collection_id
      AND collaborators.user_id = auth.uid()
    )
  );
CREATE POLICY "Owner and contributors can add records"
  ON records FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.collection_id = records.collection_id
      AND collaborators.user_id = auth.uid()
      AND collaborators.role IN ('owner', 'contributor')
    )
  );

-- Rankings: visible to collaborators; writable by owner/contributor (viewers cannot rank)
CREATE POLICY "Rankings visible to collaborators"
  ON rankings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.collection_id = rankings.collection_id
      AND collaborators.user_id = auth.uid()
    )
  );
CREATE POLICY "Owner and contributors can rank"
  ON rankings FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.collection_id = rankings.collection_id
      AND collaborators.user_id = auth.uid()
      AND collaborators.role IN ('owner', 'contributor')
    )
  );
CREATE POLICY "Users can update own rankings"
  ON rankings FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.collection_id = rankings.collection_id
      AND collaborators.user_id = auth.uid()
      AND collaborators.role IN ('owner', 'contributor')
    )
  );

-- Collaborators: visible to collection owner + self; manageable by owner
CREATE POLICY "Collaborators visible to owner and self"
  ON collaborators FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collaborators.collection_id
      AND collections.owner_id = auth.uid()
    )
  );
CREATE POLICY "Collection owner can manage collaborators"
  ON collaborators FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collaborators.collection_id
      AND collections.owner_id = auth.uid()
    )
  );
CREATE POLICY "Collection owner can remove collaborators"
  ON collaborators FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collaborators.collection_id
      AND collections.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-add owner as collaborator when collection is created
CREATE OR REPLACE FUNCTION handle_new_collection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.collaborators (user_id, collection_id, role, accepted_at)
  VALUES (NEW.owner_id, NEW.id, 'owner', NOW());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_collection_created
  AFTER INSERT ON public.collections
  FOR EACH ROW EXECUTE FUNCTION handle_new_collection();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_rankings_updated_at
  BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE collections;
ALTER PUBLICATION supabase_realtime ADD TABLE records;
ALTER PUBLICATION supabase_realtime ADD TABLE collaborators;
