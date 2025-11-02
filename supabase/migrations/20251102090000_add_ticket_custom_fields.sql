-- Add custom fields and benefits to ticket_types
ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS benefits text;


