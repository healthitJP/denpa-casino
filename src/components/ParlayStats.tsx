"use client";

import React from "react";
import { InlineMath } from "react-katex";
import { StatsCombination } from "../types/stats";

interface Props {
  data: StatsCombination[];
  excludeDraws: boolean;
}

/**
 * 集計済み統計 (Dashboard で取得した data) から
 * 連荘 1 回分のリスク指標を計算して表示するコンポーネント。
 *
 * 1. 各組み合わせ（試合）で最も期待倍率 p*(1+b) が高いモンスターを 1 体採用
 * 2. その倍率を一様平均したものを期待倍率 E[m]
 * 3. 同倍率リストの標準偏差 SD[m]
 * 4. 係数変動 CV = SD / E[m]
 * 5. 5% 分位点 (パーセンタイル) → ワーストケースの目安
 * 6. 損失確率 P(m < 1)
 */
export default function ParlayStats({ data, excludeDraws }: Props) {
  if (data.length === 0) return null;

  // 1. 各組み合わせの最高期待倍率
  const multipliers = data.map((comb) => {
    const total = comb.total_matches - (excludeDraws ? comb.draw_count : 0);
    let best = 0;
    comb.monsters.forEach((m) => {
      const winProb = total > 0 ? m.wins / total : 0;
      // avg_net_odds は "資産返還倍率 r" (例: 3 ⇒ 100→300) を直接保持
      const mult = winProb * m.avg_net_odds;
      if (mult > best) best = mult;
    });
    return best;
  });

  const n = multipliers.length;
  const mean = multipliers.reduce((s, v) => s + v, 0) / n;
  const variance = multipliers.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const cv = sd / mean;

  // 5% 分位点
  const sorted = [...multipliers].sort((a, b) => a - b);
  const p5 = sorted[Math.floor(0.05 * n)];

  const probLoss = multipliers.filter((v) => v < 1).length / n;

  // 追加: ログ成長率を基準に選んだ場合の期待倍率
  function logGrowth(p:number,b:number){
    const fullKelly=(p*b-(1-p))/b;
    const quarterKelly=Math.max(0,Math.min(1,fullKelly*0.25));
    if(quarterKelly===0) return -Infinity;
    return p*Math.log(1+quarterKelly*b)+(1-p)*Math.log(1-quarterKelly);
  }
  const altMultipliers=data.map((comb)=>{
      const total=comb.total_matches-(excludeDraws?comb.draw_count:0);
      let bestMult=0;
      let bestLog=-Infinity;
      comb.monsters.forEach((m)=>{
         const p=total>0?m.wins/total:0;
         const b=m.avg_net_odds; // 利益倍率 (返還 r)
         const g=logGrowth(p,b);
         if(g>bestLog){
            bestLog=g;
            bestMult=p*b; // 期待倍率は p*r (r=b)
         }
      });
      return bestMult;
  });
  const altMean=altMultipliers.reduce((s,v)=>s+v,0)/altMultipliers.length;

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 space-y-1">
        <h2 className="font-semibold mb-2">連荘 1 回のリスク指標</h2>
        <div>期待倍率 (平均)：<b>{mean.toFixed(3)} 倍</b></div>
        <div>期待倍率 (ログ成長基準)：<b>{altMean.toFixed(3)} 倍</b></div>
        <div>標準偏差：{sd.toFixed(3)}</div>
        <div>変動係数 (CV)：{cv.toFixed(3)}</div>
        <div>5% 分位点：{p5.toFixed(3)} 倍</div>
        <div>損失確率 P(m &lt; 1)：{(probLoss * 100).toFixed(1)}%</div>
      </div>

      <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 dark:text-gray-200 text-sm leading-6">
        <h3 className="font-semibold mb-2">指標の読み方と目安</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <b>期待倍率</b> … 1 を超えればプラス期待値。<br />
            1.05 以上 = 許容、1.10 以上 = 魅力的、1.20 以上 = 非常に好条件。<br />
            <InlineMath math={"E[m] = \\frac{1}{N} \\sum_{c=1}^{N} p_c \\, r_c"} />
          </li>
          <li>
            <b>標準偏差 / CV</b> … 値が小さいほど結果が安定。<br />
            <InlineMath math={"\\sigma = \\sqrt{E[(m-\\mu)^2]}"} />,
            <InlineMath math={"CV = \\sigma / \\mu"} />。<br />
            CV &lt; 0.2 は低リスク、0.2〜0.4 は中リスク、0.4 以上は高リスク。
          </li>
          <li>
            <b>5% 分位点</b> … 95% 信頼で下回らない倍率。<br />
            サンプルを昇順に並べた 5% 位置の値。<br />
            1 未満の場合は「最悪ケースで元割れ」リスクが高い。
          </li>
          <li>
            <b>損失確率</b> … 連荘しても資金が減る確率。<br />
            <InlineMath math={"P_{loss} = P(m < 1)"} />。<br />
            20% 未満 = 低リスク、20〜40% = 中リスク、40% 以上 = 高リスクと判断。
          </li>
        </ul>
      </div>
    </div>
  );
} 