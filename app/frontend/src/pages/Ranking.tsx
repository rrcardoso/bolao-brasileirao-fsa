import { useEffect, useState } from "react";
import { api } from "../api/client";
import RankingTable from "../components/RankingTable";
import RankingCompact from "../components/RankingCompact";
import { exportRankingPdf } from "../utils/exportPdf";
import type { RankingResponse } from "../types";

type ViewMode = "compact" | "detailed";

export default function Ranking() {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewMode>("compact");
  const [showFullName, setShowFullName] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError("");
    api
      .getRanking()
      .then(setData)
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

  if (!data) return null;

  const displayColumn = showFullName ? "teamName" : "teamNameCode";

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Ranking</h2>
            <p className="text-xs text-gray-400 mt-1">{data.updated_at}</p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportRankingPdf(data.entries, data.updated_at);
              } finally {
                setExporting(false);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <>
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                <span className="hidden sm:inline">Gerando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setView("compact")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "compact"
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Compacta
            </button>
            <button
              type="button"
              onClick={() => setView("detailed")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "detailed"
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Detalhada
            </button>
          </div>

          {view === "detailed" && (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium transition-colors ${!showFullName ? "text-brand" : "text-gray-400"}`}
              >
                Código
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showFullName}
                onClick={() => setShowFullName((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                  showFullName ? "bg-brand" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showFullName ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-medium transition-colors ${showFullName ? "text-brand" : "text-gray-400"}`}
              >
                Nome
              </span>
            </div>
          )}
        </div>
      </div>

      {view === "compact" ? (
        <RankingCompact entries={data.entries} />
      ) : (
        <RankingTable entries={data.entries} displayColumn={displayColumn} />
      )}
    </div>
  );
}
