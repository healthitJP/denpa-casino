const fs = require('fs');
const path = require('path');

function logGrowth(p, r) {
  const b = r - 1;
  const fullKelly = (p * b - (1 - p)) / b;
  const q = Math.max(0, Math.min(1, fullKelly * 0.25));
  if (q === 0) return -Infinity;
  return p * Math.log(1 + q * b) + (1 - p) * Math.log(1 - q);
}

function main() {
  const jsonPath = path.resolve(__dirname, '../src/data/monsterList.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  data.combinations.forEach((comb, idx) => {
    const total = comb.monsters.reduce((s, m) => s + m.victories, 0);
    if (total === 0) {
      console.log(`${idx + 1}: -Infinity (no victories)`);
      return;
    }
    let bestLog = -Infinity;
    comb.monsters.forEach(m => {
      const p = m.victories / total;
      const r = m.netOdds;
      const g = logGrowth(p, r);
      if (g > bestLog) bestLog = g;
    });
    console.log(`${idx + 1}: ${bestLog.toFixed(4)}`);
  });
}

if (require.main === module) {
  main();
} 