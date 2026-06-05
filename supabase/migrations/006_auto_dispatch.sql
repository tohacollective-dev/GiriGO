-- =============================================================================
-- 006_auto_dispatch — Auto-dispatch system schema extensions
-- =============================================================================

-- ── Courier status: add 'available' as alias for online ─────────────────────
-- No ALTER needed — 'online' already means available. We keep both for semantic clarity.
-- Update: add 'available' value for future use
ALTER TYPE courier_status ADD VALUE IF NOT EXISTS 'available';

-- ── Couriers: add tracking columns ──────────────────────────────────────────
ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS completed_orders INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_at     TIMESTAMPTZ;

-- Populate last_seen_at from location_updated for existing couriers
UPDATE couriers SET last_seen_at = location_updated WHERE last_seen_at IS NULL;

-- ── Courier GPS history ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courier_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id  UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  latitude    NUMERIC(10,8)  NOT NULL,
  longitude   NUMERIC(11,8)  NOT NULL,
  recorded_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courier_locations_courier
  ON courier_locations(courier_id, recorded_at DESC);

ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- ── Dispatch log: add scoring/distance fields ───────────────────────────────
ALTER TABLE dispatch_log
  ADD COLUMN IF NOT EXISTS dispatch_type TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS distance_km   NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS score         NUMERIC(5,2);

-- ── Orders: add estimated_price ─────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_price INTEGER;

-- Populate estimated_price from delivery_fee for existing orders
UPDATE orders SET estimated_price = delivery_fee WHERE estimated_price IS NULL;

-- ── Indexes for dispatch queries ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_couriers_status_seen
  ON couriers(status, last_seen_at DESC)
  WHERE status IN ('online', 'available');

CREATE INDEX IF NOT EXISTS idx_dispatch_log_order
  ON dispatch_log(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);
