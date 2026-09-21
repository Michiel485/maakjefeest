import Link from "next/link"
import {
  FASE_NAAM,
  FASE_ORDE,
  FASE_UITLEG,
  FASE_WANNEER,
  afstandInWoorden,
  faseIndex,
  type Fase,
} from "@/lib/fasen"
import { straksVoor, tegelsVoor, type Stand, type Tegel } from "@/lib/dashboard-tegels"

const GOLD = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG = "#FBF5E8"
const CHARCOAL = "#1A1A1A"
const BODY = "#5C5248"
const SOFT = "#9A8E82"
const IVORY_CARD = "#F5EFE4"
const GREEN_BG = "#ECFDF5"
const GREEN_TEXT = "#065F46"
const ATTN = "#B45309"
const ATTN_BG = "#FEF6E7"

// De kop van het dashboard: één bruiloft, de fase waarin je zit, en wat er nu
// telt. Uit het klantreisgesprek van 21 september 2026.
//
// De fasenbalk is met opzet niet klikbaar. Hij zegt alleen waar je bent.
// Vooruitkijken doe je in de checklist, waar je elke fase kunt openklappen, en
// in de band Straks hieronder. Drie manieren om vooruit te kijken zou het
// scherm rommelig maken, en dat is precies wat we aan het oplossen zijn.

