-- =============================================================================
-- 004_courier_auth — Link couriers to Supabase Auth accounts
-- =============================================================================

-- Add auth_id column to link couriers table to auth.users
ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Index for auth_id lookup during sign-in
CREATE INDEX IF NOT EXISTS idx_couriers_auth_id ON couriers(auth_id) WHERE auth_id IS NOT NULL;

-- Allow couriers to read their own profile via RLS (uses auth.uid() match)
-- Note: This policy only works if the user's auth.uid() matches couriers.auth_id
DROP POLICY IF EXISTS courier_self_read ON couriers;
CREATE POLICY courier_self_read ON couriers
  FOR SELECT
  USING (auth_id = auth.uid());

-- Allow couriers to update their own profile
DROP POLICY IF EXISTS courier_self_update ON couriers;
CREATE POLICY courier_self_update ON couriers
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Allow couriers to read their own orders
DROP POLICY IF EXISTS courier_own_orders ON orders;
CREATE POLICY courier_own_orders ON orders
  FOR SELECT
  USING (
    courier_id IN (
      SELECT id FROM couriers WHERE auth_id = auth.uid()
    )
  );

-- Allow couriers to update their own assigned orders
DROP POLICY IF EXISTS courier_update_own_orders ON orders;
CREATE POLICY courier_update_own_orders ON orders
  FOR UPDATE
  USING (
    courier_id IN (
      SELECT id FROM couriers WHERE auth_id = auth.uid()
    )
  );
