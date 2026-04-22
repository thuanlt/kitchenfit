"use client";

import React, { useState } from "react";
import { useToggleLocalStorage } from "../../lib/useLocalStorage";

interface ToggleProps {
  storageKey: string;
  onEnable?: () => Promise<boolean>;
  defaultValue?: boolean;
}

/**
 * Improved Toggle component with proper localStorage handling
 * - Uses custom hook for SSR safety
 * - Syncs across tabs
 * - Handles errors gracefully
 */
export function Toggle({ storageKey, onEnable, defaultValue = false }: ToggleProps) {
  const [on, setOn] = useToggleLocalStorage(storageKey, defaultValue);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !on;
    
    if (next && onEnable) {
      setBusy(true);
      try {
        const granted = await onEnable();
        if (!granted) {
          setBusy(false);
          return; // Don't toggle if permission denied
        }
      } catch (error) {
        console.error("Error enabling feature:", error);
        setBusy(false);
        return; // Don't toggle on error
      }
      setBusy(false);
    }
    
    setOn(next);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        border: "none",
        cursor: busy ? "wait" : "pointer",
        background: on ? "var(--primary)" : "#D1D1D6",
        position: "relative",
        transition: "background .2s",
        flexShrink: 0,
        opacity: busy ? 0.7 : 1,
      }}
      aria-pressed={on}
      aria-label={on ? "Bật" : "Tắt"}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          display: "block",
        }}
      />
    </button>
  );
}