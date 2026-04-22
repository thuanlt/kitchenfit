"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DB, FILTERS, TAG_STYLE } from "../../lib/recipes";

function GoalTag({ tag }: { tag: string }) {
  const s = TAG_STYLE[tag] ?? { bg: "#EEE", color: "#666" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      {tag}
    </span>
  );
}

function RecipesContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    const f = searchParams.get("filter");
    if (f && (FILTERS as readonly string[]).includes(f) && f !== "Tất cả") {
      setActive(new Set([f]));
    }
  }, [searchParams]);

  function toggleFilter(f: string) {
    if (f === "Tất cả") { setActive(new Set()); return; }
    setActive((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return DB.filter((r) => {
      const matchFilter = active.size === 0 || r.tags.some((t) => active.has(t));
      const matchQuery  = !q || r.n.toLowerCase().includes(q) ||
                          r.ing.some((i) => i.n.toLowerCase().includes(q));
      return matchFilter && matchQuery;
    });
  }, [query, active]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Sticky search + filter ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(245,239,230,.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "0.5px solid var(--sep)",
        padding: "10px 16px 12px",
      }}>
        <div style={{
          background: "rgba(122,82,48,.1)", borderRadius: 12,
          display: "flex", alignItems: "center", padding: "8px 12px",
          gap: 8, marginBottom: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" stroke="var(--text)" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm công thức, nguyên liệu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, border: "none", background: "none",
              fontSize: 15, outline: "none", color: "var(--text)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--text2)", padding: 0 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Multi-select filter pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {/* "Tất cả" resets */}
          <button
            onClick={() => toggleFilter("Tất cả")}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              border: active.size === 0 ? "1.5px solid var(--primary)" : "1.5px solid var(--sep)",
              background: active.size === 0 ? "var(--primary)" : "var(--card)",
              color: active.size === 0 ? "#fff" : "var(--text2)",
              transition: "all .15s",
            }}
          >
            Tất cả
          </button>
          {FILTERS.filter((f) => f !== "Tất cả").map((f) => {
            const on = active.has(f);
            return (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: 20,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  border: on ? "1.5px solid var(--primary)" : "1.5px solid var(--sep)",
                  background: on ? "var(--primary)" : "var(--card)",
                  color: on ? "#fff" : "var(--text2)",
                  transition: "all .15s",
                }}
              >
                {on ? `✓ ${f}` : f}
              </button>
            );
          })}
        </div>

        {/* Active filter summary */}
        {active.size > 0 && (
          <p style={{ fontSize: 11, color: "var(--text2)", marginTop: 6, fontWeight: 600 }}>
            Lọc: {[...active].join(" + ")} · {results.length} kết quả
          </p>
        )}
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px" }}>
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text2)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Không tìm thấy công thức</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Thử từ khoá khác nhé</p>
          </div>
        ) : (
          <>
            {active.size === 0 && (
              <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, fontWeight: 600 }}>
                {results.length} công thức
              </p>
            )}
            {results.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--card)", borderRadius: 16,
                  display: "flex", alignItems: "center", gap: 14, padding: 12,
                  marginBottom: 10, border: "1px solid var(--sep)",
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                    background: r.bg, display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 36,
                  }}>
                    {r.e}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {r.n}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 5 }}>
                      <strong style={{ color: "var(--primary)" }}>{r.cal} kcal</strong>
                      {" · "}P {r.p}g · C {r.c}g · F {r.f}g
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <GoalTag tag={r.g} />
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>⏱ {r.t} phút</span>
                    </div>
                  </div>

                  <span style={{ color: "#C7C7CC", fontSize: 22, flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Đang tải...</div>}>
      <RecipesContent />
    </Suspense>
  );
}
