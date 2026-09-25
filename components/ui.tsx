// De bouwstenen van de vormgeving: knop, paneel, veld en melding.
//
// Waarom: "betrouwbaar" komt niet uit kleur maar uit gedrag. De drie dingen
// die overal ontbraken en het meest opvallen zijn een knop die niet laat zien
// dat hij bezig is, een foutmelding die alleen zegt dat iets mislukte, en
// beeld dat verspringt. De eerste twee zitten hier in de bouwsteen, zodat ze
// nergens meer vergeten kunnen worden.
//
// Geen "use client": deze componenten hebben geen hooks. Daardoor werken ze
// zowel in een serverpagina als in een clientcomponent die er een onClick aan
// meegeeft.

import Link from "next/link"
import { KLEUR, VORM } from "@/lib/ontwerp"

// ── Knop ────────────────────────────────────────────────────────────────────

export type KnopSoort = "primair" | "actie" | "rustig" | "rand" | "gevaar"

const KNOP_STIJL: Record<KnopSoort, React.CSSProperties> = {
  // De hoofdactie op een lichte achtergrond
  primair: { backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: "none" },
  // Doorgaan, activeren, betalen: de stap waar geld of verzenden bij komt
  actie: { backgroundColor: KLEUR.groen, color: "#fff", border: "none", boxShadow: VORM.schaduwGroen },
  // Een tweede actie die er wel mag zijn, zoals bewaren
  rustig: { backgroundColor: KLEUR.goudVlak, color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}` },
  // Een derde actie, alleen een rand
  rand: { backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}` },
  // Verwijderen
  gevaar: { backgroundColor: "#fff", color: KLEUR.rood, border: `1px solid ${KLEUR.rood}55` },
}

interface KnopBasis {
  soort?: KnopSoort
  /** Laat de knop zien dat hij bezig is en blokkeert een tweede klik. */
  bezig?: boolean
  /** Tekst tijdens het bezig zijn. Standaard "Bezig..." */
  bezigTekst?: string
  klein?: boolean
  breed?: boolean
  children: React.ReactNode
  className?: string
}

type KnopProps =
  | (KnopBasis & { href: string; onClick?: never; type?: never; disabled?: never; nieuwTabblad?: boolean })
  | (KnopBasis & {
      href?: never
      onClick?: () => void
      type?: "button" | "submit"
      disabled?: boolean
      nieuwTabblad?: never
    })

export function Knop(props: KnopProps) {
  const { soort = "primair", bezig = false, bezigTekst = "Bezig...", klein, breed, children, className = "" } = props

  const maat = klein ? "text-xs px-3 py-2" : "text-sm px-4 py-2.5"
  const cls = `inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-60 ${maat} ${breed ? "w-full" : ""} ${className}`
  const stijl: React.CSSProperties = {
    ...KNOP_STIJL[soort],
    borderRadius: VORM.hoekKlein,
    textDecoration: "none",
    cursor: bezig ? "default" : "pointer",
  }

  const inhoud = bezig ? (
    <>
      <Draaier />
      {bezigTekst}
    </>
  ) : (
    children
  )

  if ("href" in props && props.href) {
    // Een link kan niet "bezig" zijn; die navigeert gewoon
    return (
      <Link
        href={props.href}
        className={cls}
        style={stijl}
        {...(props.nieuwTabblad ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled || bezig}
      className={cls}
      style={stijl}
      // Voor wie met een schermlezer werkt: "bezig" is anders onzichtbaar
      aria-busy={bezig || undefined}
    >
      {inhoud}
    </button>
  )
}

/** Het rondje dat laat zien dat er iets gebeurt. Puur CSS, geen JavaScript. */
export function Draaier({ maat = 14 }: { maat?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: maat,
        height: maat,
        borderRadius: "50%",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        display: "inline-block",
        animation: "sy-draai 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  )
}

// ── Melding ─────────────────────────────────────────────────────────────────

export type MeldingSoort = "goed" | "fout" | "bezig"

const MELDING_STIJL: Record<MeldingSoort, React.CSSProperties> = {
  goed: { backgroundColor: KLEUR.groenVlak, color: KLEUR.groenTekst },
  fout: { backgroundColor: KLEUR.roodVlak, color: KLEUR.roodTekst },
  bezig: { backgroundColor: KLEUR.goudVlak, color: KLEUR.inkt },
}

/**
 * Een melding vertelt wat er gebeurd is én wat je nu kunt doen. Dat tweede is
 * waar het meestal aan ontbrak: "opslaan mislukt" laat iemand met lege handen
 * staan. Geef daarom waar mogelijk een `actie` mee.
 */
export function Melding({
  soort,
  children,
  actie,
}: {
  soort: MeldingSoort
  children: React.ReactNode
  /** Wat de bezoeker nu kan doen: een knop of een link. */
  actie?: React.ReactNode
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm text-center"
      style={MELDING_STIJL[soort]}
      role={soort === "fout" ? "alert" : "status"}
    >
      {soort === "bezig" && <Draaier />}
      <span>{children}</span>
      {actie}
    </div>
  )
}

// ── Paneel ──────────────────────────────────────────────────────────────────

/** Een kaartje op de lichte achtergrond. */
export function Paneel({
  children,
  className = "",
  donker = false,
}: {
  children: React.ReactNode
  className?: string
  donker?: boolean
}) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        backgroundColor: donker ? KLEUR.donkerKaart : "#fff",
        border: `1px solid ${donker ? "#ffffff14" : KLEUR.goudLicht}`,
        borderRadius: VORM.hoek,
        boxShadow: donker ? "none" : VORM.schaduw,
      }}
    >
      {children}
    </div>
  )
}

