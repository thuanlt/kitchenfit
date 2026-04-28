"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "../store/profile.store";
import { calcMacros, GOAL_LABEL, type Macros } from "../lib/macros";
import type { UserProfile } from "../lib/profile";
import Link from "next/link";

// ─── Recipe data ──────────────────────────────────────────────────────────────
const SMOOTHIES = [
  { id: 8,  emoji: "🥤", name: "Smoothie Chuối Protein",        cal: 340, protein: 38, bg: "#F5EDDF", tag: "Sinh tố" },
  { id: 9,  emoji: "🥑", name: "Smoothie Bơ Rau Bina",          cal: 310, protein: 32, bg: "#E4EDE5", tag: "Sinh tố" },
  { id: 10, emoji: "🌾", name: "Smoothie Yến Mạch Sữa",         cal: 390, protein: 42, bg: "#F7EDDA", tag: "Sinh tố" },
  { id: 11, emoji: "🫐", name: "Smoothie Việt Quất Recovery",   cal: 290, protein: 40, bg: "#EAE4D8", tag: "Sinh tố" },
];

const MEALS = [
  { id: 0, emoji: "🍗", name: "Gà nướng chanh mật ong",  cal: 285, protein: 42, bg: "#FAF0E2", tag: "Tăng cơ",  tagColor: "#C9A227" },
  { id: 1, emoji: "🥗", name: "Salad ức gà Hy Lạp",      cal: 210, protein: 35, bg: "#E8EFE4", tag: "Giảm mỡ", tagColor: "#B85C38" },
  { id: 7, emoji: "🌿", name: "Gà hấp gừng hành",        cal: 220, protein: 40, bg: "#E4EFE6", tag: "Giảm mỡ", tagColor: "#B85C38" },
  { id: 5, emoji: "🥙", name: "Gà shawarma áp chảo",     cal: 295, protein: 44, bg: "#F2E4D6", tag: "Giảm mỡ", tagColor: "#B85C38" },
];

const MEAL_PREP = [
  { id: 6, emoji: "🍱", name: "Cơm gà protein prep",     cal: 360, p: 45, c: 25, f: 8  },
  { id: 3, emoji: "🫙", name: "Ức gà teriyaki meal box", cal: 310, p: 38, c: 22, f: 7  },
];

// ─── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting(name?: string) { const h = new Date().getHours(); const timeGreeting = h < 11 ? "Chao buoi sang" : h < 14 ? "Chao buoi trua" : h < 18 ? "Chao buoi chieu" : "Chao buoi toi"; return name ? `${"{"}timeGreeting}${"{"}name}${"{"}}!` : timeGreeting; }

// ─── Components ───────────────────────────────────────────────────────────────
function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 8px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>{title}</h2>
      {href && (
        <Link href={href} style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          Xem tất cả
        </Link>
      )}
    </div>
  );
}

