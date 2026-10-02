import Link from "next/link"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"
import Kop, { Ornament, Pijl, Vinkje } from "./Kop"
import Voet from "./Voet"
import NamenProef from "./NamenProef"
import { DONKER, DONKER_KAART, DONKER_TEKST, DONKER_ZACHT, GOUD, GOUD_LICHT, INKT, IVOOR, IVOOR_KAART, KOP_FONT, TEKST, ZAND } from "./stijl"
import { PLANS, PLAN_ORDER, formatEur, planStartUrl, upgradeHint, type Plan } from "@/lib/plans"

// Eén pagina per zoekvraag (ontwerpronde, ronde 7, 2 oktober 2026): de
// digitale trouwkaart, de Save the Date en de trouwwebsite. Elk met de kaart
// live in beeld, eigen voordelen, eigen vragen en het pakket dat erbij hoort.

export interface ZoekpaginaInhoud {
  kopje: string
  h1: React.ReactNode
  intro: string
  /** De drie stappen, als kop en tekst */
  stappen: [string, string][]
  /** Waarom dit, als losse punten */
  voordelenKop: string
  voordelenTekst: string
  voordelen: string[]
  faq: [string, string][]
  /** Het pakket dat bij deze pagina hoort, uitgelicht in de prijzen */
  pakket: Plan
  /** Artikelen om naar te verwijzen */
  artikelen: [string, string][]
}

const euro = (n: number) => formatEur(n).replace(",00", "")

export default function Zoekpagina({ inhoud }: { inhoud: ZoekpaginaInhoud }) {
  const startHref = planStartUrl(inhoud.pakket)
  return (
    <div style={{ backgroundColor: IVOOR }} className="min-h-screen antialiased">
      <ResetGoogleTranslate />
      <Kop startHref={startHref} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: inhoud.faq.map(([vraag, antwoord]) => ({ "@type": "Question", name: vraag, acceptedAnswer: { "@type": "Answer", text: antwoord } })),
          }),
        }}
      />
      <style>{`summary::-webkit-details-marker { display: none; }`}</style>

      <section className="px-6 pt-14 pb-20 sm:pt-20 sm:pb-28" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>{inhoud.kopje}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-5 tracking-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              {inhoud.h1}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: TEKST }}>{inhoud.intro}</p>
          </div>
          <NamenProef />
        </div>
      </section>

      <section className="py-24 px-6" style={{ backgroundColor: ZAND }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Ornament />
            <h2 className="text-3xl sm:text-4xl mt-6 mb-3" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>Zo werkt het</h2>
            <p className="text-base" style={{ color: TEKST }}>Drie stappen, een kwartier werk.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {inhoud.stappen.map(([kop, tekst], i) => (
              <div key={kop} className="rounded-3xl p-8" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 text-sm font-bold" style={{ backgroundColor: GOUD, color: DONKER }}>{i + 1}</div>
                <h3 className="text-xl mb-3" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>{kop}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEKST }}>{tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-5xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOUD }}>Waarom</p>
            <h2 className="text-3xl sm:text-4xl mb-5 leading-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>{inhoud.voordelenKop}</h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: TEKST }}>{inhoud.voordelenTekst}</p>
            <ul className="flex flex-col gap-3">
              {inhoud.voordelen.map((punt) => (
                <li key={punt} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: TEKST }}>
                  <Vinkje />
                  {punt}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl p-8 sm:p-10" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOUD }}>Verder lezen</p>
            <div className="flex flex-col gap-3">
              {inhoud.artikelen.map(([href, titel]) => (
                <Link key={href} href={href} className="text-sm font-semibold" style={{ color: INKT, textDecoration: "none" }}>
                  {titel} &rarr;
                </Link>
              ))}
              <Link href="/kaart-voorbeeld" className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
                Bekijk hoe gasten de kaart ontvangen &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ backgroundColor: DONKER }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOUD }}>Prijzen</p>
            <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: KOP_FONT, color: IVOOR, fontWeight: 700 }}>Begin klein, groei mee</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PLAN_ORDER.map((p) => {
              const info = PLANS[p]
              const uitgelicht = p === inhoud.pakket
              return (
                <div key={p} className="rounded-3xl p-7 flex flex-col" style={{ backgroundColor: DONKER_KAART, border: `1px solid ${uitgelicht ? GOUD : "#2A2218"}` }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: GOUD }}>{info.label}</p>
                  <span className="leading-none" style={{ fontFamily: KOP_FONT, fontSize: "3rem", fontWeight: 700, color: IVOOR }}>{euro(info.price)}</span>
                  <p className="text-xs mt-2" style={{ color: DONKER_ZACHT }}>{info.subtitel}</p>
                  <p className="text-xs mt-1.5 mb-5 font-semibold" style={{ color: GOUD }}>{upgradeHint(p)}</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {info.features.map((item) => (
                      <li key={item} className="flex items-start gap-2.5"><Vinkje /><span className="text-sm leading-relaxed" style={{ color: DONKER_TEKST }}>{item}</span></li>
                    ))}
                  </ul>
                  <Link href={planStartUrl(p)} className="inline-flex items-center justify-center text-sm font-semibold px-6 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5" style={uitgelicht ? { backgroundColor: GOUD, color: DONKER, textDecoration: "none" } : { color: IVOOR, border: `1px solid ${GOUD}60`, textDecoration: "none" }}>
                    Start gratis
                  </Link>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-center mt-5" style={{ color: "#6B6052" }}>Eenmalig, geen abonnement. Ontwerpen is gratis; je betaalt pas als je verstuurt of live zet.</p>
        </div>
      </section>

      <section className="py-24 px-6" style={{ backgroundColor: ZAND }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Veelgestelde vragen</p>
            <h2 className="text-3xl sm:text-4xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>Goed om te weten</h2>
            <Ornament />
          </div>
          <div className="flex flex-col gap-3">
            {inhoud.faq.map(([vraag, antwoord]) => (
              <details key={vraag} className="group rounded-2xl border" style={{ backgroundColor: "#FFFDF9", borderColor: `${GOUD_LICHT}80` }}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-base font-semibold" style={{ color: INKT }}>
                  {vraag}
                  <span className="flex-shrink-0 text-xl leading-none transition-transform duration-300 group-open:rotate-45" style={{ color: GOUD }} aria-hidden="true">+</span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed" style={{ color: TEKST }}>{antwoord}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8"><Ornament /></div>
          <h2 className="text-3xl sm:text-4xl mb-5 leading-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>Begin met jullie namen</h2>
          <Link href={startHref} className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all hover:-translate-y-0.5" style={{ backgroundColor: INKT, color: IVOOR, textDecoration: "none" }}>
            Start gratis
            <Pijl />
          </Link>
        </div>
      </section>

      <Voet />
    </div>
  )
}
