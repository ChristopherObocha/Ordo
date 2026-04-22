"use client";

import { useState } from "react";
import { C, SANS, OSelect, OButton, StepHeader, StepNav } from "./shared";

type Rule = {
  id: string;
  activityA: string;
  activityB: string;
  relation: "same" | "different";
};

type Props = {
  onNext: () => void;
  onBack: () => void;
};

const ACTIVITY_OPTIONS = [
  { value: "mass",        label: "Mass" },
  { value: "confession",  label: "Confession" },
  { value: "exposition",  label: "Exposition" },
  { value: "benediction", label: "Benediction" },
  { value: "baptism",     label: "Baptism" },
  { value: "funeral",     label: "Funeral" },
  { value: "wedding",     label: "Wedding" },
];

const RELATION_OPTIONS = [
  { value: "same",      label: "the same priest" },
  { value: "different", label: "a different priest" },
];

const DEFAULT_RULES = [
  "Each Mass requires 1 priest",
  "Each Confession requires 1 priest",
];

export function StepRules({ onNext, onBack }: Props) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{
    activityA: string;
    activityB: string;
    relation: "same" | "different";
  }>({ activityA: "mass", activityB: "confession", relation: "same" });

  function addRule() {
    setRules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...draft },
    ]);
    setAdding(false);
    setDraft({ activityA: "mass", activityB: "confession", relation: "same" });
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="ordo-slide-in" style={{ fontFamily: SANS }}>
      {/* Skip link top-right */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button
          onClick={onNext}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: C.muted,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Skip for now →
        </button>
      </div>

      <StepHeader
        title="Scheduling rules"
        subtitle="Optional. Default rules (Mass and Confession each require one priest) are already applied."
      />

      {/* Default locked rules */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Default rules
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DEFAULT_RULES.map((rule) => (
            <div
              key={rule}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: "5px 12px",
                fontSize: 13,
                color: C.muted,
                fontFamily: SANS,
              }}
            >
              <span style={{ fontSize: 12 }}>🔒</span>
              {rule}
            </div>
          ))}
        </div>
      </div>

      {/* User rules */}
      {rules.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Your rules
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {rules.map((rule) => {
              const labelA = ACTIVITY_OPTIONS.find((o) => o.value === rule.activityA)?.label ?? rule.activityA;
              const labelB = ACTIVITY_OPTIONS.find((o) => o.value === rule.activityB)?.label ?? rule.activityB;
              const relLabel = rule.relation === "same" ? "same priest" : "different priest";
              return (
                <div
                  key={rule.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: `${C.primary}12`,
                    border: `1px solid ${C.primary}30`,
                    borderRadius: 20,
                    padding: "5px 10px 5px 12px",
                    fontSize: 13,
                    color: C.text,
                    fontFamily: SANS,
                  }}
                >
                  {labelA} &amp; {labelB} → {relLabel}
                  <button
                    onClick={() => removeRule(rule.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      color: C.muted,
                      padding: "0 2px",
                      lineHeight: 1,
                    }}
                    title="Remove rule"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add rule builder */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: C.primary,
            background: "none",
            border: `1px dashed ${C.border}`,
            borderRadius: 6,
            cursor: "pointer",
            padding: "8px 16px",
            marginBottom: 8,
          }}
        >
          + Add a rule
        </button>
      ) : (
        <div style={{
          background: C.surface2,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "16px",
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", fontFamily: SANS }}>
            New rule
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: C.text,
          }}>
            <div style={{ minWidth: 140 }}>
              <OSelect
                value={draft.activityA}
                onChange={(v) => setDraft((d) => ({ ...d, activityA: v }))}
                options={ACTIVITY_OPTIONS}
              />
            </div>
            <span style={{ fontFamily: SANS, color: C.muted }}>and</span>
            <div style={{ minWidth: 140 }}>
              <OSelect
                value={draft.activityB}
                onChange={(v) => setDraft((d) => ({ ...d, activityB: v }))}
                options={ACTIVITY_OPTIONS}
              />
            </div>
            <span style={{ fontFamily: SANS, color: C.muted }}>must be assigned to</span>
            <div style={{ minWidth: 160 }}>
              <OSelect
                value={draft.relation}
                onChange={(v) => setDraft((d) => ({ ...d, relation: v as "same" | "different" }))}
                options={RELATION_OPTIONS}
              />
            </div>
            <OButton onClick={addRule} variant="primary">
              Add
            </OButton>
            <OButton onClick={() => setAdding(false)} variant="ghost">
              Cancel
            </OButton>
          </div>
        </div>
      )}

      <StepNav
        onNext={onNext}
        onBack={onBack}
        nextLabel="Generate rota →"
        canNext={true}
      />
    </div>
  );
}
