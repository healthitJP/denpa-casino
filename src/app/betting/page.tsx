"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  actualBetFraction,
  actualLogGrowthRate,
  expectedValue,
  binomialConfidenceInterval95,
} from "../../utils/math";
import { createClient } from "../../utils/supabaseBrowser";
import StatSelector from "../../components/StatSelector";
import { StatsCombination, StatsResponseBody, StatsMode } from "../../types/stats";

export default function BettingPage() {
  const supabase = useMemo(() => createClient(), []);

  // combinations from supabase
  const [combinations, setCombinations] = useState<{ id: number; monsters: any[] }[]>([]);
  const [loadingComb, setLoadingComb] = useState(true);

  // selector values for stats
  const [mode, setMode] = useState<StatsMode>("self");
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

  if (loadingComb) {
    return <p className="p-6">組データを読み込み中...</p>;
  }

  // fetch self uid and combinations once
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSelfId(user.id);
        setGroupIds([user.id]);
      }
      // fetch combos
      const { data, error } = await supabase.from("combinations").select("id, monsters");
      if (!error && data) {
        setCombinations(data as any);
      }
      setLoadingComb(false);
    })();
  }, [supabase]);

  // fetch stats when selectedId or options change
  useEffect(() => {
    if (!selectedId) return;
    setStatsLoading(true);
    supabase.functions.invoke("stats", {
      body: {
        mode,
        include_default: includeDefault,
        exclude_draws: excludeDraws,
        group_ids: groupIds,
      },
    }).then(({ data, error }) => {
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

  // filter indices based on search
  const filtered = useMemo(() => {
    if (!searchText) return combinations;
    return combinations.filter((combo) => combo.monsters.some((m) => m.name.includes(searchText)));
  }, [searchText, combinations]);

  const monsterCount = selectedCombo?.monsters.length ?? 0;

  // calculate results
  const results = useMemo(() => {
    if (!stats || !selectedCombo) return [];
    const totalMatches = stats.total_matches - (excludeDraws ? stats.draw_count : 0);
    return stats.monsters.map((stat, idx) => {
      const winProb = totalMatches > 0 ? stat.wins / totalMatches : 0;
      const netOdds = netOddsInputs[idx] ?? stat.avg_net_odds ?? 0;
      if (!(wealth > 0) || !(netOdds > 0)) {
        return {
          stat,
          winProb,
          netOdds,
          fraction: 0,
          betAmount: 0,
          logGrowth: 0,
          expected: 0,
          ci: binomialConfidenceInterval95(stats.total_matches, stat.wins),
          pessimisticExpected: 0,
        } as any;
      }
      const fraction = actualBetFraction(maxBet, wealth, winProb, netOdds);
      const betAmount = wealth * fraction;
      const ci = binomialConfidenceInterval95(stats.total_matches, stat.wins);
      const pessExpected = expectedValue(betAmount, ci.lower, netOdds);
      return {
        stat,
        winProb,
        netOdds,
        fraction,
        betAmount,
        logGrowth: actualLogGrowthRate(maxBet, wealth, winProb, netOdds),
        expected: expectedValue(betAmount, winProb, netOdds),
        ci,
        pessimisticExpected: pessExpected,
      };
    });
  }, [stats, selectedCombo, netOddsInputs, wealth, maxBet, excludeDraws]);

  async function handleRecord() {
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return (window.location.href = "/login");
    }
    if (!selectedId || !stats) {
      setMessage("組を選択してください");
      return;
    }

    const betDetails = results.map((r) => ({
      name: r.stat.name,
      netOdds: r.netOdds,
      betAmount: Number(r.betAmount.toFixed(2)),
      recommendedFraction: Number(r.fraction.toFixed(4)),
    }));

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
    } else {
      setMessage("記録しました");
      // reset selection
      setSelectedId(null);
      setResultsReset();
    }
  }

  function setResultsReset() {
    setNetOddsInputs([]);
    setWinner("DRAW");
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">モンスターベッティング</h1>

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

      {/* search and select */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="モンスター名で検索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <div className="max-h-60 overflow-y-auto border rounded">
          {filtered.map((combo) => {
            const label = combo.monsters.map((m) => m.name).join(" / ");
            return (
              <button
                key={combo.id}
                className={`block w-full text-left px-3 py-1 hover:bg-blue-100 ${
                  combo.id === selectedId ? "bg-blue-200" : ""
                }`}
                onClick={() => {
                  setSelectedId(combo.id);
                  setResultsReset();
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

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

      {/* winner dropdown */}
      {selectedCombo && (
        <div className="flex items-center gap-2">
          <label>試合結果 (勝者):</label>
          <select
            className="border rounded p-2"
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
          >
            <option value="DRAW">引き分け</option>
            {selectedCombo.monsters.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* selected combo display */}
      {statsLoading && <p>統計取得中...</p>}
      {selectedCombo && stats && (
        <div className="flex flex-row gap-4 overflow-auto">
          {stats.monsters.map((stat, idx) => {
            const res = results[idx];
            return (
              <div key={stat.name} className="flex flex-col gap-2 border rounded p-4 w-52">
                <h2 className="font-bold text-lg text-center">{stat.name}</h2>
                <div className="text-sm text-gray-600">勝率: {(res?.winProb * 100).toFixed(1)}%</div>
                <label className="text-sm flex flex-col gap-1">
                  純オッズ:
                  <input
                    type="number"
                    step="0.01"
                    value={netOddsInputs[idx] ?? 0}
                    onChange={(e) =>
                      setNetOddsInputs((prev) => {
                        const copy = [...prev];
                        copy[idx] = Number(e.target.value);
                        return copy;
                      })
                    }
                    className="border rounded px-2 py-1"
                  />
                </label>
                {res && res.netOdds > 0 && (
                  <>
                    <div className="text-sm">推奨掛け金: {res.betAmount.toFixed(2)}</div>
                    <div className="text-sm">対数成長率: {res.logGrowth.toFixed(4)}</div>
                    <div className="text-sm">期待利益: {res.expected.toFixed(2)}</div>
                    <div className="text-sm">悲観的期待利益: {res.pessimisticExpected.toFixed(2)}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* record button */}
      {selectedCombo && (
        <button
          onClick={handleRecord}
          className="px-6 py-3 bg-green-600 text-white rounded self-start"
        >
          記録する
        </button>
      )}

      {message && <p className="text-blue-600">{message}</p>}
    </div>
  );
} 