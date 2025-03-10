/*
  # Create products table and insert initial data

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image` (text)
      - `stock` (integer)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on products table
    - Add policy for public read access
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  image text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Insert initial products data
INSERT INTO products (name, description, price, image, stock) VALUES
(
  'Lavender Dreams',
  'A serene blend of French lavender and Madagascar vanilla, creating a calming atmosphere perfect for relaxation.',
  65.00,
  'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=800',
  15
),
(
  'Ocean Breeze',
  'Immerse yourself in the essence of coastal living with notes of sea salt, sage, and fresh ocean air.',
  75.00,
  'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800',
  10
),
(
  'Vanilla Comfort',
  'Luxurious Madagascar bourbon vanilla infused with subtle notes of amber and warm musk.',
  70.00,
  'https://images.unsplash.com/photo-1639111961549-1564466e7596?w=800',
  20
),
(
  'Cedar & Pine',
  'An sophisticated blend of cedarwood, fresh pine needles, and a hint of smoky vetiver.',
  80.00,
  'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=800',
  8
);