const fs = require("fs");
const path = require("path");

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (arr.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

function logGrowth(p, r) {
  const b = r - 1;
  const fullKelly = (p * b - (1 - p)) / b;
  const q = Math.max(0, Math.min(1, fullKelly * 0.25));
  if (q === 0) return -Infinity;
  return p * Math.log(1 + q * b) + (1 - p) * Math.log(1 - q);
}

function main() {
  const jsonPath = path.resolve("src/data/monsterList.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  const multipliers = [];
  const altMultipliers = [];
  const logList = [];

  for (const comb of data.combinations) {
    const total = comb.monsters.reduce((s, m) => s + m.victories, 0);
    if (total === 0) continue;
    let best = 0;
    let bestLog = -Infinity;
    let bestMultForLog = 0;
    for (const m of comb.monsters) {
      const p = m.victories / total;
      const r = m.netOdds; // r is multiplier
      const mult = p * r;
      if (mult > best) best = mult;
      const g = logGrowth(p, r);
      if (g > bestLog) {
        bestLog = g;
        bestMultForLog = mult;
      }
    }
    multipliers.push(best);
    altMultipliers.push(bestMultForLog);
    logList.push(bestLog);
  }

  const n = multipliers.length;
  const mean = multipliers.reduce((s, v) => s + v, 0) / n;
  const median = percentile(multipliers, 0.5);
  const p25 = percentile(multipliers, 0.25);
  const p75 = percentile(multipliers, 0.75);
  const iqr = p75 - p25;
  const p5 = percentile(multipliers, 0.05);
  const cvar5 = multipliers.filter(v => v <= p5).reduce((s, v, _, arr) => s + v, 0) / multipliers.filter(v => v <= p5).length;
  const variance = multipliers.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const cv = sd / mean;
  const m3 = multipliers.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
  const m4 = multipliers.reduce((s, v) => s + (v - mean) ** 4, 0) / n;
  const skewness = sd > 0 ? m3 / sd ** 3 : 0;
  const kurtosis = sd > 0 ? m4 / sd ** 4 - 3 : 0;
  const probLoss = multipliers.filter(v => v < 1).length / n;
  const altMean = altMultipliers.reduce((s, v) => s + v, 0) / altMultipliers.length;
  const meanLog = logList.reduce((s, v) => s + v, 0) / logList.length;
  const sdLog = Math.sqrt(logList.reduce((s, v) => s + (v - meanLog) ** 2, 0) / logList.length);

  console.table({
    mean: mean.toFixed(3),
    median: median.toFixed(3),
    p5: p5.toFixed(3),
    cvar5: cvar5.toFixed(3),
    sd: sd.toFixed(3),
    cv: cv.toFixed(3),
    iqr: iqr.toFixed(3),
    skewness: skewness.toFixed(2),
    kurtosis: kurtosis.toFixed(2),
    probLoss: (probLoss * 100).toFixed(1) + "%",
    altMean: altMean.toFixed(3),
    meanLog: meanLog.toFixed(4),
    sdLog: sdLog.toFixed(4)
  });
}

main(); 