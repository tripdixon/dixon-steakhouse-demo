/*
  # Create initial schema for Dixon Steakhouse

  1. New Tables
    - `calls` - Stores call information
      - `id` (uuid, primary key)
      - `phone_number` (text)
      - `call_time` (timestamp)
      - `call_duration` (integer)
      - `call_cost` (numeric)
      - `call_end_reason` (text)
      - `call_summary` (text)
      - `reservation_reference` (uuid, nullable)

    - `reservations` - Stores reservation details
      - `id` (uuid, primary key)
      - `originating_call_id` (uuid, foreign key to calls.id)
      - `phone_number` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `reservation_date` (date)
      - `reservation_time` (time)
      - `guests` (integer)
      - `special_occasion` (text, nullable)
      - `seating_preferences` (text, nullable)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read all data
*/

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  call_time timestamp with time zone NOT NULL DEFAULT now(),
  call_duration integer NOT NULL,
  call_cost numeric NOT NULL,
  call_end_reason text NOT NULL,
  call_summary text NOT NULL,
  reservation_reference uuid
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  originating_call_id uuid NOT NULL REFERENCES calls(id),
  phone_number text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  guests integer NOT NULL,
  special_occasion text,
  seating_preferences text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up foreign key from calls to reservations
ALTER TABLE calls
ADD CONSTRAINT fk_reservation 
FOREIGN KEY (reservation_reference) 
REFERENCES reservations(id) 
ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read calls"
ON calls
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to read reservations"
ON reservations
FOR SELECT
TO authenticated
USING (true);

-- Create index for frequent queries
CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS reservations_lastname_idx ON reservations(last_name);