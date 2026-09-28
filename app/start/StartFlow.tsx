"use client"

// Gratis starten in een paar korte stappen (Michiel, 28 september 2026).
// Eerst kwam je na "Start gratis" meteen in het dashboard, met een formulier
// en drie producten met drie prijzen naast elkaar. Nu: jullie namen, de datum
// en de locatie, jullie eigen namen op drie kaarten, wat je wilt maken (met
// een aanrader die van de datum afhangt), en bewaren. Daarna meteen de bouwer
// in, met alles al ingevuld.
//
// Alles staat in de browser onder de sleutels die de bouwers al lezen. Wie
// zijn mailadres geeft, gaat via dezelfde route als "Bewaren" in de bouwers:
// na de klik in de mail wordt het ontwerp vanzelf in het account bewaard.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { buildCardDisplay, type CardDesign, type CardType } from "@/lib/cards"
import { splitsNamen, voegNamenSamen } from "@/lib/namen"
import { getStyleConfig, type SC } from "@/lib/event-styles"
import { kaartKleuren } from "@/lib/kaart-paletten"
import Voorkant from "@/components/kaart/Voorkant"
import { PLANS, formatEur, isPlan, type Plan } from "@/lib/plans"
import { KLEUR, LETTER, VORM } from "@/lib/ontwerp"
import { Knop, invoerKlassen, invoerStijl } from "@/components/ui"
import { DEFAULT_PRAKTISCH, DEFAULT_PROGRAMMA, LS_MAIL, LS_NAAR_WEBSITE, LS_NAMEN, LS_WEBSITE_CONCEPT, LS_WEBSITE_INHOUD, initialenMetStreep, nieuwWebsiteConcept } from "@/lib/nieuw-concept"

const LS_KAART = "sayingyes_kaart"
const LS_LOCATIE = "sayingyes_bruiloft_locatie"

// De drie ontwerpen die we laten zien, Hart met schaduw voorop
const ONTWERPEN: { id: CardDesign; naam: string }[] = [
  { id: "schaduwhart", naam: "Hart met schaduw" },
  { id: "hartamp", naam: "Hart in de &" },
  { id: "strik", naam: "Strik" },
]

type Keuze = Plan | "weetniet"

const STAPPEN = 5

const samen = voegNamenSamen

