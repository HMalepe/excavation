-- 0005: retention (spec 09 §4): keep a learner's data until one year after they finish Grade 12.
alter table public.learners add column if not exists retain_until date;
comment on column public.learners.retain_until is 'Delete (or anonymise, if research consent was given) after this date. Set from grade at roster import.';
create index if not exists learners_retain_until_idx on public.learners (retain_until) where retain_until is not null;

-- Backfill: finish Grade 12 in (this year + 12 - grade), keep until 31 December the year after.
update public.learners
   set retain_until = make_date((extract(year from now())::int + (12 - current_grade) + 1), 12, 31)
 where retain_until is null;
