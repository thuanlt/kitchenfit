"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { DB, TAG_STYLE } from "../../../lib/recipes";
import { useProgressStore } from "../../../store/progress.store";
import { useProfileStore } from "../../../store/profile.store";

function dateKey() { return new Date().toISOString().slice(0, 10); }

const BTN_STYLE = {
  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
  border: "1.5px solid var(--sep)", background: "var(--bg)",
  fontSize: 22, cursor: "pointer", color: "var(--text)",
  display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
};

function CalcSection({ cal, protein, carb, fat }: { cal: number; protein: number; carb: number; fat: number }) {
  const [servings, setServings] = useState(1);
  const s = Math.max(0.5, Math.min(5, servings));
  const step = 0.5;

  const macros = [
    { val: Math.round(cal * s),     label: "KCAL",    color: "#B85C38" },
    { val: Math.round(protein * s), label: "PROTEIN", color: "#C9A227" },
    { val: Math.round(carb * s),    label: "CARBS",   color: "#4A7C59" },
    { val: Math.round(fat * s),     label: "FAT",     color: "#7A5230" },
  ];

  return (
    <div style={{
      background: "var(--card)", borderRadius: 16, padding: "14px 16px",
      border: "1px solid var(--sep)", marginBottom: 16,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase",
        letterSpacing: "0.5px", marginBottom: 14 }}>
        Tính calo theo khẩu phần
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button
          onClick={() => setServings(Math.max(0.5, s - step))}
          style={BTN_STYLE}
        >−</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "var(--primary)" }}>{s}</span>
          <span style={{ fontSize: 14, color: "var(--text2)", marginLeft: 6, fontWeight: 600 }}>phần</span>
        </div>
        <button
          onClick={() => setServings(Math.min(5, s + step))}
          style={BTN_STYLE}
        >+</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {macros.map((m) => (
          <div key={m.label} style={{
            background: "var(--bg)", borderRadius: 12, padding: "10px 4px", textAlign: "center",
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 9, color: "var(--text2)", fontWeight: 600, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {s !== 1 && (
        <p style={{ fontSize: 11, color: "var(--text2)", textAlign: "center", marginTop: 10, fontWeight: 600 }}>
          = {s} × 1 khẩu phần chuẩn
        </p>
      )}
    </div>
  );
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const { addDiaryEntry } = useProgressStore();
  const { accessToken } = useProfileStore();

  const recipe = DB.find((r) => r.id === Number(id));

  if (!recipe) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text2)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Không tìm thấy công thức</p>
      </div>
    );
  }

  const rec = recipe; // narrow once for closure safety
  const tagStyle = TAG_STYLE[rec.g] ?? { bg: "#EEE", color: "#666" };

  async function addToDiary() {
    const today = dateKey();
    addDiaryEntry({
      date: today,
      meal_type: "snack",
      recipe_id: rec.id,
      recipe_name: rec.n,
      recipe_emoji: rec.e,
      amount_g: 100,
      calories: rec.cal,
      protein_g: rec.p,
      carbs_g: rec.c,
      fat_g: rec.f,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);

    if (accessToken) {
      fetch("/api/log/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ recipe_id: rec.id + 1, date: today, meal_type: "snack", amount_g: 100 }),
      }).catch(() => {});
    }
  }

  return (
    <div>
      {/* ── Back nav ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(245,239,230,.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "0.5px solid var(--sep)",
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--sep)",
            background: "var(--card)", cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", flex: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {rec.n}
        </span>
      </div>

      {/* ── Hero image ── */}
      <div style={{
        height: 220, background: rec.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 90, position: "relative",
      }}>
        {rec.e}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(44,26,16,.35) 0%, transparent 60%)",
        }} />
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "0 16px 32px" }}>
        {/* Title + tags */}
        <div style={{ padding: "16px 0 12px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", color: "var(--text)", marginBottom: 8 }}>
            {rec.n}
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: tagStyle.bg, color: tagStyle.color,
            }}>
              {rec.g}
            </span>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>⏱ {rec.t} phút</span>
            <span style={{ fontSize: 13, color: "#4A7C59", fontWeight: 600 }}>✓ {rec.health}</span>
          </div>
        </div>

        {/* Macro grid */}
        <div style={{
          background: "var(--card)", borderRadius: 16, padding: "14px 16px",
          border: "1px solid var(--sep)", marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: 12 }}>
            Dinh dưỡng / khẩu phần
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { val: rec.cal, unit: "kcal", label: "Calo",    color: "var(--primary)" },
              { val: rec.p,   unit: "g",    label: "Protein", color: "var(--gold)"    },
              { val: rec.c,   unit: "g",    label: "Carbs",   color: "var(--green)"   },
              { val: rec.f,   unit: "g",    label: "Fat",     color: "var(--brown)"   },
            ].map((m) => (
              <div key={m.label} style={{
                background: "var(--bg)", borderRadius: 12, padding: "10px 6px", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>
                  {m.val}<span style={{ fontSize: 10 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calorie Calculator ── */}
        <CalcSection cal={rec.cal} protein={rec.p} carb={rec.c} fat={rec.f} />

        {/* Ingredients */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
            🛒 Nguyên liệu
          </h2>
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--sep)", overflow: "hidden" }}>
            {rec.ing.map((ing, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px",
                borderBottom: i < rec.ing.length - 1 ? "0.5px solid var(--sep)" : "none",
              }}>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{ing.n}</span>
                <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>{ing.a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add to diary */}
        <button
          onClick={addToDiary}
          style={{
            width: "100%", marginBottom: 10, padding: "14px",
            borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
            border: "none",
            background: added ? "#4A7C59" : "#4A7C59",
            color: "#fff", transition: "background .2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {added ? "✓ Đã thêm vào nhật ký" : "📓 Thêm vào nhật ký hôm nay"}
        </button>

        {/* Sendo Farm link */}
        <a
          href={`https://www.sendo.vn/tim-kiem/?q=${encodeURIComponent(rec.ing.slice(0, 4).map((i) => i.n).join(" "))}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", marginBottom: 8, padding: "14px",
            borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
            background: "var(--gold)", color: "#fff", textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          🛒 Mua nguyên liệu tại Sendo Farm
        </a>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
          Được dẫn tới trang tìm kiếm Sendo Farm
        </p>

        {/* Steps */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
            👨‍🍳 Cách làm
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rec.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                background: "var(--card)", borderRadius: 14, padding: "14px 16px",
                border: "1px solid var(--sep)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, flex: 1 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
