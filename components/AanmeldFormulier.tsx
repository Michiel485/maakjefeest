"use client"

import { useEffect, useState } from "react"
import {
  aanmeldStand,
  MAX_KIND_LEEFTIJD,
  type AanmeldStand,
} from "@/lib/gasten"
import type { CardTaal } from "@/lib/cards"
import { formulierTekst } from "@/lib/formulier-teksten"

// Het aanmeldformulier, één keer geschreven voor de kaart én de trouwsite.
//
// Dat is geen luxe maar de opdracht: wat een gast op de trouwkaart invult en
// wat hij op de site invult moet identiek zijn. Twee bijna gelijke formulieren
// lopen binnen een maand uit elkaar, en dan staat er in de gastenlijst van het
// ene wel een allergie en van het andere niet.
//
// Twee standen. Bij "janee" vraagt hij alleen wie er komt en hoe je hem
// bereikt; dat hoort bij een Save the Date en moet in tien seconden te doen
// zijn, want dat is waarom mensen het invullen. Bij "volledig" komt de rest
// erbij. Dieetwensen achttien maanden vooraf zijn zinloos.

const LS_APPARAAT = "sayingyes_gast"

/** Een kenmerk per browser, zodat iemand zijn eigen antwoord kan bijwerken. */
function apparaatKenmerk(): string | null {
  try {
    let k = localStorage.getItem(LS_APPARAAT)
    if (!k) {
      k = crypto.randomUUID()
      localStorage.setItem(LS_APPARAAT, k)
    }
    return k
  } catch {
    // Zonder browseropslag telt elke inzending als nieuw. Niet erg, wel jammer.
    return null
  }
}

/** Het kenmerk als het er al is; maakt er geen aan. */
function bestaandKenmerk(): string | null {
  try {
    return localStorage.getItem(LS_APPARAAT)
  } catch {
    return null
  }
}

/** Wie er eerder is aangemeld, zoals de aanmeldroute het teruggeeft. */
interface EerderePersoon {
  voornaam: string
  achternaam: string
  is_kind: boolean
  leeftijd: number | null
}
interface EerdereGroep {
  id: string | null
  personen: EerderePersoon[]
}

/** "Lindsey", "Lindsey en Michiel", "Lindsey, Michiel en Sam" */
function namenlijst(personen: EerderePersoon[], en = "en"): string {
  const n = personen.map((p) => p.voornaam).filter(Boolean)
  if (n.length <= 1) return n[0] ?? ""
  return `${n.slice(0, -1).join(", ")} ${en} ${n[n.length - 1]}`
}

interface Persoon {
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
  dietary: string
  allergie: string
}

interface Kind {
  voornaam: string
  leeftijd: string
  /** Alleen bij het volledige formulier: ook een kind heeft zijn eigen wensen. */
  dietary: string
}

const leegPersoon = (): Persoon => ({
  voornaam: "", achternaam: "", email: "", telefoon: "", dietary: "", allergie: "",
})
const leegKind = (): Kind => ({ voornaam: "", leeftijd: "", dietary: "" })

export interface AanmeldFormulierProps {
  /** Eén van beide: de bruiloft, of de kaartlink waar dit onder staat. */
  eventId?: string
  bronToken?: string
  stand?: AanmeldStand
  accentColor?: string
  labelColor?: string
  knopTekstKleur?: string
  /** Vlakken en randen; op een kaart wil je lichter dan op een webpagina. */
  compact?: boolean
  deadline?: string | null
  guestTypes?: string[]
  showSongRequest?: boolean
  showOvernachting?: boolean
  customQuestion?: string | null
  customQuestion2?: string | null
  /**
   * Alleen om te laten zien. In de kaartbouwer wil het bruidspaar zien wat zijn
   * gasten te zien krijgen, en dan mag er niets verstuurd worden. Michiels punt
   * van 21 september 2026: de keuze die je maakt moet ook in de bouwer zichtbaar
   * zijn, en niet pas als de kaart al de deur uit is.
   */
  voorbeeld?: boolean
  /** De taal van de kaart; het formulier volgt hem. Standaard Nederlands. */
  taal?: CardTaal
}

