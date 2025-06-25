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

  // --- 1-a. 外れ値 (最大値と最小値) を 1 件ずつ除外した配列を作成 ---
  function trimExtremes(arr: number[]) {
    if (arr.length <= 2) return [...arr];
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted.slice(1, -1); // 最小と最大を除外
  }

  const baseMultipliers = trimExtremes(multipliers);
  const n = baseMultipliers.length;

  const mean = baseMultipliers.reduce((s, v) => s + v, 0) / n;
  const variance = baseMultipliers.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const cv = sd / mean;

  // percentile helper
  function percentile(arr: number[], p: number) {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (arr.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
  }

  const median = percentile(baseMultipliers, 0.5);
  const p25 = percentile(baseMultipliers, 0.25);
  const p75 = percentile(baseMultipliers, 0.75);
  const iqr = p75 - p25;
  const p5 = percentile(baseMultipliers, 0.05);
  const p95 = percentile(baseMultipliers, 0.95);

  // CVaR 5% (平均下位5%)
  const tail = baseMultipliers.filter((v) => v <= p5);
  const cvar5 = tail.reduce((s, v) => s + v, 0) / tail.length;

  // skewness & kurtosis (sample)
  const m3 = baseMultipliers.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
  const m4 = baseMultipliers.reduce((s, v) => s + (v - mean) ** 4, 0) / n;
  const skewness = sd > 0 ? m3 / sd ** 3 : 0;
  const kurtosis = sd > 0 ? m4 / sd ** 4 - 3 : 0; // excess kurtosis

  const probLoss = baseMultipliers.filter((v) => v < 1).length / n;

  // 追加: 対数成長率を基準に選んだ場合の期待倍率
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
  const altTrim=trimExtremes(altMultipliers);
  const altMean=altTrim.reduce((s,v)=>s+v,0)/altTrim.length;

  // log growth stats
  const logList = data.map((comb)=>{
       const total=comb.total_matches-(excludeDraws?comb.draw_count:0);
       let bestLog=-Infinity;
       comb.monsters.forEach((m)=>{
          const p=total>0?m.wins/total:0;
          const r=m.avg_net_odds;
          const g=logGrowth(p,r);
          if(g>bestLog) bestLog=g;
       });
       return bestLog;
   });
  const trimmedLog=trimExtremes(logList);
  const meanLog = trimmedLog.reduce((s,v)=>s+v,0)/trimmedLog.length;
  const sdLog = Math.sqrt(trimmedLog.reduce((s,v)=>s+(v-meanLog)**2,0)/trimmedLog.length);

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 space-y-1">
        <h2 className="font-semibold mb-2">連荘 1 回のリスク指標</h2>
        <div>期待倍率 (平均)：<b>{mean.toFixed(3)} 倍</b></div>
        <div>中央値：{median.toFixed(3)} 倍</div>
        <div>5% 分位点：{p5.toFixed(3)} 倍</div>
        <div>CVaR(5%)：{cvar5.toFixed(3)} 倍</div>
        <div>標準偏差：{sd.toFixed(3)}</div>
        <div>変動係数(CV)：{cv.toFixed(3)}</div>
        <div>IQR (25–75%)：{iqr.toFixed(3)}</div>
        <div>期待倍率 (対数成長率基準)：{altMean.toFixed(3)} 倍</div>
        <div>歪度：{skewness.toFixed(2)}</div>
        <div>尖度：{kurtosis.toFixed(2)}</div>
        <div>対数成長率 平均：{meanLog.toFixed(4)}</div>
        <div>対数成長率 SD：{sdLog.toFixed(4)}</div>
        <div>損失確率 P(m &lt; 1)：{(probLoss * 100).toFixed(1)}%</div>
      </div>

      <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 dark:text-gray-200 text-sm leading-6">
        <h3 className="font-semibold mb-2">指標の読み方と目安</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li className="text-red-600 dark:text-red-400">
            <b>※統計量の計算方法</b> … 外れ値対策として <b>最大値と最小値をそれぞれ 1 件ずつ除外</b> した後に
            期待倍率や分位点などを計算しています。
          </li>
          <li>
            <b>期待倍率</b> … 1 を超えればプラス期待値。<br />
            1.05 以上 = 許容、1.10 以上 = 魅力的、1.20 以上 = 非常に好条件。<br />
            <InlineMath math={"E[m] = \\frac{1}{N} \\sum_{c=1}^{N} p_c \\, r_c"} />
          </li>
          <li>
            <b>中央値</b> … 「半分の試合でこれ以上」は勝てる基準。<br/>
            1 未満: 元割れ優勢／避けたい, 1–1.05: やや有利, 1.05 以上: 良好。
          </li>
          <li>
            <b>5% 分位点</b> … 下位 5% での倍率。<br />
            ここを下回ることは 20 試合に 1 回程度。リスク下限の目安。
          </li>
          <li>
            <b>CVaR(5%)</b> … 最悪 5% ケースの平均倍率。<br />
            5% 分位点が「ここまでは覚悟」とする閾値なのに対し、CVaR はその閾値を下回った<br />
            シナリオだけを平均した "実質的な最悪平均" を示す。<br />
            0.8 未満: ハイリスク, 0.8–1.0: 注意, 1.0 以上: 許容。
          </li>
          <li>
            <b>標準偏差 / CV</b> … 値が小さいほど結果が安定。<br />
            <InlineMath math={"\\sigma = \\sqrt{E[(m-\\mu)^2]}"} />,
            <InlineMath math={"CV = \\sigma / \\mu"} />。<br />
            CV &lt; 0.2 は低リスク、0.2〜0.4 は中リスク、0.4 以上は高リスク。
          </li>
          <li>
            <b>IQR</b> … 50% の中央レンジ幅。外れ値の影響を受けにくい散らばり指標。
            IQR &lt; 0.5: 安定, 0.5–1.5: 普通, &gt;1.5: ばらつき大。
          </li>
          <li>
            <b>期待倍率 (対数成長率基準)</b> … 対数成長率最大モンスターでの平均倍率。
          </li>
          <li>
            <b>歪度・尖度</b> … 分布の非対称性と裾の重さを数値化。0 に近いほど正規分布に近い。
            <br />
            歪度 |&gt; 1 または &lt; -1: 強い非対称性。尖度 &gt; 3: 裾が重い。
          </li>
          <li>
            <b>対数成長率の平均/SD</b> … 長期的な対数資産成長の安定性を示す。
            <br />
            平均 g &gt; 0.01: 許容, &gt;0.05: 魅力的。SD が |g| の 2 倍以上だとブレが大きい。
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