/**
 * Seed script: migrate 99 recipes from lib/recipes.ts → Supabase
 * Run: npx ts-node --skipProject --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/seed.ts
 */

// Bootstrap proxy for Node native fetch via undici
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProxyAgent, setGlobalDispatcher } = require('undici');
setGlobalDispatcher(new ProxyAgent('http://10.36.252.45:8080'));

import { createClient } from '@supabase/supabase-js';
import { DB } from '../lib/recipes';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GOAL_MAP: Record<string, string> = {
  'Tăng cơ': 'build',
  'Giảm mỡ': 'burn',
  'Duy trì': 'maintain',
  'Sinh tố': 'all',
};

const ALL_TAGS = ['Tăng cơ', 'Giảm mỡ', 'Duy trì', 'Sinh tố', 'Meal prep', '<15 phút', 'Nướng'];

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Insert tags
  console.log('📌 Inserting tags...');
  const { data: tags, error: tagsErr } = await supabase
    .from('tags')
    .upsert(
      ALL_TAGS.map((label) => ({ slug: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label })),
      { onConflict: 'slug' }
    )
    .select();

  if (tagsErr) { console.error('Tags error:', tagsErr.message); process.exit(1); }
  console.log(`  ✓ ${tags?.length} tags`);

  const tagMap = new Map(tags!.map((t) => [t.label, t.id]));

  // 2. Insert recipes in batches
  console.log('\n🍗 Inserting recipes...');
  const recipeRows = DB.map((r) => ({
    id: r.id + 1, // Supabase SERIAL starts at 1, but our data is 0-indexed
    name_vi: r.n,
    emoji: r.e,
    type: r.type,
    goal: GOAL_MAP[r.g] ?? 'all',
    goal_label: r.g,
    calories: r.cal,
    protein_g: r.p,
    carbs_g: r.c,
    fat_g: r.f,
    prep_time: r.t,
    bg_color: r.bg,
    health_note: r.health,
  }));

  const { data: insertedRecipes, error: recipesErr } = await supabase
    .from('recipes')
    .upsert(recipeRows, { onConflict: 'id' })
    .select('id');

  if (recipesErr) { console.error('Recipes error:', recipesErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedRecipes?.length} recipes`);

  // 3. Insert ingredients
  console.log('\n🥕 Inserting ingredients...');
  const ingredientRows = DB.flatMap((r) =>
    r.ing.map((ing, idx) => ({
      recipe_id: r.id + 1,
      name: ing.n,
      amount: ing.a,
      order_num: idx,
    }))
  );

  // Batch delete old ingredients then insert
  const recipeIds = DB.map((r) => r.id + 1);
  await supabase.from('recipe_ingredients').delete().in('recipe_id', recipeIds);

  const BATCH = 100;
  for (let i = 0; i < ingredientRows.length; i += BATCH) {
    const { error } = await supabase.from('recipe_ingredients').insert(ingredientRows.slice(i, i + BATCH));
    if (error) { console.error('Ingredients error:', error.message); process.exit(1); }
  }
  console.log(`  ✓ ${ingredientRows.length} ingredients`);

  // 4. Insert steps
  console.log('\n📋 Inserting steps...');
  const stepRows = DB.flatMap((r) =>
    r.steps.map((desc, idx) => ({
      recipe_id: r.id + 1,
      step_num: idx + 1,
      description: desc,
    }))
  );

  await supabase.from('recipe_steps').delete().in('recipe_id', recipeIds);

  for (let i = 0; i < stepRows.length; i += BATCH) {
    const { error } = await supabase.from('recipe_steps').insert(stepRows.slice(i, i + BATCH));
    if (error) { console.error('Steps error:', error.message); process.exit(1); }
  }
  console.log(`  ✓ ${stepRows.length} steps`);

  // 5. Insert recipe_tags
  console.log('\n🏷️  Inserting recipe tags...');
  const recipeTagRows = DB.flatMap((r) =>
    r.tags
      .filter((tag) => tagMap.has(tag))
      .map((tag) => ({ recipe_id: r.id + 1, tag_id: tagMap.get(tag)! }))
  );

  await supabase.from('recipe_tags').delete().in('recipe_id', recipeIds);

  for (let i = 0; i < recipeTagRows.length; i += BATCH) {
    const { error } = await supabase.from('recipe_tags').insert(recipeTagRows.slice(i, i + BATCH));
    if (error) { console.error('Recipe tags error:', error.message); process.exit(1); }
  }
  console.log(`  ✓ ${recipeTagRows.length} recipe-tag links`);

  console.log('\n✅ Seed complete!\n');
  console.log(`  Tags:          ${tags?.length}`);
  console.log(`  Recipes:       ${insertedRecipes?.length}`);
  console.log(`  Ingredients:   ${ingredientRows.length}`);
  console.log(`  Steps:         ${stepRows.length}`);
  console.log(`  Recipe-tags:   ${recipeTagRows.length}`);
}

seed().catch((err) => { console.error(err); process.exit(1); });
