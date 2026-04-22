import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 20 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingVertical: 6,
  },
  cell: { flex: 1, fontSize: 9 },
  header: { fontFamily: "Helvetica-Bold", fontSize: 9 },
});

type AssignmentRow = {
  date: string;
  activityName: string;
  time: string;
  clergyName: string;
  church: string;
};

const RotaDocument = ({
  parishName,
  rows,
}: {
  parishName: string;
  rows: AssignmentRow[];
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{parishName} — Clergy Rota</Text>
      <Text style={styles.subtitle}>
        Generated {new Date().toLocaleDateString("en-GB")}
      </Text>
      <View style={styles.row}>
        {["Date", "Activity", "Time", "Clergy", "Church"].map((h) => (
          <Text key={h} style={[styles.cell, styles.header]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.cell}>{r.date}</Text>
          <Text style={styles.cell}>{r.activityName}</Text>
          <Text style={styles.cell}>{r.time}</Text>
          <Text style={styles.cell}>{r.clergyName}</Text>
          <Text style={styles.cell}>{r.church}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

export async function exportRotaToPdf(
  parishName: string,
  rows: AssignmentRow[],
  filename = "rota.pdf",
): Promise<void> {
  const blob = await pdf(
    <RotaDocument parishName={parishName} rows={rows} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
