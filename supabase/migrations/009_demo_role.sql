-- Expand role options to include 'demo' for marketing/prospect accounts
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'rep', 'demo'));

ALTER TABLE invites DROP CONSTRAINT invites_role_check;
ALTER TABLE invites ADD CONSTRAINT invites_role_check
  CHECK (role IN ('admin', 'rep', 'demo'));
