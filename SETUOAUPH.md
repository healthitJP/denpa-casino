# OAuth プロバイダー設定手順（ローカル & 本番）

Supabase Auth には **クライアント ID / シークレット** と **リダイレクト URL** の 2 つを登録します。  
ここでは Google と X (Twitter) を例に、**開発環境 (http://localhost:3000)** と **本番 URL** の両方を想定した手順をまとめます。

> 前提: Supabase プロジェクトを作成済みで、`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が手元にあること。

## 共通リダイレクト URL

以下 2 つは **必ず両プロバイダーで共通** です。  
本番 URL (`https://your-domain.com`) を使う際は **ドメイン部分だけ置き換えて追加** します。

```text
http://localhost:3000/login
http://localhost:3000/api/auth/callback

https://denpa-casino-git-main-hawawapuddings-projects.vercel.app/login
https://denpa-casino-git-main-hawawapuddings-projects.vercel.app/api/auth/callback
```

1. Supabase ダッシュボード → Auth → Settings → **Redirect URLs** に上記 4 行を登録
2. 各プロバイダーの管理画面でも **Callback / Redirect URL** として同じ 4 行を登録

---

## Google

1. [Google Cloud Console](https://console.cloud.google.com/) で **プロジェクト作成** → 「OAuth 同意画面」を *外部* で公開
   - アプリ名 / サポートメール / デベロッパー連絡先を入力
   - スコープはデフォルト (email, profile, openid) で十分
2. 「**認証情報** → **OAuth クライアント ID**」を新規作成 (アプリケーションの種類 = **ウェブアプリ**)
   - **承認済みリダイレクト URI** に *共通リダイレクト URL* 4 行を追加
   - 名前例: `denpa-casino web` など分かりやすい物にする
   - Google OAuth の仕様上、**1 つのクライアント ID に複数の URI** を登録できるため、**ローカルと本番を分けず 1 件で OK** です。
     （必要なら環境ごとにクライアント ID を発行 → Supabase 環境変数で切替えても可）
   - 参考: [Google OAuth 2.0 Web apps](https://developers.google.com/identity/protocols/oauth2?hl=ja#web)
3. 発行された **クライアント ID / クライアント シークレット** を控える
4. Supabase ダッシュボード → Auth → **Google** タブを有効化し、ID / シークレットを貼り付けて保存
```
https://ckaytyqlmouzwqkzoozn.supabase.co/auth/v1/callback
```
これも追加

### よくあるエラー
| エラー | 原因 | 解決策 |
|--------|------|--------|
| `redirect_uri_mismatch` | Google Console と Supabase の URL が不一致 | 4 行すべて完全一致しているか再確認 |
| 403: access_not_configured | OAuth 同意画面が「テスト」状態 | *公開* に切り替える or テストユーザーを追加 |

---

## X (Twitter)

Twitter は 2024 年時点で **OAuth2** が推奨です。（Supabase は v2 に対応済み）

1. [developer.twitter.com](https://developer.twitter.com/) → *Project & Apps* → **Add App**
2. **User authentication settings** を **OAuth 2.0** (3-legged) に変更
   - *Type of App* → *Web App, Automated App or Bot*
   - **Callback URI / Redirect URI** → 共通 4 行を追加
   - **Website URL** → 本番サイトの URL で OK
   - **Client ID / Secret** が生成される
   - **Scopes** は `tweet.read users.read offline.access` 程度で十分（メール取得は不可）
3. Supabase ダッシュボード → Auth → **Twitter** タブを有効化 → Client ID / Secret を入力

> **注意**: Twitter の無料プランはアプリ審査が厳格です。メールアドレス取得不可 / 5→10 回ログイン制限などの制約に注意してください。

---

## 環境変数まとめ

`env.local` (ローカル開発) には最低限下記を記述します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Edge Function でのみ使用 (サーバー側) – 例: .env
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

本番環境 (Vercel 等) では **Environment Variables** に同名で登録してください。  
Service Role Key は絶対に公開リポジトリにコミットしないよう注意。

---

## 動作確認フロー

1. `.env.local` を用意 → `pnpm dev` で Next.js を起動
2. ブラウザで `http://localhost:3000/login` にアクセス
3. Google と Twitter のボタンを試す
   - 初回のみプロバイダー側の同意画面→OK→Supabase → `users` テーブルに行追加
4. `supabase.auth.getUser()` がユーザーを返すことを確認

問題があれば Supabase Auth > Logs でエラーログを確認し、リダイレクト URL / クライアント ID の不一致を探してください。
