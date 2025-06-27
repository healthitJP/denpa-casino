// @ts-nocheck
"use client";

import React from "react";
import { createClient } from "../../utils/supabaseBrowser";
import StatSelector from "../../components/StatSelector";
import StatsTable from "../../components/StatsTable";
import ParlayStats from "../../components/ParlayStats";
import { StatsCombination, StatsResponseBody, StatsMode } from "../../types/stats";
import { usePersistentGroupIds } from "../../hooks/usePersistentGroupIds";
import { kellyFraction, logGrowthRate } from "../../utils/math";

export default function DashboardPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [mode, setMode] = React.useState<StatsMode>("self");
  const [includeDefault, setIncludeDefault] = React.useState(true);
  const [excludeDraws, setExcludeDraws] = React.useState(false);
  const [selfId, setSelfId] = React.useState<string>("");
  const [groupIds, setGroupIds] = usePersistentGroupIds(selfId);
  const [data, setData] = React.useState<StatsCombination[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"default" | "maxScore">("default");

  // fetch self uid once
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSelfId(user.id);
      }
    })();
  }, [supabase]);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    setData([]);
    const { data: resp, error } = await supabase.functions.invoke("stats", {
      body: {
        mode,
        include_default: includeDefault,
        exclude_draws: excludeDraws,
        group_ids: groupIds,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      const body = resp as StatsResponseBody;
      // モンスター数の少ない組から順に並べ替える
      const sorted = [...body.combinations].sort(
        (a, b) => a.monsters.length - b.monsters.length
      );
      setData(sorted);
    }
    setLoading(false);
  }

  // sorted data based on sortBy
  const sortedData = React.useMemo(() => {
    if (sortBy === "default") {
      return data;
    }
    if (sortBy === "maxScore") {
      // actually sort by max log growth rate
      return [...data].sort((a, b) => {
        function maxLg(comb: StatsCombination): number {
          let max = -Infinity;
          comb.monsters.forEach((m) => {
            const winProb = m.win_rate;
            const netOdds = m.avg_net_odds - 1;
            if (netOdds <= 0 || winProb <= 0) return;
            const frac = kellyFraction(winProb, netOdds);
            const lg = logGrowthRate(frac, winProb, netOdds);
            if (lg > max) max = lg;
          });
          return max === -Infinity ? 0 : max;
        }
        return maxLg(b) - maxLg(a);
      });
    }
    return data;
  }, [data, sortBy]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <StatSelector
        mode={mode}
        setMode={setMode}
        includeDefault={includeDefault}
        setIncludeDefault={setIncludeDefault}
        excludeDraws={excludeDraws}
        setExcludeDraws={setExcludeDraws}
        groupIds={groupIds}
        setGroupIds={setGroupIds}
        selfId={selfId}
      />
      <button
        onClick={fetchStats}
        className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-700 cursor-pointer"
        disabled={loading}
      >
        {loading ? "取得中..." : "統計取得"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
      {/* Sort order selector */}
      <div>
        <label className="mr-2 font-medium">並び替え:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2 py-1 border rounded"
        >
          <option value="default">デフォルト</option>
          <option value="maxScore">最大対数成長率順</option>
        </select>
      </div>
      {sortedData.length > 0 && (
        <>
          <ParlayStats data={sortedData} excludeDraws={excludeDraws} />
          <StatsTable data={sortedData} excludeDraws={excludeDraws} />
        </>
      )}
    </div>
  );
} 