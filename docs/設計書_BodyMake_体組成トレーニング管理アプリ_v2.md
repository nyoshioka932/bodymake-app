# 設計書：BodyMake 体組成・トレーニング管理アプリ

**バージョン：** 2.0  
**更新日：** 2026年6月11日  
**対象：** Next.js / Supabase / Vercel 前提のMVP設計

---

## 1. システム構成

### 1.1 全体アーキテクチャ

```text
┌─────────────────────────────────────────────┐
│ スマホ / PCブラウザ                           │
│ Next.js + PWA + shadcn/ui + Tailwind          │
└───────────────────┬─────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────┐
│ Vercel                                         │
│ Next.js App Router                             │
│ Server Components / Route Handlers             │
└───────────────────┬─────────────────────────┘
                    │ Supabase Client / Server SDK
┌───────────────────▼─────────────────────────┐
│ Supabase                                      │
│ Auth / PostgreSQL / RLS / Storage              │
└─────────────────────────────────────────────┘
```

### 1.2 基本方針

| 項目 | 方針 |
|---|---|
| アプリ | Next.js + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| 認証 | Googleログイン |
| DB | Supabase PostgreSQL |
| ファイル保存 | 取込元ファイルは保存しない。体型写真のみStorage利用 |
| セキュリティ | 全テーブル user_id + RLS |
| ホスティング | Vercel |
| PWA | 主要画面のオフライン閲覧対応 |
| オフライン入力 | MVP対象外 |
| デザイン | フィットネスアプリ風。ライト/ダーク切替 |

---

## 2. 画面設計

## 2.1 画面一覧

| ID | 画面 | URL | 概要 | 下部ナビ |
|---|---|---|---|---:|
| SCR-01 | ダッシュボード | `/` | 直近7日進捗、目標進捗、次アクション | ○ |
| SCR-02 | 筋トレ記録 | `/workout` | スマホ最適化された筋トレ入力 | ○ |
| SCR-03 | データ取込 | `/import` | 各種ファイル取込 | ○ |
| SCR-04 | 週次サマリー | `/weekly` | 直近7日の振り返り | ○ |
| SCR-05 | アラート | `/alerts` | アラート一覧・履歴・改善アクション | ○ |
| SCR-06 | データ一覧 | `/data` | データ閲覧・削除・再取込・エクスポート | ○ |
| SCR-07 | テンプレート管理 | `/templates` | 筋トレテンプレート管理 | - |
| SCR-08 | 体型写真 | `/photos` | 写真記録・一覧 | - |
| SCR-09 | 目標設定 | `/settings/goals` | 目標値・PFC・週次目標 | - |
| SCR-10 | アラート設定 | `/settings/alerts` | アラート閾値設定 | - |
| SCR-11 | 使い方ガイド | `/guide` | 操作説明 | - |

### 2.2 下部ナビゲーション

スマホでは下部ナビを必須とする。

| ラベル | URL | アイコン例 |
|---|---|---|
| ホーム | `/` | Home |
| 筋トレ | `/workout` | Dumbbell |
| 取込 | `/import` | Upload |
| アラート | `/alerts` | Bell |
| 設定 | `/settings/goals` | Settings |

---

## 3. SCR-01 ダッシュボード

### 3.1 目的

直近7日進捗、目標進捗、次アクションを1画面で確認する。

### 3.2 表示構成

```text
[ヘッダー]
  BodyMake Tracker / 日付選択 / ライト・ダーク切替

[KPIカード群]
  体重7日平均 / 体脂肪率7日平均 / 体脂肪量変化 / 骨格筋量 / 7日カロリー収支 / 筋トレ回数 / セット充足率

[体組成トレンド]
  当日値薄線 + 7日移動平均強調

[直近7日サマリー]
  摂取平均 / PFC / 筋トレ回数 / 部位別セット数

[アラート要約]
  発生中の重要アラート上位3件

[改善アクション要約]
  食事アクション / 筋トレアクション

[詳細グラフ]
  体組成 / カロリー / PFC / 種目別成長
```

