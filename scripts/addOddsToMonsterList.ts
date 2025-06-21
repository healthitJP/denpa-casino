// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

// Paths
const root = path.resolve(__dirname, "../");
const monsterPath = path.join(root, "src/data/monsterList.json");
const oddsPath = path.join(root, "src/data/倍率");

// Load
const monsterJson = JSON.parse(fs.readFileSync(monsterPath, "utf8"));
const lines = fs.readFileSync(oddsPath, "utf8").trim().split(/\r?\n/);

lines.forEach((line: string, idx: number) => {
  const cols = line.split(/\t+/).filter(Boolean);
  const pairs: [string, number][] = [];
  for (let i = 0; i < cols.length; i += 2) {
    const name = cols[i];
    const oddsStr = cols[i + 1];
    if (!name || !oddsStr) continue;
    pairs.push([name, parseFloat(oddsStr)]);
  }

  const combo = monsterJson.combinations[idx];
  if (!combo) {
    console.warn(`No combination at index ${idx}`);
    return;
  }

  pairs.forEach(([name, odds]) => {
    const m = combo.monsters.find((mo: any) => mo.name === name);
    if (m) {
      m.netOdds = odds;
    } else {
      console.warn(`Monster not found in combo ${idx}: ${name}`);
    }
  });
});

fs.writeFileSync(monsterPath, JSON.stringify(monsterJson, null, 2), "utf8");
console.log("Updated monsterList.json with netOdds"); 