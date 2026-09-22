import Link from "next/link"
import { KLEUR } from "@/lib/ontwerp"
import type { CardRow } from "@/lib/cards"
import { GUEST_TYPE_LABEL, CARD_TAAL_KORT, cardTaal, type CardGuestType } from "@/lib/cards"

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
      className={`flex flex-col gap-3 p-5 rounded-2xl scroll-mt-24 ${breed ? "md:col-span-2" : ""}`}
      style={{
        backgroundColor: grijs ? KLEUR.ivoorKaart : "#fff",
        border: `1px ${grijs ? "dashed" : "solid"} ${KLEUR.zand}`,
        boxShadow: grijs ? "none" : "0 18px 40px -22px rgba(26,18,4,0.18)",
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

export interface KaartRegel {
  card: CardRow
  /** Naar hoeveel gasten deze kaart is gestuurd, voor zover we dat weten:
   *  wat het bruidspaar aangaf bij verstuurd zetten, plus wie via de link
   *  antwoordde. */
  verstuurd: number
  /** Hoeveel gasten via deze kaart hebben gereageerd. */
  gereageerd: number
}

function kaartNaam(card: CardRow): string {
  const groep = card.content.guestType ? GUEST_TYPE_LABEL[card.content.guestType as CardGuestType] : "Alle gasten"
  const taal = cardTaal(card.content.taal)
  return taal === "nl" ? groep : `${groep} · ${CARD_TAAL_KORT[taal]}`
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
  verstuurd,
  gereageerd,
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
  verstuurd: number
  gereageerd: number
}) {
  const bouwer = eventId ? `/kaart-maken?event_id=${eventId}&type=${soort}` : `/kaart-maken?type=${soort}`

  // Niets gemaakt en niet gekocht: grijs, één zin, een prijs.
  if (regels.length === 0 && !mag) {
    return (
      <Tegel titel={titel} grijs rechts={<span className="text-xs font-semibold" style={{ color: KLEUR.goud, letterSpacing: "0.03em" }}>{prijs}</span>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.zacht }}>{uitleg}</p>
        <div className="flex gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="stil">Ontwerpen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  // Wel iets gemaakt, nog niet geactiveerd: concept met een knop om te activeren.
  if (!live || !mag) {
    return (
      <Tegel titel={titel} rechts={<Chip soort="stil">Concept</Chip>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
          Je ontwerp staat klaar. Activeer hem, dan krijg je de link om te delen en vult je gastenlijst zich met wie antwoordt.
        </p>
        {regels.length > 1 && <Varianten regels={regels} eventId={eventId} />}
        <div className="flex flex-wrap gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="actie">Activeer voor {prijs}</TegelKnop>
          <TegelKnop href={bouwer}>Verder ontwerpen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  return (
    <Tegel titel={titel} rechts={<Chip soort={verstuurd > 0 ? "goed" : "stil"}>{verstuurd > 0 ? `${verstuurd} verstuurd` : "Klaar om te delen"}</Chip>}>
      {regels.length > 0 ? (
        <Varianten regels={regels} eventId={eventId} />
      ) : (
        <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>{uitleg}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <TegelKnop href={`/dashboard#kaarten`} soort="primair">Deel de kaart</TegelKnop>
        <TegelKnop href={bouwer}>+ Nieuwe variant</TegelKnop>
        {gereageerd > 0 && (
          <span className="text-xs" style={{ color: KLEUR.zacht }}>{gereageerd} gereageerd</span>
        )}
      </div>
    </Tegel>
  )
}

function Varianten({ regels, eventId }: { regels: KaartRegel[]; eventId: string | null }) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ border: `1px solid ${KLEUR.zand}` }}>
      {regels.map((r, i) => (
        <div
          key={r.card.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px]"
          style={{ borderTop: i === 0 ? undefined : `1px solid ${KLEUR.zand}` }}
        >
          <span className="font-medium flex-1 min-w-[120px]" style={{ color: KLEUR.inkt }}>{kaartNaam(r.card)}</span>
          <span className="tabular-nums" style={{ color: KLEUR.zacht }}>
            {r.verstuurd} verstuurd {"·"} {r.gereageerd} gereageerd {"·"} {r.card.view_count}{"×"} bekeken
          </span>
          <Link
            href={`/kaart-maken?event_id=${eventId ?? r.card.event_id}&card_id=${r.card.id}&type=${r.card.type}`}
            className="text-[13px] font-semibold ml-auto"
            style={{ color: KLEUR.goud, textDecoration: "none" }}
          >
            Openen
          </Link>
        </div>
      ))}
    </div>
  )
}

// ── De website ──────────────────────────────────────────────────────────────

export function WebsiteTegel({
  mag,
  live,
  eventId,
  adres,
  fotomuurAan,
  fotos,
}: {
  mag: boolean
  live: boolean
  eventId: string | null
  adres: string | null
  fotomuurAan: boolean
  fotos: number
}) {
  const bouwer = eventId ? `/bouwen?event_id=${eventId}` : "/bouwen?plan=compleet"

  if (!mag) {
    return (
      <Tegel titel="Website" grijs breed rechts={<span className="text-xs font-semibold" style={{ color: KLEUR.goud, letterSpacing: "0.03em" }}>{"€"}49,99</span>}>
        <p className="m-0 text-sm" style={{ color: KLEUR.zacht }}>
          Voor alles wat niet op de kaart past: route, programma, cadeautips, en een fotomuur voor de dag zelf. Je kunt hem alvast bouwen; live zetten kost pas geld.
        </p>
        <div className="flex gap-2 mt-auto">
          <TegelKnop href={bouwer} soort="stil">Bouwen</TegelKnop>
        </div>
      </Tegel>
    )
  }

  return (
    <Tegel titel="Website" breed rechts={<Chip soort={live ? "goed" : "stil"}>{live ? "Live" : "Nog niet live"}</Chip>}>
      <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
        {live && adres ? (
          <>
            <b style={{ color: KLEUR.inkt }}>{adres}</b> {"·"} route, programma, cadeautips
            {fotomuurAan ? `, fotomuur aan${fotos > 0 ? ` (${fotos} foto's)` : ""}` : ""}.
          </>
        ) : (
          "Je site staat klaar om live te zetten. Daarna kan de trouwkaart ernaar verwijzen voor de route, het programma en de cadeautips."
        )}
      </p>
      <div className="flex flex-wrap gap-2 mt-auto">
        <TegelKnop href={bouwer} soort={live ? "rand" : "actie"}>{live ? "Bewerken" : "Live zetten"}</TegelKnop>
        {live && adres && <TegelKnop href={`https://${adres}`} soort="stil">Bekijk je site</TegelKnop>}
        {fotomuurAan && <TegelKnop href="/dashboard#fotos" soort="stil">Fotomuur</TegelKnop>}
      </div>
    </Tegel>
  )
}
