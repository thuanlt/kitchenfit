"use client";

import { useProgressStore } from "../store/progress.store";
import { useProfileStore } from "../store/profile.store";

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

const PRIMARY = "#B85C38";
const SEP = "#E3D5C5";
const TEXT2 = "#8C6545";
const CARD = "#FFFDF8";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit: string;
}

function MacroBar({ label, current, goal, color, unit }: MacroBarProps) {
  const percentage = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const isOverGoal = current > goal;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: isOverGoal ? "#e74c3c" : "var(--text2)" }}>
          {current} / {goal} {unit}
        </span>
      </div>
      <div style={{ height: 8, background: "rgba(0,0,0,.08)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            background: isOverGoal ? "#e74c3c" : color,
            width: `${percentage}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2, fontWeight: 600 }}>
        {percentage.toFixed(0)}% {isOverGoal ? "(Vượt mục tiêu!)" : ""}
      </div>
    </div>
  );
}

export default function MacroAnalysis() {
  const today = dateKey();
  const { getDiaryTotals } = useProgressStore();
  const { macroGoals } = useProfileStore();

  const totals = getDiaryTotals(today);

  const macros = [
    { label: "Protein", current: totals.protein_g, goal: macroGoals.protein_g, color: "#3498db", unit: "g" },
    { label: "Carbs", current: totals.carbs_g, goal: macroGoals.carbs_g, color: "#2ecc71", unit: "g" },
    { label: "Fat", current: totals.fat_g, goal: macroGoals.fat_g, color: "#f39c12", unit: "g" },
    { label: "Fiber", current: 0, goal: macroGoals.fiber_g, color: "#9b59b6", unit: "g" }, // Fiber would need to be tracked
  ];

  // Calculate calorie distribution
  const proteinCalories = totals.protein_g * 4;
  const carbsCalories = totals.carbs_g * 4;
  const fatCalories = totals.fat_g * 9;
  const totalCalories = totals.calories;

  const proteinPercent = totalCalories > 0 ? (proteinCalories / totalCalories) * 100 : 0;
  const carbsPercent = totalCalories > 0 ? (carbsCalories / totalCalories) * 100 : 0;
  const fatPercent = totalCalories > 0 ? (fatCalories / totalCalories) * 100 : 0;

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px", border: "1px solid var(--sep)" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
        Phân tích dinh dưỡng
      </p>

      {/* Macro Progress Bars */}
      <div style={{ marginBottom: 16 }}>
        {macros.map((macro) => (
          <MacroBar key={macro.label} {...macro} />
        ))}
      </div>

      {/* Calorie Distribution Pie Chart */}
      {totalCalories > 0 && (
        <div style={{ 
          borderTop: "1px solid var(--sep)", 
          paddingTop: 12 
        }}>
          <p style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
            Phân bổ calo:
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Simple Pie Chart */}
            <div style={{ 
              position: "relative", 
              width: 80, 
              height: 80 
            }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={SEP}
                  strokeWidth="12"
                />
                {/* Protein slice */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#3498db"
                  strokeWidth="12"
                  strokeDasharray={`${proteinPercent * 2.26} 226`}
                  transform="rotate(-90 40 40)"
                />
                {/* Carbs slice */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#2ecc71"
                  strokeWidth="12"
                  strokeDasharray={`${carbsPercent * 2.26} 226`}
                  transform={`rotate(${proteinPercent * 3.6 - 90} 40 40)`}
                />
                {/* Fat slice */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#f39c12"
                  strokeWidth="12"
                  strokeDasharray={`${fatPercent * 2.26} 226`}
                  transform={`rotate(${(proteinPercent + carbsPercent) * 3.6 - 90} 40 40)`}
                />
              </svg>
            </div>

            {/* Legend */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#3498db" }} />
                <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600 }}>
                  Protein: {proteinPercent.toFixed(0)}%
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#2ecc71" }} />
                <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600 }}>
                  Carbs: {carbsPercent.toFixed(0)}%
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#f39c12" }} />
                <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600 }}>
                  Fat: {fatPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{ 
        marginTop: 12, 
        padding: "10px 12px", 
        background: "linear-gradient(135deg,#F5EDDC,#EEE0C8)",
        borderRadius: 8,
        border: "1px solid #D4B896"
      }}>
        <p style={{ fontSize: 11, color: "var(--text)", fontWeight: 600, lineHeight: 1.4 }}>
          💡 <strong>Mẹo:</strong> Để đạt mục tiêu, hãy tập trung vào {totals.protein_g < macroGoals.protein_g ? "tăng protein" : totals.carbs_g < macroGoals.carbs_g ? "tăng carbs" : "duy trì hiện tại"}
        </p>
      </div>
    </div>
  );
}
