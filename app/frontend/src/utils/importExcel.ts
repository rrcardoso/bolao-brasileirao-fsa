import * as XLSX from "xlsx";

export interface ApostadorImportPayload {
  nome: string;
  ordem_inscricao: number;
  palpites: { team_id: number; prioridade: number }[];
}

export function parseApostadoresExcel(file: File): Promise<ApostadorImportPayload[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (rows.length === 0) {
          reject(new Error("Planilha vazia."));
          return;
        }

        const grouped = new Map<string, { ordem: number; palpites: { team_id: number; prioridade: number }[] }>();

        for (const row of rows) {
          const nome = String(row["Apostador"] ?? "").trim();
          const teamId = Number(row["teamId"]);
          const prioridade = Number(row["Prioridade"]);
          const ordem = Number(row["Ordem Inscrição"] ?? row["Ordem Inscricao"] ?? 0);

          if (!nome || isNaN(teamId) || isNaN(prioridade)) continue;

          if (!grouped.has(nome)) {
            grouped.set(nome, { ordem, palpites: [] });
          }

          grouped.get(nome)!.palpites.push({ team_id: teamId, prioridade });
        }

        const result: ApostadorImportPayload[] = [];
        for (const [nome, { ordem, palpites }] of grouped) {
          result.push({
            nome,
            ordem_inscricao: ordem,
            palpites: palpites.sort((a, b) => a.prioridade - b.prioridade),
          });
        }

        resolve(result);
      } catch {
        reject(new Error("Erro ao ler o arquivo Excel."));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsArrayBuffer(file);
  });
}
