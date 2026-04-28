"use client";

import { useState } from "react";
import { useProgressStore } from "../store/progress.store";

const PRIMARY = "#B85C38";
const SEP = "#E3D5C5";
const TEXT2 = "#8C6545";
const CARD = "#FFFDF8";

const CATEGORIES = {
  protein: { label: "Protein", emoji: "🥩", color: "#e74c3c" },
  vegetable: { label: "Rau củ", emoji: "🥬", color: "#2ecc71" },
  fruit: { label: "Trái cây", emoji: "🍎", color: "#e91e63" },
  grain: { label: "Tinh bột", emoji: "🍚", color: "#f39c12" },
  dairy: { label: "Sữa", emoji: "🥛", color: "#3498db" },
  spice: { label: "Gia vị", emoji: "🧂", color: "#9b59b6" },
  other: { label: "Khác", emoji: "📦", color: "#95a5a6" },
};

export default function ShoppingList() {
  const [newItem, setNewItem] = useState({ name: "", amount: "", unit: "", category: "other" as keyof typeof CATEGORIES });
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { 
    shoppingList, 
    addShoppingItem, 
    removeShoppingItem, 
    toggleShoppingItem, 
    clearCheckedItems 
  } = useProgressStore();

  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      addShoppingItem({
        name: newItem.name.trim(),
        amount: newItem.amount || "1",
        unit: newItem.unit || "cái",
        category: newItem.category,
        checked: false,
      });
      setNewItem({ name: "", amount: "", unit: "", category: "other" });
      setShowAddForm(false);
    }
  };

  const handleClearChecked = () => {
    if (confirm("Bạn có chắc muốn xóa các mục đã đánh dấu không?")) {
      clearCheckedItems();
    }
  };

  const checkedCount = shoppingList.filter(item => item.checked).length;
  const totalCount = shoppingList.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px", border: "1px solid var(--sep)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Danh sách mua sắm
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {checkedCount > 0 && (
            <button
              onClick={handleClearChecked}
              style={{
                background: "none",
                border: "1px solid #e74c3c",
                borderRadius: 8,
                padding: "4px 8px",
                fontSize: 11,
                color: "#e74c3c",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Xóa đã chọn
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {showAddForm ? "✕" : "+ Thêm"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
              Tiến độ
            </span>
            <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
              {checkedCount}/{totalCount}
            </span>
          </div>
          <div style={{ height: 6, background: "rgba(0,0,0,.08)", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                background: "var(--primary)",
                width: `${progress}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div style={{ 
          padding: "12px", 
          background: "linear-gradient(135deg,#F5EDDC,#EEE0C8)",
          borderRadius: 12,
          border: "1.5px solid #D4B896",
          marginBottom: 12 
        }}>
          <input
            type="text"
            placeholder="Tên thực phẩm..."
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            style={{
              width: "100%",
              background: "#fff",
              border: "1.5px solid var(--sep)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              outline: "none",
              marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Số lượng"
              value={newItem.amount}
              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
              style={{
                flex: 1,
                background: "#fff",
                border: "1.5px solid var(--sep)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                outline: "none",
              }}
            />
            <input
              type="text"
              placeholder="Đơn vị"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              style={{
                flex: 1,
                background: "#fff",
                border: "1.5px solid var(--sep)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginBottom: 4 }}>
              Danh mục:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewItem({ ...newItem, category: cat })}
                  style={{
                    background: newItem.category === cat ? "var(--primary)" : "#fff",
                    color: newItem.category === cat ? "#fff" : "var(--text)",
                    border: "1.5px solid var(--sep)",
                    borderRadius: 20,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddItem}
            style={{
              width: "100%",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Thêm vào danh sách
          </button>
        </div>
      )}

      {/* Shopping List Items */}
      {totalCount === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "24px 12px", 
          color: "var(--text2)", 
          fontSize: 13 
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Danh sách trống</p>
          <p style={{ fontSize: 12 }}>Nhấn "+ Thêm" để bắt đầu</p>
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 16 }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6, 
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: "1px solid var(--sep)"
              }}>
                <span style={{ fontSize: 16 }}>{CATEGORIES[category as keyof typeof CATEGORIES].emoji}</span>
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: CATEGORIES[category as keyof typeof CATEGORIES].color 
                }}>
                  {CATEGORIES[category as keyof typeof CATEGORIES].label}
                </span>
                <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
                  ({items.filter(i => !i.checked).length} còn lại)
                </span>
              </div>
              
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.id && toggleShoppingItem(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px",
                    background: item.checked ? "rgba(0,0,0,0.02)" : "#fff",
                    borderRadius: 10,
                    marginBottom: 6,
                    border: "1px solid var(--sep)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "2px solid var(--sep)",
                    background: item.checked ? "var(--primary)" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {item.checked && (
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: item.checked ? "var(--text2)" : "var(--text)",
                      textDecoration: item.checked ? "line-through" : "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
                      {item.amount} {item.unit}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.id && removeShoppingItem(item.id);
                    }}
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
          ))}
        </div>
      )}
    </div>
  );
}
