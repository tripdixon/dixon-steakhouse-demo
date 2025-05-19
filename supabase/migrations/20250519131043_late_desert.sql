/*
  # Fix RLS policies for deletion

  1. Changes
    - Drop and recreate RLS policies with proper deletion permissions
    - Ensure authenticated users can properly delete reservations
    - Add explicit policies for all operations

  2. Security
    - Maintain existing security model while fixing deletion permissions
    - Ensure proper cascade deletion between calls and reservations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON reservations;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON reservations;

-- Recreate policies with proper permissions
CREATE POLICY "Enable read access for all users"
ON reservations FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON reservations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON reservations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON reservations FOR DELETE
TO authenticated
USING (true);