### 3.3 KPIカード

スマホでは横スクロールまたは2列カード表示にする。

| KPI | 計算 |
|---|---|
| 体重7日平均 | 代表値の直近7日平均 |
| 体脂肪率7日平均 | 代表値の直近7日平均 |
| 体脂肪量変化 | 直近7日平均 - 前7日平均 |
| 骨格筋量 | 直近7日平均 |
| 7日カロリー収支 | 摂取 - 補正後消費の7日累計 |
| 筋トレ回数 | 直近7日のcompleted workout数 |
| セット充足率 | 胸/背中/肩の実績セット数 ÷ 目標セット数 |

---

## 4. SCR-02 筋トレ記録

### 4.1 開始導線

以下3パターンを提供する。

1. テンプレートから開始
2. 前回メニューから開始
3. 空セッションから開始

### 4.2 入力画面構成

```text
[セッションヘッダー]
  日付 / 分割種別 / メモ / 完了ボタン

[種目カード一覧]
  種目名 / 主働筋 / 前回 / 直近3回 / PR / 前回比

[セット入力]
  set_type: warmup or main
  weight_kg
  reps
  前回値コピー
  テンキー風入力

[自動保存]
  セット入力ごとに保存
  最後に「完了」ステータスへ変更
```

### 4.3 保存仕様

| 操作 | DB更新 |
|---|---|
| セッション開始 | workoutsにstatus=`in_progress`で作成 |
| セット追加 | workout_setsに即時保存 |
| セット編集 | workout_sets更新 |
| 完了 | workouts.status=`completed`、completed_atを設定 |
| 破棄 | セッション削除またはstatus=`discarded` |

---

## 5. SCR-03 データ取込

### 5.1 PC / スマホのUI切替

| 端末 | UI |
|---|---|
| PC | オムロン / Apple Health / Fitbit の3カードを並べる |
| スマホ | ウィザード形式 |

### 5.2 ウィザード

```text
Step 1: データ種別選択
Step 2: ファイル選択
Step 3: 解析・プレビュー
Step 4: 取込モード選択：スキップ / 上書き
Step 5: 対象期間指定
Step 6: 取込実行
Step 7: 結果表示
```

### 5.3 取込処理方針

- Claude Codeが実装しやすい方式を優先する
- MVPでは大容量対策を過度に複雑化しない
- 元ファイルは保存しない
- プレビュー後、確定時にDBへ保存する
- 一時テーブルはMVPでは使わない
- サービスロールキーをブラウザに置かない

推奨初期実装は以下。

| ファイル | 初期実装 |
|---|---|
| オムロンCSV | ブラウザ側で解析し、プレビュー後Supabaseへ保存 |
| Fitbit CSV | ブラウザ側で解析し、プレビュー後Supabaseへ保存 |
| Apple Health ZIP | まず実データで検証。ブラウザ解析が厳しければRoute Handlerへ移行 |

---

## 6. SCR-04 週次サマリー

### 6.1 期間

任意の日を基準日とし、直近7日間のローリング集計を行う。

```text
対象期間 = 基準日を含む直近7日間
```

### 6.2 表示順

1. 体組成
2. 食事
3. 筋トレ
4. 改善アクション

### 6.3 表示項目

| セクション | 項目 |
|---|---|
| 体組成 | 平均体重、平均体脂肪率、体脂肪量変化 |
| 食事 | 摂取カロリー平均、PFC平均、タンパク質達成率、脂質状況 |
| 筋トレ | 筋トレ回数、部位別セット数、種目別成長 |
| 改善アクション | 食事アクション、筋トレアクション |

---

## 7. SCR-05 アラート

### 7.1 表示内容

- 現在発生中のアラート
- 過去のアラート履歴
- アラートごとの改善アクション
- アラート設定への導線

### 7.2 アラート種別

