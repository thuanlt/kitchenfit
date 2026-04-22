import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id);

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Recipe ID must be a number', status: 400 } },
        { status: 400 }
      );
    }

    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error || !recipe) {
      return NextResponse.json(
        { error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found', status: 404 } },
        { status: 404 }
      );
    }

    const [{ data: ingredients }, { data: steps }, { data: recipeTags }] = await Promise.all([
      supabaseAdmin
        .from('recipe_ingredients')
        .select('name, amount, order_num')
        .eq('recipe_id', recipeId)
        .order('order_num', { ascending: true }),
      supabaseAdmin
        .from('recipe_steps')
        .select('step_num, description')
        .eq('recipe_id', recipeId)
        .order('step_num', { ascending: true }),
      supabaseAdmin
        .from('recipe_tags')
        .select('tags(slug, label)')
        .eq('recipe_id', recipeId),
    ]);

    const tags = (recipeTags ?? []).flatMap(
      (rt: { tags: { slug: string; label: string }[] }) => rt.tags
    );

    return NextResponse.json({
      data: { ...recipe, ingredients: ingredients ?? [], steps: steps ?? [], tags },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}
