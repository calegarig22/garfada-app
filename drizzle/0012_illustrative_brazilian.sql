-- Fotos ilustrativas específicas para os 3 lugares "Brasileira" (para não repetir a feijoada).
-- Wikimedia Commons, uso livre com crédito. Ficam com data antiga: qualquer foto
-- enviada por quem avaliar passa na frente e vira a capa.
INSERT INTO restaurant_photos (id, restaurant_id, external_url, attribution, attribution_url, width, height, created_at)
SELECT gen_random_uuid()::text, r.id, v.url, v.credit, v.page, v.w, v.h, now() - interval '60 days'
FROM (VALUES
  ('Mocotó', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bai%C3%A3o_de_Dois_%28superior_view%29.jpg/1280px-Bai%C3%A3o_de_Dois_%28superior_view%29.jpg', 'Foto ilustrativa: Senado Federal · CC BY 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Bai%C3%A3o_de_Dois_(superior_view).jpg', 1280, 852),
  ('A Casa do Porco', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Pork_prrr.jpg/1280px-Pork_prrr.jpg', 'Foto ilustrativa: Biser Todorov · CC BY 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Pork_prrr.jpg', 1280, 721),
  ('Consulado Mineiro', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Cheesebread.jpg/1280px-Cheesebread.jpg', 'Foto ilustrativa: Murilo manzini · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Cheesebread.jpg', 1280, 851)
) AS v(name, url, credit, page, w, h)
JOIN restaurants r ON r.name = v.name AND r.city = 'São Paulo'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_photos p WHERE p.external_url = v.url);
