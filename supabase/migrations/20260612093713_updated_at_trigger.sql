-- Phase 1: updated_at 自動更新トリガー
-- 共通トリガー関数を定義し、updated_at列を持つ全テーブルにBEFORE UPDATEトリガーを設定する。

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.alert_settings
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.body_compositions
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.calorie_intakes
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.calorie_burns
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.workout_templates
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.workout_sets
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.body_photos
  for each row execute function public.set_updated_at();
