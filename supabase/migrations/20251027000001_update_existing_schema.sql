-- Update existing schema to use new users table and add organization_id
-- This migration updates events and forms tables to reference the new users table

-- Add organization_id to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to forms table
ALTER TABLE forms
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for organization_id
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_organization ON forms(organization_id);

-- Update events RLS policies to include organization context
DROP POLICY IF EXISTS "Authenticated users can view own events" ON events;
CREATE POLICY "Authenticated users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR status = 'PUBLISHED'
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = events.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1 FROM user_organizations
        WHERE user_organizations.organization_id = events.organization_id
        AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = events.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = events.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = events.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

-- Update forms RLS policies to include organization context
DROP POLICY IF EXISTS "Authenticated users can view own forms" ON forms;
CREATE POLICY "Authenticated users can view own forms"
  ON forms FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR is_published = true
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = forms.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create forms" ON forms;
CREATE POLICY "Authenticated users can create forms"
  ON forms FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1 FROM user_organizations
        WHERE user_organizations.organization_id = forms.organization_id
        AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own forms" ON forms;
CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = forms.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = forms.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete own forms" ON forms;
CREATE POLICY "Users can delete own forms"
  ON forms FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = forms.organization_id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

