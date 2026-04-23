"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
  C, SANS,
  OInput, OSelect, Field, StepHeader, StepNav, OButton,
} from "./shared";

type ClergyType = "bishop" | "priest" | "deacon" | "religious" | "sister";

type Props = {
  parishId: string;
  currentUserName: string;
  currentUserClergyType: ClergyType;
  onNext: () => void;
  onBack: () => void;
};

type ClergyRow = {
  id: string;
  name: string;
  type: ClergyType;
  roles: string;  // comma-separated; split on save
};

const CLERGY_TYPE_OPTIONS = [
  { value: "bishop",    label: "Bishop" },
  { value: "priest",    label: "Priest" },
  { value: "deacon",    label: "Deacon" },
  { value: "religious", label: "Religious" },
  { value: "sister",    label: "Sister" },
];

const TYPE_HINT: Record<ClergyType, string> = {
  bishop:   "e.g. Bishop [name]",
  priest:   "e.g. Fr. [name]",
  deacon:   "e.g. Deacon [name]",
  religious:"e.g. Br. [name]",
  sister:   "e.g. Sr. [name]",
};

let _counter = 0;
function uid() { return `clergy-${++_counter}-${Math.random().toString(36).slice(2)}`; }

export function StepClergy({
  parishId,
  currentUserName,
  currentUserClergyType,
  onNext,
  onBack,
}: Props) {
  const [rows, setRows] = useState<ClergyRow[]>([]);
  const [saving, setSaving] = useState(false);
  const addDuringOnboarding = useMutation(api.clergy.addDuringOnboarding);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: uid(), name: "", type: "priest", roles: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<ClergyRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      for (const row of rows.filter((r) => r.name.trim())) {
        await addDuringOnboarding({
          parishId: parishId as Id<"parishes">,
          name: row.name.trim(),
          type: row.type,
          roles: row.roles.split(",").map((s) => s.trim()).filter(Boolean),
        });
      }
      onNext();
    } finally {
      setSaving(false);
    }
  };

  const divider: React.CSSProperties = {
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 16,
    marginBottom: 16,
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Add your clergy"
        subtitle="Add the clergy who serve in your parish. You can invite them by email from the Clergy screen later."
      />

      {/* Current user row — locked */}
      <div style={divider}>
        <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, opacity: 0.6 }}>
            <Field label="Name">
              <OInput value={currentUserName} onChange={() => {}} disabled />
            </Field>
          </div>
          <div style={{ flex: 1, opacity: 0.6 }}>
            <Field label="Type">
              <OSelect
                value={currentUserClergyType}
                onChange={() => {}}
                options={CLERGY_TYPE_OPTIONS}
                disabled
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Roles">
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  fontFamily: SANS, fontSize: 12, fontWeight: 600,
                  color: C.primary, background: "rgba(var(--ordo-primary-rgb, 79,70,229),0.08)",
                  borderRadius: 4, padding: "4px 8px", letterSpacing: "0.04em",
                  opacity: 0.8, whiteSpace: "nowrap",
                }}>
                  You
                </div>
              </div>
            </Field>
          </div>
          {/* placeholder to align with remove buttons */}
          <div style={{ width: 30, flexShrink: 0 }} />
        </div>
      </div>

      {/* Additional clergy rows */}
      {rows.map((row) => (
        <div
          key={row.id}
          className="ordo-expand-down"
          style={divider}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Field label="Name">
                <OInput
                  value={row.name}
                  onChange={(v) => updateRow(row.id, { name: v })}
                  placeholder="Full name"
                />
              </Field>
              {/* Prefix hint */}
              {row.type && (
                <div style={{
                  fontFamily: SANS, fontSize: 11, color: C.muted,
                  marginTop: 4, opacity: 0.75,
                }}>
                  {TYPE_HINT[row.type]}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Type">
                <OSelect
                  value={row.type}
                  onChange={(v) => updateRow(row.id, { type: v as ClergyType })}
                  options={CLERGY_TYPE_OPTIONS}
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Roles">
                <OInput
                  value={row.roles}
                  onChange={(v) => updateRow(row.id, { roles: v })}
                  placeholder="e.g. music, youth"
                />
              </Field>
            </div>
            <button
              onClick={() => removeRow(row.id)}
              aria-label="Remove clergy member"
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
        </div>
      ))}

      <OButton variant="ghost" onClick={addRow}>
        Add another clergy member +
      </OButton>

      <StepNav
        onNext={handleNext}
        onBack={onBack}
        canNext={true}
        loading={saving}
        nextLabel="Continue →"
      />
    </div>
  );
}
