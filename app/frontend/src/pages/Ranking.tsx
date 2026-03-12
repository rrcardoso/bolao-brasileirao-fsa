import { useEffect, useState } from "react";
import { api } from "../api/client";
import RankingTable from "../components/RankingTable";
import RankingCompact from "../components/RankingCompact";
import ShareCard from "../components/ShareCard";
import { exportRankingPdf } from "../utils/exportPdf";
import type { RankingResponse } from "../types";

type ViewMode = "compact" | "detailed";

const METRICS_HELP = [
  { label: "#", desc: "Posição no ranking. A seta colorida abaixo indica a variação desde a última sessão (▲ subiu, ▼ desceu)." },
  { label: "Inscr.", desc: "Ordem de inscrição do apostador. Usado como critério final de desempate (quem se inscreveu primeiro leva vantagem)." },
  { label: "Total", desc: "Soma dos pontos reais dos 7 times escolhidos na classificação do Brasileirão. Quanto maior, melhor." },
  { label: "Jogos", desc: "Soma do número de partidas disputadas pelos 7 times escolhidos." },
  { label: "Média", desc: "Média de pontos por jogo (Total ÷ Jogos). Indica a eficiência dos times em converter partidas em pontos." },
  { label: "Aprov.", desc: "Aproveitamento: percentual dos pontos possíveis conquistados — (Total ÷ (Jogos × 3)) × 100. Se todos os times vencessem todos os jogos, seria 100%." },
  { label: "Pos. Média", desc: "Posição média dos 7 times na classificação do Brasileirão. Quanto menor, melhor posicionados estão os times." },
  { label: "Δ Pts", desc: "Variação de pontos desde a última sessão. Verde = ganhou pontos, vermelho = perdeu." },
  { label: "Dist. Top 4", desc: "Distância em pontos para o 4° lugar (zona de premiação). Positivo = acima do corte, negativo = abaixo." },
  { label: "Times 1–7", desc: "Código dos times escolhidos, na ordem de prioridade. Use o interruptor 'Times + Pts' para exibir os pontos ao lado de cada time." },
];

function MetricsHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Colunas do Ranking Detalhado</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {METRICS_HELP.map((m) => (
            <div key={m.label}>
              <span className="inline-block text-xs font-bold text-brand bg-brand-light dark:bg-brand-dark dark:text-white px-2 py-0.5 rounded mr-2">
                {m.label}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{m.desc}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewMode>("compact");
  const [showPoints, setShowPoints] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg text-center">{error}</div>
        <button onClick={loadData} className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm">
          Tentar novamente
        </button>
      </div>
    );

  if (!data) return null;

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Ranking</h2>
            <p className="text-xs text-gray-400 mt-1">
              Rodada {data.rodada} &middot; {data.updated_at}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              title="Compartilhar ranking"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
            {view === "detailed" && (
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-brand hover:border-brand transition-colors"
                title="O que significa cada coluna?"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Ajuda</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5">
            <button
              type="button"
              onClick={() => setView("compact")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "compact"
                  ? "bg-white dark:bg-gray-600 text-brand shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Compacta
            </button>
            <button
              type="button"
              onClick={() => setView("detailed")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "detailed"
                  ? "bg-white dark:bg-gray-600 text-brand shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Detalhada
            </button>
          </div>

          {view === "detailed" && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium transition-colors ${!showPoints ? "text-brand" : "text-gray-400 dark:text-gray-500"}`}>
                Times
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showPoints}
                onClick={() => setShowPoints((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                  showPoints ? "bg-brand" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showPoints ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-medium transition-colors ${showPoints ? "text-brand" : "text-gray-400 dark:text-gray-500"}`}>
                Times + Pts
              </span>
            </div>
          )}
        </div>
      </div>

      {view === "compact" ? (
        <RankingCompact entries={data.entries} />
      ) : (
        <RankingTable entries={data.entries} showPoints={showPoints} />
      )}

      {showHelp && <MetricsHelpModal onClose={() => setShowHelp(false)} />}
      {showShare && (
        <ShareCard
          entries={data.entries}
          updatedAt={data.updated_at}
          rodada={data.rodada}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
