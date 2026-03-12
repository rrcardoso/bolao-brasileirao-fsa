import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { RankingEntry } from "../types";

interface Props {
  entries: RankingEntry[];
  updatedAt: string;
  rodada: number;
  onClose: () => void;
}

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function ShareCard({ entries, updatedAt, rodada, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function capture() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) return;

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "ranking.png")] })) {
        const file = new File([blob], "ranking-bolao.png", { type: "image/png" });
        await navigator.share({ files: [file], title: "Ranking Bolão Brasileirão 2026" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ranking-bolao.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setGenerating(false);
    }
  }

  const half = Math.ceil(entries.length / 2);
  const col1 = entries.slice(0, half);
  const col2 = entries.slice(half);

  function Row({ entry }: { entry: RankingEntry }) {
    const medal = medals[entry.rank];
    return (
      <div className="flex items-center gap-1 px-2 py-[3px]">
        <span
          className="w-6 text-right shrink-0"
          style={{ fontSize: medal ? "0.85rem" : "0.65rem", color: medal ? undefined : "rgba(255,255,255,0.6)" }}
        >
          {medal ?? `${entry.rank}°`}
        </span>
        <span className="flex-1 text-white text-[11px] font-medium truncate">
          {entry.apostador}
        </span>
        <span className="text-white text-[11px] font-bold tabular-nums">
          {entry.total}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="flex flex-col items-center gap-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div
          ref={cardRef}
          className="w-[380px] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #2c5aa0 50%, #1e3f73 100%)",
          }}
        >
          <div className="px-4 pt-4 pb-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <img src="/logo.png" alt="" className="w-7 h-7 rounded-lg" crossOrigin="anonymous" />
              <span className="text-white font-extrabold text-base tracking-tight">
                Bolão Brasileirão 2026
              </span>
            </div>
            <p className="text-blue-200 text-[10px]">
              Rodada {rodada} &middot; {updatedAt}
            </p>
          </div>

          <div className="px-3 pb-3">
            <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden">
              <div className="flex">
                <div className="flex-1 border-r border-white/10">
                  {col1.map((e) => <Row key={e.apostador} entry={e} />)}
                </div>
                <div className="flex-1">
                  {col2.map((e) => <Row key={e.apostador} entry={e} />)}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-3 text-center">
            <p className="text-blue-300/60 text-[9px]">
              bolao-brasileirao.onrender.com
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white/20 text-white font-medium text-sm hover:bg-white/30 transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={generating}
            className="px-5 py-2 rounded-lg bg-white text-[#2c5aa0] font-bold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-[#2c5aa0] border-t-transparent rounded-full" />
                Gerando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartilhar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
