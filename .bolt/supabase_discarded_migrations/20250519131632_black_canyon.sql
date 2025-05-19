/*
  # Capitalize special occasion values

  1. Changes
    - Add a trigger to automatically capitalize the first letter of special_occasion values
    - Update existing special_occasion values to have capitalized first letters

  2. Schema Impact
    - Ensures consistent capitalization of special occasion values
    - Affects both existing and new data
*/

-- Create function to capitalize first letter
CREATE OR REPLACE FUNCTION capitalize_first_letter()
RETURNS trigger AS $$
BEGIN
  IF NEW.special_occasion IS NOT NULL THEN
    NEW.special_occasion = INITCAP(NEW.special_occasion);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to capitalize special_occasion on insert or update
CREATE TRIGGER capitalize_special_occasion
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION capitalize_first_letter();

-- Update existing records to capitalize first letter
UPDATE reservations 
SET special_occasion = INITCAP(special_occasion)
WHERE special_occasion IS NOT NULL;