import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RankingEntry } from "../types";
import { fileTimestamp } from "./fileTimestamp";

const ZONE_COLORS: Record<string, [number, number, number]> = {
  libertadores: [220, 252, 231],
  preLibertadores: [236, 253, 245],
  sulamericana: [219, 234, 254],
  nenhuma: [255, 237, 213],
  rebaixamento: [254, 226, 226],
};

function getZone(position: number): string {
  if (position >= 1 && position <= 4) return "libertadores";
  if (position === 5) return "preLibertadores";
  if (position >= 6 && position <= 11) return "sulamericana";
  if (position >= 12 && position <= 16) return "nenhuma";
  if (position >= 17) return "rebaixamento";
  return "";
}

async function loadBadgeAsDataUrl(teamId: number): Promise<string | null> {
  try {
    const res = await fetch(`/static/badges/${teamId}.webp`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function preloadBadges(
  entries: RankingEntry[]
): Promise<Map<number, string>> {
  const ids = new Set<number>();
  entries.forEach((e) => e.team_ids.forEach((id) => id && ids.add(id)));

  const results = await Promise.all(
    Array.from(ids).map(async (id) => {
      const data = await loadBadgeAsDataUrl(id);
      return [id, data] as const;
    })
  );

  const map = new Map<number, string>();
  results.forEach(([id, data]) => {
    if (data) map.set(id, data);
  });
  return map;
}

export async function exportRankingPdf(
  entries: RankingEntry[],
  updatedAt: string
) {
  const badges = await preloadBadges(entries);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Logo
  try {
    const logoRes = await fetch("/logo.png");
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoData = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(logoBlob);
      });
      doc.addImage(logoData, "PNG", 14, 7, 12, 12);
    }
  } catch {
    /* skip logo */
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Ranking — Bolão Brasileirão 2026", 29, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(updatedAt, 29, 19);
  doc.setTextColor(0);

  const N = entries[0]?.pontos.length ?? 7;
  const head = [
    [
      "#",
      "Apostador",
      "Total",
      ...Array.from({ length: N }, (_, i) => `P${i + 1}`),
    ],
  ];

  const BADGE_SIZE = 4;
  const CELL_MIN_H = BADGE_SIZE + 3;

  const body = entries.map((e) => [
    String(e.rank),
    e.apostador,
    String(e.total),
    ...e.pontos.map((pts, i) => `  ${e.times_codes[i]}  ${pts}`),
  ]);

  autoTable(doc, {
    startY: 24,
    head,
    body,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      halign: "center",
      valign: "middle",
      minCellHeight: CELL_MIN_H,
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { halign: "left", cellWidth: 30 },
      2: { fontStyle: "bold", cellWidth: 14 },
    },
    didParseCell(data) {
      if (data.section !== "body") return;
      const rowIdx = data.row.index;
      const entry = entries[rowIdx];
      if (!entry) return;

      if (data.column.index <= 2) {
        if (rowIdx === 0)
          data.cell.styles.fillColor = [254, 249, 195];
        else if (rowIdx === 1)
          data.cell.styles.fillColor = [229, 231, 235];
        else if (rowIdx === 2)
          data.cell.styles.fillColor = [255, 237, 213];
        else if (rowIdx === 3)
          data.cell.styles.fillColor = [254, 243, 199];
      }

      const colOffset = data.column.index - 3;
      if (colOffset >= 0 && colOffset < entry.team_positions.length) {
        const pos = entry.team_positions[colOffset];
        const zone = getZone(pos);
        if (zone && ZONE_COLORS[zone]) {
          data.cell.styles.fillColor = ZONE_COLORS[zone];
        }
      }
    },
    didDrawCell(data) {
      if (data.section !== "body") return;
      const rowIdx = data.row.index;
      const entry = entries[rowIdx];
      if (!entry) return;

      const colOffset = data.column.index - 3;
      if (colOffset < 0 || colOffset >= entry.team_ids.length) return;

      const teamId = entry.team_ids[colOffset];
      const badgeData = badges.get(teamId);
      if (!badgeData) return;

      const x = data.cell.x + 1.5;
      const y = data.cell.y + (data.cell.height - BADGE_SIZE) / 2;

      try {
        doc.addImage(badgeData, "WEBP", x, y, BADGE_SIZE, BADGE_SIZE);
      } catch {
        /* some images may fail */
      }
    },
  });

  doc.setFontSize(7);
  doc.setTextColor(160);
  const pageH = doc.internal.pageSize.getHeight();
  doc.text(
    "Gerado automaticamente — Bolão Brasileirão 2026",
    14,
    pageH - 8
  );

  doc.save(`ranking_bolao_2026_${fileTimestamp()}.pdf`);
}
