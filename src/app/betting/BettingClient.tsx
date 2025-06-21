"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabaseBrowser";
import StatSelector from "../../components/StatSelector";
import { StatsCombination, StatsResponseBody, StatsMode } from "../../types/stats";
import ComboSearchList from "./components/ComboSearchList";
import StatsGrid from "./components/StatsGrid";
import { useBettingResults } from "./hooks/useBettingResults";
import TopProgressBar from "./components/TopProgressBar";

interface Props {
  initialCombos: { id: number; monsters: any[] }[];
}

export default function BettingClient({ initialCombos }: Props) {
  const supabase = useMemo(() => createClient(), []);

  // combinations passed from server
  const [combinations, setCombinations] = useState(initialCombos);

  // Default to 'all' stats when not logged in. If user logs in, we'll switch to 'self'.
  const [mode, setMode] = useState<StatsMode>("all");
  const [includeDefault, setIncludeDefault] = useState(true);
  const [excludeDraws, setExcludeDraws] = useState(false);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [selfId, setSelfId] = useState<string>("");

  // Selected combination id
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedCombo = combinations.find((c) => c.id === selectedId) ?? null;

  // Stats for selected combination
  const [stats, setStats] = useState<StatsCombination | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Inputs
  const [searchText, setSearchText] = useState("");
  const [wealth, setWealth] = useState<number>(1000);
  const [maxBet, setMaxBet] = useState<number>(100);
  const [netOddsInputs, setNetOddsInputs] = useState<number[]>([]);
  const [winner, setWinner] = useState<string>("DRAW");

  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user UID on mount
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setSelfId(user.id);
        setGroupIds([user.id]);
        // Automatically switch to 'self' mode for logged-in users
        setMode((prev) => (prev === "all" ? "self" : prev));
      }
    })();
  }, [supabase]);

  // fetch stats when selectedId or options change
  useEffect(() => {
    if (!selectedId) return;
    setStatsLoading(true);
    supabase.functions
      .invoke("stats", {
        body: {
          mode,
          include_default: includeDefault,
          exclude_draws: excludeDraws,
          group_ids: groupIds,
        },
      })
      .then(({ data, error }) => {
        if (error) {
          setMessage(error.message);
          setStats(null);
        } else {
          const body = data as StatsResponseBody;
          const comb = body.combinations.find((c) => c.combination_id === selectedId) ?? null;
          setStats(comb);
          if (comb) {
            // set default netOdds inputs
            setNetOddsInputs(comb.monsters.map((m) => Number(m.avg_net_odds.toFixed(2))));
          }
        }
        setStatsLoading(false);
      });
  }, [selectedId, mode, includeDefault, excludeDraws, groupIds, supabase]);

  const results = useBettingResults(
    stats,
    selectedCombo,
    netOddsInputs,
    wealth,
    maxBet,
    excludeDraws,
  );

  async function handleRecord() {
    setMessage(null);
    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return (window.location.href = "/login");
    }
    if (!selectedId || !stats) {
      setMessage("組を選択してください");
      setIsSubmitting(false);
      return;
    }

    const betDetails = results.map((r) => ({
      name: r.stat.name,
      netOdds: r.netOdds,
      betAmount: Number(r.betAmount.toFixed(2)),
      recommendedFraction: Number(r.fraction.toFixed(4)),
    }));

    // ensure user profile row exists (insert if missing)
    const { error: profileError } = await supabase.from("users").upsert({ id: user.id });
    if (profileError) {
      console.error("[BettingPage] profile upsert error", profileError);
    }

    const { error } = await supabase.from("bets_records").insert({
      user_id: user.id,
      combination_id: selectedId,
      outcome_monster_name: winner === "DRAW" ? null : winner,
      is_draw: winner === "DRAW",
      total_wealth: wealth,
      max_bet: maxBet,
      bet_details: betDetails,
    });

    if (error) {
      setMessage(`エラー: ${error.message}`);
      setIsSubmitting(false);
    } else {
      setMessage("記録しました");
      // reset selection and search box
      setSelectedId(null);
      setResultsReset();
      setSearchText("");
      setIsSubmitting(false);
    }
  }

  function setResultsReset() {
    setNetOddsInputs([]);
    setWinner("DRAW");
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <TopProgressBar active={isSubmitting} />
      <h1 className="text-2xl font-semibold">モンスターベッティング</h1>

      <ComboSearchList
        combos={combinations}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setResultsReset();
        }}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      {/* wealth inputs */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          所持金:
          <input
            type="number"
            value={wealth}
            className="border rounded px-2 py-1 w-32"
            onChange={(e) => setWealth(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          掛け金上限:
          <input
            type="number"
            value={maxBet}
            className="border rounded px-2 py-1 w-32"
            onChange={(e) => setMaxBet(Number(e.target.value))}
          />
        </label>
      </div>

            {/* stat selector */}
            {selfId && (
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
            )}

      {/* selected combo display */}
      {statsLoading && <p>統計取得中...</p>}
      {selectedCombo && stats && (
        <StatsGrid
          stats={stats}
          results={results}
          netOddsInputs={netOddsInputs}
          setNetOddsInputs={setNetOddsInputs}
        />
      )}

      {/* winner dropdown */}
      {selectedCombo && selfId && (
        <div className="flex items-center gap-2">
          <label>試合結果 (勝者):</label>
          <select className="border rounded p-2" value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value="DRAW">引き分け</option>
            {selectedCombo.monsters.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* record button */}
      {selectedCombo && (
        <button
          onClick={handleRecord}
          disabled={isSubmitting}
          className={`px-6 py-3 rounded self-start ${
            isSubmitting ? "bg-gray-400" : "bg-gray-600 text-white"
          }`}
        >
          {isSubmitting
            ? "送信中…"
            : !selfId
              ? "ログインして記録する"
              : "記録する"}
        </button>
      )}
      
      {/* ----- ガイドライン ----- */}
      <div className="mt-8 p-4 border rounded bg-gray-50 dark:bg-gray-800 dark:text-gray-200 text-sm leading-6">
        <h3 className="font-semibold mb-2">指標の読み方と目安</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <b>推奨掛け金</b> … ケリー基準に基づく最適額 (所持金×割合) と掛け金上限の小さい方。
            0 なら統計的に賭けるメリットが無いか、上限が 0 の状態です。
          </li>
          <li>
            <b>対数成長率</b> … 0 より大きい場合のみ賭ける価値があります。<br/>
            参考目安: 0.01 以上=許容、0.05 以上=魅力的、0.10 以上=非常に好条件。
          </li>
          <li>
            <b>期待利益(平均)</b> … 正なら長期的に利益期待がプラス。金額が大きいほど有利ですが、<br/>
            対数成長率が十分に高いか・悲観的期待利益もプラスかを必ず確認してください。
          </li>
          <li>
            <b>悲観的期待利益 (95%下限)</b> … 勝率が統計的に低めだった<br/>
            (区間下限) 場合でもプラスなら「安全域」があると判断できます。<br/>
            0 未満の場合はリスクが高いので見送るのが無難です。
          </li>
          <li>
            <b>勝率 CI</b> … 区間が狭いほど過去データが豊富。幅が広い場合は不確実性が高く、
            悲観的期待利益を重視することを推奨します。
          </li>
        </ul>
      </div>
    </div>
  );
} 