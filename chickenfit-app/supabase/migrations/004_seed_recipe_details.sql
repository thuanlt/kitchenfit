-- Seed Recipe Ingredients, Steps, and Tags

INSERT INTO recipe_ingredients (recipe_id, name, amount, order_num) VALUES
  (1, 'Uc ga', '150g', 0),
  (1, 'Rau xa lach', '100g', 1),
  (1, 'Dua chuot', '50g', 2),
  (1, 'Ca chua', '50g', 3),
  (1, 'Nuoc chanh', '1 thia', 4);

INSERT INTO recipe_steps (recipe_id, step_num, description) VALUES
  (1, 1, 'Luoc uc ga va thai lat'),
  (1, 2, 'Rua sach rau cu'),
  (1, 3, 'Tron tat ca voi nuoc chanh');

INSERT INTO recipe_tags (recipe_id, tag_id) VALUES
  (1, 1), (1, 2), (2, 1), (2, 3), (3, 4), (3, 1), (4, 1), (4, 6), (5, 1), (5, 5);