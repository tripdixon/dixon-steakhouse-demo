/*
  # Remove reservation_reference from calls table

  1. Changes
    - Remove `reservation_reference` column from the `calls` table as not every call results in a reservation

  2. Schema Impact
    - Removes the foreign key relationship from `calls` to `reservations`
*/

-- First drop the foreign key constraint
ALTER TABLE calls DROP CONSTRAINT IF EXISTS fk_reservation;

-- Then drop the column
ALTER TABLE calls DROP COLUMN IF EXISTS reservation_reference;