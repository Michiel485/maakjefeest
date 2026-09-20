-- Conceptherinneringen: van drie datumkolommen naar één teller.
--
-- Kaartpakketten krijgen nu vier herinneringen (dag 7, 42, 91 en 175) en de
-- website drie (dag 7, 42 en 63). Met een kolom per herinnering zou elke
-- wijziging in dat schema een nieuwe migratie kosten. Eén teller met het
-- aantal verstuurde herinneringen kan elk aantal aan.
--
-- Veilig om te draaien: puur toevoegend. De teller wordt gevuld uit de
-- bestaande datumkolommen, dus niemand krijgt een herinnering opnieuw.

alter table events
  add column if not exists draft_reminder_stap smallint not null default 0;

-- Bijvullen vanuit de oude kolommen: het hoogste nummer dat verstuurd is
update events
set draft_reminder_stap = case
  when draft_reminder_3_sent_at is not null then 3
  when draft_reminder_2_sent_at is not null then 2
  when draft_reminder_1_sent_at is not null then 1
  else 0
end
where draft_reminder_stap = 0;

-- De drie oude kolommen worden niet meer gelezen. Ze blijven nu nog staan,
-- zodat terugrollen naar de vorige versie van de code mogelijk is. Zodra deze
-- versie een tijdje goed loopt kunnen ze weg met:
--
--   alter table events
--     drop column draft_reminder_1_sent_at,
--     drop column draft_reminder_2_sent_at,
--     drop column draft_reminder_3_sent_at;