| type | 内容 |
|---|---|
| calorie_surplus | カロリー収支が目標未達または余剰 |
| fat_excess | 摂取カロリー超過時の脂質過多 |
| weight_gain | 体重7日平均増加 |
| fat_mass_stagnation | 体脂肪量停滞 |
| protein_shortage | タンパク質未達が3日以上 |
| set_shortage | 胸/背中/肩のセット数不足 |

---

## 8. SCR-06 データ一覧

### 8.1 対象データ

- 体組成
- 摂取カロリー/PFC
- 消費カロリー
- 筋トレ記録
- 取込ログ

### 8.2 操作

| 操作 | 対応 |
|---|---|
| 閲覧 | 全データ種別 |
| 削除 | 体組成、摂取、消費、筋トレ |
| 直接編集 | 筋トレ記録のみ |
| 再取込導線 | 体組成、摂取、消費 |
| エクスポート | CSV + JSON + 取込ログ |

### 8.3 フィルタ

- 日付範囲
- データ種別
- 筋トレ種目

---

## 9. SCR-07 テンプレート管理

### 9.1 初期テンプレート

- 胸
- 背中
- 肩
- 脚

### 9.2 保存内容

- テンプレート名
- 分割種別
- 種目
- セット数
- 目標rep
- 目安重量
- 種目順

---

## 10. SCR-08 体型写真

### 10.1 目的

体脂肪率や体重だけでなく、見た目の変化を補助的に確認する。

### 10.2 機能

- 写真アップロード
- 撮影日設定
- 正面/側面/背面などの種別管理
- 一覧表示
- 日付比較は将来拡張でもよい

### 10.3 保存

Supabase Storageを利用する場合、パスは以下のようにする。

```text
body-photos/{user_id}/{photo_id}.jpg
```

DBにはstorage_pathとメタデータを保存する。

---

## 11. DB設計

## 11.1 共通方針

- 全ユーザーデータテーブルに `user_id` を持たせる
- `user_id` は auth.users.id を参照する
- RLSを有効化する
- `created_at`、`updated_at` を原則持たせる
- 取込元ファイルは保存しない

## 11.2 テーブル一覧

| テーブル | 用途 |
|---|---|
| profiles | ユーザープロファイル |
| app_settings | アプリ設定、Fitbit補正係数等 |
| goals | 目標設定 |
| alert_settings | アラート閾値 |
| body_compositions | 体組成データ |
| calorie_intakes | 摂取カロリー/PFC |
| calorie_burns | 消費カロリー |
| exercises | 種目マスタ |
| workout_templates | テンプレート |
| workout_template_exercises | テンプレート種目 |
| workouts | 筋トレセッション |
| workout_sets | 筋トレセット |
| body_photos | 体型写真メタデータ |
| import_logs | 取込ログ |
| import_errors | 取込エラー詳細 |
| alert_history | アラート履歴 |

---

## 11.3 profiles

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | auth.users.idと一致 |
| email | text | メールアドレス |
| display_name | text | 表示名 |
| is_admin | boolean | 将来用adminフラグ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

## 11.4 app_settings

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| fitbit_calorie_factor | numeric | Fitbit補正係数。初期値1.00 |
| fat_kcal_per_kg | integer | 脂肪1kg換算kcal。初期値7700 |
| theme | text | light / dark / system |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

## 11.5 goals

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| target_body_fat_pct | numeric | 目標体脂肪率 |
| target_muscle_kg | numeric | 目標骨格筋量 |
| weekly_weight_loss_target_kg | numeric | 週あたり減量ペース |
| weekly_fat_loss_target_kg | numeric | 週あたり体脂肪減少量 |
| calorie_target_kcal | integer | 摂取カロリー目標 |
| protein_g | numeric | タンパク質固定g目標 |
| protein_g_per_kg | numeric | 体重1kgあたりタンパク質目標 |
| fat_g | numeric | 脂質g目標 |
| carbs_g | numeric | 炭水化物g目標 |
| protein_pct | numeric | タンパク質比率 |
| fat_pct | numeric | 脂質比率 |
| carbs_pct | numeric | 炭水化物比率 |
| target_date | date | 達成期限 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

