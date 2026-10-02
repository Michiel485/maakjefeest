-- Mailmomenten rond de dag (ontwerpronde, ronde 6, 2 oktober 2026).
-- Een week voor de bruiloft en de dag erna krijgt het bruidspaar één mail;
-- deze kolommen onthouden dat hij is verstuurd, zodat de dagelijkse taak hem
-- nooit twee keer stuurt.
alter table public.events
  add column if not exists mail_week_voor_at timestamptz,
  add column if not exists mail_dag_na_at timestamptz;
