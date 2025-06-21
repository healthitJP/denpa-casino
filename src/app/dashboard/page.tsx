// @ts-nocheck
"use client";

import React from "react";
import { createClient } from "../../utils/supabaseBrowser";
import StatSelector from "../../components/StatSelector";
import StatsTable from "../../components/StatsTable";
import { StatsCombination, StatsResponseBody, StatsMode } from "../../types/stats";

export default function DashboardPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [mode, setMode] = React.useState<StatsMode>("self");
  const [includeDefault, setIncludeDefault] = React.useState(true);
  const [excludeDraws, setExcludeDraws] = React.useState(false);
  const [groupIds, setGroupIds] = React.useState<string[]>([]);
  const [data, setData] = React.useState<StatsCombination[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selfId, setSelfId] = React.useState<string>("");

  // fetch self uid once
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSelfId(user.id);
        setGroupIds([user.id]);
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
        include_default: true,
        exclude_draws: excludeDraws,
        group_ids: groupIds,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      const body = resp as StatsResponseBody;
      setData(body.combinations);
    }
    setLoading(false);
  }

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
        className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "取得中..." : "統計取得"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
      {data.length > 0 && <StatsTable data={data} />}
    </div>
  );
} 