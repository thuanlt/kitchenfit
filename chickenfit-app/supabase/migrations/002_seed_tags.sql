-- ============================================
-- Seed tags for recipe categorization
-- ============================================
INSERT INTO tags (slug, label) VALUES
  ('burn', 'Giảm mỡ'),
  ('build', 'Tăng cơ'),
  ('maintain', 'Duy trì'),
  ('smoothie', 'Sinh tố'),
  ('meal-prep', 'Meal prep'),
  ('under-15', '<15 phút'),
  ('grilled', 'Nướng'),
  ('steamed', 'Hấp'),
  ('stewed', 'Hầm'),
  ('pan-fried', 'Áp chảo'),
  ('bowl', 'Bowl'),
  ('salad', 'Salad'),
  ('soup', 'Canh/Súp'),
  ('wrap', 'Wrap/Cuộn'),
  ('stir-fried', 'Xào')
ON CONFLICT (slug) DO NOTHING;