import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import ApostadorForm from "../components/ApostadorForm";
import { exportApostadoresExcel } from "../utils/exportExcel";
import { parseApostadoresExcel } from "../utils/importExcel";
import type { ApostadorOut, ImportResult } from "../types";

export default function Apostadores() {
  const { authenticated } = useAuth();
  const [apostadores, setApostadores] = useState<ApostadorOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApostadorOut | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api
      .getApostadores()
      .then(setApostadores)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    if (!authenticated) setEditing(null);
  }, [authenticated]);

  function handleEdit(ap: ApostadorOut) {
    setEditing(ap);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCancelEdit() {
    setEditing(null);
  }

  function handleSaved() {
    load();
    if (editing) setEditing(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportResult(null);
    try {
      const parsed = await parseApostadoresExcel(file);
      if (parsed.length === 0) {
        alert("Nenhum apostador encontrado no arquivo.");
        setImporting(false);
        return;
      }
      const result = await api.importApostadores(parsed);
      setImportResult(result);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao importar.");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return;
    try {
      await api.deleteApostador(id);
      if (editing?.id === id) setEditing(null);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  const sorted = [...apostadores].sort(
    (a, b) => a.ordem_inscricao - b.ordem_inscricao
  );

  return (
    <div className={authenticated ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : ""}>
      {authenticated && (
        <div className="lg:col-span-1" ref={formRef}>
          <ApostadorForm
            onSaved={handleSaved}
            editing={editing}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      )}

      <div className={authenticated ? "lg:col-span-2" : "max-w-3xl mx-auto"}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Apostadores</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {sorted.length} participante{sorted.length !== 1 ? "s" : ""} — ordenados por inscrição
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!authenticated && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Somente leitura
              </span>
            )}
            {authenticated && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {importing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">Importar Excel</span>
                  <span className="sm:hidden">Importar</span>
                </button>
              </>
            )}
            {apostadores.length > 0 && (
              <button
                onClick={() => exportApostadoresExcel(apostadores)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Exportar Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhum apostador cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((ap) => (
              <div
                key={ap.id}
                className={`bg-white rounded-xl border shadow-sm p-3 sm:p-4 transition-colors ${
                  editing?.id === ap.id
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{ap.nome}</span>
                    <span className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full">
                      #{ap.ordem_inscricao}
                    </span>
                  </div>
                  {authenticated && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(ap)}
                        className="text-blue-400 hover:text-blue-600 text-xs sm:text-sm px-1.5 sm:px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(ap.id, ap.nome)}
                        className="text-red-400 hover:text-red-600 text-xs sm:text-sm px-1.5 sm:px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ap.palpites
                    .sort((a, b) => a.prioridade - b.prioridade)
                    .map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                      >
                        <span className="font-bold text-gray-400">
                          {p.prioridade}.
                        </span>
                        {p.team && (
                          <img
                            src={`/static/badges/${p.team.sofascore_id}.webp`}
                            alt=""
                            className="w-4 h-4"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        )}
                        <span className="hidden sm:inline">
                          {p.team ? p.team.name : `Time #${p.team_id}`}
                        </span>
                        <span className="sm:hidden">
                          {p.team ? p.team.name_code : `#${p.team_id}`}
                        </span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Resultado da Importação</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span><strong>{importResult.created}</strong> apostador{importResult.created !== 1 ? "es" : ""} criado{importResult.created !== 1 ? "s" : ""}</span>
              </div>
              {importResult.skipped > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                  <span><strong>{importResult.skipped}</strong> pulado{importResult.skipped !== 1 ? "s" : ""} (já existiam)</span>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                    <span><strong>{importResult.errors.length}</strong> erro{importResult.errors.length !== 1 ? "s" : ""}:</span>
                  </div>
                  <ul className="ml-5 space-y-0.5 text-xs text-red-600 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="mt-5 w-full py-2 rounded-lg bg-brand text-white font-medium hover:bg-green-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
