import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { ConfigOut, SyncResponse } from "../types";

function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao fazer login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-10 sm:py-20 px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 w-full max-w-sm space-y-5"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-light mb-3">
            <svg
              className="w-7 h-7 text-brand"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Acesso Admin</h2>
          <p className="text-sm text-gray-400 mt-1">
            Insira suas credenciais para continuar
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Usuário
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function AdminPanel() {
  const { logout } = useAuth();
  const [config, setConfig] = useState<ConfigOut | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  async function handleSync() {
    setSyncing(true);
    setError("");
    setSyncResult(null);
    try {
      const result = await api.sync();
      setSyncResult(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro no sync.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Admin</h2>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          Sair
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
          Sincronizar Dados
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Busca os dados atualizados da API Sofascore e atualiza o banco local
          (times, ranking e histórico).
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-6 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Sincronizando...
            </span>
          ) : (
            "Sincronizar Agora"
          )}
        </button>

        {syncResult && (
          <div className="mt-4 bg-green-50 text-green-700 p-4 rounded-lg text-sm">
            <p className="font-semibold">{syncResult.message}</p>
            <ul className="mt-1 list-disc list-inside text-green-600">
              <li>{syncResult.teams_count} times atualizados</li>
              <li>{syncResult.apostadores_count} apostadores no sistema</li>
              {syncResult.historico_session && (
                <li>Histórico: sessão {syncResult.historico_session}</li>
              )}
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {config && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
            Configuração Atual
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 text-sm">
            {[
              ["Ano", config.season_year],
              ["Tournament ID", config.tournament_id],
              ["Season ID", config.season_id],
              ["Times/apostador", config.times_per_apostador],
              ["Proteção mínima", config.min_teams_protection],
              ["Exibição", config.display_column],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-gray-400 text-xs uppercase tracking-wider">
                  {String(label)}
                </dt>
                <dd className="font-medium text-gray-800 mt-0.5">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  return authenticated ? <AdminPanel /> : <LoginForm />;
}
