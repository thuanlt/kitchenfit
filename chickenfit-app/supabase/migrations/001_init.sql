-- ============================================
-- ChickenFit Database Schema v1.0
-- Migration: 001_init.sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- RECIPES
-- ============================================
CREATE TABLE recipes (
  id          SERIAL PRIMARY KEY,
  name_vi     TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL CHECK (type IN ('food','smoothie')),
  goal        TEXT NOT NULL CHECK (goal IN ('burn','build','maintain','all')),
  goal_label  TEXT NOT NULL,
  calories    INTEGER NOT NULL,
  protein_g   DECIMAL(5,1) NOT NULL,
  carbs_g     DECIMAL(5,1) NOT NULL,
  fat_g       DECIMAL(5,1) NOT NULL,
  prep_time   INTEGER NOT NULL DEFAULT 0,
  bg_color    TEXT NOT NULL DEFAULT '#FAF0E2',
  health_note TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipe_ingredients (
  id          SERIAL PRIMARY KEY,
  recipe_id   INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  amount      TEXT NOT NULL,
  order_num   INTEGER DEFAULT 0
);

CREATE TABLE recipe_steps (
  id          SERIAL PRIMARY KEY,
  recipe_id   INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  step_num    INTEGER NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE tags (
  id    SERIAL PRIMARY KEY,
  slug  TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE recipe_tags (
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id    INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Full-text search index
CREATE INDEX recipes_fts ON recipes
  USING gin(to_tsvector('simple', name_vi));

CREATE INDEX recipes_goal_idx ON recipes(goal);
CREATE INDEX recipes_type_idx ON recipes(type);

-- ============================================
-- PROFILES (1:1 with auth.users)
-- ============================================
CREATE TABLE profiles (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  gender          TEXT CHECK (gender IN ('male','female','other')),
  age             INTEGER,
  weight_kg       DECIMAL(5,1),
  height_cm       DECIMAL(5,1),
  activity        TEXT CHECK (activity IN ('sedentary','light','moderate','active','very_active')),
  goal            TEXT CHECK (goal IN ('burn','build','maintain')),
  tdee            INTEGER,
  onboarding_done BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- WEIGHT LOGS
-- ============================================
CREATE TABLE weight_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   DECIMAL(5,1) NOT NULL CHECK (weight_kg >= 20 AND weight_kg <= 300),
  note        TEXT,
  UNIQUE (user_id, logged_at)
);

CREATE INDEX weight_logs_user_date ON weight_logs (user_id, logged_at DESC);

-- ============================================
-- MEAL PLANS
-- ============================================
CREATE TABLE meal_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start    DATE NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  generated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE TABLE meal_plan_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  day_offset  INTEGER NOT NULL CHECK (day_offset BETWEEN 0 AND 6),
  meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  recipe_id   INTEGER REFERENCES recipes(id),
  custom_note TEXT,
  UNIQUE (plan_id, day_offset, meal_type)
);

-- ============================================
-- DIARY ENTRIES
-- ============================================
CREATE TABLE diary_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type   TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','other')),
  recipe_id   INTEGER REFERENCES recipes(id),
  amount_g    INTEGER DEFAULT 100,
  calories    INTEGER,
  protein_g   DECIMAL(5,1),
  carbs_g     DECIMAL(5,1),
  fat_g       DECIMAL(5,1),
  logged_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX diary_user_date ON diary_entries (user_id, entry_date DESC);

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  platform    TEXT CHECK (platform IN ('web','ios','android')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Recipes: public read, admin write
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "recipes_public_read" ON recipes FOR SELECT USING (true);
CREATE POLICY "ri_public_read" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "rs_public_read" ON recipe_steps FOR SELECT USING (true);
CREATE POLICY "rt_public_read" ON recipe_tags FOR SELECT USING (true);
CREATE POLICY "tags_public_read" ON tags FOR SELECT USING (true);

-- Admin write policies (service role only)
CREATE POLICY "recipes_admin_write" ON recipes FOR ALL USING (auth.jwt()->>'role'='service_role');
CREATE POLICY "ri_admin_write" ON recipe_ingredients FOR ALL USING (auth.jwt()->>'role'='service_role');
CREATE POLICY "rs_admin_write" ON recipe_steps FOR ALL USING (auth.jwt()->>'role'='service_role');
CREATE POLICY "rt_admin_write" ON recipe_tags FOR ALL USING (auth.jwt()->>'role'='service_role');
CREATE POLICY "tags_admin_write" ON tags FOR ALL USING (auth.jwt()->>'role'='service_role');

-- User own-data policies
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "weight_logs_own" ON weight_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "meal_plans_own" ON meal_plans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "mpi_own" ON meal_plan_items FOR ALL USING (
  plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid())
);
CREATE POLICY "diary_own" ON diary_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "push_own" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();