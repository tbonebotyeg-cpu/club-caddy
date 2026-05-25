-- Multi-tee migration. Run in Supabase SQL Editor. Safe to re-run.
--
-- courses.tees is a JSONB array:
--   [{"label":"Black","slope":132,"rating":74.4,"color":"#000000"},
--    {"label":"Blue","slope":125,"rating":71.7,"color":"#0066FF"},
--    {"label":"White","slope":121,"rating":70.1,"color":"#FFFFFF"}]
--
-- holes.yardages is a JSONB object keyed by tee label:
--   {"Black": 432, "Blue": 410, "White": 380}
--
-- rounds.tees_played stays as the tee LABEL (text) — used as the key into both.

alter table public.courses
  add column if not exists tees jsonb not null default '[]'::jsonb;

alter table public.holes
  add column if not exists yardages jsonb not null default '{}'::jsonb;

-- Backfill: for every course, seed the tees array from its current
-- (tees_label, slope_rating, course_rating) — only if tees is still empty.
update public.courses c
   set tees = jsonb_build_array(
        jsonb_build_object(
          'label', c.tees_label,
          'slope', c.slope_rating,
          'rating', c.course_rating,
          'color', null
        )
      )
 where c.tees = '[]'::jsonb;

-- Backfill hole.yardages from current hole.yardage under the course's default tee label.
update public.holes h
   set yardages = jsonb_build_object(c.tees_label, h.yardage)
  from public.courses c
 where h.course_id = c.id
   and (h.yardages = '{}'::jsonb or h.yardages is null);
