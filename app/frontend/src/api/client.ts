import type {
  ApostadorOut,
  ConfigOut,
  ImportResult,
  RankingResponse,
  SnapshotOut,
  SyncResponse,
  Team,
} from "../types";

const BASE = "/api";
const TOKEN_KEY = "bolao_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return request<T>(path, { ...init, headers });
}

export const api = {
  getTeams: () => request<Team[]>("/teams"),

  getStandings: () => request<Team[]>("/standings"),

  getApostadores: () => request<ApostadorOut[]>("/apostadores"),

  createApostador: (data: {
    nome: string;
    ordem_inscricao: number;
    palpites: { team_id: number; prioridade: number }[];
  }) =>
    authRequest<ApostadorOut>("/apostadores", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateApostador: (
    id: number,
    data: {
      nome?: string;
      ordem_inscricao?: number;
      palpites?: { team_id: number; prioridade: number }[];
    }
  ) =>
    authRequest<ApostadorOut>(`/apostadores/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteApostador: (id: number) =>
    authRequest<void>(`/apostadores/${id}`, { method: "DELETE" }),

  importApostadores: (
    data: { nome: string; ordem_inscricao: number; palpites: { team_id: number; prioridade: number }[] }[]
  ) =>
    authRequest<ImportResult>("/apostadores/import", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRanking: () => request<RankingResponse>("/ranking"),

  getHistorico: (apostador?: string) => {
    const params = apostador
      ? `?apostador=${encodeURIComponent(apostador)}`
      : "";
    return request<SnapshotOut[]>(`/historico${params}`);
  },

  // --- Auth ---
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  verifyToken: () => authRequest<{ valid: boolean }>("/auth/verify"),

  // --- Admin (protected) ---
  sync: () =>
    authRequest<SyncResponse>("/admin/sync", { method: "POST" }),

  getConfig: () => authRequest<ConfigOut>("/admin/config"),
};
