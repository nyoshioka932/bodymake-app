-- Phase 1: 初期スキーマ定義
-- 設計書 11章のテーブル定義に基づく。全テーブルに user_id (auth.users.id 参照) を持たせる。

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- profiles: ユーザープロファイル
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- app_settings: アプリ設定（Fitbit補正係数等）。1ユーザー1行。
-- ============================================================
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fitbit_calorie_factor numeric not null default 1.00,
  fat_kcal_per_kg integer not null default 7700,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- goals: 目標設定。1ユーザー1行。
-- ============================================================
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_body_fat_pct numeric,
  target_muscle_kg numeric,
  weekly_weight_loss_target_kg numeric,
  weekly_fat_loss_target_kg numeric,
  calorie_target_kcal integer,
  protein_g numeric,
  protein_g_per_kg numeric,
  fat_g numeric,
  carbs_g numeric,
  protein_pct numeric,
  fat_pct numeric,
  carbs_pct numeric,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- alert_settings: アラート閾値。1ユーザー1行。
-- ============================================================
create table public.alert_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_gain_threshold_kg numeric,
  fat_mass_stagnation_days integer,
  fat_mass_stagnation_threshold_kg numeric,
  calorie_balance_threshold_kcal integer,
  protein_shortage_days integer not null default 3,
  chest_weekly_sets_target integer,
  back_weekly_sets_target integer,
  shoulder_weekly_sets_target integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- import_logs: 取込ログ。元ファイルは保存せず、ファイル名・ハッシュのみ保存。
-- ============================================================
create table public.import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  imported_at timestamptz not null default now(),
  data_type text not null check (data_type in ('body_composition', 'calorie_intake', 'calorie_burn')),
  file_name text,
  file_hash text,
  import_mode text check (import_mode in ('skip', 'overwrite')),
  target_start_date date,
  target_end_date date,
  preview_json jsonb,
  records_imported integer not null default 0,
  records_skipped integer not null default 0,
  records_overwritten integer not null default 0,
  records_error integer not null default 0,
  created_at timestamptz not null default now()
);

create index import_logs_user_id_imported_at_idx on public.import_logs (user_id, imported_at desc);

-- ============================================================
-- import_errors: 取込エラー詳細
-- ============================================================
create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  import_log_id uuid references public.import_logs (id) on delete cascade,
  row_number integer,
  raw_data jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index import_errors_import_log_id_idx on public.import_errors (import_log_id);

-- ============================================================
-- body_compositions: 体組成データ（オムロン由来）
-- ============================================================
create table public.body_compositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  date date not null,
  is_representative boolean not null default false,
  weight_kg numeric,
  body_fat_pct numeric,
  body_fat_kg numeric,
  muscle_pct numeric,
  muscle_kg numeric,
  visceral_fat numeric,
  bmr_kcal integer,
  bmi numeric,
  body_age integer,
  source text not null,
  import_log_id uuid references public.import_logs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_at, source)
);

create index body_compositions_user_id_date_idx on public.body_compositions (user_id, date);

-- ============================================================
-- calorie_intakes: 摂取カロリー/PFC（あすけん由来）
-- ============================================================
create table public.calorie_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  calories_kcal numeric,
  protein_g numeric,
  fat_g numeric,
  carbs_g numeric,
  source text not null,
  import_log_id uuid references public.import_logs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, source)
);

create index calorie_intakes_user_id_date_idx on public.calorie_intakes (user_id, date);

-- ============================================================
-- calorie_burns: 消費カロリー（Fitbit由来）
-- ============================================================
create table public.calorie_burns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  raw_calories_kcal numeric,
  calorie_factor numeric not null default 1.00,
  adjusted_calories_kcal numeric,
  steps integer,
  active_minutes integer,
  source text not null,
  import_log_id uuid references public.import_logs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, source)
);

create index calorie_burns_user_id_date_idx on public.calorie_burns (user_id, date);

-- ============================================================
-- exercises: 種目マスタ。user_id が null のものは共通プリセット。
-- ============================================================
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  primary_muscle_group text not null check (primary_muscle_group in ('chest', 'back', 'shoulder', 'legs')),
  is_preset boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_user_id_idx on public.exercises (user_id);

-- ============================================================
-- workout_templates: 筋トレテンプレート
-- ============================================================
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  split_type text not null check (split_type in ('chest', 'back', 'shoulder', 'legs')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_templates_user_id_idx on public.workout_templates (user_id);

-- ============================================================
-- workout_template_exercises: テンプレート種目
-- ============================================================
create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  default_sets integer,
  target_reps integer,
  default_weight_kg numeric,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index workout_template_exercises_template_id_idx on public.workout_template_exercises (template_id);

-- ============================================================
-- workouts: 筋トレセッション
-- ============================================================
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  split_type text check (split_type in ('chest', 'back', 'shoulder', 'legs')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'discarded')),
  memo text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_user_id_date_idx on public.workouts (user_id, date);

-- ============================================================
-- workout_sets: 筋トレセット
-- ============================================================
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  exercise_order integer not null default 0,
  set_number integer not null,
  set_type text not null check (set_type in ('warmup', 'main')),
  weight_kg numeric,
  reps integer,
  volume_kg numeric,
  estimated_1rm_kg numeric,
  is_effective boolean not null default false,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_sets_workout_id_idx on public.workout_sets (workout_id);
create index workout_sets_user_id_exercise_id_idx on public.workout_sets (user_id, exercise_id);

-- ============================================================
-- body_photos: 体型写真メタデータ（実ファイルはSupabase Storage）
-- ============================================================
create table public.body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_date date not null,
  photo_type text not null check (photo_type in ('front', 'side', 'back', 'other')),
  storage_path text not null,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index body_photos_user_id_taken_date_idx on public.body_photos (user_id, taken_date);

-- ============================================================
-- alert_history: アラート履歴
-- ============================================================
create table public.alert_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  target_date date not null,
  message text not null,
  action_text text,
  metrics_json jsonb,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index alert_history_user_id_target_date_idx on public.alert_history (user_id, target_date);
