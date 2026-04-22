"use client";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";

const NAV = [
  { href: "/dashboard/rota",       label: "Rota Grid",   icon: "☰" },
  { href: "/dashboard/clergy",     label: "Clergy",      icon: "✦" },
  { href: "/dashboard/activities", label: "Activities",  icon: "⊞" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parish = useQuery(api.parishes.getMyParish);
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);

  const navW = collapsed ? 52 : 216;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        style={{
          width: navW,
          flexShrink: 0,
          background: "var(--ordo-nav-bg)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            padding: collapsed ? "16px 0" : "18px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            background: "none",
            border: "none",
            borderBottom: "1px solid #2A2926",
            width: "100%",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--ordo-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-eb-garamond), Georgia, serif",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--ordo-text)",
              }}
            >
              O
            </span>
          </div>
          {!collapsed && (
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--font-eb-garamond), Georgia, serif",
                  fontSize: 17,
                  fontWeight: 500,
                  color: "#F8F7F3",
                  lineHeight: 1.2,
                }}
              >
                Ordo
              </div>
              <div style={{ fontSize: 10, color: "#6B6860" }}>
                {parish?.name ?? "Loading…"}
              </div>
            </div>
          )}
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "10px 0" : "9px 16px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    cursor: "pointer",
                    background: active ? "#2A2926" : "transparent",
                    color: active ? "#F8F7F3" : "#8A8680",
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    borderLeft: active ? "3px solid #E8E3CC" : "3px solid transparent",
                    transition: "all 0.12s",
                    userSelect: "none",
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #2A2926",
            }}
          >
            {parish && (
              <div style={{ fontSize: 11, color: "#4A4844", marginBottom: 8 }}>
                {parish.diocese ?? "Diocese"}
              </div>
            )}
            <button
              onClick={() => signOut()}
              style={{
                fontSize: 11,
                color: "#3A3834",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
