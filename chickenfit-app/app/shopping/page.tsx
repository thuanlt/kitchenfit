"use client";

import ShoppingList from "../../components/ShoppingList";

export default function ShoppingPage() {
  return (
    <div style={{ overflowY: "auto", paddingBottom: 24 }}>
      {/* ── Header ── */}
      <div style={{ background: "var(--card)", borderBottom: "0.5px solid var(--sep)", padding: "14px 20px 10px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.3px" }}>Danh sách mua sắm</h1>
        <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Quản lý nguyên liệu nấu ăn</p>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <ShoppingList />
      </div>
    </div>
  );
}