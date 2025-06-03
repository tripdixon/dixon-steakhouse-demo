/*
  # Add datetime columns to reservations table

  1. Changes
    - Add start_date_time and end_date_time columns to reservations table
    - Create index for efficient datetime querying
    
  2. Schema Impact
    - Adds new columns for tracking reservation time periods
    - Improves query performance with index
*/

-- Add new datetime columns
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS start_date_time timestamptz NOT NULL,
ADD COLUMN IF NOT EXISTS end_date_time timestamptz NOT NULL;

-- Create index for datetime columns
CREATE INDEX IF NOT EXISTS reservations_datetime_idx 
ON reservations (start_date_time, end_date_time);