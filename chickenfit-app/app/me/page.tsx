"use client";


















import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calcTDEE, type UserProfile, type Goal, type Gender, type ActivityLevel } from "../../lib/profile";
import { calcMacros } from "../../lib/macros";
import { useProfileStore } from "../../store/profile.store";

import { Toggle } from "../components/Toggle";

const ACTIVITY_OPTIONS: { val: ActivityLevel; label: string; sub: string }[] = [
  { val: 1.2,   label: "Ít vận động",  sub: "Ngồi nhiều, ít đi lại" },
  { val: 1.375, label: "Nhẹ",          sub: "1–3 buổi tập/tuần" },
  { val: 1.55,  label: "Vừa phải",     sub: "3–5 buổi tập/tuần" },
  { val: 1.725, label: "Nhiều",        sub: "6–7 buổi tập/tuần" },
  { val: 1.9,   label: "Rất nhiều",    sub: "2 buổi/ngày hoặc lao động nặng" },
];

const GOAL_OPTIONS: { val: Goal; label: string; icon: string; color: string }[] = [
  { val: "cut",      label: "Giảm mỡ", icon: "🔥", color: "#B85C38" },
  { val: "maintain", label: "Duy trì", icon: "⚖️", color: "#4A7C59" },
  { val: "bulk",     label: "Tăng cơ", icon: "💪", color: "#C9A227" },
];

function bmi(weight: number, height: number) {
  const h = height / 100;
  const val = weight / (h * h);
  let label = "Bình thường"; let color = "#4A7C59";
  if (val < 18.5)              { label = "Thiếu cân"; color = "#4A90D9"; }
  else if (val >= 25 && val < 30) { label = "Thừa cân"; color = "#C9A227"; }
  else if (val >= 30)          { label = "Béo phì";   color = "#B85C38"; }
  return { val: val.toFixed(1), label, color };
}

function Row({ label, last, children }: { label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "13px 16px",
      borderBottom: last ? "none" : "0.5px solid var(--sep)",
    }}>
      <span style={{ fontSize: 14, color: "var(--text2)", fontWeight: 500 }}>{label}</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, unit, min, max }: {
  value: number; onChange: (v: number) => void;
  unit?: string; min: number; max: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--sep)", background: "var(--bg)", fontSize: 16, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <span style={{ minWidth: 36, textAlign: "center", fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>
        {value}{unit && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>{unit}</span>}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--sep)", background: "var(--bg)", fontSize: 16, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontSize: 14, fontWeight: 700, color: "var(--text)",
        border: "1.5px solid var(--sep)", borderRadius: 8,
        padding: "6px 12px", background: "var(--bg)",
        outline: "none", textAlign: "right", minWidth: 120,
      }}
    />
  );
}



function MenuItem({ icon, iconBg, title, sub, href, onClick, danger }: {
  icon: string; iconBg: string; title: string; sub: string;
  href?: string; onClick?: () => void; danger?: boolean;
}) {
  const inner = (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 16px", width: "100%",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? "#B85C38" : "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 1 }}>{sub}</div>
      </div>
      <span style={{ fontSize: 18, color: "#C7C7CC" }}>›</span>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
  return <button onClick={onClick} style={{ border: "none", background: "none", width: "100%", cursor: "pointer", padding: 0, textAlign: "left" }}>{inner}</button>;
}

function NotifItem({ icon, iconBg, title, sub, storageKey, label, accessToken, last }: {
  icon: string; iconBg: string; title: string; sub: string;
  storageKey: string; label: string; accessToken?: string | null; last?: boolean;
}) {
  async function enablePush(): Promise<boolean> {
    const { subscribePush } = await import("../../lib/push");
    return subscribePush(label, accessToken);
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
      borderBottom: last ? "none" : "0.5px solid var(--sep)",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 1 }}>{sub}</div>
      </div>
      <Toggle storageKey={storageKey} onEnable={enablePush} />
    </div>
  );
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
    {children}
  </p>
);

