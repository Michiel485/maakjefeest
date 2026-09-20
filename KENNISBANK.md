# Kennisbank — SayingYes

> **Let op, dit document loopt achter (stand 20 september 2026).** Het is
> geschreven toen er één product was van 49,99 euro. Sindsdien zijn er drie
> pakketten (15, 25 en 49,99; `lib/plans.ts` is de enige bron), digitale
> kaarten met een eigen bouwer, en zijn de drie datumkolommen voor de
> conceptherinneringen vervangen door één teller. Het Stripe-pakket is
> verwijderd; Mollie was en is de enige betaalprovider. Bijwerken staat in
> `TODO.md`. Voor de actuele stand: `lib/plans.ts`, `docs/PLAN-afmaken.md` en
> de commitgeschiedenis.

> Digitale bruiloftswebsite-builder. Bruidsparen maken in minuten een eigen
> trouwwebsite met RSVP, fotogalerij, "ons verhaal" en meer. Eenmalig €49,99
> voor een jaar; verlengen kan per 6 maanden voor €22,00.
>
> Live op **https://sayingyes.nl** (gepubliceerde events op `[slug].sayingyes.nl`).
> Interne projectnaam: `maakjefeest`.

---

## 1. Tech-stack

| Onderdeel        | Keuze |
|------------------|-------|
| Framework        | Next.js **16.2.4** (App Router) — let op: afwijkende/breaking APIs, zie `AGENTS.md` |
| Runtime          | React 19.2 |
| Styling          | Tailwind CSS v4 + inline style-objecten |
| Database & Auth  | **Supabase** (Postgres + Auth, magic-link login) |
| Betalingen       | **Mollie** (`@mollie/api-client`) — Stripe-pakket is geïnstalleerd maar Mollie is de actieve provider |
| E-mail           | **Resend** (afzender `SayingYes <info@sayingyes.nl>`) |
| PDF (facturen)   | `@react-pdf/renderer` (server-only) |
| Export           | `xlsx` (RSVP-export) |
| Hosting          | **Vercel** (auto-deploy via GitHub `git push`) |

### Belangrijke conventies
- **Deploy:** alleen `git push` — GitHub triggert Vercel automatisch. Gebruik **niet** `npx vercel --prod`.
- **Next.js 16:** raadpleeg de docs in `node_modules/next/dist/docs/` vóór het schrijven van code; APIs wijken af van eerdere versies.
- UI/site is primair Nederlandstalig; publieke sites ondersteunen meertaligheid (zie `lib/ui-translations.ts`).

### Environment variabelen (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # publieke anon key
SUPABASE_SERVICE_ROLE_KEY         # backend / service-rol (RLS-bypass)
MOLLIE_API_KEY                    # Mollie betalingen
MOLLIE_WEBHOOK_SECRET             # verificatie Mollie webhook
RESEND_API_KEY                    # transactionele e-mail
SUPABASE_HOOK_SECRET              # verificatie Supabase auth-webhook (Standard Webhooks)
ADMIN_EMAIL                       # bepaalt toegang tot /admin
# CRON_SECRET                     # beveiliging cron-endpoint (Vercel)
```

---

## 2. Architectuur in vogelvlucht

```
Bezoeker / Bruidspaar
        │
        ▼
