"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "../../utils/supabaseBrowser";
import { usePersistentGroupIds } from "../../hooks/usePersistentGroupIds";
import StatSelector from "../../components/StatSelector";
import { StatsCombination, StatsResponseBody, StatsMode } from "../../types/stats";
import ComboSearchList from "./components/ComboSearchList";
import StatsGrid from "./components/StatsGrid";
import { useBettingResults } from "./hooks/useBettingResults";
import TopProgressBar from "./components/TopProgressBar";
import RecentRecords from "./components/RecentRecords";
import { InlineMath } from "react-katex";
import { arrayMove } from "@dnd-kit/sortable";

interface Props {
    initialCombos: { id: number; monsters: any[] }[];
}

export default function BettingClient({ initialCombos }: Props) {
    const supabase = useMemo(() => createClient(), []);

    // combinations passed from server
    const [combinations, setCombinations] = useState(initialCombos);

    // Default to 'all' stats when not logged in. If user logs in, we'll switch to 'self'.
    const [mode, setMode] = useState<StatsMode>("all");
    const [includeDefault, setIncludeDefault] = useState(true);
    const [excludeDraws, setExcludeDraws] = useState(false);
    const [selfId, setSelfId] = useState<string>("");

    // Selected combination id
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selectedCombo = combinations.find((c) => c.id === selectedId) ?? null;

    // Stats for selected combination
    const [stats, setStats] = useState<StatsCombination | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Inputs
    const [searchText, setSearchText] = useState("");
    const [wealth, setWealth] = useState<number>(1000);
    const [maxBet, setMaxBet] = useState<number>(100);
    const [netOddsInputs, setNetOddsInputs] = useState<number[]>([]);
    const [winner, setWinner] = useState<string>("DRAW");

    // recent records
    const [recentRecords, setRecentRecords] = useState<any[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const [message, setMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch user UID on mount
    useEffect(() => {
        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                setSelfId(user.id);
            }
        })();
    }, [supabase]);

    const [groupIds, setGroupIds] = usePersistentGroupIds(selfId);

    // fetch stats when selectedId or options change
    useEffect(() => {
        if (!selectedId) return;
        setStatsLoading(true);
        supabase.functions
            .invoke("stats", {
                body: {
                    mode,
                    include_default: includeDefault,
                    exclude_draws: excludeDraws,
                },
            })
            .then(({ data, error }) => {
                if (error) {
                    setMessage(error.message);
                    setStats(null);
                } else {
                    const body = data as StatsResponseBody;
                    const comb = body.combinations.find((c) => c.combination_id === selectedId) ?? null;
                    setStats(comb);
                    if (comb) {
                        // set default netOdds inputs
                        setNetOddsInputs(
                            comb.monsters.map((m) => Number(m.avg_net_odds.toFixed(2)))
                        );
                    }
                }
                setStatsLoading(false);
            });
    }, [selectedId, mode, includeDefault, excludeDraws, groupIds, supabase]);

    const results = useBettingResults(
        stats,
        selectedCombo,
        netOddsInputs,
        wealth,
        maxBet,
        excludeDraws,
    );

    // fetch recent records when user id is set
    useEffect(() => {
        async function fetchRecent() {
            if (!selfId) return;
            setRecentLoading(true);
            const { data, error } = await supabase
                .from("bets_records")
                .select(
                    "id, outcome_monster_name, is_draw, created_at, combination_id, combinations(monsters)"
                )
                .eq("user_id", selfId)
                .order("created_at", { ascending: false })
                .limit(10);
            if (error) {
                console.error("[BettingPage] recent records error", error);
            } else {
                setRecentRecords(data ?? []);
            }
            setRecentLoading(false);
        }

        fetchRecent();
    }, [selfId, supabase]);

    // reorder handler for drag-and-drop
    const handleReorder = useCallback(
        (fromIdx: number, toIdx: number) => {
            if (!stats) return;
            setStats((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    monsters: arrayMove(prev.monsters, fromIdx, toIdx),
                } as StatsCombination;
            });

            setNetOddsInputs((prev) => arrayMove(prev, fromIdx, toIdx));
        },
        [stats, selectedId]
    );

    async function handleRecord() {
        setMessage(null);
        setIsSubmitting(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setIsSubmitting(false);
            return (window.location.href = "/login");
        }
        if (!selectedId || !stats) {
            setMessage("組を選択してください");
            setIsSubmitting(false);
            return;
        }

        // --- 並び順配列 ({0,1,2} など) を生成 -----------------
        const monstersOrder = stats.monsters.map(
            (s) => selectedCombo?.monsters.findIndex((m) => m.name === s.name) ?? -1
        )

        // bet_details にも order フィールドを含め、JSON 内での安全性を高める
        const betDetails = results.map((r, idx) => ({
            order: idx, // 0,1,2 ... ドラッグ後の表示順
            name: r.stat.name,
            netOdds: r.netOdds,
            betAmount: Number(r.betAmount.toFixed(2)),
            recommendedFraction: Number(r.fraction.toFixed(4)),
        }));

        // ensure user profile row exists (insert if missing)
        const { error: profileError } = await supabase.from("users").upsert({ id: user.id });
        if (profileError) {
            console.error("[BettingPage] profile upsert error", profileError);
        }

        const { error } = await supabase.from("bets_records").insert({
            user_id: user.id,
            combination_id: selectedId,
            outcome_monster_name: winner === "DRAW" ? null : winner,
            is_draw: winner === "DRAW",
            total_wealth: wealth,
            max_bet: maxBet,
            bet_details: betDetails,
            monsters_order: monstersOrder,
        });

        if (error) {
            setMessage(`エラー: ${error.message}`);
            setIsSubmitting(false);
        } else {
            setMessage("記録しました");
            // reset selection and search box
            setSelectedId(null);
            setResultsReset();
            setSearchText("");

            // refresh recent records
            (async () => {
                const { data, error } = await supabase
                    .from("bets_records")
                    .select(
                        "id, outcome_monster_name, is_draw, created_at, combination_id, combinations(monsters)"
                    )
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                if (!error) setRecentRecords(data ?? []);
            })();

            setIsSubmitting(false);
        }
    }

    function setResultsReset() {
        setNetOddsInputs([]);
        setWinner("DRAW");
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            <TopProgressBar active={isSubmitting} />
            <h1 className="text-2xl font-semibold">格闘場シミュレーション</h1>

            <ComboSearchList
                combos={combinations}
                selectedId={selectedId}
                onSelect={(id) => {
                    if (id !== selectedId) {
                        setSelectedId(id);
                        setResultsReset();
                    }
                }}
                searchText={searchText}
                setSearchText={setSearchText}
            />

            {/* wealth inputs */}
            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                    所持金:
                    <input
                        type="number"
                        value={wealth}
                        className="border rounded px-2 py-1 w-32"
                        onChange={(e) => setWealth(Number(e.target.value))}
                    />
                </label>
                <label className="flex items-center gap-2">
                    賭け金上限:
                    <input
                        type="number"
                        value={maxBet}
                        className="border rounded px-2 py-1 w-32"
                        onChange={(e) => setMaxBet(Number(e.target.value))}
                    />
                </label>
            </div>

            {/* stat selector */}
            {selfId && (
                <StatSelector
                    mode={mode}
                    setMode={setMode}
                    includeDefault={includeDefault}
                    setIncludeDefault={setIncludeDefault}
                    excludeDraws={excludeDraws}
                    setExcludeDraws={setExcludeDraws}
                    groupIds={groupIds}
                    setGroupIds={setGroupIds}
                    selfId={selfId}
                />
            )}

            {/* selected combo display */}
            {statsLoading && <p>統計取得中...</p>}
            {selectedCombo && stats && (
                <>
                    <StatsGrid
                        stats={stats}
                        results={results}
                        netOddsInputs={netOddsInputs}
                        setNetOddsInputs={setNetOddsInputs}
                        excludeDraws={excludeDraws}
                        onReorder={handleReorder}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        上記のモンスターカードはドラッグで並べ替えでき、並び順も記録されます。今後並び順ごとの勝率計算機能も追加予定です。
                    </p>
                </>

            )}
            {selectedCombo && !stats && !statsLoading && (
                <p className="text-gray-800">この組み合わせの試合の記録はまだありません。</p>
            )}

            {/* winner dropdown */}
            {selectedCombo && selfId && (
                <div className="flex items-center gap-2">
                    <label>試合結果 (勝者):</label>
                    <select className="border rounded p-2" value={winner} onChange={(e) => setWinner(e.target.value)}>
                        <option value="DRAW">引き分け</option>
                        {selectedCombo.monsters.map((m) => (
                            <option key={m.name} value={m.name}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* record button */}
            {selectedCombo && (
                <button
                    onClick={handleRecord}
                    disabled={isSubmitting}
                    className={`px-6 py-3 rounded self-start ${isSubmitting ? "bg-gray-400 text-white" : "bg-gray-600 text-white hover:bg-gray-700"
                        }`}
                >
                    {isSubmitting
                        ? "送信中…"
                        : !selfId
                            ? "ログインして記録する"
                            : "記録する"}
                </button>
            )}

            {/* recent records list */}
            {selfId && (
                <>
                    {recentLoading && <p>記録を取得中...</p>}
                    <RecentRecords records={recentRecords} />
                </>
            )}

            {/* ----- ガイドライン ----- */}
            <div className="mt-8 p-4 border rounded bg-gray-50 dark:bg-gray-800 dark:text-gray-200 text-sm leading-6">
                <h3 className="font-semibold mb-2">指標の読み方と目安</h3>
                <ul className="list-disc ml-5 space-y-1">
                    <li>
                        <b>推奨賭け金</b> … <u>1/4 ケリー</u> (Quarter Kelly) による推奨額です。<br />
                        まず <InlineMath math={"f_{\\text{kelly}} = \\frac{p \\times b - (1 - p)}{b}"} /> (Full Kelly) を求め、<br />
                        <InlineMath math={"f = 0.25 \\times f_{\\text{kelly}}"} /> として所持金に賭けます。<br />
                        最終的な賭け金 = <InlineMath math={"\\min(f \\times \\text{所持金},\\text{賭け金上限})"} />。<br />
                        0 なら統計的に賭けるメリットが無いか、上限が 0 の状態です。
                    </li>
                    <li>
                        <b>対数成長率</b> (log-growth) … 期待される資産対数増加率。<br />
                        <InlineMath math={"g = p \\times \\ln(1 + f \\times b) + (1 - p) \\times \\ln(1 - f)"} /><br />
                        0 より大きい値のみ賭ける価値があります。<br />
                        参考目安: 0.01 以上=許容、0.05 以上=魅力的、0.10 以上=非常に好条件。
                    </li>
                    <li>
                        <b>期待利益 (平均)</b> … 推奨賭け金を賭けた場合の平均利益。<br />
                        <InlineMath math={"E[\\text{profit}] = p \\times \\text{bet} \\times b - (1 - p) \\times \\text{bet}"} /><br />
                        正なら長期的に利益期待がプラス。金額が大きいほど有利ですが、<br />
                        対数成長率が十分に高いか・悲観的期待利益もプラスかを必ず確認してください。
                    </li>
                    <li>
                        <b>悲観的期待利益 (95%下限)</b> … 勝率の95%信頼区間下限 <InlineMath math={"p_{\\text{lower}}"} /> を用いて<br />
                        <InlineMath math={"p = p_{\\text{lower}}"} /> として同じ式で計算した利益。<br />
                        0 未満の場合はリスクが高いので見送りが無難です。
                    </li>
                    <li>
                        <b>勝率 CI</b> … Wilson スコア法で推定した 95% 信頼区間。<br />
                        区間が狭いほど過去データが豊富。幅が広い場合は不確実性が高く、<br />
                        悲観的期待利益を重視することを推奨します。
                    </li>
                </ul>
            </div>
        </div>
    );
} 