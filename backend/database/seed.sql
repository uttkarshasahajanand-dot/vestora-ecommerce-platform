USE vestora;

INSERT IGNORE INTO categories (name, slug, description) VALUES
  ('Ready-to-wear', 'ready-to-wear', 'Considered clothing for everyday and occasion.'),
  ('Bags', 'bags', 'Thoughtfully designed leather bags.'),
  ('Shoes', 'shoes', 'Everyday footwear with enduring forms.'),
  ('Accessories', 'accessories', 'Small finishing pieces, made to keep.');

INSERT IGNORE INTO products
  (category_id, slug, sku, name, description, color, image_url, label, price, stock_quantity)
VALUES
  ((SELECT id FROM categories WHERE slug = 'ready-to-wear'), 'forma-coat', 'VESTORA-FORMA-COAT', 'The Forma Coat',
   'A beautifully balanced silhouette in a soft, substantial wool blend. Designed for layering, and for keeping.',
   'Warm stone', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=85', 'BESTSELLER', 895.00, 12),
  ((SELECT id FROM categories WHERE slug = 'bags'), 'noa-tote', 'VESTORA-NOA-TOTE', 'Noa Leather Tote',
   'Quietly practical, endlessly considered. Cut from supple Italian leather with room for everything that matters.',
   'Espresso', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85', 'NEW ARRIVAL', 640.00, 16),
  ((SELECT id FROM categories WHERE slug = 'ready-to-wear'), 'silk-column-dress', 'VESTORA-SILK-DRESS', 'Silk Column Dress',
   'Fluid silk falls in a clean, uninterrupted line. A considered piece for evenings that ask for very little else.',
   'Soft ivory', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85', NULL, 720.00, 10),
  ((SELECT id FROM categories WHERE slug = 'shoes'), 'sculpted-loafer', 'VESTORA-SCULPTED-LOAFER', 'Sculpted Loafer',
   'A refined everyday classic, shaped in smooth leather with a softly structured profile and a comfortable low heel.',
   'Black', 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=1000&q=85', NULL, 510.00, 18),
  ((SELECT id FROM categories WHERE slug = 'ready-to-wear'), 'daylight-knit', 'VESTORA-DAYLIGHT-KNIT', 'Daylight Cashmere Knit',
   'Light, soft cashmere with a relaxed drape. An effortless layer to return to, season after season.',
   'Oatmeal', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85', 'EXCLUSIVE', 460.00, 20),
  ((SELECT id FROM categories WHERE slug = 'bags'), 'arc-shoulder-bag', 'VESTORA-ARC-SHOULDER-BAG', 'Arc Shoulder Bag',
   'A soft sculptural shape meets considered function in this compact shoulder bag, finished by hand in Italy.',
   'Toffee', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85', NULL, 785.00, 9),
  ((SELECT id FROM categories WHERE slug = 'ready-to-wear'), 'linen-trouser', 'VESTORA-LINEN-TROUSER', 'Tailored Linen Trouser',
   'An easy, polished trouser in breathable European linen, with a gentle drape and a timeless straight leg.',
   'Natural', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85', NULL, 385.00, 15),
  ((SELECT id FROM categories WHERE slug = 'accessories'), 'golden-hour-earrings', 'VESTORA-GOLDEN-HOUR', 'Golden Hour Hoops',
   'Sculptural, lightweight hoops made to catch the light. Crafted in recycled sterling silver with gold vermeil.',
   'Recycled gold vermeil', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85', 'SMALL BATCH', 245.00, 25);
