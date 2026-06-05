-- =============================================================================
-- 005_order_wizard — Extend session states for WhatsApp Order Wizard
-- =============================================================================

-- Add new session states for the order wizard flow
ALTER TYPE session_state ADD VALUE IF NOT EXISTS 'menu';
ALTER TYPE session_state ADD VALUE IF NOT EXISTS 'awaiting_recipient_name';
ALTER TYPE session_state ADD VALUE IF NOT EXISTS 'awaiting_recipient_phone';
