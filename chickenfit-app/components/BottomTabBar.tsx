"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Trang chủ",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          fill={active ? "var(--primary)" : "#8E8E93"}
        />
        <path
          d="M9 21V12h6v9"
          fill={active ? "var(--primary-dark)" : "#6E6E73"}
        />
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: "Công thức",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" fill={active ? "var(--primary)" : "#8E8E93"} />
        <rect x="7" y="7" width="10" height="1.5" rx="0.75" fill={active ? "#fff" : "#C7C7CC"} />
        <rect x="7" y="11" width="8" height="1.5" rx="0.75" fill={active ? "#fff" : "#C7C7CC"} />
        <rect x="7" y="15" width="6" height="1.5" rx="0.75" fill={active ? "#fff" : "#C7C7CC"} />
      </svg>
    ),
  },
  {
    href: "/plan",
    label: "Kế hoạch",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="2" fill={active ? "var(--primary)" : "#8E8E93"} />
        <rect x="8" y="2" width="2" height="4" rx="1" fill={active ? "var(--primary-dark)" : "#6E6E73"} />
        <rect x="14" y="2" width="2" height="4" rx="1" fill={active ? "var(--primary-dark)" : "#6E6E73"} />
        <rect x="3" y="9" width="18" height="1.5" fill={active ? "var(--primary-dark)" : "#C7C7CC"} />
        <rect x="7" y="13" width="2" height="2" rx="0.5" fill={active ? "#fff" : "#C7C7CC"} />
        <rect x="11" y="13" width="2" height="2" rx="0.5" fill={active ? "#fff" : "#C7C7CC"} />
        <rect x="15" y="13" width="2" height="2" rx="0.5" fill={active ? "#fff" : "#C7C7CC"} />
        <rect x="7" y="17" width="2" height="2" rx="0.5" fill={active ? "#fff" : "#C7C7CC"} />
        <rect x="11" y="17" width="2" height="2" rx="0.5" fill={active ? "#fff" : "#C7C7CC"} />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Tiến trình",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={active ? "var(--primary)" : "#8E8E93"} />
        <polyline
          points="5,17 9,11 13,14 19,7"
          stroke={active ? "#fff" : "#C7C7CC"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    href: "/me",
    label: "Tôi",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill={active ? "var(--primary)" : "#8E8E93"} />
        <path
          d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
          stroke={active ? "var(--primary)" : "#8E8E93"}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  if (pathname === "/onboarding") return null;

  return (
    <nav
      className="flex-shrink-0"
      style={{
        height: "var(--tab-h)",
        background: "rgba(255,253,248,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid var(--sep)",
        display: "flex",
        paddingBottom: "20px",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              paddingTop: "8px",
              textDecoration: "none",
            }}
          >
            {tab.icon(active)}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: active ? "var(--primary)" : "#8E8E93",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
