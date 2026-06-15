-- Phase 2: サンプルデータ投入
--
-- 実行前に、下記の <YOUR_USER_ID> を全て自分のユーザーUUIDに置き換えてください。
-- (Supabaseダッシュボード Authentication > Users で確認できます)
--
-- 注意: このスクリプトは一度だけ実行してください。再実行すると重複データが作成されます。

-- ============================================================
-- 1. プリセット種目 (user_id = null, is_preset = true)
-- ============================================================
insert into public.exercises (user_id, name, primary_muscle_group, is_preset) values
  (null, 'ベンチプレス', 'chest', true),
  (null, 'インクラインベンチプレス', 'chest', true),
  (null, 'ダンベルフライ', 'chest', true),
  (null, 'ラットプルダウン', 'back', true),
  (null, 'シーテッドロー', 'back', true),
  (null, 'チンニング', 'back', true),
  (null, 'ショルダープレス', 'shoulder', true),
  (null, 'サイドレイズ', 'shoulder', true),
  (null, 'リアレイズ', 'shoulder', true),
  (null, 'スクワット', 'legs', true),
  (null, 'レッグプレス', 'legs', true);

-- ============================================================
-- 2. ワークアウトテンプレート、体組成/摂取/消費90日分、筋トレ20セッション分、
--    アラート例、体型写真ダミーメタデータ
-- ============================================================
do $$
declare
  v_user_id uuid := '<YOUR_USER_ID>'::uuid;
  v_today date := current_date;
  v_template_id uuid;
  v_ex_id uuid;
  v_workout_id uuid;
  s int;
  progress numeric;
  session_date date;
  split text;
  splits text[] := array['chest', 'back', 'shoulder', 'legs'];
  exercises_for_split text[];
  ex_name text;
  ex_idx int;
  main_weight numeric;
  target_reps int;
  set_num int;
  warmup_weight numeric;
