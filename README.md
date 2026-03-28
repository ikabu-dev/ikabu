# イカ部 Discord Bot with discord.js

## 概要

このリポジトリは、discord.js を用いた Discord Bot のソースコードです。

## セットアップ

### 前提条件

- [mise](https://mise.jdx.dev/) がインストールされていること

### 手順

1. このリポジトリを clone してください。
2. `mise install` を実行して、Node.js と pnpm をインストールしてください。
3. `mise exec -- pnpm install` を実行して、必要なパッケージをインストールしてください（lefthook の git フックも自動でセットアップされます）。
4. `.env.sample` ファイルを `.env` にリネームし、必要な情報を設定してください。
5. `mise exec -- pnpm start` を実行して、Bot を起動してください。

## 環境

- Node.js: `>=24.0.0`（mise で管理）
- pnpm: `>=10.0.0`（mise で管理）
- Discord.js: `14.25.1`
- Prisma: `7.1.0`

## データベース

このプロジェクトは SQLite データベースを使用しています。Prisma 7.x では `@prisma/adapter-better-sqlite3` ドライバーアダプターを使用しています。

- データベースファイル: `ikabu.sqlite3`（プロジェクトルート）
- Prisma 設定: `prisma.config.ts`

### データベース URL 設定

`DATABASE_URL` 環境変数を使用してデータベースの場所を指定できます。指定がない場合は、プロジェクトルートの `ikabu.sqlite3` が使用されます。

**DATABASE_URL の形式:**

- 相対パス: `file:./path/to/db.sqlite3`
- 絶対パス: `file:/absolute/path/to/db.sqlite3`

例: `.env` ファイルに以下のように設定します:

```
DATABASE_URL=file:./ikabu.sqlite3
```

## デプロイ

- 本番環境へのデプロイは、`main` ブランチへのマージ後、GitHub Actions によって自動的にデプロイされます。
- ステージング環境へのデプロイは、`stg` ブランチへのマージ後、GitHub Actions によって自動的にデプロイされます。

## 利用可能なスクリプト

コマンドは `mise exec -- pnpm run <script>` の形式で実行してください。mise が有効化されているシェルでは `pnpm run <script>` のみでも動作します。

### `pnpm start`

`.env` ファイルを読み込み、TypeScript をコンパイルして、サーバーを開始します。

### `pnpm run compile`

`prisma generate && tsc && prisma migrate deploy` を実行します。

### `pnpm run create-migrate`

`prisma migrate dev --create-only` を実行し、マイグレーションファイルを作成します。

### `pnpm run migrate-deploy`

`prisma migrate deploy` を実行し、マイグレーションを実行します。

### `pnpm run prisma-generate`

`prisma generate` を実行し、PrismaClient を自動生成します。

### `pnpm run lint`

`eslint` を実行して、コードを検証します。

### `pnpm run fix`

`eslint --fix` を実行して、コードを自動修正します。

### `pnpm test`

`vitest` を実行して、テストを実行します。

## git フック（lefthook）

push 時に自動で ESLint/Prettier が実行されます。自動修正が発生した場合は push が中断されるので、修正内容をコミットしてから再度 push してください。

セットアップする場合は以下を実行してください

```bash
lefthook install
```

## ライセンス

このプロジェクトは MIT ライセンスのもとで公開されます。詳細については、LICENSE ファイルを参照してください。
