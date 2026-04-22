type AssignmentRow = {
  date: string;
  activityName: string;
  activityType: string;
  time: string;
  clergyName: string;
  clergyType: string;
  church: string;
};

export function exportRotaToCsv(rows: AssignmentRow[], filename = "rota.csv"): void {
  const headers = ["Date", "Activity", "Type", "Time", "Clergy", "Clergy Type", "Church"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.date, r.activityName, r.activityType, r.time, r.clergyName, r.clergyType, r.church]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