## 11.6 alert_settings

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| weight_gain_threshold_kg | numeric | 体重増加閾値 |
| fat_mass_stagnation_days | integer | 体脂肪量停滞判定日数 |
| fat_mass_stagnation_threshold_kg | numeric | 横ばい判定幅 |
| calorie_balance_threshold_kcal | integer | カロリー収支閾値 |
| protein_shortage_days | integer | タンパク質不足日数。初期値3 |
| chest_weekly_sets_target | integer | 胸週間セット目標 |
| back_weekly_sets_target | integer | 背中週間セット目標 |
| shoulder_weekly_sets_target | integer | 肩週間セット目標 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

## 11.7 body_compositions

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| measured_at | timestamptz | 測定日時 |
| date | date | 測定日 |
| is_representative | boolean | 日次代表値 |
| weight_kg | numeric | 体重 |
| body_fat_pct | numeric | 体脂肪率 |
| body_fat_kg | numeric | 体脂肪量 |
| muscle_pct | numeric | 骨格筋率 |
| muscle_kg | numeric | 骨格筋量 |
| visceral_fat | numeric | 内臓脂肪レベル |
| bmr_kcal | integer | 基礎代謝 |
| bmi | numeric | BMI |
| body_age | integer | 体年齢 |
| source | text | omron |
| import_log_id | uuid | 取込ログID |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

推奨ユニーク制約：`user_id, measured_at, source`

---

## 11.8 calorie_intakes

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| date | date | 日付 |
| calories_kcal | numeric | 摂取カロリー |
| protein_g | numeric | タンパク質 |
| fat_g | numeric | 脂質 |
| carbs_g | numeric | 炭水化物 |
| source | text | askend / apple_health等 |
| import_log_id | uuid | 取込ログID |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

推奨ユニーク制約：`user_id, date, source`

---

## 11.9 calorie_burns

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| date | date | 日付 |
| raw_calories_kcal | numeric | Fitbit元消費カロリー |
| calorie_factor | numeric | 補正係数 |
| adjusted_calories_kcal | numeric | 補正後消費カロリー |
| steps | integer | 歩数 |
| active_minutes | integer | アクティブ時間 |
| source | text | fitbit |
| import_log_id | uuid | 取込ログID |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

推奨ユニーク制約：`user_id, date, source`

---

## 11.10 exercises

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid nullable | nullなら共通プリセット、自分用ならuser_id |
| name | text | 種目名 |
| primary_muscle_group | text | chest / back / shoulder / legs |
| is_preset | boolean | プリセット種目か |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

初期プリセット例：

| 種目 | 主働筋 |
|---|---|
| ベンチプレス | chest |
| インクラインベンチプレス | chest |
| ダンベルフライ | chest |
| ラットプルダウン | back |
| シーテッドロー | back |
| チンニング | back |
| ショルダープレス | shoulder |
| サイドレイズ | shoulder |
| リアレイズ | shoulder |
| スクワット | legs |
| レッグプレス | legs |

---

## 11.11 workout_templates

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| name | text | テンプレート名 |
| split_type | text | chest / back / shoulder / legs |
| sort_order | integer | 並び順 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

## 11.12 workout_template_exercises

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| template_id | uuid | テンプレートID |
| exercise_id | uuid | 種目ID |
| default_sets | integer | 目安セット数 |
| target_reps | integer | 目標rep |
| default_weight_kg | numeric | 目安重量 |
| sort_order | integer | 種目順 |
| created_at | timestamptz | 作成日時 |

---

## 11.13 workouts

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| date | date | トレーニング日 |
| split_type | text | chest / back / shoulder / legs |
| status | text | in_progress / completed / discarded |
| memo | text | メモ |
| started_at | timestamptz | 開始日時 |
| completed_at | timestamptz | 完了日時 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

