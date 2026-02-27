export interface Team {
  id: number;
  sofascore_id: number;
  name: string;
  slug: string;
  name_code: string;
  position: number;
  points: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  updated_at: string;
}

export interface PalpiteOut {
  id: number;
  team_id: number;
  prioridade: number;
  team: Team | null;
}

export interface ApostadorOut {
  id: number;
  nome: string;
  ordem_inscricao: number;
  created_at: string;
  palpites: PalpiteOut[];
}

export interface RankingEntry {
  rank: number;
  apostador: string;
  ordem_inscricao: number;
  total: number;
  pontos: number[];
  times: string[];
  times_codes: string[];
  team_ids: number[];
  team_positions: number[];
}

export interface RankingResponse {
  updated_at: string;
  display_column: string;
  entries: RankingEntry[];
}

export interface SnapshotOut {
  session_date: string;
  rodada: number;
  apostador: string;
  pontuacao: number;
  rank: number;
}

export interface SyncResponse {
  teams_count: number;
  apostadores_count: number;
  historico_session: string | null;
  message: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export interface ConfigOut {
  season_year: number;
  tournament_id: number;
  season_id: number;
  times_per_apostador: number;
  min_teams_protection: number;
  display_column: string;
}
