// @ts-nocheck
"use client";

import React from "react";
import { StatsCombination } from "../types/stats";
import { kellyFraction, logGrowthRate } from "../utils/math";

interface Props {
  data: StatsCombination[];
  excludeDraws?: boolean;
  onSelectCombination?: (combinationId: number) => void;
}

export default function StatsTable({ data, excludeDraws = false, onSelectCombination }: Props) {
  // find max monsters in any combination to build consistent columns
  const maxMonsters = React.useMemo(() => Math.max(...data.map((d) => d.monsters.length)), [data]);

  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full table-fixed text-sm" style={{ minWidth: `${maxMonsters * 120 + 300}px` }}>
        <thead>
          <tr className="border-b">
            {Array.from({ length: maxMonsters }).map((_, idx) => (
              <React.Fragment key={idx}>
                <th className="px-2 py-1 text-center">モンスター{idx + 1}</th>
                <th className="px-2 py-1 text-center">勝利数(勝率)</th>
              </React.Fragment>
            ))}
            {!excludeDraws && <th className="px-2 py-1 text-center">引き分け数(率)</th>}
            <th className="px-2 py-1 text-center">最大対数成長率</th>
          </tr>
        </thead>
        <tbody>
          {data.map((comb) => {
            return (
              <tr
                key={comb.combination_id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectCombination?.(comb.combination_id)}
              >
                {Array.from({ length: maxMonsters }).map((_, idx) => {
                  const m = comb.monsters[idx];
                  if (m) {
                    return (
                      <React.Fragment key={idx}>
                        <td className="px-2 py-1 text-center">{m.name}</td>
                        <td className="px-2 py-1 text-center">
                          {m.wins} ({(m.win_rate * 100).toFixed(1)}%)
                        </td>
                      </React.Fragment>
                    );
                  }
                  // empty cells when combo has fewer monsters
                  return (
                    <React.Fragment key={idx}>
                      <td className="px-2 py-1" />
                      <td className="px-2 py-1" />
                    </React.Fragment>
                  );
                })}
                {!excludeDraws && (
                  <td className="px-2 py-1 text-center">
                    {comb.draw_count} (
                    {comb.total_matches > 0
                      ? ((comb.draw_count / comb.total_matches) * 100).toFixed(1)
                      : "-"}
                    %)
                  </td>
                )}
                {(() => {
                  let maxLg = -Infinity;
                  const effectiveTotal = excludeDraws ? comb.total_matches - comb.draw_count : comb.total_matches;
                  comb.monsters.forEach((m) => {
                    const winProb = effectiveTotal > 0 ? m.wins / effectiveTotal : 0;
                    const netOdds = m.avg_net_odds - 1; // 純オッズ
                    if (netOdds <= 0 || winProb <= 0) return;
                    const frac = kellyFraction(winProb, netOdds);
                    const lg = logGrowthRate(frac, winProb, netOdds);
                    if (lg > maxLg) maxLg = lg;
                  });
                  if (maxLg === -Infinity) maxLg = 0;
                  return <td className="px-2 py-1 text-center">{maxLg.toFixed(4)}</td>;
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 