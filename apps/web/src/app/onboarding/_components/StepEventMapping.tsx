"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { C, SANS, SERIF, OSelect, StepHeader, StepNav } from "./shared";

// Local type declarations (mirrors convex/icalImport.ts — not imported directly
// as that is a server-only "use node" file)
type ActivityType =
  | "mass"
  | "confessions"
  | "exposition"
  | "evening_prayer"
  | "baptism"
  | "vespers"
  | "other";

type Schedule =
  | "weekday"
  | "saturday"
  | "sunday"
  | "vigil"
  | "specific";

type MappedEvent = {
  uid: string;
  title: string;
  dtstart: string;
  time: string;
  isRecurring: boolean;
  rrule?: string;
  type: string;
  schedule: string;
};

type Props = {
  parishId: string;
  mainChurchId: string;
  events: MappedEvent[];
  onNext: () => void;
  onBack: () => void;
};

const TYPE_OPTIONS = [
  { value: "mass",           label: "Mass" },
  { value: "confessions",    label: "Confessions" },
  { value: "exposition",     label: "Exposition" },
  { value: "evening_prayer", label: "Evening Prayer" },
  { value: "baptism",        label: "Baptism" },
  { value: "vespers",        label: "Vespers" },
  { value: "other",          label: "Other" },
];

const TYPE_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  mass:          { bg: "rgba(34,197,94,0.14)",  color: "#16a34a" },
  confessions:   { bg: "rgba(168,85,247,0.14)", color: "#9333ea" },
  exposition:    { bg: "rgba(59,130,246,0.14)", color: "#2563eb" },
  evening_prayer:{ bg: "rgba(249,115,22,0.14)", color: "#ea580c" },
  baptism:       { bg: "rgba(20,184,166,0.14)", color: "#0d9488" },
  vespers:       { bg: "rgba(99,102,241,0.14)", color: "#6366f1" },
  other:         { bg: "rgba(245,158,11,0.14)", color: "#d97706" },
};

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_BADGE_STYLE[type] ?? TYPE_BADGE_STYLE.other;
  return (
    <span style={{
      fontFamily: SANS, fontSize: 11, fontWeight: 600,
      background: style.bg, color: style.color,
      borderRadius: 4, padding: "3px 8px",
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function formatRecurrence(event: MappedEvent): string {
  if (!event.isRecurring) return event.dtstart;
  const base = event.rrule ?? "";
  if (base.includes("WEEKLY")) return `Weekly from ${event.dtstart}`;
  if (base.includes("DAILY"))  return `Daily from ${event.dtstart}`;
  return `Recurring from ${event.dtstart}`;
}

// Normalise an arbitrary schedule string to the valid union; default "specific"
function normaliseSchedule(s: string): Schedule {
  const allowed: Schedule[] = ["weekday", "saturday", "sunday", "vigil", "specific"];
  return (allowed.includes(s as Schedule) ? s : "specific") as Schedule;
}

export function StepEventMapping({ parishId, mainChurchId, events, onNext, onBack }: Props) {
  // Local overrides — uid → type string
  const [typeOverrides, setTypeOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const createActivity = useMutation(api.activities.create);

  const effectiveType = (ev: MappedEvent): string =>
    typeOverrides[ev.uid] ?? ev.type ?? "other";

  const setType = (uid: string, type: string) => {
    setTypeOverrides((prev) => ({ ...prev, [uid]: type }));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      for (const ev of events) {
        const type = effectiveType(ev) as ActivityType;
        const schedule = normaliseSchedule(
          (ev as MappedEvent & { suggestedSchedule?: string }).suggestedSchedule ?? ev.schedule
        );
        await createActivity({
          parishId: parishId as Id<"parishes">,
          churchId: mainChurchId as Id<"churches">,
          type,
          name: ev.title,
          schedule,
          time: ev.time,
          isVigil: schedule === "vigil",
          requiredClergyCount: 1,
          requiredRoles: [],
        });
      }
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Review your services"
        subtitle="We've matched your calendar events to service types. Adjust any that look wrong."
      />

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
      }}>
        {events.map((ev) => {
          const type = effectiveType(ev);
          const isUnrecognised = type === "other";

          return (
            <div
              key={ev.uid}
              style={{
                flex: "1 1 calc(50% - 6px)",
                minWidth: 240,
                background: isUnrecognised ? C.warningBg : C.surface,
                border: `1px solid ${isUnrecognised ? C.warning : C.border}`,
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: C.text,
                  flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {ev.title}
                </span>
                <TypeBadge type={type} />
              </div>

              {/* Date / recurrence info */}
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>
                {ev.time} · {formatRecurrence(ev)}
              </div>

              {/* Type selector */}
              <OSelect
                value={type}
                onChange={(v) => setType(ev.uid, v)}
                options={TYPE_OPTIONS}
              />
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div style={{
          fontFamily: SANS, fontSize: 14, color: C.muted,
          padding: "24px 0",
          textAlign: "center",
        }}>
          No events to review.
        </div>
      )}

      <StepNav
        onNext={handleNext}
        onBack={onBack}
        loading={saving}
        nextLabel="Continue →"
      />
    </div>
  );
}
