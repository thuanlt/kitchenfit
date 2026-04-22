import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'MISSING_USER_ID', message: 'User ID is required', status: 400 } },
        { status: 400 }
      );
    }

    const { data: recipes, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: recipes || [] });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, calories, protein, carbs, fat, ingredients, instructions } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'User ID and name are required', status: 400 } },
        { status: 400 }
      );
    }

    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .insert({
        user_id: userId,
        name,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        ingredients: ingredients || '',
        instructions: instructions || '',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'CREATE_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: recipe }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}