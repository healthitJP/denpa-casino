import React from 'react'
import { BettingResult } from '../hooks/useBettingResults'

interface Props {
  stats: any | null
  results: BettingResult[]
  netOddsInputs: number[]
  setNetOddsInputs: (arr: number[]) => void
}

export default function StatsGrid({ stats, results, netOddsInputs, setNetOddsInputs }: Props) {
  if (!stats) return null
  return (
    <div className="flex flex-row gap-4 overflow-auto">
      {stats.monsters.map((stat: any, idx: number) => {
        const res = results[idx]
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
                onChange={(e) => {
                  const copy = [...netOddsInputs]
                  copy[idx] = Number(e.target.value)
                  setNetOddsInputs(copy)
                }}
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
        )
      })}
    </div>
  )
} 