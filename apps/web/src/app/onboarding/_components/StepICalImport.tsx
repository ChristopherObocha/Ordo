"use client";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { C, SANS, OInput, OButton, Field, StepHeader, StepNav } from "./shared";

type ParsedEventBasic = {
  uid: string;
  title: string;
  dtstart: string;
  time: string;
  isRecurring: boolean;
  rrule?: string;
  suggestedType: string;
  suggestedSchedule: string;
};

type Props = {
  onNext: (events: ParsedEventBasic[]) => void;
  onBack: () => void;
};

const TYPE_BADGE_COLOURS: Record<string, { bg: string; color: string }> = {
  mass:          { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
  confessions:   { bg: "rgba(168,85,247,0.12)", color: "#9333ea" },
  exposition:    { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
  evening_prayer:{ bg: "rgba(249,115,22,0.12)", color: "#ea580c" },
  baptism:       { bg: "rgba(20,184,166,0.12)", color: "#0d9488" },
  vespers:       { bg: "rgba(99,102,241,0.12)", color: "#6366f1" },
  other:         { bg: "rgba(245,158,11,0.12)", color: "#d97706" },
};

function TypeBadge({ type }: { type: string }) {
  const colours = TYPE_BADGE_COLOURS[type] ?? TYPE_BADGE_COLOURS.other;
  return (
    <span style={{
      fontFamily: SANS, fontSize: 11, fontWeight: 600,
      background: colours.bg, color: colours.color,
      borderRadius: 4, padding: "3px 7px",
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

export function StepICalImport({ onNext, onBack }: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "fetching" | "done" | "error">("idle");
  const [events, setEvents] = useState<ParsedEventBasic[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const parseICalUrl = useAction(api.icalImport.parseICalUrl);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setStatus("fetching");
    setErrorMsg("");
    try {
      const result = await parseICalUrl({ url: url.trim() });
      setEvents(result as ParsedEventBasic[]);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error. Please check the URL and try again.");
      setStatus("error");
    }
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Connect your calendar"
        subtitle="Paste your iCal URL below. In Google Calendar: Settings → [calendar] → Secret address in iCal format."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="iCal URL">
          <OInput
            value={url}
            onChange={setUrl}
            placeholder="webcal://... or https://..."
            disabled={status === "fetching"}
          />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <OButton
            onClick={handleFetch}
            disabled={!url.trim() || status === "fetching"}
            loading={status === "fetching"}
          >
            Fetch calendar
          </OButton>

          {status === "fetching" && (
            <span style={{
              fontFamily: SANS, fontSize: 13, color: C.muted,
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              Fetching your calendar…
            </span>
          )}
        </div>

        {/* Error state */}
        {status === "error" && (
          <div style={{
            border: `1px solid ${C.danger}`,
            background: C.dangerBg,
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            <div style={{ fontFamily: SANS, fontSize: 14, color: C.danger, fontWeight: 500 }}>
              Could not fetch calendar
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>
              {errorMsg}
            </div>
            <OButton
              variant="ghost"
              onClick={() => { setStatus("idle"); setErrorMsg(""); }}
            >
              Try another URL
            </OButton>
          </div>
        )}

        {/* Success state */}
        {status === "done" && (
          <div style={{
            border: `1px solid ${C.success}`,
            background: C.successBg,
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            <div style={{ fontFamily: SANS, fontSize: 14, color: C.success, fontWeight: 600 }}>
              Found {events.length} event{events.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {events.slice(0, 5).map((ev) => (
                <div
                  key={ev.uid}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    fontFamily: SANS, fontSize: 13, color: C.text,
                  }}
                >
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.title}
                  </span>
                  <TypeBadge type={ev.suggestedType} />
                </div>
              ))}
              {events.length > 5 && (
                <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>
                  …and {events.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <StepNav
        onNext={() => onNext(events)}
        onBack={onBack}
        nextLabel="Continue →"
        canNext={status === "done"}
      />
    </div>
  );
}
