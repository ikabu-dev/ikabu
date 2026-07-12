# CLAUDE.md

## プロジェクト概要

ikabu は Discord Bot アプリケーション。Node.js + TypeScript + discord.js v14 で構築されており、スプラトゥーン3のリクルート機能を中心とした各種 Discord コマンドを提供する。

## 技術スタック

- **Runtime**: Node.js 24.x (mise で管理)
- **Language**: TypeScript
- **Framework**: discord.js v14, Express
- **DB**: SQLite (better-sqlite3 + Prisma)
- **Test**: Vitest
- **Lint/Format**: ESLint + Prettier

## コマンド

Node.js と pnpm は mise で管理されているため、シェルで mise が有効化されていない環境（CI・エディタのターミナルなど）では `mise exec --` を前置して実行する。

```bash
mise exec -- pnpm run compile    # prisma generate && tsc && prisma migrate deploy
mise exec -- pnpm start          # compile してからサーバー起動
mise exec -- pnpm test           # Vitest でテスト実行
mise exec -- pnpm run lint       # ESLint
mise exec -- pnpm run fix        # ESLint 自動修正
mise exec -- pnpm run create-migrate  # Prisma マイグレーションファイル作成
```

## ディレクトリ構成

```
src/
  gateway/         # Discord イベント受信・ルーティング
  registry/        # コマンド定義の集約・登録
  jobs/            # 定期実行ジョブ
  features/        # 機能別モジュール（リクルート、VC、おみくじ等）
  infra/           # インフラ層（DB・外部API・ログ・HTTP）
    db/            #   Prisma クライアント・リポジトリ
    discord/       #   Discord クライアント
    external/      #   外部 API クライアント
    http/          #   HTTP サーバー
    logging/       #   ログ
  shared/          # 機能横断の共有ユーティリティ
  config/          # 環境変数・定数・設定
  server.ts        # エントリポイント
prisma/            # Prisma スキーマ・マイグレーション
config/            # アプリ設定 (node-config)
images/            # Bot が生成する画像の素材
test/              # テスト（src/ のミラー構造）
```

### 依存方向

ESLint `import/no-restricted-paths` で以下の依存方向を強制している。逆方向の import は lint エラーになる。

```
gateway / registry / jobs  →  features  →  infra / shared / config
```

- feature 間の直接 import は禁止。共有が必要なら `shared/` に上げるか `gateway` / `registry` で合成する
- `config/` は葉。他のどの層にも依存しない

### コマンドの追加手順

1. `src/features/<機能名>/` に `<コマンド名>_command.ts` を作成し、`GuildChatInputCommand` または `GlobalChatInputCommand` を実装する
2. `src/registry/command_registry.ts` に 1 行追加してコマンドを登録する

## 環境変数

`.env.sample` を参照。`.env` ファイルをローカルに作成して設定する。

主要な変数：
- `DISCORD_BOT_TOKEN` — Bot トークン
- `DISCORD_BOT_ID` — Bot のアプリケーション ID
- `SERVER_ID` — メインギルド ID
- `DATABASE_URL` — SQLite ファイルパス（例: `file:./db.sqlite3`）
- `SLASH_COMMAND_REGISTER_MODE` — `guild` または `global`

## README の更新

以下のような構成・設定の変更を行った場合は、`README.md` も合わせて更新する：

- セットアップ手順に影響する変更（依存ツール・パッケージマネージャーの変更など）
- スクリプト（`package.json` の `scripts`）の追加・変更・削除
- 主要パッケージのバージョン変更（discord.js・Prisma・Node.js など）
- 環境変数の追加・変更
- git フック・CI など開発フローに関わるツールの追加・変更

## コミット規約

`.cz-config.js` に基づき、以下のプレフィックスを使用する：

| プレフィックス | 用途 |
|---|---|
| `feat:` | 機能追加 |
| `fix:` | バグ修正 |
| `docs:` | ドキュメントのみの変更 |
| `style:` | コードの動作に影響しない見た目の変更 |
| `refactor:` | バグ修正・機能追加以外のコード変更 |
| `perf:` | パフォーマンス改善 |
| `test:` | テストの追加・修正 |
| `chore:` | ビルドや補助ツールの変更 |

コミットメッセージは**日本語**で記述する。
