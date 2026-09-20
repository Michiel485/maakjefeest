-- Een eigen naam voor een concept.
--
-- Een bruidspaar maakt soms een paar varianten voordat het kiest. Om daar
-- tussen te kunnen wisselen in de bouwer moet je ze uit elkaar kunnen houden,
-- en "Michiel & Jimi" drie keer in een lijst helpt niet.
--
-- Bewust een eigen kolom en niet title hergebruiken: title staat publiek op de
-- trouwsite. Een concept dat je voor jezelf "met foto" noemt hoort niet als
-- kop bij je gasten in beeld te komen.
--
-- Leeg mag: dan toont de bouwer de namen en de datum, wat voor de meeste
-- mensen genoeg is. Veilig om te draaien, puur toevoegend.

alter table events
  add column if not exists concept_naam text;
