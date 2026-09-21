-- Per product bijhouden hoe ver een gast is.
--
-- Michiels voorstel, en het is beter dan wat er stond. Eén statuskolom kon niet
-- twee dingen tegelijk zeggen: of wij het verstuurd hebben, en of de gast
-- gereageerd heeft. Een gast die je met de hand toevoegde stond daardoor
-- meteen op "aanwezig", terwijl je nog niets van hem had gehoord.
--
-- Nu per product een eigen reis met vier standen:
--   niet_verstuurd  je hebt hem nog niet gedeeld
--   verstuurd       je hebt hem gedeeld, nog geen antwoord
--   ja              de gast komt
--   nee             de gast komt niet
--
-- Het verstuurd-zetten doet het bruidspaar zelf, want delen gaat via WhatsApp
-- en dat kunnen wij niet zien. Reageert een gast via de kaart, dan zetten wij
-- die stand automatisch op ja of nee.
--
-- Puur toevoegend, dus veilig te draaien terwijl de site loopt.

alter table rsvp
  -- De Save the Date
  add column if not exists std_status text not null default 'niet_verstuurd',
  -- De trouwkaart of de uitnodiging op de website
  add column if not exists inv_status text not null default 'niet_verstuurd';

-- Wat er al in staat komt uit het oude statusveld. Een voorlopige reactie hoort
-- bij de Save the Date, een definitieve bij de uitnodiging.
update rsvp
set std_status = case when attending = 'no' then 'nee' else 'ja' end
where status = 'voorlopig' and std_status = 'niet_verstuurd';

update rsvp
set inv_status = case when attending = 'no' then 'nee' else 'ja' end
where status = 'definitief' and inv_status = 'niet_verstuurd';

-- Filteren op "wie moet ik nog najagen" gebeurt op deze twee kolommen.
create index if not exists rsvp_event_reis_idx
  on rsvp (event_id, inv_status, std_status);

-- De oude kolom status blijft nog even staan zodat terugrollen kan. Zodra deze
-- versie een tijdje goed loopt kan hij weg met:
--
--   alter table rsvp drop column status;
