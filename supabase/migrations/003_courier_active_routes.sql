-- =============================================================================
-- GiriGo Courier — Courier Active Routes (route-based dispatch v2)
-- =============================================================================

-- ── Main table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courier_active_routes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id                UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,

  -- Route endpoints
  route_start_address       TEXT NOT NULL,
  route_end_address         TEXT NOT NULL,
  start_lat                 NUMERIC(10,8) NOT NULL,
  start_lng                 NUMERIC(11,8) NOT NULL,
  end_lat                   NUMERIC(10,8) NOT NULL,
  end_lng                   NUMERIC(11,8) NOT NULL,

  -- Live position: {lat, lng, updated_at}
  current_location          JSONB NOT NULL DEFAULT '{"lat":null,"lng":null,"updated_at":null}',

  -- Batched orders (array of order UUIDs)
  orders_in_route           UUID[] NOT NULL DEFAULT '{}',

  -- Route metrics
  total_distance_km         NUMERIC(6,2) NOT NULL DEFAULT 0,
  estimated_completion_time TIMESTAMPTZ,

  -- Lifecycle: idle → active → completed
  status                    TEXT NOT NULL DEFAULT 'idle'
                            CHECK (status IN ('active', 'idle', 'completed')),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active/idle route per courier at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_car_courier_active
  ON courier_active_routes (courier_id)
  WHERE status IN ('active', 'idle');

CREATE INDEX IF NOT EXISTS idx_car_courier_status
  ON courier_active_routes (courier_id, status);

CREATE INDEX IF NOT EXISTS idx_car_status
  ON courier_active_routes (status);

-- Auto-update updated_at (reuses the existing trigger function)
CREATE TRIGGER trg_car_updated_at
  BEFORE UPDATE ON courier_active_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE courier_active_routes ENABLE ROW LEVEL SECURITY;

-- ── Extend orders table ───────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_route_id UUID
    REFERENCES courier_active_routes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_route
  ON orders (assigned_route_id)
  WHERE assigned_route_id IS NOT NULL;
