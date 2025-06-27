const fs = require("fs");
const path = require("path");

function logGrowth(p, r) {
  const b = r - 1;
  const fullKelly = (p * b - (1 - p)) / b;
  const qKelly = Math.max(0, Math.min(1, fullKelly * 0.25));
  if (qKelly === 0) return -Infinity;
  return p * Math.log(1 + qKelly * b) + (1 - p) * Math.log(1 - qKelly);
}

function main() {
  const jsonPath = path.resolve("src/data/monsterList.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  let sumBest = 0;
  let sumAlt = 0;
  let n = 0;

  for (const comb of data.combinations) {
    const totalWins = comb.monsters.reduce((s, m) => s + m.victories, 0);
    if (totalWins === 0) continue;

    let bestMult = 0;
    let bestLog = -Infinity;
    let altMult = 0;

    for (const m of comb.monsters) {
      const p = m.victories / totalWins;
      const mult = p * m.netOdds;
      if (mult > bestMult) bestMult = mult;

      const g = logGrowth(p, m.netOdds);
      if (g > bestLog) {
        bestLog = g;
        altMult = mult;
      }
    }

    sumBest += bestMult;
    sumAlt += altMult;
    n += 1;
  }

  console.log(`組数: ${n}`);
  console.log(`期待倍率 (平均)    : ${(sumBest / n).toFixed(3)} 倍`);
  console.log(`期待倍率 (ログ基準): ${(sumAlt / n).toFixed(3)} 倍`);
}

main(); 