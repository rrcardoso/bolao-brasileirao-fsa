import { useEffect, useState } from "react";
import { api } from "../api/client";
import EvolutionChart from "../components/EvolutionChart";
import type { SnapshotOut } from "../types";

export default function Historico() {
  const [snapshots, setSnapshots] = useState<SnapshotOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<"pontuacao" | "rank">("pontuacao");

  const loadData = () => {
    setLoading(true);
    setError("");
    api
      .getHistorico()
      .then(setSnapshots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>
        <button onClick={loadData} className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm">
          Tentar novamente
        </button>
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Evolução do Campeonato
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-0.5 self-start">
          <button
            onClick={() => setMetric("pontuacao")}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              metric === "pontuacao"
                ? "bg-white text-brand shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pontuação
          </button>
          <button
            onClick={() => setMetric("rank")}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              metric === "rank"
                ? "bg-white text-brand shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Posição
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-6">
        <EvolutionChart snapshots={snapshots} metric={metric} />
      </div>

      {snapshots.length > 0 && (
        <div className="mt-4 sm:mt-6 overflow-x-auto rounded-xl border border-gray-200 shadow-sm -mx-3 sm:mx-0">
          <table className="min-w-[420px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-2 sm:px-4 py-2 text-left">Data</th>
                <th className="px-2 sm:px-4 py-2 text-center">Rod.</th>
                <th className="px-2 sm:px-4 py-2 text-left">Apostador</th>
                <th className="px-2 sm:px-4 py-2 text-center">Pts</th>
                <th className="px-2 sm:px-4 py-2 text-center">Pos</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s, i) => (
                <tr
                  key={`${s.session_date}-${s.apostador}`}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-2 sm:px-4 py-2 text-gray-600 whitespace-nowrap">
                    {s.session_date}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-center text-gray-600">
                    {s.rodada}
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-medium">{s.apostador}</td>
                  <td className="px-2 sm:px-4 py-2 text-center font-bold text-brand">
                    {s.pontuacao}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-center">{s.rank}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
