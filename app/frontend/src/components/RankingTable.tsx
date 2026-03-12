import { useMemo, useState } from "react";
import type { RankingEntry } from "../types";

const podiumColors = [
  "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400",
  "bg-gray-100 dark:bg-gray-700/50 border-l-4 border-gray-400",
  "bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-400",
  "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-300",
];

const podiumBadges = ["🥇", "🥈", "🥉", "4°"];

function BadgeImg({ teamId }: { teamId: number }) {
  const [error, setError] = useState(false);
  if (!teamId || error) return null;
  return (
    <img
      src={`/static/badges/${teamId}.webp`}
      alt=""
      className="w-5 h-5 inline-block"
      onError={() => setError(true)}
    />
  );
}

type SortKey =
  | "rank"
  | "apostador"
  | "total"
  | "total_jogos"
  | "media_pontos"
  | "aproveitamento"
  | "ordem_inscricao"
  | "pos_media"
  | "delta_pontos"
  | "dist_top4";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-block ml-0.5 text-[9px] ${active ? "opacity-100" : "opacity-30"}`}>
      {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );
}

function DeltaRank({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-300 dark:text-gray-600 text-[9px]">—</span>;
  if (value === 0) return <span className="text-gray-400 dark:text-gray-500 text-[9px]">—</span>;
  if (value > 0)
    return <span className="text-green-600 text-[9px] font-semibold">▲{value}</span>;
  return <span className="text-red-500 text-[9px] font-semibold">▼{Math.abs(value)}</span>;
}

function DeltaValue({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  if (value === 0) return <span className="text-gray-400 dark:text-gray-500">0{suffix}</span>;
  if (value > 0)
    return <span className="text-green-600 font-medium">+{value}{suffix}</span>;
  return <span className="text-red-500 font-medium">{value}{suffix}</span>;
}

function avgPositions(positions: number[]): number {
  const valid = positions.filter((p) => p > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

interface Props {
  entries: RankingEntry[];
  showPoints: boolean;
}

export default function RankingTable({ entries, showPoints }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const top4Total = useMemo(() => {
    const byRank = [...entries].sort((a, b) => a.rank - b.rank);
    return byRank.length >= 4 ? byRank[3].total : null;
  }, [entries]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "apostador" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortKey === "apostador") {
        cmp = a.apostador.localeCompare(b.apostador, "pt-BR");
      } else if (sortKey === "pos_media") {
        cmp = avgPositions(a.team_positions) - avgPositions(b.team_positions);
      } else if (sortKey === "delta_pontos") {
        cmp = (a.delta_pontos ?? -9999) - (b.delta_pontos ?? -9999);
      } else if (sortKey === "dist_top4") {
        const da = top4Total !== null ? a.total - top4Total : 0;
        const db2 = top4Total !== null ? b.total - top4Total : 0;
        cmp = da - db2;
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [entries, sortKey, sortDir, top4Total]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Nenhum apostador cadastrado ainda.
      </div>
    );
  }

  const N = entries[0].pontos.length;
  const isDefaultSort = sortKey === "rank" && sortDir === "asc";

  const thSort = (key: SortKey, label: string, title?: string) => (
    <th
      className="px-2 sm:px-3 py-2.5 text-center cursor-pointer select-none hover:bg-white/10 transition-colors"
      rowSpan={2}
      title={title ?? `Ordenar por ${label}`}
      onClick={() => handleSort(key)}
    >
      {label} <SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm -mx-3 sm:mx-0">
      <table className="min-w-[600px] w-full text-sm">
        <thead>
          <tr className="bg-brand dark:bg-gray-700 text-white text-xs uppercase tracking-wider">
            {thSort("rank", "#", "Ordenar por posição")}
            <th
              className="px-2 sm:px-3 py-2.5 text-left sticky left-0 bg-brand dark:bg-gray-700 z-10 cursor-pointer select-none hover:bg-white/10 transition-colors"
              rowSpan={2}
              onClick={() => handleSort("apostador")}
            >
              Apostador <SortIcon active={sortKey === "apostador"} dir={sortDir} />
            </th>
            {thSort("ordem_inscricao", "Inscr.", "Ordem de inscrição")}
            {thSort("total", "Total")}
            {thSort("total_jogos", "Jogos", "Soma de jogos dos 7 times")}
            {thSort("media_pontos", "Média", "Média de pontos por jogo")}
            {thSort("aproveitamento", "Aprov.", "Aproveitamento: % dos pontos possíveis")}
            {thSort("pos_media", "Pos. Média", "Posição média dos 7 times na classificação")}
            {thSort("delta_pontos", "Δ Pts", "Variação de pontos desde a última sessão")}
            {thSort("dist_top4", "Dist. Top 4", "Distância em pontos para o 4° lugar")}
            <th
              className="px-2 py-1.5 text-center border-l border-white/20"
              colSpan={N}
            >
              {showPoints ? "Times + Pts" : "Times"}
            </th>
          </tr>
          <tr className="bg-brand-dark dark:bg-gray-600 text-white text-xs">
            {Array.from({ length: N }, (_, i) => (
              <th
                key={`t${i}`}
                className="px-2 py-1.5 text-center font-medium border-l border-white/10"
              >
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => {
            const rowStyle = isDefaultSort && idx < podiumColors.length
              ? podiumColors[idx]
              : idx % 2 === 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50";

            const posMedia = avgPositions(entry.team_positions);
            const distTop4 = top4Total !== null ? entry.total - top4Total : null;

            return (
              <tr
                key={entry.apostador}
                className={`group relative ${rowStyle} hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors`}
              >
                <td className="px-2 sm:px-3 py-2.5 text-center font-bold text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center leading-tight">
                    <span>
                      {isDefaultSort && idx < podiumBadges.length ? (
                        <span className="text-base">{podiumBadges[idx]}</span>
                      ) : (
                        entry.rank
                      )}
                    </span>
                    <DeltaRank value={entry.delta_rank} />
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2.5 font-semibold sticky left-0 z-10 dark:text-gray-100" style={{ background: "inherit" }}>
                  {entry.apostador}
                </td>
                <td className="px-2 py-2.5 text-center text-gray-400 dark:text-gray-500 text-xs">
                  {entry.ordem_inscricao}
                </td>
                <td className="px-3 py-2.5 text-center font-bold text-brand text-lg">
                  {entry.total}
                </td>
                <td className="px-2 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs">
                  {entry.total_jogos}
                </td>
                <td className="px-2 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
                  {entry.media_pontos.toFixed(2)}
                </td>
                <td className="px-2 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
                  {entry.aproveitamento.toFixed(1)}%
                </td>
                <td className="px-2 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs">
                  {posMedia.toFixed(1)}°
                </td>
                <td className="px-2 py-2.5 text-center text-xs">
                  <DeltaValue value={entry.delta_pontos} />
                </td>
                <td className="px-2 py-2.5 text-center text-xs">
                  <DeltaValue value={distTop4} />
                </td>
                {entry.times_codes.map((code, i) => (
                  <td
                    key={`t${i}`}
                    className="px-2 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <BadgeImg teamId={entry.team_ids[i]} />
                      <span className="font-mono">{code}</span>
                      {showPoints && (
                        <span className="text-gray-400 font-medium">({entry.pontos[i]})</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
