-- Gatilho (trigger): toda vez que uma review é criada, editada ou apagada,
-- o próprio banco atualiza o placar do restaurante (rating_sum e rating_count).
-- Assim a nota média nunca fica desatualizada, mesmo se o app falhar no meio.
CREATE OR REPLACE FUNCTION update_restaurant_rating() RETURNS trigger AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE restaurants
       SET rating_sum = rating_sum - OLD.rating,
           rating_count = rating_count - 1
     WHERE id = OLD.restaurant_id;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE restaurants
       SET rating_sum = rating_sum + NEW.rating,
           rating_count = rating_count + 1
     WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER reviews_update_restaurant_rating
AFTER INSERT OR DELETE OR UPDATE OF rating, restaurant_id ON reviews
FOR EACH ROW EXECUTE FUNCTION update_restaurant_rating();
