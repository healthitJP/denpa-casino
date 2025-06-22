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
    // 検索キーワードが無ければ元データをそのまま返す
    if (!searchText) return sortByMonsterCount(combos)

    // キーワードをスペース・スラッシュ(／/)
    // で分割し、前後の空白を除去した配列を生成
    const keywords = searchText
      .split(/[\s/／]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    // キーワードをすべて含むコンビネーションのみ抽出
    const matched = combos.filter((combo) =>
      keywords.every((kw) =>
        combo.monsters.some((monster) => monster.name.includes(kw))
      )
    )

    return sortByMonsterCount(matched)
  }, [searchText, combos])

  /**
   * モンスター数の少ない順（2体→3体→4体 …）にソートするヘルパー。
   * 元配列を破壊しないようにスプレッドでコピーしてから並び替える。
   */
  function sortByMonsterCount(list: Combo[]) {
    return [...list].sort((a, b) => a.monsters.length - b.monsters.length)
  }

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