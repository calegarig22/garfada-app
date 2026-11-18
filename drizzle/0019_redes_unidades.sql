-- Administração: troque 'admin' pelo @username de quem vai administrar o app.
UPDATE users SET is_admin = true WHERE username = 'admin';
--> statement-breakpoint
-- Redes muito grandes saem do Garfada (a ideia é descobrir lugares).
DELETE FROM restaurants
WHERE city = 'São Paulo'
  AND garfada_norm(name) IN (garfada_norm('Coco Bambu'), garfada_norm('Sí Señor'), garfada_norm('Fogo de Chão'),
                             garfada_norm('Dengo'), garfada_norm('Ofner'), garfada_norm('The Fifties'));
--> statement-breakpoint
-- Bráz vira uma rede com 3 unidades (endereços: Guia da Semana; mapa: OpenStreetMap).
WITH marca AS (
  INSERT INTO brands (id, name) VALUES (gen_random_uuid()::text, 'Bráz Pizzaria') RETURNING id
), moema AS (
  UPDATE restaurants SET brand_id = (SELECT id FROM marca)
   WHERE name = 'Bráz Pizzaria' AND city = 'São Paulo' RETURNING cuisine_id, price_level
)
INSERT INTO restaurants (id, name, address, neighborhood, city, cuisine_id, price_level, latitude, longitude, brand_id)
SELECT gen_random_uuid()::text, 'Bráz Pizzaria', v.address, v.neighborhood, 'São Paulo',
       (SELECT cuisine_id FROM moema), (SELECT price_level FROM moema), v.lat, v.lng, (SELECT id FROM marca)
FROM (VALUES
  ('R. Vupabuçu, 271', 'Pinheiros', -23.560099, -46.698590),
  ('R. Sergipe, 406', 'Higienópolis', -23.547950, -46.657567)
) AS v(address, neighborhood, lat, lng);
