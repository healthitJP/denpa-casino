// NOTE: このスクリプトは tsconfig の `module: esnext` 環境下でも
// `ts-node` でそのまま実行できるように CommonJS 形式 (require) を使っています。
// もし import/export を使いたい場合は
//   npx ts-node --esm scripts/convertMonsterCSV.ts
// のように `--esm` フラグを付けてください。

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/**
 * Usage:
 *   npx ts-node scripts/convertMonsterCSV.ts [path/to/monsterList.csv] [--out path/to/output.json]
 *
 * If no path is given, it falls back to `src/data/monsterList.csv` relative to the project root.
 */

// ------------------------------
// CLI 引数処理
// ------------------------------
const args = process.argv.slice(2);

// 入力 CSV (最初に現れる .csv 拡張子付きの引数、なければデフォルト)
const csvArg = args.find((a) => a.toLowerCase().endsWith(".csv"));

// 出力 JSON (--out または -o の次の引数)
let outArg: string | undefined;
const outFlagIdx = args.findIndex((a) => a === "--out" || a === "-o");
if (outFlagIdx !== -1 && args[outFlagIdx + 1]) {
  outArg = args[outFlagIdx + 1];
}

// Resolve paths
const csvPath = csvArg
  ? path.resolve(process.cwd(), csvArg)
  : path.resolve(__dirname, "../src/data/monsterList.csv");

const outPath = outArg ? path.resolve(process.cwd(), outArg) : undefined;

// --bom フラグ
const withBOM = args.includes("--bom");

// Read CSV (assume UTF-8, trim trailing newlines)
const rawCsv = fs.readFileSync(csvPath, "utf-8").trim();

// Convert to desired JSON structure
const combinations = rawCsv.split(/\r?\n/).map((line: string) => {
  const cols = line.split(",");
  const monsters: { name: string; victories: number }[] = [];

  // Each monster occupies 3 consecutive columns: name, victories, bogus probability
  for (let i = 0; i < cols.length; i += 3) {
    const name = cols[i]?.trim();
    const victoriesRaw = cols[i + 1]?.trim();

    if (!name || !victoriesRaw) continue; // Skip empty cells

    const victories = Number(victoriesRaw);
    if (Number.isNaN(victories)) continue; // Guard against malformed numbers

    monsters.push({ name, victories });
  }

  return { monsters };
});

const output = { combinations };

// ------------------------------
// 出力
// ------------------------------
const jsonString = JSON.stringify(output, null, 2);

if (outPath) {
  const finalString = withBOM ? "\uFEFF" + jsonString : jsonString;
  fs.writeFileSync(outPath, finalString, "utf8");
  console.log(`✅ JSON written to ${outPath}${withBOM ? " (BOM)" : ""}`);
} else {
  // stdout (PowerShell が CP932 の場合は chcp 65001 に変更推奨)
  console.log(jsonString);
} 