begin
  -- ----------------------------------------------------------
  -- 2-1. ワークアウトテンプレート
  -- ----------------------------------------------------------
  insert into public.workout_templates (user_id, name, split_type, sort_order) values
    (v_user_id, '胸の日', 'chest', 0),
    (v_user_id, '背中の日', 'back', 1),
    (v_user_id, '肩の日', 'shoulder', 2),
    (v_user_id, '脚の日', 'legs', 3);

  select id into v_template_id from public.workout_templates where user_id = v_user_id and split_type = 'chest';
  insert into public.workout_template_exercises (template_id, exercise_id, default_sets, target_reps, default_weight_kg, sort_order)
  select v_template_id, e.id, v.default_sets, v.target_reps, v.default_weight_kg, v.sort_order
  from (values
    ('ベンチプレス', 3, 9, 55.0, 0),
    ('インクラインベンチプレス', 3, 9, 40.0, 1),
    ('ダンベルフライ', 3, 11, 14.0, 2)
  ) as v(name, default_sets, target_reps, default_weight_kg, sort_order)
  join public.exercises e on e.name = v.name and e.is_preset;

  select id into v_template_id from public.workout_templates where user_id = v_user_id and split_type = 'back';
  insert into public.workout_template_exercises (template_id, exercise_id, default_sets, target_reps, default_weight_kg, sort_order)
  select v_template_id, e.id, v.default_sets, v.target_reps, v.default_weight_kg, v.sort_order
  from (values
    ('ラットプルダウン', 3, 10, 42.0, 0),
    ('シーテッドロー', 3, 10, 38.0, 1),
    ('チンニング', 3, 8, 5.0, 2)
  ) as v(name, default_sets, target_reps, default_weight_kg, sort_order)
  join public.exercises e on e.name = v.name and e.is_preset;

  select id into v_template_id from public.workout_templates where user_id = v_user_id and split_type = 'shoulder';
  insert into public.workout_template_exercises (template_id, exercise_id, default_sets, target_reps, default_weight_kg, sort_order)
  select v_template_id, e.id, v.default_sets, v.target_reps, v.default_weight_kg, v.sort_order
  from (values
    ('ショルダープレス', 3, 10, 28.0, 0),
    ('サイドレイズ', 3, 12, 7.0, 1),
    ('リアレイズ', 3, 12, 5.0, 2)
  ) as v(name, default_sets, target_reps, default_weight_kg, sort_order)
  join public.exercises e on e.name = v.name and e.is_preset;

  select id into v_template_id from public.workout_templates where user_id = v_user_id and split_type = 'legs';
  insert into public.workout_template_exercises (template_id, exercise_id, default_sets, target_reps, default_weight_kg, sort_order)
  select v_template_id, e.id, v.default_sets, v.target_reps, v.default_weight_kg, v.sort_order
  from (values
    ('スクワット', 3, 8, 65.0, 0),
    ('レッグプレス', 3, 10, 85.0, 1)
  ) as v(name, default_sets, target_reps, default_weight_kg, sort_order)
  join public.exercises e on e.name = v.name and e.is_preset;

  -- ----------------------------------------------------------
  -- 2-2. body_compositions: 90日分（体重・体脂肪は緩やかに減少、骨格筋量は横ばい〜微増）
  -- ----------------------------------------------------------
  insert into public.body_compositions (
    user_id, measured_at, date, is_representative,
    weight_kg, body_fat_pct, body_fat_kg, muscle_kg, muscle_pct,
    visceral_fat, bmr_kcal, bmi, body_age, source
  )
  select
    v_user_id,
    (v_today - (89 - d)) + time '07:00:00',
    v_today - (89 - d),
    true,
    weight_kg,
    body_fat_pct,
    round((weight_kg * body_fat_pct / 100)::numeric, 2),
    muscle_kg,
    round((muscle_kg / weight_kg * 100)::numeric, 1),
    visceral_fat,
    bmr_kcal,
    bmi,
    body_age,
    'omron'
  from (
    select
      d,
      round((78.0 - 3.0 * (d / 89.0) + (random() - 0.5) * 0.4)::numeric, 1) as weight_kg,
      round((22.0 - 3.0 * (d / 89.0) + (random() - 0.5) * 0.6)::numeric, 1) as body_fat_pct,
      round((33.0 + 0.5 * (d / 89.0) + (random() - 0.5) * 0.3)::numeric, 1) as muscle_kg,
      round((11 - 2 * (d / 89.0))::numeric)::int as visceral_fat,
      round((1550 + (random() - 0.5) * 40)::numeric)::int as bmr_kcal,
      round((24.5 - 1.0 * (d / 89.0) + (random() - 0.5) * 0.2)::numeric, 1) as bmi,
      round((38 - 3 * (d / 89.0))::numeric)::int as body_age
    from generate_series(0, 89) as d
  ) sub;

  -- ----------------------------------------------------------
  -- 2-3. calorie_intakes: 90日分（日によってばらつきのある摂取カロリー/PFC）
  -- ----------------------------------------------------------
  insert into public.calorie_intakes (user_id, date, calories_kcal, protein_g, fat_g, carbs_g, source)
  select
    v_user_id,
    v_today - (89 - d),
    round((2000 + (random() - 0.5) * 400)::numeric, 0),
    round((100 + (random() - 0.5) * 20)::numeric, 0),
    round((55 + (random() - 0.5) * 15)::numeric, 0),
    round((240 + (random() - 0.5) * 40)::numeric, 0),
    'askend'
  from generate_series(0, 89) as d;

  -- ----------------------------------------------------------
  -- 2-4. calorie_burns: 90日分（Fitbit消費。calorie_factorで補正）
  -- ----------------------------------------------------------
  insert into public.calorie_burns (user_id, date, raw_calories_kcal, calorie_factor, adjusted_calories_kcal, steps, active_minutes, source)
  select
    v_user_id,
    v_today - (89 - d),
    raw_calories_kcal,
    0.95,
    round((raw_calories_kcal * 0.95)::numeric, 0),
    floor(6000 + random() * 6000)::int,
    floor(20 + random() * 40)::int,
    'fitbit'
  from (
    select d, round((2300 + random() * 400)::numeric, 0) as raw_calories_kcal
    from generate_series(0, 89) as d
  ) sub;

  -- ----------------------------------------------------------
  -- 2-5. workouts / workout_sets: 20セッション分（推定1RMが少しずつ伸びる）
  -- ----------------------------------------------------------
  for s in 0..19 loop
    progress := s / 19.0;
    session_date := v_today - (89 - round(s * 89.0 / 19)::int);
    split := splits[(s % 4) + 1];

    insert into public.workouts (user_id, date, split_type, status, started_at, completed_at)
    values (
      v_user_id, session_date, split, 'completed',
      session_date + time '19:00:00',
      session_date + time '20:10:00'
    )
    returning id into v_workout_id;

    case split
      when 'chest' then exercises_for_split := array['ベンチプレス', 'インクラインベンチプレス', 'ダンベルフライ'];
      when 'back' then exercises_for_split := array['ラットプルダウン', 'シーテッドロー', 'チンニング'];
      when 'shoulder' then exercises_for_split := array['ショルダープレス', 'サイドレイズ', 'リアレイズ'];
      else exercises_for_split := array['スクワット', 'レッグプレス'];
    end case;

    for ex_idx in 1..array_length(exercises_for_split, 1) loop
      ex_name := exercises_for_split[ex_idx];
      select id into v_ex_id from public.exercises where is_preset and name = ex_name;

      case ex_name
        when 'ベンチプレス' then main_weight := 55 + 10 * progress; target_reps := 9;
        when 'インクラインベンチプレス' then main_weight := 40 + 8 * progress; target_reps := 9;
        when 'ダンベルフライ' then main_weight := 14 + 4 * progress; target_reps := 11;
        when 'ラットプルダウン' then main_weight := 42 + 8 * progress; target_reps := 10;
        when 'シーテッドロー' then main_weight := 38 + 8 * progress; target_reps := 10;
        when 'チンニング' then main_weight := 5 + 5 * progress; target_reps := 8;
        when 'ショルダープレス' then main_weight := 28 + 5 * progress; target_reps := 10;
        when 'サイドレイズ' then main_weight := 7 + 2 * progress; target_reps := 12;
        when 'リアレイズ' then main_weight := 5 + 1 * progress; target_reps := 12;
        when 'スクワット' then main_weight := 65 + 12 * progress; target_reps := 8;
        else main_weight := 85 + 15 * progress; target_reps := 10; -- レッグプレス
      end case;
      main_weight := round(main_weight, 1);
      warmup_weight := round(main_weight * 0.6, 1);

      -- ウォームアップセット
      insert into public.workout_sets (
        user_id, workout_id, exercise_id, exercise_order, set_number, set_type,
        weight_kg, reps, volume_kg, estimated_1rm_kg, is_effective
      ) values (
        v_user_id, v_workout_id, v_ex_id, ex_idx - 1, 1, 'warmup',
        warmup_weight, 10, warmup_weight * 10,
        round((warmup_weight * (1 + 10 / 30.0))::numeric, 2), false
      );

      -- メインセット x2
      for set_num in 2..3 loop
        insert into public.workout_sets (
          user_id, workout_id, exercise_id, exercise_order, set_number, set_type,
          weight_kg, reps, volume_kg, estimated_1rm_kg, is_effective
        ) values (
          v_user_id, v_workout_id, v_ex_id, ex_idx - 1, set_num, 'main',
          main_weight, target_reps - (set_num - 2),
          main_weight * (target_reps - (set_num - 2)),
          round((main_weight * (1 + (target_reps - (set_num - 2)) / 30.0))::numeric, 2), true
        );
      end loop;
    end loop;
  end loop;

  -- ----------------------------------------------------------
  -- 2-6. alert_history: アラート例
  -- ----------------------------------------------------------
  insert into public.alert_history (user_id, alert_type, severity, target_date, message, action_text, metrics_json, is_resolved) values
    (v_user_id, 'weight_gain', 'warning', v_today - 3, '直近1週間で体重が増加傾向です。', '摂取カロリーを見直しましょう。', '{"weight_change_kg": 0.6}', false),
    (v_user_id, 'fat_mass_stagnation', 'info', v_today - 10, '体脂肪量の減少が停滞しています。', '消費カロリーを増やすか、摂取カロリーを見直しましょう。', '{"stagnation_days": 14}', true),
    (v_user_id, 'protein_shortage', 'warning', v_today - 1, 'タンパク質摂取量が3日連続で目標を下回っています。', 'プロテインなどでタンパク質を補いましょう。', '{"shortage_days": 3}', false),
    (v_user_id, 'chest_sets_shortfall', 'info', v_today - 5, '今週の胸の有効セット数が目標未達です。', '胸のトレーニングをもう1セッション追加しましょう。', '{"actual_sets": 6, "target_sets": 9}', false);

  -- ----------------------------------------------------------
  -- 2-7. body_photos: ダミーメタデータ（実ファイルなし）
  -- ----------------------------------------------------------
  insert into public.body_photos (user_id, taken_date, photo_type, storage_path, memo) values
    (v_user_id, v_today - 60, 'front', v_user_id::text || '/' || to_char(v_today - 60, 'YYYY-MM-DD') || '_front.jpg', null),
    (v_user_id, v_today - 60, 'side', v_user_id::text || '/' || to_char(v_today - 60, 'YYYY-MM-DD') || '_side.jpg', null),
    (v_user_id, v_today - 60, 'back', v_user_id::text || '/' || to_char(v_today - 60, 'YYYY-MM-DD') || '_back.jpg', null),
    (v_user_id, v_today - 30, 'front', v_user_id::text || '/' || to_char(v_today - 30, 'YYYY-MM-DD') || '_front.jpg', null),
    (v_user_id, v_today - 30, 'side', v_user_id::text || '/' || to_char(v_today - 30, 'YYYY-MM-DD') || '_side.jpg', null),
    (v_user_id, v_today - 30, 'back', v_user_id::text || '/' || to_char(v_today - 30, 'YYYY-MM-DD') || '_back.jpg', null),
    (v_user_id, v_today, 'front', v_user_id::text || '/' || to_char(v_today, 'YYYY-MM-DD') || '_front.jpg', null),
    (v_user_id, v_today, 'side', v_user_id::text || '/' || to_char(v_today, 'YYYY-MM-DD') || '_side.jpg', null),
    (v_user_id, v_today, 'back', v_user_id::text || '/' || to_char(v_today, 'YYYY-MM-DD') || '_back.jpg', null);
end $$;
