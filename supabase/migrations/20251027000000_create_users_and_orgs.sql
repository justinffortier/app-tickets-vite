-- Users and Organizations Migration
-- This creates a users table linked to Firebase Auth and an organizations table
-- with a many-to-many relationship through user_organizations

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  firebase_uid text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_organizations junction table
CREATE TABLE IF NOT EXISTS user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_org UNIQUE (user_id, organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Organizations RLS Policies
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organizations.id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update organizations they belong to"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organizations.id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    )
  );

CREATE POLICY "Users can delete organizations they own"
  ON organizations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organizations.id
      AND user_organizations.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND user_organizations.role = 'owner'
    )
  );

-- User Organizations RLS Policies
CREATE POLICY "Users can view their own organization memberships"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations uo2
      WHERE uo2.organization_id = user_organizations.organization_id
      AND uo2.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    )
  );

CREATE POLICY "Users can create organization memberships"
  ON user_organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organization members can update memberships"
  ON user_organizations FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations uo2
      WHERE uo2.organization_id = user_organizations.organization_id
      AND uo2.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND uo2.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can remove members"
  ON user_organizations FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM user_organizations uo2
      WHERE uo2.organization_id = user_organizations.organization_id
      AND uo2.user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1)
      AND uo2.role IN ('owner', 'admin')
    )
  );

