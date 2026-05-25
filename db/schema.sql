-- Club Caddy schema. Run inside Supabase SQL editor.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =====================================================================
-- ENUMS
-- =====================================================================
do $$ begin
  create type public.club_type as enum ('driver', 'wood', 'hybrid', 'iron', 'wedge', 'putter');
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- TABLES
-- =====================================================================

create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  type        public.club_type not null,
  loft        numeric(4,1),
  position    integer not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists clubs_user_id_idx on public.clubs(user_id, position);

create table if not exists public.club_yardages (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  swing_pct   integer not null check (swing_pct in (100, 75, 50, 25)),
  yardage     integer not null check (yardage between 0 and 500),
  notes       text,
  unique (club_id, swing_pct)
);
create index if not exists club_yardages_club_id_idx on public.club_yardages(club_id);

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  city          text,
  country       text,
  par_total     integer not null check (par_total between 27 and 80),
  tees_label    text not null default 'White',
  slope_rating  integer not null default 113 check (slope_rating between 55 and 155),
  course_rating numeric(4,1) not null default 72.0 check (course_rating between 50 and 85),
  created_at    timestamptz not null default now()
);
create index if not exists courses_user_id_idx on public.courses(user_id, name);

create table if not exists public.holes (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses(id) on delete cascade,
  hole_number     integer not null check (hole_number between 1 and 18),
  par             integer not null check (par between 3 and 6),
  yardage         integer not null check (yardage between 50 and 700),
  handicap_index  integer not null check (handicap_index between 1 and 18),
  unique (course_id, hole_number)
);

create table if not exists public.rounds (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  course_id           uuid not null references public.courses(id) on delete restrict,
  played_at           timestamptz not null default now(),
  tees_played         text,
  weather_summary     text,
  notes               text,
  total_strokes       integer not null default 0,
  score_differential  numeric(4,1),
  created_at          timestamptz not null default now()
);
create index if not exists rounds_user_played_idx on public.rounds(user_id, played_at desc);

create table if not exists public.scorecard_entries (
  id                    uuid primary key default gen_random_uuid(),
  round_id              uuid not null references public.rounds(id) on delete cascade,
  hole_number           integer not null check (hole_number between 1 and 18),
  strokes               integer not null default 0 check (strokes between 0 and 15),
  putts                 integer not null default 0 check (putts between 0 and 10),
  fairway_hit           boolean,
  green_in_regulation   boolean not null default false,
  sand_save             boolean not null default false,
  penalties             integer not null default 0 check (penalties >= 0),
  notes                 text,
  unique (round_id, hole_number)
);

-- =====================================================================
-- ROW-LEVEL SECURITY
-- =====================================================================

alter table public.clubs              enable row level security;
alter table public.club_yardages      enable row level security;
alter table public.courses            enable row level security;
alter table public.holes              enable row level security;
alter table public.rounds             enable row level security;
alter table public.scorecard_entries  enable row level security;

-- Clubs: owner-only.
drop policy if exists "clubs are owned" on public.clubs;
create policy "clubs are owned" on public.clubs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Club yardages: owner-only via club.user_id.
drop policy if exists "club_yardages via club owner" on public.club_yardages;
create policy "club_yardages via club owner" on public.club_yardages
  for all
  using (exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid()));

-- Courses: owner-only (could open to read-all-shared later).
drop policy if exists "courses are owned" on public.courses;
create policy "courses are owned" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Holes: owner-only via course.user_id.
drop policy if exists "holes via course owner" on public.holes;
create policy "holes via course owner" on public.holes
  for all
  using (exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid()));

-- Rounds: owner-only.
drop policy if exists "rounds are owned" on public.rounds;
create policy "rounds are owned" on public.rounds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Scorecard entries: owner-only via round.user_id.
drop policy if exists "scorecard_entries via round owner" on public.scorecard_entries;
create policy "scorecard_entries via round owner" on public.scorecard_entries
  for all
  using (exists (select 1 from public.rounds r where r.id = round_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.rounds r where r.id = round_id and r.user_id = auth.uid()));
