-- ============================================================
-- Einrichtung der Datenbank (einmalig im Supabase SQL Editor ausführen)
-- Supabase → SQL Editor → New query → Inhalt einfügen → Run
-- ============================================================

-- 1) Gespeicherte Berechnungen (Team und Kunden), jeder sieht nur seine eigenen
create table if not exists public.berechnungen (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  art         text not null default 'team' check (art in ('team', 'kunde')),
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- falls die Tabelle schon aus der ersten Version existiert:
alter table public.berechnungen
  add column if not exists art text not null default 'team';

alter table public.berechnungen enable row level security;

drop policy if exists "berechnungen_select" on public.berechnungen;
drop policy if exists "berechnungen_insert" on public.berechnungen;
drop policy if exists "berechnungen_update" on public.berechnungen;
drop policy if exists "berechnungen_delete" on public.berechnungen;

create policy "berechnungen_select" on public.berechnungen
  for select using (auth.uid() = user_id);
create policy "berechnungen_insert" on public.berechnungen
  for insert with check (auth.uid() = user_id);
create policy "berechnungen_update" on public.berechnungen
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "berechnungen_delete" on public.berechnungen
  for delete using (auth.uid() = user_id);

-- 2) Kundenanfragen: geschrieben wird nur über die Vercel-Funktion (service_role),
--    gelesen und bearbeitet nur vom Team (app_metadata.rolle = 'team')
create table if not exists public.anfragen (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  telefon     text,
  anliegen    text not null,
  nachricht   text,
  berechnung  jsonb,
  status      text not null default 'neu' check (status in ('neu', 'erledigt'))
);

create index if not exists anfragen_email_zeit on public.anfragen (email, created_at desc);

alter table public.anfragen enable row level security;

drop policy if exists "anfragen_team_lesen" on public.anfragen;
drop policy if exists "anfragen_team_aendern" on public.anfragen;

create policy "anfragen_team_lesen" on public.anfragen
  for select using ((auth.jwt() -> 'app_metadata' ->> 'rolle') = 'team');
create policy "anfragen_team_aendern" on public.anfragen
  for update using ((auth.jwt() -> 'app_metadata' ->> 'rolle') = 'team')
  with check ((auth.jwt() -> 'app_metadata' ->> 'rolle') = 'team');
-- Keine insert-Policy: anonyme Besucher können nicht direkt schreiben.

-- 3) Teamrolle vergeben (nach dem Anlegen der Teamkonten unter Authentication → Users)
--    E-Mail-Adressen anpassen, dann ausführen. Die Rolle steht in app_metadata und
--    kann vom Nutzer selbst nicht verändert werden.
--
-- update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rolle":"team"}'::jsonb
--   where email in (
--     'christian@beispiel.de',
--     'matthias@beispiel.de',
--     'lisa@beispiel.de'
--   );
--
-- Danach müssen sich diese Personen einmal ab- und wieder anmelden.
-- Kundenkonten bekommen keine Rolle: Authentication → Users → Add user → Create new user
-- (Haken bei „Auto Confirm User“ setzen).
-- Außerdem unter Authentication → Providers → Email die Option „Allow new users to sign up“
-- ausschalten, damit sich niemand selbst registrieren kann.
