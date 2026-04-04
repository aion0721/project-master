# AGENTS.md

このファイルは、このリポジトリで作業する開発者やコーディングエージェント向けの作業ガイドです。

## プロジェクト概要

- 案件管理WebアプリのフロントエンドMVP
- 技術スタックは React + TypeScript + Vite
- バックエンドは未実装
- データは現在モックのみ
- 業務向けの見やすさ、高密度UI、案件進捗の可視化を重視

## 開発コマンド

- 依存インストール: `yarn`
- 開発サーバー: `yarn dev`
- 本番ビルド: `yarn build`
- Lint: `yarn lint`

作業完了前は最低でも `yarn lint` と `yarn build` を通すこと。

## ディレクトリ構成

```text
src/
  components/   共通UIコンポーネント
  data/         モックデータ
  pages/        画面コンポーネント
  store/        Context と hooks
  types/        型定義
  utils/        表示用ユーティリティ
```

## 現在の画面

- `/projects`
  - 案件一覧画面
- `/projects/:projectId`
  - 案件詳細画面
- `/cross-project`
  - 複数案件横断ビュー

ルーティング定義は `src/App.tsx` にある。

## 主要コンポーネント

- `Layout`
  - 全画面共通のサイドバーとレイアウト
- `StatusBadge`
  - 案件/フェーズ状態の色付き表示
- `ProjectTable`
  - 案件一覧テーブル
- `PhaseTimeline`
  - 案件詳細の簡易ガントUI
- `PhaseRow`
  - タイムライン1行分
- `MemberTree`
  - PM、OS、役割、上下関係をツリー表示

## データ方針

- 型定義は `src/types/project.ts` を基準にする
- モックデータは `src/data/mockData.ts` に集約する
- 画面で直接モックを import せず、`useProjectData()` 経由で参照する
- 日付変換、週ラベル生成、担当者名解決などは `src/utils/projectUtils.ts` に寄せる

## 実装ルール

- 新規UIは基本的に CSS Modules で実装する
- 業務アプリ前提なので、装飾より可読性と情報の比較しやすさを優先する
- 状態色は既存のCSS変数を流用する
  - `完了`
  - `進行中`
  - `未着手`
  - `遅延`
- 同じ責務のロジックを複数画面に重複させない
- データ取得は将来 API に置き換えやすい形を意識する

## UI方針

- PC表示優先
- テーブル、カード、タイムラインの情報密度は高めでよい
- ただし1画面に情報を詰め込みすぎず、セクション単位で区切る
- 状態、フェーズ、役割は一目で区別できること
- 横断ビューでは「どの週が重いか」を見つけやすくすること

## 変更時の注意

- 既存のモックデータを更新する場合、一覧、詳細、横断ビューの見え方が崩れないか確認する
- フェーズ週の計算を変更した場合、`ProjectDetailPage` と `CrossProjectViewPage` の両方を確認する
- `react-refresh/only-export-components` のLintルールが有効なので、Context と hook は必要に応じてファイル分割する

## 今後の拡張候補

- API連携
- 検索、絞り込み、ソート
- 案件編集UI
- メンバー管理UI
- テスト追加
- 権限管理

## 迷ったときの優先順位

1. 型安全
2. 画面の見やすさ
3. コンポーネント責務の明確さ
4. 将来のAPI置き換えやすさ
5. 実装速度
