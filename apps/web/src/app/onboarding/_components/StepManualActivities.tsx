"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { C, SANS, OInput, OSelect, Field, StepHeader, StepNav, OButton } from "./shared";

type ActivityRow = {
  id: string;
  name: string;
  type: "mass" | "confessions" | "exposition" | "evening_prayer" | "baptism" | "vespers" | "other";
  schedule: "weekday" | "saturday" | "sunday" | "vigil" | "specific";
  time: string;
};

type Props = {
  parishId: string;
  mainChurchId: string;
  onNext: () => void;
  onBack: () => void;
};

const TYPE_OPTIONS = [
  { value: "mass",          label: "Mass" },
  { value: "confessions",   label: "Confessions" },
  { value: "exposition",    label: "Exposition" },
  { value: "evening_prayer",label: "Evening Prayer" },
  { value: "baptism",       label: "Baptism" },
  { value: "vespers",       label: "Vespers" },
  { value: "other",         label: "Other" },
];

const SCHEDULE_OPTIONS = [
  { value: "weekday",  label: "Weekday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday",   label: "Sunday" },
  { value: "vigil",    label: "Vigil" },
];

let _counter = 2;
function uid() { return `activity-${++_counter}-${Math.random().toString(36).slice(2)}`; }

const DEFAULT_ROWS: ActivityRow[] = [
  { id: "1", name: "Sunday Mass",        type: "mass", schedule: "sunday", time: "10:00" },
  { id: "2", name: "Saturday Vigil Mass", type: "mass", schedule: "vigil",  time: "18:00" },
];

export function StepManualActivities({ parishId, mainChurchId, onNext, onBack }: Props) {
  const [rows, setRows] = useState<ActivityRow[]>(DEFAULT_ROWS);
  const [saving, setSaving] = useState(false);

  const createActivity = useMutation(api.activities.create);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: uid(), name: "", type: "mass", schedule: "sunday", time: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<ActivityRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      for (const row of rows.filter((r) => r.name.trim())) {
        await createActivity({
          parishId: parishId as Id<"parishes">,
          churchId: mainChurchId as Id<"churches">,
          type: row.type,
          name: row.name.trim(),
          schedule: row.schedule,
          time: row.time || "09:00",
          isVigil: row.schedule === "vigil",
          requiredClergyCount: 1,
          requiredRoles: [],
        });
      }
      onNext();
    } finally {
      setSaving(false);
    }
  };

  const rowCardStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Enter your services"
        subtitle="Add the regular services you'd like to schedule. You can edit these later."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row) => (
          <div key={row.id} className="ordo-expand-down" style={rowCardStyle}>
            {/* Name */}
            <div style={{ flex: 2 }}>
              <Field label="Service name">
                <OInput
                  value={row.name}
                  onChange={(v) => updateRow(row.id, { name: v })}
                  placeholder="e.g. Sunday Mass"
                />
              </Field>
            </div>

            {/* Type */}
            <div style={{ flex: 1 }}>
              <Field label="Type">
                <OSelect
                  value={row.type}
                  onChange={(v) => updateRow(row.id, { type: v as ActivityRow["type"] })}
                  options={TYPE_OPTIONS}
                />
              </Field>
            </div>

            {/* Schedule */}
            <div style={{ flex: 1 }}>
              <Field label="Schedule">
                <OSelect
                  value={row.schedule}
                  onChange={(v) => updateRow(row.id, { schedule: v as ActivityRow["schedule"] })}
                  options={SCHEDULE_OPTIONS}
                />
              </Field>
            </div>

            {/* Time */}
            <div style={{ flex: 0.8 }}>
              <Field label="Time">
                <OInput
                  value={row.time}
                  onChange={(v) => updateRow(row.id, { time: v })}
                  placeholder="HH:MM"
                />
              </Field>
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeRow(row.id)}
              aria-label="Remove service"
              style={{
                fontFamily: SANS, fontSize: 18, color: C.muted,
                background: "none", border: "none", cursor: "pointer",
                padding: "9px 6px", lineHeight: 1, marginBottom: 1,
                opacity: 0.7, flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <OButton variant="ghost" onClick={addRow}>
          Add another service +
        </OButton>
      </div>

      <StepNav
        onNext={handleNext}
        onBack={onBack}
        canNext={rows.length > 0}
        loading={saving}
        nextLabel="Continue →"
      />
    </div>
  );
}
