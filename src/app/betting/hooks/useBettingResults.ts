import { useMemo } from 'react'
import {
  actualBetFraction,
  actualLogGrowthRate,
  expectedValue,
  binomialConfidenceInterval95,
} from '../../../utils/math'
import { StatsCombination } from '../../../types/stats'

export interface BettingResult {
  stat: any
  winProb: number
  netOdds: number
  fraction: number
  betAmount: number
  logGrowth: number
  expected: number
  ci: { lower: number; upper: number }
  pessimisticExpected: number
}

export function useBettingResults(
  stats: StatsCombination | null,
  selectedCombo: { id: number; monsters: any[] } | null,
  netOddsInputs: number[],
  wealth: number,
  maxBet: number,
  excludeDraws: boolean,
): BettingResult[] {
  return useMemo(() => {
    if (!stats || !selectedCombo) return []

    const totalMatches = stats.total_matches - (excludeDraws ? stats.draw_count : 0)

    return stats.monsters.map((stat, idx) => {
      const winProb = totalMatches > 0 ? stat.wins / totalMatches : 0
      // ユーザー入力は「配当倍率」(勝てば X 倍で戻る) とする。
      // 計算には純オッズ (利益倍率) が必要なので X-1 に変換。
      const grossInput = netOddsInputs[idx]
      const netOddsSource =
        grossInput !== undefined && !isNaN(grossInput) && grossInput > 0
          ? grossInput
          : stat.avg_net_odds ?? 0 // どちらも gross odds が入ってくる想定

      const netOdds = netOddsSource > 0 ? netOddsSource - 1 : 0
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
        } as BettingResult
      }
      const fraction = actualBetFraction(maxBet, wealth, winProb, netOdds)
      const betAmount = wealth * fraction
      const ci = binomialConfidenceInterval95(stats.total_matches, stat.wins)
      const pessimisticExpected = expectedValue(betAmount, ci.lower, netOdds)
      return {
        stat,
        winProb,
        netOdds,
        fraction,
        betAmount,
        logGrowth: actualLogGrowthRate(maxBet, wealth, winProb, netOdds),
        expected: expectedValue(betAmount, winProb, netOdds),
        ci,
        pessimisticExpected,
      }
    })
  }, [stats, selectedCombo, netOddsInputs, wealth, maxBet, excludeDraws])
} 