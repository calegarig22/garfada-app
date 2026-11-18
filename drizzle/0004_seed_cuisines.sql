-- Lista inicial de tipos de comida. Dá para acrescentar mais depois.
INSERT INTO cuisines (id, name, slug) VALUES
  (gen_random_uuid()::text, 'Brasileira', 'brasileira'),
  (gen_random_uuid()::text, 'Japonesa', 'japonesa'),
  (gen_random_uuid()::text, 'Italiana', 'italiana'),
  (gen_random_uuid()::text, 'Pizzaria', 'pizzaria'),
  (gen_random_uuid()::text, 'Hamburgueria', 'hamburgueria'),
  (gen_random_uuid()::text, 'Churrascaria', 'churrascaria'),
  (gen_random_uuid()::text, 'Árabe', 'arabe'),
  (gen_random_uuid()::text, 'Mexicana', 'mexicana'),
  (gen_random_uuid()::text, 'Chinesa', 'chinesa'),
  (gen_random_uuid()::text, 'Coreana', 'coreana'),
  (gen_random_uuid()::text, 'Tailandesa', 'tailandesa'),
  (gen_random_uuid()::text, 'Indiana', 'indiana'),
  (gen_random_uuid()::text, 'Peruana', 'peruana'),
  (gen_random_uuid()::text, 'Frutos do mar', 'frutos-do-mar'),
  (gen_random_uuid()::text, 'Vegetariana', 'vegetariana'),
  (gen_random_uuid()::text, 'Cafeteria', 'cafeteria'),
  (gen_random_uuid()::text, 'Padaria', 'padaria'),
  (gen_random_uuid()::text, 'Doceria', 'doceria'),
  (gen_random_uuid()::text, 'Bar', 'bar'),
  (gen_random_uuid()::text, 'Boteco', 'boteco')
ON CONFLICT (slug) DO NOTHING;
