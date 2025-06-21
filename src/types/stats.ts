export type StatsMode = "self" | "all" | "group";

export interface StatsRequestBody {
  mode: StatsMode;
  include_default?: boolean;
  exclude_draws?: boolean;
  group_ids?: string[];
}

export interface StatsMonster {
  name: string;
  wins: number;
  win_rate: number; // 0-1
  avg_net_odds: number;
  score: number;
}

export interface StatsCombination {
  combination_id: number;
  monsters: StatsMonster[];
  total_matches: number;
  draw_count: number;
  max_score_monster: string;
  max_win_rate_monster: string;
}

export interface StatsResponseBody {
  combinations: StatsCombination[];
} 