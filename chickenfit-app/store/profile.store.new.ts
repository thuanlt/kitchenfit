import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Goal, Gender, ActivityLevel } from '../lib/profile';

// Macro goals interface
export interface MacroGoals {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface ProfileState {
  // User data
  userId: string | null;
  email: string | null;
  fullName: string;
  goal: Goal | null;
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  activity: ActivityLevel | null;
  tdee: number;
  onboardingDone: boolean;

  // Macro goals
  macroGoals: MacroGoals;

  // Auth
  accessToken: string | null;

  // Actions
  setProfile: (profile: Partial<ProfileState>) => void;
  setAuth: (userId: string, email: string, accessToken: string) => void;
  logout: () => void;
  setMacroGoals: (goals: Partial<MacroGoals>) => void;
  calculateMacroGoals: () => void;
}

const initialState = {
  userId: null as string | null,
  email: null as string | null,
  fullName: '' as string,
  goal: null as Goal | null,
  gender: 'male' as Gender,
  age: 0,
  weight: 0,
  height: 0,
  activity: null as ActivityLevel | null,
  tdee: 0,
  onboardingDone: false,
  accessToken: null as string | null,
  macroGoals: {
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 25, // Default fiber goal
  } as MacroGoals,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProfile: (profile) =>
        set((state) => ({ ...state, ...profile })),

      setAuth: (userId, email, accessToken) =>
        set({ userId, email, accessToken }),

      logout: () =>
        set(initialState),

      setMacroGoals: (goals) =>
        set((state) => ({
          macroGoals: { ...state.macroGoals, ...goals },
        })),

      calculateMacroGoals: () => {
        const state = get();
        const { tdee, goal, weight } = state;
        
        if (!tdee || !goal) return;

        let proteinRatio = 0.3;
        let carbsRatio = 0.4;
        let fatRatio = 0.3;

        // Adjust ratios based on goal
        switch (goal) {
          case 'cut':
            proteinRatio = 0.4;
            carbsRatio = 0.3;
            fatRatio = 0.3;
            break;
          case 'bulk':
            proteinRatio = 0.25;
            carbsRatio = 0.5;
            fatRatio = 0.25;
            break;
          case 'maintain':
          default:
            proteinRatio = 0.3;
            carbsRatio = 0.4;
            fatRatio = 0.3;
            break;
        }

        const proteinCalories = tdee * proteinRatio;
        const carbsCalories = tdee * carbsRatio;
        const fatCalories = tdee * fatRatio;

        set({
          macroGoals: {
            protein_g: Math.round(proteinCalories / 4),
            carbs_g: Math.round(carbsCalories / 4),
            fat_g: Math.round(fatCalories / 9),
            fiber_g: 25 + Math.round(weight * 0.5), // Fiber based on weight
          },
        });
      },
    }),
    {
      name: 'chickenfit-profile-store',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // Migration from version 0 to 1: add fullName field
        if (version === 0) {
          return {
            ...persistedState,
            fullName: persistedState.fullName || '',
          };
        }
        // Migration from version 1 to 2: add macroGoals field
        if (version === 1) {
          return {
            ...persistedState,
            macroGoals: persistedState.macroGoals || {
              protein_g: 0,
              carbs_g: 0,
              fat_g: 0,
              fiber_g: 25,
            },
          };
        }
        return persistedState;
      },
    }
  )
);