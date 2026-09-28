-- Niemand meer die zomaar in de database kijkt (28 september 2026).
--
-- De eerste opzet (schema.sql) liet iedereen met de openbare sleutel alle
-- gepubliceerde bruiloften en hun pagina's lezen. Die sleutel zit in elke
-- browser, dus iedereen kon zo alle kolommen opvragen: het wachtwoord van een
-- beveiligde site, het antwoord op de geheime vraag en het e-mailadres van
-- het bruidspaar. Nagekeken op 28 september: 1 bruiloft en 8 pagina's waren
-- zo op te vragen.
--
-- De site gebruikt deze regels niet: klantsites, kaarten en aanmelden lopen
-- allemaal via de server met de servicesleutel. Het bruidspaar zelf houdt
-- toegang tot zijn eigen bruiloft via "Owner full access".
--
-- Ook weg: aanmelden rechtstreeks in de database. Aanmelden loopt via
-- /api/rsvp, met de controles en de rem die daar zitten; direct invoegen ging
-- daar omheen.
--
-- Veilig te draaien terwijl de site loopt. Run this in the Supabase SQL editor.

drop policy if exists "Public read published events" on events;
drop policy if exists "Public read pages of published events" on pages;
drop policy if exists "Public insert rsvp" on rsvp;

-- Controle: welke regels er nog zijn. Er mag geen regel meer tussen staan
-- die voor iedereen geldt (roles {public} zonder eigenaarscheck).
--
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
