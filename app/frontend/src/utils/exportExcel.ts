import * as XLSX from "xlsx";
import type { ApostadorOut } from "../types";
import { fileTimestamp } from "./fileTimestamp";

export function exportApostadoresExcel(apostadores: ApostadorOut[]) {
  const rows: Record<string, string | number>[] = [];

  apostadores.forEach((ap) => {
    const palpites = [...ap.palpites].sort(
      (a, b) => a.prioridade - b.prioridade
    );
    palpites.forEach((p) => {
      rows.push({
        Apostador: ap.nome,
        teamId: p.team?.sofascore_id ?? p.team_id,
        Prioridade: p.prioridade,
        "Ordem Inscrição": ap.ordem_inscricao,
        teamSlug: p.team?.slug ?? "",
        Time: p.team?.name ?? `ID ${p.team_id}`,
        Código: p.team?.name_code ?? "",
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r) => String(r[key] ?? "").length)
    ) + 2,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Apostadores");
  XLSX.writeFile(wb, `apostadores_bolao_2026_${fileTimestamp()}.xlsx`);
}
