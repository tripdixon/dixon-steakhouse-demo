/*
  # Update reservations table datetime fields

  1. Changes
    - Add start_date_time and end_date_time columns
    - Enable RLS on reservations table
    - Add policy for all operations

  2. Security
    - Enable RLS
    - Add policy for all operations for anon and authenticated roles
*/

-- Add new datetime columns
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS start_date_time timestamptz NOT NULL,
ADD COLUMN IF NOT EXISTS end_date_time timestamptz NOT NULL;

-- Create index for datetime columns
CREATE INDEX IF NOT EXISTS reservations_datetime_idx ON reservations (start_date_time, end_date_time);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "all_operations"
ON reservations
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);