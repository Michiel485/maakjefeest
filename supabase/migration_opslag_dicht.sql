-- De map met foto's (hero-images) niet meer open voor iedereen
-- (28 september 2026).
--
-- Met de openbare sleutel, die in elke browser zit, kon iedereen in deze map
-- de lijst met alle foto's opvragen, en ook uploaden, overschrijven en
-- weggooien. Ook de foto's van andere klanten. Dat stond open omdat de
-- websitebouwer rechtstreeks vanuit de browser uploadde. Dat loopt nu via de
-- server (app/api/upload-hero), die de servicesleutel gebruikt en alleen
-- echte foto's aanneemt.
--
-- De foto's blijven gewoon zichtbaar op de sites en kaarten: de map is
-- openbaar, en een openbare map geeft een foto via zijn directe link, zonder
-- deze regels.
--
-- Pas draaien als de nieuwe code live staat, anders kan de websitebouwer
-- even geen foto's uploaden. Run this in the Supabase SQL editor.

drop policy if exists "Allow public reads" on storage.objects;
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Toestaan van uploads via builder 1vxel63_0" on storage.objects;
drop policy if exists "Toestaan van uploads via builder 1vxel63_1" on storage.objects;
drop policy if exists "Toestaan van uploads via builder 1vxel63_2" on storage.objects;
drop policy if exists "Toestaan van uploads via builder 1vxel63_3" on storage.objects;

-- Controle: dit moet leeg zijn.
--
--   select policyname, cmd, roles, qual
--   from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
