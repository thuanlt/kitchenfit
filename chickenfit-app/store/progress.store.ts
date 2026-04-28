import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WeightEntry {
  id?: string;
  date: string;
  weight: number;
  note?: string;
}

export interface DiaryEntry {
  id?: string;
  date: string;
  meal_type: string;
  recipe_id: number;
  recipe_name: string;
  recipe_emoji: string;
  amount_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// Water tracking interfaces
export interface WaterEntry {
  id?: string;
  date: string;
  amount_ml: number;
  timestamp: number;
}

// Shopping list interfaces
export interface ShoppingItem {
  id?: string;
  name: string;
  amount: string;
  unit: string;
  category: 'protein' | 'vegetable' | 'fruit' | 'grain' | 'dairy' | 'spice' | 'other';
  checked: boolean;
  recipe_id?: number;
}

export interface ProgressState {
  weightLog: WeightEntry[];
  diary: Record<string, DiaryEntry[]>;
  waterLog: Record<string, WaterEntry[]>;
  shoppingList: ShoppingItem[];
  dailyWaterGoal: number;

  // Actions
  addWeight: (entry: WeightEntry) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  removeDiaryEntry: (date: string, entryId: string) => void;
  getDiaryForDate: (date: string) => DiaryEntry[];
  getDiaryTotals: (date: string) => { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  
  // Water tracking actions
  addWater: (amount_ml: number, date?: string) => void;
  removeWater: (date: string, entryId: string) => void;
  getWaterForDate: (date: string) => WaterEntry[];
  getWaterTotalForDate: (date: string) => number;
  setDailyWaterGoal: (goal_ml: number) => void;
  
  // Shopping list actions
  addShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void;
  removeShoppingItem: (itemId: string) => void;
  toggleShoppingItem: (itemId: string) => void;
  clearCheckedItems: () => void;
  generateShoppingListFromRecipes: (recipeIds: number[]) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weightLog: [],
      diary: {},
      waterLog: {},
      shoppingList: [],
      dailyWaterGoal: 2000,

      addWeight: (entry) =>
        set((state) => {
          const filtered = state.weightLog.filter(w => w.date !== entry.date);
          return { weightLog: [entry, ...filtered].slice(0, 30) };
        }),

      addDiaryEntry: (entry) =>
        set((state) => {
          const dayEntries = state.diary[entry.date] ?? [];
          return {
            diary: {
              ...state.diary,
              [entry.date]: [...dayEntries, entry],
            },
          };
        }),

      removeDiaryEntry: (date, entryId) =>
        set((state) => {
          const dayEntries = (state.diary[date] ?? []).filter(e => e.id !== entryId);
          return {
            diary: {
              ...state.diary,
              [date]: dayEntries,
            },
          };
        }),

      getDiaryForDate: (date) => get().diary[date] ?? [],

      getDiaryTotals: (date) => {
        const entries = get().diary[date] ?? [];
        return entries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein_g: acc.protein_g + e.protein_g,
            carbs_g: acc.carbs_g + e.carbs_g,
            fat_g: acc.fat_g + e.fat_g,
          }),
          { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
        );
      },

      // Water tracking implementations
      addWater: (amount_ml, date = new Date().toISOString().slice(0, 10)) =>
        set((state) => {
          const dayEntries = state.waterLog[date] ?? [];
          const newEntry: WaterEntry = {
            id: `water-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date,
            amount_ml,
            timestamp: Date.now(),
          };
          return {
            waterLog: {
              ...state.waterLog,
              [date]: [...dayEntries, newEntry],
            },
          };
        }),

      removeWater: (date, entryId) =>
        set((state) => {
          const dayEntries = (state.waterLog[date] ?? []).filter(e => e.id !== entryId);
          return {
            waterLog: {
              ...state.waterLog,
              [date]: dayEntries,
            },
          };
        }),

      getWaterForDate: (date) => get().waterLog[date] ?? [],

      getWaterTotalForDate: (date) => {
        const entries = get().waterLog[date] ?? [];
        return entries.reduce((sum, entry) => sum + entry.amount_ml, 0);
      },

      setDailyWaterGoal: (goal_ml) => set({ dailyWaterGoal: goal_ml }),

      // Shopping list implementations
      addShoppingItem: (item) =>
        set((state) => {
          const newItem: ShoppingItem = {
            ...item,
            id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
          return { shoppingList: [...state.shoppingList, newItem] };
        }),

      removeShoppingItem: (itemId) =>
        set((state) => ({
          shoppingList: state.shoppingList.filter(item => item.id !== itemId),
        })),

      toggleShoppingItem: (itemId) =>
        set((state) => ({
          shoppingList: state.shoppingList.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        })),

      clearCheckedItems: () =>
        set((state) => ({
          shoppingList: state.shoppingList.filter(item => !item.checked),
        })),

      generateShoppingListFromRecipes: (recipeIds) => {
        // This would typically fetch recipe details and generate ingredients
        // For now, it's a placeholder implementation
        console.log('Generating shopping list for recipes:', recipeIds);
      },
    }),
    {
      name: 'chickenfit-progress-store',
    }
  )
);
