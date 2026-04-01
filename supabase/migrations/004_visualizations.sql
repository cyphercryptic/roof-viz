-- Visualizations table: each AI roof visualization job
CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_name TEXT,
  customer_address TEXT,
  original_image_path TEXT NOT NULL,
  result_image_path TEXT,
  prompt_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visualizations_tenant ON visualizations(tenant_id);
CREATE INDEX idx_visualizations_created_by ON visualizations(created_by);
