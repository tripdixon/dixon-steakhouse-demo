/*
  # Add start and end datetime fields to reservations

  1. Changes
    - Add `start_date_time` and `end_date_time` columns to reservations table
    - Migrate existing data from reservation_date and reservation_time to start_date_time
    - Set end_date_time to start_date_time + 2 hours
    - Remove old date and time columns
    - Update indexes for efficient querying

  2. Schema Impact
    - Replaces separate date/time fields with timestamp fields
    - Maintains existing data while transitioning to new schema
*/

-- Add new timestamp columns
ALTER TABLE reservations 
ADD COLUMN start_date_time timestamp with time zone,
ADD COLUMN end_date_time timestamp with time zone;

-- Migrate existing data
UPDATE reservations
SET start_date_time = (reservation_date || ' ' || reservation_time)::timestamp with time zone,
    end_date_time = (reservation_date || ' ' || reservation_time)::timestamp with time zone + interval '2 hours'
WHERE reservation_date IS NOT NULL AND reservation_time IS NOT NULL;

-- Make the new columns required
ALTER TABLE reservations
ALTER COLUMN start_date_time SET NOT NULL,
ALTER COLUMN end_date_time SET NOT NULL;

-- Drop old columns
ALTER TABLE reservations
DROP COLUMN reservation_date,
DROP COLUMN reservation_time;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS reservations_datetime_idx 
ON reservations(start_date_time, end_date_time);