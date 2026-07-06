-- SECURITY FIX: the "Users can update own profile" policy (006) only checks
-- `id = auth.uid()` and has no WITH CHECK, so a signed-in user could change their
-- own `role` (e.g. to 'owner') or `tenant_id` (to jump into another tenant) straight
-- from the browser with the anon key. RLS was the only boundary.
--
-- Postgres RLS can't easily express "these columns are immutable for this role", so we
-- enforce it with a BEFORE UPDATE trigger. The service role (used by server-side admin
-- clients during signup/invite acceptance) bypasses RLS but still runs triggers, so we
-- allow privileged columns to change only when the session is NOT the regular
-- 'authenticated' role — i.e. only trusted server code can set role / move tenants.

CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) = 'authenticated'
     OR auth.role() = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Changing your own role is not allowed';
    END IF;
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
      RAISE EXCEPTION 'Changing your tenant is not allowed';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Changing your profile id is not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_privilege_escalation();

-- Also tighten the RLS policy itself with a WITH CHECK, so the row can never be
-- updated to point at a different user id via the anon/authenticated path.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
