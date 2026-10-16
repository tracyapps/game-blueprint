-- Game Blueprint — database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run again: it only creates things that don't exist yet.
--
-- Tables
--   respondents     one row per person (name, email)
--   answers         one row per person per question — the "spreadsheet"
--   answer_history  every change ever saved, append-only — for patterns
--   admins          emails allowed to see everyone's answers
-- Views (open these in Supabase's Table Editor like a spreadsheet)
--   answers_sheet          answers + the person's name/email
--   answer_history_sheet   history + the person's name/email

-- 1. Tables ------------------------------------------------------------------

create table if not exists public.respondents (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  email         text not null check (char_length(email) <= 320),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create table if not exists public.answers (
  respondent_id  uuid not null references public.respondents(id) on delete cascade,
  question_id    text not null check (char_length(question_id) <= 120),
  section_id     text not null check (char_length(section_id) <= 60),
  question_text  text check (char_length(question_text) <= 1000),
  value          jsonb,
  other_text     text check (char_length(other_text) <= 2000),
  certainty      text check (certainty in ('decided','leaning','guess','ask')),
  certainty_who  text check (char_length(certainty_who) <= 200),
  why_chain      jsonb not null default '[]'::jsonb check (jsonb_typeof(why_chain) = 'array'),
  why_root       text check (why_root in ('fun','fair','venue','inclusion','legal','tech','tradition','unknown')),
  why_root_note  text check (char_length(why_root_note) <= 2000),
  updated_at     timestamptz not null default now(),
  primary key (respondent_id, question_id),
  -- keep any single answer to a sane size (~200 KB)
  constraint answers_value_size check (pg_column_size(value) < 200000)
);
create index if not exists answers_section_idx on public.answers (section_id);
create index if not exists answers_question_idx on public.answers (question_id);

create table if not exists public.answer_history (
  id             bigint generated always as identity primary key,
  respondent_id  uuid not null references public.respondents(id) on delete cascade,
  question_id    text not null,
  section_id     text not null,
  value          jsonb,
  other_text     text,
  certainty      text,
  certainty_who  text,
  why_chain      jsonb,
  why_root       text,
  why_root_note  text,
  changed_at     timestamptz not null default now()
);
create index if not exists answer_history_q_idx on public.answer_history (respondent_id, question_id, changed_at desc);

create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

-- 2. Who is an admin? ----------------------------------------------------------
-- security definer: can read the admins table even though nobody else can.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 3. History log ---------------------------------------------------------------
-- Every save writes a copy, but rapid autosaves of the same answer within
-- 2 minutes update the latest copy instead of adding a new row, so the
-- history shows how thinking changed rather than every keystroke.
create or replace function public.log_answer_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  recent_id bigint;
begin
  if tg_op = 'UPDATE'
     and new.value is not distinct from old.value
     and new.other_text is not distinct from old.other_text
     and new.certainty is not distinct from old.certainty
     and new.certainty_who is not distinct from old.certainty_who
     and new.why_chain is not distinct from old.why_chain
     and new.why_root is not distinct from old.why_root
     and new.why_root_note is not distinct from old.why_root_note then
    return new;
  end if;

  select id into recent_id
  from public.answer_history
  where respondent_id = new.respondent_id
    and question_id = new.question_id
    and changed_at > now() - interval '2 minutes'
  order by changed_at desc
  limit 1;

  if recent_id is not null then
    update public.answer_history set
      value = new.value, other_text = new.other_text, certainty = new.certainty,
      certainty_who = new.certainty_who, why_chain = new.why_chain,
      why_root = new.why_root, why_root_note = new.why_root_note, changed_at = now()
    where id = recent_id;
  else
    insert into public.answer_history
      (respondent_id, question_id, section_id, value, other_text, certainty,
       certainty_who, why_chain, why_root, why_root_note)
    values
      (new.respondent_id, new.question_id, new.section_id, new.value, new.other_text,
       new.certainty, new.certainty_who, new.why_chain, new.why_root, new.why_root_note);
  end if;
  return new;
end;
$$;

drop trigger if exists answers_history on public.answers;
create trigger answers_history
  after insert or update on public.answers
  for each row execute function public.log_answer_change();

-- The server sets the time, not the browser.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists answers_touch on public.answers;
create trigger answers_touch before insert or update on public.answers
  for each row execute function public.touch_updated_at();

-- 4. Row-level security: people see only their own; admins see everyone ----------
alter table public.respondents    enable row level security;
alter table public.answers        enable row level security;
alter table public.answer_history enable row level security;
alter table public.admins         enable row level security;  -- no policies = no client access

drop policy if exists "own or admin read" on public.respondents;
create policy "own or admin read" on public.respondents
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "insert self" on public.respondents;
create policy "insert self" on public.respondents
  for insert to authenticated
  with check (id = auth.uid() and lower(email) = lower(auth.jwt() ->> 'email'));
drop policy if exists "update self" on public.respondents;
create policy "update self" on public.respondents
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "own or admin read" on public.answers;
create policy "own or admin read" on public.answers
  for select to authenticated using (respondent_id = auth.uid() or public.is_admin());
drop policy if exists "write own" on public.answers;
create policy "write own" on public.answers
  for insert to authenticated with check (respondent_id = auth.uid());
drop policy if exists "update own" on public.answers;
create policy "update own" on public.answers
  for update to authenticated using (respondent_id = auth.uid()) with check (respondent_id = auth.uid());

drop policy if exists "admin read" on public.answer_history;
create policy "admin read" on public.answer_history
  for select to authenticated using (public.is_admin());

-- Nobody signed-out gets anything.
revoke all on public.respondents, public.answers, public.answer_history, public.admins from anon;
grant select, insert, update on public.respondents, public.answers to authenticated;
grant select on public.answer_history to authenticated;

-- 5. Spreadsheet-style views (respect the rules above) ------------------------------
create or replace view public.answers_sheet with (security_invoker = true) as
select r.name, r.email, a.section_id, a.question_id, a.question_text,
       a.value, a.other_text, a.certainty, a.certainty_who,
       a.why_chain, a.why_root, a.why_root_note, a.updated_at
from public.answers a join public.respondents r on r.id = a.respondent_id;

create or replace view public.answer_history_sheet with (security_invoker = true) as
select h.id, r.name, r.email, h.section_id, h.question_id,
       h.value, h.other_text, h.certainty, h.certainty_who,
       h.why_chain, h.why_root, h.why_root_note, h.changed_at
from public.answer_history h join public.respondents r on r.id = h.respondent_id;

grant select on public.answers_sheet, public.answer_history_sheet to authenticated;

-- 6. Make yourself an admin (change the email, then run just this line) -----------
-- insert into public.admins (email) values ('you@example.com') on conflict do nothing;
