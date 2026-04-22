"use client";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  bg:         "var(--ordo-bg)",
  surface:    "var(--ordo-surface)",
  surface2:   "var(--ordo-surface2)",
  border:     "var(--ordo-border)",
  border2:    "var(--ordo-border2)",
  text:       "var(--ordo-text)",
  muted:      "var(--ordo-muted)",
  faint:      "var(--ordo-faint)",
  primary:    "var(--ordo-primary)",
  primaryHover: "var(--ordo-primary-hover)",
  success:    "var(--ordo-success)",
  successBg:  "var(--ordo-success-bg)",
  warning:    "var(--ordo-warning)",
  warningBg:  "var(--ordo-warning-bg)",
  danger:     "var(--ordo-danger)",
  dangerBg:   "var(--ordo-danger-bg)",
  navBg:      "var(--ordo-nav-bg)",
};

export const SANS  = "var(--font-dm-sans), sans-serif";
export const SERIF = "var(--font-eb-garamond), Georgia, serif";

// ─── Shared component types ────────────────────────────────────────────────────
export type StepProps = {
  onNext: () => void;
  onBack?: () => void;
};

// ─── OInput ───────────────────────────────────────────────────────────────────
export function OInput({
  value, onChange, placeholder, type = "text", disabled = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        fontFamily: SANS, fontSize: 14, color: C.text,
        background: disabled ? C.surface2 : C.surface,
        border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box",
        opacity: disabled ? 0.7 : 1,
      }}
    />
  );
}

// ─── OSelect ──────────────────────────────────────────────────────────────────
export function OSelect({
  value, onChange, options, disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        fontFamily: SANS, fontSize: 14, color: C.text,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: "9px 12px", outline: "none",
        cursor: disabled ? "not-allowed" : "pointer", width: "100%",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── OButton ──────────────────────────────────────────────────────────────────
export function OButton({
  onClick, disabled = false, loading = false, children, variant = "primary", fullWidth = false,
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; variant?: "primary" | "ghost"; fullWidth?: boolean;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        fontFamily: SANS, fontSize: 14, fontWeight: 500,
        padding: "10px 24px", borderRadius: 6, border: isPrimary ? "none" : "none",
        background: isPrimary ? C.primary : "none",
        color: isPrimary ? "#fff" : C.muted,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        display: "inline-flex", alignItems: "center", gap: 8,
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
        transition: "opacity 0.15s",
      }}
    >
      {loading && (
        <span style={{
          display: "inline-block", width: 13, height: 13, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
          animation: "spin 0.7s linear infinite",
        }} />
      )}
      {children}
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        fontSize: 11, fontWeight: 600, color: C.muted, display: "block",
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
        fontFamily: SANS,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── StepHeader ───────────────────────────────────────────────────────────────
export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        margin: "0 0 6px", fontFamily: SERIF, fontSize: 28,
        fontWeight: 500, color: C.text, lineHeight: 1.2,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, color: C.muted, fontSize: 14, fontFamily: SANS, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── StepNav ──────────────────────────────────────────────────────────────────
export function StepNav({
  onNext, onBack, nextLabel = "Continue →", canNext = true, loading = false,
}: {
  onNext: () => void; onBack?: () => void;
  nextLabel?: string; canNext?: boolean; loading?: boolean;
}) {
  return (
    <div style={{ marginTop: 36, display: "flex", gap: 10, alignItems: "center" }}>
      <OButton onClick={onNext} disabled={!canNext} loading={loading} fullWidth={!onBack}>
        {nextLabel}
      </OButton>
      {onBack && (
        <OButton onClick={onBack} variant="ghost">← Back</OButton>
      )}
    </div>
  );
}
