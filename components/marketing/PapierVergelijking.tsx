import Link from "next/link"
import { Vinkje } from "./Kop"
import { DONKER, DONKER_TEKST, GOUD, GOUD_LICHT, INKT, IVOOR, KOP_FONT, TEKST, ZAND } from "./stijl"
import { PLANS, formatEur } from "@/lib/plans"

// Papier tegenover SayingYes: het sterkste argument, op de homepage direct
// onder de kaart en op de drie zoekpagina's (Michiel, 11 oktober 2026). Alleen
// het harde getal staat groot: de postzegels.
//
// Een postzegel kost sinds 1 januari 2026 €1,40 (PostNL; NOS, 2025). Bij 100
// gasten gaat er ongeveer één kaart per huishouden uit. Het drukwerk staat er
// zonder bedrag bij: daar zijn geen harde prijzen voor trouwkaarten te vinden.
// Elk jaar op 1 januari nakijken.
export const POSTZEGEL = 1.4
export const GASTEN = 100
export const HUISHOUDENS = 60
export const PORTO_RONDE = Math.round(POSTZEGEL * HUISHOUDENS)

const euro = (n: number) => formatEur(n).replace(",00", "")

export default function PapierVergelijking({
  achtergrond = ZAND,
  allesLink = false,
}: {
  achtergrond?: string
  /** Op de zoekpagina's: een regel dat SayingYes alles in één is, met een link naar de homepage */
  allesLink?: boolean
}) {
  const prijsSite = euro(PLANS.compleet.price)
  return (
    <section className="py-16 sm:py-24 px-6" style={{ backgroundColor: achtergrond }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Papier of digitaal</p>
          <h2 className="text-4xl sm:text-5xl leading-tight mb-5" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700, textWrap: "balance" }}>
            Alleen de postzegels kosten al meer
          </h2>
          <p className="text-base leading-relaxed" style={{ color: TEKST }}>
            Een bruiloft met {GASTEN} gasten is ongeveer {HUISHOUDENS} kaarten, één per huishouden. Eerst een Save the Date, daarna de trouwkaart: twee keer naar de brievenbus.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 mb-10">
          <div className="rounded-3xl p-7 sm:p-8 flex flex-col" style={{ backgroundColor: "#FFFDF9", border: `1px solid ${GOUD_LICHT}` }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-5" style={{ color: TEKST }}>Papieren kaarten</p>
            <ul className="flex flex-col gap-3 mb-6 text-sm" style={{ color: TEKST }}>
              {[
                [`Postzegels Save the Date (${HUISHOUDENS} × ${formatEur(POSTZEGEL)})`, euro(PORTO_RONDE)],
                [`Postzegels trouwkaart (${HUISHOUDENS} × ${formatEur(POSTZEGEL)})`, euro(PORTO_RONDE)],
                ["Drukwerk en enveloppen", "komt erbij"],
              ].map(([wat, bedrag]) => (
                <li key={wat} className="flex items-baseline justify-between gap-4">
                  <span>{wat}</span>
                  <span className="font-semibold whitespace-nowrap tabular-nums" style={{ color: INKT }}>{bedrag}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5 flex items-baseline justify-between gap-4" style={{ borderTop: `1px solid ${GOUD_LICHT}` }}>
              <span className="text-sm font-semibold" style={{ color: INKT }}>Alleen al aan postzegels</span>
              <span className="leading-none tabular-nums" style={{ fontFamily: KOP_FONT, fontSize: "2.4rem", fontWeight: 700, color: INKT }}>{euro(PORTO_RONDE * 2)}</span>
            </div>
          </div>
          <div className="rounded-3xl p-7 sm:p-8 flex flex-col" style={{ backgroundColor: DONKER, border: `1px solid ${GOUD}`, boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-5" style={{ color: GOUD }}>SayingYes</p>
            <ul className="flex flex-col gap-3 mb-6 text-sm" style={{ color: DONKER_TEKST }}>
              {[
                ["Save the Date en trouwkaart, met gastenlijst", euro(PLANS.uitnodiging.price)],
                ["Alles, met trouwwebsite en fotomuur", prijsSite],
                ["Postzegels, drukwerk en enveloppen", "€0"],
              ].map(([wat, bedrag]) => (
                <li key={wat} className="flex items-baseline justify-between gap-4">
                  <span>{wat}</span>
                  <span className="font-semibold whitespace-nowrap tabular-nums" style={{ color: IVOOR }}>{bedrag}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5 flex items-baseline justify-between gap-4" style={{ borderTop: "1px solid #3A3026" }}>
              <span className="text-sm font-semibold" style={{ color: IVOOR }}>Alles in één, eenmalig</span>
              <span className="leading-none tabular-nums" style={{ fontFamily: KOP_FONT, fontSize: "2.4rem", fontWeight: 700, color: GOUD }}>{prijsSite}</span>
            </div>
          </div>
        </div>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 max-w-3xl mx-auto mb-8">
          {[
            "Gasten reageren met één tik, op de kaart zelf",
            "De gastenlijst vult zich vanzelf, met dieetwensen",
            "Iets veranderd? Iedereen ziet meteen de nieuwste kaart",
            "Een herinnering naar wie nog stil is, met één knop",
          ].map((punt) => (
            <p key={punt} className="flex items-start gap-3 text-sm leading-relaxed m-0" style={{ color: TEKST }}>
              <Vinkje />
              {punt}
            </p>
          ))}
        </div>
        <p className="text-center text-sm leading-relaxed max-w-2xl mx-auto m-0" style={{ color: TEKST }}>
          Toch een paar papieren kaarten voor opa en oma? Zet de QR-code van jullie digitale kaart erop. Wie scant, meldt zich daar aan en staat in dezelfde gastenlijst.
        </p>
        {allesLink && (
          <p className="text-center text-sm leading-relaxed max-w-2xl mx-auto mt-4 mb-0" style={{ color: TEKST }}>
            SayingYes is alles in één: Save the Date, trouwkaart, gastenlijst, trouwwebsite en fotomuur, met één overzicht.{" "}
            <Link href="/#alles" style={{ color: GOUD, fontWeight: 600, textDecoration: "none" }}>
              Bekijk wat erin zit &rarr;
            </Link>
          </p>
        )}
        <p className="text-center text-xs mt-6 mb-0" style={{ color: TEKST, opacity: 0.75 }}>
          Postzegel PostNL 2026: {formatEur(POSTZEGEL)}. Uitgaande van {GASTEN} gasten in {HUISHOUDENS} huishoudens.
        </p>
      </div>
    </section>
  )
}
