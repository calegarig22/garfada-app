-- Mais 41 restaurantes reais de São Paulo para inspirar.
-- Endereço e posição no mapa: OpenStreetMap (© colaboradores do OpenStreetMap, ODbL),
-- conferidos em 14/11/2026 (descartados os que não batiam). Preço ($ a $$$$) é estimativa.
-- Entram SEM nota: notas só vêm de avaliações de verdade.
INSERT INTO restaurants (id, name, address, neighborhood, city, cuisine_id, price_level, latitude, longitude)
SELECT gen_random_uuid()::text, v.name, v.address, v.neighborhood, 'São Paulo', c.id, v.price, v.lat, v.lng
FROM (VALUES
  ('Lamen Kazu', 'R. Thomáz Gonzaga, 51', 'Liberdade', 'japonesa', 2, -23.557680, -46.635899),
  ('Aska Lamen', 'R. Galvão Bueno, 466', 'Liberdade', 'japonesa', 2, -23.559784, -46.635070),
  ('Izakaya Matsu', 'Av. Pedroso de Morais, 403', 'Pinheiros', 'japonesa', 3, -23.566364, -46.689774),
  ('Chi Fu', 'R. Doutor Rodrigo Silva, 200', 'Liberdade', 'chinesa', 2, -23.554388, -46.636018),
  ('Rong He', 'R. da Glória, 622', 'Liberdade', 'chinesa', 2, -23.558836, -46.634172),
  ('Komah', 'R. Cônego Vicente Miguel Marino', 'Barra Funda', 'coreana', 3, -23.526681, -46.651848),
  ('Tappo Trattoria', 'R. da Consolação, 2967', 'Cerqueira César', 'italiana', 3, -23.558965, -46.666325),
  ('Jardim de Napoli', 'R. Martinico Prado, 463', 'Higienópolis', 'italiana', 3, -23.542710, -46.655546),
  ('Leggera Pizza Napoletana', 'R. Diana, 80', 'Pompéia', 'pizzaria', 3, -23.529185, -46.678998),
  ('1900 Pizzeria', 'Al. dos Nhambiquaras, 573', 'Moema', 'pizzaria', 3, -23.604932, -46.657035),
  ('Z Deli Sandwich Shop', 'R. Francisco Leitão, 16', 'Pinheiros', 'hamburgueria', 2, -23.564099, -46.679102),
  ('Lanchonete da Cidade', 'Av. Macuco, 355', 'Moema', 'hamburgueria', 2, -23.603162, -46.667094),
  ('Rinconcito Peruano', 'R. Aurora, 443', 'Santa Ifigênia', 'peruana', 2, -23.540250, -46.640501),
  ('Maní', 'R. Joaquim Antunes, 210', 'Jardim Europa', 'brasileira', 4, -23.566380, -46.679729),
  ('D.O.M.', 'R. Barão de Capanema, 549', 'Cerqueira César', 'brasileira', 4, -23.566221, -46.667476),
  ('Sujinho', 'R. da Consolação, 2078', 'Consolação', 'brasileira', 2, -23.553169, -46.660156),
  ('Bolinha', 'Av. Cidade Jardim', 'Jardim Europa', 'brasileira', 3, -23.578701, -46.681512),
  ('Bar Brahma', 'Av. São João, 665', 'República', 'bar', 3, -23.542335, -46.640595),
  ('Pirajá', 'Av. Brigadeiro Faria Lima, 64', 'Pinheiros', 'boteco', 2, -23.559984, -46.696433),
  ('São Cristóvão', 'R. Wisard, 161', 'Vila Madalena', 'boteco', 2, -23.554899, -46.688780),
  ('Bar do Mané', 'Mercado Municipal (R. da Cantareira, 306)', 'Centro', 'boteco', 2, -23.541487, -46.629600),
  ('Padoca do Maní', 'R. Joaquim Antunes, 138', 'Jardim Europa', 'padaria', 2, -23.566801, -46.679336),
  ('Ofner', 'R. Olívia Guedes Penteado, 375', 'Socorro', 'doceria', 2, -23.670064, -46.710857),
  ('Dengo', 'Av. Presidente Juscelino Kubitschek, 2401', 'Vila Olímpia', 'doceria', 2, -23.591121, -46.690039),
  ('Sofá Café', 'R. Jaguaribe', 'Higienópolis', 'cafeteria', 2, -23.541605, -46.650344),
  ('Café Girondino', 'R. Boa Vista, 365', 'Centro', 'cafeteria', 2, -23.544522, -46.634112),
  ('Banana Verde', 'R. Madalena', 'Vila Madalena', 'vegetariana', 2, -23.555536, -46.687627),
  ('Fogo de Chão', 'Av. Moreira Guimarães, 964', 'Moema', 'churrascaria', 4, -23.614197, -46.659210),
  ('Barbacoa', 'R. Heinrich Hertz', 'Brooklin', 'churrascaria', 4, -23.608765, -46.696445),
  ('Templo da Carne Marcos Bassi', 'R. Treze de Maio, 668', 'Bela Vista', 'churrascaria', 4, -23.559088, -46.646502),
  ('Gopala Hari', 'R. Antônio Carlos, 429', 'Consolação', 'indiana', 2, -23.555947, -46.658764),
  ('Esfiha Juventus', 'R. Visconde de Laguna, 152', 'Mooca', 'arabe', 2, -23.554435, -46.602804),
  ('Sí Señor', 'R. Carlos Escobar', 'Santana', 'mexicana', 2, -23.503238, -46.635038),
  ('Coco Bambu', 'Av. Brás Leme', 'Casa Verde', 'frutos-do-mar', 4, -23.512756, -46.653726),
  ('Cantina Roperto', 'R. Treze de Maio', 'Bela Vista', 'italiana', 3, -23.558809, -46.646529),
  ('A Figueira Rubaiyat', 'R. Haddock Lobo, 1738', 'Cerqueira César', 'churrascaria', 4, -23.565371, -46.669568),
  ('Meats', 'R. dos Pinheiros, 320', 'Pinheiros', 'hamburgueria', 2, -23.564881, -46.681310),
  ('The Fifties', 'Al. Santos, 1015', 'Cerqueira César', 'hamburgueria', 2, -23.566273, -46.652898),
  ('Feijoada da Lana', 'R. Aspicuelta, 421', 'Vila Madalena', 'brasileira', 2, -23.557606, -46.689361),
  ('Bar Original', 'R. Graúna, 137', 'Moema', 'boteco', 2, -23.600002, -46.672809),
  ('Casa Mathilde', 'Praça Antônio Prado, 76', 'Centro', 'doceria', 2, -23.545365, -46.634638)
) AS v(name, address, neighborhood, cuisine_slug, price, lat, lng)
JOIN cuisines c ON c.slug = v.cuisine_slug
WHERE NOT EXISTS (
  SELECT 1 FROM restaurants r WHERE garfada_norm(r.name) = garfada_norm(v.name) AND r.city = 'São Paulo'
);
