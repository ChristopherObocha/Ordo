"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { type Id } from "../../../../../convex/_generated/dataModel";
import { C, SANS, SERIF, OButton, StepHeader } from "./shared";
import { exportRotaToCsv } from "../../../../lib/export/exportCsv";
import { exportRotaToDocx } from "../../../../lib/export/exportDocx";
import { exportRotaToPdf } from "../../../../lib/export/exportPdf";
import type { Slot } from "./MonthlyRotaGrid";

type Props = {
  parishName: string;
  parishId: string;
  rotaId: string;
  assignedCount: number;
  violationCount: number;
  slots: Slot[];
  onDone: () => void;
};

type AssignmentRow = {
  date: string;
  activityName: string;
  activityType: string;
  time: string;
  clergyName: string;
  clergyType: string;
  church: string;
};

function slotsToRows(slots: Slot[]): AssignmentRow[] {
  return slots.map((s) => ({
    date:         s.date,
    activityName: s.activityName,
    activityType: s.activityType,
    time:         s.time,
    clergyName:   s.clergyName  ?? "",
    clergyType:   s.clergyType  ?? "",
    church:       "",
  }));
}

function weeksCount(slots: Slot[]): number {
  if (slots.length === 0) return 0;
  const dates = slots.map((s) => s.date).sort();
  const first = new Date(dates[0]);
  const last  = new Date(dates[dates.length - 1]);
  return Math.ceil((last.getTime() - first.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export function StepFinalize({
  parishName,
  rotaId,
  assignedCount,
  violationCount,
  slots,
  onDone,
}: Props) {
  const createShare = useMutation(api.rotaShares.createShare);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [exporting, setExporting] = useState<string | null>(null);

  const rows = slotsToRows(slots);
  const weeks = weeksCount(slots);

  async function handleCopyLink() {
    try {
      const token = await createShare({ rotaId: rotaId as Id<"rotas"> });
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy link"), 2000);
    } catch {
      setCopyLabel("Error");
      setTimeout(() => setCopyLabel("Copy link"), 2000);
    }
  }

  async function handleExport(type: "pdf" | "csv" | "docx") {
    setExporting(type);
    try {
      if (type === "pdf")  await exportRotaToPdf(parishName, rows);
      if (type === "csv")  exportRotaToCsv(rows);
      if (type === "docx") await exportRotaToDocx(parishName, rows);
    } finally {
      setExporting(null);
    }
  }

  const exportButtons: { key: "pdf" | "csv" | "docx"; label: string; icon: string }[] = [
    { key: "pdf",  label: "PDF",         icon: "⬇" },
    { key: "csv",  label: "CSV",         icon: "⬇" },
    { key: "docx", label: "Word (DOCX)", icon: "⬇" },
  ];

  return (
    <div className="ordo-slide-in" style={{ fontFamily: SANS }}>
      <StepHeader title="Your rota is ready" />

      {/* Summary card */}
      <div style={{
        background: C.surface2,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "14px 18px",
        marginBottom: 28,
        fontFamily: SANS,
        fontSize: 14,
        color: C.text,
        lineHeight: 1.6,
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 15 }}>
          {assignedCount} activit{assignedCount !== 1 ? "ies" : "y"} scheduled across {weeks} week{weeks !== 1 ? "s" : ""}
        </span>
        {violationCount > 0 && (
          <span style={{ color: C.warning }}>
            {" "}·{" "}
            <strong>{violationCount}</strong> unassigned slot{violationCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Export buttons 2×2 grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginBottom: 20,
      }}>
        {exportButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleExport(key)}
            disabled={exporting !== null}
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 500,
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              cursor: exporting !== null ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: exporting !== null && exporting !== key ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span>{icon}</span>
            {exporting === key ? "Exporting…" : label}
          </button>
        ))}

        {/* Copy link button */}
        <button
          onClick={handleCopyLink}
          disabled={exporting !== null}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: copyLabel === "Copied!" ? C.successBg : C.surface,
            color: copyLabel === "Copied!" ? C.success : C.text,
            cursor: exporting !== null ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background 0.15s, color 0.15s",
            opacity: exporting !== null ? 0.5 : 1,
          }}
        >
          <span>{copyLabel === "Copied!" ? "✓" : "🔗"}</span>
          {copyLabel}
        </button>
      </div>

      {/* Go to rota button */}
      <button
        onClick={onDone}
        style={{
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 600,
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          background: C.primary,
          color: "#fff",
          cursor: "pointer",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "opacity 0.15s",
        }}
      >
        Go to rota →
      </button>
    </div>
  );
}
