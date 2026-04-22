"use client";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";

const C = {
  bg:       "var(--ordo-bg)",
  surface:  "var(--ordo-surface)",
  surface2: "var(--ordo-surface2)",
  border:   "var(--ordo-border)",
  text:     "var(--ordo-text)",
  muted:    "var(--ordo-muted)",
  faint:    "var(--ordo-faint)",
  primary:  "var(--ordo-primary)",
  success:  "var(--ordo-success)",
  successBg:"var(--ordo-success-bg)",
};

const SANS  = "var(--font-dm-sans), sans-serif";
const SERIF = "var(--font-eb-garamond), Georgia, serif";

const PARISH_TYPES = [
  { value: "parish",    label: "Parish" },
  { value: "cathedral", label: "Cathedral" },
  { value: "abbey",     label: "Abbey" },
  { value: "seminary",  label: "Seminary" },
  { value: "chaplaincy",label: "Chaplaincy" },
  { value: "shrine",    label: "Shrine" },
] as const;

const COUNTRIES = ["England & Wales", "Scotland", "Ireland", "United States", "Other"];

const STEPS = ["Parish", "Parish Priest", "Calendar", "Generate"];

const FEATURES = [
  { icon: "☰",  title: "Rota Grid",        desc: "Drag-and-drop weekly schedule" },
  { icon: "⛪", title: "Multi-church",     desc: "Main and satellite churches" },
  { icon: "⊕",  title: "Liturgical-aware", desc: "Feast days and season colours" },
  { icon: "⟲",  title: "Rule checking",    desc: "Conflict detection built-in" },
];

function OInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontFamily: SANS,
        fontSize: 14,
        color: C.text,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "9px 12px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
      }}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: C.muted,
          display: "block",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontFamily: SANS,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: i < step ? C.success : i === step ? C.primary : C.border,
                color: i <= step ? "#fff" : C.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: SANS,
                transition: "all 0.2s",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: i === step ? 600 : 400,
                color: i === step ? C.text : C.muted,
                fontFamily: SANS,
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: i < step ? C.success : C.border,
                margin: "0 4px",
                marginBottom: 22,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const createParish = useMutation(api.parishes.create);

  const [step,         setStep]         = useState(0);
  const [parish,       setParish]       = useState({ name: "", diocese: "", type: "parish" as typeof PARISH_TYPES[number]["value"], country: "England & Wales" });
  const [calConnected, setCalConnected] = useState(false);
  const [calLoading,   setCalLoading]   = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [complete,     setComplete]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  const canNext = [
    parish.name.trim() !== "" && parish.diocese.trim() !== "",
    true,
    true,
    true,
  ][step];

  const handleFinish = async () => {
    if (!parish.name.trim()) {
      setError("Parish name is required");
      return;
    }
    setGenerating(true);
    setSubmitting(true);
    setError("");
    try {
      await createParish({
        name:     parish.name.trim(),
        type:     parish.type,
        diocese:  parish.diocese.trim() || undefined,
        locale:   "en-GB",
        timezone: "Europe/London",
      });
      setTimeout(() => {
        setGenerating(false);
        setComplete(true);
      }, 1600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setGenerating(false);
      setSubmitting(false);
    }
  };

  if (complete) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 20,
          padding: 40,
          textAlign: "center",
          background: C.bg,
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: C.successBg,
            border: `2px solid ${C.success}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          ✓
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 28,
            fontWeight: 500,
            color: C.text,
          }}
        >
          {parish.name} is ready
        </h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 380 }}>
          Add your churches and activities, then build your first rota.
        </p>
        <button
          onClick={() => router.push("/dashboard/rota")}
          style={{
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: SANS,
            cursor: "pointer",
            border: "none",
            borderRadius: 6,
            background: C.primary,
            color: "#fff",
          }}
        >
          Open Rota Grid →
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Dark sidebar */}
      <div
        style={{
          width: 280,
          background: "#1E1D1A",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "48px 36px",
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, marginBottom: 4 }}>
            Ordo
          </div>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Clergy Scheduling</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 18, opacity: 0.65, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, fontFamily: SANS }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.5, fontFamily: SANS }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, opacity: 0.3, fontFamily: SANS }}>
          Ordo · Clergy Scheduling
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          overflow: "auto",
          background: C.bg,
        }}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>
          <ProgressBar step={step} />

          {/* Step 0: Parish */}
          {step === 0 && (
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: SERIF,
                  fontSize: 26,
                  fontWeight: 500,
                  color: C.text,
                }}
              >
                Set up your parish
              </h2>
              <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 14, fontFamily: SANS }}>
                You can add satellite churches and clergy after setup.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Parish name">
                  <OInput
                    value={parish.name}
                    onChange={(v) => setParish((p) => ({ ...p, name: v }))}
                    placeholder="e.g. St. Bartholomew's Parish"
                  />
                </Field>
                <Field label="Diocese">
                  <OInput
                    value={parish.diocese}
                    onChange={(v) => setParish((p) => ({ ...p, diocese: v }))}
                    placeholder="e.g. Diocese of Exeter"
                  />
                </Field>
                <Field label="Type">
                  <select
                    value={parish.type}
                    onChange={(e) => setParish((p) => ({ ...p, type: e.target.value as typeof parish.type }))}
                    style={{
                      fontFamily: SANS,
                      fontSize: 14,
                      color: C.text,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      outline: "none",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    {PARISH_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Country / Rite">
                  <select
                    value={parish.country}
                    onChange={(e) => setParish((p) => ({ ...p, country: e.target.value }))}
                    style={{
                      fontFamily: SANS,
                      fontSize: 14,
                      color: C.text,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      outline: "none",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* Step 1: Parish Priest */}
          {step === 1 && (
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: SERIF,
                  fontSize: 26,
                  fontWeight: 500,
                  color: C.text,
                }}
              >
                Your parish is set up
              </h2>
              <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 14, fontFamily: SANS }}>
                After completing setup, invite clergy from the Clergy screen. You can also add churches from Settings.
              </p>
              <div
                style={{
                  background: C.surface2,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[
                  ["Parish", parish.name || "—"],
                  ["Diocese", parish.diocese || "—"],
                  ["Type", parish.type],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "4px 0",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: SANS,
                    }}
                  >
                    <span style={{ color: C.muted }}>{label}</span>
                    <span style={{ color: C.text, fontWeight: 500, textTransform: "capitalize" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Calendar */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: SERIF,
                  fontSize: 26,
                  fontWeight: 500,
                  color: C.text,
                }}
              >
                Import from Google Calendar
              </h2>
              <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 14, fontFamily: SANS }}>
                Optionally import existing Mass times to pre-populate activities.
              </p>
              {!calConnected ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <button
                    onClick={() => {
                      setCalLoading(true);
                      setTimeout(() => {
                        setCalLoading(false);
                        setCalConnected(true);
                      }, 1500);
                    }}
                    disabled={calLoading}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 500,
                      fontFamily: SANS,
                      cursor: "pointer",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      background: C.surface,
                      color: C.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      opacity: calLoading ? 0.6 : 1,
                    }}
                  >
                    <span>📅</span>
                    {calLoading ? "Connecting…" : "Connect Google Calendar"}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      padding: "8px 0",
                      fontSize: 13,
                      fontFamily: SANS,
                      cursor: "pointer",
                      border: "none",
                      background: "none",
                      color: C.muted,
                      textAlign: "left",
                    }}
                  >
                    Skip this step →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div
                    style={{
                      background: C.successBg,
                      border: `1px solid ${C.success}40`,
                      borderRadius: 6,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ color: C.success }}>✓</span>
                    <span style={{ fontSize: 13, color: C.success, fontFamily: SANS }}>
                      Google Calendar connected
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, fontFamily: SANS, margin: 0 }}>
                    Found <strong style={{ color: C.text }}>recurring calendar events</strong> that can become activities.
                    You can refine them after setup.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontFamily: SERIF,
                  fontSize: 26,
                  fontWeight: 500,
                  color: C.text,
                }}
              >
                You&apos;re all set
              </h2>
              <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 14, fontFamily: SANS }}>
                Click below to create your parish. You&apos;ll land in the Rota Grid where you can start scheduling.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  ["Parish", parish.name || "—"],
                  ["Diocese", parish.diocese || "—"],
                  ["Calendar", calConnected ? "Connected" : "Skipped"],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: SANS,
                    }}
                  >
                    <span style={{ color: C.muted }}>{label}</span>
                    <span style={{ color: C.text, fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
              {error && (
                <p style={{ color: "var(--ordo-danger)", fontSize: 13, marginBottom: 12, fontFamily: SANS }}>
                  {error}
                </p>
              )}
              <button
                onClick={handleFinish}
                disabled={submitting}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: SANS,
                  cursor: submitting ? "not-allowed" : "pointer",
                  border: "none",
                  borderRadius: 6,
                  background: C.primary,
                  color: "#fff",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {generating ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Creating parish…
                  </>
                ) : (
                  "Create parish →"
                )}
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div style={{ marginTop: 32, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: SANS,
                  cursor: canNext ? "pointer" : "not-allowed",
                  border: "none",
                  borderRadius: 6,
                  background: C.primary,
                  color: "#fff",
                  opacity: canNext ? 1 : 0.4,
                }}
              >
                Continue →
              </button>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  style={{
                    padding: "10px 16px",
                    fontSize: 13,
                    fontFamily: SANS,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 6,
                    background: "none",
                    color: C.muted,
                  }}
                >
                  ← Back
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
