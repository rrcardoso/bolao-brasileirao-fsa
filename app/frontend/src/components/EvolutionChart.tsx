import { useState, useCallback, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SnapshotOut } from "../types";

const COLORS = [
  "#2c5aa0",
  "#e74c3c",
  "#27ae60",
  "#f39c12",
  "#8e44ad",
  "#1abc9c",
  "#d35400",
  "#2980b9",
  "#c0392b",
  "#16a085",
  "#7f8c8d",
  "#34495e",
  "#e67e22",
  "#9b59b6",
  "#3498db",
];

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
}

type SnapshotLookup = Map<string, Map<string, { pontuacao: number; rank: number }>>;

function buildLookup(snapshots: SnapshotOut[]): SnapshotLookup {
  const lookup: SnapshotLookup = new Map();
  for (const s of snapshots) {
    if (!lookup.has(s.session_date)) lookup.set(s.session_date, new Map());
    lookup.get(s.session_date)!.set(s.apostador, {
      pontuacao: s.pontuacao,
      rank: s.rank,
    });
  }
  return lookup;
}

function TooltipEntry({
  entry,
  lookup,
  date,
  bold,
  rank,
}: {
  entry: TooltipPayloadEntry;
  lookup: SnapshotLookup;
  date: string;
  bold: boolean;
  rank?: number;
}) {
  const data = lookup.get(date)?.get(entry.dataKey);
  return (
    <div className={`flex items-center gap-2 text-xs ${bold ? "font-bold" : ""}`}>
      {rank != null && (
        <span className="text-gray-400 w-4 text-right font-mono">{rank}.</span>
      )}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: entry.color }}
      />
      <span className="flex-1 truncate">{entry.dataKey}</span>
      <span className="font-bold tabular-nums">{data?.pontuacao ?? "—"} pts</span>
      <span className="text-gray-400 tabular-nums w-6 text-right">{data ? `${data.rank}°` : "—"}</span>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  rodadaByDate,
  metric,
  showAll,
  hoveredLine,
  lookup,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  rodadaByDate: Map<string, number>;
  metric: "pontuacao" | "rank";
  showAll: boolean;
  hoveredLine: string | null;
  lookup: SnapshotLookup;
}) {
  if (!active || !payload || !label) return null;
  const parts = label.split("-");
  const rod = rodadaByDate.get(label) ?? "?";
  const valid = payload.filter((p) => p.value != null);

  if (showAll) {
    const sorted = [...valid].sort((a, b) =>
      metric === "rank" ? a.value - b.value : b.value - a.value,
    );
    const top10 = sorted.slice(0, 10);
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 max-h-80 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1.5">
          <span>Rodada {rod} — {parts[2]}/{parts[1]}/{parts[0]}</span>
          <span className="font-normal text-gray-400 ml-auto">Top 10</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1 px-0.5">
          <span className="w-4" />
          <span className="w-2.5" />
          <span className="flex-1" />
          <span>Pts</span>
          <span className="w-6 text-right">Pos</span>
        </div>
        <div className="space-y-0.5">
          {top10.map((entry, i) => (
            <TooltipEntry
              key={entry.dataKey}
              entry={entry}
              lookup={lookup}
              date={label}
              bold={hoveredLine === entry.dataKey}
              rank={i + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!hoveredLine) return null;
  const target = valid.find((p) => p.dataKey === hoveredLine);
  if (!target) return null;

  const sameValue = valid.filter((p) => p.value === target.value);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg px-3 py-2">
      <div className="text-[10px] text-gray-400 mb-1">
        R{rod} — {parts[2]}/{parts[1]}/{parts[0]}
      </div>
      <div className="space-y-0.5">
        {sameValue.map((entry) => (
          <TooltipEntry
            key={entry.dataKey}
            entry={entry}
            lookup={lookup}
            date={label}
            bold={entry.dataKey === hoveredLine}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  snapshots: SnapshotOut[];
  metric: "pontuacao" | "rank";
  fullscreen?: boolean;
}

export default function EvolutionChart({ snapshots, metric, fullscreen }: Props) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [visible, setVisible] = useState<Set<string> | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Sem dados de histórico ainda.
      </div>
    );
  }

  const apostadores = [...new Set(snapshots.map((s) => s.apostador))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
  const sessions = [...new Set(snapshots.map((s) => s.session_date))].sort();
  const lookup = buildLookup(snapshots);

  const lastSession = sessions[sessions.length - 1];
  const top10Names = useMemo(() => {
    const lastData = lookup.get(lastSession);
    if (!lastData) return new Set(apostadores.slice(0, 10));
    const sorted = [...lastData.entries()].sort((a, b) => a[1].rank - b[1].rank);
    return new Set(sorted.slice(0, 10).map(([name]) => name));
  }, [lastSession, lookup, apostadores]);

  const visibleSet = visible ?? new Set(apostadores);

  const rodadaByDate = new Map<string, number>();
  for (const s of snapshots) {
    if (!rodadaByDate.has(s.session_date) || s.rodada > rodadaByDate.get(s.session_date)!) {
      rodadaByDate.set(s.session_date, s.rodada);
    }
  }

  const chartData = sessions.map((date) => {
    const row: Record<string, string | number> = {
      date,
      rodada: rodadaByDate.get(date) ?? 0,
    };
    const sessionSnaps = snapshots.filter((s) => s.session_date === date);
    for (const snap of sessionSnaps) {
      row[snap.apostador] = metric === "pontuacao" ? snap.pontuacao : snap.rank;
    }
    return row;
  });

  const toggleVisible = useCallback((name: string) => {
    setVisible((prev) => {
      const next = new Set(prev ?? apostadores);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, [apostadores]);

  const chartHeight = fullscreen ? "100%" : 350;
  const minH = fullscreen ? 500 : 280;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setVisible(new Set(apostadores))}
            className="text-[10px] font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Todos
          </button>
          <button
            onClick={() => setVisible(new Set())}
            className="text-[10px] font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Nenhum
          </button>
          <button
            onClick={() => setVisible(new Set(top10Names))}
            className="text-[10px] font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Top 10
          </button>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
            showAll
              ? "bg-brand text-white border-brand"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
          title={showAll ? "Mostrar individual" : "Mostrar ranking no hover"}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          {showAll ? "Ranking" : "Individual"}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {apostadores.map((name, i) => {
          const color = COLORS[i % COLORS.length];
          const isOn = visibleSet.has(name);
          return (
            <div
              key={name}
              className="flex items-center gap-1 select-none"
            >
              <span
                className="w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                style={{
                  borderColor: color,
                  backgroundColor: isOn ? color : "transparent",
                }}
                onClick={() => toggleVisible(name)}
              >
                {isOn && (
                  <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span
                className="text-[11px] cursor-pointer hover:underline"
                style={{
                  color: isOn ? undefined : "#bbb",
                  fontWeight: highlighted === name ? 700 : 400,
                  textDecoration: highlighted === name ? "underline" : undefined,
                }}
                onClick={() => setHighlighted((prev) => (prev === name ? null : name))}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ height: fullscreen ? "calc(100% - 80px)" : undefined }}>
        <ResponsiveContainer width="100%" height={fullscreen ? "100%" : chartHeight} minHeight={minH}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string, index: number) => {
                const parts = v.split("-");
                const rod = chartData[index]?.rodada ?? "";
                return `R${rod} ${parts[2]}/${parts[1]}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              reversed={metric === "rank"}
              domain={
                metric === "rank"
                  ? [1, "dataMax"]
                  : ["dataMin - 5", "dataMax + 5"]
              }
              label={{
                value: metric === "pontuacao" ? "Pontos" : "Posição",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  rodadaByDate={rodadaByDate}
                  metric={metric}
                  showAll={showAll}
                  hoveredLine={hoveredLine}
                  lookup={lookup}
                />
              }
            />
            {apostadores.map((name, i) => {
              const isVisible = visibleSet.has(name);
              if (!isVisible) return null;
              const isActive = !highlighted || highlighted === name;
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={highlighted === name ? 4 : 2}
                  strokeOpacity={isActive ? 1 : 0.12}
                  dot={isActive ? { r: highlighted === name ? 4 : 3 } : false}
                  activeDot={
                    isActive
                      ? {
                          r: 6,
                          onMouseOver: () => setHoveredLine(name),
                          onMouseLeave: () => setHoveredLine(null),
                        }
                      : undefined
                  }
                  connectNulls
                  onMouseEnter={() => setHoveredLine(name)}
                  onMouseLeave={() => setHoveredLine(null)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
