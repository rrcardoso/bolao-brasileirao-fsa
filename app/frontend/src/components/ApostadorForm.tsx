import { useEffect, useState } from "react";
import { api } from "../api/client";
import TeamSelect from "./TeamSelect";
import type { ApostadorOut, Team } from "../types";

interface Props {
  onSaved: () => void;
  editing?: ApostadorOut | null;
  onCancelEdit?: () => void;
}

export default function ApostadorForm({ onSaved, editing, onCancelEdit }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [nome, setNome] = useState("");
  const [ordem, setOrdem] = useState(1);
  const [selections, setSelections] = useState<(number | "")[]>(
    Array(7).fill("")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.getTeams().then(setTeams);
  }, []);

  useEffect(() => {
    if (!editing) {
      api.getApostadores().then((list) => {
        if (list.length > 0) {
          const maxOrdem = Math.max(...list.map((a) => a.ordem_inscricao));
          setOrdem(maxOrdem + 1);
        }
      });
      return;
    }
    setNome(editing.nome);
    setOrdem(editing.ordem_inscricao);
    const palpites = [...editing.palpites].sort(
      (a, b) => a.prioridade - b.prioridade
    );
    setSelections(
      palpites.map((p) => (p.team ? p.team.sofascore_id : p.team_id))
    );
    setError("");
    setSuccess("");
  }, [editing]);

  const selectedIds = selections.filter((s) => s !== "") as number[];
  const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;
  const isEditing = !!editing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selections.some((s) => s === "")) {
      setError("Selecione todos os 7 times.");
      return;
    }
    if (hasDuplicates) {
      setError("Times duplicados selecionados.");
      return;
    }

    const palpites = selections.map((teamId, idx) => ({
      team_id: teamId as number,
      prioridade: idx + 1,
    }));

    setLoading(true);
    try {
      if (isEditing) {
        await api.updateApostador(editing.id, {
          nome,
          ordem_inscricao: ordem,
          palpites,
        });
        setSuccess(`${nome} atualizado com sucesso!`);
      } else {
        await api.createApostador({
          nome,
          ordem_inscricao: ordem,
          palpites,
        });
        setSuccess(`${nome} cadastrado com sucesso!`);
        setNome("");
        setSelections(Array(7).fill(""));
        setOrdem((prev) => prev + 1);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  function updateSelection(idx: number, value: number | "") {
    const next = [...selections];
    next[idx] = value;
    setSelections(next);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-brand">
          {isEditing ? `Editar: ${editing.nome}` : "Cadastrar Apostador"}
        </h3>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex: Nery"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Ordem de Inscrição
          </label>
          <input
            type="number"
            value={ordem}
            onChange={(e) => setOrdem(Number(e.target.value))}
            min={1}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Seleção de Times (Prioridade 1-7)
        </p>
        <div className="grid grid-cols-1 gap-2">
          {selections.map((sel, idx) => {
            const isDuplicate =
              sel !== "" && selections.filter((s) => s === sel).length > 1;
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-xs font-bold text-gray-400 text-right shrink-0">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <TeamSelect
                    teams={teams}
                    value={sel}
                    onChange={(v) => updateSelection(idx, v)}
                    isDuplicate={isDuplicate}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || hasDuplicates}
        className={`w-full py-2.5 rounded-lg text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
          isEditing
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-brand hover:bg-brand-dark"
        }`}
      >
        {loading
          ? "Salvando..."
          : isEditing
            ? "Salvar Alterações"
            : "Cadastrar"}
      </button>
    </form>
  );
}
