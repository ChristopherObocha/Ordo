"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../../convex/_generated/dataModel";
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
};

const SANS  = "var(--font-dm-sans), sans-serif";
const SERIF = "var(--font-eb-garamond), Georgia, serif";

const CLERK_PALETTE: Record<string, { bg: string; text: string }> = {
  bishop:    { bg: "#DDE6EF", text: "#1A2E44" },
  priest:    { bg: "#DDF0E6", text: "#1A3D2A" },
  deacon:    { bg: "#EFE8DC", text: "#4A3420" },
  religious: { bg: "#EBE4F5", text: "#3A1A6A" },
  sister:    { bg: "#F0E8EF", text: "#3A1A3A" },
};

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  bishop:    { bg: "#DDE6EF", text: "#1A2E44", border: "#B8CCE0" },
  priest:    { bg: "#DDF0E6", text: "#1A3D2A", border: "#B8D9C8" },
  deacon:    { bg: "#EFE8DC", text: "#4A3420", border: "#D4C4A8" },
  religious: { bg: "#EBE4F5", text: "#3A1A6A", border: "#C8B8E8" },
  sister:    { bg: "#F0E8EF", text: "#3A1A3A", border: "#D8B8D0" },
};

const CLERGY_TYPES = ["bishop", "priest", "deacon", "religious", "sister"] as const;

