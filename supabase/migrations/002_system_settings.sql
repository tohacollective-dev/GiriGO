-- =============================================================================
-- GiriGo Courier — System Settings (key-value store for operational config)
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: signage activation state
INSERT INTO system_settings (key, value)
VALUES (
  'signage',
  '{"active": false, "activated_at": null}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- RLS: block direct client access — all writes go through supabaseAdmin (service role)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
