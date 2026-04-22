"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { calcTDEE, type Goal, type Gender, type ActivityLevel } from "../../lib/profile";
import { useProfileStore } from "../../store/profile.store";

const GOALS: { id: Goal; icon: string; name: string; desc: string }[] = [
  { id: "cut",      icon: "🔥", name: "Giảm mỡ", desc: "Giảm cân, đốt mỡ thừa" },
  { id: "maintain", icon: "⚖️", name: "Duy trì", desc: "Giữ cân nặng hiện tại" },
  { id: "bulk",     icon: "💪", name: "Tăng cơ", desc: "Tăng khối lượng cơ bắp" },
];

const ACTIVITIES: { level: ActivityLevel; icon: string; name: string; desc: string }[] = [
  { level: 1.2,   icon: "🛋️", name: "Ít vận động",    desc: "Ngồi bàn giấy cả ngày" },
  { level: 1.375, icon: "🚶", name: "Nhẹ nhàng",       desc: "Tập 1–3 buổi/tuần" },
  { level: 1.55,  icon: "🏃", name: "Vừa phải",        desc: "Tập 3–5 buổi/tuần" },
  { level: 1.725, icon: "🏋️", name: "Cường độ cao",   desc: "Tập 6–7 buổi/tuần" },
  { level: 1.9,   icon: "🔱", name: "Vận động viên",   desc: "Tập nặng + công việc chân tay" },
];

const GOAL_TO_DB: Record<Goal, string> = { cut: "burn", maintain: "maintain", bulk: "build" };
const ACTIVITY_TO_DB: Record<number, string> = {
  1.2: "sedentary", 1.375: "light", 1.55: "moderate", 1.725: "active", 1.9: "very_active",
};

