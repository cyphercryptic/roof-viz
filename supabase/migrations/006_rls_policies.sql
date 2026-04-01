-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's tenant_id
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- TENANTS: users can only see their own tenant
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  USING (id = get_my_tenant_id());

CREATE POLICY "Admins can update own tenant"
  ON tenants FOR UPDATE
  USING (id = get_my_tenant_id() AND is_admin());

-- PROFILES: users can see profiles in their tenant
CREATE POLICY "Users can view tenant profiles"
  ON profiles FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Allow insert during signup (service role handles tenant creation)
CREATE POLICY "Allow insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- PRODUCTS: tenant-scoped
CREATE POLICY "Users can view tenant products"
  ON products FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id() AND is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (tenant_id = get_my_tenant_id() AND is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (tenant_id = get_my_tenant_id() AND is_admin());

-- VISUALIZATIONS: tenant-scoped
CREATE POLICY "Users can view tenant visualizations"
  ON visualizations FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can create visualizations"
  ON visualizations FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id() AND created_by = auth.uid());

CREATE POLICY "Users can update own visualizations"
  ON visualizations FOR UPDATE
  USING (tenant_id = get_my_tenant_id() AND (created_by = auth.uid() OR is_admin()));

-- INVITES: admin-only management, but anyone can read by token for acceptance
CREATE POLICY "Admins can view tenant invites"
  ON invites FOR SELECT
  USING (tenant_id = get_my_tenant_id() AND is_admin());

CREATE POLICY "Admins can create invites"
  ON invites FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id() AND is_admin());

CREATE POLICY "Admins can delete invites"
  ON invites FOR DELETE
  USING (tenant_id = get_my_tenant_id() AND is_admin());
