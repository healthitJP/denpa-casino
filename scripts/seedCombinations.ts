import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

/**
 * Seed the `public.combinations` table with the fixed data from src/data/monsterList.json.
 *
 * Requirements:
 *  - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment (e.g. .env.local).
 *  - Run with: npx ts-node scripts/seedCombinations.ts
 */
async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const jsonPath = path.resolve('src/data/monsterList.json')
  const raw = await fs.readFile(jsonPath, 'utf8')
  const data = JSON.parse(raw) as { combinations: { monsters: unknown }[] }

  // 既存件数を確認して二重挿入を回避
  const { count } = await supabase
    .from('combinations')
    .select('id', { count: 'exact', head: true })
  if (count && count > 0) {
    console.warn(`⚠️  combinations テーブルに既に ${count} 件存在します。二重挿入を避けるため処理を中止しました。`)
    return
  }

  console.log(`🌱  Inserting ${data.combinations.length} combinations ...`)
  const { error } = await supabase.from('combinations').insert(
    data.combinations.map((c) => ({ monsters: c.monsters }))
  )
  if (error) {
    console.error('❌  Insert failed:', error)
    process.exit(1)
  }
  console.log('✅  Seed completed!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}) 