/aanmaken ─► /bouwen (builder) ─► /betalen (Mollie) ─► /succes ─► gepubliceerde site
        │                                                              │
        ▼                                                              ▼
   magic-link login                                          /events/[slug]  (+ subpagina's)
        │                                                       RSVP-formulier ─► gasten
        ▼
   /dashboard  ◄── beheer events, RSVP's, verlengen (/verlengen)
        
/admin  ── financieel overzicht, facturen, kosten, kortingscodes (alleen ADMIN_EMAIL)

Achtergrond: /api/cron/cleanup (dagelijks 08:00 UTC) ── herinneringen, opschonen drafts, verloop-afhandeling
```

---

## 3. Datamodel (Supabase / Postgres)

Schema in `supabase/schema.sql`, aanvullende migraties in `supabase/migration_draft_cleanup.sql`
en als commentaarblokken onderaan `schema.sql`.

### `events`
Het event en zijn metadata/styling.
`id, user_email, slug (uniek), type (bruiloft|verjaardag|evenement), title,
status (draft|published), stripe_payment_id, created_at`
Uitbreidingen via migratie: `datum, locatie, style (default 'roze'), hero_image_url,
nav_layout, last_active_at, draft_reminder_1_sent_at, draft_reminder_2_sent_at`
(en in de praktijk verloop-/publicatievelden zoals `expires_at`).

### `pages`
Eén rij per pagina binnen een event.
`id, event_id (FK→events, cascade), type (home|programma|rsvp|praktisch|wishlist|fotos),
title, content (jsonb), is_enabled, "order"`
De pagina-inhoud zit als JSON in `content` (flexibel per paginatype).

### `rsvp`
Gastreacties. Basis: `id, event_id (FK), name, email, attending (yes|no|maybe), message, created_at`.
Migraties voor multi-gast & extra velden: `submission_id, is_primary, guest_type (daggast|avondgast),
dietary, song, overnachting, custom_answer, custom_answer_2` (email mag NULL zijn).

### `magic_links`
Tokens voor magic-link login: `id, email, token (uniek), expires_at, used`.
Alleen de service-rol (backend) heeft toegang — geen anon-toegang.

### Overige (impliciet, via app-logica)
`invoices`, `expenses`, `discount_codes` worden door de admin- en betaal-API's gebruikt
(niet in `schema.sql` opgenomen; aangemaakt buiten dit bestand).

### Row Level Security (RLS)
- **events/pages:** eigenaar (`user_email = auth.jwt()->>'email'`) heeft volledige toegang;
  gepubliceerde events/pagina's zijn publiek leesbaar.
- **rsvp:** iedereen mag inzenden voor een gepubliceerd event; alleen de eigenaar mag lezen.
- **magic_links:** geen anon-toegang (alleen service-rol).

---

## 4. API-routes (`app/api/`)

### Authenticatie
| Route | Methode | Doel |
|-------|---------|------|
| `/api/auth/send-email` | POST | Supabase auth-webhook; verifieert handtekening en stuurt magic-link (welkom of terugkerend) via Resend |
| `/api/auth/callback`   | GET  | Wisselt auth-code in voor sessie, zet cookies, redirect naar `/dashboard` of `next` |

### Events & drafts
| Route | Methode | Doel |
|-------|---------|------|
| `/api/events` | POST | Maak event (publieke aanmaakflow); genereert slug + standaardpagina's |
| `/api/events/[event_id]` | GET | Event-metadata ophalen |
| `/api/drafts` | GET/POST | Lijst van events van gebruiker / draft aanmaken of bijwerken (styling, pagina's, wachtwoord) |
| `/api/drafts/[event_id]` | GET | Event + pagina's voor de builder; werkt `last_active_at` bij |
| `/api/event/update-slug` | PATCH | Slug (URL) wijzigen; controleert eigendom + beschikbaarheid |
| `/api/check-slug` | GET | Controleer of slug vrij is (min. 3 tekens) |
| `/api/upload-hero` | POST | Hero-afbeelding uploaden naar Supabase Storage `hero-images` |

### Betalen (Mollie)
| Route | Methode | Doel |
|-------|---------|------|
| `/api/checkout` | POST | Mollie-betaling voor eerste publicatie (€49,99 of korting); geeft checkout-URL |
| `/api/checkout/renewal` | POST | Mollie-betaling voor verlenging 6 mnd (€22,00); auth + eigendomscheck |
| `/api/webhook` | POST | Mollie-webhook (token-geverifieerd). Bij `paid`: publiceren of verlengen, factuur+PDF aanmaken, e-mail versturen |
| `/api/activate-free` | POST | Publiceren met gratis kortingscode (geen betaling); €0-factuur + live-mail |
| `/api/discount` | GET | Kortingscode valideren (type, waarde, eindbedrag, vervaldatum, gebruikslimiet) |

### RSVP
| Route | Methode | Doel |
|-------|---------|------|
| `/api/rsvp` | POST | RSVP('s) inzenden voor gepubliceerd event; bevestiging + admin-notificatie per mail |
| `/api/rsvp/[id]` | PATCH/DELETE | RSVP bijwerken of verwijderen (alleen eigenaar) |

### Admin (vereist match met `ADMIN_EMAIL`)
| Route | Methode | Doel |
|-------|---------|------|
| `/api/admin/discount-codes` (+`/[id]`) | GET/POST/PATCH/DELETE | Kortingscodes beheren |
| `/api/admin/expenses` (+`/[id]`) | GET/POST/DELETE | Kosten/uitgaven beheren (boekhouding) |
| `/api/admin/invoices` | GET | Facturen overzicht |
| `/api/admin/invoices/[id]/pdf` | GET | Factuur-PDF downloaden |
| `/api/admin/stats` | GET | Jaar-financiën: omzet, kosten, winst, BTW, maand/kwartaal, recente transacties |
| `/api/admin/upload` | POST | Kostenbon uploaden naar bucket `expense-docs` |
| `/api/admin/export` | GET | Export (RSVP/data, o.a. via `xlsx`) |

### Cron
| Route | Methode | Doel |
|-------|---------|------|
| `/api/cron/cleanup` | GET | Dagelijks 08:00 UTC (Vercel). Verwijdert oude magic-links, stuurt draft-herinneringen (dag 7 & week 7), verwijdert drafts na 8 weken inactiviteit, markeert verlopen events en stuurt verleng-/verloopwaarschuwingen |

---

## 5. Gebruikersflows (pagina's onder `app/`)

- **`/aanmaken`** — Aanmaakformulier: namen, datum, e-mail, gewenste slug (realtime check). Slaat draft lokaal op; stuurt magic-link of gaat door naar de builder. → `/bouwen?event_id=...`
- **`/bouwen`** — WYSIWYG-builder. Bewerkt metadata, hero-afbeelding, 8 paginatypes (Home, Programma, RSVP, Informatie, Cadeautips, Foto's, Ceremoniemeesters, Ons Verhaal), homepage-instellingen (layout, fonts, zichtbaarheid, initialen/kader), wachtwoordbeveiliging. Live preview (desktop/mobiel), auto-save naar Supabase, Sophie-tutorial-overlay.
- **`/betalen`** — Checkout: basisprijs €49,99 + kortingsveld (realtime validatie), eindbedrag, → Mollie. Behandelt geannuleerde/mislukte betalingen.
- **`/verlengen`** — Abonnement 6 mnd verlengen (€22,00) voor gepubliceerd event; auth vereist → Mollie; `expires_at` +6 maanden.
- **`/succes`** — Bevestiging "Website is live!": site-URL (link + kopieerknop), WhatsApp-deellink, link naar dashboard.
- **`/inloggen`** — Magic-link login: e-mail invoeren → mail via Resend → klik → `/api/auth/callback` → `/dashboard`.
- **`/dashboard`** — Hub: alle events (concept/live/verloopt/verlopen), slug inline bewerken, verloop-teller, bekijk-site-link, verlengen/verwijderen, RSVP-beheer (filteren, bewerken, verwijderen, exporteren).
- **Statische pagina's:** `/contact`, `/privacy`, `/voorwaarden`. SEO: `/robots.ts`, `/sitemap.ts`, JSON-LD in root-layout.

---

## 6. Publieke event-site (`app/events/[slug]/`)

Gepubliceerde sites draaien op `[slug].sayingyes.nl` (subdomein in productie; padroute `/events/[slug]` in dev — zie `proxy.ts` + `lib/site-url.ts`).

- **`layout.tsx`** — navigatie, content, footer; regelt de wachtwoord-gate.
- **`page.tsx`** (Home) — hero, optioneel kader (initialen/namen/datum/locatie), titel/subtitel met instelbare fonts, intro-tekst, navigatie naar subpagina's (of anchor-links bij single-page-modus), optionele RSVP-preview.
- **`[type]/page.tsx`** — rendert een subpagina op type.
- **Paginatypes:** Home, Programma (tijdlijn met iconen), RSVP (multi-gast-formulier), Informatie/Praktisch (dresscode, dieet, etiquette), Cadeautips/Wishlist, Foto's (galerij), Ceremoniemeesters, Ons Verhaal.
- **EventGatekeeper:** wachtwoord, geheime vraag (hoofdletterongevoelig), of openbaar.

---

## 7. Adminpaneel (`app/admin/`)

- **`/admin`** — financieel dashboard huidig jaar: KPI's (omzet, kosten, winst, BTW ontvangen/betaald/verschuldigd), maandgrafiek, kwartaal-BTW, 30 recente transacties.
- **`/admin/kortingscodes`** — kortingscodes CRUD (type free/fixed/percentage, waarde, max gebruik, vervaldatum, actief/inactief; statusbadges).
- **`/admin/kosten`** — uitgaven/boekhouding: categorie, bedrag (incl.), BTW-tarief, bonupload, downloads via signed URLs.
- **`/admin/facturen`** — alle klantfacturen; PDF-download (opgeslagen als `{jaar}/{factuurnummer}.pdf` in Storage).

---

## 8. Library (`lib/`)

| Bestand | Functie |
|---------|---------|
| `supabase.ts` | Browser-client (anon) + service-client (service-rol, backend) |
| `supabase-server.ts` | Server-client met cookie-gebaseerde sessie |
| `admin-auth.ts` | Controleert of ingelogde gebruiker = `ADMIN_EMAIL` |
| `site-url.ts` | Bouwt event-URL's (subdomein in prod, padroute in dev) |
| `mail.ts` | Resend-helpers: RSVP-bevestiging, admin-notificatie, live-/verleng-mails |
| `invoice-pdf.tsx` | React-PDF-component + renderer voor facturen |
| `ui-translations.ts` | i18n-woordenboek (nl, en, de, fr, es, it) voor publieke sites |
| `event-styles.ts` | `STYLE_CONFIG` — themadefinities (kleuren, fonts, achtergronden) per stijl (bv. `roze`, `ivoor`) |
| `title-fonts.ts` | ~14 decoratieve titel-fonts (Allura, Playfair, Pinyon Script, …) |

### Hooks & componenten
- `hooks/useUILocale.ts` — bepaalt actieve UI-taal.
- `components/` — preview/editor-widgets gebruikt in builder én publieke site:
  `EventHomePreview`, `EventProgramPreview`, `PraktischPreview`, `WishlistPreview`,
  `FotosPreview`, `EventMastersPreview`, `StoryPreview`, `EventGatekeeper`,
  `SophieTutorial` (builder-rondleiding), `NavLoginButton`, `LanguageSwitcher`,
  `ResetGoogleTranslate`, `BackToTopButton`.

---

## 9. Configuratie & scripts

- **`next.config.ts`** — `@react-pdf/renderer` als server-external; remote images toegestaan vanaf `*.sayingyes.nl`.
- **`proxy.ts`** — subdomein-routing naar `/events/[slug]`.
- **`vercel.json`** — cron-job: `/api/cron/cleanup` dagelijks om 08:00 UTC (`0 8 * * *`).
- **`scripts/`** — eenmalige hulpscripts (Node `.mjs` + Python) voor het verwerken van assets:
  iconen vervangen, video's/afbeeldingen sorteren, witranden/bladgoud uit afbeeldingen knippen, kleuren samplen.

---

## 10. Prijzen (kort)

| Item | Bedrag |
|------|--------|
| Eerste publicatie (1 jaar) | **€49,99** eenmalig |
| Verlenging (6 maanden) | **€22,00** |
| Gratis publicatie | via gratis kortingscode (`/api/activate-free`, €0-factuur) |

---

_Laatst bijgewerkt: 2026-06-27. Gegenereerd uit een analyse van de projectcode._
