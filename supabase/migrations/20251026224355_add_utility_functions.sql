/*
  # Add Utility Functions

  1. Functions
    - `increment_ticket_sold` - Safely increment the sold count for a ticket type
    - `decrement_ticket_sold` - Safely decrement the sold count for a ticket type
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

CREATE OR REPLACE FUNCTION decrement_ticket_sold(ticket_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE ticket_types
  SET sold = GREATEST(0, sold - amount)
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

-- Recalculate sold counts from actual PAID orders
-- This fixes any discrepancies from deleted orders or data inconsistencies
CREATE OR REPLACE FUNCTION recalculate_ticket_sold_counts()
RETURNS void AS $$
BEGIN
  UPDATE ticket_types
  SET sold = COALESCE((
    SELECT SUM(oi.quantity)
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE oi.ticket_type_id = ticket_types.id
      AND o.status = 'PAID'
  ), 0);
END;
$$ LANGUAGE plpgsql;