/*
  # Add Utility Functions

  1. Functions
    - `increment_ticket_sold` - Safely increment the sold count for a ticket type
    - `increment_discount_usage` - Safely increment the usage count for a discount code

  2. Purpose
    - Provide atomic operations for updating counters
    - Prevent race conditions when multiple orders are placed simultaneously
*/

CREATE OR REPLACE FUNCTION increment_ticket_sold(ticket_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE ticket_types
  SET sold = sold + amount
  WHERE id = ticket_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET used_count = used_count + 1
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;