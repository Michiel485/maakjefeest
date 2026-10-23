-- Afmelden voor herinneringen en het duwtje als niemand reageert (23 oktober 2026).
--
-- herinneringen_uit: de klant klikte op "Afmelden voor deze herinneringen"
-- onderaan een mail (app/api/mail/afmelden). De dagelijkse taak stuurt dan
-- geen conceptherinneringen, standmails, week-voor- en dag-na-mails en
-- duwtjes meer. Mails over betaling, aanmeldingen en het verlopen van de site
-- gaan gewoon door.
--
-- mail_duwtje_at: wanneer de mail "Nog geen reacties? Zo krijg je ze wel" is
-- verstuurd, zodat hij hoogstens één keer gaat.
alter table public.events
  add column if not exists herinneringen_uit boolean not null default false,
  add column if not exists mail_duwtje_at timestamptz;
