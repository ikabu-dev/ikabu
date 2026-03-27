# CLAUDE.md

## プロジェクト概要

ikabu は Discord Bot アプリケーション。Node.js + TypeScript + discord.js v14 で構築されており、スプラトゥーン3のリクルート機能を中心とした各種 Discord コマンドを提供する。

## 技術スタック

- **Runtime**: Node.js 24.x (Volta で管理)
- **Language**: TypeScript
- **Framework**: discord.js v14, Express
- **DB**: SQLite (better-sqlite3 + Prisma)
- **Test**: Vitest
- **Lint/Format**: ESLint + Prettier

## コマンド

```bash
npm run compile    # prisma generate && tsc && prisma migrate deploy
npm start          # compile してからサーバー起動
npm test           # Vitest でテスト実行
npm run lint       # ESLint
npm run fix        # ESLint 自動修正
npm run create-migrate  # Prisma マイグレーションファイル作成
```

## ディレクトリ構成

```
src/
  app/
    common/        # 共通コンポーネント
    constant/      # 定数
    event/         # Discord イベントハンドラ
    feat-admin/    # 管理系機能
    feat-recruit/  # リクルート機能（メイン機能）
    feat-utils/    # ユーティリティ系機能
    handlers/      # コマンドハンドラ
  db/              # DB アクセス層
  server.ts        # エントリポイント
prisma/            # Prisma スキーマ・マイグレーション
config/            # アプリ設定 (node-config)
images/            # Bot が生成する画像の素材
```

## 環境変数

`.env.sample` を参照。`.env` ファイルをローカルに作成して設定する。

主要な変数：
- `DISCORD_BOT_TOKEN` — Bot トークン
- `DISCORD_BOT_ID` — Bot のアプリケーション ID
- `SERVER_ID` — メインギルド ID
- `DATABASE_URL` — SQLite ファイルパス（例: `file:./db.sqlite3`）
- `SLASH_COMMAND_REGISTER_MODE` — `guild` または `global`

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
