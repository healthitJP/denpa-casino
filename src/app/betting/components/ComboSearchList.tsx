import React from 'react'

interface Combo {
  id: number
  monsters: any[]
}
interface Props {
  combos: Combo[]
  selectedId: number | null
  onSelect: (id: number) => void
  searchText: string
  setSearchText: (v: string) => void
}

export default function ComboSearchList({ combos, selectedId, onSelect, searchText, setSearchText }: Props) {
  const filtered = React.useMemo(() => {
    if (!searchText) return combos
    // 分割: スペース・スラッシュ(／/)
    const keywords = searchText
      .split(/[\s/／]+/)
      .map((s) => s.trim())
      .filter((s) => s)

    return combos.filter((c) =>
      keywords.every((kw) => c.monsters.some((m) => m.name.includes(kw)))
    )
  }, [searchText, combos])

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="モンスター名で検索"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="border rounded px-3 py-2"
      />
      {filtered.length > 0 && (
        <div className="max-h-60 overflow-y-auto border rounded">
          {filtered.map((combo) => {
            const label = combo.monsters.map((m) => m.name).join(' / ')
            return (
              <button
                key={combo.id}
                className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                onClick={() => {
                  onSelect(combo.id)
                  setSearchText(label)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
} 