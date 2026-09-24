import Link from "next/link"
import KaartLijst from "./KaartLijst"
import WebsiteActies from "./WebsiteActies"
import { KLEUR } from "@/lib/ontwerp"
import type { CardRow } from "@/lib/cards"

// De tegels van het dashboard. Less is more, Michiels woorden van 21 september
// 2026: in één klap zien wat belangrijk is. Elke tegel zegt alleen wat er
// echt gebeurd is, en wat je niet hebt gekocht is grijs met één zin en een
// prijs. Geen fasetekst, geen verkooppraat.

const FONT_KOP = "var(--font-cormorant)"

// ── De teller ───────────────────────────────────────────────────────────────
// Met nul gasten geen nullen maar één zin, anders is dit het lege skelet dat
// afschrikt. De cijfers verschijnen zodra de eerste reactie binnen is.
export function Teller({
  gasten,
  komen,
  nietKomen,
  stil,
  heeftBruiloft,
  heeftKaart,
  live,
}: {
  gasten: number
  komen: number
  nietKomen: number
  stil: number
  /** Staat er al iets van deze klant, ook al is het maar een naam en een datum? */
  heeftBruiloft: boolean
  heeftKaart: boolean
  live: boolean
}) {
  if (gasten === 0) {
    // Vier standen, en elke zin hoort bij precies één ervan. Eerder zei hij
    // "nog niets om te tonen" terwijl er al een bewaard concept stond, en dat
    // klopte niet met wat je eronder zag.
    const zin = !heeftBruiloft
      ? "Nog niets om te tonen. Begin met een Save the Date of een trouwkaart; ontwerpen kost niets. Zodra je een ontwerp bewaart, komt het hier te staan, gratis. Pas als je tevreden bent en iets wilt versturen, betaal je."
      : !heeftKaart
        ? "Je bruiloft staat klaar. Maak nu je eerste kaart; ontwerpen kost niets en je betaalt pas als je hem wilt versturen."
        : !live
          ? "Nog niets verstuurd. Activeer je kaart en deel de link, dan verschijnen hier wie er komen en van wie je nog niets hebt gehoord."
          : "Nog geen reacties. Zodra de eerste binnen is, staat hij hier."
    return (
      <div
        className="rounded-2xl px-5 py-4 text-[15px]"
        style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.zand}`, color: KLEUR.tekst }}
      >
        <b style={{ color: KLEUR.inkt }}>{zin.split(". ")[0]}.</b> {zin.split(". ").slice(1).join(". ")}
      </div>
    )
  }

  const cijfer = (label: string, waarde: number, kleur?: string) => (
    <div>
      <dt className="text-[11px] uppercase" style={{ letterSpacing: "0.08em", color: KLEUR.zacht }}>
        {label}
      </dt>
      <dd className="m-0 mt-0.5 tabular-nums" style={{ fontFamily: FONT_KOP, fontSize: 34, lineHeight: 1, color: kleur ?? KLEUR.inkt }}>
        {waarde}
      </dd>
    </div>
  )

  // Altijd drie naast elkaar, ook op een telefoon: drie cijfers op één rij
  // lees je in één blik, drie cijfers op twee rijen niet.
  return (
    <dl
      className="m-0 grid grid-cols-3 gap-4 rounded-2xl px-5 py-4 sm:flex sm:gap-x-10"
      style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.zand}` }}
    >
      {cijfer("Komen", komen, KLEUR.groenTekst)}
      {cijfer("Komen niet", nietKomen)}
      {cijfer("Niets gehoord", stil, stil > 0 ? "#B45309" : undefined)}
    </dl>
  )
}

/**
 * Hoeveel dagen het nog duurt. Rechts naast de naam van de bruiloft.
 *
 * Bewust dagen en geen tikkende klok: een klok die elke seconde verspringt
 * trekt de aandacht weg van waar het dashboard over gaat, en je bruiloft is
 * geen lancering. Dit is groot genoeg om leuk te zijn en rustig genoeg om te
 * blijven staan.
 */
