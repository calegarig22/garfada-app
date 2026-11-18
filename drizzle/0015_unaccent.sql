-- unaccent: compara textos ignorando acentos ("Aizomê" = "aizome").
-- Usada para achar restaurante repetido no cadastro.
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
-- Versão "imutável" (o Postgres exige isso para usar em índice).
CREATE OR REPLACE FUNCTION garfada_norm(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT trim(regexp_replace(
    regexp_replace(lower(public.unaccent('public.unaccent', coalesce(t, ''))),
                   '^(restaurante|bar|pizzaria|lanchonete|padaria|cafe|cafeteria|boteco)\s+(do|da|de|dos|das)?\s*', ''),
    '[^a-z0-9]+', ' ', 'g'))
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS restaurants_name_norm_trgm_idx ON restaurants USING gin (garfada_norm(name) gin_trgm_ops);
