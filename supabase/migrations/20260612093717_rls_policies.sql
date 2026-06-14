-- Phase 1: Row Level Security (RLS) 設定
-- 全テーブルでRLSを有効化し、ユーザーが自分のデータのみ操作できるようにする。

-- ============================================================
-- profiles: 自分のプロファイルのみ参照・更新可。
-- insert/deleteはhandle_new_userトリガー(security definer)経由のみで行うため、
-- 通常ユーザー向けのinsert/deleteポリシーは用意しない。
-- ============================================================
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- app_settings: 自分の設定のみ参照・作成・更新・削除可。
-- ============================================================
alter table public.app_settings enable row level security;

create policy app_settings_select_own on public.app_settings
  for select using (auth.uid() = user_id);

create policy app_settings_insert_own on public.app_settings
  for insert with check (auth.uid() = user_id);

create policy app_settings_update_own on public.app_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy app_settings_delete_own on public.app_settings
  for delete using (auth.uid() = user_id);

-- ============================================================
-- goals: 自分の目標のみ参照・作成・更新・削除可。
-- ============================================================
alter table public.goals enable row level security;

create policy goals_select_own on public.goals
  for select using (auth.uid() = user_id);

create policy goals_insert_own on public.goals
  for insert with check (auth.uid() = user_id);

create policy goals_update_own on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy goals_delete_own on public.goals
  for delete using (auth.uid() = user_id);

-- ============================================================
-- alert_settings: 自分のアラート設定のみ参照・作成・更新・削除可。
-- ============================================================
alter table public.alert_settings enable row level security;

create policy alert_settings_select_own on public.alert_settings
  for select using (auth.uid() = user_id);

create policy alert_settings_insert_own on public.alert_settings
  for insert with check (auth.uid() = user_id);

create policy alert_settings_update_own on public.alert_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy alert_settings_delete_own on public.alert_settings
  for delete using (auth.uid() = user_id);

-- ============================================================
-- import_logs: 自分の取込履歴のみ参照・作成・更新・削除可。
-- ============================================================
alter table public.import_logs enable row level security;

create policy import_logs_select_own on public.import_logs
  for select using (auth.uid() = user_id);

create policy import_logs_insert_own on public.import_logs
  for insert with check (auth.uid() = user_id);

create policy import_logs_update_own on public.import_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy import_logs_delete_own on public.import_logs
  for delete using (auth.uid() = user_id);

-- ============================================================
-- import_errors: 自分の取込エラーのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.import_errors enable row level security;

create policy import_errors_select_own on public.import_errors
  for select using (auth.uid() = user_id);

create policy import_errors_insert_own on public.import_errors
  for insert with check (auth.uid() = user_id);

create policy import_errors_update_own on public.import_errors
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy import_errors_delete_own on public.import_errors
  for delete using (auth.uid() = user_id);

-- ============================================================
-- body_compositions: 自分の体組成データのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.body_compositions enable row level security;

create policy body_compositions_select_own on public.body_compositions
  for select using (auth.uid() = user_id);

create policy body_compositions_insert_own on public.body_compositions
  for insert with check (auth.uid() = user_id);

create policy body_compositions_update_own on public.body_compositions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy body_compositions_delete_own on public.body_compositions
  for delete using (auth.uid() = user_id);

-- ============================================================
-- calorie_intakes: 自分の摂取カロリー/PFCデータのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.calorie_intakes enable row level security;

create policy calorie_intakes_select_own on public.calorie_intakes
  for select using (auth.uid() = user_id);

create policy calorie_intakes_insert_own on public.calorie_intakes
  for insert with check (auth.uid() = user_id);

create policy calorie_intakes_update_own on public.calorie_intakes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy calorie_intakes_delete_own on public.calorie_intakes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- calorie_burns: 自分の消費カロリーデータのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.calorie_burns enable row level security;

create policy calorie_burns_select_own on public.calorie_burns
  for select using (auth.uid() = user_id);

create policy calorie_burns_insert_own on public.calorie_burns
  for insert with check (auth.uid() = user_id);

create policy calorie_burns_update_own on public.calorie_burns
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy calorie_burns_delete_own on public.calorie_burns
  for delete using (auth.uid() = user_id);

-- ============================================================
-- exercises: 自分が作成した種目に加えて、共通プリセット
-- (user_id is null and is_preset = true) も参照可能。
-- 作成・更新・削除は自分の種目のみ（プリセットは編集不可）。
-- ============================================================
alter table public.exercises enable row level security;

create policy exercises_select_own_or_preset on public.exercises
  for select using (auth.uid() = user_id or (user_id is null and is_preset = true));

create policy exercises_insert_own on public.exercises
  for insert with check (auth.uid() = user_id);

create policy exercises_update_own on public.exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy exercises_delete_own on public.exercises
  for delete using (auth.uid() = user_id);

-- ============================================================
-- workout_templates: 自分のテンプレートのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.workout_templates enable row level security;

create policy workout_templates_select_own on public.workout_templates
  for select using (auth.uid() = user_id);

create policy workout_templates_insert_own on public.workout_templates
  for insert with check (auth.uid() = user_id);

create policy workout_templates_update_own on public.workout_templates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy workout_templates_delete_own on public.workout_templates
  for delete using (auth.uid() = user_id);

-- ============================================================
-- workout_template_exercises: user_idを持たないため、
-- 親テーブルworkout_templatesのuser_idを介して所有者を判定する。
-- ============================================================
alter table public.workout_template_exercises enable row level security;

create policy workout_template_exercises_select_own on public.workout_template_exercises
  for select using (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  );

create policy workout_template_exercises_insert_own on public.workout_template_exercises
  for insert with check (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  );

create policy workout_template_exercises_update_own on public.workout_template_exercises
  for update using (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  );

create policy workout_template_exercises_delete_own on public.workout_template_exercises
  for delete using (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  );

-- ============================================================
-- workouts: 自分の筋トレセッションのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.workouts enable row level security;

create policy workouts_select_own on public.workouts
  for select using (auth.uid() = user_id);

create policy workouts_insert_own on public.workouts
  for insert with check (auth.uid() = user_id);

create policy workouts_update_own on public.workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy workouts_delete_own on public.workouts
  for delete using (auth.uid() = user_id);

-- ============================================================
-- workout_sets: 自分の筋トレセットのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.workout_sets enable row level security;

create policy workout_sets_select_own on public.workout_sets
  for select using (auth.uid() = user_id);

create policy workout_sets_insert_own on public.workout_sets
  for insert with check (auth.uid() = user_id);

create policy workout_sets_update_own on public.workout_sets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy workout_sets_delete_own on public.workout_sets
  for delete using (auth.uid() = user_id);

-- ============================================================
-- body_photos: 自分の体型写真メタデータのみ参照・作成・更新・削除可。
-- ============================================================
alter table public.body_photos enable row level security;

create policy body_photos_select_own on public.body_photos
  for select using (auth.uid() = user_id);

create policy body_photos_insert_own on public.body_photos
  for insert with check (auth.uid() = user_id);

create policy body_photos_update_own on public.body_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy body_photos_delete_own on public.body_photos
  for delete using (auth.uid() = user_id);

-- ============================================================
-- alert_history: 自分のアラート履歴のみ参照・作成・更新・削除可。
-- ============================================================
alter table public.alert_history enable row level security;

create policy alert_history_select_own on public.alert_history
  for select using (auth.uid() = user_id);

create policy alert_history_insert_own on public.alert_history
  for insert with check (auth.uid() = user_id);

create policy alert_history_update_own on public.alert_history
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy alert_history_delete_own on public.alert_history
  for delete using (auth.uid() = user_id);
