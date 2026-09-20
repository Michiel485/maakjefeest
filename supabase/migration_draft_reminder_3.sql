-- Derde conceptherinnering.
--
-- Kaartpakketten worden nu een half jaar bewaard met drie herinneringen
-- (na 6 weken, na 3 maanden en een week voor het verwijderen). Daar is een
-- derde datumveld voor nodig; de eerste twee bestaan al.
--
-- Veilig om te draaien: puur toevoegen, leeg voor bestaande rijen, en een lege
-- waarde betekent "nog niet verstuurd".

alter table events
  add column if not exists draft_reminder_3_sent_at timestamptz;
