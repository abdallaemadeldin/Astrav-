/*
  # Insert initial products

  1. Data Population
    - Insert 4 initial products with:
      - Unique IDs
      - Names and descriptions
      - Prices
      - Image URLs
      - Stock quantities

  Note: Using DO block to prevent duplicate insertions
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
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
  END IF;
END $$;