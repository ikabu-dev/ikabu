import fs from 'node:fs';
import path from 'node:path';

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const featureDirs = fs
    .readdirSync(path.resolve(import.meta.dirname, 'src/features'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

export default tseslint.config(
    {
        ignores: ['build/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierRecommended,
    {
        plugins: {
            import: importPlugin,
            'unused-imports': unusedImports,
        },
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        '*.js',
                        '*.mjs',
                        'eslint.config.mjs',
                        'prisma.config.ts',
                        'vitest.config.ts',
                        'test/*.ts',
                        'test/config/constants/*.ts',
                        'test/gateway/*.ts',
                        'test/infra/db/*.ts',
                        'test/infra/external/splatoon3-ink/*.ts',
                        'test/infra/logging/*.ts',
                        'test/jobs/*.ts',
                        'test/registry/*.ts',
                        'test/shared/*.ts',
                        'test/shared/datetime/*.ts',
                        'test/shared/discord_helpers/*.ts',
                    ],
                    defaultProject: './tsconfig.eslint.json',
                    maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 40,
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
            'import/resolver': {
                typescript: {},
                node: {
                    extensions: ['.js', '.ts'],
                    paths: ['src'],
                },
            },
        },
        rules: {
            'no-irregular-whitespace': 'off',
            'unused-imports/no-unused-imports': 'warn',
            'import/order': [
                'warn',
                {
                    groups: [
                        'builtin', // 組み込みモジュール
                        'external', // npmでインストールした外部ライブラリ
                        'internal', // 自作モジュール
                        ['parent', 'sibling'],
                        'object',
                        'type',
                        'index',
                    ],
                    'newlines-between': 'always', // グループ毎にで改行を入れる
                    pathGroupsExcludedImportTypes: ['builtin'],
                    alphabetize: {
                        order: 'asc', // 昇順にソート
                        caseInsensitive: true, // 小文字大文字を区別する
                    },
                },
            ],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'prettier/prettier': 'warn',

            // typescript-eslint v8 の `recommended` は v5 と収録ルールが異なるため、
            // 旧 .eslintrc.js（@typescript-eslint/recommended v5 相当）と同等の挙動になるよう調整する。
            // v8 recommended で新たに error 化されたが、旧設定では warn だったもの
            'no-unused-vars': 'off',
            // v8 では caughtErrors のデフォルトが 'none' → 'all' に変更されたため、
            // 旧設定（v5 のデフォルト）と同じ挙動になるよう明示的に 'none' を指定する
            '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
            // v8 recommended で新たに追加されたが、旧設定には存在しなかったもの（旧同等 = off）
            'no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            // v8 では stylistic 側に移動し recommended から外れたが、旧設定では recommended 収録だったもの
            '@typescript-eslint/adjacent-overload-signatures': 'error',
            'no-empty-function': 'off',
            '@typescript-eslint/no-empty-function': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            // v8 では recommended/stylistic のいずれからも外れたが、旧設定では warn だったもの
            '@typescript-eslint/no-non-null-assertion': 'warn',
            // v8 recommended に含まれる no-require-imports は、旧 no-var-requires より
            // 検出範囲が広い（bare な `require(...)` 式文も検出する）別ルールのため、
            // 旧設定と同等の挙動を保つには非推奨のまま残っている no-var-requires を使う
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-var-requires': 'error',

            'import/no-restricted-paths': [
                'error',
                {
                    zones: [
                        // infra/ → features/, gateway/, registry/, jobs/
                        {
                            target: './src/infra/**/*',
                            from: './src/features/**/*',
                            message:
                                'infra/ から features/ を import できません。依存方向: features → infra',
                        },
                        {
                            target: './src/infra/**/*',
                            from: './src/gateway/**/*',
                            message: 'infra/ から gateway/ を import できません',
                        },
                        {
                            target: './src/infra/**/*',
                            from: './src/registry/**/*',
                            message: 'infra/ から registry/ を import できません',
                        },
                        {
                            target: './src/infra/**/*',
                            from: './src/jobs/**/*',
                            message: 'infra/ から jobs/ を import できません',
                        },
                        // features/ → gateway/, registry/, jobs/
                        {
                            target: './src/features/**/*',
                            from: './src/gateway/**/*',
                            message:
                                'features/ から gateway/ を import できません。機能が「呼ばれ方」を知ってはいけません',
                        },
                        {
                            target: './src/features/**/*',
                            from: './src/registry/**/*',
                            message: 'features/ から registry/ を import できません',
                        },
                        {
                            target: './src/features/**/*',
                            from: './src/jobs/**/*',
                            message: 'features/ から jobs/ を import できません',
                        },
                        // shared/ → features/
                        {
                            target: './src/shared/**/*',
                            from: './src/features/**/*',
                            message:
                                'shared/ から features/ を import できません。共有部品が特定機能に依存してはいけません',
                        },
                        // config/ → 上位すべて
                        {
                            target: './src/config/**/*',
                            from: './src/features/**/*',
                            message:
                                'config/ から features/ を import できません。設定は葉であるべきです',
                        },
                        {
                            target: './src/config/**/*',
                            from: './src/infra/**/*',
                            message:
                                'config/ から infra/ を import できません。設定は葉であるべきです',
                        },
                        {
                            target: './src/config/**/*',
                            from: './src/gateway/**/*',
                            message:
                                'config/ から gateway/ を import できません。設定は葉であるべきです',
                        },
                        {
                            target: './src/config/**/*',
                            from: './src/registry/**/*',
                            message:
                                'config/ から registry/ を import できません。設定は葉であるべきです',
                        },
                        {
                            target: './src/config/**/*',
                            from: './src/jobs/**/*',
                            message:
                                'config/ から jobs/ を import できません。設定は葉であるべきです',
                        },
                        {
                            target: './src/config/**/*',
                            from: './src/shared/**/*',
                            message:
                                'config/ から shared/ を import できません。設定は葉であるべきです',
                        },
                        // feature 間の直接参照を全面禁止
                        ...featureDirs.map((name) => ({
                            target: `./src/features/${name}/**/*`,
                            from: './src/features',
                            except: [`./${name}`],
                            message: `features/${name}/ から他の feature を直接 import できません。共有が必要なら shared/ に上げてください`,
                        })),
                    ],
                },
            ],
        },
    },
);
