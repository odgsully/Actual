-- Wave 1: Create record-assets storage bucket with RLS
-- File path convention: {collection_id}/{record_id}/{filename}

INSERT INTO storage.buckets (id, name, public)
VALUES ('record-assets', 'record-assets', false);

-- Collaborators can read record assets
CREATE POLICY "Collaborators can read record assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'record-assets'
    AND EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.user_id = auth.uid()
      AND c.collection_id = (storage.foldername(name))[1]::uuid
    )
  );

-- Owner and contributors can upload record assets
CREATE POLICY "Owner and contributors can upload record assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'record-assets'
    AND EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.user_id = auth.uid()
      AND c.collection_id = (storage.foldername(name))[1]::uuid
      AND c.role IN ('owner', 'contributor')
    )
  );

-- Owner can delete record assets
CREATE POLICY "Owner can delete record assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'record-assets'
    AND EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.user_id = auth.uid()
      AND c.collection_id = (storage.foldername(name))[1]::uuid
      AND c.role = 'owner'
    )
  );
