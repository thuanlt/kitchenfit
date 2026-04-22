import type { UserProfile, Goal } from "./profile";

export interface Macros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export function calcMacros(profile: UserProfile): Macros {
  const { tdee, weight, goal } = profile;

  const proteinG = Math.round(weight * (goal === "cut" ? 2.2 : goal === "bulk" ? 2.0 : 1.8));
  const fatG = Math.round(weight * (goal === "cut" ? 0.8 : goal === "bulk" ? 1.0 : 0.9));
  const carbG = Math.round((tdee - proteinG * 4 - fatG * 9) / 4);

  return { kcal: tdee, protein: proteinG, carb: Math.max(carbG, 0), fat: fatG };
}

export const GOAL_LABEL: Record<Goal, string> = {
  cut: "🔥 Giảm mỡ",
  maintain: "⚖️ Duy trì",
  bulk: "💪 Tăng cơ",
};
