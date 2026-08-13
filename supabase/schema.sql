-- ============================================================================
-- COUNTDOWN TO BARCELONA — схема Supabase
-- Виконати повністю в Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Таблиця з усіма даними сайту (один рядок у форматі JSON)
-- ---------------------------------------------------------------------------
create table if not exists public.site_data (
  id smallint primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

alter table public.site_data enable row level security;

-- Читати можуть усі (сайт публічний)
create policy "site_data_select_all"
  on public.site_data
  for select
  using (true);

-- Прямий INSERT/UPDATE/DELETE через API забороняємо —
-- запис можливий лише через функцію update_site_data() нижче.

-- Початкові дані (те, що зараз намальовано на макеті)
insert into public.site_data (id, data)
values (1, '{
  "target_date": "2027-11-27T00:00:00",
  "route": { "from": "Київ (KBP)", "to": "Барселона (BCN)" },
  "quote": "Кожен день наближає тебе до життя, про яке ти мрієш.",
  "stats": {
    "savings": { "current": 6100, "target": 10000 },
    "goit": { "percent": 75, "tags": "JS • React • TS" },
    "english": { "level": "B1", "target": "B2", "percent": 55 }
  },
  "weather": { "temp": 28, "desc": "Сонячно", "humidity": 62, "wind": 9, "feels": 29 },
  "checklist": [
    { "id": "1", "text": "Оформити візу", "done": true },
    { "id": "2", "text": "Знайти житло", "done": true },
    { "id": "3", "text": "Оформити страховку", "done": false },
    { "id": "4", "text": "Відкрити рахунок у банку", "done": false },
    { "id": "5", "text": "Купити квиток", "done": false }
  ]
}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Таблиця з паролем (недоступна напряму через API)
-- ---------------------------------------------------------------------------
create table if not exists public.site_secrets (
  id smallint primary key default 1,
  password_hash text not null,
  constraint single_secret_row check (id = 1)
);

alter table public.site_secrets enable row level security;
-- Жодних policy не створюємо — таблиця повністю закрита для anon/authenticated.
-- Доступ до неї є лише зсередини SECURITY DEFINER функцій нижче.

-- ---------------------------------------------------------------------------
-- 3. Встановлення/зміна спільного пароля
--    Викличте вручну в SQL Editor один раз (і коли захочете змінити пароль):
--    select set_site_password('ваш_пароль_тут');
-- ---------------------------------------------------------------------------
create or replace function public.set_site_password(new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.site_secrets (id, password_hash)
  values (1, crypt(new_password, gen_salt('bf')))
  on conflict (id) do update set password_hash = excluded.password_hash;
end;
$$;

-- Цю функцію НЕ надаємо anon/authenticated — викликати можна лише
-- від імені власника проєкту через SQL Editor.
revoke all on function public.set_site_password(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Перевірка пароля (використовується фронтендом для "розблокувати редагування")
-- ---------------------------------------------------------------------------
create or replace function public.verify_site_password(pwd text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from public.site_secrets where id = 1;

  if stored_hash is null then
    return false;
  end if;

  return stored_hash = crypt(pwd, stored_hash);
end;
$$;

grant execute on function public.verify_site_password(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Оновлення даних сайту (перевіряє пароль всередині, RLS не заважає,
--    бо функція SECURITY DEFINER виконується від імені власника таблиці)
-- ---------------------------------------------------------------------------
create or replace function public.update_site_data(pwd text, new_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.verify_site_password(pwd) then
    raise exception 'invalid password' using errcode = '28000';
  end if;

  update public.site_data
     set data = new_data,
         updated_at = now()
   where id = 1
  returning data into result;

  return result;
end;
$$;

grant execute on function public.update_site_data(text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Realtime: дозволити слухати зміни таблиці site_data
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.site_data;

-- ============================================================================
-- ГОТОВО. Далі виконайте (замінивши на свій пароль):
--   select set_site_password('спільний_пароль');
-- ============================================================================

alter function public.set_site_password(text)
  set search_path = public, extensions, pg_temp;

alter function public.verify_site_password(text)
  set search_path = public, extensions, pg_temp;


select set_site_password('19871987');