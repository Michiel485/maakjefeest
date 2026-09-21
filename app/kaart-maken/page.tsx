"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { STYLE_CONFIG, getStyleConfig, formatDate, type Style } from "@/lib/event-styles"
import {
  buildCardDisplay,
  cardAnimatie,
  cardDesign,
  CARD_ANIMATIE_KEUZES,
  CARD_ANIMATIE_LABEL,
  CARD_ANIMATIE_UITLEG,
  CARD_DESIGNS,
  CARD_TAAL_LABEL,
  CARD_TALEN,
  cardTaal,
  CARD_TEMPLATE_LABEL,
  CARD_TEMPLATE_UITLEG,
  CARD_TYPE_PLAN,
  KAART_TEKST,
  GUEST_TYPE_LABEL,
  kaartLabel,
  MAX_KAARTEN_PER_EVENT,
  type CardAnimatie,
  type CardContent,
  type CardGuestType,
  type CardRow,
  type CardTaal,
  type CardTemplate,
  type CardType,
} from "@/lib/cards"
import { hoogstePlan, planMagVersturen, PLANS, formatEur, isPlan, upgradePrice, type Plan } from "@/lib/plans"
import { compressImage } from "@/lib/client-image"
import CardReveal from "@/app/kaart/[token]/card-reveal"
import { KLEUR } from "@/lib/ontwerp"
import {
  AANMELD_LABEL,
  AANMELD_UITLEG,
  aanmeldStand,
  standaardAanmeldStand,
  type AanmeldStand,
} from "@/lib/gasten"
import { Knop, Melding, Paneel } from "@/components/ui"
import BouwerSchakelaar from "@/components/BouwerSchakelaar"
import {
  DEFAULT_PRAKTISCH,
  DEFAULT_PROGRAMMA,
  LS_WEBSITE_CONCEPT,
  LS_WEBSITE_INHOUD,
  nieuwWebsiteConcept,
} from "@/lib/nieuw-concept"

// Kleuren komen uit lib/ontwerp.ts, de enige bron. De korte namen hieronder
// staan er alleen zodat de rest van dit bestand leesbaar blijft.
const GOLD       = KLEUR.goud
const GOLD_LIGHT = KLEUR.goudLicht
const GOLD_BG    = KLEUR.goudVlak
const CHARCOAL   = KLEUR.inkt
const IVORY      = KLEUR.ivoor
const BODY       = KLEUR.tekst
const SUBTLE     = KLEUR.zacht

const LS_ONTWERP = "sayingyes_kaart"
const LS_ACTIE   = "sayingyes_kaart_actie"
const LS_IDS     = "sayingyes_kaart_ids"

const STYLE_LABEL: Record<Style, string> = {
  roze: "Roze", ivoor: "Ivoor", zand: "Zand", earthy: "Earthy", emerald: "Emerald",
}
const STYLE_KEYS = Object.keys(STYLE_CONFIG) as Style[]

interface ConceptRij {
  id: string
  title: string
  concept_naam: string | null
  datum: string | null
  status: string
}

type Stap = "stijl" | "template" | "tekst" | "aanmelden" | "taal" | "foto" | "animatie" | "bekijken"
type Actie = "bewaar" | "activeer"

interface KaartOntwerp {
  type: CardType
  style: Style
  template: CardTemplate
  names: string
  datum: string
  // De locatie van de bruiloft. Hoort bij het event, niet bij de kaart.
  location: string
  message: string
  guestType: CardGuestType | ""
  inviteText: string
  timeText: string
  photoDataUrl: string | null
  photoUrl: string | null
  animatie: CardAnimatie
  taal: CardTaal
  aanmelden: AanmeldStand
}

const LEEG: KaartOntwerp = {
  type: "save_the_date",
  style: "zand",
  template: "klassiek",
  names: "",
  datum: "",
  location: "",
  message: "",
  guestType: "",
  inviteText: "",
  timeText: "",
  photoDataUrl: null,
  photoUrl: null,
  animatie: "rustig",
  taal: "nl",
  aanmelden: "janee",
}


function isCardType(v: unknown): v is CardType {
  return v === "save_the_date" || v === "trouwkaart"
}
function isStyle(v: unknown): v is Style {
  return typeof v === "string" && v in STYLE_CONFIG
}