function getInitials(name: string): string {
  return name.split(" ").filter((p) => p.length > 0).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function Avatar({ name, type, size = 32 }: { name: string; type: string; size?: number }) {
  const pal = CLERK_PALETTE[type] ?? { bg: "#EEE", text: "#444" };
  const fs = Math.round(size * 0.38);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: pal.text,
        color: pal.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fs,
        fontWeight: 700,
        fontFamily: SANS,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function Badge({ children, color = "default" }: { children: React.ReactNode; color?: string }) {
  const p = ROLE_BADGE[color] ?? { bg: C.surface2, text: C.muted, border: C.border };
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
        textTransform: "capitalize",
      }}
    >
      {children}
    </span>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        cursor: "pointer",
        background: value ? C.success : C.border,
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: value ? 14 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

export default function ClergyPage() {
  const parish  = useQuery(api.parishes.getMyParish);
  const clergy  = useQuery(api.clergy.list, parish ? { parishId: parish._id } : "skip");
  const inviteMut  = useMutation(api.clergy.invite);
  const removeMut  = useMutation(api.clergy.remove);
  const setStatus  = useMutation(api.clergy.setStatus);

  const [search,      setSearch]      = useState("");
  const [detailId,    setDetailId]    = useState<Id<"clergy"> | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName,  setInviteName]  = useState("");
  const [inviteType,  setInviteType]  = useState<typeof CLERGY_TYPES[number]>("priest");
  const [inviteSent,  setInviteSent]  = useState(false);
  const [inviteErr,   setInviteErr]   = useState("");
  const [deleteId,    setDeleteId]    = useState<Id<"clergy"> | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  const filtered = (clergy as Doc<"clergy">[] ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()),
  );

  const detailPerson = detailId ? (clergy as Doc<"clergy">[] ?? []).find((p) => p._id === detailId) : null;

  const handleInvite = async () => {
    if (!parish || !inviteEmail.trim() || !inviteName.trim()) return;
    setSubmitting(true);
    setInviteErr("");
    try {
      await inviteMut({
        parishId: parish._id,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        type: inviteType,
        roles: [],
      });
      setInviteEmail("");
      setInviteName("");
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    } catch (e: unknown) {
      setInviteErr(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: Id<"clergy">, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    await setStatus({ clergyId: id, status: next });
  };

  const handleRemove = async () => {
    if (!deleteId) return;
    await removeMut({ clergyId: deleteId });
    setDeleteId(null);
    if (detailId === deleteId) setDetailId(null);
  };

  if (!parish || !clergy) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.muted, fontFamily: SANS }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Main table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: C.text }}>
              Clergy & Ministers
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
              Manage availability, roles, and rota eligibility
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: C.text,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "7px 11px",
                outline: "none",
                width: 200,
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
            <thead>
              <tr style={{ background: C.surface2, position: "sticky", top: 0, zIndex: 1 }}>
                {["Name", "Type", "Status", "Available", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.muted,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${C.border}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: C.muted,
                      fontSize: 14,
                      fontStyle: "italic",
                    }}
                  >
                    {search ? "No clergy match your search." : "No clergy yet. Use the panel to invite someone."}
                  </td>
                </tr>
              )}
              {filtered.map((p: Doc<"clergy">, i: number) => (
                <tr
                  key={p._id}
                  onClick={() => setDetailId(p._id === detailId ? null : p._id)}
                  style={{
                    background:
                      p._id === detailId
                        ? C.surface2
                        : i % 2 === 0
                        ? C.surface
                        : C.bg,
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (p._id !== detailId) e.currentTarget.style.background = C.surface2;
                  }}
                  onMouseLeave={(e) => {
                    if (p._id !== detailId)
                      e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.bg;
                  }}
                >
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={p.name} type={p.type} size={30} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.faint }}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <Badge color={p.type}>{p.type}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    {p.status === "pending" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 7px",
                          fontSize: 11,
                          fontWeight: 500,
                          fontFamily: SANS,
                          borderRadius: 4,
                          border: `1px solid #DFC880`,
                          background: C.warningBg,
                          color: C.warning,
                        }}
                      >
                        Invite pending
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 7px",
                          fontSize: 11,
                          fontWeight: 500,
                          fontFamily: SANS,
                          borderRadius: 4,
                          border: `1px solid #B8D4BC`,
                          background: C.successBg,
                          color: C.success,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    {p.status !== "pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Toggle
                          value={p.status === "active"}
                          onChange={() => handleToggleStatus(p._id, p.status)}
                        />
                        <span style={{ fontSize: 12, color: C.muted }}>
                          {p.status === "active" ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(p._id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.danger,
                        fontSize: 12,
                        fontFamily: SANS,
                        padding: 0,
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: 280,
          borderLeft: `1px solid ${C.border}`,
          background: C.surface,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          flexShrink: 0,
        }}
      >
        {/* Quick invite */}
        <div style={{ padding: 20, borderBottom: `1px solid ${C.border}` }}>
          <h4
            style={{
              margin: "0 0 12px",
              fontFamily: SERIF,
              fontSize: 16,
              fontWeight: 500,
              color: C.text,
            }}
          >
            Quick Invite
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name"
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: C.text,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "7px 11px",
                outline: "none",
              }}
            />
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@diocese.org"
              type="email"
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: C.text,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "7px 11px",
                outline: "none",
              }}
            />
            <select
              value={inviteType}
              onChange={(e) => setInviteType(e.target.value as typeof inviteType)}
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
              {CLERGY_TYPES.map((t) => (
                <option key={t} value={t} style={{ textTransform: "capitalize" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            {inviteErr && (
              <p style={{ margin: 0, fontSize: 12, color: C.danger }}>{inviteErr}</p>
            )}
            <button
              onClick={handleInvite}
              disabled={submitting || !inviteEmail.trim() || !inviteName.trim()}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: SANS,
                cursor: "pointer",
                border: "none",
                borderRadius: 6,
                background: inviteSent ? C.success : C.primary,
                color: "#fff",
                opacity: submitting || (!inviteEmail.trim() || !inviteName.trim()) ? 0.5 : 1,
                transition: "all 0.15s",
              }}
            >
              {inviteSent ? "✓ Sent!" : submitting ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </div>

        {/* Detail panel */}
        {detailPerson ? (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Avatar name={detailPerson.name} type={detailPerson.type} size={40} />
              <div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: 16,
                    fontWeight: 500,
                    color: C.text,
                  }}
                >
                  {detailPerson.name}
                </div>
                <Badge color={detailPerson.type}>{detailPerson.type}</Badge>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.faint, marginBottom: 6 }}>
              {detailPerson.email}
            </div>
            {detailPerson.roles.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  Roles
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {detailPerson.roles.map((r: string) => (
                    <span
                      key={r}
                      style={{
                        fontSize: 11,
                        background: C.surface2,
                        border: `1px solid ${C.border}`,
                        borderRadius: 4,
                        padding: "2px 7px",
                        color: C.muted,
                        fontFamily: SANS,
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.faint,
              fontSize: 12,
              padding: 20,
              textAlign: "center",
              fontStyle: "italic",
              fontFamily: SERIF,
            }}
          >
            Click a row to view details
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
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
              Remove clergy member?
            </h3>
            <p style={{ color: C.muted, fontSize: 14, marginTop: 0, marginBottom: 20 }}>
              This will remove them from the parish. Past assignments are unaffected.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleRemove}
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
                Remove
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
