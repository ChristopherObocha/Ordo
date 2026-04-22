"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useState } from "react";

const C = {
  bg:       "var(--ordo-bg)",
  surface:  "var(--ordo-surface)",
  surface2: "var(--ordo-surface2)",
  border:   "var(--ordo-border)",
  text:     "var(--ordo-text)",
  muted:    "var(--ordo-muted)",
  faint:    "var(--ordo-faint)",
  primary:  "var(--ordo-primary)",
  danger:   "var(--ordo-danger)",
  dangerBg: "var(--ordo-danger-bg)",
  success:  "var(--ordo-success)",
  successBg:"var(--ordo-success-bg)",
  warning:  "var(--ordo-warning)",
  warningBg:"var(--ordo-warning-bg)",
  satellite:   "var(--ordo-satellite)",
  satBorder:   "var(--ordo-satellite-border)",
};

const SANS  = "var(--font-dm-sans), sans-serif";
const SERIF = "var(--font-eb-garamond), Georgia, serif";
const MONO  = "var(--font-dm-mono), monospace";

const ACTIVITY_TYPES = ["mass", "confessions", "exposition", "evening_prayer", "baptism", "vespers", "other"] as const;
const SCHEDULES      = ["weekday", "saturday", "sunday", "vigil"] as const;

type ActivityType = typeof ACTIVITY_TYPES[number];
type Schedule     = typeof SCHEDULES[number];

const TYPE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  mass:           { bg: "#DDE6EF", text: "#1A2E44", border: "#B8CCE0" },
  confessions:    { bg: "#DDF0E6", text: "#1A3D2A", border: "#B8D9C8" },
  exposition:     { bg: "#F2EDF8", text: "#5B2D8E", border: "#CDB8E8" },
  evening_prayer: { bg: "#F5F2E8", text: "#7A6B3A", border: "#D4CAA0" },
  baptism:        { bg: "#EBE4F5", text: "#3A1A6A", border: "#C8B8E8" },
  vespers:        { bg: "#F0E8EF", text: "#3A1A3A", border: "#D8B8D0" },
  other:          { bg: C.surface2, text: C.muted, border: C.border },
};

const SCHEDULE_LABEL: Record<string, string> = {
  weekday:  "Weekdays",
  saturday: "Saturday",
  sunday:   "Sunday",
  vigil:    "Saturday Vigil",
  specific: "Specific date",
};

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const p = TYPE_BADGE[color] ?? TYPE_BADGE.other;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 500,
        fontFamily: SANS,
        letterSpacing: "0.01em",
        borderRadius: 4,
        border: `1px solid ${p.border}`,
        background: p.bg,
        color: p.text,
      }}
    >
      {children}
    </span>
  );
}

type FormState = {
  churchId: string;
  type: ActivityType;
  name: string;
  schedule: Schedule;
  time: string;
  isVigil: boolean;
  requiredClergyCount: number;
};

function emptyForm(defaultChurchId: string): FormState {
  return {
    churchId: defaultChurchId,
    type: "mass",
    name: "",
    schedule: "sunday",
    time: "08:00",
    isVigil: false,
    requiredClergyCount: 1,
  };
}

