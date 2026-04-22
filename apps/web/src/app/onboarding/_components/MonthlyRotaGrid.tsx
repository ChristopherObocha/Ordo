"use client";

import { C, SANS, SERIF } from "./shared";

const CLERGY_COLOURS: Record<string, string> = {
  bishop:    "#7C3AED",
  priest:    "#2563EB",
  deacon:    "#059669",
  religious: "#D97706",
  sister:    "#DB2777",
  "":        "#6B7280",
};

const ACTIVITY_ICONS: Record<string, string> = {
  mass:        "✟",
  confession:  "✦",
  exposition:  "☀",
  funeral:     "✠",
  baptism:     "✦",
  wedding:     "♡",
  default:     "•",
};

export type Slot = {
  date: string;
  activityId: string;
  activityName: string;
  activityType: string;
  time: string;
  clergyName?: string;
  clergyType?: string;
  hasViolation?: boolean;
};

type Props = {
  slots: Slot[];
  startDate: string;
  endDate: string;
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function getActivityIcon(type: string): string {
  const key = type.toLowerCase();
  return ACTIVITY_ICONS[key] ?? ACTIVITY_ICONS.default;
}

function getClergyCololur(type?: string): string {
  return CLERGY_COLOURS[type?.toLowerCase() ?? ""] ?? CLERGY_COLOURS[""];
}

/** Returns an array of [year, month] pairs (0-indexed months) covering the range */
function monthsInRange(start: Date, end: Date): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    result.push([cur.getFullYear(), cur.getMonth()]);
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

/** Returns the Monday-anchored week rows for a given month */
function weeksForMonth(year: number, month: number): Date[][] {
  // first day of month
  const firstDay = new Date(year, month, 1);
  // find the Monday on or before first day
  const startDow = firstDay.getDay(); // 0=Sun
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() + mondayOffset);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (true) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    // include week if it overlaps the month
    if (week[0].getMonth() > month && week[0].getFullYear() >= year) break;
    weeks.push(week);
    if (week[6].getMonth() > month || week[6].getFullYear() > year) break;
  }
  return weeks;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOW_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthlyRotaGrid({ slots, startDate, endDate }: Props) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Group slots by date
  const byDate = new Map<string, Slot[]>();
  for (const slot of slots) {
    const existing = byDate.get(slot.date) ?? [];
    existing.push(slot);
    byDate.set(slot.date, existing);
  }

  const months = monthsInRange(start, end);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40, overflowX: "auto" }}>
      {months.map(([year, month]) => {
        const weeks = weeksForMonth(year, month);
        return (
          <div key={`${year}-${month}`}>
            {/* Month heading */}
            <h3 style={{
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 500,
              color: C.text,
              margin: "0 0 12px",
            }}>
              {MONTH_NAMES[month]} {year}
            </h3>

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 1,
              background: C.border,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}>
              {/* Day-of-week headers */}
              {DOW_HEADERS.map((d) => (
                <div key={d} style={{
                  background: C.surface2,
                  padding: "6px 8px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.muted,
                  fontFamily: SANS,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  {d}
                </div>
              ))}

              {/* Week rows */}
              {weeks.map((week, wi) =>
                week.map((day, di) => {
                  const ymd = toYMD(day);
                  const isCurrentMonth = day.getMonth() === month;
                  const daySlots = byDate.get(ymd) ?? [];
                  const hasViolation = daySlots.some((s) => s.hasViolation);

                  return (
                    <div
                      key={`${wi}-${di}`}
                      style={{
                        background: isCurrentMonth
                          ? hasViolation
                            ? "#FFF5F5"
                            : C.surface
                          : C.surface2,
                        padding: "6px 8px",
                        minHeight: 72,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        border: hasViolation ? `1.5px solid #FCA5A5` : undefined,
                        opacity: isCurrentMonth ? 1 : 0.4,
                      }}
                    >
                      {/* Date number */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isCurrentMonth ? C.text : C.muted,
                        fontFamily: SANS,
                        marginBottom: 2,
                      }}>
                        {day.getDate()}
                      </span>

                      {/* Activity chips */}
                      {daySlots.map((slot, si) => {
                        const colour = getClergyCololur(slot.clergyType);
                        const icon = getActivityIcon(slot.activityType);
                        const initials = getInitials(slot.clergyName);
                        return (
                          <div
                            key={si}
                            title={`${slot.activityName} ${slot.time} — ${slot.clergyName ?? "Unassigned"}`}
                            style={{
                              background: `${colour}18`,
                              border: `1px solid ${colour}40`,
                              borderRadius: 4,
                              padding: "2px 5px",
                              fontSize: 10,
                              color: colour,
                              fontFamily: SANS,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ fontSize: 9 }}>{icon}</span>
                            <span style={{ fontWeight: 600, flexShrink: 0 }}>{initials}</span>
                            <span style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: C.muted,
                              fontSize: 9,
                            }}>
                              {slot.time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
