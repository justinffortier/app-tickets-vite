/*
  # Headless Ticketing Platform Schema

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `location` (text)
      - `image_url` (text, nullable)
      - `capacity` (integer, nullable)
      - `status` (text, default 'DRAFT')
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ticket_types`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `name` (text)
      - `description` (text, nullable)
      - `price` (numeric)
      - `quantity` (integer)
      - `sold` (integer, default 0)
      - `sales_start` (timestamptz)
      - `sales_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `discount_codes`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `code` (text, unique)
      - `type` (text, 'PERCENT' or 'AMOUNT')
      - `value` (numeric)
      - `max_uses` (integer, nullable)
      - `used_count` (integer, default 0)
      - `expires_at` (timestamptz, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

    - `forms`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events, nullable)
      - `name` (text)
      - `description` (text, nullable)
      - `schema` (jsonb)
      - `version` (integer, default 1)
      - `is_published` (boolean, default false)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `form_submissions`
      - `id` (uuid, primary key)
      - `form_id` (uuid, references forms)
      - `responses` (jsonb)
      - `order_id` (uuid, references orders, nullable)
      - `email` (text, nullable)
      - `created_at` (timestamptz)

    - `orders`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `form_submission_id` (uuid, references form_submissions, nullable)
      - `discount_code_id` (uuid, references discount_codes, nullable)
      - `subtotal` (numeric)
      - `discount_amount` (numeric, default 0)
      - `total` (numeric)
      - `status` (text, default 'PENDING')
      - `payment_intent_id` (text, nullable)
      - `customer_email` (text)
      - `customer_name` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `ticket_type_id` (uuid, references ticket_types)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `subtotal` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their events
    - Add policies for public access to published forms and events
    - Add policies for order management
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  location text,
  image_url text,
  capacity integer,
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL CHECK (quantity >= 0),
  sold integer DEFAULT 0 CHECK (sold >= 0),
  sales_start timestamptz NOT NULL,
  sales_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_sales_dates CHECK (sales_end > sales_start),
  CONSTRAINT valid_quantity CHECK (sold <= quantity)
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('PERCENT', 'AMOUNT')),
  value numeric(10,2) NOT NULL CHECK (value > 0),
  max_uses integer,
  used_count integer DEFAULT 0 CHECK (used_count >= 0),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer DEFAULT 1 CHECK (version > 0),
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_id uuid,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  form_submission_id uuid REFERENCES form_submissions(id) ON DELETE SET NULL,
  discount_code_id uuid REFERENCES discount_codes(id) ON DELETE SET NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount numeric(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED')),
  payment_intent_id text,
  customer_email text NOT NULL,
  customer_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id uuid REFERENCES ticket_types(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE form_submissions
  ADD CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_event ON discount_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_forms_event ON forms(event_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published events"
  ON events FOR SELECT
  USING (status = 'PUBLISHED');

CREATE POLICY "Authenticated users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR status = 'PUBLISHED');

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Public can view ticket types for published events"
  ON ticket_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.status = 'PUBLISHED'
    )
  );

CREATE POLICY "Authenticated users can manage ticket types for own events"
  ON ticket_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view discount codes for own events"
  ON discount_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = discount_codes.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can manage discount codes for own events"
  ON discount_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = discount_codes.event_id
      AND events.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = discount_codes.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view published forms"
  ON forms FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can view own forms"
  ON forms FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_published = true);

CREATE POLICY "Authenticated users can create forms"
  ON forms FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own forms"
  ON forms FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can submit to published forms"
  ON form_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_submissions.form_id
      AND forms.is_published = true
    )
  );

CREATE POLICY "Authenticated users can view submissions for own forms"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_submissions.form_id
      AND forms.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own orders by email"
  ON orders FOR SELECT
  USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can view orders for own events"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = orders.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "System can update orders"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view order items for own orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM events
          WHERE events.id = orders.event_id
          AND events.created_by = auth.uid()
        )
      )
    )
  );