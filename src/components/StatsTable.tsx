// @ts-nocheck
"use client";

import React from "react";
import { StatsCombination } from "../types/stats";

interface Props {
  data: StatsCombination[];
  onSelectCombination?: (combinationId: number) => void;
}

export default function StatsTable({ data, onSelectCombination }: Props) {
  const [sortKey, setSortKey] = React.useState<"score" | "win_rate">("score");
  const [descending, setDescending] = React.useState(true);

  function handleSort(key: "score" | "win_rate") {
    if (sortKey === key) {
      setDescending(!descending);
    } else {
      setSortKey(key);
      setDescending(true);
    }
  }

  const sorted = React.useMemo(() => {
    if (!data) return [];
    const copy = [...data];
    copy.sort((a, b) => {
      const aMax = a.monsters[0]?.[sortKey] ?? 0;
      const bMax = b.monsters[0]?.[sortKey] ?? 0;
      return descending ? bMax - aMax : aMax - bMax;
    });
    return copy;
  }, [data, sortKey, descending]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1">組ID</th>
            <th className="px-2 py-1 cursor-pointer" onClick={() => handleSort("score")}>score↑↓</th>
            <th className="px-2 py-1 cursor-pointer" onClick={() => handleSort("win_rate")}>win_rate↑↓</th>
            <th className="px-2 py-1">total</th>
            <th className="px-2 py-1">draws</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((comb) => (
            <tr key={comb.combination_id} className="border-b hover:bg-gray-50" onClick={() => onSelectCombination?.(comb.combination_id)}>
              <td className="px-2 py-1 font-mono">{comb.combination_id}</td>
              <td className="px-2 py-1">{comb.max_score_monster}</td>
              <td className="px-2 py-1">{comb.max_win_rate_monster}</td>
              <td className="px-2 py-1 text-right">{comb.total_matches}</td>
              <td className="px-2 py-1 text-right">{comb.draw_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 