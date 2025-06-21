"use client";

import { useState, useMemo } from "react";
import monsterData from "@/data/monsterList.json";
import {
  actualBetFraction,
  actualLogGrowthRate,
  expectedValue,
  binomialConfidenceInterval95,
} from "@/utils/math";

// 型定義
interface Monster {
  name: string;
  victories: number;
}
interface Combination {
  monsters: Monster[];
}

const combinations: Combination[] = monsterData.combinations;

export default function BettingPage() {
  // 入力系の状態
  const [searchText, setSearchText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wealth, setWealth] = useState<number>(1000);
  const [maxBet, setMaxBet] = useState<number>(100);
  const [netOddsInputs, setNetOddsInputs] = useState<number[]>([]);

  // 組のフィルタリング
  const filteredIndices = useMemo(() => {
    if (!searchText) return combinations.map((_, i) => i);
    return combinations.reduce<number[]>((acc, combo, idx) => {
      const hit = combo.monsters.some((m) => m.name.includes(searchText));
      if (hit) acc.push(idx);
      return acc;
    }, []);
  }, [searchText]);

  // 選択された組
  const selectedCombo = selectedIndex !== null ? combinations[selectedIndex] : null;

  // 選択が変わったら netOdds 入力長を調整
  const monsterCount = selectedCombo?.monsters.length ?? 0;
  useMemo(() => {
    if (!selectedCombo) return;
    setNetOddsInputs((prev) =>
      Array.from({ length: monsterCount }).map(
        (_, i) => prev[i] ?? (selectedCombo.monsters[i] as any).netOdds ?? 0
      )
    );
  }, [selectedIndex, monsterCount, selectedCombo]);

  // 計算結果
  const results = useMemo(() => {
    if (!selectedCombo) return [];
    const totalVictories = selectedCombo.monsters.reduce(
      (sum, m) => sum + m.victories,
      0
    );
    return selectedCombo.monsters.map((monster, idx) => {
      const winProb = monster.victories / totalVictories;
      const netOdds = netOddsInputs[idx] ?? (monster as any).netOdds ?? 0;

      // ガード: 入力が未設定や不正なら結果0扱い
      if (!(wealth > 0) || !(netOdds > 0)) {
        return {
          monster,
          winProb,
          netOdds,
          fraction: 0,
          betAmount: 0,
          logGrowth: 0,
          expected: 0,
          ci: binomialConfidenceInterval95(totalVictories, monster.victories),
          pessimisticExpected: 0,
        } as any;
      }

      const fraction = actualBetFraction(maxBet, wealth, winProb, netOdds);
      const betAmount = wealth * fraction;

      // 95% CI
      const ci = binomialConfidenceInterval95(totalVictories, monster.victories);
      const pessExpected = expectedValue(betAmount, ci.lower, netOdds);
      return {
        monster,
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
  }, [selectedCombo, netOddsInputs, wealth, maxBet]);

  // ---------------- UI ----------------
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">モンスターベッティングシミュレータ</h1>
      {/* 検索 + セレクト */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="モンスター名で検索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border rounded px-3 py-2"
        />
        {/* オプション一覧 */}
        <div className="max-h-60 overflow-y-auto border rounded">
          {filteredIndices.map((idx) => {
            const combo = combinations[idx];
            const label = combo.monsters.map((m) => m.name).join(" / ");
            return (
              <button
                key={idx}
                className={`block w-full text-left px-3 py-1 hover:bg-blue-100 ${
                  idx === selectedIndex ? "bg-blue-200" : ""
                }`}
                onClick={() => setSelectedIndex(idx)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 資金 & 上限入力 */}
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

      {/* 選択された組 表示 */}
      {selectedCombo && (
        <div className="flex flex-row gap-4 overflow-auto">
          {selectedCombo.monsters.map((monster, idx) => {
            const res = results[idx];
            return (
              <div
                key={monster.name}
                className="flex flex-col gap-2 border rounded p-4 w-52"
              >
                <h2 className="font-bold text-lg text-center">
                  {monster.name}
                </h2>
                <div className="text-sm text-gray-600">
                  勝率: {(res?.winProb * 100).toFixed(1)}%
                </div>
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
                    <div className="text-sm">
                      推奨掛け金: {res.betAmount.toFixed(2)}
                    </div>
                    <div className="text-sm">
                      対数成長率: {res.logGrowth.toFixed(4)}
                    </div>
                    <div className="text-sm">
                      期待利益(平均): {res.expected.toFixed(2)}
                    </div>
                    <div className="text-sm">
                      悲観的期待利益 (95%下限): {res.pessimisticExpected.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      勝率CI: {(res.ci.lower * 100).toFixed(1)}% – {(res.ci.upper * 100).toFixed(1)}%
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
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