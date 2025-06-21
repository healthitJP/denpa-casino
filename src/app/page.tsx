// @ts-nocheck
import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center text-center gap-10 py-24 px-4 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold leading-tight">
        電波人間のRPG Free カジノ格闘場 <br className="hidden sm:block" />
        シミュレーション&対戦記録アプリ
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        過去データとユーザーが記録した最新の試合結果をもとに、<br />
        勝率×オッズの期待値で<strong>どのモンスターに賭けるべきか</strong>を瞬時に分析。<br />
        Googleアカウントでログインして自分の戦績を追加すると、<br />
        「自分だけ」「グループ」「全体」など柔軟に統計を切り替えてさらに最適化！<br />
        ログインなしの場合は全統計データ（全体）から計算されます。
      </p>
      <Link
        href="/betting"
        className="px-8 py-4 bg-gray-600 text-white rounded-full text-xl hover:bg-gray-700 transition"
      >
        賭けをシミュレーションする
      </Link>
      <a
        href="https://x.com/_____uxoxu__"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-blue-500 underline hover:text-blue-700"
      >
        不具合報告はこちら（X: @_____uxoxu__）
      </a>
    </section>
  );
}
