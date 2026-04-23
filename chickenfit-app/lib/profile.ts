export type Goal = "cut" | "maintain" | "bulk";
export type Gender = "male" | "female";
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export interface UserProfile {
  goal: Goal;
  gender: Gender;
  age: number;
  weight: number; // kg
  height: number; // cm
  activity: ActivityLevel;
  tdee: number;
  onboardingDone: boolean;
}

const GOAL_DELTA: Record<Goal, number> = {
  cut: -300,
  maintain: 0,
  bulk: 300,
};

export function calcTDEE(profile: Omit<UserProfile, "tdee" | "onboardingDone">): number {
  const { gender, age, weight, height, activity, goal } = profile;
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  return Math.round(bmr * activity + GOAL_DELTA[goal]);
}

const STORAGE_KEY = "chickenfit_profile";

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export function isOnboardingDone(): boolean {
  return loadProfile()?.onboardingDone === true;
}

// Conversion helpers for store compatibility
export const GOAL_TO_DB: Record<"burn" | "build" | "maintain", Goal> = {
  burn: "cut",
  build: "bulk",
  maintain: "maintain",
};

export const GOAL_FROM_DB: Record<Goal, "burn" | "build" | "maintain"> = {
  cut: "burn",
  bulk: "build",
  maintain: "maintain",
};

export const ACT_TO_DB: Record<"sedentary" | "light" | "moderate" | "active" | "very_active", ActivityLevel> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACT_FROM_DB: Record<ActivityLevel, "sedentary" | "light" | "moderate" | "active" | "very_active"> = {
  1.2: "sedentary",
  1.375: "light",
  1.55: "moderate",
  1.725: "active",
  1.9: "very_active",
};
