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
  const [showFullName, setShowFullName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nome: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  function handleDelete(id: number, nome: string) {
    setConfirmDelete({ id, nome });
  }

  async function executeDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.deleteApostador(confirmDelete.id);
      if (editing?.id === confirmDelete.id) setEditing(null);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
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

      <div className={authenticated ? "lg:col-span-2" : ""}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Apostadores</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {sorted.length} participante{sorted.length !== 1 ? "s" : ""} — ordenados por inscrição
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFullName((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
              title={showFullName ? "Mostrar siglas" : "Mostrar nomes completos"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span className="hidden sm:inline">{showFullName ? "Siglas" : "Nomes"}</span>
            </button>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sorted.map((ap) => (
              <div
                key={ap.id}
                className={`bg-white rounded-xl border shadow-sm flex flex-col transition-colors overflow-visible ${
                  editing?.id === ap.id
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div className="px-3 pt-2 pb-1.5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-brand-light text-brand px-1.5 py-0.5 rounded-full font-semibold">
                      #{ap.ordem_inscricao}
                    </span>
                    {authenticated && (
                      <div className="flex items-center">
                        <button
                          onClick={() => handleEdit(ap)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(ap.id, ap.nome)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remover"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="group/name relative mt-0.5">
                    <span className="font-bold text-sm text-gray-800 block truncate cursor-default">
                      {ap.nome}
                    </span>
                    <span className="pointer-events-none absolute left-0 top-full mt-1 z-50 hidden group-hover/name:block bg-gray-800 text-white text-xs font-normal rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                      {ap.nome}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 px-3 py-2 flex-1">
                  {ap.palpites
                    .sort((a, b) => a.prioridade - b.prioridade)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                      >
                        <span className="font-bold text-gray-400 w-3 text-right shrink-0">
                          {p.prioridade}
                        </span>
                        {p.team && (
                          <img
                            src={`/static/badges/${p.team.sofascore_id}.webp`}
                            alt=""
                            className="w-4 h-4 shrink-0"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        )}
                        <span className="truncate">
                          {showFullName
                            ? (p.team ? p.team.name : `Time #${p.team_id}`)
                            : (p.team ? p.team.name_code : `#${p.team_id}`)}
                        </span>
                      </div>
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

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Remover apostador</h3>
            <p className="text-sm text-gray-500 mb-5">
              Tem certeza que deseja remover <strong className="text-gray-700">{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