export function Aftellen({ datum }: { datum: string | null }) {
  if (!datum) return null
  const dag = new Date(datum)
  if (Number.isNaN(dag.getTime())) return null

  const nu = new Date()
  const dagen = Math.round(
    (Date.UTC(dag.getUTCFullYear(), dag.getUTCMonth(), dag.getUTCDate()) -
      Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), nu.getUTCDate())) /
      86400000
  )

  const groot = (waarde: string, onder: string) => (
    <div
      className="rounded-2xl px-5 py-3 text-center"
      style={{ backgroundColor: KLEUR.goudVlak, border: `1px solid ${KLEUR.goudLicht}` }}
    >
      <p className="m-0 tabular-nums" style={{ fontFamily: FONT_KOP, fontSize: 38, lineHeight: 1, color: KLEUR.goud }}>
        {waarde}
      </p>
      <p className="m-0 mt-1 text-[11px] uppercase" style={{ letterSpacing: "0.1em", color: KLEUR.zacht }}>
        {onder}
      </p>
    </div>
  )

  if (dagen < 0) return groot("♥", "getrouwd")
  if (dagen === 0) return groot("Vandaag", "de grote dag")
  if (dagen === 1) return groot("1", "dag te gaan")
  return groot(String(dagen), "dagen te gaan")
}

// ── Tegels ──────────────────────────────────────────────────────────────────

export function Chip({ soort, children }: { soort: "goed" | "let-op" | "stil"; children: React.ReactNode }) {
  const stijl =
    soort === "goed"
      ? { backgroundColor: KLEUR.groenVlak, color: KLEUR.groenTekst }
      : soort === "let-op"
        ? { backgroundColor: "#FEF6E7", color: "#B45309" }
        : { backgroundColor: KLEUR.ivoorKaart, color: KLEUR.zacht }
  return (
    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ letterSpacing: "0.03em", ...stijl }}>
      {children}
    </span>
  )
}

export function Tegel({
  titel,
  rechts,
  grijs = false,
  breed = false,
  id,
  children,
}: {
  titel: string
  rechts?: React.ReactNode
  /** Nog niet gekocht: één zin en een prijs, gedempt. */
  grijs?: boolean
  breed?: boolean
  id?: string
  children: React.ReactNode
}) {
  return (
    <article
      id={id}
      /* Een heel lichte nadruk als je er met de muis overheen gaat: de tegel
         komt een pixel omhoog en de schaduw wordt iets dieper. Michiels wens
         van 23 september 2026; subtiel, geen knop-gevoel. */
      className={`flex flex-col gap-3 p-5 rounded-2xl scroll-mt-24 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px ${
        breed ? "md:col-span-2" : ""
      } ${
        grijs
          ? "hover:border-[#E8D5A3]"
          : "shadow-[0_18px_40px_-22px_rgba(26,18,4,0.18)] hover:shadow-[0_22px_44px_-20px_rgba(26,18,4,0.28)] hover:border-[#E8D5A3]"
      }`}
      style={{
        backgroundColor: grijs ? KLEUR.ivoorKaart : "#fff",
        border: `1px ${grijs ? "dashed" : "solid"} ${KLEUR.zand}`,
      }}
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="m-0" style={{ fontFamily: FONT_KOP, fontSize: 21, fontWeight: 600, color: grijs ? KLEUR.zacht : KLEUR.inkt }}>
          {titel}
        </h3>
        {rechts}
      </header>
      {children}
    </article>
  )
}

