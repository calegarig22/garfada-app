-- Liga a extensão pg_trgm (grátis, já vem no Postgres da Neon).
-- Ela mede o quanto dois textos se parecem: "Sushi Kaze" x "Sushi Kaze Batel".
-- Usamos para avisar sobre restaurante duplicado no cadastro.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
