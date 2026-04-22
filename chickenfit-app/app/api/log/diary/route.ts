import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db-server';
import { getUserId } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const { data: entries, error } = await supabaseAdmin
      .from('diary_entries')
      .select('*, recipes(id, name_vi, emoji, calories, protein_g, carbs_g, fat_g)')
      .eq('user_id', userId)
      .eq('entry_date', date)
      .order('logged_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    const totals = (entries ?? []).reduce(
      (acc: { calories: number; protein_g: number; carbs_g: number; fat_g: number }, e: any) => ({
        calories: acc.calories + (e.calories ?? 0),
        protein_g: acc.protein_g + (e.protein_g ?? 0),
        carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
        fat_g: acc.fat_g + (e.fat_g ?? 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    return NextResponse.json({ data: entries ?? [], totals, date });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const recipeId = parseInt(body.recipe_id);

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_RECIPE', message: 'Valid recipe_id is required', status: 400 } },
        { status: 400 }
      );
    }

    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .select('calories, protein_g, carbs_g, fat_g')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found', status: 404 } },
        { status: 404 }
      );
    }

    const amountG = body.amount_g ?? 100;
    const ratio = amountG / 100;

    const { data: entry, error } = await supabaseAdmin
      .from('diary_entries')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        meal_type: body.meal_type ?? 'other',
        amount_g: amountG,
        entry_date: body.entry_date ?? new Date().toISOString().split('T')[0],
        calories: Math.round(recipe.calories * ratio),
        protein_g: Math.round(recipe.protein_g * ratio * 10) / 10,
        carbs_g: Math.round(recipe.carbs_g * ratio * 10) / 10,
        fat_g: Math.round(recipe.fat_g * ratio * 10) / 10,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'INSERT_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const entryId = request.nextUrl.searchParams.get('id');
    if (!entryId) {
      return NextResponse.json(
        { error: { code: 'MISSING_ID', message: 'Entry ID is required', status: 400 } },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('diary_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}
