-- Fix infinite RLS recursion between collections and collaborators
-- The SELECT policies reference each other's tables, causing a cycle.
-- Solution: Use a SECURITY DEFINER function to check collection ownership
-- without triggering the collections RLS policy.

-- Helper function that checks ownership bypassing RLS
CREATE OR REPLACE FUNCTION public.is_collection_owner(p_collection_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = p_collection_id AND owner_id = p_user_id
  );
$$;

-- Helper function that checks collaborator membership bypassing RLS
CREATE OR REPLACE FUNCTION public.is_collection_member(p_collection_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE collection_id = p_collection_id AND user_id = p_user_id
  );
$$;

-- Drop and recreate collections SELECT policy using the helper
DROP POLICY IF EXISTS "Collections visible to owner and collaborators" ON collections;
CREATE POLICY "Collections visible to owner and collaborators"
  ON collections FOR SELECT USING (
    auth.uid() = owner_id
    OR public.is_collection_member(id, auth.uid())
  );

-- Drop and recreate collaborators SELECT policy using the helper
DROP POLICY IF EXISTS "Collaborators visible to owner and self" ON collaborators;
CREATE POLICY "Collaborators visible to owner and self"
  ON collaborators FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_collection_owner(collection_id, auth.uid())
  );

-- Also fix collaborators INSERT policy (same pattern)
DROP POLICY IF EXISTS "Collection owner can manage collaborators" ON collaborators;
CREATE POLICY "Collection owner can manage collaborators"
  ON collaborators FOR INSERT WITH CHECK (
    public.is_collection_owner(collection_id, auth.uid())
  );

-- Also fix collaborators DELETE policy
DROP POLICY IF EXISTS "Collection owner can remove collaborators" ON collaborators;
CREATE POLICY "Collection owner can remove collaborators"
  ON collaborators FOR DELETE USING (
    public.is_collection_owner(collection_id, auth.uid())
  );
