-- Lista inicial: 10 restaurantes reais de São Paulo (endereços conferidos em
-- Guia Michelin, Guia da Semana, BaresSP e prefeitura em 14/11/2026).
-- Entram SEM nota: as notas vêm só de avaliações de verdade dos usuários.
-- Preço ($ a $$$$) é estimativa inicial; quem usa o app pode corrigir depois.
INSERT INTO restaurants (id, name, address, neighborhood, city, cuisine_id, price_level)
SELECT gen_random_uuid()::text, v.name, v.address, v.neighborhood, 'São Paulo', c.id, v.price
FROM (VALUES
  ('Mocotó',                'Av. Nossa Senhora do Loreto, 1100', 'Vila Medeiros',  'brasileira',   2),
  ('A Casa do Porco',       'R. Araújo, 124',                    'República',      'brasileira',   3),
  ('Bar da Dona Onça',      'Av. Ipiranga, 200 (Edifício Copan)', 'Centro',        'bar',          3),
  ('Famiglia Mancini',      'R. Avanhandava, 81',                'Bela Vista',     'italiana',     3),
  ('Consulado Mineiro',     'Praça Benedito Calixto, 74',        'Pinheiros',      'brasileira',   2),
  ('Bráz Pizzaria',         'R. Graúna, 125',                    'Moema',          'pizzaria',     3),
  ('Arábia',                'R. Haddock Lobo, 1397',             'Jardins',        'arabe',        3),
  ('Bar do Luiz Fernandes', 'R. Augusto Tolle, 610',             'Mandaqui',       'boteco',       2),
  ('Aizomê',                'Al. Fernão Cardim, 39',             'Jardim Paulista','japonesa',     4),
  ('Coffee Lab',            'R. Fradique Coutinho, 1340',        'Vila Madalena',  'cafeteria',    2)
) AS v(name, address, neighborhood, cuisine_slug, price)
JOIN cuisines c ON c.slug = v.cuisine_slug
WHERE NOT EXISTS (
  SELECT 1 FROM restaurants r WHERE lower(r.name) = lower(v.name) AND r.city = 'São Paulo'
);
