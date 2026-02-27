import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Team } from "../types";

function BadgeImg({ sofascoreId }: { sofascoreId: number }) {
  const [error, setError] = useState(false);
  if (!sofascoreId || error) return null;
  return (
    <img
      src={`/static/badges/${sofascoreId}.webp`}
      alt=""
      className="w-6 h-6"
      onError={() => setError(true)}
    />
  );
}

const ZONE_COLORS: Record<string, string> = {
  libertadores: "border-l-4 border-green-700 bg-green-50/50",
  preLibertadores: "border-l-4 border-green-400 bg-green-50/30",
  sulamericana: "border-l-4 border-blue-500 bg-blue-50/50",
  nenhuma: "border-l-4 border-orange-400 bg-orange-50/50",
  rebaixamento: "border-l-4 border-red-500 bg-red-50/50",
};

function getZone(position: number) {
  if (position <= 4) return "libertadores";
  if (position === 5) return "preLibertadores";
  if (position >= 6 && position <= 11) return "sulamericana";
  if (position >= 12 && position <= 16) return "nenhuma";
  if (position >= 17) return "rebaixamento";
  return "";
}

export default function Classificacao() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getStandings()
      .then(setTeams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
    );

  if (teams.length === 0)
    return (
      <div className="text-center py-12 text-gray-400">
        Nenhum dado de classificação. Execute o sync primeiro.
      </div>
    );

  const lastUpdate = teams[0]?.updated_at;

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Brasileirão Série A — 2026
            </h2>
            {lastUpdate && (
              <p className="text-xs text-gray-400 mt-1">
                Atualizado em:{" "}
                {new Date(lastUpdate).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-700" /> Libertadores
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-400" /> Pré-Lib.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-blue-500" /> Sul-Americana
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-orange-400" /> Nenhuma
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500" /> Rebaixamento
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm -mx-3 sm:mx-0">
        <table className="min-w-[480px] w-full text-sm">
          <thead>
            <tr className="bg-brand text-white text-xs uppercase tracking-wider">
              <th className="px-2 sm:px-3 py-2.5 text-center w-10 sm:w-12">#</th>
              <th className="px-2 sm:px-3 py-2.5 text-left">Time</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center">P</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center">J</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center">V</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center">E</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center">D</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center hidden sm:table-cell">GP</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center hidden sm:table-cell">GC</th>
              <th className="px-1.5 sm:px-3 py-2.5 text-center">SG</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => {
              const zone = getZone(team.position);
              const zoneClass = zone ? ZONE_COLORS[zone] : "";
              const sg = team.goals_for - team.goals_against;

              return (
                <tr
                  key={team.id}
                  className={`${zoneClass} ${
                    !zone && idx % 2 === 0 ? "bg-white" : !zone ? "bg-gray-50" : ""
                  } hover:bg-blue-50/70 transition-colors`}
                >
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold text-gray-500">
                    {team.position}
                  </td>
                  <td className="px-2 sm:px-3 py-2.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <BadgeImg sofascoreId={team.sofascore_id} />
                      <span className="font-semibold text-gray-800 hidden sm:inline">
                        {team.name}
                      </span>
                      <span className="font-semibold text-gray-800 sm:hidden text-xs">
                        {team.name_code}
                      </span>
                      <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                        {team.name_code}
                      </span>
                    </div>
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center font-bold text-brand text-sm sm:text-base">
                    {team.points}
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600">
                    {team.matches}
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600">
                    {team.wins}
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600">
                    {team.draws}
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600">
                    {team.losses}
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600 hidden sm:table-cell">
                    {team.goals_for}
                  </td>
                  <td className="px-1.5 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600 hidden sm:table-cell">
                    {team.goals_against}
                  </td>
                  <td
                    className={`px-1.5 sm:px-3 py-2 sm:py-2.5 text-center font-semibold ${
                      sg > 0
                        ? "text-green-600"
                        : sg < 0
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {sg > 0 ? `+${sg}` : sg}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
