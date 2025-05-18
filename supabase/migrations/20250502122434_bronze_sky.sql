/*
  # Fix deletion cascade for reservations

  1. Changes
    - Add ON DELETE CASCADE to the foreign key constraint between calls and reservations
    - This ensures when a reservation is deleted, related call records are properly handled

  2. Schema Impact
    - Modifies the relationship between calls and reservations tables
    - Ensures data consistency when deleting reservations
*/

-- Drop the existing foreign key constraint
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_originating_call_id_fkey;

-- Re-create the constraint with ON DELETE CASCADE
ALTER TABLE reservations
ADD CONSTRAINT reservations_originating_call_id_fkey 
FOREIGN KEY (originating_call_id) 
REFERENCES calls(id) 
ON DELETE CASCADE;