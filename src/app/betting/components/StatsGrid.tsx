import React from 'react'
import { BettingResult } from '../hooks/useBettingResults'
import RainbowBorder from "../../../components/RainbowBorder"

interface Props {
    stats: any | null
    results: BettingResult[]
    netOddsInputs: number[]
    setNetOddsInputs: (arr: number[]) => void
    excludeDraws: boolean
}

export default function StatsGrid({ stats, results, netOddsInputs, setNetOddsInputs, excludeDraws }: Props) {
    if (!stats) return null

    // Find the maximum log growth among the betting results (ignore undefined)
    const maxLogGrowth = React.useMemo(() => {
        const values = results
            .filter((r) => r && typeof r.logGrowth === "number")
            .map((r) => r.logGrowth)
        return values.length > 0 ? Math.max(...values) : -Infinity
    }, [results])

    return (
        <div className="flex flex-row gap-4 overflow-auto">
            {stats.monsters.map((stat: any, idx: number) => {
                const res = results[idx]
                const isHighlighted =
                    res && typeof res.logGrowth === "number" && res.logGrowth === maxLogGrowth

                const Card = (
                    <div
                        className={`flex flex-col gap-2 ${
                            isHighlighted ? "" : "border"
                        } rounded p-4 w-52 bg-white dark:bg-gray-900`}
                    >
                        <h2 className="font-bold text-lg text-center">{stat.name}</h2>
                        <div className="text-sm text-gray-600 dark:text-gray-300">勝率: {(res?.winProb * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">勝利数: {stat.wins} / {stats.total_matches}</div>
                        <label className="text-sm flex flex-col gap-1">
                            純オッズ（倍率）:
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
                                <div className="text-xs text-gray-500">勝率CI (95%): {(res.ci.lower * 100).toFixed(1)}% - {(res.ci.upper * 100).toFixed(1)}%</div>
                            </>
                        )}
                    </div>
                )

                return isHighlighted ? (
                    <RainbowBorder key={stat.name}>{Card}</RainbowBorder>
                ) : (
                    <React.Fragment key={stat.name}>{Card}</React.Fragment>
                )
            })}
            {/* Draw rate card */}
            {!excludeDraws && (
                <div key="DRAW" className="flex flex-col gap-2 border rounded p-4 w-52">
                    <h2 className="font-bold text-lg text-center">引き分け</h2>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        引き分け率: {stats.total_matches > 0 ? ((stats.draw_count / stats.total_matches) * 100).toFixed(1) : "-"}%
                    </div>
                    <div className="text-xs text-gray-500">引き分け数: {stats.draw_count} / {stats.total_matches}</div>
                </div>
            )}
        </div>
    )
} 