function RecipeCard({ id, emoji, name, cal, protein, bg, tag, tagColor }: {
  id: number; emoji: string; name: string; cal: number; protein: number;
  bg: string; tag: string; tagColor?: string;
}) {
  return (
    <Link href={`/recipes/${id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
      <div style={{
        width: 160, background: "var(--card)", borderRadius: 16,
        overflow: "hidden", border: "1px solid var(--sep)",
      }}>
        <div style={{
          height: 100, background: bg, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 44,
        }}>
          {emoji}
        </div>
        <div style={{ padding: "10px 12px 12px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>{name}</p>
          <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6 }}>{cal} kcal · {protein}g Protein</p>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
            background: tagColor ? `${tagColor}18` : "#7A523018",
            color: tagColor ?? "var(--brown)",
          }}>
            {tag}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { onboardingDone, goal, gender, age, weight, height, activity, tdee } = useProfileStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!onboardingDone) {
      router.replace("/onboarding");
      return;
    }
    if (goal && age && weight && height && activity) {
      const p: UserProfile = { fullName: "", goal, gender, age, weight, height, activity, tdee: tdee ?? 0, onboardingDone: true };
      setProfile(p);
      setMacros(calcMacros(p));
    }
    setReady(true);
  }, [onboardingDone, goal, gender, age, weight, height, activity, tdee, router]);

  if (!ready) return null;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(160deg, #C9A227 0%, #B85C38 45%, #6B3A20 100%)",
        padding: "24px 20px 28px", color: "#fff",
      }}>
        <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>{getGreeting()}</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
          99 Công thức<br/>Ức Gà Healthy
        </h1>
        <p style={{ fontSize: 13, opacity: 0.8, marginTop: 6, lineHeight: 1.5 }}>
          Clean eating cho gymer — ăn ngon, đủ macro, không lo calo dư
        </p>
      </div>

      {/* ── Profile / Macro card ── */}
      {profile && macros && (
        <div style={{
          margin: "12px 16px 0",
          background: "linear-gradient(135deg, #F5EDDC, #EEE0C8)",
          border: "1.5px solid #D4B896", borderRadius: 16, padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 30 }}>🐔</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                {GOAL_LABEL[profile.goal]}
              </p>
              <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 1 }}>
                {profile.weight}kg · {profile.height}cm · {profile.age} tuổi
              </p>
            </div>
            <Link
              href="/me"
              style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
            >
              Sửa
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {[
              { val: macros.kcal,    key: "KCAL",    color: "var(--primary)" },
              { val: macros.protein, key: "PROTEIN", color: "var(--gold)"    },
              { val: macros.carb,    key: "CARBS",   color: "var(--green)"   },
              { val: macros.fat,     key: "FAT",     color: "var(--brown)"   },
            ].map(m => (
              <div key={m.key} style={{
                background: "rgba(255,255,255,.7)", borderRadius: 10,
                padding: "8px 4px", textAlign: "center",
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 9, color: "var(--text2)", fontWeight: 600, marginTop: 1 }}>{m.key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, padding: "16px 20px 0" }}>
        {[
          { val: "99",   key: "Công thức"    },
          { val: "≥30g", key: "Protein/suất" },
          { val: "Sạch", key: "Clean eating" },
        ].map(s => (
          <div key={s.key} style={{
            background: "var(--card)", borderRadius: 14, padding: "14px 10px",
            textAlign: "center", border: "1px solid var(--sep)",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2, fontWeight: 600 }}>{s.key}</div>
          </div>
        ))}
      </div>

      {/* ── Goal pills ── */}
      <SectionHead title="Mục tiêu" />
      <div style={{ display: "flex", gap: 10, padding: "0 20px 4px", overflowX: "auto" }}
           >
        {[
          { icon: "🔥", name: "Giảm mỡ",  sub: "Low-carb",    border: "#B85C38" },
          { icon: "💪", name: "Tăng cơ",  sub: "High-protein", border: "#C9A227" },
          { icon: "⚖️", name: "Duy trì",  sub: "Balanced",     border: "#4A7C59" },
          { icon: "🥤", name: "Sinh tố",  sub: "Blend & Go",   border: "#7A5230" },
        ].map(g => (
          <Link key={g.name} href={`/recipes?filter=${encodeURIComponent(g.name)}`} style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--card)", borderRadius: 40, padding: "10px 16px",
              border: `1.5px solid ${g.border}`, cursor: "pointer",
            }}>
              <span style={{ fontSize: 20 }}>{g.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{g.name}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{g.sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Smoothies ── */}
      <SectionHead title="Sinh tố ức gà" href="/recipes" />
      <div style={{ display: "flex", gap: 12, padding: "0 20px 4px", overflowX: "auto" }}
           >
        {SMOOTHIES.map(r => (
          <RecipeCard key={r.id} {...r} tagColor="#7A5230" />
        ))}
      </div>

      {/* ── Healthy meals ── */}
      <SectionHead title="Món ăn healthy" href="/recipes" />
      <div style={{ display: "flex", gap: 12, padding: "0 20px 4px", overflowX: "auto" }}
           >
        {MEALS.map(r => (
          <RecipeCard key={r.id} {...r} />
        ))}
      </div>

      {/* ── Meal prep ── */}
      <SectionHead title="Meal Prep tuần này" />
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {MEAL_PREP.map(r => (
          <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--card)", borderRadius: 14, overflow: "hidden",
              border: "1px solid var(--sep)",
            }}>
              <div style={{
                width: 72, height: 72, background: "#EEE8D8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, flexShrink: 0,
              }}>
                {r.emoji}
              </div>
              <div style={{ flex: 1, padding: "0 12px 0 0" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{r.name}</p>
                <p style={{ fontSize: 12, color: "var(--text2)" }}>
                  <strong style={{ color: "var(--primary)" }}>{r.cal} kcal</strong>
                  {" · "}P {r.p}g · C {r.c}g · F {r.f}g
                </p>
              </div>
              <span style={{ color: "#C7C7CC", fontSize: 20, paddingRight: 12 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

