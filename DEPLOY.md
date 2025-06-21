# Vercel へのデプロイ手順

> **対象読者**: Supabase 連携済み Next.js (App Router) プロジェクトを **GitHub → Vercel** に CI/CD したい開発者。
>
> 参考: [Next.js × Vercel デプロイ公式ガイド](https://nextjs.org/learn/pages-router/deploying-nextjs-app-deploy) / [Vercel × Next.js ドキュメント](https://vercel.com/docs/frameworks/nextjs)

---

## 0. 前提

| ツール | バージョン目安 |
|--------|----------------|
| Node.js | 20.x (Vercel のデフォルト) |
| Next.js | 15 (App Router) |
| Supabase CLI | 任意 (ローカル DB 用) |

* GitHub リポジトリにプッシュ済み (`origin/main`)
* Supabase プロジェクト作成済み (`project-ref.supabase.co`)
* `.env.local` でローカル動作確認済み

---

## 1. Vercel アカウント & プロジェクト作成

1. [Vercel](https://vercel.com/) で **GitHub 連携**しアカウント作成 (無料プランで十分)
2. **Import Project** → 対象リポジトリを選択
3. フレームワークは自動で *Next.js* と検出されるのでデフォルト設定で OK
4. **Environment Variables** を入力 (次章参照)
5. `Deploy` ボタンを押すと **Production URL** と **Preview URL** が生成される

---

## 2. 必須環境変数

| Key | Scope | 例 | 備考 |
|-----|-------|----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | **All** | `https://abcd.supabase.co` | **公開値** (App & Edge Functions で使用) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **All** | `<anon-key>` | **公開値** (ブラウザ用) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server / Functions** | `<service-role-key>` | **機密**。Edge Function `stats` が RLS をバイパスするために必須 |
| `SUPABASE_URL` | **Server / Functions** | `https://abcd.supabase.co` | Functions から `createClient` する際に参照 |
| `SUPABASE_ANON_KEY` | **Server / Functions** | `<anon-key>` | 同上 |

> Vercel の UI では **Environment → Add** で入力。Scope は以下 3 つ:
>
> * **Production**: `main` ブランチ用
> * **Preview**: PR / フィーチャーブランチ
> * **Development**: `vercel dev` 時

Secrets (鍵アイコン) にすると値が UI から隠れログにも出ません。

### .env.local との対応

```
# ローカル開発用 (コミットしないこと)
NEXT_PUBLIC_SUPABASE_URL=https://abcd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=yyyy
SUPABASE_URL=https://abcd.supabase.co
SUPABASE_ANON_KEY=xxxx
```

---

## 3. ビルド & デプロイ設定

| 設定項目 | 値 | 備考 |
|-----------|-----|------|
| **Framework** | Next.js | 自動検出 |
| **Build Command** | `next build` | デフォルト |
| **Output Directory** | `.next` | 自動 |
| **Install Command** | `pnpm install --frozen-lockfile` | `pnpm` を使う場合。Vercel が自動検出 |
| **Node.js Version** | 20 | `Settings → General` で変更可 |

Edge Function (`supabase/functions/stats`) は **Deno でビルド不要**。Vercel は `supabase/functions/**` を無視するため、Supabase プロジェクト側でホストされます。

---

## 4. デプロイフロー

1. `git push origin main` → Vercel が **Production** ビルド
2. プルリクを作ると自動で **Preview** デプロイ
3. `vercel pull` でローカルに環境変数を同期すると `vercel dev` が実行可能

---

## 5. デバッグ Tips

### Build 失敗
* `Cannot find module` → `package.json` の依存が抜けていないか確認 (`@yaireo/tagify` など)
* `Next.js Version mismatch` → `package.json` と lockfile を合わせる

### Runtime エラー (Supabase)
* 500 + `invalid api key` → **環境変数のキー名** が一致しているか (`NEXT_PUBLIC_` 付き)
* 401 on Edge Function → `SUPABASE_SERVICE_ROLE_KEY` が未設定

### OAuth リダイレクトが 404
* Vercel ドメイン (`https://denpa-casino.vercel.app/login`) を **Supabase Redirect URLs** に追加したか確認

---

## 6. 本番ドメインを追加する場合

1. Vercel Dashboard → Project → **Settings → Domains → Add**
2. DNS A/AAAA レコード or CNAME を切替
3. ドメイン追加後、**共通リダイレクト URL** に `https://your-domain.com/...` を追記
4. Google & Twitter 管理画面にも同じ URL を追加

---

## 7. まとめ

* GitHub → Vercel 連携で CI/CD
* **環境変数 5 つ** を Production / Preview / Development すべてに設定
* 本番ドメインを登録したら Supabase と OAuth プロバイダー両方に URL を追記

これで `main` にマージ → 数分で本番 URL が更新、Edge Function も Supabase 側で自動反映される運用が完成します。 