// ── Veld ────────────────────────────────────────────────────────────────────

/**
 * Label, invoer, hulptekst en fout in één. De fout staat onder het veld en
 * niet bovenaan de pagina, want daar kijkt niemand.
 */
export function Veld({
  label,
  hint,
  fout,
  children,
}: {
  label: string
  hint?: string
  fout?: string | null
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: KLEUR.inkt }}>
        {label}
      </span>
      {children}
      {hint && !fout && (
        <span className="text-[11px] leading-snug" style={{ color: KLEUR.zacht }}>
          {hint}
        </span>
      )}
      {fout && (
        <span className="text-[11px] leading-snug font-semibold" style={{ color: KLEUR.roodTekst }}>
          {fout}
        </span>
      )}
    </label>
  )
}

/** De klassen en stijl van een invoerveld, voor waar geen Veld om past. */
export const invoerKlassen =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2"
export const invoerStijl: React.CSSProperties = {
  color: KLEUR.inkt,
  borderColor: KLEUR.goudLicht,
}

// ── Inklapbare stap in de zijbalk van een bouwer ────────────────────────────
// Stond als lokale functie in de kaartbouwer, en als met de hand uitgetypte
// HTML op drie plekken in de websitebouwer: letterlijk dezelfde klassen, dus
// ooit gekopieerd. Twee kopieën lopen uit elkaar, en dat is precies wat
// Michiel voelt als "twee producten die op elkaar lijken". Eén bron dus.
//
// Bewust een los component en niet iets binnen een pagina: anders wordt het
// bij elke render een nieuw componenttype en verliezen de invoervelden erin
// hun focus bij elke toetsaanslag.

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/**
 * Alleen de kop van een stap: de knop met de titel en het pijltje. Los
 * beschikbaar omdat de websitebouwer zijn eigen inhoud onder de kop heeft,
 * met rijen die hun eigen randen tekenen. Die inhoud blijft van hem; de kop
 * komt hier vandaan, zodat beide bouwers dezelfde kop hebben.
 */
export function SectieKop({
  titel,
  open,
  onToggle,
  uitgelicht = false,
  vast = false,
}: {
  titel: string
  open: boolean
  onToggle: () => void
  uitgelicht?: boolean
  /** Geen uitklapper maar een gewoon kopje, bijvoorbeeld in een paneel op de telefoon. */
  vast?: boolean
}) {
  if (vast) {
    return (
      <div className="px-5 pt-4 pb-2">
        <span
          className={`text-left text-xs font-bold uppercase tracking-widest ${uitgelicht ? "" : "text-gray-500"}`}
          style={uitgelicht ? { color: KLEUR.goud } : undefined}
        >
          {titel}
        </span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors min-h-[44px]"
    >
      <span
        className={`text-left text-xs font-bold uppercase tracking-widest ${uitgelicht ? "" : "text-gray-500"}`}
        style={uitgelicht ? { color: KLEUR.goud } : undefined}
      >
        {titel}
      </span>
      <span className="text-gray-400">
        <Chevron open={open} />
      </span>
    </button>
  )
}

export function Sectie({
  titel,
  open,
  onToggle,
  children,
  /** De eerste stap, die je altijd invult: valt op in goud. */
  uitgelicht = false,
  kaal = false,
  className,
  vast = false,
}: {
  titel: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  uitgelicht?: boolean
  /**
   * Geen binnenrand om de inhoud. Voor de websitebouwer, waar de inhoud zelf
   * uit rijen met eigen randen bestaat; die zouden met een rand eromheen
   * dubbel ingesprongen staan. De kop is dan gedeeld, de inhoud blijft
   * precies zoals hij was.
   */
  kaal?: boolean
  className?: string
  /** Altijd open, met een gewoon kopje in plaats van een uitklapper. */
  vast?: boolean
}) {
  return (
    <div className={`border-b border-gray-100 ${className ?? ""}`}>
      <SectieKop titel={titel} open={open || vast} onToggle={onToggle} uitgelicht={uitgelicht} vast={vast} />
      {(open || vast) && (kaal ? children : <div className="px-5 pb-5 flex flex-col gap-4">{children}</div>)}
    </div>
  )
}
