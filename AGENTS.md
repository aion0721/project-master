# AGENTS.md

このファイルは、`H:\react\project-master` のフロントエンド作業ガイドです。

## 🚨 MUST RULES（最重要）

- 文字列は UTF-8 の通常文字で記述すること（\uXXXX 禁止）
- 文字化けした状態で編集しないこと（先に修正する）
- shellでファイルを扱う場合は Encoding を明示すること
- 全置換は禁止し、必ず最小差分で変更すること

## 概要

- 案件管理Webアプリのフロントエンド
- 技術スタックは React + TypeScript + Vite
- UI は CSS Modules で統一
- 現在はモックデータベースのMVP
- 将来的には `H:\react\project-master-backend` の API を利用する前提

## 開発コマンド

- 依存インストール: `yarn`
- 開発サーバー: `yarn dev`
- テスト: `yarn test`
- テスト一回実行: `yarn test:run`
- Lint: `yarn lint`
- ビルド: `yarn build`

作業完了前は最低でも `yarn lint`、`yarn test:run`、`yarn build` を通すこと。

## ディレクトリ構成

```text
src/
  components/   共通UI
  data/         モックデータ
  pages/        画面
  store/        Context と hooks
  test/         テストセットアップ
  types/        型定義
  utils/        表示用ユーティリティ
```

## 主要画面

- `/projects`
  - 案件一覧
- `/projects/:projectId`
  - 案件詳細
- `/cross-project`
  - 複数案件横断ビュー

ルーティングは `src/App.tsx` にある。

## 主要コンポーネント

- `Layout`
  - サイドバーと画面共通レイアウト
- `StatusBadge`
  - 状態バッジ
- `ProjectTable`
  - 案件一覧表
- `PhaseTimeline`
  - 週単位タイムライン
- `PhaseRow`
  - タイムライン1行
- `MemberTree`
  - PM、OS担当、上下関係のツリー表示

## データと状態管理

- 型定義は `src/types/project.ts` を基準にする
- モックデータは `src/data/mockData.ts` に置く
- 画面から直接モックを import せず、`useProjectData()` 経由で参照する
- 日付計算やフェーズ判定は `src/utils/projectUtils.ts` に寄せる
- `react-refresh/only-export-components` の都合があるため、Context と hook は必要に応じて分ける

## API移行方針

フロントは今後、バックエンドの以下エンドポイントに置き換える前提。

- `GET /health`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `GET /api/cross-project-weeks`

移行時の優先ルール:

1. まず API クライアント層を作る
2. `mockData` を直接消さず、差し替え可能な形にする
3. 画面はレスポンス整形済みデータを受け取る
4. フェーズ週計算をフロントとバックで二重管理しない

## 実装ルール

- 新規UIは CSS Modules を使う
- 情報密度は高くてよいが、可読性を優先する
- 状態色は既存のCSS変数を再利用する
- 同じロジックを複数画面に重複させない
- 業務アプリなので、装飾より比較しやすさを優先する
- PC表示を優先するが、崩れない最低限のレスポンシブは維持する

## 文字コード

- テキストファイルは `UTF-8` で統一する
- 新規作成・編集時は `UTF-8` で保存し、`Shift-JIS` や環境依存のコードページを使わない
- Windows 環境ではターミナルやスクリプトの既定エンコーディングで文字化けしやすいため、ファイル読み書き時は文字コードを明示して `UTF-8` を優先する
- 既存ファイルの文字コードが不明な場合は、内容確認なしに保存し直さず、現在のエンコーディングを確認してから扱う

## ファイルの読み取り書き込みについて

- 適用範囲: このファイルが置かれたフォルダ配下すべて。
- 文字コードは UTF-8 を必須とする。
- 日本語を `\uXXXX` 形式で出力しないこと。
- 文字化けした内容を見つけた場合、そのまま編集せず UTF-8 の正しい文字列として扱うこと。

### shell 利用ルール

- shell を使わずに済む場合は、エディタ上のファイル内容を優先して扱うこと。
- PowerShell でファイルを読む場合は、必ず Encoding を明示すること。
  - 例: `Get-Content -Raw -Encoding utf8 <FILE>`

- PowerShell でファイルを書く場合は、必ず UTF-8 を明示すること。
  - 例: `Set-Content -Encoding utf8`
  - 例: `Add-Content -Encoding utf8`
  - 例: `Out-File -Encoding utf8`

### PowerShell 5.1 実行ラッパ

- PowerShell 5.1 で日本語を含むコマンドを実行する場合は、以下のラッパを付けること。
- 形式（`<COMMAND>` を実コマンドに置換）:
  - `[Console]::InputEncoding=[Text.UTF8Encoding]::new($false); [Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); $OutputEncoding=[Text.UTF8Encoding]::new($false); chcp 65001 > $null; & { <COMMAND> }`

### 変更方針

- 全置換ではなく最小差分で変更すること。
- 文字コード問題がある場合は、先に文字列を UTF-8 として正常化し、その後にリファクタリングすること。

## テスト方針

- 表示ロジックより先に、週計算や現在フェーズ判定のような純関数を優先してテストする
- 画面テストでは `renderWithProviders` を使い、Router と Context 前提を吸収する
- 詳細画面、横断ビュー、一覧画面の主要見出しと代表データは落ちないように保つ

## 変更時の注意

- フェーズや週ロジックを変えたら `ProjectDetailPage` と `CrossProjectViewPage` を両方確認する
- モックデータを変えたら一覧、詳細、横断ビューの3画面を確認する
- バックエンド導入時はレスポンス型を先に定義してから画面差し替えを進める

## 今後の拡張候補

- API連携
- 検索、絞り込み、ソート
- 案件編集UI
- メンバー管理UI
- 権限管理
- E2Eテスト

## 判断優先順位

1. 型安全
2. 画面の見やすさ
3. コンポーネント責務の明確さ
4. API置き換えやすさ
5. 実装速度