/** Knopje in een tegel. Zwart voor de hoofdactie, rand voor de rest. */
export function TegelKnop({
  href,
  soort = "rand",
  children,
}: {
  href: string
  soort?: "primair" | "rand" | "actie" | "stil"
  children: React.ReactNode
}) {
  const stijl: React.CSSProperties =
    soort === "primair"
      ? { backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: `1px solid ${KLEUR.inkt}` }
      : soort === "actie"
        ? { backgroundColor: KLEUR.groen, color: "#fff", border: `1px solid ${KLEUR.groen}` }
        : soort === "stil"
          ? { backgroundColor: "transparent", color: KLEUR.tekst, border: `1px solid ${KLEUR.zand}` }
          : { backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}` }
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-[13px] font-semibold min-h-[36px]"
      style={{ ...stijl, textDecoration: "none" }}
    >
      {children}
    </Link>
  )
}

// ── Een kaartsoort met zijn varianten ───────────────────────────────────────
// Eén tegel per soort, één regel per kaart: daggasten, avondgasten, een
// andere taal. Hier zie je ze allemaal en klik je er één open; in de bouwer
// staat alleen nog een keuzelijst.

// Wat een kaart en een tegel tellen. Alleen wat we echt weten: wie ja zei en
// wie nee, in personen. "Verstuurd" en "bekeken" zijn weg: bij een algemene
// link weten we niet hoeveel je er stuurde, en een link die drie keer geopend
// wordt is geen drie gasten (Michiels afweging van 24 september 2026).
export interface Antwoorden {
  komen: number
  komenNiet: number
  /** Kinderen onder wie komen. */
  kinderen: number
}

export interface KaartRegel extends Antwoorden {
  card: CardRow
}

/** Eén antwoord, voor het lijstje "Bekijk reacties" in de tegel. */
export interface Reactie {
  id: string
  naam: string
  komt: boolean
  kind: boolean
}

export interface TegelStand extends Antwoorden {
  /** Hoe groot je gastenlijst is, als je hem gebruikt. Alleen dan weten we
   *  wie nog stil is; anders is dit null. */
  opLijst: number | null
}

export function KaartTegel({
  soort,
  titel,
  prijs,
  uitleg,
  mag,
  live,
  eventId,
  regels,
  stand,
  reacties = [],
}: {
  soort: "save_the_date" | "trouwkaart"
  titel: string
  prijs: string
  uitleg: string
  /** Dekt het pakket deze kaart? */
  mag: boolean
  /** Is de bruiloft geactiveerd, dus werkt de link? */
  live: boolean
  eventId: string | null
  regels: KaartRegel[]
  stand: TegelStand
  /** Wie op dit soort kaart antwoordde, op alle kaarten van dat soort samen. */
  reacties?: Reactie[]
}) {
  const bouwer = eventId ? `/kaart-maken?event_id=${eventId}&type=${soort}` : `/kaart-maken?type=${soort}`

  // Niets gemaakt en niet gekocht: grijs, één zin, een prijs.
  if (regels.length === 0 && !mag) {
    return (
      <Tegel titel={titel} grijs breed rechts={<span className="text-xs font-semibold" style={{ color: KLEUR.goud, letterSpacing: "0.03em" }}>{prijs}</span>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.zacht }}>{uitleg}</p>
        <div className="flex gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="stil">Ontwerpen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  // Betaald, maar nog niets ontworpen.
  if (regels.length === 0) {
    return (
      <Tegel titel={titel} breed rechts={<Chip soort="stil">Nog geen kaart</Chip>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>{uitleg}</p>
        <div className="flex gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="primair">Ontwerpen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  // Eén of meer kaarten. De lijst en de knoppen eronder zitten in KaartLijst;
  // die weet of de link al werkt (betaald) en toont anders het venster met
  // wat activeren kost en oplevert.
  const werkt = live && mag
  const antwoorden = stand.komen + stand.komenNiet
  const chip = !werkt
    ? <Chip soort="stil">Concept</Chip>
    : antwoorden > 0
      ? <Chip soort="goed">{stand.komen} {stand.komen === 1 ? "komt" : "komen"}</Chip>
      : <Chip soort="stil">Klaar om te delen</Chip>
  return (
    <Tegel titel={titel} breed rechts={chip}>
      {/* Geen eigen teller: de stand staat bovenaan het dashboard, en per
          kaart op de regel zelf. Twee tellers onder elkaar was dubbel
          (Michiel, 24 september 2026). */}
      {antwoorden === 0 && (
        <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
          {werkt
            ? "Je kaart is geactiveerd. Deel de link, dan zie je per kaart wie komt en wie niet."
            : "Je ontwerp staat klaar. Kies een kaart, bekijk hem als gast, of vraag de link voor je gasten op."}
        </p>
      )}
      <KaartLijst regels={regels} eventId={eventId} soort={soort} live={werkt} prijs={prijs} />
      {reacties.length > 0 && <ReactieLijst reacties={reacties} />}
    </Tegel>
  )
}

// Wie er op dit soort kaart antwoordde, alle kaarten samen. Een uitklapper,
// zodat de tegel rustig blijft tot je kijkt. Het is een weergave van de
// gastenlijst, geen tweede lijst: een dubbele gast zie je hier dus ook
// (Michiels wens van 24 september 2026).
function ReactieLijst({ reacties }: { reacties: Reactie[] }) {
  const komen = reacties.filter((r) => r.komt).length
  return (
    <details className="group rounded-xl" style={{ border: `1px solid ${KLEUR.zand}` }}>
      <summary
        className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] font-semibold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
        style={{ color: KLEUR.inkt }}
      >
        <span>
          Bekijk reacties{" "}
          <span className="font-normal" style={{ color: KLEUR.zacht }}>
            ({komen} {komen === 1 ? "komt" : "komen"}, {reacties.length - komen} niet)
          </span>
        </span>
        <span aria-hidden className="transition-transform group-open:rotate-180" style={{ color: KLEUR.zacht }}>▾</span>
      </summary>
      <ul className="m-0 p-0 list-none max-h-72 overflow-y-auto" style={{ borderTop: `1px solid ${KLEUR.zand}` }}>
        {reacties.map((r, i) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 px-3 py-1.5 text-[13px]"
            style={{ borderTop: i === 0 ? undefined : `1px solid ${KLEUR.zand}66` }}
          >
            <span style={{ color: KLEUR.inkt }}>
              {r.naam}
              {r.kind && <span className="ml-1.5 text-[11px]" style={{ color: KLEUR.zacht }}>kind</span>}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: r.komt ? KLEUR.groen : "#92400E" }}>
              {r.komt ? "Komt" : "Komt niet"}
            </span>
          </li>
        ))}
      </ul>
      <div className="px-3 py-2 text-right" style={{ borderTop: `1px solid ${KLEUR.zand}` }}>
        <Link href="/dashboard#gasten" className="text-[12px] font-semibold" style={{ color: KLEUR.goud, textDecoration: "none" }}>
          Naar de gastenlijst {"›"}
        </Link>
      </div>
    </details>
  )
}



// ── De website ──────────────────────────────────────────────────────────────

/** Hoeveel dagen tot een datum; nul of negatief betekent voorbij. Buiten de
 *  component, want de dag van vandaag is geen zuivere invoer voor het tekenen. */
function dagenTot(datum: string): number {
  return Math.ceil((new Date(datum).getTime() - Date.now()) / 86_400_000)
}

export function WebsiteTegel({
  mag,
  live,
  eventId,
  adres,
  fotomuurAan,
  fotos,
  heeftOntwerp,
  naam,
  slug,
  geldigTot,
  prijs,
}: {
  mag: boolean
  live: boolean
  eventId: string | null
  adres: string | null
  fotomuurAan: boolean
  fotos: number
  /** Is er in de websitebouwer gewerkt, ook al is er niet betaald? */
  heeftOntwerp: boolean
  /** De naam die het bruidspaar zijn ontwerp gaf, als die er is. */
  naam: string | null
  /** Het webadres, voor het actiemenu. */
  slug: string | null
  /** Tot wanneer de betaalde site geldig is; leeg als er geen einddatum is. */
  geldigTot: string | null
  /** Wat live zetten kost: het verschil als er al iets betaald is. */
  prijs: string
}) {
  const bouwer = eventId ? `/bouwen?event_id=${eventId}` : "/bouwen?plan=compleet"

  // Verlopen, bijna verlopen, of gewoon geldig. Alleen bij een betaalde site.
  const dagenOver = geldigTot ? dagenTot(geldigTot) : null
  const verlopen = dagenOver !== null && dagenOver <= 0
  const bijnaVerlopen = dagenOver !== null && dagenOver > 0 && dagenOver <= 30
  const datumTekst = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  const geldigTekst = geldigTot
    ? verlopen
      ? `Verlopen op ${datumTekst(geldigTot)}`
      : `Geldig tot ${datumTekst(geldigTot)}${bijnaVerlopen ? `, nog ${dagenOver} dagen` : ""}`
    : null

  const menu = eventId && slug ? (
    <WebsiteActies
      eventId={eventId}
      slug={slug}
      live={live && mag}
      prijs={prijs}
      magVerlengen={live && mag && !!geldigTot}
      fotomuurAan={fotomuurAan}
    />
  ) : null

  // Wel gebouwd, nog niet betaald: dezelfde vorm als een kaart in concept.
  // Michiels bevinding van 22 september 2026: hij bouwde een site, ging terug
  // naar het dashboard en zag alleen de grijze verkooptegel, alsof zijn werk
  // weg was.
  if (!mag && heeftOntwerp) {
    return (
      <Tegel titel="Website" breed rechts={<Chip soort="stil">Concept</Chip>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
          Je ontwerp staat klaar. Zet hem live, dan staat je site op internet en kan je trouwkaart
          ernaar verwijzen voor de route, het programma en de cadeautips.
        </p>
        <div className="flex flex-col rounded-xl" style={{ border: `1px solid ${KLEUR.zand}` }}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px]">
            <span className="font-medium flex-1 min-w-[120px]" style={{ color: KLEUR.inkt }}>
              {naam ?? "Jullie website"}
            </span>
            <span style={{ color: KLEUR.zacht }}>Nog niet live</span>
            {menu}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="actie">Live zetten voor {prijs}</TegelKnop>
          <TegelKnop href={bouwer}>Verder bouwen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  if (!mag) {
    return (
      <Tegel titel="Website" grijs breed rechts={<span className="text-xs font-semibold" style={{ color: KLEUR.goud, letterSpacing: "0.03em" }}>{prijs}</span>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.zacht }}>
          Voor alles wat niet op de kaart past: route, programma, cadeautips, en een fotomuur voor de dag zelf. Je kunt hem alvast bouwen; live zetten kost pas geld.
        </p>
        <div className="flex gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="stil">Bouwen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  const chip = !live
    ? <Chip soort="stil">Nog niet live</Chip>
    : verlopen
      ? <Chip soort="stil">Verlopen</Chip>
      : <Chip soort="goed">Live</Chip>
  const aandacht = verlopen || bijnaVerlopen

  return (
    <Tegel titel="Website" breed rechts={chip}>
      <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
        {live && adres
          ? <>Route, programma, cadeautips{fotomuurAan ? `, en de fotomuur staat aan${fotos > 0 ? ` (${fotos} foto's)` : ""}` : ""}.</>
          : "Je site staat klaar om live te zetten. Daarna kan de trouwkaart ernaar verwijzen voor de route, het programma en de cadeautips."}
      </p>
      <div className="flex flex-col rounded-xl" style={{ border: `1px solid ${KLEUR.zand}` }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px]">
          <span className="font-medium flex-1 min-w-[120px]" style={{ color: KLEUR.inkt }}>
            {naam ?? adres ?? "Jullie website"}
          </span>
          {live && adres && naam && (
            <span className="font-mono" style={{ color: KLEUR.zacht }}>{adres}</span>
          )}
          {geldigTekst && (
            <span style={{ color: aandacht ? "#B45309" : KLEUR.zacht }}>{geldigTekst}</span>
          )}
          {menu}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {live ? (
          <>
            {aandacht && eventId && (
              <TegelKnop href={`/verlengen?event_id=${eventId}`} soort="actie">Verlengen voor {"€"}22</TegelKnop>
            )}
            <TegelKnop href={bouwer} soort={aandacht ? "rand" : "primair"}>Bewerken</TegelKnop>
            {adres && <TegelKnop href={`https://${adres}`} soort="stil">Bekijk je site</TegelKnop>}
          </>
        ) : (
          <>
            <TegelKnop href={eventId ? `/betalen?event_id=${eventId}&plan=compleet` : bouwer} soort="actie">Live zetten voor {prijs}</TegelKnop>
            <TegelKnop href={bouwer}>Verder bouwen</TegelKnop>
          </>
        )}
      </div>
    </Tegel>
  )
}
