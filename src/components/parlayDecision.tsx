import React, { useState } from "react";

// 汎用計算関数（共有化推奨）
export function calcParlayDecision({
  mean, probLoss, cvar5, median
}: { mean: number; probLoss: number; cvar5: number; median: number }) {
  return function (goal: number, wealth: number) {
    if (wealth <= 0 || goal <= wealth) return { k: 0, p_s: 1, risk: "目標達成済み" };
    if (mean <= 1) return { k: Infinity, p_s: 0, risk: "期待値が1以下なので撤退推奨" };
    const k = Math.ceil(Math.log(goal / wealth) / Math.log(mean));
    const p_s = Math.pow(1 - probLoss, k);
    const cvarRisk = Math.pow(cvar5, k);
    const medRisk = Math.pow(median, k);
    let riskMsg = "";
    if (k === 0) riskMsg = "目標達成済み";
    else if (k === 1 && p_s >= 0.2 && cvarRisk >= 0.7) riskMsg = "1回連荘なら挑戦可";
    else if (p_s < 0.2) riskMsg = "成功確率が低すぎるので撤退推奨";
    else if (cvarRisk < 0.7) riskMsg = "ワーストケースで資金消失リスク大";
    else riskMsg = "リスクはあるが挑戦可能";
    return { k, p_s, cvarRisk, medRisk, risk: riskMsg };
  };
}

export default function ParlayDecision({
  mean, probLoss, cvar5, median
}: { mean: number; probLoss: number; cvar5: number; median: number }) {
  const [goal, setGoal] = useState(5000);
  const [wealth, setWealth] = useState(1000);
  const [result, setResult] = useState<any | null>(null);
  const calc = calcParlayDecision({ mean, probLoss, cvar5, median });

  function handleCalc(e: React.FormEvent) {
    e.preventDefault();
    setResult(calc(goal, wealth));
  }

  return (
    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 mt-4">
      <h3 className="font-semibold mb-2">目標到達・撤退判定シミュレーター</h3>
      <form className="flex flex-wrap gap-4 items-end" onSubmit={handleCalc}>
        <label>
          目標金額
          <input type="number" className="ml-2 border rounded px-2 py-1 w-24" value={goal} onChange={e => setGoal(Number(e.target.value))} min={1} />
        </label>
        <label>
          現在の所持金
          <input type="number" className="ml-2 border rounded px-2 py-1 w-24" value={wealth} onChange={e => setWealth(Number(e.target.value))} min={1} />
        </label>
        <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded">判定</button>
      </form>
      {result && (
        <div className="mt-4 space-y-1 text-sm">
          <div>必要連勝回数: <b>{result.k === Infinity ? "-" : result.k}</b></div>
          <div>目標達成確率: <b>{(result.p_s * 100).toFixed(2)}%</b></div>
          <div>CVaR(5%)での最悪ケース: <b>{result.cvarRisk !== undefined ? result.cvarRisk.toFixed(3) : "-"} 倍</b></div>
          <div>中央値での到達倍率: <b>{result.medRisk !== undefined ? result.medRisk.toFixed(3) : "-"} 倍</b></div>
          <div className="mt-2 font-semibold">判定: {result.risk}</div>
        </div>
      )}
    </div>
  );
} 