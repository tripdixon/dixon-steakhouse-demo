/*
  # Add Chef's Table column to reservations

  1. Changes
    - Add `chefs_table` boolean column to reservations table with default value of false
    - Add index for efficient querying

  2. Schema Impact
    - Adds new column for tracking Chef's Table reservations
    - Default value ensures backward compatibility
*/

-- Add chefs_table column with default value
ALTER TABLE reservations 
ADD COLUMN chefs_table boolean NOT NULL DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS reservations_chefs_table_idx 
ON reservations(chefs_table);