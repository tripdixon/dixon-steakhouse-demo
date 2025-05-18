/*
  # Fix RLS policies for proper data access

  1. Security Updates
    - Update RLS policies on both tables to ensure proper access
    - Add policies for INSERT, UPDATE, and DELETE operations
    - Ensure authenticated users can access all data

  2. Changes
    - Drop existing policies
    - Create more comprehensive policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read calls" ON calls;
DROP POLICY IF EXISTS "Allow authenticated users to read reservations" ON reservations;

-- Create more comprehensive policies for calls table
CREATE POLICY "Enable read access for all users" 
ON calls FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON calls FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
ON calls FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
ON calls FOR DELETE 
TO authenticated 
USING (true);

-- Create more comprehensive policies for reservations table
CREATE POLICY "Enable read access for all users" 
ON reservations FOR SELECT 
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