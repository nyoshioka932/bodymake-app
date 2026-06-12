# BodyMake Tracker

体組成・摂取カロリー/PFC・消費カロリー・筋トレ・体型写真を統合し、週次PDCAを回すための個人向けフィットネス管理アプリ。

詳細な要件・設計は [`docs/`](./docs) を参照してください。

- [要件定義書](./docs/要件定義書_BodyMake_体組成トレーニング管理アプリ_v2.md)
- [設計書](./docs/設計書_BodyMake_体組成トレーニング管理アプリ_v2.md)
- [実装指示書](./docs/実装指示書_BodyMake_ClaudeCode向け_v1.md)

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth / PostgreSQL / Storage / RLS)
- Vercel ホスティング

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Supabaseプロジェクトの値を設定してください。

```bash
cp .env.local.example .env.local
```

| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのanon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー専用キー。**ブラウザに公開されるコードでは使用しないこと** |
| `NEXT_PUBLIC_APP_URL` | アプリの公開URL（ローカルは `http://localhost:3000`） |

`.env.local` はGit管理対象外です。

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いて確認してください。

## ビルド・Lint

```bash
npm run build
npm run lint
```

## ディレクトリ構成（抜粋）

```text
app/                # ルーティング（App Router）
components/ui/      # shadcn/uiコンポーネント
lib/supabase/       # Supabaseクライアント（client / server）
docs/               # 要件定義書・設計書・実装指示書
```

## 実装状況

現在はPhase 0（プロジェクト初期化）完了。DB/Auth/RLS、データ取込、各機能画面は今後のPhaseで実装します。
