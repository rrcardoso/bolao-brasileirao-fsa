import {
  CartesianGrid,
  Legend,
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

interface Props {
  snapshots: SnapshotOut[];
  metric: "pontuacao" | "rank";
}

export default function EvolutionChart({ snapshots, metric }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Sem dados de histórico ainda.
      </div>
    );
  }

  const apostadores = [...new Set(snapshots.map((s) => s.apostador))];
  const sessions = [...new Set(snapshots.map((s) => s.session_date))].sort();

  const chartData = sessions.map((date) => {
    const row: Record<string, string | number> = { date };
    const sessionSnaps = snapshots.filter((s) => s.session_date === date);
    for (const snap of sessionSnaps) {
      row[snap.apostador] = metric === "pontuacao" ? snap.pontuacao : snap.rank;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => {
            const parts = v.split("-");
            return `${parts[2]}/${parts[1]}`;
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
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
        {apostadores.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
