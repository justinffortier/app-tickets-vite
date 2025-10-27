-- Fix foreign key references from auth.users to users table
-- This updates the events and forms tables to reference our custom users table

-- Drop the old foreign key constraints
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_created_by_fkey;

ALTER TABLE forms 
  DROP CONSTRAINT IF EXISTS forms_created_by_fkey;

-- Update the reference to point to users table
ALTER TABLE events 
  ADD CONSTRAINT events_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE forms 
  ADD CONSTRAINT forms_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

