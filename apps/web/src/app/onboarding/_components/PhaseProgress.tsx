"use client";
import { C, SANS } from "./shared";

export function PhaseProgress({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < currentStep ? "var(--ordo-success)" : i === currentStep ? C.primary : C.border,
              color: i <= currentStep ? "#fff" : C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, fontFamily: SANS, transition: "all 0.25s",
            }}>
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: i === currentStep ? 600 : 400,
              color: i === currentStep ? C.text : C.faint,
              fontFamily: SANS, whiteSpace: "nowrap",
            }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 1.5,
              background: i < currentStep ? "var(--ordo-success)" : C.border,
              margin: "0 6px", marginBottom: 18, transition: "background 0.3s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
