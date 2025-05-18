/*
  # Combine first_name and last_name into full_name

  1. Changes
    - Add a new column `full_name` to the `reservations` table
    - Update existing data to populate full_name by combining first_name and last_name
    - Drop the first_name and last_name columns
    
  2. Schema Impact
    - Simplifies the schema by having a single name field
*/

-- Add the new full_name column
ALTER TABLE reservations ADD COLUMN full_name text;

-- Update existing data to populate full_name
UPDATE reservations
SET full_name = first_name || ' ' || last_name
WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

-- Drop the now redundant columns
ALTER TABLE reservations DROP COLUMN first_name;
ALTER TABLE reservations DROP COLUMN last_name;