/** Hoeveel maanden tot de bruiloft, of null zonder datum */
function maandenTot(datum: string): number | null {
  if (!datum) return null
  const t = new Date(`${datum}T12:00:00`).getTime()
  if (Number.isNaN(t)) return null
  return (t - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
}

/** Wat we aanraden bij deze datum (Michiel: een half jaar en zes weken) */
function aanrader(datum: string): Plan | null {
  const m = maandenTot(datum)
  if (m === null) return null
  if (m > 6) return "save_the_date"
  if (m > 1.4) return "uitnodiging"
  return "compleet"
}

function adviesTekst(datum: string): string {
  const a = aanrader(datum)
  if (a === "save_the_date") return "Nog ruim een half jaar: tijd voor een Save the Date, zodat iedereen de dag vrijhoudt."
  if (a === "uitnodiging") return "Nog een paar maanden: tijd voor de trouwkaart, met aanmelden en dieetwensen."
  if (a === "compleet") return "Het is bijna zover: de website met het programma en een fotomuur voor op de dag zelf."
  return "Kies waar je mee begint. Twijfel je? Begin dan met de Save the Date."
}

const LADDER: { plan: Plan; titel: string; inclusief?: string; uitleg: string }[] = [
  {
    plan: "save_the_date",
    titel: "Save the Date",
    uitleg: "Zodat gasten de dag vrijhouden. Eén link, elke gast antwoordt met één tik.",
  },
  {
    plan: "uitnodiging",
    titel: "Trouwkaart",
    inclusief: "Inclusief de Save the Date",
    uitleg: "Tijden, dresscode en aanmelden met dieetwensen en allergieën.",
  },
  {
    plan: "compleet",
    titel: "Website",
    inclusief: "Inclusief trouwkaart en Save the Date",
    uitleg: "Programma, route, cadeautips en een fotomuur. De trouwkaart is meteen een mooie manier om de link naar je site te sturen, ook als je al papieren kaarten verstuurde.",
  },
]

/** Een kaart in het klein: getekend op 400 breed en verkleind tot het vakje */
function Mini({ design, namen, datum, locatie, type, sc }: { design: CardDesign; namen: string; datum: string; locatie: string; type: CardType; sc: SC }) {
  const vak = useRef<HTMLDivElement>(null)
  const [schaal, setSchaal] = useState(0.25)
  useEffect(() => {
    const v = vak.current
    if (!v) return
    const meet = () => setSchaal(v.clientWidth / 400)
    const ro = new ResizeObserver(meet)
    ro.observe(v)
    meet()
    return () => ro.disconnect()
  }, [])
  const display = buildCardDisplay(type, design, { stijl: "zand" }, {
    title: namen || "Jullie namen",
    frame_names: namen || null,
    datum: datum || null,
    locatie: locatie || null,
    hero_image_url: null,
  })
  return (
    <div ref={vak} aria-hidden className="relative w-full overflow-hidden" style={{ aspectRatio: "5 / 7", borderRadius: 10, backgroundColor: sc.bodyBg, pointerEvents: "none" }}>
      <div className="absolute left-0 top-0" style={{ width: 400, transform: `scale(${schaal})`, transformOrigin: "top left" }}>
        <Voorkant display={display} sc={sc} breedte={400} vullen={560} />
      </div>
    </div>
  )
}

export default function StartFlow() {
  const router = useRouter()
  const [stap, setStap] = useState(0)
  const [een, setEen] = useState("")
  const [twee, setTwee] = useState("")
  const [datum, setDatum] = useState("")
  const [locatie, setLocatie] = useState("")
  const [ontwerp, setOntwerp] = useState<CardDesign>("schaduwhart")
  const [keuze, setKeuze] = useState<Keuze | null>(null)
  const [mail, setMail] = useState("")
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [verstuurd, setVerstuurd] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const eerste = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Al ingelogd: dan heb je al een bruiloft, en hoort je start het dashboard
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/dashboard")
      else setKlaar(true)
    }).catch(() => setKlaar(true))
    // Vanuit een prijsblok: dat pakket alvast gekozen
    const pakket = new URLSearchParams(window.location.search).get("pakket")
    if (isPlan(pakket)) setKeuze(pakket)
    // Was je hier eerder? Dan staat wat je invulde er nog
    try {
      const namen = JSON.parse(localStorage.getItem(LS_NAMEN) ?? "null") as { een?: string; twee?: string } | null
      const kaart = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as { datum?: unknown; names?: unknown }
      // Anders de namen van een kaart die al in de browser stond
      const uitKaart = typeof kaart.names === "string" ? splitsNamen(kaart.names) ?? [kaart.names, ""] : null
      const a = namen?.een ?? uitKaart?.[0] ?? ""
      const b = namen?.twee ?? uitKaart?.[1] ?? ""
      if (a) setEen(a)
      if (b) setTwee(b)
      if (typeof kaart.datum === "string") setDatum(kaart.datum)
      setLocatie(localStorage.getItem(LS_LOCATIE) ?? "")
      setMail(localStorage.getItem(LS_MAIL) ?? "")
    } catch {}
  }, [router])

  useEffect(() => {
    if (stap === 0 || stap === 1 || stap === 4) {
      const t = setTimeout(() => eerste.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [stap])

  const namen = samen(een, twee)
  const advies = aanrader(datum)
  const gekozen: Keuze = keuze ?? advies ?? "save_the_date"
  const kaartType: CardType = gekozen === "save_the_date" || gekozen === "weetniet" ? "save_the_date" : "trouwkaart"
  const sc = kaartKleuren(getStyleConfig("zand"), "")

  /** Alles in de browser zetten, onder de sleutels die de bouwers lezen */
  function bewaarInBrowser() {
    try {
      localStorage.setItem(LS_NAMEN, JSON.stringify({ een: een.trim(), twee: twee.trim() }))
      const vorig = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as Record<string, unknown>
      localStorage.setItem(LS_KAART, JSON.stringify({ ...vorig, names: namen, datum, template: ontwerp, namenFont: "", type: kaartType }))
      if (locatie.trim()) localStorage.setItem(LS_LOCATIE, locatie.trim())
      if (gekozen === "compleet") {
        // Een website die er al stond houdt zijn werk, maar krijgt de nieuwe
        // namen, datum en locatie. Anders een nieuw concept, met het gekozen
        // ontwerp op de homepagina.
        const bestaand = JSON.parse(localStorage.getItem(LS_WEBSITE_CONCEPT) ?? "null") as Record<string, unknown> | null
        if (bestaand) {
          localStorage.setItem(LS_WEBSITE_CONCEPT, JSON.stringify({
            ...bestaand,
            naam: `De bruiloft van ${namen}`,
            nav_title: namen,
            frame_names: namen,
            initials: initialenMetStreep(namen),
            datum,
            locatie: locatie.trim(),
            frame_location: locatie.trim(),
          }))
        } else {
          localStorage.setItem(LS_WEBSITE_CONCEPT, JSON.stringify(nieuwWebsiteConcept({ namen, datum, locatie, style: "ivoor", ontwerp })))
          localStorage.setItem(LS_WEBSITE_INHOUD, JSON.stringify({ Programma: DEFAULT_PROGRAMMA, Informatie: DEFAULT_PRAKTISCH }))
        }
        localStorage.setItem(LS_NAAR_WEBSITE, String(Date.now()))
      }
    } catch {}
  }

  function bestemming(): string {
    if (gekozen === "compleet") return "/bouwen?plan=compleet"
    if (gekozen === "weetniet") return "/dashboard"
    return `/kaart-maken?type=${kaartType}`
  }

  async function bewaarEnVerder(metMail: boolean) {
    setFout(null)
    bewaarInBrowser()
    if (!metMail) {
      router.push(bestemming())
      return
    }
    const adres = mail.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adres)) {
      setFout("Dit lijkt geen mailadres. Kijk je het even na?")
      return
    }
    setBezig(true)
    try {
      localStorage.setItem(LS_MAIL, adres)
      // Dezelfde route als Bewaren in de bouwers: na de klik in de mail
      // bewaart de bouwer het ontwerp vanzelf in het account
      let next = "/dashboard"
      if (gekozen === "compleet") {
        localStorage.setItem("sayingyes_pending_save", "1")
        next = "/bouwen"
      } else if (gekozen !== "weetniet") {
        localStorage.setItem("sayingyes_kaart_actie", "bewaar")
        next = `/kaart-maken?type=${kaartType}&plan=${gekozen}&resume=1`
      }
      const { error } = await createClient().auth.signInWithOtp({
        email: adres,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) {
        localStorage.removeItem("sayingyes_pending_save")
        localStorage.removeItem("sayingyes_kaart_actie")
        setFout("De mail kon niet worden verstuurd. Probeer het zo nog eens, of kijk eerst rond.")
        return
      }
      setVerstuurd(true)
    } catch {
      setFout("De mail kon niet worden verstuurd. Probeer het zo nog eens, of kijk eerst rond.")
    } finally {
      setBezig(false)
    }
  }

  function verder() {
    setFout(null)
    if (stap === 0) {
      if (!een.trim()) {
        setFout("Vul in elk geval je eigen naam in")
        return
      }
      setStap(1)
      return
    }
    if (stap === 1) return setStap(2)
    if (stap === 2) return setStap(3)
    if (stap === 3) return setStap(4)
  }

  const naarWelkeBouwer =
    gekozen === "compleet" ? "de websitebouwer" : gekozen === "weetniet" ? "het overzicht" : gekozen === "uitnodiging" ? "de kaartbouwer, met een trouwkaart" : "de kaartbouwer, met een Save the Date"

  const kop = (tekst: string) => (
    <h1 className="text-[28px] sm:text-[32px] leading-tight text-center m-0" style={{ fontFamily: LETTER.kop, color: KLEUR.inkt, fontWeight: 600 }}>
      {tekst}
    </h1>
  )
  const onder = (tekst: string) => (
    <p className="text-[15px] leading-relaxed text-center mt-2 mb-6" style={{ color: KLEUR.tekst }}>
      {tekst}
    </p>
  )
  const label = (tekst: string, extra?: string) => (
    <span className="text-xs font-semibold" style={{ color: KLEUR.inkt }}>
      {tekst}
      {extra && <span className="font-normal" style={{ color: KLEUR.zacht }}> {extra}</span>}
    </span>
  )
  const stil = "text-[13px] font-medium underline underline-offset-2 bg-transparent border-0 cursor-pointer"

  if (!klaar) return <div className="min-h-screen" style={{ backgroundColor: KLEUR.ivoor }} />

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: KLEUR.ivoor }}>
      <header className="flex items-center justify-between px-5 sm:px-8 py-4">
        <Link href="/" className="text-2xl tracking-wide" style={{ fontFamily: LETTER.kop, color: KLEUR.inkt, fontWeight: 600, textDecoration: "none" }}>
          SayingYes
        </Link>
        {stap === 0 && (
          <Link href="/inloggen" className="text-sm font-medium" style={{ color: KLEUR.tekst, textDecoration: "none" }}>
            Ik heb al een account
          </Link>
        )}
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-10">
        <form
          className="w-full max-w-[460px] bg-white px-5 sm:px-8 py-7 flex flex-col"
          style={{ borderRadius: VORM.hoek, border: `1px solid ${KLEUR.goudLicht}` }}
          onSubmit={(e) => {
            e.preventDefault()
            if (stap < 4) verder()
            else if (!verstuurd) void bewaarEnVerder(true)
          }}
        >
          {/* Hoe ver je bent */}
          <div className="flex justify-center gap-1.5 mb-6" aria-label={`Stap ${stap + 1} van ${STAPPEN}`}>
            {Array.from({ length: STAPPEN }, (_, i) => (
              <span key={i} className="h-1 w-7 rounded-full" style={{ backgroundColor: i <= stap ? KLEUR.goud : KLEUR.zand }} />
            ))}
          </div>

          {stap === 0 && (
            <>
              {kop("Wat leuk, jullie gaan trouwen")}
              {onder("Hoe heten jullie? Dan zetten we jullie namen meteen op een kaart.")}
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  {label("Jouw naam")}
                  <input ref={eerste} className={invoerKlassen} style={invoerStijl} value={een} onChange={(e) => { setEen(e.target.value); setFout(null) }} placeholder="Michiel" maxLength={40} autoComplete="given-name" />
                </label>
                <label className="flex flex-col gap-1.5">
                  {label("Naam van je partner")}
                  <input className={invoerKlassen} style={invoerStijl} value={twee} onChange={(e) => setTwee(e.target.value)} placeholder="Lindsey" maxLength={40} />
                </label>
              </div>
            </>
          )}

          {stap === 1 && (
            <>
              {kop("Wanneer en waar?")}
              {onder("Weet je het nog niet? Sla het gerust over, je kunt het later invullen.")}
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  {label("Trouwdatum")}
                  <input ref={eerste} type="date" className={invoerKlassen} style={invoerStijl} value={datum} onChange={(e) => setDatum(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  {label("Locatie", "(als je die weet)")}
                  <input className={invoerKlassen} style={invoerStijl} value={locatie} onChange={(e) => setLocatie(e.target.value)} placeholder="Kasteel de Haar" maxLength={120} />
                </label>
                {maandenTot(datum) !== null && (maandenTot(datum) as number) > 0 && (
                  <p className="text-[13px] m-0" style={{ color: KLEUR.tekst }}>
                    Dan is het nog <strong style={{ color: KLEUR.inkt }}>{Math.max(1, Math.round((maandenTot(datum) as number) * 30.44))} dagen</strong>.
                  </p>
                )}
              </div>
              <button type="button" className={`${stil} mt-5 self-center`} style={{ color: KLEUR.zacht }} onClick={() => { setDatum(""); setLocatie(""); setStap(2) }}>
                Weten we nog niet
              </button>
            </>
          )}

          {stap === 2 && (
            <>
              {kop("Zo kan jullie kaart eruitzien")}
              {onder("Kies er een om mee te beginnen. Kleuren, tekst en ontwerp pas je later nog aan.")}
              <div className="grid grid-cols-3 gap-2.5">
                {ONTWERPEN.map((o) => {
                  const actief = ontwerp === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOntwerp(o.id)}
                      aria-pressed={actief}
                      className="p-1 flex flex-col gap-1.5 text-left bg-white cursor-pointer"
                      style={{ borderRadius: 12, border: `2px solid ${actief ? KLEUR.goud : "transparent"}` }}
                    >
                      <Mini design={o.id} namen={namen} datum={datum} locatie={locatie} type={kaartType} sc={sc} />
                      <span className="px-0.5 text-[12px] font-semibold leading-tight" style={{ color: KLEUR.inkt }}>{o.naam}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-[12px] text-center mt-4 mb-0" style={{ color: KLEUR.zacht }}>
                Er zijn nog veel meer ontwerpen in de bouwer.
              </p>
            </>
          )}

          {stap === 3 && (
            <>
              {kop("Wat wil je maken?")}
              {onder(adviesTekst(datum))}
              <div className="flex flex-col gap-2.5">
                {LADDER.map((l) => {
                  const actief = gekozen === l.plan
                  return (
                    <button
                      key={l.plan}
                      type="button"
                      onClick={() => setKeuze(l.plan)}
                      aria-pressed={actief}
                      className="text-left px-4 py-3.5 cursor-pointer"
                      style={{ borderRadius: 12, border: `${actief ? 2 : 1}px solid ${actief ? KLEUR.goud : KLEUR.goudLicht}`, backgroundColor: actief ? KLEUR.goudVlak : "#fff" }}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-[17px] font-semibold" style={{ fontFamily: LETTER.kop, color: KLEUR.inkt }}>{l.titel}</span>
                          {advies === l.plan && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: KLEUR.goud, color: "#fff" }}>Aanrader</span>
                          )}
                        </span>
                        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: KLEUR.goud }}>{formatEur(PLANS[l.plan].price).replace(",00", "")}</span>
                      </span>
                      {l.inclusief && <span className="block text-[12px] font-semibold mt-0.5" style={{ color: KLEUR.groenTekst }}>{l.inclusief}</span>}
                      <span className="block text-[13px] leading-snug mt-1" style={{ color: KLEUR.tekst }}>{l.uitleg}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-[12px] leading-relaxed text-center mt-4 mb-0" style={{ color: KLEUR.zacht }}>
                Ontwerpen is gratis; je betaalt pas als je verstuurt of live zet. Begin gerust klein: later upgraden kan altijd, je betaalt alleen het verschil. Kaarten blijven online zonder einddatum, de website een jaar en in elk geval tot een maand na de bruiloft.
              </p>
              <button type="button" className={`${stil} mt-3 self-center`} style={{ color: KLEUR.zacht }} onClick={() => { setKeuze("weetniet"); setStap(4) }}>
                Weet ik nog niet, laat me alles zien
              </button>
            </>
          )}

          {stap === 4 && !verstuurd && (
            <>
              {kop("Zullen we het bewaren?")}
              {onder("Laat je mailadres achter, dan staat je ontwerp klaar als je later verdergaat. Geen wachtwoord nodig: je krijgt een linkje in je mail.")}
              <label className="flex flex-col gap-1.5">
                {label("Mailadres")}
                <input ref={eerste} type="email" inputMode="email" autoComplete="email" className={invoerKlassen} style={invoerStijl} value={mail} onChange={(e) => { setMail(e.target.value); setFout(null) }} placeholder="naam@voorbeeld.nl" maxLength={120} />
              </label>
              <button type="button" className={`${stil} mt-5 self-center`} style={{ color: KLEUR.zacht }} onClick={() => void bewaarEnVerder(false)}>
                Eerst rondkijken
              </button>
            </>
          )}

          {stap === 4 && verstuurd && (
            <>
              {kop("Kijk even in je mail")}
              {onder(`We stuurden een linkje naar ${mail.trim()}. Klik erop, dan staat je ontwerp veilig in je account. Je kunt nu gewoon verder.`)}
            </>
          )}

          {fout && (
            <p className="text-[13px] font-semibold text-center mt-4 mb-0" role="alert" style={{ color: KLEUR.roodTekst }}>
              {fout}
            </p>
          )}

          <div className="flex gap-2.5 mt-7">
            {stap > 0 && !verstuurd && (
              <Knop soort="rand" onClick={() => { setFout(null); setStap(stap - 1) }}>
                Terug
              </Knop>
            )}
            <div className="flex-1 flex">
              {stap < 4 && (
                <Knop type="submit" breed>
                  Verder
                </Knop>
              )}
              {stap === 4 && !verstuurd && (
                <Knop type="submit" breed bezig={bezig} bezigTekst="Versturen...">
                  Bewaren en verder
                </Knop>
              )}
              {stap === 4 && verstuurd && (
                <Knop breed onClick={() => router.push(bestemming())}>
                  {`Door naar ${naarWelkeBouwer}`}
                </Knop>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
