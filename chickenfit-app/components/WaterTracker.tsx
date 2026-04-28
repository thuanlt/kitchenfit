"use client";

import { useState } from "react";
































































import { useProgressStore } from "../store/progress.store";

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

const PRIMARY = "#B85C38";
const SEP = "#E3D5C5";
const TEXT2 = "#8C6545";
const CARD = "#FFFDF8";

export default function WaterTracker() {
  const today = dateKey();
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  
  const { 
    waterLog, 
    dailyWaterGoal, 
    addWater, 
    removeWater, 
    getWaterTotalForDate,
    setDailyWaterGoal 
  } = useProgressStore();

  const todayWater = getWaterTotalForDate(today);
  const waterPercentage = Math.min(100, (todayWater / dailyWaterGoal) * 100);
  const todayEntries = waterLog[today] || [];

  const quickAmounts = [150, 250, 350, 500];

  const handleAddWater = (amount: number) => {
    addWater(amount, today);
  };

  const handleRemoveWater = (entryId: string) => {
    removeWater(today, entryId);
  };

  const handleCustomAmount = () => {
    const amount = parseInt(selectedAmount.toString());
    if (amount > 0 && amount <= 2000) {
      handleAddWater(amount);
    }
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px", border: "1px solid var(--sep)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Nước uống hôm nay
          </p>
          <p style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
            Mục tiêu: {dailyWaterGoal}ml
          </p>
        </div>
        <button
          onClick={() => {
            const newGoal = prompt("Nhập mục tiêu nước uống (ml):", dailyWaterGoal.toString());
            if (newGoal && !isNaN(parseInt(newGoal))) {
              setDailyWaterGoal(parseInt(newGoal));
            }
          }}
          style={{ 
            background: "none", 
            border: "1px solid var(--sep)", 
            borderRadius: 8, 
            padding: "4px 8px", 
            fontSize: 11, 
            color: "var(--primary)", 
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Đổi mục tiêu
        </button>
      </div>

      {/* Water Progress Circle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ 
          position: "relative", 
          width: 120, 
          height: 120 
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={SEP}
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={PRIMARY}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${waterPercentage * 3.39} 339`}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>
              {todayWater}
            </div>
            <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>
              / {dailyWaterGoal}ml
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
          Thêm nhanh:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleAddWater(amount)}
              style={{
                background: "var(--bg)",
                border: "1.5px solid var(--sep)",
                borderRadius: 10,
                padding: "10px 4px",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg)";
                e.currentTarget.style.color = "var(--text)";
                e.currentTarget.style.borderColor = "var(--sep)";
              }}
            >
              +{amount}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="number"
          value={selectedAmount}
          onChange={(e) => setSelectedAmount(parseInt(e.target.value) || 0)}
          placeholder="ml"
          style={{
            flex: 1,
            background: "var(--bg)",
            border: "1.5px solid var(--sep)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text)",
            outline: "none",
          }}
        />
        <button
          onClick={handleCustomAmount}
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Thêm
        </button>
      </div>

      {/* Today's Entries */}
      {todayEntries.length > 0 && (
        <div style={{ borderTop: "1px solid var(--sep)", paddingTop: 12 }}>
          <p style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
            Lịch sử hôm nay:
          </p>
          <div style={{ maxHeight: 120, overflowY: "auto" }}>
            {todayEntries.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--sep)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>💧</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                      {entry.amount_ml}ml
                    </p>
                    <p style={{ fontSize: 10, color: "var(--text2)" }}>
                      {new Date(entry.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => entry.id && handleRemoveWater(entry.id)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 16,
                    color: "#ccc",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