export default function AanmeldFormulier({
  eventId,
  bronToken,
  stand: standIn = "volledig",
  accentColor = "#C5A059",
  labelColor = "#374151",
  knopTekstKleur = "#ffffff",
  compact = false,
  deadline = null,
  guestTypes = ["daggast"],
  showSongRequest = false,
  showOvernachting = false,
  customQuestion = null,
  customQuestion2 = null,
  voorbeeld = false,
  taal = "nl",
}: AanmeldFormulierProps) {
  const T = formulierTekst(taal)
  const stand = aanmeldStand(standIn)
  const volledig = stand === "volledig"

  const [komt, setKomt] = useState<"yes" | "no" | null>(null)
  // Alleen bij de stand "adres": straat en huisnummer, postcode en plaats, in
  // één veld. Het bruidspaar wil er een envelop mee kunnen adresseren, meer
  // niet, en één veld vult sneller dan drie.
  const [adres, setAdres] = useState("")
  const vraagAdres = stand === "adres"
  const [aantal, setAantal] = useState(1)
  const [personen, setPersonen] = useState<Persoon[]>([leegPersoon()])
  const [metKinderen, setMetKinderen] = useState(false)
  const [kinderen, setKinderen] = useState<Kind[]>([leegKind()])
  const [bericht, setBericht] = useState("")
  const [liedje, setLiedje] = useState("")
  const [overnachting, setOvernachting] = useState<boolean | null>(null)
  const [eigen1, setEigen1] = useState<boolean | null>(null)
  const [eigen2, setEigen2] = useState<boolean | null>(null)
  const [status, setStatus] = useState<"idle" | "bezig" | "klaar" | "fout">("idle")
  const [fout, setFout] = useState<string | null>(null)
  const [bijgewerkt, setBijgewerkt] = useState(false)

  // ── Eerder aangemeld? ────────────────────────────────────────────────────
  // Op een telefoon die al eens antwoordde vragen we wat je wilt: je eerdere
  // aanmelding aanpassen, of iemand anders aanmelden. Zonder die vraag zette
  // een tweede aanmelding op hetzelfde toestel de eerste terug op "niets
  // gehoord", en een typfout tussen de Save the Date en de trouwkaart gaf een
  // tweede regel voor dezelfde gast (Michiel, 24 september 2026).
  // Via een persoonlijke link uit de gastenlijst weten we wie je bent; dan
  // staan je namen er meteen.
  const [eerder, setEerder] = useState<EerdereGroep[]>([])
  const [persoonlijk, setPersoonlijk] = useState(false)
  const [keuze, setKeuze] = useState<"open" | "aanpassen" | "nieuw" | null>(null)
  const [groepId, setGroepId] = useState<string | null>(null)
  const [gastId, setGastId] = useState<string | null>(null)

  /** Het formulier vullen met een eerdere aanmelding. */
  function vulIn(groep: EerdereGroep) {
    const volwassenen = groep.personen.filter((p) => !p.is_kind)
    const kids = groep.personen.filter((p) => p.is_kind)
    const rijen = (volwassenen.length > 0 ? volwassenen : [groep.personen[0]]).map((p) => ({
      ...leegPersoon(),
      voornaam: p.voornaam,
      achternaam: p.achternaam,
    }))
    setPersonen(rijen)
    setAantal(rijen.length)
    setMetKinderen(kids.length > 0)
    setKinderen(kids.length > 0 ? kids.map((k) => ({ ...leegKind(), voornaam: k.voornaam, leeftijd: k.leeftijd != null ? String(k.leeftijd) : "" })) : [leegKind()])
  }

  function kiesAanpassen(groep: EerdereGroep) {
    setGroepId(groep.id)
    vulIn(groep)
    setKeuze("aanpassen")
  }

  function kiesNieuw() {
    setGroepId(null)
    setPersonen([leegPersoon()])
    setAantal(1)
    setMetKinderen(false)
    setKinderen([leegKind()])
    setKeuze("nieuw")
  }

  useEffect(() => {
    if (voorbeeld || !bronToken) return
    let gast: string | null = null
    try {
      gast = new URLSearchParams(window.location.search).get("gast")
    } catch {}
    const kenmerk = bestaandKenmerk()
    if (!gast && !kenmerk) return
    const q = new URLSearchParams({ bron: bronToken })
    if (gast) q.set("gast", gast)
    if (kenmerk) q.set("apparaat", kenmerk)
    fetch(`/api/rsvp?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { persoonlijk?: boolean; groepen?: EerdereGroep[] } | null) => {
        const groepen = (d?.groepen ?? []).filter((g) => g.personen.length > 0)
        if (groepen.length === 0) return
        if (d?.persoonlijk) {
          setGastId(gast)
          setPersoonlijk(true)
          vulIn(groepen[0])
          setKeuze("aanpassen")
          return
        }
        setEerder(groepen)
        setKeuze("open")
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bronToken, voorbeeld])


  const naDeadline = deadline ? new Date() > new Date(deadline) : false
  const heeftVraag1 = typeof customQuestion === "string" && customQuestion.trim().length > 0
  const heeftVraag2 = typeof customQuestion2 === "string" && customQuestion2.trim().length > 0

  useEffect(() => {
    setPersonen((vorig) =>
      aantal > vorig.length
        ? [...vorig, ...Array.from({ length: aantal - vorig.length }, leegPersoon)]
        : vorig.slice(0, aantal)
    )
  }, [aantal])

  function zetPersoon(i: number, veld: keyof Persoon, waarde: string) {
    setPersonen((v) => v.map((p, idx) => (idx === i ? { ...p, [veld]: waarde } : p)))
  }
  function zetKind(i: number, veld: keyof Kind, waarde: string) {
    setKinderen((v) => v.map((k, idx) => (idx === i ? { ...k, [veld]: waarde } : k)))
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    setFout(null)

    // In de bouwer staat dit formulier er alleen om te laten zien wat je gasten
    // krijgen. Er hoort niets naar de database te gaan.
    if (voorbeeld) return

    if (!komt) { setFout(T.foutKomt); return }
    if (!personen[0].voornaam.trim()) { setFout(T.foutVoornaam); return }

    setStatus("bezig")
    try {
      const hoofdEmail = personen[0].email.trim()
      const gasten =
        komt === "no"
          ? [{
              voornaam: personen[0].voornaam,
              achternaam: personen[0].achternaam,
              email: hoofdEmail || undefined,
              telefoon: personen[0].telefoon || undefined,
              adres: vraagAdres ? adres.trim() || undefined : undefined,
              is_primary: true,
              attending: "no",
              message: bericht || undefined,
            }]
          : [
              ...personen.map((p, i) => ({
                voornaam: p.voornaam,
                achternaam: p.achternaam,
                email: p.email.trim() || (i > 0 && hoofdEmail ? hoofdEmail : undefined),
                telefoon: p.telefoon.trim() || undefined,
                guest_type: guestTypes[0],
                is_primary: i === 0,
                attending: "yes",
                ...(volledig ? { dietary: p.dietary || undefined, allergie: p.allergie || undefined } : {}),
                ...(i === 0 ? { message: bericht || undefined } : {}),
                ...(i === 0 && volledig && showSongRequest && liedje ? { song: liedje } : {}),
                ...(i === 0 && volledig && showOvernachting && overnachting !== null ? { overnachting } : {}),
                ...(i === 0 && volledig && heeftVraag1 && eigen1 !== null ? { custom_answer: eigen1 } : {}),
                ...(i === 0 && volledig && heeftVraag2 && eigen2 !== null ? { custom_answer_2: eigen2 } : {}),
              })),
              // Kinderen apart, want die tellen anders bij de catering
              ...(metKinderen ? kinderen : [])
                .filter((k) => k.voornaam.trim())
                .map((k) => ({
                  voornaam: k.voornaam,
                  achternaam: personen[0].achternaam,
                  guest_type: guestTypes[0],
                  is_primary: false,
                  attending: "yes",
                  is_kind: true,
                  leeftijd: k.leeftijd ? Number(k.leeftijd) : null,
                  ...(volledig && k.dietary.trim() ? { dietary: k.dietary.trim() } : {}),
                })),
            ]

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(bronToken ? { bron_token: bronToken } : { event_id: eventId }),
          apparaat: apparaatKenmerk(),
          // Alleen als we het gevraagd hebben; anders werkt de route als
          // voorheen. Wie niets eerder aanmeldde, meldt per definitie nieuw aan.
          ...(bronToken
            ? {
                modus: keuze === "aanpassen" ? "aanpassen" : "nieuw",
                ...(keuze === "aanpassen" && groepId ? { groep: groepId } : {}),
                ...(gastId ? { gast: gastId } : {}),
              }
            : {}),
          status: volledig ? "definitief" : "voorlopig",
          guests: gasten,
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; bijgewerkt?: boolean }
      if (!res.ok) throw new Error(j.error || T.foutVersturen)
      setBijgewerkt(Boolean(j.bijgewerkt))
      setStatus("klaar")
    } catch (err) {
      setFout(err instanceof Error ? err.message : T.foutVersturen)
      setStatus("fout")
    }
  }

  // ── Na afloop ─────────────────────────────────────────────────────────────
  if (status === "klaar") {
    const gaatKomen = komt === "yes"
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          backgroundColor: gaatKomen ? "#ECFDF5" : "#FFF7ED",
          border: `1px solid ${gaatKomen ? "#10b98133" : "#f59e0b33"}`,
        }}
      >
        <p className="font-bold mb-1" style={{ color: gaatKomen ? "#065F46" : "#92400E" }}>
          {bijgewerkt ? T.bijgewerkt : gaatKomen ? T.totDan : T.jammerBedankt}
        </p>
        <p className="text-sm" style={{ color: labelColor, opacity: 0.8 }}>
          {gaatKomen
            ? volledig
              ? T.genoteerd
              : T.rekening
            : T.jammer}
        </p>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setBijgewerkt(false) }}
          className="mt-3 text-xs font-semibold underline"
          style={{ color: labelColor, opacity: 0.7 }}
        >
          {T.tochAanpassen}
        </button>
      </div>
    )
  }

  if (naDeadline) {
    return (
      <p className="text-sm text-center" style={{ color: labelColor, opacity: 0.8 }}>
        {T.deadline}
      </p>
    )
  }

  // ── Het formulier ─────────────────────────────────────────────────────────
  const veldKlassen = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
  const veldStijl: React.CSSProperties = { borderColor: `${accentColor}55`, color: "#1A1A1A" }
  const labelKlassen = `block font-semibold mb-2 ${compact ? "text-xs" : "text-sm"}`

  if (keuze === "open" && eerder.length > 0) {
    const knop = "w-full py-3 px-4 rounded-xl font-semibold text-sm text-left transition-all"
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm m-0" style={{ color: labelColor }}>
          {eerder.length === 1 ? T.eerderEen : T.eerderMeer}
        </p>
        {eerder.map((g) => (
          <button
            key={g.id ?? "groep"}
            type="button"
            onClick={() => kiesAanpassen(g)}
            className={knop}
            style={{ backgroundColor: "#fff", border: `2px solid ${accentColor}66`, color: "#1A1A1A", cursor: "pointer" }}
          >
            <span className="block">{namenlijst(g.personen, T.en)}</span>
            <span className="block text-xs font-normal mt-0.5" style={{ color: "#6B6259" }}>{T.datAanpassen}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={kiesNieuw}
          className={knop}
          style={{ backgroundColor: "transparent", border: `2px dashed ${accentColor}55`, color: labelColor, cursor: "pointer" }}
        >
          <span className="block">{T.iemandAnders}</span>
          <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{T.blijftStaan}</span>
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={verstuur} className={`flex flex-col ${compact ? "gap-4" : "gap-6"}`}>
      {(keuze === "aanpassen" || persoonlijk) && (
        <p className="text-xs m-0" style={{ color: labelColor, opacity: 0.8 }}>
          {persoonlijk ? T.persoonlijk : T.jePast}
          {!persoonlijk && eerder.length > 0 && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setKeuze("open")}
                className="underline"
                style={{ color: labelColor, background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
              >
                {T.tochAnders}
              </button>
            </>
          )}
        </p>
      )}
      {/* ── Ben je erbij? ── */}
      <div>
        {/* In de kaart staat de vraag al als kop boven het formulier; dan
            niet nog eens als label eronder. */}
        {!compact && (
          <label className={labelKlassen} style={{ color: labelColor }}>{T.benJeErbij}</label>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          {(["yes", "no"] as const).map((v) => {
            const aan = komt === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setKomt(v)}
                className="flex-1 py-3 px-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-all"
                style={{
                  backgroundColor: aan ? (v === "yes" ? "#ECFDF5" : "#FFF7ED") : "#fff",
                  border: `2px solid ${aan ? (v === "yes" ? "#10b981" : "#f59e0b") : `${accentColor}44`}`,
                  // De knop is wit, dus de tekst is altijd donker. Met de
                  // labelkleur stond er op een donkere kaart wit op wit.
                  color: aan ? (v === "yes" ? "#065F46" : "#92400E") : "#1A1A1A",
                  cursor: "pointer",
                }}
              >
                <span>{v === "yes" ? "✓" : "✕"}</span>
                {v === "yes" ? T.jaErbij : T.neeNiet}
              </button>
            )
          })}
        </div>
      </div>

      {komt && (
        <>
          {/* ── Met hoeveel volwassenen ── */}
          {komt === "yes" && (
            <div>
              <label className={labelKlassen} style={{ color: labelColor }}>
                {T.hoeveel}
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAantal(n)}
                    className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
                    style={{
                      backgroundColor: aantal === n ? accentColor : "transparent",
                      color: aantal === n ? knopTekstKleur : labelColor,
                      border: `2px solid ${aantal === n ? accentColor : `${accentColor}44`}`,
                      cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Namen ── */}
          <div className="flex flex-col gap-4">
            {(komt === "no" ? personen.slice(0, 1) : personen).map((p, i) => (
              <div key={i} className="flex flex-col gap-2">
                {komt === "yes" && personen.length > 1 && (
                  <span className="text-xs font-semibold" style={{ color: labelColor, opacity: 0.7 }}>
                    {i === 0 ? T.jij : T.persoon(i + 1)}
                  </span>
                )}
                <div className="flex gap-2">
                  <input
                    className={veldKlassen}
                    style={veldStijl}
                    placeholder={T.voornaam}
                    value={p.voornaam}
                    onChange={(e) => zetPersoon(i, "voornaam", e.target.value)}
                    maxLength={80}
                    required={i === 0}
                  />
                  <input
                    className={veldKlassen}
                    style={veldStijl}
                    placeholder={T.achternaam}
                    value={p.achternaam}
                    onChange={(e) => zetPersoon(i, "achternaam", e.target.value)}
                    maxLength={80}
                  />
                </div>
                {i === 0 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder={T.email}
                      value={p.email}
                      onChange={(e) => zetPersoon(i, "email", e.target.value)}
                      maxLength={160}
                    />
                    <input
                      type="tel"
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder={T.telefoon}
                      value={p.telefoon}
                      onChange={(e) => zetPersoon(i, "telefoon", e.target.value)}
                      maxLength={32}
                    />
                  </div>
                )}
                {i === 0 && vraagAdres && komt === "yes" && (
                  <textarea
                    className={`${veldKlassen} resize-none`}
                    style={{ ...veldStijl, minHeight: 60 }}
                    rows={2}
                    placeholder={T.adres}
                    value={adres}
                    onChange={(e) => setAdres(e.target.value)}
                    maxLength={200}
                  />
                )}
                {volledig && komt === "yes" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder={T.dieet}
                      value={p.dietary}
                      onChange={(e) => zetPersoon(i, "dietary", e.target.value)}
                      maxLength={120}
                    />
                    <input
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder={T.allergie}
                      value={p.allergie}
                      onChange={(e) => zetPersoon(i, "allergie", e.target.value)}
                      maxLength={120}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Kinderen ──
              Niet iedereen naar zijn leeftijd vragen, dat is raar op een
              trouwkaart. Alleen van kinderen, en met de reden erbij. */}
          {komt === "yes" && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={metKinderen}
                  onChange={(e) => setMetKinderen(e.target.checked)}
                  style={{ accentColor }}
                />
                <span className="text-sm font-semibold" style={{ color: labelColor }}>
                  {T.kinderenMee}
                </span>
              </label>
              {metKinderen && (
                <div className="mt-3 flex flex-col gap-2">
                  {kinderen.map((k, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          className={veldKlassen}
                          style={veldStijl}
                          placeholder={T.naamKind}
                          value={k.voornaam}
                          onChange={(e) => zetKind(i, "voornaam", e.target.value)}
                          maxLength={80}
                        />
                        <input
                          type="number"
                          min={0}
                          max={MAX_KIND_LEEFTIJD}
                          className={`${veldKlassen} w-24`}
                          style={veldStijl}
                          placeholder={T.leeftijd}
                          value={k.leeftijd}
                          onChange={(e) => zetKind(i, "leeftijd", e.target.value)}
                        />
                      </div>
                      {/* Elke gast zijn eigen wensen, ook een kind (Michiel,
                          24 september 2026). */}
                      {volledig && k.voornaam.trim() && (
                        <input
                          className={veldKlassen}
                          style={veldStijl}
                          placeholder={T.kindDieet(k.voornaam.trim())}
                          value={k.dietary}
                          onChange={(e) => zetKind(i, "dietary", e.target.value)}
                          maxLength={120}
                        />
                      )}
                    </div>
                  ))}
                  {kinderen.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setKinderen((v) => [...v, leegKind()])}
                      className="text-xs font-semibold self-start underline"
                      style={{ color: accentColor }}
                    >
                      {T.nogEenKind}
                    </button>
                  )}
                  <p className="text-[11px] leading-snug" style={{ color: labelColor, opacity: 0.65 }}>
                    {T.leeftijdUitleg}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Alleen bij het volledige formulier ── */}
          {volledig && komt === "yes" && showSongRequest && (
            <div>
              <label className={labelKlassen} style={{ color: labelColor }}>{T.nummer}</label>
              <input className={veldKlassen} style={veldStijl} value={liedje} onChange={(e) => setLiedje(e.target.value)} maxLength={120} />
            </div>
          )}

          {volledig && komt === "yes" && showOvernachting && (
            <JaNee label={T.slapen} waarde={overnachting} zet={setOvernachting} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} ja={T.ja} nee={T.nee} />
          )}

          {volledig && komt === "yes" && heeftVraag1 && (
            <JaNee label={customQuestion!} waarde={eigen1} zet={setEigen1} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} ja={T.ja} nee={T.nee} />
          )}
          {volledig && komt === "yes" && heeftVraag2 && (
            <JaNee label={customQuestion2!} waarde={eigen2} zet={setEigen2} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} ja={T.ja} nee={T.nee} />
          )}

          {/* Een berichtje hoort bij de uitnodiging, niet bij een Save the
              Date: dat formulier moet in tien seconden te doen zijn. Wie zich
              afmeldt mag wel altijd iets kwijt, want dat is vaak het moment
              waarop iemand uitlegt waarom. */}
          {(volledig || komt === "no") && (
          <div>
            <label className={labelKlassen} style={{ color: labelColor }}>
              {komt === "no" ? T.berichtNee : T.berichtJa}
            </label>
            <textarea
              className={`${veldKlassen} resize-none`}
              style={veldStijl}
              rows={compact ? 2 : 3}
              value={bericht}
              onChange={(e) => setBericht(e.target.value)}
              maxLength={1000}
            />
          </div>
          )}

          {fout && (
            <p className="text-sm font-semibold" style={{ color: "#991B1B" }} role="alert">{fout}</p>
          )}

          <button
            type="submit"
            disabled={status === "bezig" || voorbeeld}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: accentColor,
              color: knopTekstKleur,
              border: "none",
              cursor: voorbeeld ? "default" : "pointer",
            }}
          >
            {status === "bezig" ? T.versturenBezig : T.versturen}
          </button>

          {!voorbeeld && (
            <p className="text-[11px] leading-snug text-center" style={{ color: labelColor, opacity: 0.6 }}>
              {T.privacy}
            </p>
          )}
        </>
      )}
    </form>
  )
}

/** Een ja-of-nee-vraag, zoals "blijf je slapen". */
function JaNee({
  label, waarde, zet, accentColor, labelColor, knopTekstKleur, labelKlassen, ja = "Ja", nee = "Nee",
}: {
  ja?: string
  nee?: string
  label: string
  waarde: boolean | null
  zet: (v: boolean) => void
  accentColor: string
  labelColor: string
  knopTekstKleur: string
  labelKlassen: string
}) {
  return (
    <div>
      <label className={labelKlassen} style={{ color: labelColor }}>{label}</label>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => zet(v)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: waarde === v ? accentColor : "transparent",
              color: waarde === v ? knopTekstKleur : labelColor,
              border: `2px solid ${waarde === v ? accentColor : `${accentColor}44`}`,
              cursor: "pointer",
            }}
          >
            {v ? ja : nee}
          </button>
        ))}
      </div>
    </div>
  )
}
