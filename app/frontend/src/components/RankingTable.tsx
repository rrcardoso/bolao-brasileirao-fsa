import { useState } from "react";
import type { RankingEntry } from "../types";

const podiumColors = [
  "bg-yellow-100 border-l-4 border-yellow-400",
  "bg-gray-100 border-l-4 border-gray-400",
  "bg-orange-100 border-l-4 border-orange-400",
  "bg-amber-50 border-l-4 border-amber-300",
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

interface Props {
  entries: RankingEntry[];
  displayColumn: string;
}

export default function RankingTable({ entries, displayColumn }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Nenhum apostador cadastrado ainda.
      </div>
    );
  }

  const N = entries[0].pontos.length;
  const useCode = displayColumn === "teamNameCode";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm -mx-3 sm:mx-0">
      <table className="min-w-[600px] w-full text-sm">
        <thead>
          <tr className="bg-brand text-white text-xs uppercase tracking-wider">
            <th className="px-2 sm:px-3 py-2.5 text-center sticky left-0 bg-brand z-10" rowSpan={2}>
              #
            </th>
            <th className="px-2 sm:px-3 py-2.5 text-left sticky left-8 bg-brand z-10" rowSpan={2}>
              Apostador
            </th>
            <th className="px-2 sm:px-3 py-2.5 text-center" rowSpan={2}>
              Total
            </th>
            <th
              className="px-2 py-1.5 text-center border-l border-white/20"
              colSpan={N}
            >
              Pontuação
            </th>
            <th
              className="px-2 py-1.5 text-center border-l border-white/20"
              colSpan={N}
            >
              Times
            </th>
          </tr>
          <tr className="bg-brand-dark text-white text-xs">
            {Array.from({ length: N }, (_, i) => (
              <th key={`p${i}`} className="px-2 py-1.5 text-center font-medium">
                {i + 1}
              </th>
            ))}
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
          {entries.map((entry, idx) => (
            <tr
              key={entry.apostador}
              className={`group relative ${
                idx < podiumColors.length
                  ? podiumColors[idx]
                  : idx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
              } hover:bg-blue-50 transition-colors`}
            >
              <td className="px-2 sm:px-3 py-2.5 text-center font-bold text-gray-500 sticky left-0 z-10" style={{ background: "inherit" }}>
                {idx < podiumBadges.length ? (
                  <span className="text-base">{podiumBadges[idx]}</span>
                ) : (
                  entry.rank
                )}
              </td>
              <td className="px-2 sm:px-3 py-2.5 font-semibold sticky left-8 z-10" style={{ background: "inherit" }}>
                <div className="group/name relative inline-flex items-center gap-2 cursor-default">
                  {entry.apostador}
                  <span className="pointer-events-none absolute left-full ml-2 hidden group-hover/name:inline-flex items-center whitespace-nowrap text-[10px] font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shadow-sm">
                    Inscrição #{entry.ordem_inscricao}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-brand text-lg">
                {entry.total}
              </td>
              {entry.pontos.map((pts, i) => (
                <td
                  key={`p${i}`}
                  className="px-2 py-2.5 text-center text-gray-600"
                >
                  {pts}
                </td>
              ))}
              {(useCode ? entry.times_codes : entry.times).map((name, i) => (
                <td
                  key={`t${i}`}
                  className={`px-2 py-2.5 text-center text-gray-500 border-l border-gray-100 ${
                    useCode ? "text-xs font-mono" : "text-xs"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <BadgeImg teamId={entry.team_ids[i]} />
                    <span>{name}</span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
