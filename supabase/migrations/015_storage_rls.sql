-- Storage bucket RLS policies for tenant isolation
-- Ensures users can only access files within their tenant's folder

-- house-photos bucket: tenant-scoped access
CREATE POLICY "Tenant members can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'house-photos'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can view their photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'house-photos'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can delete their photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'house-photos'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

-- visualizations bucket: tenant-scoped access
CREATE POLICY "Tenant members can view their visualizations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'visualizations'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

-- logos bucket: tenant-scoped access
CREATE POLICY "Tenant members can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can view their logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow public read access for shared visualizations (share page uses public URLs)
CREATE POLICY "Public can view shared visualization images"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id IN ('house-photos', 'visualizations')
  );

-- Allow public read access for logos (shown on share pages)
CREATE POLICY "Public can view logos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'logos');