export default function Bruiloft({
  titel,
  fase,
  stand,
}: {
  titel: string
  fase: Fase
  stand: Stand
}) {
  const tegels = tegelsVoor(fase, stand)
  const straks = straksVoor(fase, stand)
  const nu = faseIndex(fase)

  const datum = stand.datum
    ? new Date(stand.datum).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="flex flex-col gap-8">
      {/* ── De bruiloft ─────────────────────────────────────────────────── */}
      <header
        className="flex flex-wrap items-end justify-between gap-4"
        style={{ paddingBottom: 20, borderBottom: `1px solid ${GOLD_LIGHT}` }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.9rem, 4.5vw, 2.75rem)",
              fontWeight: 600,
              lineHeight: 1.05,
              color: CHARCOAL,
              margin: 0,
            }}
          >
            {titel}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: SOFT }}>
            {[datum, stand.locatie].filter(Boolean).join(" · ")}
            {(datum || stand.locatie) && " · "}
            <span style={{ color: BODY }}>{afstandInWoorden(stand.datum)}</span>
          </p>
        </div>
      </header>

      {/* ── De fasenbalk ──────────────────────────────────────────────────
          Op een telefoon past hij niet: de fase waarin je zit valt dan buiten
          het scherm, en dat is precies het enige dat de balk moet vertellen.
          Daar staat dus één regel in plaats van zes kolommen. */}
      <p className="sm:hidden -mt-2 m-0 text-sm">
        <span style={{ color: SOFT }}>
          Stap {nu + 1} van {FASE_ORDE.length}
          {"  ·  "}
        </span>
        <span style={{ color: CHARCOAL, fontWeight: 600 }}>{FASE_NAAM[fase]}</span>
      </p>

      <nav aria-label="Waar je bent in de planning" className="hidden sm:block overflow-x-auto -mt-2">
        <ol className="flex list-none m-0 p-0" style={{ minWidth: 620 }}>
          {FASE_ORDE.map((f, i) => {
            const isNu = i === nu
            const voorbij = i < nu
            return (
              <li key={f} className="flex-1">
                <div
                  aria-current={isNu ? "step" : undefined}
                  className="px-2.5 pt-3.5 pb-3"
                  style={{
                    borderTop: `3px solid ${isNu ? GOLD : voorbij ? GOLD_LIGHT : IVORY_CARD}`,
                  }}
                >
                  <span className="block text-[11px] tracking-wide" style={{ color: SOFT }}>
                    {FASE_WANNEER[f]}
                  </span>
                  <span
                    className="block text-[13px]"
                    style={{
                      color: isNu ? CHARCOAL : voorbij ? BODY : SOFT,
                      fontWeight: isNu ? 600 : 500,
                    }}
                  >
                    {FASE_NAAM[f]}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ── Nu ──────────────────────────────────────────────────────────── */}
      <section>
        <BandKop>Nu</BandKop>
        <p className="text-sm mb-4 max-w-[62ch]" style={{ color: SOFT }}>
          {FASE_UITLEG[fase]}
        </p>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))" }}>
          {tegels.map((t) => (
            <TegelKaart key={t.id} tegel={t} />
          ))}
        </div>
      </section>

      {/* ── Straks ──────────────────────────────────────────────────────── */}
      {straks.length > 0 && (
        <section>
          <BandKop>Straks</BandKop>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: IVORY_CARD }}
          >
            {straks.map((p, i) => (
              <details
                key={p.wat}
                style={{ borderTop: i === 0 ? undefined : `1px solid ${GOLD_LIGHT}` }}
              >
                <summary
                  className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-4 py-3.5"
                  style={{ cursor: "pointer", listStyle: "none" }}
                >
                  <span className="font-medium flex-1 min-w-[200px]" style={{ color: CHARCOAL }}>
                    {p.wat}
                  </span>
                  <span className="text-[13px] tabular-nums" style={{ color: SOFT }}>
                    {p.vanaf}
                  </span>
                  <span className="text-xs font-semibold tracking-wide" style={{ color: GOLD }}>
                    {p.prijs}
                  </span>
                </summary>
                <div className="px-4 pb-4 max-w-[70ch] flex flex-col gap-2.5">
                  {p.uitleg.map((r, j) => (
                    <p key={j} className="text-sm m-0" style={{ color: BODY }}>
                      {r}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BandKop({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 m-0 mb-3.5">
      <span
        className="text-[11px] font-semibold uppercase"
        style={{ letterSpacing: "0.14em", color: SOFT }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, backgroundColor: GOLD_LIGHT }} />
    </h2>
  )
}

function TegelKaart({ tegel }: { tegel: Tegel }) {
  const chipStijl =
    tegel.toon === "vraagt"
      ? { backgroundColor: ATTN_BG, color: ATTN }
      : tegel.toon === "op_tijd"
        ? { backgroundColor: GREEN_BG, color: GREEN_TEXT }
        : { backgroundColor: IVORY_CARD, color: SOFT }

  return (
    <article
      className="flex flex-col gap-3.5 p-5 rounded-2xl"
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${tegel.toon === "vraagt" ? GOLD : GOLD_LIGHT}`,
        boxShadow: "0 18px 40px -22px rgba(26,18,4,0.18)",
      }}
    >
      <header className="flex items-baseline justify-between gap-2.5">
        <h3
          className="m-0"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: 21, fontWeight: 600, color: CHARCOAL }}
        >
          {tegel.titel}
        </h3>
        <span
          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
          style={{ letterSpacing: "0.03em", ...chipStijl }}
        >
          {tegel.chip}
        </span>
      </header>

      {tegel.cijfers && tegel.cijfers.length > 0 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-4 m-0 tabular-nums">
          {tegel.cijfers.map((c) => (
            <div key={c.wat} style={{ minWidth: 64 }}>
              <dt
                className="text-[11px] uppercase"
                style={{ letterSpacing: "0.06em", color: SOFT }}
              >
                {c.wat}
              </dt>
              <dd
                className="m-0 mt-0.5"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: 30, lineHeight: 1, color: CHARCOAL }}
              >
                {c.waarde}
                {c.bij && (
                  <span className="ml-1 text-xs" style={{ fontFamily: "inherit", color: SOFT }}>
                    {c.bij}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {tegel.stand && (
        <div
          className="flex rounded-full overflow-hidden"
          style={{ height: 8, backgroundColor: IVORY_CARD }}
          role="img"
          aria-label="Stand van de reacties"
        >
          <span style={{ width: `${tegel.stand.ja}%`, backgroundColor: "#059669" }} />
          <span style={{ width: `${tegel.stand.nee}%`, backgroundColor: GOLD_LIGHT }} />
        </div>
      )}

      {tegel.tekst && (
        <p className="text-sm m-0" style={{ color: BODY }}>
          {tegel.tekst}
        </p>
      )}

      {tegel.acties && tegel.acties.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {tegel.acties.map((a) => (
            <Link
              key={a.wat}
              href={a.naar}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium"
              style={
                a.stil
                  ? { border: `1px solid ${GOLD_LIGHT}`, color: BODY }
                  : { backgroundColor: CHARCOAL, color: "#fff", border: `1px solid ${CHARCOAL}` }
              }
            >
              {a.wat}
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}

/** De band Altijd: klein, want wat er altijd is hoort niet om aandacht te vechten. */
export function Altijd({
  gasten,
  ontwerpen,
  magSite,
}: {
  gasten: number
  ontwerpen: number
  magSite: boolean
}) {
  const links: { wat: string; naar: string; bij?: number }[] = [
    { wat: "Je gastenlijst", naar: "#gasten", bij: gasten },
    { wat: "Je kaarten", naar: "#kaarten" },
    ...(ontwerpen > 0 ? [{ wat: "Je ontwerpen", naar: "#ontwerpen", bij: ontwerpen }] : []),
    ...(magSite ? [{ wat: "Je fotomuur", naar: "#fotos" }] : []),
    { wat: "Nieuwe maken", naar: "/start" },
  ]

  return (
    <section>
      <BandKop>Altijd</BandKop>
      <div className="flex flex-wrap gap-2.5">
        {links.map((l) => (
          <Link
            key={l.wat}
            href={l.naar}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-sm"
            style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: "#fff", color: BODY }}
          >
            {l.wat}
            {l.bij != null && (
              <b className="tabular-nums" style={{ color: CHARCOAL }}>
                {l.bij}
              </b>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Wie nog niets heeft: geen fasen, maar de keuze wat je gaat maken. */
export function NogNiets() {
  const keuzes = [
    {
      wat: "Save the Date",
      prijs: "vanaf €15",
      naar: "/kaart-maken?type=save_the_date",
      tekst: "Zodat mensen de dag vrijhouden voordat ze iets anders plannen.",
    },
    {
      wat: "Trouwkaart met aanmelding",
      prijs: "vanaf €25",
      naar: "/kaart-maken?type=trouwkaart",
      tekst: "Met de tijden, de dresscode en de dieetwensen van je gasten erbij.",
    },
    {
      wat: "Complete trouwwebsite",
      prijs: "€49,99",
      naar: "/aanmaken?plan=compleet",
      tekst: "Route, programma, cadeautips, fotomuur en de hele aanmelding.",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(1.9rem, 4.5vw, 2.75rem)",
            fontWeight: 600,
            color: CHARCOAL,
            margin: 0,
          }}
        >
          Waar wil je mee beginnen?
        </h1>
        <p className="text-sm mt-1.5 max-w-[62ch]" style={{ color: BODY }}>
          Ontwerpen kost niets en je hoeft nog niets te kiezen. Zodra er iets klaarstaat, leiden we
          je hier door de rest van de planning heen.
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {keuzes.map((k) => (
          <Link
            key={k.wat}
            href={k.naar}
            className="flex flex-col gap-2 p-5 rounded-2xl"
            style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span
                style={{ fontFamily: "var(--font-cormorant)", fontSize: 21, fontWeight: 600, color: CHARCOAL }}
              >
                {k.wat}
              </span>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: GOLD }}>
                {k.prijs}
              </span>
            </span>
            <span className="text-sm" style={{ color: BODY }}>
              {k.tekst}
            </span>
          </Link>
        ))}
      </div>

      <div
        className="rounded-2xl p-5 text-sm"
        style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}`, color: BODY }}
      >
        <strong style={{ color: CHARCOAL }}>En de gastenlijst krijg je er gratis bij.</strong> Bij elk
        pakket. Je houdt er zelf bij wie je hebt uitgenodigd en wie er komt, of je laat hem zich
        vullen door de reacties op je kaart. Gebruiken hoeft niet, maar het is wel het stuk werk
        waar de meeste paren zich op verkijken.
      </div>
    </div>
  )
}
