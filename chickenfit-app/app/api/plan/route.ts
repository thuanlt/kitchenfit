import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db-server';
import { getUserId } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const weekStart = searchParams.get('week_start');

    let query = supabaseAdmin
      .from('meal_plans')
      .select(`
        id,
        week_start,
        is_active,
        created_at,
        meal_plan_items (
          day_offset,
          meal_type,
          recipe_id,
          recipes (
            id,
            name_vi,
            emoji,
            calories,
            protein_g,
            carbs_g,
            fat_g
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (weekStart) {
      query = query.eq('week_start', weekStart);
    } else {
      // Get the most recent active plan
      query = query.eq('is_active', true).limit(1);
    }

    const { data: plans, error: plansError } = await query;

    if (plansError) {
      return NextResponse.json(
        { error: { code: 'FETCH_PLANS_FAILED', message: plansError.message, status: 500 } },
        { status: 500 }
      );
    }

    if (!plans || plans.length === 0) {
      return NextResponse.json({ data: null });
    }

    const plan = plans[0];
    const items = plan.meal_plan_items || [];

    // Group items by day_offset and meal_type
    const daysMap = new Map<number, any>();
    const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    items.forEach((item: any) => {
      if (!daysMap.has(item.day_offset)) {
        daysMap.set(item.day_offset, {
          day_offset: item.day_offset,
          day_label: DAY_LABELS[item.day_offset] || `Day ${item.day_offset}`,
          breakfast: null,
          lunch: null,
          dinner: null,
          total_calories: 0,
        });
      }

      const day = daysMap.get(item.day_offset);
      const recipe = item.recipes;
      if (recipe) {
        const meal = {
          recipe_id: recipe.id,
          name: recipe.name_vi,
          emoji: recipe.emoji,
          calories: recipe.calories,
          protein_g: recipe.protein_g || 0,
          carbs_g: recipe.carbs_g || 0,
          fat_g: recipe.fat_g || 0,
        };
        day[item.meal_type] = meal;
        day.total_calories += recipe.calories;
      }
    });

    const days = Array.from(daysMap.values()).sort((a, b) => a.day_offset - b.day_offset);

    return NextResponse.json({
      data: {
        plan_id: plan.id,
        week_start: plan.week_start,
        is_active: plan.is_active,
        created_at: plan.created_at,
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}