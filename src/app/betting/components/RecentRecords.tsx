import React from 'react'

interface RecentRecord {
  id: number
  combination_id: number
  created_at: string
  outcome_monster_name: string | null
  is_draw: boolean
  combinations?: {
    monsters: { name: string }[]
  } | null
}

interface Props {
  records: RecentRecord[]
}

export default function RecentRecords({ records }: Props) {
  if (!records.length) return null

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString()
  }

  return (
    <div className="flex flex-col gap-2 mt-8 w-full overflow-x-auto">
      <h2 className="text-xl font-semibold">直近の記録</h2>
      <div className="border rounded">
        <table className="min-w-full table-fixed text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-1 text-center">日時</th>
              <th className="px-2 py-1 text-center">組み合わせ</th>
              <th className="px-2 py-1 text-center">結果</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => {
              const monsters = rec.combinations?.monsters?.map((m) => m.name).join(" / ") ?? "-"
              const result = rec.is_draw ? "引き分け" : rec.outcome_monster_name ?? "-"
              return (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 text-center whitespace-nowrap">{formatDate(rec.created_at)}</td>
                  <td className="px-2 py-1 text-center">{monsters}</td>
                  <td className="px-2 py-1 text-center">{result}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 