## 11.14 workout_sets

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| workout_id | uuid | セッションID |
| exercise_id | uuid | 種目ID |
| exercise_order | integer | 種目順 |
| set_number | integer | セット番号 |
| set_type | text | warmup / main |
| weight_kg | numeric | 重量 |
| reps | integer | reps |
| volume_kg | numeric | weight_kg × reps |
| estimated_1rm_kg | numeric | エプリー式 |
| is_effective | boolean | mainならtrue |
| memo | text | セットメモ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

## 11.15 body_photos

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| taken_date | date | 撮影日 |
| photo_type | text | front / side / back / other |
| storage_path | text | Storageパス |
| memo | text | メモ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

## 11.16 import_logs

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| imported_at | timestamptz | 取込日時 |
| data_type | text | body_composition / calorie_intake / calorie_burn |
| file_name | text | ファイル名 |
| file_hash | text | ファイルハッシュ |
| import_mode | text | skip / overwrite |
| target_start_date | date | 対象開始日 |
| target_end_date | date | 対象終了日 |
| preview_json | jsonb | プレビュー結果 |
| records_imported | integer | 取込件数 |
| records_skipped | integer | スキップ件数 |
| records_overwritten | integer | 上書き件数 |
| records_error | integer | エラー件数 |
| created_at | timestamptz | 作成日時 |

## 11.17 import_errors

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| import_log_id | uuid | 取込ログID |
| row_number | integer | エラー行 |
| raw_data | jsonb | 元データ |
| error_message | text | エラー理由 |
| created_at | timestamptz | 作成日時 |

---

## 11.18 alert_history

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| alert_type | text | アラート種別 |
| severity | text | info / warning / critical |
| target_date | date | 判定基準日 |
| message | text | 表示文言 |
| action_text | text | 改善アクション |
| metrics_json | jsonb | 判定に使った数値 |
| is_resolved | boolean | 解消済みか |
| created_at | timestamptz | 作成日時 |

---

## 12. 計算ロジック

## 12.1 7日移動平均

```text
7日移動平均 = 対象日を含む直近7日間の平均
```

データ欠損日は平均母数から除外する。欠損を0扱いしない。

## 12.2 カロリー収支

```text
net_calories = calories_kcal - adjusted_calories_kcal
```

- net_calories < 0：減量方向
- net_calories > 0：余剰方向

## 12.3 脂肪増減推定

```text
estimated_fat_change_kg = cumulative_net_calories / fat_kcal_per_kg
```

初期値：fat_kcal_per_kg = 7700

## 12.4 推定1RM

```text
estimated_1rm_kg = weight_kg × (1 + reps / 30)
```

1セッション内の同一種目における最大値を、その日の推定1RMとする。

## 12.5 総ボリューム

```text
volume_kg = weight_kg × reps
session_exercise_volume = Σ volume_kg
```

MVPではダンベル種目、片側種目、自重種目の厳密補正は行わない。

## 12.6 有効セット

```text
is_effective = set_type == 'main'
```

部位別週間セット数は、主働筋ごとの有効セット数を集計する。

## 12.7 部位別セット充足率

```text
充足率 = 実績有効セット数 / 目標有効セット数
```

MVP対象部位：胸、背中、肩。

---

## 13. アラート判定ロジック

## 13.1 判定タイミング

- ダッシュボード表示時
- 週次サマリー表示時
- アラート画面表示時

MVPではバッチ処理ではなく、表示時算出でもよい。

## 13.2 脂質過多

```text
if net_calories > calorie_balance_threshold and fat_g_average > fat_goal:
    alert = fat_excess
```

摂取カロリー超過時のみ脂質過多を見る。

## 13.3 タンパク質不足

```text
直近7日のうち protein_g < protein_goal の日が protein_shortage_days 以上ならアラート
```

## 13.4 体脂肪量停滞

体脂肪率ではなく、体脂肪量kgで判定する。

```text
直近N日間の体脂肪量変化が threshold_kg 以内なら停滞
```

Nとthresholdは設定可能。

## 13.5 部位別セット不足

```text
weekly_effective_sets[muscle] < target_sets[muscle]
```

