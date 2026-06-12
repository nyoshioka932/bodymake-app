# Claude Code向け実装指示書：BodyMake Tracker MVP

**バージョン：** 1.0  
**作成日：** 2026年6月11日  
**目的：** 要件定義書v2.0・設計書v2.0に基づき、Claude CodeでMVPを段階実装するための指示書。

---

## 1. 実装方針

このアプリは、体組成・摂取/PFC・消費カロリー・筋トレ・体型写真を管理し、直近7日間の週次PDCAと改善アクションを提示する個人向けフィットネスアプリである。

以下を厳守する。

1. Next.js + TypeScript + Supabase + Vercel前提で実装する
2. UIはshadcn/ui + Tailwind CSSを使用する
3. スマホ優先で設計する
4. Googleログインを実装する
5. 全ユーザーデータテーブルに `user_id` を持たせる
6. Supabase RLSを必ず設定する
7. サービスロールキーをブラウザへ置かない
8. カロリー収支は `摂取 - 補正後消費` に統一する
9. 欠損データを0扱いしない
10. 取込元ファイルは保存しない
11. 体型写真のみStorage利用を許可する
12. オフラインは閲覧のみ。オフライン入力・同期はMVP対象外
13. 最初から全機能を一括生成しない。フェーズ単位で実装する

---

## 2. 技術スタック

| 項目 | 採用 |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | shadcn/ui |
| Styling | Tailwind CSS |
| Auth | Supabase Auth / Googleログイン |
| DB | Supabase PostgreSQL |
| Storage | Supabase Storage。体型写真のみ |
| Hosting | Vercel |
| Charts | Recharts等、安定実装できるもの |
| PWA | next-pwa等、実装しやすい方式 |
| Development | Windows + VS Code + Claude Code |
| Source Control | GitHub |

---

## 3. MVP実装優先順位

ユーザー指定の優先順位は以下。

```text
認証/DB → データ取込 → ダッシュボード → 筋トレ → 週次サマリー → アラート
```

ただし、画面開発効率を上げるため、サンプルデータ投入と基本レイアウトは早期に実施する。

推奨フェーズは以下。

| Phase | 内容 | 完了条件 |
|---|---|---|
| 0 | プロジェクト初期化 | Next.js、shadcn/ui、Supabase接続、GitHub管理 |
| 1 | DB/Auth/RLS | Googleログイン、profiles、全主要テーブル、RLS |
| 2 | サンプルデータ | seedで画面確認用データ作成 |
| 3 | 基本UI/PWA | レイアウト、下部ナビ、ライト/ダーク、PWA基盤 |
| 4 | データ取込 | オムロンCSV、Fitbit CSV、Apple Health ZIPのプレビュー/保存 |
| 5 | ダッシュボード | KPI、体組成、カロリー、PFC、筋トレ概要 |
| 6 | 筋トレ/テンプレート | スマホ入力、テンプレート、前回値コピー、自動保存 |
| 7 | 週次サマリー | 体組成、食事、筋トレ、改善アクション |
| 8 | アラート | アラート画面、履歴、設定、ルールベース判定 |
| 9 | データ一覧/バックアップ/写真/ガイド | データ管理、エクスポート、写真、使い方ガイド |
| 10 | テスト/デプロイ | E2E確認、Vercelデプロイ、RLS確認 |

---

## 4. Phase 0：プロジェクト初期化

### 4.1 実施内容

- Next.js App Routerプロジェクトを作成
- TypeScript有効化
- Tailwind CSS設定
- shadcn/ui導入
- ESLint/Prettier設定
- Supabase client/server helper設定
- `.env.local.example` 作成
- GitHubリポジトリ初期化

### 4.2 環境変数

`.env.local.example` に以下を用意する。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

注意：`SUPABASE_SERVICE_ROLE_KEY` はサーバー側専用。ブラウザから参照されるコードでは使わない。

### 4.3 完了条件

- `npm run dev` で起動する
- トップページが表示される
- shadcn/uiのButton等が表示できる
- `.env.local.example` が存在する
- READMEに起動手順がある

---

## 5. Phase 1：DB/Auth/RLS

### 5.1 Supabaseプロジェクト設定

- Supabaseプロジェクトを作成
- Googleログインを有効化
- ローカルの環境変数にURLとanon keyを設定
- 必要に応じてOAuth redirect URLをVercel/localhostに設定

### 5.2 作成テーブル

最低限、以下をmigrationで作成する。

- profiles
- app_settings
- goals
- alert_settings
- body_compositions
- calorie_intakes
- calorie_burns
- exercises
- workout_templates
- workout_template_exercises
- workouts
- workout_sets
- body_photos
- import_logs
- import_errors
- alert_history

### 5.3 共通実装ルール

