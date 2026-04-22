"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useProgressStore } from "../../store/progress.store";
import { useProfileStore } from "../../store/profile.store";

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

const PRIMARY = "#B85C38";
const SEP     = "#E3D5C5";
const TEXT2   = "#8C6545";
const CARD    = "#FFFDF8";

function WeightChart({ entries }: { entries: { date: string; weight: number }[] }) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: TEXT2, fontSize: 13, lineHeight: 1.6 }}>
        Chưa có dữ liệu.<br />Log cân nặng đầu tiên ở trên!
      </div>
    );
  }

  const vals = entries.map((e) => e.weight);
  const mn = Math.floor(Math.min(...vals)) - 1;
  const mx = Math.ceil(Math.max(...vals)) + 1;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

  const lastIdx = entries.length - 1;
  const data = entries.map((e, i) => ({
    date: e.date.slice(5).replace("-", "/"),
    weight: e.weight,
    fill: i === lastIdx ? PRIMARY : SEP,
  }));

  // Custom bar shape reads `fill` from each data entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ColoredBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    if (!height || height <= 0) return null;
    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={5} ry={5} />;
  };

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} barCategoryGap="25%" margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: TEXT2, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[mn, mx]}
          tick={{ fontSize: 10, fill: TEXT2 }}
          axisLine={false}
          tickLine={false}
          tickCount={4}
        />
        <Tooltip
          formatter={(v) => [`${v} kg`, "Cân nặng"]}
          contentStyle={{
            borderRadius: 12, fontSize: 13, border: `1px solid ${SEP}`,
            background: CARD, color: "#2C1A10", boxShadow: "0 4px 16px rgba(0,0,0,.1)",
          }}
          cursor={{ fill: "rgba(0,0,0,0.04)", radius: 4 }}
        />
        <ReferenceLine
          y={avg}
          stroke={PRIMARY}
          strokeDasharray="4 3"
          strokeOpacity={0.4}
          strokeWidth={1.5}
        />
        <Bar dataKey="weight" shape={<ColoredBar />} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ProgressPage() {
  const today = dateKey();
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);

  const { weightLog, addWeight, removeDiaryEntry, getDiaryForDate, getDiaryTotals } = useProgressStore();
  const { tdee, accessToken } = useProfileStore();

  const calTarget = tdee || 2000;
  const todayDiary = getDiaryForDate(today);
  const totals = getDiaryTotals(today);
  const diaryPct = Math.min(100, Math.round((totals.calories / calTarget) * 100));

  const last7 = weightLog.slice(-7);
  const vals = last7.map((e) => e.weight);
  const diff = vals.length >= 2 ? (vals[vals.length - 1] - vals[0]).toFixed(1) : null;
  const diffNum = diff ? parseFloat(diff) : 0;

  async function logWeight() {
    const val = parseFloat(weightInput);
    if (!val || val < 20 || val > 300) return;
    setSaving(true);

    // Save to store (immediate UI update)
    addWeight({ date: today, weight: val });
    setWeightInput("");

    // Sync to API if authenticated
    if (accessToken) {
      try {
        await fetch("/api/log/weight", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ weight_kg: val, logged_at: today }),
        });
      } catch { /* store is source of truth */ }
    }

    setSaving(false);
  }

  async function removeDiaryItem(entryId: string | undefined, date: string) {
    if (!entryId) return;
    removeDiaryEntry(date, entryId);

    if (accessToken) {
      try {
        await fetch(`/api/log/diary?id=${entryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch { /* store already updated */ }
    }
  }

  return (
    <div style={{ overflowY: "auto", paddingBottom: 24 }}>
      {/* ── Header ── */}
      <div style={{ background: "var(--card)", borderBottom: "0.5px solid var(--sep)", padding: "14px 20px 10px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.3px" }}>Tiến trình</h1>
        <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Cân nặng & nhật ký</p>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Log cân nặng ── */}
        <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px", border: "1px solid var(--sep)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            Log cân nặng hôm nay
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input
              type="number"
              placeholder="70.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && logWeight()}
              step="0.1"
              style={{
                flex: 1, minWidth: 0, background: "var(--bg)", border: "1.5px solid var(--sep)",
                borderRadius: 12, padding: "12px 16px", fontSize: 20, fontWeight: 800,
                color: "var(--text)", outline: "none", textAlign: "center",
              }}
            />
            <span style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, flexShrink: 0 }}>kg</span>
          </div>
          <button
            onClick={logWeight}
            disabled={saving}
            style={{
              width: "100%", background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Đang lưu..." : "Lưu cân nặng"}
          </button>
        </div>

        {/* ── Chart ── */}
        <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, border: "1px solid var(--sep)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
            7 ngày gần nhất
          </p>
          <WeightChart entries={last7} />
        </div>

        {/* ── Stats grid ── */}
        {last7.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { val: `${vals[vals.length - 1]} kg`, label: "Hiện tại", color: "var(--primary)" },
              {
                val: diff ? `${diffNum > 0 ? "+" : ""}${diff} kg` : "—",
                label: "7 ngày",
                color: diffNum <= 0 ? "var(--green)" : "var(--primary)",
              },
              { val: `${last7.length} 🔥`, label: "Ngày log", color: "var(--gold)" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--card)", borderRadius: 14, padding: "14px 8px", textAlign: "center", border: "1px solid var(--sep)" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Diary ── */}
        <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, border: "1px solid var(--sep)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Bữa ăn hôm nay</span>
            <Link href="/recipes" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              + Thêm bữa
            </Link>
          </div>

          {todayDiary.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>
              Chưa có bữa nào hôm nay<br />
              <span style={{ fontSize: 12 }}>Xem công thức → nhấn &quot;Thêm vào nhật ký&quot;</span>
            </div>
          ) : (
            <>
              {todayDiary.map((entry, i) => (
                <div key={entry.id ?? i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  paddingBottom: 10, marginBottom: 10,
                  borderBottom: i < todayDiary.length - 1 ? "0.5px solid var(--sep)" : "none",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FAF0E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {entry.recipe_emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.recipe_name}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                      {entry.calories} kcal · P {entry.protein_g}g
                    </p>
                  </div>
                  <button
                    onClick={() => removeDiaryItem(entry.id, today)}
                    style={{ background: "none", border: "none", fontSize: 18, color: "#ccc", cursor: "pointer", padding: 4 }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Summary */}
              <div style={{
                background: "linear-gradient(135deg,#F5EDDC,#EEE0C8)",
                border: "1.5px solid #D4B896", borderRadius: 12,
                padding: "10px 14px", marginTop: 4,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>Tổng hôm nay</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>
                    {totals.calories} / {calTarget} kcal
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(0,0,0,.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: "var(--primary)", width: `${diaryPct}%`, transition: "width .5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
                  <span>P {totals.protein_g}g</span>
                  <span>C {totals.carbs_g}g</span>
                  <span>F {totals.fat_g}g</span>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