対象：胸、背中、肩。

---

## 14. PWA・オフライン設計

## 14.1 PWA名

```text
BodyMake Tracker
```

## 14.2 対応範囲

| 項目 | MVP対応 |
|---|---:|
| ホーム画面追加 | ○ |
| アイコン | ○ |
| 起動画面 | ○ |
| 主要画面のオフライン閲覧 | ○ |
| オフライン入力 | × |
| オンライン復帰同期 | × |

## 14.3 オフライン保存データ

画面表示に必要な最低限のデータを端末にキャッシュする。

- ダッシュボード表示用の集計結果
- 週次サマリー表示用の集計結果
- 筋トレ画面の直近データ表示用の最小データ
- 目標設定値
- テンプレート情報

---

## 15. セキュリティ設計

## 15.1 必須要件

- Googleログイン必須
- 全ユーザーデータにuser_idを付与
- RLS有効化
- 本人データのみselect / insert / update / delete可能
- エクスポート時も本人データのみ対象
- 体型写真も本人のみアクセス可能
- サービスロールキーをクライアントに置かない

## 15.2 RLSポリシー例

```sql
create policy "Users can view own rows"
on body_compositions
for select
using (auth.uid() = user_id);

create policy "Users can insert own rows"
on body_compositions
for insert
with check (auth.uid() = user_id);

create policy "Users can update own rows"
on body_compositions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own rows"
on body_compositions
for delete
using (auth.uid() = user_id);
```

全ユーザーデータテーブルに同等のRLSを設定する。

---

## 16. バックアップ・エクスポート設計

## 16.1 エクスポート対象

- 体組成CSV
- 摂取/PFC CSV
- 消費CSV
- 筋トレCSV
- 取込ログCSV
- 全体JSON

## 16.2 実行導線

- 設定画面
- データ一覧画面

## 16.3 復元

復元はできればMVP対象。難しい場合は次フェーズに回す。

復元仕様を入れる場合、JSON一式から本人データとして再投入する。

---

## 17. サンプルデータ

MVPではサンプルデータを必須とする。

### 17.1 画面確認用ダミーデータ

- 体組成90日分
- 摂取/PFC90日分
- 消費90日分
- 筋トレ20セッション分
- アラート例
- 体型写真ダミーメタデータ

### 17.2 サンプル取込ファイル

- オムロンCSVサンプル
- Apple Health ZIPまたはXMLサンプル
- Fitbit CSVサンプル

実データを使う場合は、匿名加工して利用する。

---

## 18. ルーティング・ディレクトリ構成案

```text
bodymake-tracker/
├── app/
│   ├── page.tsx                         # Dashboard
│   ├── workout/page.tsx
│   ├── import/page.tsx
│   ├── weekly/page.tsx
│   ├── alerts/page.tsx
│   ├── data/page.tsx
│   ├── templates/page.tsx
│   ├── photos/page.tsx
│   ├── guide/page.tsx
│   ├── settings/
│   │   ├── goals/page.tsx
│   │   └── alerts/page.tsx
│   └── api/
│       ├── export/route.ts
│       └── import/preview/route.ts       # 必要になった場合のみ
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── workout/
│   ├── import/
│   ├── weekly/
│   ├── alerts/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── importers/
│   ├── calculations/
│   ├── alerts/
│   └── export/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
│   ├── manifest.json
│   └── icons/
└── docs/
```

---

## 19. 実装上の注意点

1. 0扱いしてはいけない欠損値を明確に区別する
2. カロリー収支は必ず `摂取 - 補正後消費` に統一する
3. 体組成は当日値ではなく7日移動平均を主表示にする
4. 再取込時は対象期間とモードを明示する
5. 取込元ファイルは保存しない
6. import_logsにはファイルハッシュを保存する
7. 筋トレ記録はセットごとに自動保存する
8. 直接編集は筋トレ記録のみ許可する
9. RLSが設定されるまで本番デプロイしない
10. サンプルデータで画面確認できる状態を先に作る
