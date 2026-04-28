"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "../../store/profile.store";
import { calcTDEE, type UserProfile, ACT_TO_DB, GOAL_TO_DB } from "../../lib/profile";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, accessToken } = useProfileStore();
  
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "very_active" | null>(null);
  const [goal, setGoal] = useState<"burn" | "build" | "maintain" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (step === 1 && !fullName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (step === 2 && !gender) {
      setError("Vui lòng chọn giới tính");
      return;
    }
    if (step === 3 && !age) {
      setError("Vui lòng nhập tuổi");
      return;
    }
    if (step === 4 && !weight) {
      setError("Vui lòng nhập cân nặng");
      return;
    }
    if (step === 5 && !height) {
      setError("Vui lòng nhập chiều cao");
      return;
    }
    if (step === 6 && !activity) {
      setError("Vui lòng chọn mức độ hoạt động");
      return;
    }
    if (step === 7 && !goal) {
      setError("Vui lòng chọn mục tiêu");
      return;
    }
    
    setError("");
    if (step < 7) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!gender || !age || !weight || !height || !activity || !goal) return;

    setIsLoading(true);
    setError("");

    try {
      const profile: Omit<UserProfile, "tdee" | "onboardingDone"> = {
              fullName,
              gender,
              age,
              weight,
              height,
              activity: ACT_TO_DB[activity as keyof typeof ACT_TO_DB],
              goal: GOAL_TO_DB[goal as keyof typeof GOAL_TO_DB],
            };

      const tdee = calcTDEE(profile);

      // Update local store
      setProfile({
        ...profile,
        tdee,
        onboardingDone: true,
        fullName,
      });

      // Update server if logged in
      if (accessToken) {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
                      display_name: fullName,
                      gender,
                      age,
                      weight_kg: weight,
                      height_cm: height,
                      activity: ACT_TO_DB[activity as keyof typeof ACT_TO_DB],
                      goal: GOAL_TO_DB[goal as keyof typeof GOAL_TO_DB],
                      tdee,
                      onboarding_done: true,
                    }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "Cập nhật hồ sơ thất bại");
        }
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Bước {step}/7</span>
            <span className="text-sm font-medium text-orange-500">{Math.round((step / 7) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Full Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Xin chào!</h2>
                <p className="text-gray-600 mt-2">Chúng ta nên gọi bạn là gì?</p>
              </div>
              <Input
                label="Họ và tên"
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Gender */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-3xl">👤</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Giới tính</h2>
                <p className="text-gray-600 mt-2">Chọn giới tính của bạn</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    gender === "male"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-4xl mb-2">👨</div>
                  <div className="font-semibold text-gray-900">Nam</div>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    gender === "female"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-4xl mb-2">👩</div>
                  <div className="font-semibold text-gray-900">Nữ</div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Age */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <span className="text-3xl">🎂</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tuổi của bạn</h2>
                <p className="text-gray-600 mt-2">Nhập số tuổi</p>
              </div>
              <Input
                label="Tuổi"
                type="number"
                placeholder="25"
                value={age || ""}
                onChange={(e) => setAge(parseInt(e.target.value) || null)}
                min="10"
                max="100"
                autoFocus
              />
            </div>
          )}

          {/* Step 4: Weight */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-3xl">⚖️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Cân nặng</h2>
                <p className="text-gray-600 mt-2">Nhập cân nặng hiện tại của bạn</p>
              </div>
              <Input
                label="Cân nặng (kg)"
                type="number"
                placeholder="70"
                value={weight || ""}
                onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
                min="30"
                max="200"
                step="0.1"
                autoFocus
              />
            </div>
          )}

          {/* Step 5: Height */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <span className="text-3xl">📏</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Chiều cao</h2>
                <p className="text-gray-600 mt-2">Nhập chiều cao của bạn</p>
              </div>
              <Input
                label="Chiều cao (cm)"
                type="number"
                placeholder="170"
                value={height || ""}
                onChange={(e) => setHeight(parseFloat(e.target.value) || null)}
                min="100"
                max="250"
                autoFocus
              />
            </div>
          )}

          {/* Step 6: Activity Level */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <span className="text-3xl">🏃</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mức độ hoạt động</h2>
                <p className="text-gray-600 mt-2">Bạn tập luyện như thế nào?</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "sedentary", label: "Ít vận động", desc: "Không tập luyện, công việc văn phòng" },
                  { value: "light", label: "Nhẹ nhàng", desc: "Tập 1-3 ngày/tuần" },
                  { value: "moderate", label: "Trung bình", desc: "Tập 3-5 ngày/tuần" },
                  { value: "active", label: "Năng động", desc: "Tập 6-7 ngày/tuần" },
                  { value: "very_active", label: "Rất năng động", desc: "Tập hàng ngày + công việc vất vả" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActivity(option.value as any)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      activity === option.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Goal */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mục tiêu của bạn</h2>
                <p className="text-gray-600 mt-2">Bạn muốn đạt được gì?</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "burn", label: "Giảm mỡ", desc: "Tạo thâm hụt calo để giảm cân", emoji: "🔥" },
                  { value: "build", label: "Tăng cơ", desc: "Tăng calo để xây dựng cơ bắp", emoji: "💪" },
                  { value: "maintain", label: "Duy trì", desc: "Giữ cân nặng hiện tại", emoji: "⚖️" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGoal(option.value as any)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      goal === option.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                Quay lại
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              loading={isLoading}
              className="flex-1"
            >
              {step === 7 ? "Hoàn thành" : "Tiếp tục"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}