interface FormState {
  goal: Goal | null;
  gender: Gender;
  age: string;
  weight: string;
  height: string;
  activity: ActivityLevel | null;
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: "6px", borderRadius: "3px", transition: "all 0.3s ease",
          width: i === current ? "22px" : "6px",
          background: i === current ? "var(--primary)" : i < current ? "var(--primary)" : "#C7C7CC",
          opacity: i < current ? 0.35 : 1,
        }} />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, accessToken } = useProfileStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    goal: null, gender: "male", age: "", weight: "", height: "", activity: null,
  });

  const TOTAL = 4;

  function canNext(): boolean {
    if (step === 0) return true;
    if (step === 1) return form.goal !== null;
    if (step === 2) {
      const age = Number(form.age), weight = Number(form.weight), height = Number(form.height);
      return age >= 15 && age <= 80 && weight >= 30 && weight <= 200 && height >= 100 && height <= 230;
    }
    if (step === 3) return form.activity !== null;
    return false;
  }

  async function handleNext() {
    if (step < TOTAL - 1) { setStep(step + 1); return; }

    setSaving(true);
    const tdee = calcTDEE({
      goal: form.goal!, gender: form.gender,
      age: Number(form.age), weight: Number(form.weight),
      height: Number(form.height), activity: form.activity!,
    });

    // Save to Zustand store (persisted via localStorage)
    setProfile({
      goal: form.goal!, gender: form.gender,
      age: Number(form.age), weight: Number(form.weight),
      height: Number(form.height), activity: form.activity!,
      tdee, onboardingDone: true,
    });

    // Sync to API if authenticated
    if (accessToken) {
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            goal: GOAL_TO_DB[form.goal!],
            gender: form.gender,
            age: Number(form.age),
            weight_kg: Number(form.weight),
            height_cm: Number(form.height),
            activity: ACTIVITY_TO_DB[form.activity!],
            tdee,
            onboarding_done: true,
          }),
        });
      } catch { /* store is source of truth */ }
    }

    setSaving(false);
    router.push("/");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", flexShrink: 0 }}>
        <ProgressDots current={step} total={TOTAL} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 12px" }}>
        {step === 0 && <StepWelcome />}
        {step === 1 && <StepGoal form={form} setForm={setForm} />}
        {step === 2 && <StepBody form={form} setForm={setForm} />}
        {step === 3 && <StepActivity form={form} setForm={setForm} />}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px 28px", display: "flex", gap: "12px", flexShrink: 0, background: "var(--bg)" }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{
            width: "48px", height: "52px", borderRadius: "14px",
            border: "1.5px solid var(--sep)", background: "var(--card)",
            fontSize: "20px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>←</button>
        )}
        <button onClick={handleNext} disabled={!canNext() || saving} style={{
          flex: 1, height: "52px", borderRadius: "14px", border: "none",
          background: canNext() && !saving ? "var(--primary)" : "#C7C7CC",
          color: "#fff", fontSize: "16px", fontWeight: 700,
          cursor: canNext() && !saving ? "pointer" : "not-allowed",
          transition: "background 0.2s",
        }}>
          {saving ? "Đang lưu..." : step === TOTAL - 1 ? "Bắt đầu 🚀" : "Tiếp theo →"}
        </button>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <div style={{ paddingTop: "32px", textAlign: "center" }}>
      <div style={{ fontSize: "80px", marginBottom: "20px" }}>🍗</div>
      <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: "8px" }}>ChickenFit</h1>
      <p style={{ fontSize: "15px", color: "var(--text2)", lineHeight: 1.6, marginBottom: "36px" }}>
        Ăn đúng — Tập đủ — Cân bằng cuộc sống
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
        {[
          { icon: "🥗", title: "99 công thức ức gà",    desc: "Đa dạng, dễ nấu, ngon miệng" },
          { icon: "🤖", title: "AI tính TDEE cho bạn",  desc: "Calo phù hợp với mục tiêu cá nhân" },
          { icon: "📅", title: "Meal plan 7 ngày",       desc: "Lên kế hoạch ăn uống thông minh" },
          { icon: "📊", title: "Theo dõi tiến trình",   desc: "Nhật ký cân nặng & bữa ăn hàng ngày" },
        ].map((f) => (
          <div key={f.icon} style={{
            background: "var(--card)", borderRadius: "14px", padding: "14px 16px",
            display: "flex", gap: "14px", alignItems: "center", border: "1px solid var(--sep)",
          }}>
            <span style={{ fontSize: "28px" }}>{f.icon}</span>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{f.title}</p>
              <p style={{ fontSize: "12px", color: "var(--text2)" }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepGoal({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <div style={{ paddingTop: "28px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 900, color: "var(--text)", marginBottom: "6px" }}>Mục tiêu của bạn?</h2>
      <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "24px" }}>Chúng tôi sẽ tính calo phù hợp cho bạn.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {GOALS.map((g) => {
          const selected = form.goal === g.id;
          return (
            <button key={g.id} onClick={() => setForm((f) => ({ ...f, goal: g.id }))} style={{
              display: "flex", alignItems: "center", gap: "16px", padding: "16px",
              borderRadius: "16px", border: selected ? "2px solid var(--primary)" : "1.5px solid var(--sep)",
              background: selected ? "#FFF5F0" : "var(--card)", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "32px" }}>{g.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{g.name}</p>
                <p style={{ fontSize: "13px", color: "var(--text2)" }}>{g.desc}</p>
              </div>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, transition: "all 0.15s", border: selected ? "6px solid var(--primary)" : "1.5px solid #C7C7CC" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBody({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const fieldStyle = (val: string, min: number, max: number): React.CSSProperties => {
    const num = Number(val);
    const invalid = val !== "" && (isNaN(num) || num < min || num > max);
    return {
      width: "100%", height: "52px", borderRadius: "12px",
      border: invalid ? "1.5px solid #FF3B30" : "1.5px solid var(--sep)",
      background: "var(--card)", padding: "0 14px", fontSize: "16px",
      color: "var(--text)", outline: "none", boxSizing: "border-box",
    };
  };
  return (
    <div style={{ paddingTop: "28px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 900, color: "var(--text)", marginBottom: "6px" }}>Thể trạng của bạn</h2>
      <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "24px" }}>Để tính chính xác chỉ số TDEE.</p>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>Giới tính</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {(["male", "female"] as Gender[]).map((g) => (
          <button key={g} onClick={() => setForm((f) => ({ ...f, gender: g }))} style={{
            height: "52px", borderRadius: "12px",
            border: form.gender === g ? "2px solid var(--primary)" : "1.5px solid var(--sep)",
            background: form.gender === g ? "#FFF5F0" : "var(--card)",
            fontSize: "15px", fontWeight: 700,
            color: form.gender === g ? "var(--primary)" : "var(--text2)", cursor: "pointer", transition: "all 0.15s",
          }}>{g === "male" ? "👨 Nam" : "👩 Nữ"}</button>
        ))}
      </div>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>Tuổi (15–80)</p>
      <input type="number" placeholder="Nhập tuổi" value={form.age}
        onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
        style={{ ...fieldStyle(form.age, 15, 80), marginBottom: "16px" }} />
      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>Cân nặng (30–200 kg)</p>
      <input type="number" placeholder="Nhập cân nặng" value={form.weight}
        onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
        style={{ ...fieldStyle(form.weight, 30, 200), marginBottom: "16px" }} />
      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>Chiều cao (100–230 cm)</p>
      <input type="number" placeholder="Nhập chiều cao" value={form.height}
        onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
        style={{ ...fieldStyle(form.height, 100, 230), marginBottom: "8px" }} />
    </div>
  );
}

function StepActivity({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <div style={{ paddingTop: "28px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 900, color: "var(--text)", marginBottom: "6px" }}>Mức độ vận động</h2>
      <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "24px" }}>Trung bình mỗi tuần bạn tập thế nào?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ACTIVITIES.map((a) => {
          const selected = form.activity === a.level;
          return (
            <button key={a.level} onClick={() => setForm((f) => ({ ...f, activity: a.level }))} style={{
              display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px",
              borderRadius: "14px", border: selected ? "2px solid var(--primary)" : "1.5px solid var(--sep)",
              background: selected ? "#FFF5F0" : "var(--card)", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "26px" }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{a.name}</p>
                <p style={{ fontSize: "12px", color: "var(--text2)" }}>{a.desc}</p>
              </div>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, transition: "all 0.15s", border: selected ? "6px solid var(--primary)" : "1.5px solid #C7C7CC" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
