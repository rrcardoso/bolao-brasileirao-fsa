import { useEffect, useRef, useState } from "react";
import type { Team } from "../types";

interface Props {
  teams: Team[];
  value: number | "";
  onChange: (teamId: number | "") => void;
  isDuplicate?: boolean;
}

export default function TeamSelect({
  teams,
  value,
  onChange,
  isDuplicate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.sofascore_id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.name_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setSearch("");
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-left outline-none focus:ring-2 focus:ring-brand ${
          isDuplicate
            ? "border-red-400 bg-red-50"
            : "border-gray-300 bg-white"
        }`}
      >
        {selected ? (
          <>
            <img
              src={`/static/badges/${selected.sofascore_id}.webp`}
              alt=""
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-400">Selecione um time...</span>
        )}
        <svg
          className="w-4 h-4 ml-auto text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar time..."
            autoFocus
            className="px-3 py-2 border-b border-gray-100 text-sm outline-none"
          />
          <div className="overflow-y-auto">
            {value !== "" && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-400 hover:bg-gray-50"
              >
                Limpar seleção
              </button>
            )}
            {filtered.map((t) => (
              <button
                key={t.sofascore_id}
                type="button"
                onClick={() => {
                  onChange(t.sofascore_id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                  t.sofascore_id === value
                    ? "bg-brand-light font-medium"
                    : ""
                }`}
              >
                <img
                  src={`/static/badges/${t.sofascore_id}.webp`}
                  alt=""
                  className="w-5 h-5 shrink-0"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className="truncate">{t.name}</span>
                <span className="text-xs text-gray-400 ml-auto shrink-0">
                  {t.name_code}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Nenhum time encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
