-- Add white-label fields to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#E07A2F';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#3D2B1F';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS hide_powered_by BOOLEAN DEFAULT false;
