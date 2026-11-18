-- Fotos REAIS dos próprios lugares (Wikimedia Commons, uso livre com crédito), conferidas uma a uma.
-- Ficam com data antiga: fotos que as pessoas mandarem aparecem antes no carrossel.
INSERT INTO restaurant_photos (id, restaurant_id, external_url, attribution, attribution_url, width, height, created_at)
SELECT gen_random_uuid()::text, r.id, v.url, v.credit, v.page, v.w, v.h, now() - interval '20 days'
FROM (VALUES
  ('Rinconcito Peruano', 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Alfajores_%40_Rinconcito_Peruano_%2812052635153%29.jpg', 'Foto: Wagner Tamanaha · CC BY-SA 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Alfajores_@_Rinconcito_Peruano_(12052635153).jpg', 1280, 960),
  ('Bar Brahma', 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Bar_Brahma%2C_S%C3%A3o_Paulo%2C_SP%2C_Brasil.jpg', 'Foto: JulianaYang · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Bar_Brahma,_S%C3%A3o_Paulo,_SP,_Brasil.jpg', 1280, 1262),
  ('Bar Brahma', 'https://upload.wikimedia.org/wikipedia/commons/2/22/Bar_Brahma_1.JPG', 'Foto: Dornicke · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Bar_Brahma_1.JPG', 1280, 784),
  ('Bar do Mané', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bar_do_Man%C3%A9.png/1280px-Bar_do_Man%C3%A9.png', 'Foto: TRAVEL PINGUIM · CC BY 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Bar_do_Man%C3%A9.png', 1280, 720),
  ('Café Girondino', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Caf%C3%A9_Girondino%2C_em_S%C3%A3o_Paulo_%2828897479610%29.jpg/1280px-Caf%C3%A9_Girondino%2C_em_S%C3%A3o_Paulo_%2828897479610%29.jpg', 'Foto: Núcleo Editorial · CC BY 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Caf%C3%A9_Girondino,_em_S%C3%A3o_Paulo_(28897479610).jpg', 1280, 853),
  ('Café Girondino', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Caf%C3%A9_Girondino%2C_em_S%C3%A3o_Paulo_%2829185412075%29.jpg/1280px-Caf%C3%A9_Girondino%2C_em_S%C3%A3o_Paulo_%2829185412075%29.jpg', 'Foto: Núcleo Editorial · CC BY 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Caf%C3%A9_Girondino,_em_S%C3%A3o_Paulo_(29185412075).jpg', 1280, 1920),
  ('Rinconcito Peruano', 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Chicharron_Mixto_%40_Rinconcito_Peruano_%2812052720594%29.jpg', 'Foto: Wagner Tamanaha · CC BY-SA 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Chicharron_Mixto_@_Rinconcito_Peruano_(12052720594).jpg', 1280, 960),
  ('Lanchonete da Cidade', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Suco_de_laranja_na_Lanchonete_da_Cidade_%286601138243%29.jpg/1280px-Suco_de_laranja_na_Lanchonete_da_Cidade_%286601138243%29.jpg', 'Foto: Monica Kaneko · CC BY-SA 2.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Suco_de_laranja_na_Lanchonete_da_Cidade_(6601138243).jpg', 1280, 1707)
) AS v(name, url, credit, page, w, h)
JOIN restaurants r ON r.name = v.name AND r.city = 'São Paulo'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_photos p WHERE p.external_url = v.url);
