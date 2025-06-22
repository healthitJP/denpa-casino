/**
 * ケリー基準 (Full Kelly) の 1/4 倍を推奨賭け金として返す関数（純オッズ版）
 * @param winProb 勝率（0〜1の実数）
 * @param netOdds 純オッズ（例: 1.0 なら1倍の純利益。2.0倍配当なら純オッズは1.0）
 * @returns ケリー最適割合（0未満なら0、1超なら1にクリップ）
 */
export function kellyFraction(winProb: number, netOdds: number): number {
  if (netOdds <= 0) return 0; // 純オッズ0以下は賭ける意味がない
  if (winProb < 0 || winProb > 1) throw new Error("winProbは0〜1の範囲で指定してください");

  // Full Kelly
  const fullKelly = (winProb * netOdds - (1 - winProb)) / netOdds;

  // 1/4 Kelly を採用 (リスク低減)
  const quarterKelly = fullKelly * 0.25;

  // 0未満は0、1超は1にクリップ
  return Math.max(0, Math.min(1, quarterKelly));
}

/**
 * 賭けの割合と勝率、純オッズを受け取り、対数成長率（log growth rate）を返す関数
 * @param fraction 賭ける割合（0〜1の実数）
 * @param winProb 勝率（0〜1の実数）
 * @param netOdds 純オッズ（例: 1.0 なら1倍の純利益。2.0倍配当なら純オッズは1.0）
 * @returns 対数成長率（log growth rate）
 */
export function logGrowthRate(fraction: number, winProb: number, netOdds: number): number {
  if (fraction < 0 || fraction > 1) throw new Error("fractionは0〜1の範囲で指定してください");
  if (winProb < 0 || winProb > 1) throw new Error("winProbは0〜1の範囲で指定してください");
  if (netOdds < 0) throw new Error("netOddsは0以上で指定してください");

  // 勝った場合: log(1 + fraction * netOdds)
  // 負けた場合: log(1 - fraction)
  // 期待値: winProb * log(1 + fraction * netOdds) + (1 - winProb) * log(1 - fraction)
  // ただしfraction=1のときlog(0)になるので、0未満にはならないようにする
  if (fraction === 1 && winProb !== 1) return -Infinity;
  if (fraction === 0) return 0;

  const winTerm = winProb * Math.log(1 + fraction * netOdds);
  const loseTerm = (1 - winProb) * Math.log(1 - fraction);
  return winTerm + loseTerm;
}

/**
 * 賭け金の上限（maxBet）、所持財産（wealth）、勝率（winProb）、純オッズ（netOdds）を受け取り、
 * 実際にかける割合（wealthに対する割合）を返す関数
 * @param maxBet 賭け金の上限（絶対額, 0以上）
 * @param wealth 所持財産（絶対額, 0より大きい必要あり）
 * @param winProb 勝率（0〜1の実数）
 * @param netOdds 純オッズ（例: 1.0 なら1倍の純利益。2.0倍配当なら純オッズは1.0）
 * @returns 実際にかける割合（0〜1の実数, wealthに対する割合）
 */
export function actualBetFraction(
  maxBet: number,
  wealth: number,
  winProb: number,
  netOdds: number
): number {
  if (wealth <= 0) throw new Error("wealthは0より大きい値を指定してください");
  if (maxBet < 0) throw new Error("maxBetは0以上で指定してください");
  if (winProb < 0 || winProb > 1) throw new Error("winProbは0〜1の範囲で指定してください");
  if (netOdds <= 0) return 0;

  // ケリー基準で理論的な割合を計算
  const kelly = kellyFraction(winProb, netOdds);

  // wealthに対する割合でmaxBetをクリップ
  const maxFraction = Math.min(1, maxBet / wealth);

  // 実際にかける割合は、ケリー割合とmaxFractionの小さい方
  return Math.max(0, Math.min(kelly, maxFraction));
}

/**
 * 賭け金の上限（maxBet）、所持財産（wealth）、勝率（winProb）、純オッズ（netOdds）を受け取り、
 * 実際にかける割合での対数成長率（log growth rate）を返す関数
 * @param maxBet 賭け金の上限（絶対額, 0以上）
 * @param wealth 所持財産（絶対額, 0より大きい必要あり）
 * @param winProb 勝率（0〜1の実数）
 * @param netOdds 純オッズ（例: 1.0 なら1倍の純利益。2.0倍配当なら純オッズは1.0）
 * @returns 実際にかける割合での対数成長率（log growth rate）
 */
export function actualLogGrowthRate(
  maxBet: number,
  wealth: number,
  winProb: number,
  netOdds: number
): number {
  // 実際にかける割合を計算
  const fraction = actualBetFraction(maxBet, wealth, winProb, netOdds);
  // その割合での対数成長率を計算
  return logGrowthRate(fraction, winProb, netOdds);
}

/**
 * 賭けの期待値（expected value）を返す関数
 * @param betAmount 賭け金（絶対額, 0以上）
 * @param winProb 勝率（0〜1の実数）
 * @param netOdds 純オッズ（例: 1.0 なら1倍の純利益。2.0倍配当なら純オッズは1.0）
 * @returns 期待値（betAmountあたりの期待収益, 実数）
 */
export function expectedValue(
  betAmount: number,
  winProb: number,
  netOdds: number
): number {
  if (betAmount < 0) throw new Error("betAmountは0以上で指定してください");
  if (winProb < 0 || winProb > 1) throw new Error("winProbは0〜1の範囲で指定してください");
  if (netOdds < 0) throw new Error("netOddsは0以上で指定してください");

  // 期待値 = 勝つ場合の期待収益 + 負ける場合の期待収益
  // 勝つ場合: betAmount * netOdds の利益
  // 負ける場合: betAmount の損失
  return winProb * betAmount * netOdds - (1 - winProb) * betAmount;
}

/**
 * 95%信頼区間での確率推定（標本平均と信頼区間上下）を返す関数
 * @param n 標本数（0より大きい整数）
 * @param k 事象に当てはまる標本数（0以上n以下の整数）
 * @returns { mean: number, lower: number, upper: number }
 *   mean: 標本平均
 *   lower: 95%信頼区間の下限
 *   upper: 95%信頼区間の上限
 */
export function binomialConfidenceInterval95(n: number, k: number): { mean: number, lower: number, upper: number } {
  if (!Number.isInteger(n) || n <= 0) throw new Error("nは1以上の整数で指定してください");
  if (!Number.isInteger(k) || k < 0 || k > n) throw new Error("kは0以上n以下の整数で指定してください");

  // 標本平均
  const mean = k / n;

  // 正規近似による95%信頼区間（Wilsonスコア区間の方が良いが、ここでは簡易に正規近似）
  // Wilsonスコア区間を使う
  const z = 1.96; // 95%信頼水準
  const denominator = 1 + (z * z) / n;
  const center = (mean + (z * z) / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt(
    (mean * (1 - mean) + (z * z) / (4 * n)) / n
  );
  const lower = Math.max(0, center - margin);
  const upper = Math.min(1, center + margin);

  return { mean, lower, upper };
}
