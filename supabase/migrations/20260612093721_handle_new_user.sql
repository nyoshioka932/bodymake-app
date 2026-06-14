-- Phase 1: 新規ユーザー登録時の初期データ自動作成
-- auth.users への insert をトリガーに、profiles / app_settings / goals / alert_settings の
-- 初期行をsecurity definerで作成する（RLSをバイパスして実行される）。
-- workout_templatesの初期データ投入はPhase 2で行う。

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.app_settings (user_id)
  values (new.id);

  insert into public.goals (user_id)
  values (new.id);

  insert into public.alert_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
