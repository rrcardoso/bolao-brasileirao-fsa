import { useState } from "react";
import type { RankingEntry } from "../types";

const podiumCellColors = [
  "bg-yellow-100 dark:bg-yellow-900/30",
  "bg-gray-100 dark:bg-gray-700/50",
  "bg-orange-100 dark:bg-orange-900/30",
  "bg-amber-50 dark:bg-amber-900/20",
];

const podiumBorderColor = [
  "border-l-4 border-yellow-400",
  "border-l-4 border-gray-400",
  "border-l-4 border-orange-400",
  "border-l-4 border-amber-300",
];

const podiumBadges = ["🥇", "🥈", "🥉", "4°"];

function BadgeImg({ teamId }: { teamId: number }) {
  const [error, setError] = useState(false);
  if (!teamId || error) return null;
  return (
    <img
      src={`/static/badges/${teamId}.webp`}
      alt=""
      className="w-5 h-5 shrink-0"
      onError={() => setError(true)}
    />
  );
}

function zoneStyle(position: number): { bg: string; text: string; ring: string } {
  if (position >= 1 && position <= 4)
    return { bg: "bg-green-100/70 dark:bg-green-900/40", text: "text-green-800 dark:text-green-300", ring: "ring-green-300/60 dark:ring-green-700/60" };
  if (position === 5)
    return { bg: "bg-green-50/70 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", ring: "ring-green-200/60 dark:ring-green-700/40" };
  if (position >= 6 && position <= 11)
    return { bg: "bg-blue-50/70 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200/60 dark:ring-blue-700/40" };
  if (position >= 12 && position <= 16)
    return { bg: "bg-orange-50/70 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-200/60 dark:ring-orange-700/40" };
  if (position >= 17)
    return { bg: "bg-red-50/70 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", ring: "ring-red-200/60 dark:ring-red-700/40" };
  return { bg: "bg-gray-50 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400", ring: "ring-gray-200 dark:ring-gray-600" };
}

interface Props {
  entries: RankingEntry[];
}

export default function RankingCompact({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Nenhum apostador cadastrado ainda.
      </div>
    );
  }

  const N = entries[0].pontos.length;

  return (
    <>
      {/* Desktop: tabela horizontal */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand dark:bg-gray-700 text-white text-xs uppercase tracking-wider">
              <th className="px-3 py-2.5 text-center">#</th>
              <th className="px-3 py-2.5 text-left">Apostador</th>
              <th className="px-3 py-2.5 text-center">Total</th>
              {Array.from({ length: N }, (_, i) => (
                <th
                  key={i}
                  className="px-2 py-2.5 text-center border-l border-white/20"
                >
                  P{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const isPodium = idx < podiumCellColors.length;
              const cellBg = isPodium
                ? podiumCellColors[idx]
                : idx % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50 dark:bg-gray-800/50";
              const rowBg = idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/50";

              return (
                <tr key={entry.apostador} className="transition-colors">
                  <td
                    className={`px-3 py-3 text-center font-bold text-gray-500 dark:text-gray-400 ${cellBg} ${isPodium ? podiumBorderColor[idx] : ""}`}
                  >
                    {idx < podiumBadges.length ? (
                      <span className="text-base">{podiumBadges[idx]}</span>
                    ) : (
                      entry.rank
                    )}
                  </td>
                  <td className={`px-3 py-3 font-semibold dark:text-gray-100 ${cellBg}`}>
                    <div className="group/name relative inline-flex items-center gap-2 cursor-default">
                      {entry.apostador}
                      <span className="pointer-events-none absolute left-full ml-2 hidden group-hover/name:inline-flex items-center whitespace-nowrap text-[10px] font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded shadow-sm">
                        Inscrição #{entry.ordem_inscricao}
                      </span>
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-center ${cellBg}`}>
                    <span className="inline-flex items-center justify-center font-bold text-brand text-lg min-w-[2rem]">
                      {entry.total}
                    </span>
                  </td>
                  {entry.pontos.map((pts, i) => {
                    const pos = entry.team_positions[i];
                    const zone = zoneStyle(pos);
                    return (
                      <td
                        key={i}
                        className={`px-1.5 py-2 border-l border-gray-100 dark:border-gray-700 ${rowBg}`}
                      >
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ring-1 ${zone.bg} ${zone.text} ${zone.ring}`}
                        >
                          <BadgeImg teamId={entry.team_ids[i]} />
                          <span className="font-mono text-xs font-semibold">
                            {entry.times_codes[i]}
                          </span>
                          <span className="ml-auto font-bold text-sm tabular-nums">
                            {pts}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards empilhados */}
      <div className="sm:hidden space-y-3">
        {entries.map((entry, idx) => {
          const isPodium = idx < podiumCellColors.length;
          return (
            <div
              key={entry.apostador}
              className={`rounded-xl border shadow-sm overflow-hidden ${
                isPodium ? "border-l-4 " + podiumBorderColor[idx].replace("border-l-4 ", "") : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className={`flex items-center justify-between px-3 py-2.5 ${isPodium ? podiumCellColors[idx] : "bg-white dark:bg-gray-800"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-500 dark:text-gray-400 w-7 text-center">
                    {idx < podiumBadges.length ? podiumBadges[idx] : entry.rank}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{entry.apostador}</span>
                  <span className="text-[10px] text-gray-400">#{entry.ordem_inscricao}</span>
                </div>
                <span className="font-bold text-brand text-lg">{entry.total}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-2 bg-gray-50/50 dark:bg-gray-800/50">
                {entry.pontos.map((pts, i) => {
                  const pos = entry.team_positions[i];
                  const zone = zoneStyle(pos);
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-1 px-1.5 py-1 rounded-md ring-1 ${zone.bg} ${zone.text} ${zone.ring}`}
                    >
                      <BadgeImg teamId={entry.team_ids[i]} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[10px] font-semibold truncate">
                          {entry.times_codes[i]}
                        </span>
                        <span className="font-bold text-xs tabular-nums">
                          {pts}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
