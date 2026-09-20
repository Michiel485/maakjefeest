-- Dode kolommen en een dode tabel opruimen.
--
-- Alles hieronder wordt door geen enkele regel code meer gelezen of
-- geschreven; nagekeken met een zoekopdracht over app, lib en components op
-- 20 september 2026. Dat is gecontroleerd tegen de echte database: in alle
-- drie de bestaande concepten staan de story-kolommen op hun standaardwaarde
-- en verwijst story_image_url naar niets, dus er raakt geen bestand zijn
-- eigenaar kwijt.
--
-- Draai dit pas als de huidige versie een tijdje goed loopt. Kolommen droppen
-- is niet terug te draaien zonder back-up.

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
-- migration_draft_reminder_stap.sql). De teller is uit deze kolommen gevuld en
-- klopt: waar 1 en 2 gezet waren staat de teller op 2, waar alleen 1 gezet was
-- op 1. Ze bleven staan om terug te kunnen rollen; dat is nu niet meer nodig.
alter table events
  drop column if exists draft_reminder_1_sent_at,
  drop column if exists draft_reminder_2_sent_at,
  drop column if exists draft_reminder_3_sent_at;

-- ── 4. De tabel magic_links ─────────────────────────────────────────────────
-- Restant van een eigen inlogsysteem. Inloggen gaat nu via Supabase Auth
-- (signInWithOtp), dus er werd alleen nog uit deze tabel verwijderd en nooit
-- meer in geschreven. De tabel is leeg. De opruimregel in de cron is er al uit.
drop table if exists magic_links;
