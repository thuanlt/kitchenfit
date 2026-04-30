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
  isLoading: boolean;
  error: string | null;

  // Actions
  setPlan: (weekStart: string, days: PlanDay[]) => void;
  clearPlan: () => void;
  swapMeal: (dayOffset: number, mealKey: 'breakfast' | 'lunch' | 'dinner', meal: PlanMeal) => void;
  loadPlanFromDB: (weekStart?: string) => Promise<void>;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
          weekStart: null,
          days: [],
          createdAt: null,
          isLoading: false,
          error: null,

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

            loadPlanFromDB: async (weekStart) => {
              set({ isLoading: true, error: null });
              try {
                const accessToken = localStorage.getItem('access_token');
                if (!accessToken) {
                  set({ isLoading: false, error: 'Not authenticated' });
                  return;
                }

                const url = weekStart 
                  ? `/api/plan?week_start=${weekStart}`
                  : '/api/plan';

                const response = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error?.message || 'Failed to load plan');
                }

                const { data } = await response.json();
          
                if (data && data.days) {
                  set({
                    weekStart: data.week_start,
                    days: data.days,
                    createdAt: data.created_at,
                    isLoading: false,
                    error: null,
                  });
                } else {
                  // No plan found, keep current state
                  set({ isLoading: false, error: null });
                }
              } catch (err) {
                console.error('Failed to load plan from DB:', err);
                set({
                  isLoading: false,
                  error: err instanceof Error ? err.message : 'Failed to load plan',
                });
              }
            },
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