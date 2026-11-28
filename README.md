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

## ディレクトリ構成

```
src/
  gateway/         # Discord イベント受信・ルーティング（ボタン・コマンド・メッセージ等のハンドラ）
  registry/        # コマンド定義の集約・Discord への登録
  jobs/            # 定期実行ジョブ（ステージ情報の定期取得等）
  features/        # 機能別モジュール（リクルート、VC、おみくじ等 29 機能）
  infra/           # インフラ層（DB・外部 API・ログ・HTTP サーバー）
  shared/          # 機能横断の共有ユーティリティ（アサーション・日時計算・Discord ヘルパー等）
  config/          # 環境変数・定数・設定値
  server.ts        # エントリポイント
prisma/            # Prisma スキーマ・マイグレーション
config/            # アプリ設定 (node-config)
images/            # Bot が生成する画像の素材
test/              # テスト（src/ のミラー構造）
```

依存方向は一方通行で、ESLint で強制されています:

```
gateway / registry / jobs  →  features  →  infra / shared / config
```

### コマンドの追加方法

1. `src/features/<機能名>/` にコマンドファイル（例: `my_command.ts`）を作成し、`GuildChatInputCommand` または `GlobalChatInputCommand` インターフェースを実装する
2. `src/registry/command_registry.ts` の `commandModules` 配列にインポートを追加する

## git フック（lefthook）

push 時に自動で ESLint/Prettier が実行されます。自動修正が発生した場合は push が中断されるので、修正内容をコミットしてから再度 push してください。

セットアップする場合は以下を実行してください

```bash
lefthook install
```

## クレジット

募集画像の絵文字と VC のアイコンには、[Twemoji](https://github.com/jdecked/twemoji) の画像を使っています。Twemoji の画像は Twitter, Inc and other contributors によるもので、[CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) のもとで公開されています。画像は npm パッケージ [@twemoji/svg](https://github.com/boywithkeyboard/twemoji_svg) から読み込みます。

VC のアイコン (`images/recruit/vc_icon.svg`) は、Twemoji の 🔊 (U+1F50A) から一番外側の音の波を除き、色を白に変えたものです。

## ライセンス

このプロジェクトは MIT ライセンスのもとで公開されます。詳細については、LICENSE ファイルを参照してください。

### プロフィール

`/プロフィール`（従来の `/イカ部歴` でも利用可能）で、自分の入部日、在籍期間、フレンドコード、チャット数、好きなブキ、ロールバッジを画像で表示します。
フレンドコードは `/friend_code add`、好きなブキは `/プロフィール設定 ブキ` の名前欄で検索し、候補から選んで登録します。
自由入力は登録できません。ひらがなでも検索でき、保存時に正式なブキ名へ変換します。
ブキ一覧はstat.inkから取得してDBにキャッシュし、起動時に読み込みます。24時間経過後の利用時に自動更新するため、新ブキ追加時のコード修正は不要です。取得失敗時は保存済みの一覧を使います。初回取得に失敗した場合は候補を表示できないため、しばらく待って再試行してください。
ブキの登録解除には `/プロフィール設定 ブキ解除` を使います。設定結果は本人にだけ表示されます。

管理者は `/固有ロール設定 登録` の設定項目「サポーター」に対象ロールを割り当てると、そのロールを持つメンバーに金色の枠と専用バッジを表示できます。
ロールバッジはDiscordのロール順（サポーターを先頭）で最大6個を表示し、残りは件数を表示します。

チャット数はBotが記録した全サーバーの合計です。今回の変更以前に集計から欠落した投稿数は復元しません。
デプロイ時は通常のコンパイル処理に含まれるマイグレーションを適用してください。ブキの保存用に `profile` テーブルを追加します。