- 主キーはuuid
- user_idはauth.users.id参照
- created_at / updated_atを持たせる
- updated_at更新トリガーを作る
- RLSを有効化する
- 本人データのみCRUD可能にする

### 5.4 profiles

ログイン後、profilesがなければ作成する。

```text
id = auth.users.id
email = user.email
display_name = user_metadata.name等
is_admin = false
```

### 5.5 初期設定作成

初回ログイン時、以下を作成する。

- app_settings
- goals
- alert_settings
- 初期workout_templates

### 5.6 完了条件

- Googleログインできる
- ログイン後に自分のprofileが作成される
- RLSが有効
- 他user_idのデータを取得できない
- テーブル定義がmigrationとして保存されている

---

## 6. Phase 2：サンプルデータ

### 6.1 目的

取込機能が未完成でも、画面・グラフ・サマリーを検証できるようにする。

### 6.2 作成内容

- 体組成90日分
- 摂取/PFC90日分
- 消費90日分
- 筋トレ20セッション
- 胸/背中/肩/脚テンプレート
- アラート例
- 体型写真ダミーメタデータ

### 6.3 サンプル傾向

以下のような自然な傾向を持たせる。

- 体重は緩やかに減少
- 体脂肪量は緩やかに減少
- 骨格筋量は横ばい〜微増
- 摂取カロリーは日によってばらつく
- Fitbit消費は補正係数で調整される
- 筋トレ推定1RMは少しずつ伸びる

### 6.4 完了条件

- seed実行でデータが入る
- ダッシュボードに値が出せる
- 週次サマリーの計算に使える

---

## 7. Phase 3：基本UI / PWA

### 7.1 レイアウト

- AppShell作成
- Header作成
- BottomNavigation作成
- スマホ下部ナビ必須
- PCではサイドナビまたは上部ナビでもよい

### 7.2 ルート

以下のルートを作成する。

```text
/
/workout
/import
/weekly
/alerts
/data
/templates
/photos
/settings/goals
/settings/alerts
/guide
```

### 7.3 テーマ

- ライト/ダーク切替
- 初期はsystemでもよい

### 7.4 PWA

- app name: BodyMake Tracker
- manifest作成
- アイコン仮配置
- 主要画面のオフライン閲覧対応
- オフライン入力は実装しない

### 7.5 完了条件

- スマホ幅で破綻しない
- 下部ナビで主要画面を移動できる
- ライト/ダーク切替できる
- PWAとしてホーム画面追加できる

---

## 8. Phase 4：データ取込

### 8.1 共通仕様

- PCでは3カード表示
- スマホではウィザード形式
- 元ファイルは保存しない
- ファイル名とハッシュは保存する
- プレビュー後に確定保存する
- 取込モードは skip / overwrite
- 対象期間を指定可能にする

### 8.2 プレビュー表示項目

- 対象期間
- 取込予定件数
- 重複件数
- 上書き件数
- エラー件数
- サンプル数行

### 8.3 オムロンCSV

#### 取込項目

- 測定日時
- 体重
- 体脂肪率
- 体脂肪量
- 骨格筋率
- 骨格筋量
- 内臓脂肪
- 基礎代謝
- BMI
- 体年齢

#### 日次代表値

同一日の最も早い測定を `is_representative=true` にする。

### 8.4 Apple Health ZIP

#### 対象

あすけん由来の以下データのみ。

- 摂取カロリー
- タンパク質
- 脂質
- 炭水化物

#### 実装方針

- MVPでは大容量対策を過度に複雑化しない
- まず実データで解析可否を確認
- ブラウザ処理が厳しい場合のみNext.js Route Handlerに移す
- ZIP内の全期間を解析する
- 日単位に集計する

### 8.5 Fitbit CSV

#### 対象

- 消費カロリー
- 歩数
- アクティブ時間

#### 補正

```text
adjusted_calories_kcal = raw_calories_kcal × fitbit_calorie_factor
```

### 8.6 import_logs

必ず保存する。

- imported_at
- data_type
- file_name
- file_hash
- import_mode
- target_start_date
- target_end_date
- preview_json
- records_imported
- records_skipped
- records_overwritten
- records_error

### 8.7 完了条件

- 3データ種別を取り込める
- プレビューが表示される
- skip/overwriteが機能する
- import_logsが保存される
- エラー行と理由が表示される

---

## 9. Phase 5：ダッシュボード

### 9.1 表示項目

- KPIカード6枚以上
- 体重/体脂肪率/体脂肪量/骨格筋量の7日移動平均
- 当日値薄線 + 7日移動平均強調グラフ
- 直近7日カロリー収支
- PFC平均
- 筋トレ回数
- 部位別セット充足率
- アラート要約
- 改善アクション要約

### 9.2 計算

必ず以下を使う。

```text
net_calories = calorie_intakes.calories_kcal - calorie_burns.adjusted_calories_kcal
```

