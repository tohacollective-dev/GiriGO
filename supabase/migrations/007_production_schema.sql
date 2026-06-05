-- =============================================================================
-- 007_production_schema — Final production schema gaps
-- ─────────────────────────────────────────────────────────────────────────────
-- Extends existing tables without breaking existing data or relationships.
-- Existing column mappings (for documentation):
--   orders.destination_lat = orders.dropoff_lat (already exists)
--   orders.destination_lng = orders.dropoff_lng (already exists)
--   orders.estimated_distance_km = orders.distance_km (already exists)
--   dispatch_log.status = dispatch_log.result (already exists, typed as enum)
--   users.full_name = users.name (already exists, aliased in TypeScript)
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. users: add email for customer contact
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE email IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. customers: dedicated profile for public-order customers
--    Linked to users so existing joins (orders.customer_id → users.id) still work.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Backfill existing customers from users table (role = 'customer')
INSERT INTO customers (user_id, full_name, email, created_at, updated_at)
SELECT id, name, email, created_at, updated_at
FROM users
WHERE role = 'customer'
  AND id NOT IN (SELECT user_id FROM customers);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. couriers: add active_orders counter with auto-maintenance trigger
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS active_orders INTEGER NOT NULL DEFAULT 0;

-- Backfill from currently assigned orders
UPDATE couriers
SET active_orders = (
  SELECT COUNT(*) FROM orders
  WHERE orders.courier_id = couriers.id
    AND orders.status IN ('assigned', 'picked_up')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: maintain couriers.active_orders on order assignment/completion
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_courier_active_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment on assignment
  IF TG_OP = 'UPDATE' AND NEW.courier_id IS NOT NULL
     AND NEW.status = 'assigned'
     AND (OLD.status IS DISTINCT FROM 'assigned' OR OLD.courier_id IS DISTINCT FROM NEW.courier_id) THEN
    UPDATE couriers SET active_orders = active_orders + 1 WHERE id = NEW.courier_id;
  END IF;

  -- Decrement on completion / cancellation
  IF TG_OP = 'UPDATE' AND OLD.courier_id IS NOT NULL
     AND NEW.status IN ('delivered', 'cancelled', 'failed')
     AND OLD.status NOT IN ('delivered', 'cancelled', 'failed') THEN
    UPDATE couriers SET
      active_orders    = GREATEST(0, active_orders - 1),
      completed_orders = completed_orders + 1
    WHERE id = OLD.courier_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_courier_active_orders_trigger ON orders;
CREATE TRIGGER trg_courier_active_orders_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_courier_active_orders();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. courier_locations: RLS policies
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS courier_insert_own_location ON courier_locations;
CREATE POLICY courier_insert_own_location ON courier_locations
  FOR INSERT
  WITH CHECK (
    courier_id IN (
      SELECT id FROM couriers WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS courier_read_own_location ON courier_locations;
CREATE POLICY courier_read_own_location ON courier_locations
  FOR SELECT
  USING (
    courier_id IN (
      SELECT id FROM couriers WHERE auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Performance indices
-- ─────────────────────────────────────────────────────────────────────────────
-- Courier workload queries
CREATE INDEX IF NOT EXISTS idx_couriers_active_orders
  ON couriers(active_orders);

-- Order status + courier lookups (dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_courier_status
  ON orders(courier_id, status)
  WHERE courier_id IS NOT NULL;

-- Dispatch log by order (admin exceptions view)
CREATE INDEX IF NOT EXISTS idx_dispatch_log_result_date
  ON dispatch_log(result, offered_at DESC);

-- Ratings by courier
CREATE INDEX IF NOT EXISTS idx_ratings_courier_id
  ON ratings(courier_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. customers: RLS policies
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_manage_customers ON customers;
CREATE POLICY admin_manage_customers ON customers
  FOR ALL
  USING (true);  -- service_role bypasses RLS; admin access handled at API layer

COMMIT;
