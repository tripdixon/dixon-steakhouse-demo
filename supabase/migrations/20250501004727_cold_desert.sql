/*
  # Remove seating preferences from reservations table

  1. Changes
    - Remove `seating_preferences` column from the `reservations` table
    - This simplifies the reservation data model

  2. Schema Impact
    - Removes an optional field that is no longer needed
*/

-- Remove the seating_preferences column
ALTER TABLE reservations DROP COLUMN IF EXISTS seating_preferences;