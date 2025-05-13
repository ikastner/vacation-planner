/*
  # Create availabilities table

  1. New Tables
    - `availabilities`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `is_available` (boolean, not null)
      - `created_at` (timestamp with time zone, default now())
  2. Security
    - Enable RLS on `availabilities` table
    - Add policy for public access (read and insert)
*/

CREATE TABLE IF NOT EXISTS availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON availabilities
  FOR SELECT
  TO public
  USING (true);

-- Create policy for public insert access
CREATE POLICY "Allow public insert access"
  ON availabilities
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Allow public update access"
  ON availabilities
  FOR UPDATE
  TO public
  USING (true);

-- Create policy for public delete access
CREATE POLICY "Allow public delete access"
  ON availabilities
  FOR DELETE
  TO public
  USING (true);