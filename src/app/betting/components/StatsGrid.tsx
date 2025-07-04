import React from 'react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { BettingResult } from '../hooks/useBettingResults'
import RainbowBorder from "../../../components/RainbowBorder"
import SortableCard from "./SortableCard"

interface Props {
    stats: any | null
    results: BettingResult[]
    netOddsInputs: number[]
    setNetOddsInputs: (arr: number[]) => void
    excludeDraws: boolean
    onReorder: (from: number, to: number) => void
}

export default function StatsGrid({ stats, results, netOddsInputs, setNetOddsInputs, excludeDraws, onReorder }: Props) {
    if (!stats) return null

    // Find the maximum log growth among the betting results (ignore undefined)
    const maxLogGrowth = React.useMemo(() => {
        const values = results
            .filter((r) => r && typeof r.logGrowth === "number")
            .map((r) => r.logGrowth)
        return values.length > 0 ? Math.max(...values) : -Infinity
    }, [results])

    // DnD sensors
    const sensors = useSensors(useSensor(PointerSensor))

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const fromIdx = stats.monsters.findIndex((m: any) => m.name === active.id)
        const toIdx = stats.monsters.findIndex((m: any) => m.name === over.id)
        if (fromIdx !== -1 && toIdx !== -1) {
            onReorder(fromIdx, toIdx)
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={stats.monsters.map((m: any) => m.name)}
                strategy={horizontalListSortingStrategy}
            >
            <div className="flex flex-row gap-4 overflow-auto">
            {stats.monsters.map((stat: any, idx: number) => {
                const res = results[idx]
                const hasData = res && res.netOdds > 0
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
                            配当倍率 (勝てば戻る倍率):
                            <input
                                type="number"
                                step="0.01"
                                value={netOddsInputs[idx] ?? 0}
                                onChange={(e) => {
                                    const copy = [...netOddsInputs]
                                    copy[idx] = Number(e.target.value)
                                    setNetOddsInputs(copy)
                                }}
                                /* 入力時に DnD-Kit へイベントを渡さない */
                                onPointerDown={(e) => e.stopPropagation()}
                                className="border rounded px-2 py-1"
                            />
                        </label>
                        <div className="text-sm">推奨賭け金: {hasData ? res!.betAmount.toFixed(2) : "-"}</div>
                        <div className="text-sm">対数成長率: {hasData ? res!.logGrowth.toFixed(4) : "-"}</div>
                        <div className="text-sm">期待利益: {hasData ? res!.expected.toFixed(2) : "-"}</div>
                        <div className="text-sm">悲観的期待利益: {hasData ? res!.pessimisticExpected.toFixed(2) : "-"}</div>
                        <div className="text-xs text-gray-500">勝率CI (95%): {hasData ? `${(res!.ci.lower * 100).toFixed(1)}% - ${(res!.ci.upper * 100).toFixed(1)}%` : "-"}</div>
                    </div>
                )

                const content = isHighlighted ? (
                    <RainbowBorder>{Card}</RainbowBorder>
                ) : (
                    Card
                )

                return (
                    <SortableCard key={stat.name} id={stat.name}>
                        {content}
                    </SortableCard>
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
            </SortableContext>
        </DndContext>
    )
} 