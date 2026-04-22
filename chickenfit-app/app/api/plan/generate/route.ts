import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db-server';
import { getUserId } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('goal, tdee')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Complete onboarding first', status: 400 } },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const weekStart = body.week_start ?? getMonday(new Date());

    const { data: allRecipes } = await supabaseAdmin
      .from('recipes')
      .select('id, name_vi, emoji, calories, type, goal')
      .or(`goal.eq.${profile.goal},goal.eq.all`);

    const recipes = allRecipes ?? [];
    if (recipes.length < 7) {
      return NextResponse.json(
        { error: { code: 'NOT_ENOUGH_RECIPES', message: 'Not enough recipes for meal plan', status: 500 } },
        { status: 500 }
      );
    }

    const morningPool = recipes.filter((r: any) => r.type === 'smoothie' || r.calories < 300);
    const mainPool = recipes.filter((r: any) => r.type === 'food' && r.calories >= 200);
    const targetCal = profile.tdee ?? 2000;
    const usedBreakfast = new Set<number>();
    const days = [];

    for (let d = 0; d < 7; d++) {
      const breakfast = pickRandom(morningPool, usedBreakfast) as { id: number; calories: number } | null;
      if (breakfast) {
        usedBreakfast.add(breakfast.id);
        if (morningPool.length <= usedBreakfast.size) usedBreakfast.clear();
      }

      let lunch = pickRandom(mainPool, new Set()) as { id: number; calories: number } | null;
      let dinner = pickRandom(mainPool, new Set([lunch?.id ?? -1])) as { id: number; calories: number } | null;

      for (let retry = 0; retry < 5 && lunch && dinner; retry++) {
        const totalCal = (breakfast?.calories ?? 0) + lunch.calories + dinner.calories;
        if (Math.abs(totalCal - targetCal) <= 500) break;
        dinner = pickRandom(mainPool, new Set([lunch!.id])) as { id: number; calories: number } | null;
      }

      days.push({
        day_offset: d,
        meals: { breakfast, lunch, dinner },
        total_calories: (breakfast?.calories ?? 0) + (lunch?.calories ?? 0) + (dinner?.calories ?? 0),
      });
    }

    // Deactivate old plans
    await supabaseAdmin
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: plan, error: planError } = await supabaseAdmin
      .from('meal_plans')
      .insert({ user_id: userId, week_start: weekStart, is_active: true })
      .select()
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: { code: 'PLAN_CREATE_FAILED', message: planError?.message ?? 'Failed', status: 500 } },
        { status: 500 }
      );
    }

    const items = days.flatMap((d) =>
      Object.entries(d.meals)
        .filter(([, meal]) => meal !== null)
        .map(([mealType, meal]) => ({
          plan_id: plan.id,
          day_offset: d.day_offset,
          meal_type: mealType,
          recipe_id: (meal as { id: number }).id,
        }))
    );

    await supabaseAdmin.from('meal_plan_items').insert(items);

    return NextResponse.json({ data: { plan_id: plan.id, week_start: weekStart, days } });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}

function pickRandom<T extends { id: number }>(pool: T[], exclude: Set<number>): T | null {
  const filtered = pool.filter((r) => !exclude.has((r as { id: number }).id));
  const list = filtered.length > 0 ? filtered : pool;
  return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}
