"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../../convex/_generated/dataModel";
import { use, useMemo } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:      "var(--ordo-bg)",
  surface: "var(--ordo-surface)",
  border:  "var(--ordo-border)",
  text:    "var(--ordo-text)",
  muted:   "var(--ordo-muted)",
  primary: "var(--ordo-primary)",
};

const SANS  = "var(--font-dm-sans), sans-serif";
const SERIF = "var(--font-eb-garamond), Georgia, serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(time: string): string {
  // time is "HH:MM"
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${period}` : `${hour}:${m.toString().padStart(2, "0")}${period}`;
}

function activityLabel(type: string, name?: string): string {
  if (name) return name;
  const labels: Record<string, string> = {
    mass:           "Mass",
    confessions:    "Confessions",
    exposition:     "Exposition",
    evening_prayer: "Evening Prayer",
    baptism:        "Baptism",
    vespers:        "Vespers",
    other:          "Service",
  };
  return labels[type] ?? type;
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function Centred({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        fontFamily: SANS,
        padding: "2rem",
      }}
    >
      {children}
    </div>
  );
}

function NotFound() {
  return (
    <Centred>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "2.5rem 3rem",
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 24,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Ordo
        </div>
        <p
          style={{
            color: C.muted,
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          This rota link is no longer valid or has been removed.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            background: C.primary,
            color: "#fff",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Open Ordo
        </a>
      </div>
    </Centred>
  );
}

function Loading() {
  return (
    <Centred>
      <span style={{ color: C.muted, fontSize: 15 }}>Loading rota…</span>
    </Centred>
  );
}

// ─── Inner page (has rotaId + parishId) ───────────────────────────────────────

function RotaView({
  rotaId,
  parishId,
  startDate,
  endDate,
}: {
  rotaId: Id<"rotas">;
  parishId: Id<"parishes">;
  startDate: string;
  endDate: string;
}) {
  const assignments = useQuery(api.assignments.listForRota, { rotaId });
  const activities  = useQuery(api.activities.list, { parishId });
  const clergyList  = useQuery(api.clergy.list, { parishId });
  const churches    = useQuery(api.churches.list, { parishId });
  const parish      = useQuery(api.parishes.getById, { parishId });

  const loading =
    assignments === undefined ||
    activities  === undefined ||
    clergyList  === undefined ||
    churches    === undefined ||
    parish      === undefined;

  const rows = useMemo(() => {
    if (!assignments || !activities || !clergyList || !churches) return [];

    const actMap  = new Map((activities as Doc<"activities">[]).map((a) => [a._id, a]));
    const clerMap = new Map((clergyList as Doc<"clergy">[]).map((c) => [c._id, c]));
    const churMap = new Map((churches as Doc<"churches">[]).map((ch) => [ch._id, ch]));

    return (assignments as Doc<"assignments">[])
      .map((asgn) => {
        const activity = actMap.get(asgn.activityId);
        const clergy   = clerMap.get(asgn.clergyId);
        const church   = activity ? churMap.get(activity.churchId) : undefined;
        return { asgn, activity, clergy, church };
      })
      .filter((r) => r.activity && r.clergy)
      .sort((a, b) => {
        const dateCmp = a.asgn.date.localeCompare(b.asgn.date);
        if (dateCmp !== 0) return dateCmp;
        return (a.activity?.time ?? "").localeCompare(b.activity?.time ?? "");
      });
  }, [assignments, activities, clergyList, churches]);

  if (loading) return <Loading />;

  const parishName = parish?.name ?? "Parish";
  const dateRange  = formatDateRange(startDate, endDate);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: SANS,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "1.5rem 2rem 1.25rem",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          gap: "1rem",
        }}
        className="print:border-b print:border-gray-200"
      >
        {/* Left: wordmark */}
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 22,
            color: C.text,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          Ordo
        </span>

        {/* Centre: parish + date range */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              color: C.text,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {parishName}
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: C.muted,
              marginTop: 3,
            }}
          >
            {dateRange}
          </div>
        </div>

        {/* Right: print button */}
        <button
          onClick={() => window.print()}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 500,
            color: C.muted,
            cursor: "pointer",
            fontFamily: SANS,
          }}
          className="print:hidden"
        >
          Print
        </button>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <main style={{ padding: "1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        {rows.length === 0 ? (
          <p
            style={{
              color: C.muted,
              fontSize: 14,
              textAlign: "center",
              marginTop: "3rem",
            }}
          >
            This rota has no assignments yet.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              color: C.text,
              fontFamily: SANS,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${C.border}`,
                  textAlign: "left",
                }}
              >
                {(["Date", "Service", "Time", "Church", "Clergy"] as const).map(
                  (col) => (
                    <th
                      key={col}
                      style={{
                        padding: "8px 12px",
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: C.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ asgn, activity, clergy, church }, i) => (
                <tr
                  key={asgn._id}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? "transparent" : `${C.surface}80`,
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      whiteSpace: "nowrap",
                      color: C.muted,
                      fontSize: 13,
                    }}
                  >
                    {formatDisplayDate(asgn.date)}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontWeight: 500,
                    }}
                  >
                    {activityLabel(activity!.type, activity!.name)}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      whiteSpace: "nowrap",
                      color: C.muted,
                      fontSize: 13,
                    }}
                  >
                    {formatTime(activity!.time)}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: C.muted,
                      fontSize: 13,
                    }}
                  >
                    {church?.name ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontWeight: 500,
                    }}
                  >
                    {clergy!.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

// ─── Shell: fetches share data, then delegates ────────────────────────────────

function ShareShell({ token }: { token: string }) {
  const result = useQuery(api.rotaShares.getByToken, { token });

  if (result === undefined) return <Loading />;
  if (result === null || !result.rota) return <NotFound />;

  const { rota } = result;

  return (
    <RotaView
      rotaId={rota._id}
      parishId={rota.parishId}
      startDate={rota.startDate}
      endDate={rota.endDate}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <ShareShell token={token} />;
}
