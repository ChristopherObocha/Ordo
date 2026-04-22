import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
} from "docx";

type AssignmentRow = {
  date: string;
  activityName: string;
  activityType: string;
  time: string;
  clergyName: string;
  clergyType: string;
  church: string;
};

export async function exportRotaToDocx(
  parishName: string,
  rows: AssignmentRow[],
  filename = "rota.docx",
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `${parishName} — Clergy Rota`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: `Generated ${new Date().toLocaleDateString("en-GB")}` }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Date", "Activity", "Time", "Clergy", "Church"].map(
                  (h) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: h, bold: true })],
                        }),
                      ],
                    }),
                ),
              }),
              ...rows.map(
                (r) =>
                  new TableRow({
                    children: [r.date, r.activityName, r.time, r.clergyName, r.church].map(
                      (v) =>
                        new TableCell({
                          children: [new Paragraph(v)],
                        }),
                    ),
                  }),
              ),
            ],
          }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
