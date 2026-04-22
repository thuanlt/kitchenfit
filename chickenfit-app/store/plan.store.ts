import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlanMeal {
  recipe_id: number;
  name: string;
  emoji: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface PlanDay {
  day_offset: number;
  day_label: string;
  breakfast: PlanMeal | null;
  lunch: PlanMeal | null;
  dinner: PlanMeal | null;
  total_calories: number;
}

export interface PlanState {
  weekStart: string | null;
  days: PlanDay[];
  createdAt: string | null;

  // Actions
  setPlan: (weekStart: string, days: PlanDay[]) => void;
  clearPlan: () => void;
  swapMeal: (dayOffset: number, mealKey: 'breakfast' | 'lunch' | 'dinner', meal: PlanMeal) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      weekStart: null,
      days: [],
      createdAt: null,

      setPlan: (weekStart, days) =>
        set({ weekStart, days, createdAt: new Date().toISOString() }),

      clearPlan: () =>
        set({ weekStart: null, days: [], createdAt: null }),

      swapMeal: (dayOffset, mealKey, meal) =>
        set((state) => ({
          days: state.days.map((day) =>
            day.day_offset === dayOffset
              ? { ...day, [mealKey]: meal, total_calories: calculateTotalCalories(day, mealKey, meal) }
              : day
          ),
        })),
    }),
    {
      name: 'chickenfit-plan-store',
    }
  )
);

function calculateTotalCalories(
  day: PlanDay,
  mealKey: 'breakfast' | 'lunch' | 'dinner',
  newMeal: PlanMeal
): number {
  const meals = { breakfast: day.breakfast, lunch: day.lunch, dinner: day.dinner };
  meals[mealKey] = newMeal;
  
  return (
    (meals.breakfast?.calories ?? 0) +
    (meals.lunch?.calories ?? 0) +
    (meals.dinner?.calories ?? 0)
  );
}