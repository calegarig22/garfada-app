-- Fotos ilustrativas por tipo de comida (Wikimedia Commons, uso livre com crédito).
-- Escolhidas e conferidas em 14/11/2026. Aparecem só em lugares sem foto própria.
UPDATE cuisines c SET photo_url = v.url, photo_credit = v.credit, photo_credit_url = v.page,
  photo_width = v.w, photo_height = v.h
FROM (VALUES
  ('brasileira', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Feijoada_%C3%A0_brasileira_1.jpg/1280px-Feijoada_%C3%A0_brasileira_1.jpg', 'Foto ilustrativa: Melsj · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3AFeijoada_%C3%A0_brasileira_1.jpg', 1280, 904),
  ('pizzaria', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Margherita_Originale.JPG/1280px-Margherita_Originale.JPG', 'Foto ilustrativa: Mario56 · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3AMargherita_Originale.JPG', 1280, 960),
  ('japonesa', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Sashimi_of_S%C3%A3o_Paulo.jpg/1280px-Sashimi_of_S%C3%A3o_Paulo.jpg', 'Foto ilustrativa: Wilfredor · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3ASashimi_of_S%C3%A3o_Paulo.jpg', 1280, 850),
  ('italiana', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/A_plate_of_red_sauce_pasta.jpg/1280px-A_plate_of_red_sauce_pasta.jpg', 'Foto ilustrativa: Rocky Masum · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3AA_plate_of_red_sauce_pasta.jpg', 1280, 853),
  ('arabe', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Homemade_hummus_and_pita_03.jpg/1280px-Homemade_hummus_and_pita_03.jpg', 'Foto ilustrativa: Satdeep Gill · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3AHomemade_hummus_and_pita_03.jpg', 1280, 960),
  ('cafeteria', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Latte_macchiato_with_coffee_beans.jpg/1280px-Latte_macchiato_with_coffee_beans.jpg', 'Foto ilustrativa: Aleph · CC BY-SA 2.5 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3ALatte_macchiato_with_coffee_beans.jpg', 1280, 1833),
  ('bar', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Cocktail_Caipirinha_raw.jpg/1280px-Cocktail_Caipirinha_raw.jpg', 'Foto ilustrativa: Christian · domínio público · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3ACocktail_Caipirinha_raw.jpg', 1280, 1606),
  ('boteco', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Coxinha_-_iguaria_brasileira_01.jpg/1280px-Coxinha_-_iguaria_brasileira_01.jpg', 'Foto ilustrativa: Sintegrity · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File%3ACoxinha_-_iguaria_brasileira_01.jpg', 1280, 1707)
) AS v(slug, url, credit, page, w, h)
WHERE c.slug = v.slug;