function initialenVan(names: string): string {
  return names
    // Ook splitsen op een enter: die mag in het namenveld staan
    .split(/\s*&\s*|\s+en\s+|\r?\n/i)
    .map((n) => n.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("")
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

// Inklapbare stap in de zijbalk. Bewust buiten de pagina-component gedefinieerd:
// anders wordt het bij elke render een nieuw componenttype en verliezen de
// invoervelden erin hun focus bij elke toetsaanslag.
function Sectie({ titel, open, onToggle, children }: { titel: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{titel}</span>
        <span className="text-gray-400"><Chevron open={open} /></span>
      </button>
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

export default function KaartMakenPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [ontwerp, setOntwerp] = useState<KaartOntwerp>(LEEG)
  const [geladen, setGeladen] = useState(false)
  // null betekent: alles dichtgeklapt. Zonder die stand kon een blok alleen
  // wisselen naar een ander blok, en was Tekst dus nooit dicht te krijgen.
  const [stap, setStap] = useState<Stap | null>("tekst")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  // Alle kaarten van deze bruiloft. Een bruidspaar maakt er meerdere: een voor
  // daggasten, een voor avondgasten, en straks dezelfde kaart in een andere
  // taal. Zonder deze lijst onthield de bouwer één kaart en overschreef hij
  // stilletjes de vorige.
  const [kaarten, setKaarten] = useState<CardRow[]>([])
  // Wat er voor deze bruiloft al is afgenomen. Nodig om te weten of deze kaart
  // al naar de gasten mag, of dat er nog iets bij komt.
  const [eventPlan, setEventPlan] = useState<Plan | null>(null)
  const [eventStatus, setEventStatus] = useState<string | null>(null)
  // De locatie van de bruiloft zelf, die op de website komt. Los van de
  // locatie op deze kaart, want die kan per gastengroep anders zijn.
  const [eventLocatie, setEventLocatie] = useState("")
  // Een eigen naam voor dit concept, zodat je varianten uit elkaar houdt.
  // Leeg is prima: dan toont de lijst de namen en de datum.
  // Bij welke bruiloft een nieuw ontwerp hoort. Uit het klantreisgesprek van
  // 21 september 2026: een tweede concept werd een tweede bruiloft, en daardoor
  // kreeg het dashboard een losse kolom per concept. Begin je een variant
  // binnen dezelfde bruiloft, dan onthouden we hier welke dat is.
  const [hoortBij, setHoortBij] = useState<string | null>(null)
  const [conceptNaam, setConceptNaam] = useState("")
  // Alle concepten van deze klant, voor de keuzelijst bovenin
  const [concepten, setConcepten] = useState<ConceptRij[]>([])
  const [simulatie, setSimulatie] = useState(false)
  const [mailActie, setMailActie] = useState<Actie | null>(null)
  const [mailAdres, setMailAdres] = useState("")
  const [mailVerstuurd, setMailVerstuurd] = useState(false)
  const [busy, setBusy] = useState<Actie | "download" | "foto" | "proef" | null>(null)
  const [melding, setMelding] = useState<{ tekst: string; fout?: boolean } | null>(null)
  // Is dit de eerste keer dat dit ontwerp bewaard wordt? Dan krijgt de klant
  // geen smalle meldingsbalk maar een echte overdracht. Dat is het enige moment
  // waarop iemand net iets gemaakt heeft en openstaat voor de vraag "en nu?",
  // en tot nu toe gebruikten we het voor een onderstreept linkje.
  const [overdracht, setOverdracht] = useState(false)

  // Welk pakket deze kaart nodig heeft om verstuurd te mogen worden. Ontwerpen
  // mag altijd; dit is puur wat de kassa straks vraagt.
  const kaartPlan = CARD_TYPE_PLAN[ontwerp.type]
  // Wat de klant afneemt is het hoogste van wat hij al koos en wat deze kaart
  // vraagt: wie Compleet heeft, hoeft voor een tweede kaart niets meer.
  const plan = hoogstePlan(eventPlan ?? kaartPlan, kaartPlan)
  // Al betaald en het pakket dekt deze kaart? Dan is de kaart meteen live.
  const alAfgenomen = eventStatus === "published" && planMagVersturen(eventPlan, ontwerp.type)
  // Wat er nog bij komt: bij een betaalde bruiloft alleen het verschil.
  const bijTeBetalen =
    eventStatus === "published" ? (upgradePrice(eventPlan, plan) ?? 0) : PLANS[plan].price
  const prijs = formatEur(bijTeBetalen).replace(",00", "")
  const isTrouwkaart = ontwerp.type === "trouwkaart"
  const huidigeKaart = kaarten.find((k) => k.id === cardId) ?? null

  function update(patch: Partial<KaartOntwerp>) {
    setOntwerp((o) => ({ ...o, ...patch }))
  }

  // ── Laden: URL, bestaand event, of ontwerp uit de browser ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const typeUitUrl = params.get("type")
    const eventUitUrl = params.get("event_id")
    const kaartUitUrl = params.get("card_id")

    let basis: KaartOntwerp = LEEG
    let eventUitOpslag: string | null = null
    try {
      const bewaard = localStorage.getItem(LS_ONTWERP)
      if (bewaard) basis = { ...LEEG, ...(JSON.parse(bewaard) as Partial<KaartOntwerp>) }
      const ids = localStorage.getItem(LS_IDS)
      if (ids) {
        const { eventId: e, cardId: c } = JSON.parse(ids) as { eventId?: string; cardId?: string }
        if (e) { setEventId(e); eventUitOpslag = e }
        if (c) setCardId(c)
      }
    } catch {}
    if (isCardType(typeUitUrl)) basis = { ...basis, type: typeUitUrl }
    setOntwerp(basis)

    createClient().auth.getUser().then(async ({ data }) => {
      const email = data.user?.email ?? null
      setUserEmail(email)

      // De lijst met concepten voor de keuzelijst bovenin de zijbalk
      if (email) {
        try {
          const cr = await fetch("/api/drafts")
          if (cr.ok) setConcepten(((await cr.json()) as ConceptRij[]) ?? [])
        } catch {}
      }

      // Bestaand event bewerken (vanuit het dashboard)
      if (eventUitUrl && email) {
        try {
          const r = await fetch(`/api/drafts/${eventUitUrl}`)
          if (r.ok) {
            const { event } = (await r.json()) as { event: Record<string, unknown> }
            if (isPlan(event.plan)) setEventPlan(event.plan)
            setEventStatus(typeof event.status === "string" ? event.status : null)
            setConceptNaam(typeof event.concept_naam === "string" ? event.concept_naam : "")
            setHoortBij(typeof event.hoort_bij === "string" ? event.hoort_bij : null)
            const kr = await fetch(`/api/cards?event_id=${eventUitUrl}`)
            const { cards } = kr.ok ? ((await kr.json()) as { cards: CardRow[] }) : { cards: [] }
            setKaarten(cards)
            // Een link mag een kaart aanwijzen; anders valt hij terug op het
            // gevraagde type en als laatste op de nieuwste kaart.
            const gewenstType: CardType = isCardType(typeUitUrl) ? typeUitUrl : (event.plan === "uitnodiging" ? "trouwkaart" : "save_the_date")
            const kaart =
              (kaartUitUrl ? cards.find((c) => c.id === kaartUitUrl) : undefined) ??
              cards.find((c) => c.type === gewenstType) ??
              cards[0]
            setEventId(eventUitUrl)
            setCardId(kaart?.id ?? null)
            setOntwerp({
              type: kaart?.type ?? gewenstType,
              style: isStyle(event.style) ? event.style : "zand",
              template: kaart?.template ?? "klassiek",
              names: kaart?.content.names ?? (event.frame_names as string) ?? (event.title as string) ?? "",
              datum: (event.datum as string) ?? "",
              // Deze kaart heeft zijn eigen locatie; is die er nog niet, dan
              // begint hij bij die van de bruiloft.
              location: kaart?.content.location ?? (event.locatie as string) ?? "",
              message: kaart?.content.message ?? "",
              guestType: kaart?.content.guestType ?? "",
              inviteText: kaart?.content.inviteText ?? "",
              timeText: kaart?.content.timeText ?? "",
              photoDataUrl: null,
              photoUrl: kaart?.content.photoUrl ?? null,
              animatie: cardAnimatie(kaart?.content.animatie),
              taal: cardTaal(kaart?.content.taal),
              aanmelden: kaart?.content.aanmelden
                ? aanmeldStand(kaart.content.aanmelden)
                : standaardAanmeldStand(kaart?.type ?? gewenstType),
            })
          }
        } catch {}
      } else if (eventUitOpslag && email) {
        // Verder werken aan een eerder bewaarde bruiloft: de lijst met kaarten
        // hoort er dan ook te zijn, anders lijkt het alsof er maar een is. En
        // het pakket, want dat bepaalt of er nog iets te betalen valt.
        try {
          const [kr, er] = await Promise.all([
            fetch(`/api/cards?event_id=${eventUitOpslag}`),
            fetch(`/api/drafts/${eventUitOpslag}`),
          ])
          if (kr.ok) setKaarten(((await kr.json()) as { cards: CardRow[] }).cards)
          if (er.ok) {
            const { event } = (await er.json()) as { event: Record<string, unknown> }
            if (isPlan(event.plan)) setEventPlan(event.plan)
            setEventStatus(typeof event.status === "string" ? event.status : null)
            setConceptNaam(typeof event.concept_naam === "string" ? event.concept_naam : "")
            setHoortBij(typeof event.hoort_bij === "string" ? event.hoort_bij : null)
            setEventLocatie(typeof event.locatie === "string" ? event.locatie : "")
          }
        } catch {}
      }
      setGeladen(true)
    })
  }, [])

  // Een gelukte melding hoort niet te blijven staan: je hebt hem gelezen en
  // daarna is het een groene balk die in de weg zit. Fouten blijven wel staan,
  // want daar moet je nog iets mee.
  useEffect(() => {
    if (!melding || melding.fout) return
    const t = setTimeout(() => setMelding(null), 6000)
    return () => clearTimeout(t)
  }, [melding])

  // Escape sluit de simulatie en het mailvenster
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      setSimulatie(false)
      setMailActie(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Ontwerp altijd lokaal bewaren, zodat niets verloren gaat bij inloggen of verversen
  useEffect(() => {
    if (!geladen) return
    try { localStorage.setItem(LS_ONTWERP, JSON.stringify(ontwerp)) } catch {}
  }, [ontwerp, geladen])

  // ── Weergave ──────────────────────────────────────────────────────────────
  const sc = getStyleConfig(ontwerp.style)
  // Namen en datum staan bewust niet in de inhoud van de kaart: die horen bij
  // de bruiloft. buildCardDisplay haalt ze uit het event hieronder.
  const content: CardContent = {
    location: ontwerp.location.trim() || undefined,
    message: ontwerp.message || undefined,
    guestType: ontwerp.guestType || undefined,
    inviteText: ontwerp.inviteText || undefined,
    timeText: ontwerp.timeText || undefined,
    photoUrl: ontwerp.photoUrl ?? ontwerp.photoDataUrl ?? undefined,
    animatie: ontwerp.animatie,
    taal: ontwerp.taal,
    aanmelden: ontwerp.aanmelden,
  }
  const display = buildCardDisplay(ontwerp.type, ontwerp.template, content, {
    title: ontwerp.names || "Jullie namen",
    frame_names: ontwerp.names || null,
    datum: ontwerp.datum || null,
    locatie: ontwerp.location || null,
    hero_image_url: null,
  })
  const initialen = initialenVan(ontwerp.names) || "♥"

  // ── Opslaan op de server (event + kaart) ──────────────────────────────────
  const slaOp = useCallback(async (): Promise<{ eventId: string; cardId: string }> => {
    let fotoUrl = ontwerp.photoUrl
    if (ontwerp.photoDataUrl && !fotoUrl) {
      const blob = await (await fetch(ontwerp.photoDataUrl)).blob()
      const fd = new FormData()
      fd.append("file", new File([blob], "kaartfoto.jpg", { type: "image/jpeg" }))
      const up = await fetch("/api/cards/upload", { method: "POST", body: fd })
      if (up.ok) {
        fotoUrl = ((await up.json()) as { url: string }).url
        update({ photoUrl: fotoUrl, photoDataUrl: null })
      }
    }

    const eventBody = {
      type: "bruiloft",
      naam: ontwerp.names || "Onze bruiloft",
      datum: ontwerp.datum,
      // De bruiloft houdt zijn eigen locatie. Die wordt alleen gevuld vanuit
      // de eerste kaart, want daarna is hij van de website en kan elke kaart
      // een andere hebben.
      locatie: eventLocatie || ontwerp.location,
      style: ontwerp.style,
      frame_names: ontwerp.names,
      initials: initialenVan(ontwerp.names),
      pages: ["Home"],
      content: {},
      plan,
      concept_naam: conceptNaam.trim() || null,
      ...(eventId ? { event_id: eventId } : {}),
      ...(!eventId && hoortBij ? { hoort_bij: hoortBij } : {}),
    }
    const er = await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventBody) })
    if (!er.ok) throw new Error("Opslaan van het event mislukt")
    const { id: nieuwEventId } = (await er.json()) as { id: string }

    // Alleen wat echt van deze kaart is. Namen en datum komen van de bruiloft
    // en de locatie alleen als hij afwijkt; anders zou een wijziging aan de
    // bruiloft de kaarten niet meer bereiken.
    const kaartContent: CardContent = { ...content, photoUrl: fotoUrl ?? undefined }
    let nieuwCardId = cardId
    if (!nieuwCardId) {
      const cr = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: nieuwEventId,
          type: ontwerp.type,
          template: ontwerp.template,
          guest_type: isTrouwkaart && ontwerp.guestType ? ontwerp.guestType : undefined,
          photo_url: fotoUrl ?? undefined,
        }),
      })
      if (!cr.ok) {
        // De server weet beter wat er mis is dan wij, bijvoorbeeld dat het
        // maximum aantal kaarten bereikt is. Die tekst hoort de klant te zien.
        const { error } = (await cr.json().catch(() => ({}))) as { error?: string }
        throw new Error(error || "Aanmaken van de kaart mislukt")
      }
      nieuwCardId = ((await cr.json()) as { card: CardRow }).card.id
    }
    const pr = await fetch(`/api/cards/${nieuwCardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: kaartContent, template: ontwerp.template, type: ontwerp.type }),
    })
    if (!pr.ok) throw new Error("Opslaan van de kaarttekst mislukt")

    setEventId(nieuwEventId)
    setCardId(nieuwCardId)
    try { localStorage.setItem(LS_IDS, JSON.stringify({ eventId: nieuwEventId, cardId: nieuwCardId })) } catch {}

    // De keuzelijsten bijwerken: de net bewaarde kaart, en het concept zelf
    // als dit de eerste keer opslaan was.
    try {
      const [kr, cr] = await Promise.all([
        fetch(`/api/cards?event_id=${nieuwEventId}`),
        fetch("/api/drafts"),
      ])
      if (kr.ok) setKaarten(((await kr.json()) as { cards: CardRow[] }).cards)
      if (cr.ok) setConcepten(((await cr.json()) as ConceptRij[]) ?? [])
    } catch {}

    return { eventId: nieuwEventId, cardId: nieuwCardId }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ontwerp, eventId, cardId, plan, isTrouwkaart, conceptNaam, eventLocatie])

  // Overstappen naar de websitebouwer zonder dat er al iets bewaard is. Wat
  // hier al ingevuld staat gaat mee, inclusief de stijl, zodat de website
  // meteen in de sfeer van de kaart staat en niet leeg begint. Een bestaand
  // websiteconcept laten we met rust.
  function neemMeeNaarWebsite() {
    try {
      if (localStorage.getItem(LS_WEBSITE_CONCEPT)) return
      localStorage.setItem(
        LS_WEBSITE_CONCEPT,
        JSON.stringify(
          nieuwWebsiteConcept({
            namen: ontwerp.names,
            datum: ontwerp.datum,
            locatie: ontwerp.location,
            style: ontwerp.style,
          })
        )
      )
      localStorage.setItem(
        LS_WEBSITE_INHOUD,
        JSON.stringify({ Programma: DEFAULT_PROGRAMMA, Informatie: DEFAULT_PRAKTISCH })
      )
    } catch {
      // Zonder browseropslag begint de websitebouwer gewoon leeg
    }
  }

  /** Een korte naam voor een concept in de keuzelijst. */
  function conceptLabel(c: ConceptRij): string {
    if (c.concept_naam?.trim()) return c.concept_naam.trim()
    const datum = c.datum ? ` (${formatDate(c.datum)})` : ""
    return `${c.title || "Naamloos"}${datum}`
  }

  function kiesConcept(id: string) {
    if (id === eventId) return
    router.push(`/kaart-maken?event_id=${id}`)
  }

  // Een tweede variant naast de bestaande. Het ontwerp blijft staan, alleen de
  // koppeling met het bewaarde concept gaat los, zodat opslaan een nieuw
  // concept maakt in plaats van het oude te overschrijven.
  function nieuwConcept() {
    // Een variant hoort bij dezelfde bruiloft, niet naast hem. Was dit concept
    // zelf al een variant, dan pakken we zijn bruiloft, zodat de keten nooit
    // dieper wordt dan één stap.
    if (eventId) setHoortBij(hoortBij ?? eventId)
    setEventId(null)
    setEventLocatie("")
    setCardId(null)
    setKaarten([])
    setEventPlan(null)
    setEventStatus(null)
    setConceptNaam("")
    try { localStorage.removeItem(LS_IDS) } catch {}
    setMelding({ tekst: "Nieuw concept. Je ontwerp blijft staan; bewaren maakt er een tweede van, je eerste blijft gewoon bestaan." })
  }

  // ── Wisselen tussen de kaarten van deze bruiloft ──────────────────────────
  // Namen, datum, locatie en stijl horen bij de bruiloft en blijven staan. Wat
  // per kaart verschilt is het soort kaart, de gastengroep en de teksten.
  function kiesKaart(id: string) {
    const k = kaarten.find((c) => c.id === id)
    if (!k) return
    setCardId(k.id)
    setMelding(null)
    setOntwerp((o) => ({
      ...o,
      type: k.type,
      template: k.template,
      location: k.content.location ?? o.location,
      message: k.content.message ?? "",
      guestType: k.content.guestType ?? "",
      inviteText: k.content.inviteText ?? "",
      timeText: k.content.timeText ?? "",
      photoDataUrl: null,
      photoUrl: k.content.photoUrl ?? null,
      animatie: cardAnimatie(k.content.animatie),
      taal: cardTaal(k.content.taal),
      aanmelden: k.content.aanmelden ? aanmeldStand(k.content.aanmelden) : standaardAanmeldStand(k.type),
    }))
  }

  // Een lege kaart naast de bestaande: hetzelfde ontwerp, nog geen groepstekst
  function nieuweKaart() {
    setCardId(null)
    setOntwerp((o) => ({
      ...o,
      message: "",
      guestType: "",
      inviteText: "",
      timeText: "",
      photoDataUrl: null,
      photoUrl: null,
    }))
    setMelding({ tekst: "Nieuwe kaart. Namen, datum en stijl blijven staan, vul de rest aan en bewaar." })
  }

  // Alles behouden en de volgende opslag een nieuwe kaart laten worden. Dit is
  // de snelste weg naar dezelfde kaart in een andere taal of voor een andere
  // gastengroep: aanpassen wat anders moet, de rest staat er al.
  function dupliceerKaart() {
    setCardId(null)
    setMelding({ tekst: "Kopie gemaakt. Pas aan wat anders moet en bewaar; je vorige kaart blijft bestaan." })
  }

  function controleer(): string | null {
    if (!ontwerp.names.trim()) return "Vul eerst jullie namen in."
    if (!ontwerp.datum) return "Kies eerst de datum van jullie bruiloft."
    return null
  }

  async function voerUit(actie: Actie) {
    const fout = controleer()
    if (fout) { setMelding({ tekst: fout, fout: true }); setStap("tekst"); return }
    if (!userEmail) { setMailActie(actie); setMailVerstuurd(false); return }
    setBusy(actie)
    setMelding(null)
    // Voor het opslaan vastleggen, want daarna is eventId gevuld.
    const eersteKeer = !eventId
    try {
      const ids = await slaOp()
      if (actie === "activeer") {
        router.push(`/betalen?event_id=${ids.eventId}&plan=${plan}`)
        return
      }
      if (eersteKeer) setOverdracht(true)
      else setMelding({ tekst: "Opgeslagen. Je vindt dit ontwerp terug in je dashboard." })
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Er ging iets mis, probeer opnieuw.", fout: true })
    } finally {
      setBusy(null)
    }
  }

  // Na inloggen via de mail: de gekozen actie afmaken
  useEffect(() => {
    if (!geladen || !userEmail) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("resume") !== "1") return
    let actie: Actie | null = null
    try {
      const a = localStorage.getItem(LS_ACTIE)
      if (a === "bewaar" || a === "activeer") actie = a
      localStorage.removeItem(LS_ACTIE)
    } catch {}
    params.delete("resume")
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
    if (actie) void voerUit(actie)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geladen, userEmail])

  async function stuurInloglink(e: React.FormEvent) {
    e.preventDefault()
    if (!mailActie || !mailAdres.trim()) return
    setBusy(mailActie)
    try {
      localStorage.setItem(LS_ACTIE, mailActie)
      const next = `/kaart-maken?type=${ontwerp.type}&plan=${plan}&resume=1`
      await createClient().auth.signInWithOtp({
        email: mailAdres.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      setMailVerstuurd(true)
    } catch {
      setMelding({ tekst: "Versturen van de inloglink mislukte, probeer opnieuw.", fout: true })
    } finally {
      setBusy(null)
    }
  }

  async function kiesFoto(file: File) {
    setBusy("foto")
    try {
      const blob = await compressImage(file, 1200, 0.8)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(new Error("Kon de foto niet lezen"))
        r.readAsDataURL(blob)
      })
      update({ photoDataUrl: dataUrl, photoUrl: null })
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Foto laden mislukt", fout: true })
    } finally {
      setBusy(null)
    }
  }

  // Een proefkaart naar het eigen mailadres. De grootste twijfel bij een
  // digitale kaart is hoe hij aankomt bij de gasten; dit haalt die twijfel weg
  // voordat er betaald wordt. Bewaren hoort erbij, want zonder bewaarde kaart
  // is er geen link om te versturen.
  async function stuurProefkaart() {
    const fout = controleer()
    if (fout) { setMelding({ tekst: fout, fout: true }); setStap("tekst"); return }
    if (!userEmail) { setMailActie("bewaar"); setMailVerstuurd(false); return }

    setBusy("proef")
    setMelding(null)
    try {
      const ids = await slaOp()
      const r = await fetch("/api/cards/proef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: ids.cardId }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string; naar?: string }
      if (!r.ok) throw new Error(j.error || "Versturen mislukte, probeer het zo opnieuw.")
      setMelding({ tekst: `Proefkaart onderweg naar ${j.naar ?? "je mailadres"}. Open hem op je telefoon.` })
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Versturen mislukte", fout: true })
    } finally {
      setBusy(null)
    }
  }

  async function downloadVoorbeeld() {
    setBusy("download")
    setMelding(null)
    try {
      const r = await fetch("/api/kaart-voorbeeld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: ontwerp.type, template: ontwerp.template, style: ontwerp.style,
          names: ontwerp.names, dateText: ontwerp.datum ? formatDate(ontwerp.datum) : "",
          location: ontwerp.location, message: ontwerp.message,
          guestType: ontwerp.guestType, inviteText: ontwerp.inviteText, timeText: ontwerp.timeText,
          photoUrl: ontwerp.photoUrl, taal: ontwerp.taal,
        }),
      })
      if (!r.ok) throw new Error("Voorbeeld maken mislukte, probeer het zo opnieuw.")
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "voorbeeld-kaart.png"
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Downloaden mislukte", fout: true })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: IVORY }}>
      {/* ── Kop ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b" style={{ backgroundColor: "#fff", borderColor: `${GOLD_LIGHT}80` }}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/" className="hidden sm:inline text-xl tracking-wide" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600, textDecoration: "none" }}>
            SayingYes
          </Link>
          {/* Wat maak je? Stond eerst in de zijbalk, maar hoort hier: zo is het
              het eerste dat je ziet en voelt de website als onderdeel van
              dezelfde bouwer in plaats van een aparte plek. */}
          <BouwerSchakelaar
            actief={ontwerp.type}
            eventId={eventId}
            opKaartType={(type) => update({ type })}
            opWebsite={neemMeeNaarWebsite}
          />
        </div>
        <div className="flex items-center gap-2">
          {userEmail && (
            <Knop href="/dashboard" soort="rand" klein className="hidden sm:inline-flex">
              Mijn dashboard
            </Knop>
          )}
          <Knop
            soort="rustig"
            klein
            onClick={() => voerUit("bewaar")}
            disabled={busy !== null}
            bezig={busy === "bewaar"}
            bezigTekst="Bewaren"
          >
            Bewaar ontwerp
          </Knop>
          {/* Zit deze kaart al in het afgenomen pakket, dan is er niets te
              activeren: bewaren is genoeg en de link werkt al. */}
          {alAfgenomen && huidigeKaart ? (
            <Knop soort="actie" href={`/kaart/${huidigeKaart.share_token}/voorbeeld`} nieuwTabblad>
              Bekijk de kaart
            </Knop>
          ) : (
            <Knop
              soort="actie"
              onClick={() => voerUit("activeer")}
              disabled={busy !== null}
              bezig={busy === "activeer"}
              bezigTekst="Naar de kassa"
            >
              {`Activeer voor ${prijs}`}
            </Knop>
          )}
        </div>
      </header>

      {/* ── De overdracht na het eerste bewaren ──
          Hier komt de gastenlijst voor het eerst ter sprake, op het enige
          moment waarop dat logisch is: je hebt net een kaart gemaakt, dus de
          vraag die je nu zelf hebt is wie hem moet krijgen. Niet als functie in
          een menu, maar als antwoord op die vraag. */}
      {overdracht && (
        <div className="px-4 md:px-6 pt-4">
          <Paneel>
            <p className="text-lg mb-1" style={{ fontFamily: "var(--font-cormorant)", color: KLEUR.inkt, fontWeight: 600 }}>
              Bewaard. Je hebt nu een {isTrouwkaart ? "trouwkaart" : "Save the Date"} in concept.
            </p>
            <p className="text-sm mb-3" style={{ color: KLEUR.tekst }}>
              Je vindt hem terug in je dashboard, ook als je dit venster sluit. Wie ga je uitnodigen?
              Je gastenlijst hoort bij elk pakket en is gratis: je houdt er zelf bij wie je hebt
              uitgenodigd en wie er komt, of je laat hem zich vullen door de reacties op je kaart.
            </p>
            <div className="flex flex-wrap gap-2">
              <Knop soort="primair" href="/dashboard#gasten" klein>
                Begin je gastenlijst
              </Knop>
              <Knop soort="rand" klein onClick={() => setOverdracht(false)}>
                Verder ontwerpen
              </Knop>
              <Knop soort="rand" href="/dashboard" klein>
                Naar je dashboard
              </Knop>
            </div>
          </Paneel>
        </div>
      )}

      {melding && (
        <Melding
          soort={melding.fout ? "fout" : "goed"}
          actie={
            !melding.fout && eventId ? (
              <Link href="/dashboard" className="underline font-semibold">
                Naar het dashboard
              </Link>
            ) : undefined
          }
        >
          {melding.tekst}
        </Melding>
      )}

      {/* ── Welke kaart bewerk je? ──
          Verschijnt zodra er iets bewaard is. Zonder deze balk is niet te zien
          dat een bruiloft meerdere kaarten kan hebben, en overschreef opslaan
          stilletjes de vorige. */}
      {eventId && kaarten.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2.5 border-b" style={{ backgroundColor: "#fff", borderColor: `${GOLD_LIGHT}80` }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Je kaarten
          </span>
          <select
            value={cardId ?? "nieuw"}
            onChange={(e) => (e.target.value === "nieuw" ? nieuweKaart() : kiesKaart(e.target.value))}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold"
            style={{ color: CHARCOAL, borderColor: GOLD_LIGHT, cursor: "pointer" }}
          >
            {kaarten.map((k) => (
              <option key={k.id} value={k.id}>{kaartLabel(k)}</option>
            ))}
            {!cardId && <option value="nieuw">Nieuwe kaart, nog niet bewaard</option>}
          </select>

          <button
            onClick={dupliceerKaart}
            disabled={busy !== null || !cardId}
            className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-40"
            style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            Deze kopiëren
          </button>
          <button
            onClick={nieuweKaart}
            disabled={busy !== null || kaarten.length >= MAX_KAARTEN_PER_EVENT}
            className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-40"
            style={{ color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            Nieuwe kaart
          </button>

          <span className="text-[11px] leading-snug ml-auto max-w-sm" style={{ color: SUBTLE }}>
            Elke kaart heeft zijn eigen link. Handig voor daggasten en avondgasten, of dezelfde kaart in een andere taal.
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* ── Stappen ── */}
        <aside className="w-full md:w-80 md:flex-shrink-0 bg-white border-r border-gray-100 md:overflow-y-auto">
          {/* Je concepten. Alleen zinvol als er iets bewaard is, en dat kan
              pas als je bent ingelogd. */}
          {userEmail && (concepten.length > 0 || eventId) && (
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-2" style={{ backgroundColor: GOLD_BG }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Concept</span>
              <select
                value={eventId ?? "nieuw"}
                onChange={(e) => (e.target.value === "nieuw" ? nieuwConcept() : kiesConcept(e.target.value))}
                className={inputCls}
                style={{ ...inputStyle, fontWeight: 600, cursor: "pointer" }}
              >
                {concepten.map((c) => (
                  <option key={c.id} value={c.id}>{conceptLabel(c)}</option>
                ))}
                {!eventId && <option value="nieuw">Nieuw concept, nog niet bewaard</option>}
                {eventId && <option value="nieuw">+ Nieuw concept beginnen</option>}
              </select>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Geef dit concept een naam"
                value={conceptNaam}
                onChange={(e) => setConceptNaam(e.target.value)}
                maxLength={60}
              />
              <p className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                Alleen voor jezelf, om varianten uit elkaar te houden. Je gasten zien dit niet.
              </p>
            </div>
          )}

          <Sectie open={stap === "tekst"} onToggle={() => setStap(stap === "tekst" ? null : "tekst")} titel="Tekst op de kaart">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Jullie namen</span>
              {/* Een tekstvak en geen invoerregel, zodat een enter werkt: veel
                  paren zetten de tweede naam graag op een eigen regel. */}
              <textarea
                className={`${inputCls} resize-none`}
                style={{ ...inputStyle, minHeight: 48 }}
                rows={2}
                placeholder="Sophie & Daan"
                value={ontwerp.names}
                onChange={(e) => update({ names: e.target.value })}
                maxLength={80}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Trouwdatum</span>
              <input type="date" className={inputCls} style={inputStyle} value={ontwerp.datum} onChange={(e) => update({ datum: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Locatie</span>
              <textarea
                className={`${inputCls} resize-none`}
                style={{ ...inputStyle, minHeight: 48 }}
                rows={2}
                placeholder={"Landgoed Duno\nDoorwerth"}
                value={ontwerp.location}
                onChange={(e) => update({ location: e.target.value })}
                maxLength={120}
              />
              <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                Deze locatie staat op deze kaart. Maak je een aparte kaart voor de avondgasten, dan kan die een andere locatie hebben.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Boodschap</span>
              <textarea className={inputCls} style={{ ...inputStyle, minHeight: 84 }} placeholder={display.message} value={ontwerp.message} onChange={(e) => update({ message: e.target.value })} maxLength={400} />
            </label>
          </Sectie>

          <Sectie open={stap === "stijl"} onToggle={() => setStap(stap === "stijl" ? null : "stijl")} titel="Stijl">
            <div className="grid grid-cols-5 gap-2">
              {STYLE_KEYS.map((s) => {
                const cfg = STYLE_CONFIG[s]
                const actief = ontwerp.style === s
                return (
                  <button
                    key={s}
                    onClick={() => update({ style: s })}
                    title={STYLE_LABEL[s]}
                    className="flex flex-col items-center gap-1.5"
                    style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
                  >
                    <span
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${cfg.bodyBg} 50%, ${cfg.accent} 50%)`,
                        boxShadow: actief ? `0 0 0 2px #fff, 0 0 0 4px ${GOLD}` : "0 0 0 1px rgba(0,0,0,0.08)",
                      }}
                    />
                    <span className="text-[10px]" style={{ color: actief ? CHARCOAL : BODY, fontWeight: actief ? 700 : 500 }}>{STYLE_LABEL[s]}</span>
                  </button>
                )
              })}
            </div>
          </Sectie>

          <Sectie open={stap === "template"} onToggle={() => setStap(stap === "template" ? null : "template")} titel="Ontwerp">
            <div className="flex flex-col gap-2">
              {CARD_DESIGNS.map((t) => (
                <button
                  key={t}
                  onClick={() => update({ template: t })}
                  className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: `2px solid ${cardDesign(ontwerp.template) === t ? GOLD : GOLD_LIGHT}`, backgroundColor: cardDesign(ontwerp.template) === t ? "#fff" : "transparent", color: CHARCOAL, cursor: "pointer" }}
                >
                  {CARD_TEMPLATE_LABEL[t]}
                  <span className="block text-[11px] font-normal" style={{ color: BODY }}>{CARD_TEMPLATE_UITLEG[t]}</span>
                </button>
              ))}
            </div>
          </Sectie>

          {/* Een foto kan bij elk ontwerp */}
          <Sectie open={stap === "foto"} onToggle={() => setStap(stap === "foto" ? null : "foto")} titel="Foto (optioneel)">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void kiesFoto(f) }} />
              {(ontwerp.photoDataUrl || ontwerp.photoUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ontwerp.photoUrl ?? ontwerp.photoDataUrl ?? ""} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: 140 }} />
              )}
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={busy === "foto"} className="flex-1 text-sm font-semibold px-3 py-2.5 rounded-xl disabled:opacity-60" style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}>
                  {busy === "foto" ? "Bezig..." : ontwerp.photoDataUrl || ontwerp.photoUrl ? "Andere foto" : "Kies een foto"}
                </button>
                {(ontwerp.photoDataUrl || ontwerp.photoUrl) && (
                  <button onClick={() => update({ photoDataUrl: null, photoUrl: null })} className="text-sm font-semibold px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#fff", color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}>
                    Weg
                  </button>
                )}
              </div>
            </Sectie>

          {/* Hoe de envelop opengaat bij de gast. Het uitschuiven, het brekende
              zegel en het verende landen zitten in beide keuzes; het verschil
              is alleen of er gouden stofjes bij komen. */}
          <Sectie open={stap === "aanmelden"} onToggle={() => setStap(stap === "aanmelden" ? null : "aanmelden")} titel="Aanmelden">
            <div className="flex flex-col gap-2">
              {(["geen", "janee", "volledig"] as AanmeldStand[]).map((s) => (
                <button
                  key={s}
                  onClick={() => update({ aanmelden: s })}
                  className="text-left px-3 py-2.5 rounded-xl"
                  style={{
                    border: `2px solid ${ontwerp.aanmelden === s ? GOLD : GOLD_LIGHT}`,
                    backgroundColor: ontwerp.aanmelden === s ? "#fff" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span className="block text-xs font-semibold" style={{ color: CHARCOAL }}>{AANMELD_LABEL[s]}</span>
                  <span className="block text-[11px] leading-snug" style={{ color: SUBTLE }}>{AANMELD_UITLEG[s]}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
              Wat je gasten invullen komt in je gastenlijst. Bij een Save the Date is alleen vragen of ze
              komen meestal genoeg; dieetwensen vraag je pas bij de uitnodiging, want zo ver vooruit weet
              niemand dat. Volledig aanmelden hoort bij het pakket Uitnodiging &amp; RSVP.
            </p>
          </Sectie>

          <Sectie open={stap === "taal"} onToggle={() => setStap(stap === "taal" ? null : "taal")} titel="Taal van de kaart">
            <div className="grid grid-cols-2 gap-2">
              {CARD_TALEN.map((tl) => (
                <button
                  key={tl}
                  onClick={() => update({ taal: tl })}
                  className="text-xs font-semibold px-3 py-2 rounded-xl"
                  style={{
                    border: `2px solid ${ontwerp.taal === tl ? GOLD : GOLD_LIGHT}`,
                    backgroundColor: ontwerp.taal === tl ? "#fff" : "transparent",
                    color: CHARCOAL,
                    cursor: "pointer",
                  }}
                >
                  {CARD_TAAL_LABEL[tl]}
                </button>
              ))}
            </div>
          </Sectie>

          <Sectie open={stap === "animatie"} onToggle={() => setStap(stap === "animatie" ? null : "animatie")} titel="Openen">
            <div className="flex flex-col gap-2">
              {CARD_ANIMATIE_KEUZES.map((a) => (
                <button
                  key={a}
                  onClick={() => update({ animatie: a })}
                  className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: `2px solid ${ontwerp.animatie === a ? GOLD : GOLD_LIGHT}`, backgroundColor: ontwerp.animatie === a ? "#fff" : "transparent", color: CHARCOAL, cursor: "pointer" }}
                >
                  {CARD_ANIMATIE_LABEL[a]}
                  <span className="block text-[11px] font-normal" style={{ color: BODY }}>{CARD_ANIMATIE_UITLEG[a]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSimulatie(true)}
              className="text-sm font-semibold px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
            >
              Bekijk hoe het opengaat
            </button>
          </Sectie>

          <Sectie open={stap === "bekijken"} onToggle={() => setStap(stap === "bekijken" ? null : "bekijken")} titel="Bekijken">
            <button
              onClick={() => setSimulatie(true)}
              className="w-full text-sm font-semibold px-3 py-3 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}
            >
              💌 Zo ontvangen je gasten hem
            </button>
            <Knop soort="rand" breed onClick={stuurProefkaart} disabled={busy !== null} bezig={busy === "proef"} bezigTekst="Versturen">
              ✉️ Stuur een proefkaart naar mezelf
            </Knop>
            <Knop soort="rand" breed onClick={downloadVoorbeeld} disabled={busy !== null} bezig={busy === "download"} bezigTekst="Maken">
              ⬇ Download voorbeeld
            </Knop>
            <p className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
              De proefkaart gaat naar je eigen mailadres, zodat je hem op je telefoon kunt openen zoals je gasten dat doen. Het voorbeeld draagt een watermerk; na activeren krijg je de kaart zonder, plus de link om te delen.
            </p>
          </Sectie>
        </aside>

        {/* ── Voorbeeld ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ backgroundColor: "#F1ECE3" }}>
          <div className="mx-auto max-w-md">
            <p className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: SUBTLE }}>
              Zo ziet jullie kaart eruit
            </p>
            <div className="rounded-2xl shadow-xl overflow-clip">
              <CardReveal
                display={display}
                initials={initialen}
                sc={sc}
                siteUrl={null}
                rsvpUrl={null}
                startOpen
                watermerk="licht"
              />
            </div>

          </div>
        </main>
      </div>

      {/* ── Envelopsimulatie ── */}
      {simulatie && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ backgroundColor: sc.bodyBackground ?? sc.bodyBg }}>
          <button
            onClick={() => setSimulatie(false)}
            className="fixed top-12 right-4 z-[110] text-sm font-semibold px-4 py-2 rounded-xl shadow-lg"
            style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            ✕ Terug naar ontwerpen
          </button>
          <CardReveal
            /* De animatie in de key, zodat de simulatie opnieuw begint als je
               een andere manier van openen kiest */
            key={`${ontwerp.style}-${ontwerp.template}-${ontwerp.animatie}`}
            display={display}
            initials={initialen}
            sc={sc}
            siteUrl={null}
            rsvpUrl={null}
            /* Pas zichtbaar zodra de kaart bewaard is; eerder is er geen link
               om de datum vandaan te halen. */
            agendaUrl={huidigeKaart && ontwerp.datum ? `/kaart/${huidigeKaart.share_token}/agenda` : null}
            previewNotice
          />
        </div>
      )}

      {/* ── E-mail vragen bij bewaren of activeren ── */}
      {mailActie && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setMailActie(null)}>
          <div className="w-full max-w-md rounded-3xl p-7" style={{ backgroundColor: IVORY }} onClick={(e) => e.stopPropagation()}>
            {mailVerstuurd ? (
              <>
                <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}>Check je mail 💌</h2>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                  We hebben een inloglink gestuurd naar <strong style={{ color: CHARCOAL }}>{mailAdres}</strong>. Klik erop en je komt hier terug; je ontwerp staat dan klaar en we gaan meteen verder met {mailActie === "activeer" ? "activeren" : "bewaren"}.
                </p>
                <button onClick={() => setMailActie(null)} className="mt-6 w-full text-sm font-semibold px-4 py-3 rounded-xl" style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}>
                  Sluiten
                </button>
              </>
            ) : (
              <form onSubmit={stuurInloglink}>
                <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}>
                  {mailActie === "activeer" ? "Bijna klaar om te versturen" : "Bewaar jullie ontwerp"}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: BODY }}>
                  {mailActie === "activeer"
                    ? "Vul je e-mailadres in voor de inlog en de factuur. Je krijgt een link, klikt erop en betaalt daarna via Mollie. Je ontwerp gaat niet verloren."
                    : "Vul je e-mailadres in en we bewaren dit ontwerp in je dashboard, zodat je er later op elk apparaat aan verder kunt. Geen wachtwoord, je logt in met een link."}
                </p>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="jullie@voorbeeld.nl"
                  value={mailAdres}
                  onChange={(e) => setMailAdres(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
                <button type="submit" disabled={busy !== null} className="mt-4 w-full text-sm font-bold px-4 py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: mailActie === "activeer" ? "#059669" : CHARCOAL, color: "#fff", border: "none", cursor: "pointer" }}>
                  {busy ? "Bezig..." : mailActie === "activeer" ? `Stuur mij de link en activeer voor ${prijs}` : "Stuur mij de link"}
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-center" style={{ color: SUBTLE }}>
                  Door verder te gaan ga je akkoord met onze <Link href="/voorwaarden" className="underline">voorwaarden</Link> en ons <Link href="/privacy" className="underline">privacybeleid</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
