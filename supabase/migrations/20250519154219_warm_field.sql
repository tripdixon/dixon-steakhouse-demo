/*
  # Add reservation_id column to reservations table

  1. Changes
    - Add `reservation_id` text column to the `reservations` table
    - This field will store a custom reservation identifier
    
  2. Schema Impact
    - Adds a new optional text column to store reservation IDs
*/

-- Add the reservation_id column
ALTER TABLE reservations 
ADD COLUMN reservation_id text;