-- =============================================================================
-- GiriGo Courier — Supabase PostgreSQL Schema v2.0
-- Run via: supabase db push  OR  copy-paste into Supabase SQL Editor
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for address text search

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role        AS ENUM ('customer', 'courier', 'admin');
CREATE TYPE courier_status   AS ENUM ('online', 'offline', 'busy');
CREATE TYPE order_status     AS ENUM ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled', 'failed');
CREATE TYPE payment_method   AS ENUM ('cod', 'transfer', 'ewallet');
CREATE TYPE payout_status    AS ENUM ('unpaid', 'settled');
CREATE TYPE dispatch_result  AS ENUM ('accepted', 'rejected', 'timeout', 'admin_alert');
CREATE TYPE session_state    AS ENUM (
  'idle', 'awaiting_name', 'awaiting_pickup', 'awaiting_dropoff',
  'awaiting_package_type', 'awaiting_payment', 'awaiting_confirmation',
  'order_active', 'awaiting_rating'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- users: all platform participants
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL UNIQUE,          -- E.164: 628xxxxxxxxx
  role         user_role NOT NULL DEFAULT 'customer',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- couriers: extended profile for courier role
CREATE TABLE couriers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating           NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 1 AND 5),
  status           courier_status NOT NULL DEFAULT 'offline',
  total_orders     INTEGER NOT NULL DEFAULT 0,
  total_earnings   NUMERIC(15,2) NOT NULL DEFAULT 0,
  current_lat      NUMERIC(10,8),             -- last known latitude
  current_lng      NUMERIC(11,8),             -- last known longitude
  location_updated TIMESTAMPTZ,
  vehicle_type     TEXT NOT NULL DEFAULT 'motorcycle',
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- orders: core transactional table
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code          TEXT NOT NULL UNIQUE,   -- GG-YYMMDD-NNN format
  customer_id         UUID NOT NULL REFERENCES users(id),
  courier_id          UUID REFERENCES couriers(id),

  -- Addresses
  pickup_address      TEXT NOT NULL,
  pickup_lat          NUMERIC(10,8),
  pickup_lng          NUMERIC(11,8),
  dropoff_address     TEXT NOT NULL,
  dropoff_lat         NUMERIC(10,8),
  dropoff_lng         NUMERIC(11,8),

  -- Package
  item_type           TEXT NOT NULL DEFAULT 'Paket',
  item_weight_kg      NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  notes               TEXT,

  -- Pricing
  distance_km         NUMERIC(6,2),
  base_fee            INTEGER NOT NULL DEFAULT 5000,
  weight_surcharge    INTEGER NOT NULL DEFAULT 0,
  delivery_fee        INTEGER NOT NULL,        -- total calculated fee
  package_value       INTEGER NOT NULL DEFAULT 0, -- COD merchant value

  -- Payment
  payment_method      payment_method NOT NULL DEFAULT 'transfer',
  status              order_status NOT NULL DEFAULT 'pending',

  -- Proof of Delivery
  pickup_photo_url    TEXT,
  dropoff_photo_url   TEXT,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at         TIMESTAMPTZ,
  picked_up_at        TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ledger: financial reconciliation per delivered order
CREATE TABLE ledger (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier_id            UUID NOT NULL REFERENCES couriers(id),
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  total_delivery_fee    INTEGER NOT NULL,
  courier_share         INTEGER NOT NULL,      -- 85%
  platform_share        INTEGER NOT NULL,      -- 15%
  cod_collected         INTEGER NOT NULL DEFAULT 0,
  payout_status         payout_status NOT NULL DEFAULT 'unpaid',
  settled_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id)
);

-- wa_sessions: WhatsApp conversation state machine
CREATE TABLE wa_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone        TEXT NOT NULL UNIQUE,           -- customer phone E.164
  user_id      UUID REFERENCES users(id),
  state        session_state NOT NULL DEFAULT 'idle',
  context      JSONB NOT NULL DEFAULT '{}',    -- in-progress order data
  last_msg_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- dispatch_log: audit trail for every dispatch attempt
