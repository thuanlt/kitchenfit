"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DB } from "../../lib/recipes";
import { usePlanStore, type PlanDay, type PlanMeal } from "../../store/plan.store";
import { useProfileStore } from "../../store/profile.store";

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MEAL_META = [
  { icon: "🌅", name: "Sáng", key: "breakfast" as const },
  { icon: "☀️", name: "Trưa", key: "lunch" as const },
  { icon: "🌙", name: "Tối",  key: "dinner" as const },
];

function getMonday(offset = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function getWeekDates(offset: number): Date[] {
  const mon = getMonday(offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildLocalPlan(goal: string | null): PlanDay[] {
  const goalMap: Record<string, string> = { build: "Tăng cơ", burn: "Giảm mỡ", maintain: "Duy trì" };
  const goalLabel = goalMap[goal ?? "build"] ?? "Tăng cơ";
  const foods = DB.filter((r) => r.type === "food" && (r.g === goalLabel || goalLabel === "Tăng cơ"));
  const smoothies = DB.filter((r) => r.type === "smoothie");
  const pool = foods.length >= 2 ? foods : DB.filter((r) => r.type === "food");

  return Array.from({ length: 7 }, (_, i) => {
    const lunch = pick(pool);
    let dinner = pick(pool);
    let tries = 0;
    while (dinner.id === lunch.id && tries++ < 5) dinner = pick(pool);
    const breakfast = pick(smoothies);

    const toMeal = (r: typeof DB[0]): PlanMeal => ({
      recipe_id: r.id,
      name: r.n,
      emoji: r.e,
      calories: r.cal,
      protein_g: r.p,
      carbs_g: r.c,
      fat_g: r.f,
    });

    const totalCal = breakfast.cal + lunch.cal + dinner.cal;
    return {
      day_offset: i,
      day_label: DAY_LABELS[i],
      breakfast: toMeal(breakfast),
      lunch: toMeal(lunch),
      dinner: toMeal(dinner),
      total_calories: totalCal,
    };
  });
}

type SwapTarget = { dayOffset: number; mealKey: "breakfast" | "lunch" | "dinner"; type: "food" | "smoothie" } | null;

export default function PlanPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [generating, setGenerating] = useState(false);
  const [swapTarget, setSwapTarget] = useState<SwapTarget>(null);

  const { weekStart, days, setPlan, swapMeal, loadPlanFromDB, isLoading } = usePlanStore();
  const { tdee, goal, accessToken } = useProfileStore();
  const calTarget = tdee || 2000;

  const weekDates = getWeekDates(weekOffset);
  const currentWeekStart = dateKey(getMonday(weekOffset));
  const isPlanWeek = weekStart === currentWeekStart;

  const weekLabel =
    weekOffset === 0 ? "Tuần này"
    : weekOffset < 0 ? `${Math.abs(weekOffset)} tuần trước`
    : `${weekOffset} tuần tới`;

  const today = dateKey(new Date());

  // Load plan from DB on mount
  useEffect(() => {
    if (accessToken && !weekStart) {
      loadPlanFromDB(currentWeekStart);
    }
  }, [accessToken, weekStart, currentWeekStart]);

  // Load plan when week changes
  useEffect(() => {
    if (accessToken && weekOffset !== 0) {
      const targetWeekStart = dateKey(getMonday(weekOffset));
      loadPlanFromDB(targetWeekStart);
    }
  }, [weekOffset, accessToken]);

  function shiftWeek(dir: number) {
    const newOffset = weekOffset + dir;
    setWeekOffset(newOffset);
    const newDates = getWeekDates(newOffset);
    if (!newDates.find((d) => dateKey(d) === selectedDay)) {
      setSelectedDay(dateKey(newDates[0]));
    }
  }

  async function generatePlan() {
    setGenerating(true);

    // Try API first if authenticated
    if (accessToken) {
      try {
        const res = await fetch("/api/plan/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ week_start: currentWeekStart }),
        });
        if (res.ok) {
          const { data } = await res.json();
          const apiDays: PlanDay[] = data.days.map((d: {
            day_offset: number;
            meals: { breakfast?: { id: number; name_vi: string; emoji: string; calories: number };
                     lunch?: { id: number; name_vi: string; emoji: string; calories: number };
                     dinner?: { id: number; name_vi: string; emoji: string; calories: number } };
            total_calories: number;
          }) => ({
            day_offset: d.day_offset,
            day_label: DAY_LABELS[d.day_offset],
            breakfast: d.meals.breakfast ? { recipe_id: d.meals.breakfast.id, name: d.meals.breakfast.name_vi, emoji: d.meals.breakfast.emoji, calories: d.meals.breakfast.calories, protein_g: 0, carbs_g: 0, fat_g: 0 } : null,
            lunch: d.meals.lunch ? { recipe_id: d.meals.lunch.id, name: d.meals.lunch.name_vi, emoji: d.meals.lunch.emoji, calories: d.meals.lunch.calories, protein_g: 0, carbs_g: 0, fat_g: 0 } : null,
            dinner: d.meals.dinner ? { recipe_id: d.meals.dinner.id, name: d.meals.dinner.name_vi, emoji: d.meals.dinner.emoji, calories: d.meals.dinner.calories, protein_g: 0, carbs_g: 0, fat_g: 0 } : null,
            total_calories: d.total_calories,
          }));
          setPlan(currentWeekStart, apiDays);
          setWeekOffset(0);
          setSelectedDay(today);
          setGenerating(false);
          return;
        }
      } catch { /* fallback to local */ }
    }

    // Local generation (no auth or API fail)
    await new Promise((r) => setTimeout(r, 800));
    const localDays = buildLocalPlan(goal);
    setPlan(currentWeekStart, localDays);
    setWeekOffset(0);
    setSelectedDay(today);
    setGenerating(false);
  }

  // Find selected day's plan
  const selectedOffset = weekDates.findIndex((d) => dateKey(d) === selectedDay);
  const dayPlan: PlanDay | null = isPlanWeek && selectedOffset >= 0 ? (days[selectedOffset] ?? null) : null;

  const totalCal = dayPlan?.total_calories ?? 0;
  const pct = Math.min(100, Math.round((totalCal / calTarget) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Header ── */}
      <div style={{ background: "var(--card)", borderBottom: "0.5px solid var(--sep)", padding: "14px 20px 10px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.3px" }}>Kế hoạch</h1>
        <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Meal plan 7 ngày</p>
      </div>

      {/* ── Week nav ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 8px", background: "var(--card)", borderBottom: "0.5px solid var(--sep)" }}>
        <button onClick={() => shiftWeek(-1)} style={{ fontSize: 26, color: "var(--primary)", cursor: "pointer", background: "none", border: "none", padding: "4px 10px", lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{weekLabel}</span>
        <button onClick={() => shiftWeek(1)} style={{ fontSize: 26, color: "var(--primary)", cursor: "pointer", background: "none", border: "none", padding: "4px 10px", lineHeight: 1 }}>›</button>
      </div>

      {/* ── Day strip ── */}
      <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "var(--card)", borderBottom: "0.5px solid var(--sep)", overflowX: "auto" }}>
        {weekDates.map((d, i) => {
          const key = dateKey(d);
          const isActive = key === selectedDay;
          const isToday = key === today;
          const hasPlan = isPlanWeek && !!days[i];
          return (
            <button key={key} onClick={() => setSelectedDay(key)} style={{
              flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "8px 12px", borderRadius: 14, cursor: "pointer", border: "none",
              background: isActive ? "var(--primary)" : "transparent", transition: "all .2s",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "rgba(255,255,255,.8)" : "var(--text2)" }}>
                {DAY_LABELS[i]}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: isActive ? "#fff" : isToday ? "var(--primary)" : "var(--text)" }}>
                {d.getDate()}
              </span>
              {hasPlan && (
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? "rgba(255,255,255,.7)" : "var(--primary)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Plan body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text2)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Đang tải kế hoạch...</p>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>Đang lấy dữ liệu từ máy chủ</p>
          </div>
        ) : !dayPlan ? (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text2)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Chưa có kế hoạch</p>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>Nhấn nút bên dưới để AI tạo<br />thực đơn cho cả tuần</p>
          </div>
        ) : (
          <>
            {MEAL_META.map((meta) => {
              const meal: PlanMeal | null = dayPlan[meta.key];
              if (!meal) return null;
              const recipeId = meal.recipe_id;
              const mealType = meta.key === "breakfast" ? "smoothie" : "food";
              return (
                <div key={meta.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      {meta.name}
                    </span>
                    <button
                      onClick={() => setSwapTarget({ dayOffset: dayPlan.day_offset, mealKey: meta.key, type: mealType })}
                      style={{ marginLeft: "auto", fontSize: 12, color: "var(--primary)", fontWeight: 700, background: "none", border: "1px solid var(--primary)", borderRadius: 8, padding: "2px 8px", cursor: "pointer" }}
                    >
                      Đổi
                    </button>
                  </div>
                  <Link href={`/recipes/${recipeId}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--sep)" }}>
                      <div style={{ width: 72, height: 72, background: "#FAF0E2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                        {meal.emoji}
                      </div>
                      <div style={{ flex: 1, padding: "0 4px" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{meal.name}</p>
                        {meal.protein_g > 0 && (
                          <p style={{ fontSize: 12, color: "var(--text2)" }}>P {meal.protein_g}g · C {meal.carbs_g}g · F {meal.fat_g}g</p>
                        )}
                      </div>
                      <span style={{ color: "#C7C7CC", fontSize: 20, paddingRight: 12 }}>›</span>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Day total */}
            <div style={{ background: "var(--card)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--sep)", marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Tổng calo</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>{totalCal} / {calTarget} kcal</span>
              </div>
              <div style={{ height: 8, background: "var(--sep)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: pct >= 90 ? "#4A7C59" : "var(--primary)", width: `${pct}%`, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
              </div>
              <p style={{ fontSize: 11, color: "var(--text2)", marginTop: 6, textAlign: "right" }}>{pct}% mục tiêu</p>
            </div>
          </>
        )}
      </div>

      {/* ── Generate button ── */}
      <div style={{ padding: "0 16px 16px" }}>
        <button onClick={generatePlan} disabled={generating} style={{
          width: "100%", background: generating ? "var(--text2)" : "var(--primary)",
          color: "#fff", border: "none", borderRadius: 14, padding: "15px",
          fontSize: 15, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity .15s",
        }}>
          {generating ? (
            <>
              <span style={{ display: "inline-block", animation: "spin .8s linear infinite" }}>⚙️</span>
              AI đang tạo kế hoạch...
            </>
          ) : (
            <>{dayPlan ? "✨ Tạo lại kế hoạch AI" : "✨ Tạo kế hoạch AI cho tuần này"}</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Swap Picker Bottom Sheet ── */}
      {swapTarget && (() => {
        const pool = DB.filter((r) => r.type === swapTarget.type);
        return (
          <>
            <div
              onClick={() => setSwapTarget(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100 }}
            />
            <div style={{
              position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: 430, background: "var(--card)",
              borderRadius: "20px 20px 0 0", zIndex: 101, maxHeight: "70vh",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "14px 20px 10px", borderBottom: "0.5px solid var(--sep)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Chọn món thay thế</span>
                <button onClick={() => setSwapTarget(null)} style={{ fontSize: 22, color: "var(--text2)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ overflowY: "auto", padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {pool.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      swapMeal(swapTarget.dayOffset, swapTarget.mealKey, {
                        recipe_id: r.id, name: r.n, emoji: r.e,
                        calories: r.cal, protein_g: r.p, carbs_g: r.c, fat_g: r.f,
                      });
                      setSwapTarget(null);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, background: "var(--bg)",
                      border: "1px solid var(--sep)", borderRadius: 14, padding: "10px 12px",
                      cursor: "pointer", textAlign: "left", width: "100%",
                    }}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{r.e}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{r.n}</p>
                      <p style={{ fontSize: 11, color: "var(--text2)" }}>{r.cal} kcal · P {r.p}g</p>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>{r.g}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
