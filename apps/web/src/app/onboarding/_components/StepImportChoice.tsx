"use client";
import { useState } from "react";
import { C, SANS, SERIF, OButton, StepHeader } from "./shared";

type Props = {
  onChooseICal: () => void;
  onChooseManual: () => void;
  onBack: () => void;
};

export function StepImportChoice({ onChooseICal, onChooseManual, onBack }: Props) {
  const [hoveredCard, setHoveredCard] = useState<"ical" | "manual" | null>(null);

  const cardStyle = (id: "ical" | "manual"): React.CSSProperties => ({
    flex: 1,
    border: `1px solid ${hoveredCard === id ? C.primary : C.border}`,
    borderRadius: 10,
    padding: "24px 20px",
    background: C.surface,
    cursor: "pointer",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxShadow: hoveredCard === id
      ? `0 0 0 3px rgba(var(--ordo-primary-rgb, 79,70,229),0.12)`
      : "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  });

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Import your services"
        subtitle="Choose how to bring in your existing Mass and service schedule."
      />

      <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
        {/* iCal card */}
        <div
          style={cardStyle("ical")}
          onClick={onChooseICal}
          onMouseEnter={() => setHoveredCard("ical")}
          onMouseLeave={() => setHoveredCard(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onChooseICal()}
        >
          <div style={{ fontSize: 32 }}>📅</div>
          <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.text }}>
            Connect iCal
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
            Paste a calendar URL from Google Calendar, Apple Calendar, or any iCal-compatible source.
          </div>
        </div>

        {/* Manual card */}
        <div
          style={cardStyle("manual")}
          onClick={onChooseManual}
          onMouseEnter={() => setHoveredCard("manual")}
          onMouseLeave={() => setHoveredCard(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onChooseManual()}
        >
          <div style={{ fontSize: 32 }}>✏️</div>
          <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: C.text }}>
            Enter manually
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
            Add your Masses and services by hand. Takes about 2 minutes.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <OButton variant="ghost" onClick={onBack}>← Back</OButton>
      </div>
    </div>
  );
}
