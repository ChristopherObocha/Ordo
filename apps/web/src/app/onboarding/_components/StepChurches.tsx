"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
  C, SANS,
  OInput, OSelect, Field, StepHeader, StepNav, OButton,
} from "./shared";

type Props = {
  parishId: string;
  parishName: string;
  onNext: (mainChurchName: string) => void;
  onBack: () => void;
};

type SatelliteInput = {
  id: string;
  name: string;
  type: "outstation" | "chapel" | "oratory";
};

const SATELLITE_TYPE_OPTIONS = [
  { value: "outstation", label: "Outstation" },
  { value: "chapel",     label: "Chapel" },
  { value: "oratory",    label: "Oratory" },
];

let _counter = 0;
function uid() { return `sat-${++_counter}-${Math.random().toString(36).slice(2)}`; }

export function StepChurches({ parishId, parishName, onNext, onBack }: Props) {
  const [mainChurchName, setMainChurchName] = useState(parishName);
  const [satellites, setSatellites] = useState<SatelliteInput[]>([]);
  const [saving, setSaving] = useState(false);
  const createChurch = useMutation(api.churches.create);

  const addSatellite = () => {
    setSatellites((prev) => [
      ...prev,
      { id: uid(), name: "", type: "chapel" },
    ]);
  };

  const removeSatellite = (id: string) => {
    setSatellites((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSatellite = (id: string, patch: Partial<SatelliteInput>) => {
    setSatellites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      for (const sat of satellites.filter((s) => s.name.trim())) {
        await createChurch({
          parishId: parishId as Id<"parishes">,
          name: sat.name.trim(),
          type: sat.type,
          isMain: false,
        });
      }
      onNext(mainChurchName);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Your churches"
        subtitle="Confirm your main church and add any satellite locations."
      />

      {/* Main church card */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.muted,
          fontFamily: SANS, textTransform: "uppercase",
          letterSpacing: "0.06em", marginBottom: 12,
        }}>
          Main church
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Field label="Name">
              <OInput
                value={mainChurchName}
                onChange={setMainChurchName}
                placeholder="e.g. St. Mary's"
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Type">
              <div style={{
                fontFamily: SANS, fontSize: 14, color: C.muted,
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "9px 12px",
                opacity: 0.7,
              }}>
                Parish Church
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* Satellite churches */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.muted, fontFamily: SANS,
          textTransform: "uppercase", letterSpacing: "0.06em",
          marginBottom: satellites.length > 0 ? 12 : 0,
        }}>
          Satellite churches
        </div>

        {satellites.map((sat) => (
          <div
            key={sat.id}
            className="ordo-expand-down"
            style={{
              display: "flex", flexDirection: "row", gap: 12,
              alignItems: "flex-end", marginBottom: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <Field label="Name">
                <OInput
                  value={sat.name}
                  onChange={(v) => updateSatellite(sat.id, { name: v })}
                  placeholder="e.g. St. Anne's Chapel"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Type">
                <OSelect
                  value={sat.type}
                  onChange={(v) => updateSatellite(sat.id, { type: v as SatelliteInput["type"] })}
                  options={SATELLITE_TYPE_OPTIONS}
                />
              </Field>
            </div>
            <button
              onClick={() => removeSatellite(sat.id)}
              aria-label="Remove satellite church"
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

      <OButton variant="ghost" onClick={addSatellite}>
        Add satellite church +
      </OButton>

      <StepNav
        onNext={handleNext}
        onBack={onBack}
        canNext={mainChurchName.trim().length > 0}
        loading={saving}
        nextLabel="Continue →"
      />
    </div>
  );
}
