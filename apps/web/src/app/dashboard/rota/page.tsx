"use client";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

// ─── Week helpers ─────────────────────────────────────────────────────────────

function getSundayOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  result.setDate(d.getDate() - d.getDay());
  return result;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

function formatWeekRange(sunday: Date): string {
  const sat = addDays(sunday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${sunday.toLocaleDateString("en-GB", opts)} – ${sat.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function activityAppliesToDay(schedule: string, dayOfWeek: number): boolean {
  switch (schedule) {
    case "weekday": return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "saturday": return dayOfWeek === 6;
    case "sunday": return dayOfWeek === 0;
    case "vigil": return dayOfWeek === 6;
    default: return false;
  }
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:          "var(--ordo-bg)",
  surface:     "var(--ordo-surface)",
  surface2:    "var(--ordo-surface2)",
  border:      "var(--ordo-border)",
  text:        "var(--ordo-text)",
  muted:       "var(--ordo-muted)",
  faint:       "var(--ordo-faint)",
  primary:     "var(--ordo-primary)",
  satellite:   "var(--ordo-satellite)",
  satBorder:   "var(--ordo-satellite-border)",
  danger:      "var(--ordo-danger)",
  dangerBg:    "var(--ordo-danger-bg)",
  success:     "var(--ordo-success)",
  successBg:   "var(--ordo-success-bg)",
  warning:     "var(--ordo-warning)",
  warningBg:   "var(--ordo-warning-bg)",
};

const SANS  = "var(--font-dm-sans), sans-serif";
const SERIF = "var(--font-eb-garamond), Georgia, serif";
const MONO  = "var(--font-dm-mono), monospace";

// ─── Clerk avatar chip ────────────────────────────────────────────────────────

const CLERK_PALETTE: Record<string, { bg: string; text: string }> = {
  bishop:    { bg: "#DDE6EF", text: "#1A2E44" },
  priest:    { bg: "#DDF0E6", text: "#1A3D2A" },
  deacon:    { bg: "#EFE8DC", text: "#4A3420" },
  religious: { bg: "#EBE4F5", text: "#3A1A6A" },
  sister:    { bg: "#F0E8EF", text: "#3A1A3A" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((p) => p.length > 0)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

type Clergy = {
  _id: Id<"clergy">;
  name: string;
  type: string;
  status: string;
  roles: string[];
  email: string;
};

function ClipAvatar({
  clergy,
  size = "md",
  showName = false,
}: {
  clergy: Clergy;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const pal = CLERK_PALETTE[clergy.type] ?? { bg: "#EEE", text: "#444" };
  const sz = { sm: { w: 22, h: 22, fs: 9 }, md: { w: 26, h: 26, fs: 10 }, lg: { w: 32, h: 32, fs: 12 } }[size];
  const initials = getInitials(clergy.name);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: pal.bg,
        color: pal.text,
        border: `1px solid ${pal.text}20`,
        borderRadius: 20,
        padding: showName ? "2px 8px 2px 3px" : 0,
        fontFamily: SANS,
        fontSize: sz.fs,
        fontWeight: 600,
        userSelect: "none",
      }}
    >
      <span
        style={{
          width: sz.w,
          height: sz.h,
          borderRadius: "50%",
          background: pal.text,
          color: pal.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: sz.fs,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      {showName && <span style={{ fontSize: sz.fs + 1 }}>{clergy.name.split(" ")[0]}</span>}
    </span>
  );
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({
  open,
  slotLabel,
  dayLabel,
  availableClergy,
  onAssign,
  onClose,
}: {
  open: boolean;
  slotLabel: string;
  dayLabel: string;
  availableClergy: Clergy[];
  onAssign: (clergyId: Id<"clergy">) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,42,39,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 14,
          boxShadow: "var(--ordo-shadow-lg)",
          width: 440,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflow: "auto",
          padding: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 500,
              color: C.text,
            }}
          >
            Assign · {slotLabel} · {dayLabel}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: C.muted,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {availableClergy.length === 0 && (
            <p style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "16px 0" }}>
              No available clergy
            </p>
          )}
          {availableClergy.map((p) => (
            <button
              key={p._id}
              onClick={() => onAssign(p._id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                background: C.surface,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: SANS,
                transition: "background 0.12s",
                width: "100%",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surface2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.surface)}
            >
              <ClipAvatar clergy={p} size="lg" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.muted, textTransform: "capitalize" }}>
                  {p.type}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              fontSize: 13,
              fontFamily: SANS,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RotaPage() {
  const [weekStart, setWeekStart] = useState(() => getSundayOfWeek(new Date()));
  const [churchFilter, setChurchFilter] = useState<string>("all");
  const [density, setDensity] = useState<"compact" | "comfortable" | "grouped">("comfortable");
  const [modalCell, setModalCell] = useState<{ activityId: Id<"activities">; date: string; activityName: string } | null>(null);
  const [dragSrc, setDragSrc] = useState<{ activityId: Id<"activities">; date: string; clergyId: Id<"clergy"> } | null>(null);
  const [dragOver, setDragOver] = useState<{ activityId: Id<"activities">; date: string } | null>(null);

  const parish   = useQuery(api.parishes.getMyParish);
  const churches = useQuery(api.churches.list, parish ? { parishId: parish._id } : "skip");
  const clergy   = useQuery(api.clergy.list,   parish ? { parishId: parish._id } : "skip");
  const activities = useQuery(api.activities.list, parish ? { parishId: parish._id } : "skip");

  const startStr = isoDate(weekStart);
  const endStr   = isoDate(addDays(weekStart, 6));
  const rota     = useQuery(api.rotas.getForWeek, parish ? { parishId: parish._id, startDate: startStr } : "skip");

  const createRota    = useMutation(api.rotas.create);
  const updateStatus  = useMutation(api.rotas.updateStatus);
  const assignMut     = useMutation(api.assignments.assign);
  const unassignMut   = useMutation(api.assignments.unassign);

  const assignments = useQuery(api.assignments.listForRota, rota ? { rotaId: rota._id } : "skip");

  // Map: `${activityId}::${date}` → assignment
  const assignMap = useMemo(() => {
    const m = new Map<string, { clergyId: Id<"clergy">; _id: Id<"assignments"> }>();
    for (const a of assignments ?? []) {
      m.set(`${a.activityId}::${a.date}`, { clergyId: a.clergyId, _id: a._id });
    }
    return m;
  }, [assignments]);

  // 7 days of the week
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const ensureRota = useCallback(async () => {
    if (!parish) return null;
    if (rota) return rota._id;
    return await createRota({ parishId: parish._id, startDate: startStr, endDate: endStr });
  }, [parish, rota, createRota, startStr, endStr]);

  const handleAssign = async (activityId: Id<"activities">, date: string, clergyId: Id<"clergy">) => {
    if (!parish) return;
    const rotaId = await ensureRota();
    if (!rotaId) return;
    await assignMut({ rotaId, parishId: parish._id, activityId, clergyId, date });
    setModalCell(null);
  };

  const handleUnassign = async (activityId: Id<"activities">, date: string) => {
    if (!rota) return;
    await unassignMut({ rotaId: rota._id, activityId, date });
  };

  const handleDrop = async (targetActivityId: Id<"activities">, targetDate: string) => {
    if (!dragSrc) return;
    if (dragSrc.activityId === targetActivityId && dragSrc.date === targetDate) return;
    if (!parish) return;
    const rotaId = await ensureRota();
    if (!rotaId) return;
    // Remove from source
    await unassignMut({ rotaId, activityId: dragSrc.activityId, date: dragSrc.date });
    // Assign to target
    await assignMut({ rotaId, parishId: parish._id, activityId: targetActivityId, clergyId: dragSrc.clergyId, date: targetDate });
    setDragSrc(null);
    setDragOver(null);
  };

  const togglePublished = async () => {
    if (!parish) return;
    const rotaId = await ensureRota();
    if (!rotaId) return;
    const newStatus = rota?.status === "published" ? "draft" : "published";
    await updateStatus({ rotaId, status: newStatus });
  };

  if (!parish || !churches || !clergy || !activities) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.muted, fontFamily: SANS }}>
        Loading…
      </div>
    );
  }

  const isPublished = rota?.status === "published";
  const activeClergy = clergy.filter((c) => c.status === "active");

  // Group activities by church
  const activitiesByChurch = churches.map((ch) => ({
    church: ch,
    activities: (activities ?? []).filter((a) => a.churchId === ch._id),
  }));

  const cellH = density === "compact" ? 36 : 48;
  const headerH = density === "compact" ? 56 : 70;

  const dayDateForIndex = (i: number) => isoDate(weekDays[i]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          padding: "10px 20px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: "4px 8px", fontSize: 13, color: C.muted }}
          >
            ‹
          </button>
          <span style={{ fontFamily: SERIF, fontSize: 17, color: C.text, fontWeight: 500 }}>
            {formatWeekRange(weekStart)}
          </span>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: "4px 8px", fontSize: 13, color: C.muted }}
          >
            ›
          </button>
        </div>

        {/* Church filter */}
        <select
          value={churchFilter}
          onChange={(e) => setChurchFilter(e.target.value)}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: C.text,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: "6px 10px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All churches</option>
          {churches.map((ch) => (
            <option key={ch._id} value={ch._id}>{ch.name}</option>
          ))}
        </select>

        {/* Density */}
        <select
          value={density}
          onChange={(e) => setDensity(e.target.value as typeof density)}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: C.text,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: "6px 10px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="grouped">Grouped</option>
        </select>

        {/* Draft / Published toggle */}
        <div
          style={{
            display: "flex",
            background: C.surface2,
            borderRadius: 20,
            padding: 2,
            border: `1px solid ${C.border}`,
            gap: 2,
          }}
        >
          {(["Draft", "Published"] as const).map((label, i) => {
            const active = (i === 0 && !isPublished) || (i === 1 && isPublished);
            return (
              <button
                key={label}
                onClick={togglePublished}
                style={{
                  padding: "4px 12px",
                  borderRadius: 18,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: SANS,
                  background: active
                    ? i === 1
                      ? "var(--ordo-success)"
                      : "#B8960C"
                    : "transparent",
                  color: active ? "#fff" : C.muted,
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activitiesByChurch.every((g) => g.activities.length === 0) ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: C.muted,
              fontFamily: SANS,
            }}
          >
            <p style={{ fontSize: 15 }}>No activities set up yet.</p>
            <a
              href="/dashboard/activities"
              style={{
                fontSize: 13,
                color: C.primary,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Add activities →
            </a>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `180px repeat(7, 1fr)`,
              minWidth: 900,
            }}
          >
            {/* Corner */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                height: headerH,
              }}
            />

            {/* Day headers */}
            {weekDays.map((day, i) => {
              const dow = day.getDay();
              const isSunday = dow === 0;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: `6px 10px ${density === "compact" ? 6 : 10}px`,
                    height: headerH,
                    borderLeft: `1px solid ${C.border}`,
                    background: isSunday ? "#F4F1E8" : "transparent",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {DAY_LABELS[dow]}{" "}
                    {day.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}

            {/* Activity rows */}
            {activitiesByChurch.map(({ church, activities: acts }) => {
              if (acts.length === 0) return null;
              if (churchFilter !== "all" && church._id !== churchFilter) return null;
              const isSatellite = !church.isMain;

              return acts.map((activity) => {
                const activityName = activity.name ?? activity.type;

                return (
                  <>
                    {/* Row label */}
                    <div
                      key={`label-${activity._id}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        height: cellH,
                        padding: `0 10px 0 ${density === "grouped" ? 20 : 12}px`,
                        borderTop: `1px solid ${C.border}`,
                        background: isSatellite ? C.satellite : C.surface,
                        borderLeft: isSatellite ? `3px solid ${C.satBorder}` : "none",
                      }}
                    >
                      {density !== "compact" && (
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>
                          {activity.time}
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: density === "compact" ? 11 : 12,
                          fontWeight: 500,
                          color: C.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {activityName}
                      </span>
                      {density !== "compact" && (
                        <span style={{ fontSize: 10, color: C.faint }}>{church.name}</span>
                      )}
                    </div>

                    {/* Day cells */}
                    {weekDays.map((day, i) => {
                      const dow = day.getDay();
                      const dateStr = dayDateForIndex(i);
                      const applies = activityAppliesToDay(activity.schedule, dow);
                      const assignment = assignMap.get(`${activity._id}::${dateStr}`);
                      const assignedClergy = assignment
                        ? clergy.find((c) => c._id === assignment.clergyId)
                        : undefined;
                      const isDragOver =
                        dragOver?.activityId === activity._id && dragOver?.date === dateStr;
                      const isDragSrc =
                        dragSrc?.activityId === activity._id && dragSrc?.date === dateStr;

                      if (!applies) {
                        return (
                          <div
                            key={`${activity._id}-${i}`}
                            style={{
                              height: cellH,
                              borderLeft: `1px solid ${C.border}`,
                              borderTop: `1px solid ${C.border}`,
                              background: `repeating-linear-gradient(135deg, transparent, transparent 4px, ${C.border}44 4px, ${C.border}44 5px)`,
                            }}
                          />
                        );
                      }

                      return (
                        <div
                          key={`${activity._id}-${i}`}
                          style={{
                            height: cellH,
                            borderLeft: `1px solid ${C.border}`,
                            borderTop: `1px solid ${C.border}`,
                            background: isDragOver
                              ? C.successBg
                              : isDragSrc
                              ? C.surface2
                              : assignedClergy
                              ? "#fff"
                              : C.bg,
                            display: "flex",
                            alignItems: "center",
                            padding: `0 ${density === "compact" ? 4 : 8}px`,
                            cursor: assignedClergy ? "default" : "pointer",
                            position: "relative",
                            transition: "background 0.12s",
                            outline: isDragOver ? `2px solid ${C.success}` : "none",
                            outlineOffset: -2,
                          }}
                          onClick={() => {
                            if (!assignedClergy) {
                              setModalCell({ activityId: activity._id, date: dateStr, activityName });
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver({ activityId: activity._id, date: dateStr });
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(activity._id, dateStr);
                          }}
                          onDragLeave={() => setDragOver(null)}
                        >
                          {assignedClergy ? (
                            <div
                              draggable
                              onDragStart={(e) => {
                                setDragSrc({ activityId: activity._id, date: dateStr, clergyId: assignedClergy._id });
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                              style={{
                                cursor: "grab",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                width: "100%",
                              }}
                            >
                              <ClipAvatar
                                clergy={assignedClergy}
                                size={density === "compact" ? "sm" : "md"}
                                showName={density !== "compact"}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnassign(activity._id, dateStr);
                                }}
                                style={{
                                  marginLeft: "auto",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: C.faint,
                                  fontSize: 14,
                                  lineHeight: 1,
                                  padding: "0 2px",
                                  opacity: 0.5,
                                }}
                                title="Remove assignment"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: C.faint,
                                fontSize: 11,
                                fontFamily: SANS,
                              }}
                            >
                              + assign
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              });
            })}
          </div>
        )}
      </div>

      {/* Legend bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 20px",
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 11, color: C.faint, fontFamily: SANS }}>
          Drag to reassign · Click empty cell to assign
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {activeClergy.map((p) => (
            <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ClipAvatar clergy={p} size="sm" />
              <span style={{ fontSize: 11, color: C.muted, fontFamily: SANS }}>
                {p.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Assign modal */}
      <AssignModal
        open={!!modalCell}
        slotLabel={modalCell?.activityName ?? ""}
        dayLabel={modalCell ? new Date(modalCell.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : ""}
        availableClergy={activeClergy}
        onAssign={(clergyId) => {
          if (modalCell) handleAssign(modalCell.activityId, modalCell.date, clergyId);
        }}
        onClose={() => setModalCell(null)}
      />
    </div>
  );
}
