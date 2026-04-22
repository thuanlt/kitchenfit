import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/db-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goal = searchParams.get('goal');
    const type = searchParams.get('type');
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 50);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('recipes')
      .select('id, name_vi, emoji, type, goal, goal_label, calories, protein_g, carbs_g, fat_g, prep_time, bg_color, health_note, image_url', { count: 'exact' })
      .range(from, to)
      .order('id', { ascending: true });

    if (goal && goal !== 'all') query = query.or(`goal.eq.${goal},goal.eq.all`);
    if (type && type !== 'all') query = query.eq('type', type);
    if (q) query = query.ilike('name_vi', `%${q}%`);

    const { data: recipes, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    let recipesWithTags = recipes ?? [];
    if (recipes && recipes.length > 0) {
      const recipeIds = recipes.map((r: any) => r.id);
      const { data: recipeTags } = await supabaseAdmin
        .from('recipe_tags')
        .select('recipe_id, tags(slug, label)')
        .in('recipe_id', recipeIds);

      const tagMap = new Map<number, { slug: string; label: string }[]>();
      (recipeTags ?? []).forEach((rt: { recipe_id: number; tags: { slug: string; label: string }[] }) => {
        if (!tagMap.has(rt.recipe_id)) tagMap.set(rt.recipe_id, []);
        tagMap.get(rt.recipe_id)!.push(...rt.tags);
      });

      recipesWithTags = recipes.map((r: any) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
    }

    return NextResponse.json({
      data: recipesWithTags,
      meta: { total: count ?? 0, page, limit, pages: Math.ceil((count ?? 0) / limit) },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}
