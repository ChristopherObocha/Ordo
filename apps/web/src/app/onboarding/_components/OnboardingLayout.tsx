"use client";
import { C, SANS, SERIF } from "./shared";

const FEATURES = [
  { icon: "☰",  title: "Rota Grid",        desc: "Drag-and-drop scheduling" },
  { icon: "⛪", title: "Multi-church",     desc: "Main and satellite churches" },
  { icon: "⊕",  title: "Liturgical-aware", desc: "Feast days and seasons" },
  { icon: "⟲",  title: "Rule checking",    desc: "Conflict detection" },
];

const PHASE_LABELS = ["Setup", "Import", "Generate"];

export function OnboardingLayout({
  children,
  phase,  // 0=setup, 1=import, 2=generate
}: {
  children: React.ReactNode;
  phase: number;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Dark sidebar */}
      <div style={{
        width: 280, background: C.navBg, color: "#fff", flexShrink: 0,
        display: "flex", flexDirection: "column", padding: "48px 36px",
      }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, marginBottom: 4 }}>Ordo</div>
          <div style={{ fontSize: 13, opacity: 0.5, fontFamily: SANS }}>Clergy Scheduling</div>
        </div>

        {/* Phase stepper */}
        <div style={{ marginBottom: 40 }}>
          {PHASE_LABELS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                background: i < phase ? "var(--ordo-success)" : i === phase ? "#fff" : "transparent",
                border: i < phase ? "none" : i === phase ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, fontFamily: SANS,
                color: i < phase ? "#fff" : i === phase ? C.navBg : "rgba(255,255,255,0.35)",
                transition: "all 0.3s",
              }}>
                {i < phase ? "✓" : i + 1}
              </div>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: i === phase ? 600 : 400, fontFamily: SANS,
                  color: i === phase ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "color 0.3s",
                }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 16, opacity: 0.5, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, fontFamily: SANS, opacity: 0.8 }}>{f.title}</div>
                <div style={{ fontSize: 11, opacity: 0.4, lineHeight: 1.5, fontFamily: SANS }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, opacity: 0.25, fontFamily: SANS }}>Ordo · Clergy Scheduling</div>
      </div>

      {/* Right content panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 80px", background: C.bg, overflow: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
