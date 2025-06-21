// @ts-nocheck
// Supabase Edge Function: stats

import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

interface StatsRequest {
  mode: "self" | "all" | "group";
  include_default?: boolean;
  exclude_draws?: boolean;
  group_ids?: string[];
}

type MonsterStatInternal = {
  wins: number;
  netOddsSum: number;
  netOddsCount: number;
};

type CombinationStatsInternal = {
  totalMatches: number;
  draws: number;
  monsters: Record<string, MonsterStatInternal>;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Admin client (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Merge CORS headers to every response later
  const baseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  let body: StatsRequest;
  try {
    body = (await req.json()) as StatsRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json" }),
      { status: 400, headers: baseHeaders },
    );
  }

  const mode = body.mode ?? "self";
  const includeDefault = body.include_default ?? false;
  const excludeDraws = body.exclude_draws ?? false;
  const groupIds = body.group_ids ?? [];

  // Extract requester user id (if any)
  let requesterUid: string | null = null;
  try {
    const supabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await supabaseClient.auth.getUser();
    requesterUid = user?.id ?? null;
  } catch {
    // ignore
  }

  if (mode === "self" && !requesterUid) {
    return new Response(
      JSON.stringify({ error: "unauthenticated" }),
      { status: 401, headers: baseHeaders },
    );
  }

  // -----------------------------------
  // Fetch base data
  // -----------------------------------
  const combinationMap = new Map<number, { monsters: { name: string; victories?: number; netOdds: number; }[] }>();

  if (includeDefault) {
    const { data: combos, error } = await supabaseAdmin
      .from("combinations")
      .select("id, monsters");

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: baseHeaders },
      );
    }

    combos?.forEach((c) => {
      combinationMap.set(c.id, { monsters: c.monsters as any });
    });
  }

  // Even if includeDefault is false, we still may need monster names for combinations referenced in bets_records. We'll fetch missing combos later if encountered.

  // -----------------------------------
  // Fetch bets_records according to mode
  // -----------------------------------
  let query = supabaseAdmin
    .from("bets_records")
    .select("id, combination_id, outcome_monster_name, is_draw, bet_details, user_id");

  switch (mode) {
    case "self":
      query = query.eq("user_id", requesterUid!);
      break;
    case "group":
      query = query.in("user_id", groupIds.length ? groupIds : ["00000000-0000-0000-0000-000000000000"]); // if empty, produce empty set
      break;
    case "all":
    default:
      // no filter
      break;
  }

  const { data: betRows, error: betError } = await query;
  if (betError) {
    return new Response(
      JSON.stringify({ error: betError.message }),
      { status: 500, headers: baseHeaders },
    );
  }

  // -----------------------------------
  // Build stats map
  // -----------------------------------
  const stats: Record<string, CombinationStatsInternal> = {};

  function getCombStats(id: number): CombinationStatsInternal {
    const key = id.toString();
    if (!stats[key]) {
      stats[key] = {
        totalMatches: 0,
        draws: 0,
        monsters: {},
      };
    }
    return stats[key];
  }

  // Seed with default victories if requested
  if (includeDefault) {
    combinationMap.forEach((value, combId) => {
      const combStats = getCombStats(combId);
      value.monsters.forEach((m) => {
        const ms = combStats.monsters[m.name] ?? { wins: 0, netOddsSum: 0, netOddsCount: 0 };
        if (typeof m.victories === "number") {
          ms.wins += m.victories;
          combStats.totalMatches += m.victories;
        }
        ms.netOddsSum += m.netOdds;
        ms.netOddsCount += 1;
        combStats.monsters[m.name] = ms;
      });
    });
  }

  // Process bet records
  betRows?.forEach((row) => {
    const combStats = getCombStats(row.combination_id);
    combStats.totalMatches += 1;

    if (row.is_draw) {
      combStats.draws += 1;
    }

    // bet_details json
    const details = Array.isArray(row.bet_details) ? row.bet_details : JSON.parse(row.bet_details as any);

    details.forEach((d: any) => {
      const ms = combStats.monsters[d.name] ?? { wins: 0, netOddsSum: 0, netOddsCount: 0 };
      ms.netOddsSum += Number(d.netOdds);
      ms.netOddsCount += 1;
      combStats.monsters[d.name] = ms;
    });

    if (!row.is_draw && row.outcome_monster_name) {
      const ms = combStats.monsters[row.outcome_monster_name] ?? { wins: 0, netOddsSum: 0, netOddsCount: 0 };
      ms.wins += 1;
      combStats.monsters[row.outcome_monster_name] = ms;
    }
  });

  // Prepare response structure
  const responseCombos: any[] = [];

  Object.entries(stats).forEach(([combId, cStats]) => {
    const monstersArr: any[] = [];
    let maxScore = -Infinity;
    let maxWinRate = -Infinity;
    let maxScoreMonster = "";
    let maxWinRateMonster = "";

    const effectiveTotal = excludeDraws ? cStats.totalMatches - cStats.draws : cStats.totalMatches;

    Object.entries(cStats.monsters).forEach(([name, mStats]) => {
      const winRate = effectiveTotal > 0 ? mStats.wins / effectiveTotal : 0;
      const avgNetOdds = mStats.netOddsCount > 0 ? mStats.netOddsSum / mStats.netOddsCount : 0;
      const score = winRate * avgNetOdds;

      if (score > maxScore) {
        maxScore = score;
        maxScoreMonster = name;
      }
      if (winRate > maxWinRate) {
        maxWinRate = winRate;
        maxWinRateMonster = name;
      }

      monstersArr.push({
        name,
        wins: mStats.wins,
        win_rate: Number(winRate.toFixed(4)),
        avg_net_odds: Number(avgNetOdds.toFixed(4)),
        score: Number(score.toFixed(4)),
      });
    });

    // sort monsters array by score desc by default
    monstersArr.sort((a, b) => b.score - a.score);

    const combObj = {
      combination_id: Number(combId),
      monsters: monstersArr,
      total_matches: cStats.totalMatches,
      draw_count: cStats.draws,
      max_score_monster: maxScoreMonster,
      max_win_rate_monster: maxWinRateMonster,
    };

    responseCombos.push(combObj);
  });

  return new Response(JSON.stringify({ combinations: responseCombos }), {
    headers: baseHeaders,
  });
}); 