欠損日は0扱いしない。

### 9.3 完了条件

- サンプルデータでグラフが表示される
- 実データ取込後に表示が更新される
- スマホで読みやすい
- 7日移動平均が主表示になっている

---

## 10. Phase 6：筋トレ / テンプレート

### 10.1 テンプレート

初期テンプレート。

- 胸
- 背中
- 肩
- 脚

保存内容。

- 種目
- セット数
- 目標rep
- 目安重量
- 種目順

### 10.2 入力開始

- テンプレートから開始
- 前回メニューから開始
- 空セッションから開始

### 10.3 セット入力

- warmup / main
- weight_kg
- reps
- 前回値コピー
- テンキー風UI
- セットごとに自動保存
- 完了ボタンでstatus completed

### 10.4 成長表示

- 前回記録
- 直近3回
- PR
- 前回比差分
- 推定1RM
- 最大重量
- 最大rep
- 総ボリューム

### 10.5 完了条件

- スマホで片手入力しやすい
- セットごとに保存される
- 途中で画面を閉じてもデータが消えない
- 完了後、週次サマリーに反映される

---

## 11. Phase 7：週次サマリー

### 11.1 期間

任意の日を基準に直近7日を集計する。

### 11.2 表示順

1. 体組成
2. 食事
3. 筋トレ
4. 改善アクション

### 11.3 表示内容

- 平均体重
- 平均体脂肪率
- 体脂肪量変化
- 摂取カロリー平均
- PFC平均
- 筋トレ回数
- 部位別セット数
- 種目別成長
- 次週改善アクション

### 11.4 改善アクション

MVPではルールベース。

例：

```text
直近7日のカロリー収支が目標より高めです。脂質を1日あたり-10g、または摂取カロリーを-150kcal調整してください。
```

```text
肩の有効セット数が目標より3セット不足しています。次回の肩トレでサイドレイズを+3セット追加してください。
```

### 11.5 完了条件

- 直近7日のサマリーが表示される
- 改善アクションが表示される
- アラート設定値を参照して判定できる

---

## 12. Phase 8：アラート

### 12.1 対象

- カロリー収支
- 脂質過多
- 体重7日平均増加
- 体脂肪量停滞
- タンパク質不足
- 胸/背中/肩セット数不足

### 12.2 アラート画面

- 現在発生中のアラート
- 過去履歴
- 改善アクション
- 設定画面への導線

### 12.3 設定画面

設定可能にする項目。

- 体重増加閾値
- 体脂肪量停滞日数
- 体脂肪量停滞幅
- カロリー収支閾値
- タンパク質不足日数
- 胸/背中/肩の週間セット目標

### 12.4 完了条件

- アラートがルールベースで出る
- アラート履歴が見られる
- 改善アクションが表示される
- 設定変更が反映される

---

## 13. Phase 9：データ一覧 / バックアップ / 写真 / ガイド

### 13.1 データ一覧

対象。

- 体組成
- 摂取/PFC
- 消費
- 筋トレ
- 取込ログ

機能。

- 日付範囲フィルタ
- データ種別フィルタ
- 筋トレ種目フィルタ
- 閲覧
- 削除
- 再取込導線
- 筋トレのみ直接編集

### 13.2 削除

- 1レコード
- 日付単位
- 期間指定
- データ種別 + 期間指定

MVPでは確認ダイアログのみでよい。

### 13.3 エクスポート

形式。

- CSV一式
- JSON一式
- 取込ログ

導線。

- 設定画面
- データ一覧画面

### 13.4 復元

できればMVP対応。難しければ後回し。

### 13.5 体型写真

- 写真アップロード
- 撮影日
- photo_type: front / side / back / other
- 一覧表示
- user_id単位でStorageアクセス制御

### 13.6 使い方ガイド

必須で作成する。

最低限の章。

1. 初期設定
2. Googleログイン
3. データ取込
4. 再取込ルール
5. 筋トレ記録
6. 週次サマリー
7. アラート
8. バックアップ

---

## 14. Phase 10：テスト / デプロイ

### 14.1 テスト観点

#### 認証・セキュリティ

- 未ログイン時に保護画面へ入れない
- ログイン後に自分のデータだけ見える
- RLSで他user_idのデータを読めない
- エクスポート対象が本人データだけ

#### データ取込

- オムロンCSVが取り込める
- Apple Health ZIPが取り込める
- Fitbit CSVが取り込める
- skipが効く
- overwriteが効く
- import_logsが残る
- エラー行が表示される

#### 計算

- カロリー収支が `摂取 - 補正後消費`
- 7日移動平均が正しい
- 欠損日が0扱いされない
- 推定1RMが正しい
- 有効セットがmainのみ

#### UI