function ActivityForm({
  title,
  form,
  churches,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  form: FormState;
  churches: { _id: Id<"churches">; name: string }[];
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const set = (key: keyof FormState) => (value: unknown) =>
    onChange({ ...form, [key]: value });

  return (
    <div
      style={{
        padding: 20,
        background: C.surface2,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        marginBottom: 12,
      }}
    >
      <h4
        style={{
          margin: "0 0 14px",
          fontFamily: SERIF,
          fontSize: 16,
          fontWeight: 500,
          color: C.text,
        }}
      >
        {title}
      </h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {/* Name */}
        <div>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Activity name
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Morning Mass"
            style={{
              fontFamily: SANS, fontSize: 13, color: C.text, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 11px",
              outline: "none", width: "100%",
            }}
          />
        </div>

        {/* Time */}
        <div>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Time
          </label>
          <input
            type="time"
            value={form.time}
            onChange={(e) => set("time")(e.target.value)}
            style={{
              fontFamily: MONO, fontSize: 13, color: C.text, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 11px",
              outline: "none", width: "100%",
            }}
          />
        </div>

        {/* Church */}
        <div>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Church
          </label>
          <select
            value={form.churchId}
            onChange={(e) => set("churchId")(e.target.value)}
            style={{
              fontFamily: SANS, fontSize: 13, color: C.text, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px",
              outline: "none", cursor: "pointer", width: "100%",
            }}
          >
            {churches.map((ch) => (
              <option key={ch._id} value={ch._id}>{ch.name}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => set("type")(e.target.value as ActivityType)}
            style={{
              fontFamily: SANS, fontSize: 13, color: C.text, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px",
              outline: "none", cursor: "pointer", width: "100%",
            }}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          When
        </label>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {SCHEDULES.map((s) => {
            const active = form.schedule === s;
            return (
              <button
                key={s}
                onClick={() => set("schedule")(s)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: `1px solid ${active ? C.primary : C.border}`,
                  background: active ? C.primary : C.surface,
                  color: active ? "#fff" : C.muted,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontWeight: 500,
                  transition: "all 0.12s",
                }}
              >
                {SCHEDULE_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vigil + count */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: C.text }}>
          <input
            type="checkbox"
            checked={form.isVigil}
            onChange={(e) => set("isVigil")(e.target.checked)}
            style={{ accentColor: C.primary }}
          />
          Vigil Mass (evening before)
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: C.muted }}>Clergy needed:</label>
          <input
            type="number"
            min={1}
            max={5}
            value={form.requiredClergyCount}
            onChange={(e) => set("requiredClergyCount")(Number(e.target.value))}
            style={{
              fontFamily: SANS, fontSize: 13, color: C.text, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px",
              outline: "none", width: 60, textAlign: "center",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: SANS,
            cursor: "pointer",
            border: "none",
            borderRadius: 6,
            background: C.primary,
            color: "#fff",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save activity"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 16px",
            fontSize: 13,
            fontFamily: SANS,
            cursor: "pointer",
            border: "none",
            borderRadius: 6,
            background: "none",
            color: C.muted,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const parish     = useQuery(api.parishes.getMyParish);
  const churches   = useQuery(api.churches.list, parish ? { parishId: parish._id } : "skip");
  const activities = useQuery(api.activities.list, parish ? { parishId: parish._id } : "skip");

  const createMut     = useMutation(api.activities.create);
  const updateMut     = useMutation(api.activities.update);
  const deactivateMut = useMutation(api.activities.deactivate);
  const removeMut     = useMutation(api.activities.remove);

  const [showNew,  setShowNew]  = useState(false);
  const [editId,   setEditId]   = useState<Id<"activities"> | null>(null);
  const [deleteId, setDeleteId] = useState<Id<"activities"> | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const defaultChurchId = churches?.[0]?._id ?? "";
  const [newForm, setNewForm] = useState<FormState>(() => emptyForm(defaultChurchId));
  const [editForm, setEditForm] = useState<FormState>(() => emptyForm(defaultChurchId));

  const handleCreate = async () => {
    if (!parish || !newForm.churchId || !newForm.name.trim()) {
      setError("Name and church are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createMut({
        parishId:           parish._id,
        churchId:           newForm.churchId as Id<"churches">,
        type:               newForm.type,
        name:               newForm.name.trim() || undefined,
        schedule:           newForm.schedule,
        time:               newForm.time,
        isVigil:            newForm.isVigil,
        requiredClergyCount: newForm.requiredClergyCount,
        requiredRoles:      [],
      });
      setShowNew(false);
      setNewForm(emptyForm(defaultChurchId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create activity");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setSaving(true);
    setError("");
    try {
      await updateMut({
        activityId:         editId,
        type:               editForm.type,
        name:               editForm.name.trim() || undefined,
        schedule:           editForm.schedule,
        time:               editForm.time,
        isVigil:            editForm.isVigil,
        requiredClergyCount: editForm.requiredClergyCount,
        churchId:           editForm.churchId as Id<"churches">,
      });
      setEditId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update activity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeMut({ activityId: deleteId });
    } catch {
      // If there are assignments, deactivate instead
      await deactivateMut({ activityId: deleteId });
    }
    setDeleteId(null);
  };

  if (!parish || !churches || !activities) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.muted, fontFamily: SANS }}>
        Loading…
      </div>
    );
  }

  // Group activities by church
  const grouped = churches.map((ch) => ({
    church: ch,
    activities: activities.filter((a) => a.churchId === ch._id),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: C.text }}>
            Activities
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
            Recurring slots that appear in the rota grid
          </p>
        </div>
        <button
          onClick={() => {
            setShowNew(true);
            setEditId(null);
            setNewForm(emptyForm(churches[0]?._id ?? ""));
          }}
          style={{
            marginLeft: "auto",
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: SANS,
            cursor: "pointer",
            border: "none",
            borderRadius: 6,
            background: C.primary,
            color: "#fff",
          }}
        >
          + New activity
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {error && (
          <div
            style={{
              padding: "8px 14px",
              background: C.dangerBg,
              border: `1px solid ${C.danger}40`,
              borderRadius: 6,
              fontSize: 13,
              color: C.danger,
              marginBottom: 16,
              fontFamily: SANS,
            }}
          >
            {error}
          </div>
        )}

        {showNew && (
          <ActivityForm
            title="New activity"
            form={newForm}
            churches={churches}
            onChange={setNewForm}
            onSave={handleCreate}
            onCancel={() => setShowNew(false)}
            saving={saving}
          />
        )}

        {grouped.every((g) => g.activities.length === 0) && !showNew ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              gap: 12,
              color: C.muted,
              fontFamily: SANS,
            }}
          >
            <p style={{ fontSize: 15 }}>No activities yet.</p>
            <p style={{ fontSize: 13, color: C.faint }}>Add recurring services like Mass times, Confessions, Evening Prayer…</p>
          </div>
        ) : (
          grouped.map(({ church, activities: acts }) => {
            if (acts.length === 0) return null;
            const isSatellite = !church.isMain;
            return (
              <div key={church._id} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {church.name}
                  </h3>
                  {isSatellite && (
                    <span
                      style={{
                        fontSize: 11,
                        background: C.successBg,
                        border: `1px solid #B8D4BC`,
                        borderRadius: 4,
                        padding: "2px 7px",
                        color: C.success,
                        fontFamily: SANS,
                        fontWeight: 500,
                      }}
                    >
                      Satellite
                    </span>
                  )}
                </div>
                <div
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {acts.map((act, i) => (
                    <div key={act._id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          background:
                            editId === act._id
                              ? C.surface2
                              : i % 2 === 0
                              ? C.surface
                              : C.bg,
                          borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 13,
                            color: C.muted,
                            width: 44,
                            flexShrink: 0,
                          }}
                        >
                          {act.time}
                        </span>
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 14,
                            fontWeight: 500,
                            color: C.text,
                            flex: 1,
                          }}
                        >
                          {act.name ?? act.type.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                        <Badge color={act.type}>
                          {act.type.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                        </Badge>
                        <span style={{ fontSize: 12, color: C.muted, minWidth: 110, textAlign: "right" }}>
                          {SCHEDULE_LABEL[act.schedule]}
                        </span>
                        {act.isVigil && (
                          <span
                            style={{
                              fontSize: 11,
                              background: "#F2EDF8",
                              border: "1px solid #CDB8E8",
                              borderRadius: 4,
                              padding: "2px 7px",
                              color: "#5B2D8E",
                              fontFamily: SANS,
                              fontWeight: 500,
                            }}
                          >
                            Vigil
                          </span>
                        )}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => {
                              if (editId === act._id) {
                                setEditId(null);
                              } else {
                                setEditForm({
                                  churchId: act.churchId,
                                  type: act.type as ActivityType,
                                  name: act.name ?? "",
                                  schedule: act.schedule as Schedule,
                                  time: act.time,
                                  isVigil: act.isVigil,
                                  requiredClergyCount: act.requiredClergyCount,
                                });
                                setEditId(act._id);
                                setShowNew(false);
                              }
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: C.muted,
                              fontSize: 12,
                              fontFamily: SANS,
                              padding: "4px 10px",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(act._id)}
                            style={{
                              background: C.dangerBg,
                              border: `1px solid ${C.danger}40`,
                              cursor: "pointer",
                              color: C.danger,
                              fontSize: 12,
                              fontFamily: SANS,
                              padding: "4px 10px",
                              borderRadius: 6,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {editId === act._id && (
                        <div style={{ padding: "0 16px 16px" }}>
                          <ActivityForm
                            title="Edit activity"
                            form={editForm}
                            churches={churches}
                            onChange={setEditForm}
                            onSave={handleUpdate}
                            onCancel={() => setEditId(null)}
                            saving={saving}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete modal */}
      {deleteId && (
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
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 14,
              boxShadow: "var(--ordo-shadow-lg)",
              width: 400,
              maxWidth: "90vw",
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontFamily: SERIF,
                fontSize: 20,
                fontWeight: 500,
                color: C.text,
              }}
            >
              Delete activity?
            </h3>
            <p style={{ color: C.muted, fontSize: 14, marginTop: 0, marginBottom: 20 }}>
              This removes the activity from future rotas. If assignments exist, it will be deactivated instead.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDelete}
                style={{
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: SANS,
                  cursor: "pointer",
                  border: `1px solid ${C.danger}40`,
                  borderRadius: 6,
                  background: C.dangerBg,
                  color: C.danger,
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "7px 16px",
                  fontSize: 13,
                  fontFamily: SANS,
                  cursor: "pointer",
                  border: "none",
                  borderRadius: 6,
                  background: "none",
                  color: C.muted,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
