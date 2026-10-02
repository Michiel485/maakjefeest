"use client"

import { useEffect, useState, type CSSProperties } from "react"
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
//
// Als een gesprek in stappen (ontwerpronde, 2 oktober 2026): eerst alleen
// "ben je erbij?", dan wie er komen, dan de wensen, en een persoonlijke
// afsluiting. In de kleuren en letters van de kaart of de site, zonder witte
// doos: de velden zijn licht doorschijnend, zodat ze op een donkere en op een
// lichte site goed staan.

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
function namenlijst(namen: string[], en = "en"): string {
  const n = namen.map((s) => s.trim()).filter(Boolean)
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

type Stap = "erbij" | "wie" | "wensen"

export interface AanmeldFormulierProps {
  /** Eén van beide: de bruiloft, of de kaartlink waar dit onder staat. */
  eventId?: string
  bronToken?: string
  stand?: AanmeldStand
  accentColor?: string
  labelColor?: string
  knopTekstKleur?: string
  /** Het titellettertype van de kaart of de site, voor de afsluiting */
  titelFont?: string
  titelGewicht?: number
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
  /** De trouwdag, uitgeschreven, voor "Tot 5 maart 2027, Sam!" */
  datumTekst?: string | null
  /** De knoppen op de afsluiting; zonder adres geen knop */
  agendaHref?: string | null
  programmaHref?: string | null
}

export default function AanmeldFormulier({
  eventId,
  bronToken,
  stand: standIn = "volledig",
  accentColor = "#C5A059",
  labelColor = "#374151",
  knopTekstKleur = "#ffffff",
  titelFont,
  titelGewicht = 500,
  compact = false,
  deadline = null,
  guestTypes = ["daggast"],
  showSongRequest = false,
  showOvernachting = false,
  customQuestion = null,
  customQuestion2 = null,
  voorbeeld = false,
  taal = "nl",
  datumTekst = null,
  agendaHref = null,
  programmaHref = null,
}: AanmeldFormulierProps) {
  const T = formulierTekst(taal)
  const stand = aanmeldStand(standIn)
  const volledig = stand === "volledig"

  const [komt, setKomt] = useState<"yes" | "no" | null>(null)
  const [stap, setStap] = useState<Stap>("erbij")
  // Alleen bij de stand "adres": straat en huisnummer, postcode en plaats, in
  // één veld. Het bruidspaar wil er een envelop mee kunnen adresseren, meer
  // niet, en één veld vult sneller dan drie.
  const [adres, setAdres] = useState("")
  const vraagAdres = stand === "adres"
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
    setMetKinderen(false)
    setKinderen([leegKind()])
    setKeuze("nieuw")
  }

  useEffect(() => {
    if (voorbeeld || (!bronToken && !eventId)) return
    let gast: string | null = null
    try {
      gast = new URLSearchParams(window.location.search).get("gast")
    } catch {}
    // Op de trouwsite alleen via de persoonlijke link; het toestelkenmerk
    // hoort bij de kaart
    const kenmerk = bronToken ? bestaandKenmerk() : null
    if (!gast && !kenmerk) return
    const q = new URLSearchParams(bronToken ? { bron: bronToken } : { event: eventId! })
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
  }, [bronToken, eventId, voorbeeld])

  const naDeadline = deadline ? new Date() > new Date(deadline) : false
  const heeftVraag1 = typeof customQuestion === "string" && customQuestion.trim().length > 0
  const heeftVraag2 = typeof customQuestion2 === "string" && customQuestion2.trim().length > 0

  function zetPersoon(i: number, veld: keyof Persoon, waarde: string) {
    setPersonen((v) => v.map((p, idx) => (idx === i ? { ...p, [veld]: waarde } : p)))
  }
  function zetKind(i: number, veld: keyof Kind, waarde: string) {
    setKinderen((v) => v.map((k, idx) => (idx === i ? { ...k, [veld]: waarde } : k)))
  }

  // ── De stappen ───────────────────────────────────────────────────────────
  // Bij "ja" en het volledige formulier is er een stap met wensen; bij "nee"
  // of een Save the Date is het in twee stappen klaar.
  const metWensen = komt === "yes" && volledig
  const stappen: Stap[] = metWensen ? ["erbij", "wie", "wensen"] : ["erbij", "wie"]
  const stapNr = Math.max(0, stappen.indexOf(stap))

  function kies(v: "yes" | "no") {
    setKomt(v)
    setFout(null)
    setStap("wie")
  }

  function naarWensen() {
    if (!personen[0].voornaam.trim()) { setFout(T.foutVoornaam); return }
    setFout(null)
    setStap("wensen")
  }

  function terug() {
    setFout(null)
    setStap(stap === "wensen" ? "wie" : "erbij")
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
            : gastId ? { gast: gastId } : {}),
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

  // ── Opmaak ───────────────────────────────────────────────────────────────
  const veld: CSSProperties = {
    width: "100%",
    borderRadius: 12,
    border: `1px solid ${accentColor}66`,
    backgroundColor: `${accentColor}12`,
    color: labelColor,
    padding: compact ? "9px 12px" : "11px 14px",
    fontSize: compact ? 14 : 15,
    lineHeight: 1.4,
    outline: "none",
    fontFamily: "inherit",
  }
  const ring = { "--sy-ring": `${accentColor}55` } as CSSProperties
  const labelKlassen = `block font-semibold mb-2 ${compact ? "text-xs" : "text-sm"}`
  const knopVol: CSSProperties = {
    width: "100%",
    padding: compact ? "12px 18px" : "14px 20px",
    borderRadius: 999,
    backgroundColor: accentColor,
    color: knopTekstKleur,
    border: "none",
    fontWeight: 700,
    fontSize: compact ? 14 : 15,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
  }
  const knopLos: CSSProperties = {
    display: "inline-block",
    padding: compact ? "11px 18px" : "12px 22px",
    borderRadius: 999,
    border: `1px solid ${accentColor}`,
    color: accentColor,
    background: "transparent",
    fontWeight: 700,
    fontSize: compact ? 14 : 15,
    textDecoration: "none",
    cursor: "pointer",
  }

  const invoer = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`sy-veld ${props.className ?? ""}`} style={{ ...veld, ...ring, ...(props.style ?? {}) }} />
  )

  // ── Na afloop ─────────────────────────────────────────────────────────────
  if (status === "klaar") {
    const gaatKomen = komt === "yes"
    const namen = namenlijst(personen.map((p) => p.voornaam), T.en)
    const kop = bijgewerkt
      ? T.bijgewerkt
      : gaatKomen
        ? `${datumTekst ? T.totDatum(datumTekst) : T.totDan.replace(/[!.]$/, "")}${namen ? `, ${namen}` : ""}!`
        : T.jammerBedankt
    return (
      <div className="text-center" style={{ color: labelColor, padding: compact ? "8px 0" : "16px 0" }}>
        <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ display: "block", width: 36, height: 1, backgroundColor: accentColor, opacity: 0.7 }} />
          <svg width="7" height="7" viewBox="0 0 8 8" fill={accentColor}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
          <span style={{ display: "block", width: 36, height: 1, backgroundColor: accentColor, opacity: 0.7 }} />
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: titelFont ?? "inherit",
            fontWeight: titelFont ? titelGewicht : 700,
            fontSize: titelFont ? (compact ? "1.75rem" : "2.1rem") : (compact ? "1.25rem" : "1.5rem"),
            lineHeight: 1.15,
            textWrap: "balance",
          }}
        >
          {kop}
        </p>
        <p className="text-sm" style={{ margin: "10px 0 0", opacity: 0.85 }}>
          {gaatKomen
            ? volledig
              ? T.genoteerd
              : T.rekening
            : T.jammer}
        </p>
        {gaatKomen && (agendaHref || programmaHref) && (
          <div className="flex flex-wrap justify-center" style={{ gap: 8, marginTop: 18 }}>
            {agendaHref && <a href={agendaHref} style={knopLos}>{T.agenda}</a>}
            {programmaHref && <a href={programmaHref} style={{ ...knopLos, backgroundColor: accentColor, color: knopTekstKleur }}>{T.programma}</a>}
          </div>
        )}
        <button
          type="button"
          onClick={() => { setStatus("idle"); setBijgewerkt(false); setStap("erbij") }}
          className="mt-4 text-xs font-semibold underline"
          style={{ color: labelColor, opacity: 0.7, background: "none", border: 0, cursor: "pointer" }}
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

  // ── Eerder aangemeld: wat wil je? ────────────────────────────────────────
  if (keuze === "open" && eerder.length > 0) {
    const knop: CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: 14, fontWeight: 600, fontSize: 14, textAlign: "left", cursor: "pointer", color: labelColor }
    return (
      <div className="flex flex-col gap-3" style={{ color: labelColor }}>
        <p className="text-sm m-0">
          {eerder.length === 1 ? T.eerderEen : T.eerderMeer}
        </p>
        {eerder.map((g) => (
          <button
            key={g.id ?? "groep"}
            type="button"
            onClick={() => kiesAanpassen(g)}
            style={{ ...knop, backgroundColor: `${accentColor}14`, border: `1.5px solid ${accentColor}` }}
          >
            <span className="block">{namenlijst(g.personen.map((p) => p.voornaam), T.en)}</span>
            <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{T.datAanpassen}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={kiesNieuw}
          style={{ ...knop, backgroundColor: "transparent", border: `1.5px dashed ${accentColor}88` }}
        >
          <span className="block">{T.iemandAnders}</span>
          <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{T.blijftStaan}</span>
        </button>
      </div>
    )
  }

  // ── Het formulier, in stappen ────────────────────────────────────────────
  const stapTitel = stap === "erbij" ? T.benJeErbij : stap === "wie" ? T.wieKomen : T.wensen

  const voortgang = (
    <div className="flex items-center justify-center" style={{ gap: 6, marginBottom: compact ? 10 : 14 }}>
      {stappen.map((s, i) => (
        <span key={s} style={{ display: "block", width: 22, height: 2, borderRadius: 2, backgroundColor: accentColor, opacity: i <= stapNr ? 1 : 0.3, transition: "opacity 0.3s ease" }} />
      ))}
    </div>
  )

  const persoonRij = (p: Persoon, i: number) => (
    <div key={i} className="flex flex-col gap-2">
      {komt === "yes" && personen.length > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: labelColor, opacity: 0.7 }}>
            {i === 0 ? T.jij : T.persoon(i + 1)}
          </span>
          {i > 0 && (
            <button type="button" onClick={() => setPersonen((v) => v.filter((_, idx) => idx !== i))} className="text-xs font-semibold" style={{ color: labelColor, opacity: 0.6, background: "none", border: 0, cursor: "pointer" }}>
              {T.weghalen}
            </button>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {invoer({ placeholder: T.voornaam, value: p.voornaam, onChange: (e) => zetPersoon(i, "voornaam", e.target.value), maxLength: 80, required: i === 0, autoComplete: i === 0 ? "given-name" : "off" })}
        {invoer({ placeholder: T.achternaam, value: p.achternaam, onChange: (e) => zetPersoon(i, "achternaam", e.target.value), maxLength: 80, autoComplete: i === 0 ? "family-name" : "off" })}
      </div>
      {i === 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          {invoer({ type: "email", placeholder: T.email, value: p.email, onChange: (e) => zetPersoon(i, "email", e.target.value), maxLength: 160, autoComplete: "email" })}
          {invoer({ type: "tel", placeholder: T.telefoon, value: p.telefoon, onChange: (e) => zetPersoon(i, "telefoon", e.target.value), maxLength: 32, autoComplete: "tel" })}
        </div>
      )}
      {i === 0 && vraagAdres && komt === "yes" && (
        <textarea
          className="sy-veld resize-none"
          style={{ ...veld, ...ring, minHeight: 60 }}
          rows={2}
          placeholder={T.adres}
          value={adres}
          onChange={(e) => setAdres(e.target.value)}
          maxLength={200}
        />
      )}
    </div>
  )

  const wensenRij = (p: Persoon, i: number) => (
    <div key={i} className="flex flex-col gap-2">
      {personen.length > 1 && (
        <span className="text-xs font-semibold" style={{ color: labelColor, opacity: 0.7 }}>
          {p.voornaam.trim() || (i === 0 ? T.jij : T.persoon(i + 1))}
        </span>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        {invoer({ placeholder: T.dieet, value: p.dietary, onChange: (e) => zetPersoon(i, "dietary", e.target.value), maxLength: 120 })}
        {invoer({ placeholder: T.allergie, value: p.allergie, onChange: (e) => zetPersoon(i, "allergie", e.target.value), maxLength: 120 })}
      </div>
    </div>
  )

  const berichtVeld = (
    <div>
      <label className={labelKlassen} style={{ color: labelColor }}>
        {komt === "no" ? T.berichtNee : T.berichtJa}
      </label>
      <textarea
        className="sy-veld resize-none"
        style={{ ...veld, ...ring }}
        rows={compact ? 2 : 3}
        value={bericht}
        onChange={(e) => setBericht(e.target.value)}
        maxLength={1000}
      />
    </div>
  )

  const verstuurKnop = (
    <button type="submit" disabled={status === "bezig" || voorbeeld} style={{ ...knopVol, opacity: status === "bezig" || voorbeeld ? 0.6 : 1, cursor: voorbeeld ? "default" : "pointer" }}>
      {status === "bezig" ? T.versturenBezig : T.versturen}
    </button>
  )

  return (
    <form onSubmit={verstuur} className={`flex flex-col ${compact ? "gap-4" : "gap-5"}`} style={{ color: labelColor }}>
      {(keuze === "aanpassen" || persoonlijk) && stap === "erbij" && (
        <p className="text-xs m-0 text-center" style={{ opacity: 0.8 }}>
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

      {/* De kop van de stap. Op de kaart staat "Ben je erbij?" al boven het
          formulier; dan niet nog eens. */}
      <div className="text-center">
        {voortgang}
        {!(compact && stap === "erbij") && (
          <p style={{ margin: 0, fontFamily: titelFont ?? "inherit", fontWeight: titelFont ? titelGewicht : 700, fontSize: titelFont ? (compact ? "1.4rem" : "1.7rem") : (compact ? "1rem" : "1.125rem"), lineHeight: 1.2 }}>
            {stapTitel}
          </p>
        )}
      </div>

      {/* ── Stap 1: ben je erbij? ── */}
      {stap === "erbij" && (
        <div className="flex flex-col sm:flex-row gap-2">
          {(["yes", "no"] as const).map((v) => {
            const aan = komt === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => kies(v)}
                className="flex-1 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                style={{
                  padding: compact ? "14px 12px" : "18px 14px",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: compact ? 15 : 16,
                  backgroundColor: aan ? accentColor : `${accentColor}12`,
                  border: `1.5px solid ${aan ? accentColor : `${accentColor}88`}`,
                  color: aan ? knopTekstKleur : labelColor,
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true" style={{ opacity: 0.85 }}>{v === "yes" ? "✓" : "✕"}</span>
                {v === "yes" ? T.jaErbij : T.neeNiet}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Stap 2: wie komen er? ── */}
      {stap === "wie" && (
        <>
          <div className="flex flex-col gap-4">
            {(komt === "no" ? personen.slice(0, 1) : personen).map(persoonRij)}
            {komt === "yes" && personen.length < 8 && (
              <button
                type="button"
                onClick={() => setPersonen((v) => [...v, leegPersoon()])}
                className="self-start text-sm font-semibold"
                style={{ color: accentColor, background: "none", border: 0, padding: 0, cursor: "pointer" }}
              >
                + {T.nogIemand}
              </button>
            )}
          </div>

          {/* Kinderen: niet iedereen naar zijn leeftijd vragen, dat is raar op
              een trouwkaart. Alleen van kinderen, en met de reden erbij. */}
          {komt === "yes" && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={metKinderen} onChange={(e) => setMetKinderen(e.target.checked)} style={{ accentColor }} />
                <span className="text-sm font-semibold">{T.kinderenMee}</span>
              </label>
              {metKinderen && (
                <div className="mt-3 flex flex-col gap-2">
                  {kinderen.map((k, i) => (
                    <div key={i} className="flex gap-2">
                      {invoer({ placeholder: T.naamKind, value: k.voornaam, onChange: (e) => zetKind(i, "voornaam", e.target.value), maxLength: 80 })}
                      {invoer({ type: "number", min: 0, max: MAX_KIND_LEEFTIJD, placeholder: T.leeftijd, value: k.leeftijd, onChange: (e) => zetKind(i, "leeftijd", e.target.value), style: { width: 96, flexShrink: 0 } })}
                    </div>
                  ))}
                  {kinderen.length < 8 && (
                    <button type="button" onClick={() => setKinderen((v) => [...v, leegKind()])} className="text-xs font-semibold self-start underline" style={{ color: accentColor, background: "none", border: 0, padding: 0, cursor: "pointer" }}>
                      {T.nogEenKind}
                    </button>
                  )}
                  <p className="text-[11px] leading-snug" style={{ opacity: 0.65 }}>{T.leeftijdUitleg}</p>
                </div>
              )}
            </div>
          )}

          {/* Wie zich afmeldt mag altijd iets kwijt: dat is vaak het moment
              waarop iemand uitlegt waarom. */}
          {komt === "no" && berichtVeld}

          {fout && <p className="text-sm font-semibold" style={{ color: "#B4552D" }} role="alert">{fout}</p>}

          {metWensen ? (
            <button type="button" onClick={naarWensen} style={knopVol}>{T.verder}</button>
          ) : (
            verstuurKnop
          )}
        </>
      )}

      {/* ── Stap 3: jullie wensen ── */}
      {stap === "wensen" && (
        <>
          <div className="flex flex-col gap-4">
            {personen.map(wensenRij)}
            {/* Elke gast zijn eigen wensen, ook een kind (Michiel, 24 september 2026). */}
            {metKinderen && kinderen.filter((k) => k.voornaam.trim()).map((k) => {
              const i = kinderen.indexOf(k)
              return (
                <div key={`k${i}`}>
                  {invoer({ placeholder: T.kindDieet(k.voornaam.trim()), value: k.dietary, onChange: (e) => zetKind(i, "dietary", e.target.value), maxLength: 120 })}
                </div>
              )
            })}
          </div>

          {showSongRequest && (
            <div>
              <label className={labelKlassen}>{T.nummer}</label>
              {invoer({ value: liedje, onChange: (e) => setLiedje(e.target.value), maxLength: 120 })}
            </div>
          )}

          {showOvernachting && (
            <JaNee label={T.slapen} waarde={overnachting} zet={setOvernachting} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} ja={T.ja} nee={T.nee} />
          )}
          {heeftVraag1 && (
            <JaNee label={customQuestion!} waarde={eigen1} zet={setEigen1} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} ja={T.ja} nee={T.nee} />
          )}
          {heeftVraag2 && (
            <JaNee label={customQuestion2!} waarde={eigen2} zet={setEigen2} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} ja={T.ja} nee={T.nee} />
          )}

          {berichtVeld}

          {fout && <p className="text-sm font-semibold" style={{ color: "#B4552D" }} role="alert">{fout}</p>}

          {verstuurKnop}
        </>
      )}

      {stap !== "erbij" && (
        <div className="flex items-center justify-between" style={{ marginTop: -6 }}>
          <button type="button" onClick={terug} className="text-xs font-semibold" style={{ color: labelColor, opacity: 0.7, background: "none", border: 0, padding: 0, cursor: "pointer" }}>
            ← {T.terug}
          </button>
          {!voorbeeld && stap === stappen[stappen.length - 1] && (
            <span className="text-[11px]" style={{ opacity: 0.6 }}>{T.privacy}</span>
          )}
        </div>
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
              backgroundColor: waarde === v ? accentColor : `${accentColor}12`,
              color: waarde === v ? knopTekstKleur : labelColor,
              border: `1.5px solid ${waarde === v ? accentColor : `${accentColor}66`}`,
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
