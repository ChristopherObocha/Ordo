"use client";

import { C, SANS, SERIF, StepHeader, StepNav } from "./shared";
import { MonthlyRotaGrid, type Slot } from "./MonthlyRotaGrid";

type RangeKey = "1m" | "3m" | "6m" | "eoy";

type Props = {
  parishId: string;
  rotaId?: string;
  violationCount: number;
  onNext: () => void;
  onBack: () => void;
  onRangeChange: (range: RangeKey) => void;
  currentRange: RangeKey;
  slots: Slot[];
  startDate: string;
  endDate: string;
  loading: boolean;
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "1m",  label: "1 month" },
  { key: "3m",  label: "3 months" },
  { key: "6m",  label: "6 months" },
  { key: "eoy", label: "End of year" },
];

export function StepPreviewRota({
  violationCount,
  onNext,
  onBack,
  onRangeChange,
  currentRange,
  slots,
  startDate,
  endDate,
  loading,
}: Props) {
  return (
    <div className="ordo-slide-in" style={{ fontFamily: SANS }}>
      <StepHeader
        title="Your rota preview"
        subtitle="Review and adjust assignments before finalising."
      />

      {/* Date range toggle */}
      <div style={{
        display: "flex",
        gap: 4,
        marginBottom: 24,
        background: C.surface2,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: 4,
        width: "fit-content",
      }}>
        {RANGE_OPTIONS.map(({ key, label }) => {
          const active = currentRange === key;
          return (
            <button
              key={key}
              onClick={() => onRangeChange(key)}
              style={{
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: active ? C.primary : "transparent",
                color: active ? "#fff" : C.muted,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      {loading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          gap: 16,
        }}>
          <span style={{
            fontSize: 40,
            color: C.primary,
            animation: "pulse 1.4s ease-in-out infinite",
            display: "inline-block",
          }}>
            ✛
          </span>
          <p style={{
            fontFamily: SERIF,
            fontSize: 16,
            color: C.muted,
            margin: 0,
          }}>
            Generating your rota…
          </p>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(0.88); }
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* Violation banner */}
          {violationCount > 0 && (
            <div style={{
              background: C.warningBg,
              border: `1px solid ${C.warning}40`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
              <p style={{
                fontFamily: SANS,
                fontSize: 13,
                color: C.text,
                margin: 0,
                lineHeight: 1.5,
              }}>
                <strong>{violationCount} slot{violationCount !== 1 ? "s" : ""} could not be assigned</strong>
                {" "}— no eligible priest available. You can assign them manually from the rota screen.
              </p>
            </div>
          )}

          <MonthlyRotaGrid
            slots={slots}
            startDate={startDate}
            endDate={endDate}
          />
        </>
      )}

      <StepNav
        onNext={onNext}
        onBack={onBack}
        nextLabel="Finalise →"
        canNext={!loading}
      />
    </div>
  );
}
