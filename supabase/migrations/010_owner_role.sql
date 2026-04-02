-- Add 'owner' role to profiles and invites CHECK constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'rep', 'demo'));

ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_role_check;
ALTER TABLE invites ADD CONSTRAINT invites_role_check CHECK (role IN ('owner', 'admin', 'rep', 'demo'));

-- Update is_admin() to also return true for owner
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'owner') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
