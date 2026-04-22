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

export interface ProgressState {
  weightLog: WeightEntry[];
  diary: Record<string, DiaryEntry[]>;

  // Actions
  addWeight: (entry: WeightEntry) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  removeDiaryEntry: (date: string, entryId: string) => void;
  getDiaryForDate: (date: string) => DiaryEntry[];
  getDiaryTotals: (date: string) => { calories: number; protein_g: number; carbs_g: number; fat_g: number };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weightLog: [],
      diary: {},

      addWeight: (entry) =>
        set((state) => {
          // Replace if same date exists
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
    }),
    {
      name: 'chickenfit-progress-store',
    }
  )
);
