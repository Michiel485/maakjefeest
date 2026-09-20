-- Dode kolommen en een dode tabel opruimen.
--
-- Alles hieronder wordt door geen enkele regel code meer gelezen of
-- geschreven. Nagekeken met een zoekopdracht over app, lib en components, en
-- gecontroleerd tegen de echte database op 20 september 2026: in alle drie de
-- bestaande concepten staan deze kolommen op hun standaardwaarde, en
-- story_image_url verwijst nergens naar, dus er raakt geen bestand in de
-- opslag zijn eigenaar kwijt.
--
-- Veilig te draaien in één keer. Wel onomkeerbaar: een kolom droppen kan niet
-- terug zonder back-up. Supabase maakt dagelijks een back-up, dus als er iets
-- misgaat is er een weg terug, maar draai dit bij voorkeur op een moment dat
-- je er even bij kunt blijven.

-- ── 1. Ons Verhaal ──────────────────────────────────────────────────────────
-- Deze pagina is verhuisd naar de tabel pages, waar elke pagina zijn eigen
-- content-JSON heeft. De losse kolommen op events zijn sindsdien onaangeroerd.
alter table events
  drop column if exists story_enabled,
  drop column if exists story_title,
  drop column if exists story_text,
  drop column if exists story_image_url,
  drop column if exists story_image_pos_x,
  drop column if exists story_image_pos_y;

-- ── 2. Eén lettertype-kolom van voor de opsplitsing ─────────────────────────
-- Vervangen door font_hero, font_initials, font_frame_names en
-- font_page_titles. Stond in alle rijen nog op de standaard 'playfair'.
alter table events
  drop column if exists title_font;

-- ── 3. De drie datumkolommen van de conceptherinneringen ────────────────────
-- Vervangen door de teller draft_reminder_stap (zie
-- migration_draft_reminder_stap.sql, die al gedraaid is). De teller is uit
-- deze kolommen gevuld en klopt: waar 1 en 2 gezet waren staat de teller op 2,
-- waar alleen 1 gezet was op 1. Ze bleven staan om terug te kunnen rollen; dat
-- is nu niet meer nodig.
alter table events
  drop column if exists draft_reminder_1_sent_at,
  drop column if exists draft_reminder_2_sent_at,
  drop column if exists draft_reminder_3_sent_at;

-- ── 4. De tabel magic_links ─────────────────────────────────────────────────
-- Restant van een eigen inlogsysteem. Inloggen gaat nu via Supabase Auth
-- (signInWithOtp), dus er werd alleen nog uit deze tabel verwijderd en nooit
-- meer in geschreven. De tabel is leeg. De opruimregel in de cron is er al uit.
drop table if exists magic_links;

-- ── Controle ────────────────────────────────────────────────────────────────
-- Draai dit erachteraan; er hoort niets meer uit te komen.
select column_name
from information_schema.columns
where table_name = 'events'
  and column_name in (
    'story_enabled', 'story_title', 'story_text', 'story_image_url',
    'story_image_pos_x', 'story_image_pos_y', 'title_font',
    'draft_reminder_1_sent_at', 'draft_reminder_2_sent_at', 'draft_reminder_3_sent_at'
  );

-- Over facturen, want dat kwam hierbij ter sprake: die zijn al goed geregeld.
-- De koppeling van invoices naar events staat op ON DELETE SET NULL, dus als
-- een bruiloft wordt verwijderd blijft de factuur staan met event_id op null.
-- Getest met een echte factuur en een echte verwijdering. Er hoefde dus niets
-- aan de database te veranderen; wat wel moest was de code, die de facturen
-- expres weggooide voordat de database zijn werk kon doen.
