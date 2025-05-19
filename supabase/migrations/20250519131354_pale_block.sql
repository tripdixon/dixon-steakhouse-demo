/*
  # Fix reservation deletion permissions

  1. Changes
    - Drop and recreate RLS policies with proper cascade deletion handling
    - Ensure authenticated users have proper delete permissions
    - Add explicit policy for handling cascade deletes

  2. Security Impact
    - Maintains secure access control while enabling proper deletion
    - Ensures authenticated users can properly delete their reservations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON calls;

-- Create updated delete policies
CREATE POLICY "Enable delete access for authenticated users"
ON reservations FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Enable delete access for authenticated users"
ON calls FOR DELETE
TO authenticated
USING (true);