- スマホで下部ナビが使える
- 筋トレ入力がスマホで使いやすい
- ライト/ダーク切替が効く
- PWAでホーム画面追加できる

### 14.2 デプロイ

- GitHub連携でVercelデプロイ
- Vercel環境変数を設定
- Supabaseのredirect URLを本番URLに設定
- RLSを本番で有効にする

### 14.3 完了条件

- 本番URLでGoogleログインできる
- サンプルデータが表示される
- 実データを取り込める
- スマホから筋トレ入力できる
- 週次サマリー・アラートが表示される

---

## 15. Claude Codeへの作業依頼テンプレート

### 15.1 Phase単位で依頼する原則

一度に全アプリを作らせず、必ず以下のように分けて依頼する。

```text
今回はPhase Xのみ実装してください。
既存の要件定義書、設計書、実装指示書に従ってください。
既存コードを壊さず、完了後に動作確認手順を提示してください。
```

### 15.2 Phase 0依頼例

```text
BodyMake TrackerのMVPを開発します。
まずPhase 0として、Next.js App Router + TypeScript + Tailwind + shadcn/uiの初期プロジェクトを作成してください。
Supabase接続のためのlib構成と.env.local.exampleも作成してください。
まだDBテーブルや画面機能は作らず、トップページ、基本レイアウト、README、起動手順までを完了してください。
```

### 15.3 Phase 1依頼例

```text
Phase 1として、Supabase Auth、Googleログイン、DB migration、RLSを実装してください。
対象テーブルは設計書のDB設計に従ってください。
全ユーザーデータテーブルにuser_idを持たせ、本人データのみCRUD可能なRLSを設定してください。
ログイン後にprofiles、app_settings、goals、alert_settingsを初期作成してください。
```

### 15.4 Phase 4依頼例

```text
Phase 4として、データ取込機能を実装してください。
対象はオムロンCSV、Apple Health ZIP、Fitbit CSVです。
元ファイルは保存せず、ファイル名とハッシュをimport_logsに保存してください。
取込前プレビューでは対象期間、取込予定件数、重複件数、上書き件数、エラー件数、サンプル数行を表示してください。
取込モードはskip/overwriteを選択できるようにしてください。
```

---

## 16. 実装時の禁止事項

- カロリー収支を `消費 - 摂取` で実装しない
- 欠損データを0として計算しない
- 認証なしで本番デプロイしない
- RLSなしで本番デプロイしない
- サービスロールキーをクライアントに置かない
- 取込元ファイルを無断でStorageに保存しない
- 体型写真をpublic bucketに置かない
- 筋トレ入力を最後の保存ボタンだけに依存させない
- 一括で全機能を生成しようとしない

---

## 17. 受け入れ基準チェックリスト

### 必須

- [ ] Googleログインできる
- [ ] RLSが有効で本人データのみ見える
- [ ] サンプルデータが入る
- [ ] オムロンCSVが取り込める
- [ ] Apple Health ZIPが取り込める
- [ ] Fitbit CSVが取り込める
- [ ] Fitbit補正係数が反映される
- [ ] ダッシュボードで7日移動平均が表示される
- [ ] カロリー収支が `摂取 - 補正後消費` で表示される
- [ ] スマホで筋トレ記録を入力できる
- [ ] テンプレートから筋トレを開始できる
- [ ] セットごとに自動保存される
- [ ] 週次サマリーが見られる
- [ ] アラートと改善アクションが出る
- [ ] データ一覧で閲覧・削除・再取込導線が使える
- [ ] CSV + JSON + 取込ログをエクスポートできる
- [ ] 体型写真をアップロードできる
- [ ] 使い方ガイドがある
- [ ] PWAとしてホーム画面追加できる
- [ ] オフライン時に主要画面を閲覧できる

### できればMVP

- [ ] バックアップJSONから復元できる
- [ ] Apple Health ZIPの実データサイズで問題なく処理できる
- [ ] 体型写真を日付比較できる

---

## 18. 最重要リスク

ユーザーが最も失敗したくない点は、**週次サマリー/改善アクションの納得感**である。

したがって、実装では以下を重視する。

1. 週次サマリーの数値根拠を明示する
2. 改善アクションは曖昧にしない
3. 食事アクションは数値で出す
4. 筋トレアクションは追加セット数で出す
5. アラート判定条件を設定画面で変更可能にする
6. ダッシュボードだけでなく、週次サマリー画面で判断できる構成にする

---

## 19. 次回以降の推奨作業

1. この3点セットをClaude Codeのプロジェクトに配置する
2. Phase 0から実装開始する
3. 実データのサンプルCSV/ZIPを1つずつ用意する
4. Phase 4の取込実装前に、実ファイルの列名・sourceNameを確認する
5. PhaseごとにGit commitする
6. 各Phase完了時に、要件との差分をチェックする