CREATE TABLE dispatch_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  courier_id   UUID REFERENCES couriers(id),
  attempt      INTEGER NOT NULL DEFAULT 1 CHECK (attempt BETWEEN 1 AND 3),
  score        NUMERIC(5,2),
  result       dispatch_result NOT NULL,
  offered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ratings: customer → courier ratings after delivery
CREATE TABLE ratings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES users(id),
  courier_id   UUID NOT NULL REFERENCES couriers(id),
  score        INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_orders_customer       ON orders(customer_id);
CREATE INDEX idx_orders_courier        ON orders(courier_id);
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_orders_created        ON orders(created_at DESC);
CREATE INDEX idx_orders_code           ON orders(order_code);
CREATE INDEX idx_couriers_status       ON couriers(status);
CREATE INDEX idx_couriers_location     ON couriers(current_lat, current_lng) WHERE status = 'online';
CREATE INDEX idx_ledger_courier        ON ledger(courier_id);
CREATE INDEX idx_ledger_payout         ON ledger(payout_status);
CREATE INDEX idx_dispatch_order        ON dispatch_log(order_id);
CREATE INDEX idx_wa_sessions_phone     ON wa_sessions(phone);

-- =============================================================================
-- TRIGGERS: auto-update updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_couriers_updated_at BEFORE UPDATE ON couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- TRIGGER: auto-generate order_code  (GG-YYMMDD-NNN)
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  today_str TEXT := TO_CHAR(NOW(), 'YYMMDD');
  seq       INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM orders
  WHERE order_code LIKE 'GG-' || today_str || '-%';
  NEW.order_code := 'GG-' || today_str || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_code IS NULL OR NEW.order_code = '')
  EXECUTE FUNCTION generate_order_code();

-- =============================================================================
-- TRIGGER: auto-create ledger row when order status = 'delivered'
-- =============================================================================
CREATE OR REPLACE FUNCTION create_ledger_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' AND NEW.courier_id IS NOT NULL THEN
    INSERT INTO ledger (
      order_id, courier_id, date,
      total_delivery_fee,
      courier_share,
      platform_share,
      cod_collected
    ) VALUES (
      NEW.id,
      NEW.courier_id,
      CURRENT_DATE,
      NEW.delivery_fee,
      FLOOR(NEW.delivery_fee * 0.85),
      CEIL(NEW.delivery_fee * 0.15),
      CASE WHEN NEW.payment_method = 'cod' THEN NEW.package_value ELSE 0 END
    )
    ON CONFLICT (order_id) DO NOTHING;

    -- Update courier aggregate totals
    UPDATE couriers
    SET total_orders   = total_orders + 1,
        total_earnings = total_earnings + FLOOR(NEW.delivery_fee * 0.85)
    WHERE id = NEW.courier_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ledger_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_ledger_on_delivery();

-- =============================================================================
-- TRIGGER: update courier rating after new rating inserted
-- =============================================================================
CREATE OR REPLACE FUNCTION update_courier_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE couriers
  SET rating = (
    SELECT ROUND(AVG(score)::NUMERIC, 2)
    FROM ratings
    WHERE courier_id = NEW.courier_id
  )
  WHERE id = NEW.courier_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_courier_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_courier_rating();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings       ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all RLS (used by backend API)
-- Public tracking: anyone can read orders by order_code
CREATE POLICY "public_tracking" ON orders
  FOR SELECT USING (true);  -- tracking page is public; filter by order_code in query

-- Couriers can update their own status and location
CREATE POLICY "courier_self_update" ON couriers
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- VIEWS: analytics helpers
-- =============================================================================
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT
  DATE(created_at)                            AS date,
  COUNT(*)                                    AS total_orders,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  SUM(delivery_fee) FILTER (WHERE status = 'delivered') AS gross_revenue,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'delivered') * 100.0 / NULLIF(COUNT(*), 0), 1
  )                                           AS success_rate_pct
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW v_courier_leaderboard AS
SELECT
  u.name,
  u.phone,
  c.rating,
  c.total_orders,
  c.total_earnings,
  c.status
FROM couriers c
JOIN users u ON u.id = c.user_id
ORDER BY c.total_orders DESC;
