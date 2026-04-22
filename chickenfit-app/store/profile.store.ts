import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, Gender, ActivityLevel } from '../lib/profile';

export interface ProfileState {
  // User data
  userId: string | null;
  email: string | null;
  goal: Goal | null;
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  activity: ActivityLevel | null;
  tdee: number;
  onboardingDone: boolean;

  // Auth
  accessToken: string | null;

  // Actions
  setProfile: (profile: Partial<ProfileState>) => void;
  setAuth: (userId: string, email: string, accessToken: string) => void;
  logout: () => void;
}

const initialState = {
  userId: null as string | null,
  email: null as string | null,
  goal: null as Goal | null,
  gender: 'male' as Gender,
  age: 0,
  weight: 0,
  height: 0,
  activity: null as ActivityLevel | null,
  tdee: 0,
  onboardingDone: false,
  accessToken: null as string | null,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) =>
        set((state) => ({ ...state, ...profile })),

      setAuth: (userId, email, accessToken) =>
        set({ userId, email, accessToken }),

      logout: () =>
        set(initialState),
    }),
    {
      name: 'chickenfit-profile-store',
    }
  )
);