export default function MePage() {
  const router = useRouter();
  const store = useProfileStore();
  const { setProfile: setStoreProfile, logout, onboardingDone,
      goal, gender, age, weight, height, activity, tdee, accessToken, fullName } = store;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);

  if (!onboardingDone) { router.replace("/onboarding"); return null; }

  const profile: UserProfile = {
    fullName: fullName || "",
    goal: goal!, gender, age, weight, height, activity: activity!, tdee, onboardingDone: true,
  };

  const macros = calcMacros(profile);
  const bmiData = bmi(profile.weight, profile.height);
  const goalInfo = GOAL_OPTIONS.find(g => g.val === profile.goal)!;
  const actInfo = ACTIVITY_OPTIONS.find(a => a.val === profile.activity)!;

  function startEdit() { setDraft({ ...profile, fullName: fullName || "" }); setEditing(true); }

  async function save() {
    if (!draft) return;
    const newTdee = calcTDEE(draft);
    const updated = { ...draft, tdee: newTdee };
    setStoreProfile({ ...updated, onboardingDone: true });

    if (accessToken) {
      const GOAL_TO_DB: Record<string, string> = { cut: "burn", maintain: "maintain", bulk: "build" };
      const ACT_TO_DB: Record<number, string> = { 1.2: "sedentary", 1.375: "light", 1.55: "moderate", 1.725: "active", 1.9: "very_active" };
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
                      display_name: updated.fullName,
                      goal: GOAL_TO_DB[updated.goal], gender: updated.gender,
                      age: updated.age, weight_kg: updated.weight, height_cm: updated.height,
                      activity: ACT_TO_DB[updated.activity], tdee: newTdee, onboarding_done: true,
                    }),
        });
      } catch { /* store is source of truth */ }
    }

    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function cancel() { setDraft({ ...profile }); setEditing(false); }

  function resetAll() {
    if (!confirm("Xoá toàn bộ dữ liệu và làm lại từ đầu?")) return;
    logout();
    router.replace("/onboarding");
  }

  const editDraft = draft ?? profile;

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Header gradient + macros ── */}
      <div style={{
        background: "linear-gradient(160deg, #C9A227 0%, #B85C38 50%, #6B3A20 100%)",
        padding: "24px 20px 20px", color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(255,255,255,.2)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, border: "2px solid rgba(255,255,255,.4)", flexShrink: 0,
          }}>🐔</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>{fullName || "Hồ sơ của bạn"}</p>
            <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.3px" }}>
              {goalInfo.icon} {goalInfo.label}
            </h1>
            <p style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
              {profile.weight}kg · {profile.height}cm · {profile.age} tuổi
            </p>
          </div>
          {!editing && (
            <button onClick={startEdit} style={{
              background: "rgba(255,255,255,.25)", border: "1px solid rgba(255,255,255,.4)",
              borderRadius: 10, padding: "7px 14px", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>Sửa</button>
          )}
        </div>

        {/* Macro grid inside header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[
            { val: macros.kcal,    unit: "kcal", label: "CALO"    },
            { val: macros.protein, unit: "g",    label: "PROTEIN" },
            { val: macros.carb,    unit: "g",    label: "CARBS"   },
            { val: macros.fat,     unit: "g",    label: "FAT"     },
          ].map(m => (
            <div key={m.label} style={{
              background: "rgba(255,255,255,.18)", borderRadius: 12,
              padding: "10px 4px", textAlign: "center",
            }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
                {m.val}<span style={{ fontSize: 9 }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1, fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Save banner ── */}
      {saved && (
        <div style={{ background: "#4A7C59", color: "#fff", textAlign: "center", padding: "10px", fontSize: 13, fontWeight: 700 }}>
          ✓ Đã lưu thành công
        </div>
      )}

      {/* ── BMI ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{
          background: "var(--card)", borderRadius: 14, padding: "12px 16px",
          border: "1px solid var(--sep)", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>Chỉ số BMI</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: bmiData.color }}>{bmiData.val}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${bmiData.color}18`, color: bmiData.color }}>
              {bmiData.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Công cụ ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <SectionLabel>Công cụ</SectionLabel>
        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--sep)", overflow: "hidden" }}>
          <div style={{ borderBottom: "0.5px solid var(--sep)" }}>
            <MenuItem icon="🔢" iconBg="#FAF0E8" title="Tính calo TDEE" sub="Cập nhật macro theo thể trạng" onClick={startEdit} />
          </div>
          <div style={{ borderBottom: "0.5px solid var(--sep)" }}>
            <MenuItem icon="📅" iconBg="#E8F5E8" title="Kế hoạch bữa ăn" sub="Meal plan 7 ngày" href="/plan" />
          </div>
          <MenuItem icon="📊" iconBg="#EEE8D8" title="Nhật ký tiến trình" sub="Log cân nặng & bữa ăn" href="/progress" />
        </div>
      </div>

      {/* ── Thông số cơ thể ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <SectionLabel>Thông số cơ thể</SectionLabel>
        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--sep)", overflow: "hidden" }}>
                  <Row label="Tên">
                    {editing
                      ? <TextInput value={editDraft.fullName || ""} onChange={v => setDraft(d => ({ ...(d ?? profile), fullName: v }))} placeholder="Nhập tên của bạn" />
                      : fullName || "Chưa đặt tên"}
                  </Row>
                  <Row label="Giới tính">
            {editing ? (
              <div style={{ display: "flex", gap: 8 }}>
                {(["male", "female"] as Gender[]).map(g => (
                  <button key={g} onClick={() => setDraft(d => ({ ...(d ?? profile), gender: g }))}
                    style={{ padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      border: editDraft.gender === g ? "1.5px solid var(--primary)" : "1.5px solid var(--sep)",
                      background: editDraft.gender === g ? "var(--primary)" : "var(--bg)",
                      color: editDraft.gender === g ? "#fff" : "var(--text2)" }}>
                    {g === "male" ? "Nam" : "Nữ"}
                  </button>
                ))}
              </div>
            ) : profile.gender === "male" ? "Nam" : "Nữ"}
          </Row>
          <Row label="Tuổi">
            {editing
              ? <NumInput value={editDraft.age} onChange={v => setDraft(d => ({ ...(d ?? profile), age: v }))} min={15} max={80} />
              : `${profile.age} tuổi`}
          </Row>
          <Row label="Cân nặng">
            {editing
              ? <NumInput value={editDraft.weight} onChange={v => setDraft(d => ({ ...(d ?? profile), weight: v }))} unit="kg" min={30} max={200} />
              : `${profile.weight} kg`}
          </Row>
          <Row label="Chiều cao">
            {editing
              ? <NumInput value={editDraft.height} onChange={v => setDraft(d => ({ ...(d ?? profile), height: v }))} unit="cm" min={130} max={220} />
              : `${profile.height} cm`}
          </Row>
          <div style={{ padding: "13px 16px", borderBottom: "0.5px solid var(--sep)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing ? 10 : 0 }}>
              <span style={{ fontSize: 14, color: "var(--text2)", fontWeight: 500 }}>Mức vận động</span>
              {!editing && <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{actInfo.label}</span>}
            </div>
            {editing && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ACTIVITY_OPTIONS.map(opt => (
                  <button key={opt.val} onClick={() => setDraft(d => ({ ...(d ?? profile), activity: opt.val }))}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                      border: editDraft.activity === opt.val ? "1.5px solid var(--primary)" : "1.5px solid var(--sep)",
                      background: editDraft.activity === opt.val ? "rgba(184,92,56,.08)" : "var(--bg)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{opt.sub}</div>
                    </div>
                    {editDraft.activity === opt.val && <span style={{ color: "var(--primary)", fontSize: 18 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Goal selector */}
          <div style={{ padding: "13px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: "var(--text2)", fontWeight: 500 }}>Mục tiêu</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {GOAL_OPTIONS.map(g => {
                const active = editing ? editDraft.goal === g.val : profile.goal === g.val;
                return (
                  <button key={g.val} onClick={() => editing && setDraft(d => ({ ...(d ?? profile), goal: g.val }))}
                    style={{ flex: 1, padding: "10px 6px", borderRadius: 14, cursor: editing ? "pointer" : "default",
                      border: active ? `2px solid ${g.color}` : "1.5px solid var(--sep)",
                      background: active ? `${g.color}12` : "var(--bg)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all .15s" }}>
                    <span style={{ fontSize: 22 }}>{g.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: active ? g.color : "var(--text2)" }}>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit buttons ── */}
      {editing && (
        <div style={{ padding: "12px 16px 0", display: "flex", gap: 10 }}>
          <button onClick={cancel} style={{ flex: 1, padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 700, border: "1.5px solid var(--sep)", background: "var(--card)", color: "var(--text2)", cursor: "pointer" }}>
            Huỷ
          </button>
          <button onClick={save} style={{ flex: 2, padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 700, border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer" }}>
            Lưu thay đổi
          </button>
        </div>
      )}

      {/* ── Notification toggles ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <SectionLabel>Cài đặt thông báo</SectionLabel>
        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--sep)", overflow: "hidden" }}>
          <NotifItem icon="🔔" iconBg="#FBF5DC" title="Nhắc nhở bữa ăn" sub="Sáng 7h · trưa 12h · tối 6h" storageKey="notif-meal" label="meal" accessToken={accessToken} />
          <NotifItem icon="💧" iconBg="#EDF5EB" title="Nhắc uống nước" sub="Mỗi 2 tiếng trong giờ hoạt động" storageKey="notif-water" label="water" accessToken={accessToken} />
          <NotifItem icon="📦" iconBg="#F5EDDC" title="Nhắc meal prep" sub="Chủ nhật 4h chiều" storageKey="notif-prep" label="prep" accessToken={accessToken} last />
        </div>
      </div>

      {/* ── App info + reset ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <SectionLabel>Tài khoản</SectionLabel>
        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--sep)", overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "0.5px solid var(--sep)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "var(--text2)" }}>Phiên bản</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>1.0.0</span>
          </div>
          <div style={{ padding: "13px 16px", borderBottom: "0.5px solid var(--sep)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "var(--text2)" }}>Công thức</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>99 món</span>
          </div><div style={{ borderBottom: "0.5px solid var(--sep)" }}><MenuItem icon="🔒" iconBg="#E8F0F8" title="Chính sách bảo mật" sub="Xem cách chúng tôi bảo vệ dữ liệu" href="/privacy" /></div><div style={{ borderBottom: "0.5px solid var(--sep)" }}><MenuItem icon="📜" iconBg="#F8F0E8" title="Điều khoản sử dụng" sub="Quy định và trách nhiệm" href="/terms" /></div>
          <button onClick={resetAll} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 14, color: "#B85C38", fontWeight: 600 }}>Đặt lại từ đầu</span>
            <span style={{ fontSize: 16, color: "#B85C38" }}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
