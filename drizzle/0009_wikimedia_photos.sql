-- Fotos de uso livre (Wikimedia Commons) dos lugares da lista inicial.
-- Licenças CC BY-SA exigem crédito ao autor: o app mostra a legenda em cada foto.
-- Conferidas uma a uma em 14/11/2026 (mostram mesmo o lugar).
INSERT INTO restaurant_photos (id, restaurant_id, external_url, attribution, attribution_url, width, height, created_at)
SELECT gen_random_uuid()::text, r.id, v.url, v.credit, v.page, v.w, v.h, now() - interval '30 days'
FROM (VALUES
  ('Bar da Dona Onça', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/BAr_da_Dona_On%C3%A7a_%284875937678%29.jpg/1280px-BAr_da_Dona_On%C3%A7a_%284875937678%29.jpg', 'Foto: Monica Kaneko · CC BY-SA 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3ABAr_da_Dona_On%C3%A7a_%284875937678%29.jpg', 1280, 960),
  ('Bar da Dona Onça', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Restaurante_Dona_On%C3%A7a_%284875936874%29.jpg/1280px-Restaurante_Dona_On%C3%A7a_%284875936874%29.jpg', 'Foto: Monica Kaneko · CC BY-SA 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3ARestaurante_Dona_On%C3%A7a_%284875936874%29.jpg', 1280, 960),
  ('Famiglia Mancini', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Famiglia_Mancini_restaurant_facade_in_S%C3%A3o_Paulo_downtown%2C_Brazil.jpg/1280px-Famiglia_Mancini_restaurant_facade_in_S%C3%A3o_Paulo_downtown%2C_Brazil.jpg', 'Foto: Wilfredor · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3AFamiglia_Mancini_restaurant_facade_in_S%C3%A3o_Paulo_downtown%2C_Brazil.jpg', 1280, 853),
  ('Famiglia Mancini', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Famiglia_Mancini_restaurant_interior.jpg/1280px-Famiglia_Mancini_restaurant_interior.jpg', 'Foto: Wilfredor · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3AFamiglia_Mancini_restaurant_interior.jpg', 1280, 853)
) AS v(name, url, credit, page, w, h)
JOIN restaurants r ON r.name = v.name AND r.city = 'São Paulo'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_photos p WHERE p.external_url = v.url);
