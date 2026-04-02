CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visualization_id UUID NOT NULL REFERENCES visualizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shared_links_token ON shared_links(token);
CREATE INDEX idx_shared_links_visualization ON shared_links(visualization_id);

ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant shared links"
  ON shared_links FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can create shared links"
  ON shared_links FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id() AND created_by = auth.uid());

CREATE POLICY "Users can update own tenant shared links"
  ON shared_links FOR UPDATE
  USING (tenant_id = get_my_tenant_id() AND (created_by = auth.uid() OR is_admin()));
