"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { STYLE_CONFIG, STYLE_NAAM, STYLE_VOLGORDE, getStyleConfig, formatDate, isStyle, type SC, type Style } from "@/lib/event-styles"
import {
  buildCardDisplay,
  cardAnimatie,
  cardDesign,
  CARD_DESIGNS,
  FOTO_ONTWERPEN,
  CARD_TAAL_LABEL,
  CARD_TALEN,
  cardTaal,
  CARD_TEMPLATE_LABEL,
  CARD_TYPE_PLAN,
  KAART_TEKST,
  CARD_GUEST_TYPES,
  GUEST_TYPE_LABEL,
  kaartLabel,
  MAX_KAARTEN_PER_EVENT,
  type CardAnimatie,
  type CardContent,
  type CardDisplay,
  type CardGuestType,
  type CardRow,
  type CardTaal,
  type CardTemplate,
  type CardType,
} from "@/lib/cards"
import { hoogstePlan, planMagVersturen, PLANS, formatEur, isPlan, upgradePrice, type Plan, planAllows} from "@/lib/plans"
import { compressImage } from "@/lib/client-image"
import CardReveal from "@/app/kaart/[token]/card-reveal"
import Voorkant from "@/components/kaart/Voorkant"
import { kaartKleuren } from "@/lib/kaart-paletten"
import { ONDER_DE_KAART, ONTWERP_VERHOUDING } from "@/lib/kaart-ontwerpen"
import { KLEUR } from "@/lib/ontwerp"
import { initialenLijst } from "@/lib/initialen"
import {
  AANMELD_LABEL,
  AANMELD_UITLEG,
  aanmeldStand,
  standaardAanmeldStand,
  type AanmeldStand,
} from "@/lib/gasten"
import { Draaier, Knop, Melding, Sectie } from "@/components/ui"
import AanmeldFormulier from "@/components/AanmeldFormulier"
import BouwerSchil from "@/components/BouwerSchil"
import {
  DEFAULT_PRAKTISCH,
  DEFAULT_PROGRAMMA,
  LS_NAAR_WEBSITE,
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
/** De locatie van de bruiloft hoort niet bij het kaartontwerp, dus die staat
 *  apart. Zonder dit was hij weg zodra je even naar de websitebouwer ging. */
const LS_BRUILOFT_LOCATIE = "sayingyes_bruiloft_locatie"
const LS_ACTIE   = "sayingyes_kaart_actie"
const LS_IDS     = "sayingyes_kaart_ids"

// Dezelfde namen en volgorde als in de websitebouwer
const STYLE_LABEL = STYLE_NAAM
const STYLE_KEYS = STYLE_VOLGORDE

interface ConceptRij {
  id: string
  title: string
  concept_naam: string | null
  datum: string | null
  status: string
}

type Stap = "stijl" | "template" | "tekst" | "groep" | "details" | "aanmelden" | "taal" | "foto" | "animatie" | "bekijken"

// ── Op de telefoon ──────────────────────────────────────────────────────────
// De kaart is het scherm en het gereedschap zit onder je duim, zoals in Canva
// of een Instagram-verhaal. Vijf knoppen onderaan openen elk een paneel van
// onderen met alleen die onderdelen; de kaart blijft erboven zichtbaar en
// verandert live mee. Michiels wens van 24 september 2026: de lange lijst
// onder een half afgesneden kaart was rommelig. Op een groot scherm blijft
// alles zoals het was.
// Vier categorieën, en elk onderdeel hoort bij precies één. Michiels wens van
// 25 september 2026: geen "Meer" als restbak. Op de laptop staan ze als
// kopjes in de zijbalk, in dezelfde volgorde.
type Blad = "kaart" | "tekst" | "uiterlijk" | "gasten" | "bekijken"
const BLAD_SECTIES: Record<Exclude<Blad, "kaart">, Stap[]> = {
  tekst: ["tekst", "details", "taal"],
  uiterlijk: ["stijl", "template", "foto"],
  gasten: ["groep", "aanmelden"],
  bekijken: ["bekijken"],
}
const BLAD_TITEL: Record<Blad, string> = {
  kaart: "Je kaarten",
  tekst: "Tekst",
  uiterlijk: "Uiterlijk",
  gasten: "Gasten",
  bekijken: "Bekijken",
}
// De volgorde in de zijbalk. Letterlijk uitgeschreven, zodat Tailwind de
// klassen vindt.
const VOLGORDE: Record<Stap, string> = {
  stijl: "order-[11]", template: "order-[12]", foto: "order-[13]", animatie: "order-[14]",
  groep: "order-[21]", aanmelden: "order-[22]",
  tekst: "order-[31]", details: "order-[32]", taal: "order-[33]",
  bekijken: "order-[41]",
}
// De volgorde waarin we je erdoorheen leiden: eerst hoe hij eruitziet, dan
// voor wie hij is, dan wat erop staat, en dan kijken. Michiels keuze van
// 25 september 2026.
const CATEGORIE_VOLGORDE = ["uiterlijk", "gasten", "tekst", "bekijken"] as const

function BladIcoon({ blad }: { blad: Exclude<Blad, "kaart"> }) {
  const pad = {
    tekst: "M4 7V5h16v2M9 19h6M12 5v14",
    uiterlijk: "M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.76-2.24 4-5 4h-1.5a1.5 1.5 0 0 0-1.06 2.56A1.5 1.5 0 0 1 12 21zM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM16.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    gasten: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.13a4 4 0 0 1 0 7.75M22 21v-1a6 6 0 0 0-4-5.65",
    bekijken: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  }[blad]
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={pad} />
    </svg>
  )
}
type Actie = "bewaar" | "activeer"

/** Een labeltje achter een tekstveld: komt het op de kaart of eronder? */
function Plek({ waar }: { waar: "op" | "onder" | "niet" }) {
  const tekst = waar === "op" ? "op de kaart" : waar === "onder" ? "onder de kaart" : "niet op de kaart"
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={
        waar === "op"
          ? { backgroundColor: "#FBF5E8", color: "#9A7B3F", border: "1px solid #E8D5A3" }
          : { backgroundColor: "#F3F1EE", color: "#7A7068", border: "1px solid #E4E0DA" }
      }
    >
      {tekst}
    </span>
  )
}

/**
 * Een kaart in het klein, voor de galerij met ontwerpen: jullie eigen namen
 * en datum in dat ontwerp. Getekend op 400 pixels breed en verkleind tot de
 * breedte van het vakje, zodat hij er precies zo uitziet als de echte kaart.
 */
function Miniatuur({ display, sc }: { display: CardDisplay; sc: SC }) {
  const vak = useRef<HTMLDivElement>(null)
  // Elke miniatuur vult zijn vakje, allemaal even groot (Michiel, 25
  // september 2026). De kaart wordt op de breedte geschaald en de eerste drie
  // ontwerpen krijgen de hoogte van het vakje, met de inhoud in het midden.
  // Is een kaart toch hoger, bijvoorbeeld met een foto en een lange tekst,
  // dan valt de onderkant weg; in het klein zie je genoeg.
  const [schaal, setSchaal] = useState(0.28)
  useEffect(() => {
    const v = vak.current
    if (!v) return
    const meet = () => setSchaal(v.clientWidth / 400)
    const ro = new ResizeObserver(meet)
    ro.observe(v)
    // Ook meteen een keer, niet pas bij de eerste melding van de observer
    const t = setTimeout(meet, 0)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [])
  // De miniatuur laat het idee van het ontwerp zien. De gekozen foto alleen
  // bij Foto en Boog, waar hij bij het ontwerp hoort; bij de rest zag je
  // vooral de foto en nauwelijks nog het ontwerp (Michiel, 25 september
  // 2026). Een eigen ontwerp in de verhouding van het vakje.
  const fotoHoortErbij = display.design === "fotovol" || display.design === "boog"
  const d = {
    ...display,
    ...(fotoHoortErbij ? {} : { photoUrl: null }),
    ...(display.design === "eigen" ? { ontwerpVerhouding: 1.4 } : {}),
  }
  return (
    <div
      ref={vak}
      aria-hidden
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: "5 / 7", backgroundColor: sc.bodyBg, pointerEvents: "none" }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: 400,
          // Een vierkante kaart staat in het midden van het staande vakje
          transform: `translateY(${((560 - 400 * (ONTWERP_VERHOUDING[display.design as keyof typeof ONTWERP_VERHOUDING] ?? 1.4)) / 2) * schaal}px) scale(${schaal})`,
          transformOrigin: "top left",
        }}
      >
        <Voorkant display={d} sc={sc} breedte={400} vullen={560} />
      </div>
    </div>
  )
}

interface KaartOntwerp {
  type: CardType
  style: Style
  /** Een eigen palet voor deze kaart; leeg is de kleuren van de website */
  kleur: string
  /** Eigen ontwerp: geüpload, of nog alleen in de browser */
  ontwerpUrl: string | null
  ontwerpDataUrl: string | null
  ontwerpVerhouding: number | null
  template: CardTemplate
  names: string
  datum: string
  // De locatie van de bruiloft. Hoort bij het event, niet bij de kaart.
  location: string
  message: string
  guestType: CardGuestType | ""
  inviteText: string
  timeText: string
  /** Hoe jij deze kaart noemt, om ze uit elkaar te houden. Gasten zien dit niet. */
  naam: string
  /** De gastengroep subtiel op de kaart tonen. */
  toonGastType: boolean
  dresscode: string
  photoDataUrl: string | null
  photoUrl: string | null
  animatie: CardAnimatie
  taal: CardTaal
  aanmelden: AanmeldStand
}

const LEEG: KaartOntwerp = {
  type: "save_the_date",
  style: "zand",
  kleur: "",
  ontwerpUrl: null,
  ontwerpDataUrl: null,
  ontwerpVerhouding: null,
  template: "klassiek",
  names: "",
  datum: "",
  location: "",
  message: "",
  guestType: "",
  inviteText: "",
  timeText: "",
  naam: "",
  toonGastType: false,
  dresscode: "",
  photoDataUrl: null,
  photoUrl: null,
  animatie: "rustig",
  taal: "nl",
  aanmelden: "geen",
}


function isCardType(v: unknown): v is CardType {
  return v === "save_the_date" || v === "trouwkaart"
}

/** Wat er bij Aanmelden gekozen is, kort genoeg voor de kop van de sectie. */
const AANMELD_KORT: Record<AanmeldStand, string> = {
  geen: "uit",
  janee: "ja of nee",
  adres: "ja of nee, adres",
  volledig: "volledig",
}

/** Een vierkant knopje met alleen een pictogram; de uitleg zit in de title. */
function IconKnop({
  title,
  onClick,
  disabled,
  bezig,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  bezig?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 flex-shrink-0 inline-flex items-center justify-center rounded-xl disabled:opacity-40 [&>svg]:w-[18px] [&>svg]:h-[18px]"
      style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: disabled ? "default" : "pointer" }}
    >
      {bezig ? <Draaier maat={16} /> : children}
    </button>
  )
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

export default function KaartMakenPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  // Het formulier onder de kaart in het voorbeeld. Zet je Aanmelden aan, dan
  // scrollen we daarnaartoe, anders zie je niet dat er iets bij is gekomen.
  const formulierRef = useRef<HTMLDivElement>(null)
  /** Het voorbeeldvlak zelf, zodat we daarbinnen scrollen en niet de hele pagina. */
  const voorbeeldRef = useRef<HTMLElement>(null)

  const [ontwerp, setOntwerp] = useState<KaartOntwerp>(LEEG)
  const [geladen, setGeladen] = useState(false)
  // Een bestaande kaart openen: eerst ophalen, dan pas tonen. Eerst stond
  // hier een paar tellen het ontwerp uit de browser, vaak een andere kaart,
  // en mislukte het ophalen dan bleef dat staan tot je ververste (Michiel,
  // 26 september 2026).
  const [ophalen, setOphalen] = useState(false)
  // Hoeveel keer je zelf iets veranderd hebt sinds het laatste bewaren. Het
  // ontwerp staat altijd in je browser, maar open je de kaart later vanuit
  // het dashboard, dan wint de server; vandaar dat we het bijhouden. Geteld
  // in update(), want alleen dat is een wijziging van jou: het laden en het
  // wisselen van kaart gaan buiten update() om.
  const [wijzigingen, setWijzigingen] = useState(0)
  // De teller loopt alleen op; "bewaardTot" is waar hij stond bij het laatste
  // bewaren. Zo gaat een wijziging die je tijdens het bewaren typt niet
  // verloren: die telt gewoon als nog niet bewaard.
  const wijzigingRef = useRef(0)
  const [bewaardTot, setBewaardTot] = useState(0)
  const [autoBezig, setAutoBezig] = useState(false)
  const [autoFout, setAutoFout] = useState(false)
  // null betekent: alles dichtgeklapt. Zonder die stand kon een blok alleen
  // wisselen naar een ander blok, en was Tekst dus nooit dicht te krijgen.
  // Standaard alles dicht. Alleen een nieuw ontwerp opent bij de tekst, en dat
  // beslist het laden hieronder meteen. Eerst stond hier "tekst", en dan klapte
  // die sectie een paar tellen later dicht zodra een bestaande kaart binnen
  // was (Michiel, 24 september 2026).
  const [stap, setStap] = useState<Stap | null>(null)
  // Welk paneel op de telefoon open is; op een groot scherm doet dit niets.
  const [blad, setBlad] = useState<Blad | null>(null)
  // Heb je Gasten al eens bekeken? Dan heb je bewust gekozen of je gasten iets
  // moeten laten weten, en verdwijnt het stipje.
  const [gastenGezien, setGastenGezien] = useState(false)
  const [sleep, setSleep] = useState(0)
  const sleepStart = useRef<number | null>(null)
  // Twee standen, zoals elk paneel op een telefoon: vol, of klein met alleen
  // de kop zichtbaar zodat je de hele kaart ziet. Half omlaag vegen maakt hem
  // klein, verder vegen sluit hem, omhoog vegen of op de kop tikken maakt
  // hem weer vol (Michiel, 25 september 2026).
  const [bladKlein, setBladKlein] = useState(false)
  const bladRef = useRef<HTMLElement>(null)
  // Een nieuw paneel begint bovenaan. Anders bleef de scrollstand van het
  // vorige staan en kwam je met Volgende onderaan het volgende onderdeel uit
  // (Michiel, 25 september 2026).
  useLayoutEffect(() => {
    if (bladRef.current) bladRef.current.scrollTop = 0
  }, [blad])
  function openBlad(b: Blad | null) {
    setBlad(b)
    setSleep(0)
    setBladKlein(false)
    if (b && b !== "kaart") setStap(BLAD_SECTIES[b][0])
    if (b === "gasten") setGastenGezien(true)
  }
  // Waar nog iets te doen is: een stipje op de werkbalk en bij het kopje in de
  // zijbalk. Tekst zonder namen of datum, en Gasten zolang je nog niet hebt
  // gekozen of je gasten iets moeten laten weten.
  const stip: Partial<Record<Blad, boolean>> = {
    tekst: !ontwerp.names.trim() || !ontwerp.datum,
    gasten: ontwerp.aanmelden === "geen" && !gastenGezien && stap !== "aanmelden",
  }

  // Vegen over de kaart gaat naar je vorige of volgende kaart van dit soort,
  // bijvoorbeeld van daggasten naar avondgasten. Wat nog niet bewaard is,
  // bewaren we eerst.
  const veegStart = useRef<{ x: number; y: number } | null>(null)
  async function veeg(richting: 1 | -1) {
    const lijst = kaarten.filter((k) => k.type === ontwerp.type)
    if (lijst.length < 2) return
    const nu = lijst.findIndex((k) => k.id === cardId)
    const volgende = lijst[nu + richting]
    if (!volgende) return
    if (onbewaard && userEmail && ontwerp.names.trim() && ontwerp.datum) {
      try { await slaOp() } catch { return }
    }
    kiesKaart(volgende.id)
  }

  // Welke categorie na deze komt, voor de knop onderaan het paneel
  const volgende = blad && blad !== "kaart" ? CATEGORIE_VOLGORDE[CATEGORIE_VOLGORDE.indexOf(blad) + 1] : undefined

  /** Hoort deze sectie bij het paneel dat nu op de telefoon open is? */
  function inPaneel(s: Stap): boolean {
    return !!blad && blad !== "kaart" && BLAD_SECTIES[blad].includes(s)
  }
  /**
   * De klassen van een sectie: zijn plek in de zijbalk, en op de telefoon
   * alleen zichtbaar in zijn eigen paneel.
   */
  function telefoon(s: Stap): string {
    return `${VOLGORDE[s]} ${inPaneel(s) ? "" : "max-md:hidden"}`
  }
  /**
   * Open of dicht. In een paneel op de telefoon staat alles open: dan mis je
   * niets, zoals eerst Ontwerp onder Stijl (Michiel, 25 september 2026). Op
   * de laptop blijft het één tegelijk.
   */
  function isOpen(s: Stap): boolean {
    return stap === s || inPaneel(s)
  }
  /**
   * Tik op de kaart en je bewerkt wat je aanraakt: de namen, de datum, de
   * locatie of de boodschap. Op de telefoon opent het tekstpaneel, op een
   * groot scherm de sectie in de zijbalk.
   */
  function tikOpKaart(e: React.MouseEvent) {
    // Witruimte gelijk trekken: namen over drie regels komen binnen als
    // "michiel↵&↵lindsey" en staan in het ontwerp als "michiel & lindsey".
    const schoon = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()
    const aangeraakt = schoon((e.target as HTMLElement).innerText ?? "")
    if (!aangeraakt) return
    // In beide richtingen: tik je op "Michiel" en de namen staan over drie
    // regels, dan is "michiel" een stuk van de namen, niet andersom.
    const bevat = (s: string) => {
      const w = schoon(s)
      return !!w && (aangeraakt.includes(w.slice(0, 12)) || w.includes(aangeraakt))
    }
    // Vergelijken met wat er op de kaart staat, niet met wat er is ingevuld:
    // zonder namen toont de kaart "Jullie namen", en daar tik je dan op.
    const veld = bevat(display.names) ? "kaart-namen"
      : bevat(display.dateText) || (aangeraakt.length < 40 && /\d{4}/.test(aangeraakt)) ? "kaart-datum"
      : bevat(display.location) ? "kaart-locatie"
      : "kaart-boodschap"
    if (window.matchMedia("(max-width: 767px)").matches) openBlad("tekst")
    setStap("tekst")
    setTimeout(() => {
      const el = document.getElementById(veld) as HTMLInputElement | HTMLTextAreaElement | null
      el?.focus()
      // De cursor achteraan, zodat je meteen kunt weghalen of aanvullen
      if (el && el.type !== "date") {
        const eind = el.value.length
        try { el.setSelectionRange(eind, eind) } catch {}
      }
      el?.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 60)
  }
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

  // Kom je net terug van de inloglink, dan moet je ontwerp eerst bewaard worden
  // voordat je naar de kassa kunt. Dat duurt een paar tellen, en je zag in die
  // tijd de bouwer zonder dat er iets gebeurde. Michiel zat er twintig seconden
  // naar te kijken en dacht dat het klaar was. Nu ligt er een laag over met wat
  // er gebeurt.
  const [hervatten, setHervatten] = useState(() => {
    if (typeof window === "undefined") return false
    return new URLSearchParams(window.location.search).get("resume") === "1"
  })

  // Welk pakket deze kaart nodig heeft om verstuurd te mogen worden. Ontwerpen
  // mag altijd; dit is puur wat de kassa straks vraagt.
  const kaartPlan = CARD_TYPE_PLAN[ontwerp.type]
  // Wat de klant afneemt is het hoogste van wat hij al koos en wat deze kaart
  // vraagt: wie Compleet heeft, hoeft voor een tweede kaart niets meer.
  const plan = hoogstePlan(eventPlan ?? kaartPlan, kaartPlan)

  // Mag deze kaart het volledige aanmeldformulier hebben? Op een Save the Date
  // niet: dat pakket kent geen RSVP, dus een gast die het invulde kreeg van het
  // aanmeldendpoint een weigering. Je kon het wel kiezen en daarna gewoon voor
  // 15 euro activeren, en dan beloofde de bouwer iets dat de rest van de site
  // niet kan leveren.
  const magVolledig = planAllows(plan, "rsvp")
  const aanmeldKeuzes: AanmeldStand[] = magVolledig
    ? ["geen", "janee", "adres", "volledig"]
    : ["geen", "janee", "adres"]

  // Stond er al volledig op een kaart die dat niet mag, bijvoorbeeld omdat het
  // ooit wel kon, dan zetten we hem terug. Anders staat er een keuze in de
  // kaart die nergens in de knoppen te zien is.
  useEffect(() => {
    if (!magVolledig && ontwerp.aanmelden === "volledig") {
      setOntwerp((o) => ({ ...o, aanmelden: "janee" }))
    }
  }, [magVolledig, ontwerp.aanmelden])

  /**
   * Naar het formulier onder de kaart scrollen, binnen het voorbeeldvlak zodat
   * de kop van de bouwer blijft staan.
   *
   * Aan de klik gehangen en niet aan een verandering: bij een Save the Date
   * staat "Aanwezig ja/nee" al aan, en dan verandert er niets als je erop
   * drukt. Je zag dus ook niets gebeuren.
   */
  function toonFormulier() {
    setTimeout(() => {
      const vlak = voorbeeldRef.current
      const doel = formulierRef.current
      if (vlak && doel) vlak.scrollTo({ top: Math.max(0, doel.offsetTop - 16), behavior: "smooth" })
    }, 60)
  }
  // Al betaald en het pakket dekt deze kaart? Dan is de kaart meteen live.
  const alAfgenomen = eventStatus === "published" && planMagVersturen(eventPlan, ontwerp.type)
  // Wat er nog bij komt: bij een betaalde bruiloft alleen het verschil.
  const bijTeBetalen =
    eventStatus === "published" ? (upgradePrice(eventPlan, plan) ?? 0) : PLANS[plan].price
  const prijs = formatEur(bijTeBetalen).replace(",00", "")
  const isTrouwkaart = ontwerp.type === "trouwkaart"
  const huidigeKaart = kaarten.find((k) => k.id === cardId) ?? null
  // Alleen de kaarten van het soort waar je nu in zit: in de trouwkaart heb
  // je niets aan de lijst met Save the Dates.
  const kaartenVanDitSoort = kaarten.filter((k) => k.type === ontwerp.type)

  function update(patch: Partial<KaartOntwerp>) {
    setOntwerp((o) => ({ ...o, ...patch }))
    wijzigingRef.current += 1
    setWijzigingen(wijzigingRef.current)
  }

  // ── Laden: URL, bestaand event, of ontwerp uit de browser ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const typeUitUrl = params.get("type")
    const eventUitUrl = params.get("event_id")
    const kaartUitUrl = params.get("card_id")

    let basis: KaartOntwerp = LEEG
    let eventUitOpslag: string | null = null
    let kaartUitOpslag: string | null = null
    try {
      const bewaard = localStorage.getItem(LS_ONTWERP)
      if (bewaard) basis = { ...LEEG, ...(JSON.parse(bewaard) as Partial<KaartOntwerp>) }
      const locatieBewaard = localStorage.getItem(LS_BRUILOFT_LOCATIE)
      if (locatieBewaard) {
        setEventLocatie(locatieBewaard)
        // De locatie uit het dashboard als voorzet op de kaart. Het is een
        // suggestie: wat je hier typt wint, en alleen een afwijkende locatie
        // wordt bij de kaart bewaard (Michiels wens van 24 september 2026).
        if (!basis.location) basis = { ...basis, location: locatieBewaard }
      }
      const ids = localStorage.getItem(LS_IDS)
      if (ids) {
        const { eventId: e, cardId: c } = JSON.parse(ids) as { eventId?: string; cardId?: string }
        if (e) { setEventId(e); eventUitOpslag = e }
        if (c) { setCardId(c); kaartUitOpslag = c }
      }
    } catch {}
    // Een ander soort kaart dan wat er in de browser stond? Dan ook de
    // aanmeldkeuze van dat soort, niet die van de vorige kaart.
    if (isCardType(typeUitUrl)) {
      basis = typeUitUrl === basis.type
        ? basis
        : { ...basis, type: typeUitUrl, aanmelden: standaardAanmeldStand(typeUitUrl) }
    }
    // Met een bruiloft in de link komt de kaart van de server; het ontwerp uit
    // de browser alleen als dat niet lukt
    if (eventUitUrl) setOphalen(true)
    else setOntwerp(basis)
    // Nieuw ontwerp, geen bruiloft in de link of in de browser: begin bij de tekst.
    if (!eventUitUrl && !eventUitOpslag) setStap("stijl")

    createClient().auth.getUser().then(async ({ data }) => {
      const email = data.user?.email ?? null
      setUserEmail(email)

      // De lijst met concepten voor de keuzelijst bovenin de zijbalk. Niet
      // wachten: de kaart zelf gaat voor.
      if (email) {
        fetch("/api/drafts")
          .then((cr) => (cr.ok ? cr.json() : []))
          .then((rij) => setConcepten((rij as ConceptRij[]) ?? []))
          .catch(() => {})
      }

      // Bestaand event bewerken (vanuit het dashboard). Niet afhankelijk van
      // het e-mailadres hierboven: dat kwam op een telefoon soms net te laat
      // binnen, en dan werd de kaart niet opgehaald. De server kijkt zelf of
      // je ingelogd bent.
      if (eventUitUrl) {
        let gelukt = false
        try {
          const r = await fetch(`/api/drafts/${eventUitUrl}`)
          if (r.ok) {
            const { event } = (await r.json()) as { event: Record<string, unknown> }
            if (isPlan(event.plan)) setEventPlan(event.plan)
            setEventStatus(typeof event.status === "string" ? event.status : null)
            setHoortBij(typeof event.hoort_bij === "string" ? event.hoort_bij : null)
            const kr = await fetch(`/api/cards?event_id=${eventUitUrl}`)
            const { cards } = kr.ok ? ((await kr.json()) as { cards: CardRow[] }) : { cards: [] }
            setKaarten(cards)
            // Een link mag een kaart aanwijzen; anders valt hij terug op het
            // gevraagde type en als laatste op de nieuwste kaart.
            const gewenstType: CardType = isCardType(typeUitUrl) ? typeUitUrl : (event.plan === "uitnodiging" ? "trouwkaart" : "save_the_date")
            // Wijst de link een kaart aan, dan die. Anders de eerste kaart van
            // het gevraagde soort. Is die er niet, dan begin je een nieuwe
            // kaart van dat soort: eerder viel hij hier terug op de eerste
            // kaart van de bruiloft, een Save the Date, terwijl je op
            // Trouwkaart had geklikt (Michiel, 23 september 2026).
            // Zonder kaart in de link: de kaart van dit soort waar je het laatst
            // aan werkte, niet zomaar de eerste
            const kaart =
              (kaartUitUrl ? cards.find((c) => c.id === kaartUitUrl) : undefined) ??
              (kaartUitOpslag ? cards.find((c) => c.id === kaartUitOpslag && c.type === gewenstType) : undefined) ??
              cards.find((c) => c.type === gewenstType) ??
              (isCardType(typeUitUrl) ? undefined : cards[0])
            setEventId(eventUitUrl)
            setCardId(kaart?.id ?? null)
            // Een bestaande kaart openen: alles ingeklapt, je komt kijken en
            // niet om van voren af aan te beginnen. Michiels wens van
            // 23 september 2026. Een nieuw ontwerp begint wel bij de tekst.
            setStap(null)
            setOntwerp({
              type: kaart?.type ?? gewenstType,
              // De stijl van de kaart; oudere kaarten volgen die van de bruiloft
              style: isStyle(kaart?.content.stijl) ? kaart.content.stijl : isStyle(event.style) ? event.style : "zand",
              kleur: kaart?.content.kleur ?? "",
              ontwerpUrl: kaart?.content.ontwerpUrl ?? null,
              ontwerpDataUrl: null,
              ontwerpVerhouding: kaart?.content.ontwerpVerhouding ?? null,
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
              naam: kaart?.content.naam ?? "",
              toonGastType: kaart?.content.toonGastType === true,
              dresscode: kaart?.content.dresscode ?? "",
              photoDataUrl: null,
              photoUrl: kaart?.content.photoUrl ?? null,
              animatie: cardAnimatie(kaart?.content.animatie),
              taal: cardTaal(kaart?.content.taal),
              aanmelden: kaart?.content.aanmelden
                ? aanmeldStand(kaart.content.aanmelden)
                : standaardAanmeldStand(kaart?.type ?? gewenstType),
            })
            gelukt = true
          }
        } catch {}
        // Lukte het niet, dan het ontwerp uit de browser, zoals vroeger
        if (!gelukt) setOntwerp(basis)
        setOphalen(false)
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

  // Alleen een kaart die al op de server staat kan "onbewaard" zijn: een
  // nieuw ontwerp staat gewoon in je browser.
  const onbewaard = geladen && !!eventId && !!cardId && wijzigingen > bewaardTot

  useEffect(() => {
    if (!onbewaard) return
    function waarschuw(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", waarschuw)
    return () => window.removeEventListener("beforeunload", waarschuw)
  }, [onbewaard])

  // Ontwerp altijd lokaal bewaren, zodat niets verloren gaat bij inloggen of verversen
  useEffect(() => {
    if (!geladen) return
    try {
      localStorage.setItem(LS_ONTWERP, JSON.stringify(ontwerp))
      localStorage.setItem(LS_BRUILOFT_LOCATIE, eventLocatie)
    } catch {}
  }, [ontwerp, eventLocatie, geladen])

  // ── Weergave ──────────────────────────────────────────────────────────────
  // De kleuren van de website, of een eigen palet voor deze kaart
  const sc = kaartKleuren(getStyleConfig(ontwerp.style), ontwerp.kleur)
  // Namen en datum staan bewust niet in de inhoud van de kaart: die horen bij
  // de bruiloft. buildCardDisplay haalt ze uit het event hieronder.
  const content: CardContent = {
    // Alleen bewaren als hij afwijkt van de bruiloft: dan blijft een kaart
    // zonder eigen locatie de locatie van de bruiloft volgen.
    location: ontwerp.location.trim() && ontwerp.location.trim() !== eventLocatie.trim() ? ontwerp.location.trim() : undefined,
    message: ontwerp.message || undefined,
    guestType: ontwerp.guestType || undefined,
    timeText: ontwerp.timeText || undefined,
    naam: ontwerp.naam.trim() || undefined,
    toonGastType: ontwerp.toonGastType || undefined,
    dresscode: ontwerp.dresscode || undefined,
    photoUrl: ontwerp.photoUrl ?? ontwerp.photoDataUrl ?? undefined,
    animatie: "rustig",
    kleur: ontwerp.kleur || undefined,
    stijl: ontwerp.style,
    ontwerpUrl: ontwerp.ontwerpUrl ?? ontwerp.ontwerpDataUrl ?? undefined,
    ontwerpVerhouding: ontwerp.ontwerpVerhouding ?? undefined,
    taal: ontwerp.taal,
    aanmelden: ontwerp.aanmelden,
  }
  // Hoe deze kaart heet als je zelf niets invult: het soort kaart, de
  // gastengroep en de taal. Dat is ook de grijze tekst in het naamveld, zodat
  // je ziet wat er in je dashboard komt te staan als je het zo laat.
  const automatischeNaam = kaartLabel({ type: ontwerp.type, content: { ...content, naam: undefined } })

  // De datum wordt in buildCardDisplay opgemaakt met de locale van de gekozen
  // kaarttaal, dus die volgt de taal vanzelf mee.
  const display = buildCardDisplay(ontwerp.type, ontwerp.template, content, {
    title: ontwerp.names || "Jullie namen",
    frame_names: ontwerp.names || null,
    datum: ontwerp.datum || null,
    locatie: ontwerp.location || eventLocatie || null,
    hero_image_url: null,
  })
  // Voor op het zegel
  const initialen = initialenLijst(ontwerp.names).join("") || "♥"

  // ── Opslaan op de server (event + kaart) ──────────────────────────────────
  const slaOp = useCallback(async (): Promise<{ eventId: string; cardId: string }> => {
    const tot = wijzigingRef.current
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

    // Het eigen ontwerp op dezelfde manier: pas bij het bewaren naar de server
    let ontwerpUrl = ontwerp.ontwerpUrl
    if (ontwerp.ontwerpDataUrl && !ontwerpUrl) {
      const blob = await (await fetch(ontwerp.ontwerpDataUrl)).blob()
      const fd = new FormData()
      fd.append("file", new File([blob], "eigen-ontwerp.jpg", { type: "image/jpeg" }))
      const up = await fetch("/api/cards/upload", { method: "POST", body: fd })
      if (!up.ok) throw new Error("Jullie ontwerp uploaden lukte niet. Probeer het zo nog eens.")
      ontwerpUrl = ((await up.json()) as { url: string }).url
      update({ ontwerpUrl, ontwerpDataUrl: null })
    }

    const eventBody = {
      type: "bruiloft",
      naam: ontwerp.names || "Onze bruiloft",
      datum: ontwerp.datum,
      // De bruiloft houdt zijn eigen locatie. Die wordt alleen gevuld vanuit
      // de eerste kaart, want daarna is hij van de website en kan elke kaart
      // een andere hebben.
      locatie: eventLocatie || ontwerp.location,
      // Alleen een nieuwe bruiloft begint met de stijl van de kaart; daarna
      // kiest de website zijn eigen kleuren
      ...(eventId ? {} : { style: ontwerp.style }),
      frame_names: ontwerp.names,
      // Zoals de website ze schrijft: M|L
      initials: initialenLijst(ontwerp.names).join("|"),
      pages: ["Home"],
      content: {},
      plan,
      // concept_naam wordt hier niet meegestuurd: dat is de naam van het
      // website-ontwerp, die het bruidspaar in de websitebouwer zet. Stuurden
      // we hem leeg mee, dan wiste het bewaren van een kaart die naam.
      ...(eventId ? { event_id: eventId } : {}),
      ...(!eventId && hoortBij ? { hoort_bij: hoortBij } : {}),
      // Van een bestaande bruiloft alleen namen, datum en locatie bijwerken,
      // nooit de website zelf (zie app/api/drafts)
      vanKaart: true,
    }
    const er = await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventBody) })
    if (!er.ok) throw new Error("Opslaan van het event mislukt")
    const { id: nieuwEventId } = (await er.json()) as { id: string }

    // Alleen wat echt van deze kaart is. Namen en datum komen van de bruiloft
    // en de locatie alleen als hij afwijkt; anders zou een wijziging aan de
    // bruiloft de kaarten niet meer bereiken.
    const kaartContent: CardContent = { ...content, photoUrl: fotoUrl ?? undefined, ontwerpUrl: ontwerpUrl ?? undefined }

    // Hoort dit kaart-id echt bij deze bruiloft? Je browser onthoudt het, en
    // dat id kan verouderd zijn: bijvoorbeeld nadat je opnieuw begonnen bent
    // of je account hebt verwijderd. Dan bestaat de kaart niet meer en gaf het
    // bijwerken een foutmelding in plaats van een nieuwe kaart.
    // Alleen een kaart van hetzelfde soort werken we bij; anders wordt dit
    // een nieuwe kaart. Zo kan een Save the Date nooit een trouwkaart worden.
    const kaartBestaatNog = !!cardId && kaarten.some((k) => k.id === cardId && k.type === ontwerp.type)
    let nieuwCardId = kaartBestaatNog ? cardId : null
    if (!nieuwCardId) {
      const cr = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: nieuwEventId,
          type: ontwerp.type,
          template: ontwerp.template,
          guest_type: ontwerp.guestType || undefined,
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
    if (!pr.ok) {
      // De server weet beter wat er mis is dan wij. Zonder dit zag je alleen
      // "Opslaan mislukt" en was er niets te achterhalen.
      const { error } = (await pr.json().catch(() => ({}))) as { error?: string }
      throw new Error(error || "Opslaan van de kaarttekst mislukt")
    }

    setEventId(nieuwEventId)
    setCardId(nieuwCardId)
    setBewaardTot(tot)
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
  }, [ontwerp, eventId, cardId, plan, isTrouwkaart, eventLocatie])

  // Automatisch bewaren, zoals de websitebouwer: een paar tellen na je laatste
  // wijziging, voor een kaart die al eens bewaard is en als je bent ingelogd.
  // Een nieuwe kaart bewaar je de eerste keer zelf; tot dan staat hij in je
  // browser. Michiels keuze van 25 september 2026.
  useEffect(() => {
    if (!onbewaard || !userEmail || busy !== null || autoBezig) return
    if (!ontwerp.names.trim() || !ontwerp.datum) return
    const klok = setTimeout(() => {
      setAutoBezig(true)
      slaOp()
        .then(() => setAutoFout(false))
        .catch(() => setAutoFout(true))
        .finally(() => setAutoBezig(false))
    }, 2500)
    return () => clearTimeout(klok)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wijzigingen, onbewaard, userEmail, busy, autoBezig])

  // Delen via het deelmenu van de telefoon: WhatsApp, Signal, mail, of
  // kopiëren, allemaal in één keer. Zonder deelmenu (de meeste laptops)
  // kopiëren we de link.
  async function deelKaart() {
    if (!huidigeKaart) return
    const url = `${window.location.origin}/kaart/${huidigeKaart.share_token}`
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: kaartLabel(huidigeKaart), text: "Er is post voor je 💌", url })
        return
      } catch {
        return // weggetikt; niets aan de hand
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setMelding({ tekst: "Link gekopieerd. Plak hem in WhatsApp of een mail." })
    } catch {
      setMelding({ tekst: `De link: ${url}` })
    }
  }

  // Naar een onderdeel springen: op de telefoon het paneel openen, op de
  // laptop de sectie, en als er een veld bij hoort de cursor erin.
  function gaNaar(s: Stap, veld?: string) {
    const cat = (Object.keys(BLAD_SECTIES) as Exclude<Blad, "kaart">[]).find((k) => BLAD_SECTIES[k].includes(s))
    if (window.matchMedia("(max-width: 767px)").matches && cat) openBlad(cat)
    setStap(s)
    if (veld) {
      setTimeout(() => {
        const el = document.getElementById(veld) as HTMLInputElement | HTMLTextAreaElement | null
        el?.focus()
        el?.scrollIntoView({ block: "center", behavior: "smooth" })
      }, 80)
    }
  }

  // De check onder Bekijken. "mag" betekent: hoeft niet, maar is wel aan te
  // raden; dan geen oranje rondje.
  type Controle = "ontwerp" | "namen" | "datum" | "locatie" | "aanmelden" | "bewaard" | "actief"
  const controles: { id: Controle; label: string; klaar: boolean; mag?: boolean; actie: string }[] = [
    ...(cardDesign(ontwerp.template) === "eigen"
      ? [{ id: "ontwerp" as const, label: "Jullie ontwerp", klaar: !!(ontwerp.ontwerpUrl || ontwerp.ontwerpDataUrl), actie: "Uploaden" }]
      : []),
    { id: "namen", label: "Jullie namen", klaar: !!ontwerp.names.trim(), actie: "Invullen" },
    { id: "datum", label: "Trouwdatum", klaar: !!ontwerp.datum, actie: "Invullen" },
    { id: "locatie", label: "Locatie", klaar: !!(ontwerp.location.trim() || eventLocatie.trim()), mag: true, actie: "Invullen" },
    {
      id: "aanmelden",
      label: ontwerp.aanmelden === "geen" ? "Aanmelden staat uit" : `Aanmelden: ${AANMELD_KORT[ontwerp.aanmelden]}`,
      klaar: ontwerp.aanmelden !== "geen" || gastenGezien,
      actie: "Kiezen",
    },
    { id: "bewaard", label: "Bewaard", klaar: !!cardId && !onbewaard, actie: "Bewaren" },
    { id: "actief", label: alAfgenomen ? "Geactiveerd, de link werkt" : "Geactiveerd", klaar: alAfgenomen, actie: `Activeer ${prijs}` },
  ]
  function doeControle(id: Controle) {
    if (id === "ontwerp") gaNaar("template")
    else if (id === "namen") gaNaar("tekst", "kaart-namen")
    else if (id === "datum") gaNaar("tekst", "kaart-datum")
    else if (id === "locatie") gaNaar("tekst", "kaart-locatie")
    else if (id === "aanmelden") gaNaar("aanmelden")
    else if (id === "bewaard") void voerUit("bewaar")
    else void voerUit("activeer")
  }

  /** Hoe het met bewaren staat, in een paar woorden. */
  const bewaarStatus = !cardId
    ? "nog niet bewaard"
    : autoBezig
      ? "bewaren..."
      : autoFout
        ? "bewaren lukte niet, druk op bewaren"
        : onbewaard
          ? userEmail ? "wordt zo bewaard" : "wijzigingen niet bewaard"
          : "automatisch bewaard"
  const bewaarLetOp = !cardId || autoFout || (onbewaard && !userEmail)

  // Overstappen naar de websitebouwer zonder dat er al iets bewaard is. Wat
  // hier al ingevuld staat gaat mee, inclusief de stijl, zodat de website
  // meteen in de sfeer van de kaart staat en niet leeg begint. Een bestaand
  // websiteconcept laten we met rust.
  function neemMeeNaarWebsite() {
    try {
      // Staat er al een websiteconcept, dan laten we dat met rust; alleen de
      // overdracht markeren, zodat de bouwer hem oppakt in plaats van je naar
      // het aanmaakformulier te sturen.
      if (localStorage.getItem(LS_WEBSITE_CONCEPT)) {
        localStorage.setItem(LS_NAAR_WEBSITE, String(Date.now()))
        return
      }
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
      // Zodat de websitebouwer weet dat dit een overdracht is en niet een oud
      // concept dat nog in de browser stond.
      localStorage.setItem(LS_NAAR_WEBSITE, String(Date.now()))
    } catch {
      // Zonder browseropslag begint de websitebouwer gewoon leeg
    }
  }

  // De keuzelijst met concepten is weg: er is één bruiloft, en varianten zijn
  // kaarten binnen die bruiloft (zie "Je kaarten" hieronder). Een tweede
  // bruiloft naast de eerste was precies wat het dashboard onoverzichtelijk
  // maakte.

  // ── Wisselen tussen de kaarten van deze bruiloft ──────────────────────────
  // Namen, datum, locatie en stijl horen bij de bruiloft en blijven staan. Wat
  // per kaart verschilt is het soort kaart, de gastengroep en de teksten.
  function kiesKaart(id: string) {
    const k = kaarten.find((c) => c.id === id)
    if (!k) return
    setCardId(k.id)
    setBewaardTot(wijzigingRef.current)
    setMelding(null)
    setOntwerp((o) => ({
      ...o,
      type: k.type,
      template: k.template,
      style: isStyle(k.content.stijl) ? k.content.stijl : o.style,
      kleur: k.content.kleur ?? "",
      ontwerpUrl: k.content.ontwerpUrl ?? null,
      ontwerpDataUrl: null,
      ontwerpVerhouding: k.content.ontwerpVerhouding ?? null,
      location: k.content.location ?? o.location,
      message: k.content.message ?? "",
      guestType: k.content.guestType ?? "",
      inviteText: k.content.inviteText ?? "",
      timeText: k.content.timeText ?? "",
      naam: k.content.naam ?? "",
      toonGastType: k.content.toonGastType === true,
      dresscode: k.content.dresscode ?? "",
      photoDataUrl: null,
      photoUrl: k.content.photoUrl ?? null,
      animatie: cardAnimatie(k.content.animatie),
      taal: cardTaal(k.content.taal),
      aanmelden: k.content.aanmelden ? aanmeldStand(k.content.aanmelden) : standaardAanmeldStand(k.type),
    }))
  }


  // Van Save the Date naar trouwkaart of terug, via de tabbladen in de kop.
  // Dit is nooit "deze kaart van soort veranderen": een bewaarde Save the
  // Date werd zo bij het opslaan stilletjes een trouwkaart (Michiels
  // bevinding van 23 september 2026). Bestaat er een kaart van dat soort,
  // dan open je die. Anders begin je een nieuwe, met de namen, datum en
  // stijl van wat er staat, maar zonder de teksten van het andere soort.
  function wisselSoort(type: CardType) {
    if (type === ontwerp.type) return
    const bestaand = kaarten.find((k) => k.type === type)
    if (bestaand) {
      kiesKaart(bestaand.id)
      return
    }
    setCardId(null)
    setBewaardTot(wijzigingRef.current)
    setMelding(null)
    setOntwerp((o) => ({
      ...o,
      type,
      message: "",
      guestType: "",
      inviteText: "",
      timeText: "",
      naam: "",
      toonGastType: false,
      dresscode: "",
      aanmelden: standaardAanmeldStand(type),
    }))
  }

  // Deze kaart weggooien. Michiels wens van 23 september 2026: dat moet ook
  // vanuit de bouwer kunnen, niet alleen vanuit het dashboard. Daarna komt de
  // volgende kaart van de bruiloft in beeld, of een leeg ontwerp.
  const [verwijderVraag, setVerwijderVraag] = useState(false)
  async function verwijderKaart() {
    if (!cardId) return
    setBusy("bewaar")
    setMelding(null)
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" })
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(error || "Verwijderen mislukte")
      }
      const rest = kaarten.filter((k) => k.id !== cardId)
      setKaarten(rest)
      setVerwijderVraag(false)
      setBewaardTot(wijzigingRef.current)
      if (rest[0]) {
        kiesKaart(rest[0].id)
        // kiesKaart kijkt in de oude lijst; het id zelf zetten we hier.
        setCardId(rest[0].id)
        setMelding({ tekst: "Kaart weggegooid. Je ziet nu je volgende kaart." })
      } else {
        setCardId(null)
        setMelding({ tekst: "Kaart weggegooid. Wat hier staat is een nieuw ontwerp; bewaar het als je het wilt houden." })
      }
      try { localStorage.setItem(LS_IDS, JSON.stringify({ eventId, cardId: rest[0]?.id ?? null })) } catch {}
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Verwijderen mislukte", fout: true })
    } finally {
      setBusy(null)
    }
  }

  // Een nieuwe kaart is een kopie van deze: alles blijft staan en de volgende
  // opslag wordt een nieuwe kaart. Dat is de snelste weg naar dezelfde kaart
  // in een andere taal of voor een andere gastengroep. Er was ook een "lege"
  // variant; voor een Save the Date deed die hetzelfde, dus die is weg.
  function dupliceerKaart(voor?: { guestType?: CardGuestType; taal?: CardTaal }) {
    setCardId(null)
    setNieuwVraag(false)
    // De naam gaat niet mee: twee kaarten die hetzelfde heten is precies wat
    // we willen voorkomen. Leeg betekent weer de automatische naam, en die
    // zegt meteen voor wie hij is ("Save the Date, avondgast (EN)"). En
    // aanmelden begint weer bij de standaard, zodat je bij elke kaart zelf
    // kiest of je gasten iets moeten laten weten.
    setOntwerp((o) => ({
      ...o,
      naam: "",
      aanmelden: standaardAanmeldStand(o.type),
      ...(voor?.guestType ? { guestType: voor.guestType } : {}),
      ...(voor?.taal ? { taal: voor.taal } : {}),
    }))
    const voorWie = voor?.guestType
      ? `voor je ${GUEST_TYPE_LABEL[voor.guestType].toLowerCase()}`
      : voor?.taal
        ? `in het ${CARD_TAAL_LABEL[voor.taal]}`
        : "op basis van de vorige"
    setMelding({ tekst: `Nieuwe kaart ${voorWie}. Pas aan wat anders moet; je vorige kaart blijft bestaan.` })
    // Op de telefoon het paneel dicht, zodat je de nieuwe kaart ziet
    setBlad(null)
  }
  // Het plusje vraagt eerst voor wie de nieuwe kaart is: een andere
  // gastengroep of een andere taal. Dan staat hij in één tik goed ingesteld.
  const [nieuwVraag, setNieuwVraag] = useState(false)

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
    if (actie) void voerUit(actie).finally(() => setHervatten(false))
    else setHervatten(false)
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

  // Waar een tekst terechtkomt: op de kaart, eronder, of bij een eigen
  // ontwerp nergens (Michiel, 25 september 2026: het moet duidelijk zijn wat
  // op en wat onder de kaart komt)
  function tekstPlek(veld: "namen" | "datum" | "locatie" | "bericht" | "details"): "op" | "onder" | "niet" {
    const d = cardDesign(ontwerp.template)
    const onder = ONDER_DE_KAART[d]
    if (d === "eigen") return veld === "bericht" || veld === "details" ? "onder" : "niet"
    if (veld === "locatie") return onder?.locatie ? "onder" : "op"
    if (veld === "bericht") return onder?.bericht ? "onder" : "op"
    if (veld === "details") return onder?.details ? "onder" : "op"
    return "op"
  }

  // Eigen ontwerp: scherper dan een foto, want er staat tekst op, en de
  // verhouding onthouden zodat de kaart precies zo hoog wordt als het ontwerp
  const ontwerpRef = useRef<HTMLInputElement>(null)
  const [ontwerpMag, setOntwerpMag] = useState(false)
  async function kiesOntwerp(file: File) {
    setBusy("foto")
    try {
      const blob = await compressImage(file, 1800, 0.9, "#FFFFFF")
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(new Error("Kon het ontwerp niet lezen"))
        r.readAsDataURL(blob)
      })
      const verhouding = await new Promise<number>((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img.naturalHeight / Math.max(1, img.naturalWidth))
        img.onerror = () => resolve(1.4)
        img.src = dataUrl
      })
      if (verhouding < 0.4 || verhouding > 2.5) throw new Error("Dit ontwerp is te breed of te smal voor een kaart. Een staande kaart werkt het best.")
      update({ ontwerpDataUrl: dataUrl, ontwerpUrl: null, ontwerpVerhouding: Math.round(verhouding * 1000) / 1000, template: "eigen" })
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Ontwerp laden mislukt", fout: true })
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
          names: ontwerp.names, dateText: display.dateText,
          location: ontwerp.location, message: ontwerp.message,
          guestType: ontwerp.guestType, inviteText: ontwerp.inviteText, timeText: ontwerp.timeText,
          photoUrl: ontwerp.photoUrl, taal: ontwerp.taal,
          kleur: ontwerp.kleur || undefined, datum: ontwerp.datum || undefined,
          ontwerpUrl: ontwerp.ontwerpUrl ?? ontwerp.ontwerpDataUrl ?? undefined,
          ontwerpVerhouding: ontwerp.ontwerpVerhouding ?? undefined,
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

  if (ophalen) {
    return (
      <BouwerSchil actief={ontwerp.type} eventId={eventId}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <p className="m-0 text-2xl" style={{ color: GOLD }}>{"♥"}</p>
            <p className="m-0 mt-3 text-lg" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: CHARCOAL }}>
              We halen jullie kaart op
            </p>
          </div>
        </div>
      </BouwerSchil>
    )
  }

  return (
    <BouwerSchil
      actief={ontwerp.type}
      eventId={eventId}
      /* Op een groot scherm de hoogte van het venster: dan scrollen de
         zijbalk en het voorbeeld elk apart, net als in de websitebouwer, en
         blijft de zijbalk staan als je onder de kaart kijkt. Michiels wens
         van 23 september 2026. Op de telefoon blijft alles één pagina. */
      className="md:h-screen md:overflow-hidden"
      onderKop={
        <div className="md:hidden sticky top-[57px] z-20 flex items-center gap-2 px-3 py-2 border-b" style={{ backgroundColor: "#fff", borderColor: `${GOLD_LIGHT}80` }}>
          <button
            type="button"
            onClick={() => openBlad(blad === "kaart" ? null : "kaart")}
            className="flex-1 min-w-0 text-left"
            style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
            aria-label="Je kaarten: naam, wisselen, nieuw of verwijderen"
          >
            <span className="flex items-center gap-1 text-sm font-semibold truncate" style={{ color: CHARCOAL }}>
              <span className="truncate">{ontwerp.naam.trim() || automatischeNaam}</span>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
            </span>
            <span className="block text-[11px]" style={{ color: bewaarLetOp ? "#B45309" : SUBTLE }}>
              {bewaarStatus}
            </span>
          </button>
          <IconKnop title="Bewaren" onClick={() => voerUit("bewaar")} disabled={busy !== null} bezig={busy === "bewaar"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
          </IconKnop>
          {/* De demo: zo ontvangt je gast hem. Met het woord erbij, want
              alleen een envelopje zei niet wat het deed (Michiel, 26
              september 2026). */}
          <button
            type="button"
            onClick={() => setSimulatie(true)}
            aria-label="Demo: bekijk hoe hij opengaat"
            className="h-9 flex-shrink-0 inline-flex items-center gap-1.5 pl-2.5 pr-3 rounded-xl text-[13px] font-semibold"
            style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
            </svg>
            Demo
          </button>
          {alAfgenomen && huidigeKaart ? (
            <button
              type="button"
              onClick={() => void deelKaart()}
              className="text-[13px] font-semibold px-3.5 py-2 rounded-full whitespace-nowrap"
              style={{ backgroundColor: KLEUR.groen, color: "#fff", border: 0, cursor: "pointer" }}
            >
              Delen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => voerUit("activeer")}
              disabled={busy !== null}
              className="text-[13px] font-semibold px-3.5 py-2 rounded-full whitespace-nowrap disabled:opacity-60"
              style={{ backgroundColor: KLEUR.groen, color: "#fff", border: 0, cursor: "pointer" }}
            >
              {busy === "activeer" ? "Even..." : `Activeer ${prijs}`}
            </button>
          )}
        </div>
      }
      onderbalk={
        <nav className="flex justify-around px-1 pt-1.5 pb-2" aria-label="Onderdelen van de kaart">
          {CATEGORIE_VOLGORDE.map((b) => {
            const aan = blad === b
            return (
              <button
                key={b}
                type="button"
                onClick={() => openBlad(aan ? null : b)}
                aria-pressed={aan}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold min-w-[68px]"
                style={{ color: aan ? GOLD : SUBTLE, backgroundColor: aan ? GOLD_BG : "transparent", border: 0, cursor: "pointer" }}
              >
                <span className="relative">
                  <BladIcoon blad={b} />
                  {stip[b] && (
                    <span aria-label="hier staat nog iets open" className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#D97706" }} />
                  )}
                </span>
                {BLAD_TITEL[b]}
              </button>
            )
          })}
        </nav>
      }
      voorVerlaten={async () => {
        if (!onbewaard) return true
        // Ingelogd en compleet genoeg om te bewaren? Dan bewaren en gaan, net
        // als de websitebouwer. Alleen als dat niet kan vragen we het.
        if (userEmail && !controleer()) {
          try {
            await slaOp()
            return true
          } catch {}
        }
        return window.confirm("Deze kaart heeft wijzigingen die nog niet bewaard zijn. Toch weggaan?")
      }}
      opKaartType={wisselSoort}
      opWebsite={neemMeeNaarWebsite}
      metInhoud={kaarten.map((k) => k.type as "save_the_date" | "trouwkaart")}
      acties={
        <>
          <Knop
            soort="rustig"
            klein
            onClick={() => voerUit("bewaar")}
            disabled={busy !== null}
            bezig={busy === "bewaar"}
            bezigTekst="Bewaren"
            className="flex-1 md:flex-none"
          >
            Bewaar ontwerp
          </Knop>
          {/* Zit deze kaart al in het afgenomen pakket, dan is er niets te
              activeren: bewaren is genoeg en de link werkt al. */}
          {alAfgenomen && huidigeKaart ? (
            <Knop soort="actie" href={`/kaart/${huidigeKaart.share_token}/voorbeeld`} nieuwTabblad className="flex-1 md:flex-none">
              Bekijk de kaart
            </Knop>
          ) : (
            <Knop
              soort="actie"
              onClick={() => voerUit("activeer")}
              disabled={busy !== null}
              bezig={busy === "activeer"}
              bezigTekst="Naar de kassa"
              className="flex-1 md:flex-none"
            >
              {`Activeer voor ${prijs}`}
            </Knop>
          )}
        </>
      }
    >

      {/* ── Terug van de inloglink ──
          Een paar tellen werk, maar zonder uitleg voelt het als stilstand. */}
      {hervatten && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(250,247,242,0.94)", backdropFilter: "blur(2px)" }}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <span style={{ color: GOLD }}>
              <Draaier maat={28} />
            </span>
            <p
              className="text-xl"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600 }}
            >
              Je bent ingelogd
            </p>
            <p className="text-sm max-w-xs" style={{ color: BODY }}>
              We bewaren je ontwerp en brengen je naar de volgende stap. Dit duurt een paar tellen.
            </p>
          </div>
        </div>
      )}

      {/* ── De overdracht na het eerste bewaren ──
          Hier komt de gastenlijst voor het eerst ter sprake, op het enige
          moment waarop dat logisch is: je hebt net een kaart gemaakt, dus de
          vraag die je nu zelf hebt is wie hem moet krijgen.

          Als pop-up en niet als blok boven de bouwer. Zo stond het eerst, en
          dan schuift het hele ontwerp naar beneden en zie je niet wat er
          gebeurd is. Michiels woorden: heel raar, maak er een pop-up van. */}
      {overdracht && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOverdracht(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Je ontwerp is bewaard"
        >
          <div
            className="w-full max-w-md rounded-3xl p-7"
            style={{ backgroundColor: IVORY }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600 }}
            >
              Bewaard
            </p>
            <p className="text-sm mb-1.5" style={{ color: BODY }}>
              Je hebt nu een {isTrouwkaart ? "trouwkaart" : "Save the Date"} in concept. Je vindt
              hem terug in je dashboard, ook als je dit venster sluit.
            </p>
            <p className="text-sm mb-5" style={{ color: BODY }}>
              <strong style={{ color: CHARCOAL }}>Wie ga je uitnodigen?</strong> Je gastenlijst hoort
              bij elk pakket en is gratis. Je houdt er zelf bij wie je hebt uitgenodigd en wie er
              komt, of je laat hem zich vullen door de reacties op je kaart.
            </p>
            <div className="flex flex-col gap-2">
              <Knop soort="primair" href="/dashboard#gasten" breed>
                Begin je gastenlijst
              </Knop>
              <div className="flex gap-2">
                <Knop soort="rand" breed onClick={() => setOverdracht(false)}>
                  Verder ontwerpen
                </Knop>
                <Knop soort="rand" breed href="/dashboard">
                  Naar je dashboard
                </Knop>
              </div>
            </div>
          </div>
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

      {/* Op een telefoon staat het voorbeeld boven de secties: dat is waarom
          iemand blijft, dus dat zie je eerst. Op een groot scherm links de
          stappen, rechts de kaart. */}
      {/* Op de telefoon gewoon van boven naar onder: de zijbalk is daar een
          paneel dat eroverheen schuift. Eerst stond hier de omgekeerde
          volgorde, en dan zakte het voorbeeld naar onderen, achter het paneel. */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* ── Stappen ── */}
        <aside
          ref={bladRef}
          className={`flex flex-col w-full md:w-80 md:flex-shrink-0 bg-white border-r border-gray-100 md:overflow-y-auto ${
            blad
              ? `max-md:fixed max-md:inset-x-0 max-md:bottom-[64px] max-md:z-40 max-md:rounded-t-2xl max-md:border-t max-md:shadow-[0_-16px_40px_-16px_rgba(26,18,4,0.35)] ${
                  bladKlein ? "max-md:max-h-[56px] max-md:overflow-hidden" : "max-md:max-h-[50vh] max-md:overflow-y-auto"
                }`
              : "max-md:hidden"
          }`}
          style={sleep !== 0 ? { transform: `translateY(${sleep}px)`, transition: "none" } : { transition: "transform 180ms ease, max-height 200ms ease" }}
        >
          {/* De vier categorieën als kopjes, alleen op de laptop: op de
              telefoon is de categorie het paneel zelf. */}
          {CATEGORIE_VOLGORDE.map((c, i) => (
            <div
              key={c}
              className={`max-md:hidden ${["order-[10]", "order-[20]", "order-[30]", "order-[40]"][i]} px-5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em]`}
              style={{ color: GOLD, borderTop: i === 0 ? undefined : `1px solid ${GOLD_LIGHT}66` }}
            >
              {BLAD_TITEL[c]}
              {stip[c] && <span aria-label="hier staat nog iets open" className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 align-middle" style={{ backgroundColor: "#D97706" }} />}
            </div>
          ))}
          {/* Onderaan elk paneel: door naar de volgende, zodat je er vanzelf
              doorheen loopt. */}
          {blad && blad !== "kaart" && (
              <div className="md:hidden order-[100] px-5 py-4">
                {volgende ? (
                  <button
                    type="button"
                    onClick={() => openBlad(volgende)}
                    className="w-full text-sm font-semibold px-4 py-3 rounded-xl"
                    style={{ backgroundColor: CHARCOAL, color: IVORY, border: 0, cursor: "pointer" }}
                  >
                    Volgende: {BLAD_TITEL[volgende]} {"→"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { openBlad(null); void voerUit("bewaar") }}
                    className="w-full text-sm font-semibold px-4 py-3 rounded-xl"
                    style={{ backgroundColor: CHARCOAL, color: IVORY, border: 0, cursor: "pointer" }}
                  >
                    Klaar, bewaar mijn kaart
                  </button>
                )}
              </div>
          )}

          {/* De kop van het paneel, alleen op de telefoon */}
          {blad && (
            <div
              className="md:hidden sticky top-0 z-10 bg-white flex items-center justify-between px-5 pt-2 pb-2 border-b border-gray-100"
              style={{ touchAction: "none" }}
              onClick={() => { if (bladKlein) setBladKlein(false) }}
              onTouchStart={(e) => { sleepStart.current = e.touches[0].clientY }}
              onTouchMove={(e) => {
                if (sleepStart.current === null) return
                // Omlaag volgt het paneel je vinger; omhoog alleen als hij klein is
                const dy = e.touches[0].clientY - sleepStart.current
                setSleep(bladKlein ? Math.min(0, dy) : Math.max(0, dy))
              }}
              onTouchEnd={(e) => {
                const start = sleepStart.current
                sleepStart.current = null
                const dy = start === null ? 0 : e.changedTouches[0].clientY - start
                setSleep(0)
                if (bladKlein) {
                  if (dy < -30) setBladKlein(false)
                  else if (dy > 40) openBlad(null)
                } else if (dy > 220) {
                  openBlad(null)
                } else if (dy > 60) {
                  setBladKlein(true)
                }
              }}
            >
              <span aria-hidden className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full" style={{ backgroundColor: GOLD_LIGHT }} />
              <span className="text-sm font-semibold mt-2" style={{ color: CHARCOAL }}>{BLAD_TITEL[blad]}</span>
              <button
                type="button"
                onClick={() => openBlad(null)}
                aria-label="Sluiten"
                className="mt-2 w-8 h-8 inline-flex items-center justify-center rounded-full"
                style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: 0, cursor: "pointer" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          {/* ── Welke kaart, hoe heet hij, bewaren ──
              Bovenaan de zijbalk, zoals de titelbalk van een document: de
              naam met daarnaast bewaren, kopiëren en nieuw, en eronder de
              keuzelijst zodra er meer dan één kaart is. Michiels wens van
              23 september 2026, in plaats van een balk over de volle breedte
              onder de kop. Staat er vanaf het begin, ook voor er iets bewaard
              is, zodat je je ontwerp meteen een naam kunt geven. */}
          <div className={`px-4 py-3 border-b border-gray-100 flex flex-col gap-2 ${blad === "kaart" ? "" : "max-md:hidden"}`} style={{ backgroundColor: GOLD_BG }}>
            <div className="flex items-center gap-1.5">
              <input
                value={ontwerp.naam}
                onChange={(e) => update({ naam: e.target.value })}
                placeholder={automatischeNaam}
                maxLength={60}
                aria-label="Naam van deze kaart"
                title="De naam van deze kaart, alleen voor jullie. Zo heet hij in je dashboard en in je gastenlijst."
                className="flex-1 min-w-0 rounded-xl border bg-white px-3 py-2 text-sm font-semibold placeholder-gray-400 focus:outline-none"
                style={{ color: CHARCOAL, borderColor: GOLD_LIGHT }}
              />
              <IconKnop
                title="Bewaren"
                onClick={() => voerUit("bewaar")}
                disabled={busy !== null}
                bezig={busy === "bewaar"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
              </IconKnop>
              <IconKnop
                title={cardId
                  ? "Nieuwe kaart op basis van deze. Alles blijft staan; pas aan wat anders moet, bijvoorbeeld de gastengroep of de taal. Meerdere kaarten zitten in de prijs."
                  : "Bewaar de kaart eerst, dan kun je er een tweede naast maken"}
                onClick={() => setNieuwVraag((v) => !v)}
                disabled={busy !== null || !cardId || kaarten.length >= MAX_KAARTEN_PER_EVENT}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </IconKnop>
              {/* Apart van bewaren en nieuw, zodat je hem niet raakt als je
                  op het plusje bedoelt te drukken. */}
              <span aria-hidden className="w-px h-6 mx-0.5" style={{ backgroundColor: GOLD_LIGHT }} />
              <IconKnop
                title={cardId ? "Deze kaart weggooien" : "Deze kaart is nog niet bewaard; er is niets om weg te gooien"}
                onClick={() => setVerwijderVraag(true)}
                disabled={busy !== null || !cardId}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" />
                </svg>
              </IconKnop>
            </div>

            {nieuwVraag && cardId && (
              <div className="rounded-xl p-3 flex flex-col gap-2.5 text-[13px]" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
                <span className="font-semibold" style={{ color: CHARCOAL }}>Voor wie is de nieuwe kaart?</span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: SUBTLE }}>Andere gastengroep</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CARD_GUEST_TYPES.filter((g) => g !== ontwerp.guestType).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => dupliceerKaart({ guestType: g })}
                        className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                      >
                        {GUEST_TYPE_LABEL[g]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: SUBTLE }}>Andere taal</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CARD_TALEN.filter((tl) => tl !== ontwerp.taal).map((tl) => (
                      <button
                        key={tl}
                        type="button"
                        onClick={() => dupliceerKaart({ taal: tl })}
                        className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                      >
                        {CARD_TAAL_LABEL[tl]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => dupliceerKaart()}
                    className="text-[12px] font-semibold underline"
                    style={{ color: CHARCOAL, background: "none", border: 0, padding: 0, cursor: "pointer" }}
                  >
                    Gewoon een kopie, ik pas het zelf aan
                  </button>
                  <button
                    type="button"
                    onClick={() => setNieuwVraag(false)}
                    className="text-[12px] ml-auto"
                    style={{ color: SUBTLE, background: "none", border: 0, padding: 0, cursor: "pointer" }}
                  >
                    Laat maar
                  </button>
                </div>
              </div>
            )}

            {verwijderVraag && cardId && (
              <div className="rounded-xl p-3 flex flex-col gap-2 text-[13px]" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                <span style={{ color: "#991B1B" }}>
                  <b>{huidigeKaart ? kaartLabel(huidigeKaart) : "Deze kaart"}</b> weggooien? De link werkt daarna niet meer.
                  Wie al reageerde blijft met zijn antwoord in je gastenlijst staan.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void verwijderKaart()}
                    disabled={busy !== null}
                    className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: "#991B1B", color: "#fff", border: 0, cursor: "pointer" }}
                  >
                    {busy ? "Bezig…" : "Ja, weggooien"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerwijderVraag(false)}
                    className="text-[13px] px-2 py-1.5 rounded-lg"
                    style={{ color: SUBTLE, background: "none", border: 0, cursor: "pointer" }}
                  >
                    Laat maar
                  </button>
                </div>
              </div>
            )}

            <p className="m-0 text-[11px] -mt-0.5" style={{ color: bewaarLetOp ? "#B45309" : SUBTLE }}>{bewaarStatus}</p>
            {/* Altijd zichtbaar, ook zonder bewaarde kaarten van dit soort: dan
                staat er "Nieuwe kaart, nog niet bewaard", zodat je ziet waar je
                aan werkt. Michiels wens van 23 september 2026. */}
            {(
              <select
                value={cardId ?? "nieuw"}
                onChange={(e) => e.target.value !== "nieuw" && kiesKaart(e.target.value)}
                aria-label="Welke kaart bewerk je"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                style={{ color: CHARCOAL, borderColor: GOLD_LIGHT, cursor: "pointer" }}
              >
                {kaartenVanDitSoort.map((k) => (
                  <option key={k.id} value={k.id}>{kaartLabel(k)}</option>
                ))}
                {!cardId && <option value="nieuw">Nieuwe kaart, nog niet bewaard</option>}
              </select>
            )}
          </div>

          <Sectie className={telefoon("tekst")} vast={inPaneel("tekst")} open={isOpen("tekst")} onToggle={() => setStap(stap === "tekst" ? null : "tekst")} titel="Tekst">
            {cardDesign(ontwerp.template) === "eigen" && (
              <p className="m-0 text-[12px] leading-relaxed rounded-xl px-3 py-2.5" style={{ color: BODY, backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
                <b style={{ color: CHARCOAL }}>Jullie eigen ontwerp is de kaart.</b> Er komt geen tekst overheen. De namen en de datum gebruiken we alleen voor het zegel, de voorvertoning in WhatsApp en de agenda. Een boodschap komt onder de kaart.
              </p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold flex items-center justify-between gap-2" style={{ color: CHARCOAL }}>Jullie namen <Plek waar={tekstPlek("namen")} /></span>
              {/* Een tekstvak en geen invoerregel, zodat een enter werkt: veel
                  paren zetten de tweede naam graag op een eigen regel. */}
              <textarea
                className={`${inputCls} resize-none`}
                style={{ ...inputStyle, minHeight: 48 }}
                rows={2}
                placeholder="Sophie & Daan"
                id="kaart-namen"
                value={ontwerp.names}
                onChange={(e) => update({ names: e.target.value })}
                maxLength={80}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold flex items-center justify-between gap-2" style={{ color: CHARCOAL }}>Trouwdatum <Plek waar={tekstPlek("datum")} /></span>
              <input id="kaart-datum" type="date" className={inputCls} style={inputStyle} value={ontwerp.datum} onChange={(e) => update({ datum: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold flex items-center justify-between gap-2" style={{ color: CHARCOAL }}>Locatie <Plek waar={tekstPlek("locatie")} /></span>
              <textarea
                className={`${inputCls} resize-none`}
                style={{ ...inputStyle, minHeight: 48 }}
                rows={2}
                placeholder={"Landgoed Duno\nDoorwerth"}
                id="kaart-locatie"
                value={ontwerp.location}
                onChange={(e) => update({ location: e.target.value })}
                maxLength={120}
              />
              <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                Deze locatie staat op deze kaart. Maak je een aparte kaart voor de avondgasten, dan kan die een andere locatie hebben.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold flex items-center justify-between gap-2" style={{ color: CHARCOAL }}>
                {tekstPlek("bericht") === "onder" ? "Boodschap (optioneel)" : "Boodschap"} <Plek waar={tekstPlek("bericht")} />
              </span>
              <textarea
                id="kaart-boodschap"
                className={inputCls}
                style={{ ...inputStyle, minHeight: 84 }}
                placeholder={ONDER_DE_KAART[cardDesign(ontwerp.template)]?.bericht ? "Bijvoorbeeld: we zouden het heel leuk vinden als je erbij bent." : display.message}
                value={ontwerp.message}
                onChange={(e) => update({ message: e.target.value })}
                maxLength={400}
              />
              {ONDER_DE_KAART[cardDesign(ontwerp.template)] && cardDesign(ontwerp.template) !== "eigen" && (
                <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                  Dit ontwerp is strak en heeft weinig tekst. Wat niet op de kaart past, staat er netjes onder.
                </span>
              )}
            </label>
          </Sectie>

          <Sectie className={telefoon("stijl")} vast={inPaneel("stijl")} open={isOpen("stijl")} onToggle={() => setStap(stap === "stijl" ? null : "stijl")} titel="Kleuren">
            {/* Dezelfde tien stijlen als de website, maar per kaart te kiezen:
                een kleur hier verandert de website niet (Michiel, 25 september
                2026). */}
            <p className="m-0 text-[12px] leading-relaxed" style={{ color: BODY }}>
              Alleen voor deze kaart. De kleuren van jullie website kies je apart in de websitebouwer.
            </p>
            <div className="grid grid-cols-5 gap-2">
              {STYLE_KEYS.map((s) => {
                const cfg = STYLE_CONFIG[s]
                const actief = !ontwerp.kleur && ontwerp.style === s
                return (
                  <button
                    key={s}
                    onClick={() => update({ style: s, kleur: "" })}
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

          <Sectie className={telefoon("template")} vast={inPaneel("template")} open={isOpen("template")} onToggle={() => setStap(stap === "template" ? null : "template")} titel="Ontwerp">
            {/* Een galerij met jullie eigen kaart in elk ontwerp. Was een
                rijtje knoppen; bij acht ontwerpen zie je zo pas echt wat je
                kiest (Michiel, 25 september 2026). */}
            <div className="grid grid-cols-2 gap-2.5">
              {CARD_DESIGNS.map((t) => {
                const actief = cardDesign(ontwerp.template) === t
                return (
                  <button
                    key={t}
                    onClick={() => update({ template: t })}
                    aria-pressed={actief}
                    className="text-left p-1.5 rounded-xl flex flex-col gap-1.5"
                    style={{ border: `2px solid ${actief ? GOLD : "transparent"}`, backgroundColor: actief ? "#fff" : "transparent", cursor: "pointer" }}
                  >
                    <Miniatuur display={{ ...display, design: t }} sc={sc} />
                    <span className="px-0.5 text-[13px] font-semibold flex items-center justify-between gap-1" style={{ color: CHARCOAL }}>
                      {CARD_TEMPLATE_LABEL[t]}
                      {FOTO_ONTWERPEN.includes(t) && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={SUBTLE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-label="met foto">
                          <title>Met foto</title>
                          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                          <circle cx="12" cy="13" r="3.5" />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {cardDesign(ontwerp.template) === "eigen" && (
              <div className="rounded-xl p-3 flex flex-col gap-2.5" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
                <input ref={ontwerpRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void kiesOntwerp(f); e.target.value = "" }} />
                <p className="m-0 text-[12px] leading-relaxed" style={{ color: BODY }}>
                  Een afbeelding van jullie kaart, bijvoorbeeld uit Canva. Staand werkt het best, minstens 1000 pixels breed. Wij doen de envelop, het aanmelden en de rest.
                </p>
                {!(ontwerp.ontwerpUrl || ontwerp.ontwerpDataUrl) && (
                  <label className="flex items-start gap-2 text-[12px] leading-snug" style={{ color: CHARCOAL, cursor: "pointer" }}>
                    <input type="checkbox" checked={ontwerpMag} onChange={(e) => setOntwerpMag(e.target.checked)} className="mt-0.5" />
                    <span>Wij mogen dit ontwerp gebruiken: we hebben het zelf gemaakt of er toestemming voor.</span>
                  </label>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => ontwerpRef.current?.click()}
                    disabled={busy === "foto" || (!ontwerpMag && !(ontwerp.ontwerpUrl || ontwerp.ontwerpDataUrl))}
                    className="flex-1 text-sm font-semibold px-3 py-2.5 rounded-xl disabled:opacity-50"
                    style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}
                  >
                    {busy === "foto" ? "Bezig..." : ontwerp.ontwerpUrl || ontwerp.ontwerpDataUrl ? "Ander ontwerp" : "Upload jullie ontwerp"}
                  </button>
                  {(ontwerp.ontwerpUrl || ontwerp.ontwerpDataUrl) && (
                    <button
                      type="button"
                      onClick={() => update({ ontwerpUrl: null, ontwerpDataUrl: null, ontwerpVerhouding: null })}
                      className="text-sm font-semibold px-3 py-2.5 rounded-xl"
                      style={{ backgroundColor: "#fff", color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                    >
                      Weghalen
                    </button>
                  )}
                </div>
                <p className="m-0 text-[11px] leading-relaxed" style={{ color: SUBTLE }}>
                  Jullie namen en datum zetten we niet op de kaart, die staan in het ontwerp. We gebruiken ze wel voor het zegel, de voorvertoning in WhatsApp en de agenda.
                </p>
              </div>
            )}
            {(["palm", "ibiza", "titel"] as string[]).includes(cardDesign(ontwerp.template)) && ontwerp.style !== "poederroze" && (
              <button
                type="button"
                onClick={() => update({ style: "poederroze", kleur: "" })}
                className="text-left text-[12px] rounded-xl px-3 py-2.5"
                style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, cursor: "pointer" }}
              >
                Dit ontwerp is op zijn mooist in <b>poederroze</b>. Probeer het {"›"}
              </button>
            )}
            {cardDesign(ontwerp.template) === "deco" && ontwerp.style !== "zwartgoud" && (
              <button
                type="button"
                onClick={() => update({ style: "zwartgoud", kleur: "" })}
                className="text-left text-[12px] rounded-xl px-3 py-2.5"
                style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, cursor: "pointer" }}
              >
                Art deco is op zijn mooist in <b>zwart en goud</b>. Probeer het {"›"}
              </button>
            )}
            {(cardDesign(ontwerp.template) === "fotovol" || cardDesign(ontwerp.template) === "fotoschrift" || cardDesign(ontwerp.template) === "boog") && !ontwerp.photoDataUrl && !ontwerp.photoUrl && (
              <p className="m-0 text-[12px] leading-relaxed rounded-xl px-3 py-2.5" style={{ color: BODY, backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
                {cardDesign(ontwerp.template) !== "boog"
                  ? "Kies hieronder een foto, dan vult die de hele kaart."
                  : "Kies hieronder een foto voor in de boog. Zonder foto staan jullie initialen erin."}
              </p>
            )}
          </Sectie>

          {/* Een foto kan bij elk ontwerp */}
          <Sectie className={telefoon("foto")} vast={inPaneel("foto")} open={isOpen("foto")} onToggle={() => setStap(stap === "foto" ? null : "foto")} titel="Foto (optioneel)">
            {!FOTO_ONTWERPEN.includes(cardDesign(ontwerp.template)) && (
              <div className="rounded-xl px-3 py-2.5 flex flex-col gap-2" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
                <p className="m-0 text-[12px] leading-relaxed" style={{ color: BODY }}>
                  <b style={{ color: CHARCOAL }}>{CARD_TEMPLATE_LABEL[cardDesign(ontwerp.template)]} heeft geen plek voor een foto.</b>{" "}
                  {ontwerp.photoUrl || ontwerp.photoDataUrl ? "Je foto blijft bewaard, voor als je een ontwerp met foto kiest. " : ""}
                  Een foto kan bij:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FOTO_ONTWERPEN.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => update({ template: f })}
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                    >
                      {CARD_TEMPLATE_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          {/* ── Voor wie is deze kaart ──
              Daggasten en avondgasten is een typisch Nederlands onderscheid
              waar geen buitenlands platform iets mee doet, en het model kende
              het al: een kaart heeft een gastengroep, het dashboard laat hem
              zien en de gastenlijst rekent ermee. Alleen kon je hem nergens
              kiezen. Nu wel, en dan verandert ook de standaardtekst mee.

              Ook bij een Save the Date, want wie zijn indeling al weet kan
              meteen twee losse kaarten maken. */}
          <Sectie className={telefoon("groep")} vast={inPaneel("groep")} open={isOpen("groep")} onToggle={() => setStap(stap === "groep" ? null : "groep")} titel="Voor wie is deze kaart">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update({ guestType: "" })}
                className="text-xs font-semibold px-3 py-2 rounded-xl"
                style={{
                  border: `2px solid ${ontwerp.guestType === "" ? GOLD : GOLD_LIGHT}`,
                  backgroundColor: ontwerp.guestType === "" ? "#fff" : "transparent",
                  color: CHARCOAL,
                  cursor: "pointer",
                }}
              >
                Alle gasten
              </button>
              {CARD_GUEST_TYPES.map((g) => (
                <button
                  key={g}
                  onClick={() => update({ guestType: g })}
                  className="text-xs font-semibold px-3 py-2 rounded-xl"
                  style={{
                    border: `2px solid ${ontwerp.guestType === g ? GOLD : GOLD_LIGHT}`,
                    backgroundColor: ontwerp.guestType === g ? "#fff" : "transparent",
                    color: CHARCOAL,
                    cursor: "pointer",
                  }}
                >
                  {GUEST_TYPE_LABEL[g]}
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
              Maak je één kaart voor iedereen, dan kies je Alle gasten. Wil je de avondgasten een
              andere tijd en een andere tekst geven, maak dan een tweede kaart met hun eigen link.
              In je gastenlijst zie je per gast bij welke groep hij hoort.
            </p>
            <label className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Gastengroep op de kaart</span>
                <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                  {ontwerp.guestType
                    ? `Zet "${GUEST_TYPE_LABEL[ontwerp.guestType]}" klein op de kaart.`
                    : "Kies eerst hierboven voor wie deze kaart is."}
                </span>
              </span>
              <input
                type="checkbox"
                checked={ontwerp.toonGastType}
                disabled={!ontwerp.guestType}
                onChange={(e) => update({ toonGastType: e.target.checked })}
                className="w-5 h-5"
                style={{ accentColor: GOLD, cursor: ontwerp.guestType ? "pointer" : "default" }}
              />
            </label>
          </Sectie>

          {/* ── Details op de kaart ──
              Michiels wens: voor wie de kaart is, hoe laat het is en wat de
              dresscode is, subtiel en zonder de kaart te verpesten. In dezelfde
              volgorde als op de kaart: eerst de uitnodigingsregel, dan de
              tijden en de dresscode, elk op een eigen regel in de accentkleur.
              Wat leeg is, staat er niet. */}
          {/* Alleen bij een trouwkaart: tijden en dresscode. De eigen
              uitnodigingsregel is weg, de boodschap is genoeg (Michiel,
              25 september 2026). */}
          {isTrouwkaart && (
          <Sectie className={telefoon("details")} vast={inPaneel("details")} open={isOpen("details")} onToggle={() => setStap(stap === "details" ? null : "details")} titel="Details op de kaart">
            {/* Tijden en dresscode alleen op een trouwkaart; op een Save the
                Date zijn ze overbodig (Michiel, 25 september 2026) */}
            {isTrouwkaart && (
              <>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold flex items-center justify-between gap-2" style={{ color: CHARCOAL }}>Tijden <Plek waar={tekstPlek("details")} /></span>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Van 14:00 tot 23:00 uur"
                value={ontwerp.timeText}
                onChange={(e) => update({ timeText: e.target.value })}
                maxLength={60}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold flex items-center justify-between gap-2" style={{ color: CHARCOAL }}>Dresscode <Plek waar={tekstPlek("details")} /></span>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Feestelijk"
                value={ontwerp.dresscode}
                onChange={(e) => update({ dresscode: e.target.value })}
                maxLength={40}
              />
            </label>
              </>
            )}
          </Sectie>
          )}

          <Sectie
            className={telefoon("aanmelden")}
            vast={inPaneel("aanmelden")}
            open={isOpen("aanmelden")}
            onToggle={() => setStap(stap === "aanmelden" ? null : "aanmelden")}
            titel={`Aanmelden · ${AANMELD_KORT[ontwerp.aanmelden]}`}
          >
            {/* Een bewuste keuze, met het advies erbij. Standaard vraagt een
                Save the Date niets; dat is aan jou. */}
            {!isTrouwkaart && (
              <p className="m-0 mb-1 text-[12px] leading-relaxed rounded-xl px-3 py-2.5" style={{ color: BODY, backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
                <b style={{ color: CHARCOAL }}>Ons advies: vraag alleen ja of nee.</b> Het kost je gasten één tik, en jij
                weet maanden vooraf ongeveer met hoeveel je rekent. Wie antwoordt staat meteen in je gastenlijst, dus die
                bouwt zich vanzelf op. Dieetwensen en de rest vraag je later op de trouwkaart.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {aanmeldKeuzes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    update({ aanmelden: s })
                    if (s !== "geen") toonFormulier()
                  }}
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

            {/* Wat de gastenlijst is, uitgelegd op de plek waar je er voor het
                eerst tegenaan loopt. Hier stond alleen "komt in je gastenlijst",
                en dat zegt niets als je nog nooit een dashboard hebt gezien. */}
            {ontwerp.aanmelden !== "geen" && (
              <div
                className="px-3 py-2.5 rounded-xl flex flex-col gap-1.5"
                style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
              >
                <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>
                  Je krijgt er een gratis gastenlijst bij, in je dashboard
                </span>
                <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                  <b style={{ color: CHARCOAL }}>Gemak.</b> Maak de link, stuur hem naar je gasten,
                  en de lijst vult zich vanzelf met wie er komt, met mailadres en telefoonnummer.
                </span>
                <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                  <b style={{ color: CHARCOAL }}>Controle.</b> Of vul de lijst vooraf zelf in en
                  houd bij aan wie je de kaart al stuurde. Antwoordt een gast, dan koppelt het
                  dashboard dat antwoord aan de juiste naam. Je weet dus altijd van iedereen hoe het
                  staat.
                </span>
                <span className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
                  <b style={{ color: CHARCOAL }}>Adressen.</b> Stuur je straks papieren trouwkaarten
                  maar heb je niet alle adressen? Laat je gasten ze hier zelf invullen. Dat scheelt
                  een avond appen.
                </span>
              </div>
            )}

          </Sectie>

          <Sectie className={telefoon("taal")} vast={inPaneel("taal")} open={isOpen("taal")} onToggle={() => setStap(stap === "taal" ? null : "taal")} titel="Taal van de kaart">
            <p className="m-0 text-[12px] leading-relaxed" style={{ color: BODY }}>
              De vaste teksten op de kaart staan in deze taal, zoals &quot;Wij gaan trouwen&quot; en de knoppen.
              Wat jullie zelf typen vertalen wij niet.
            </p>
            <p className="m-0 text-[12px] leading-relaxed rounded-xl px-3 py-2.5" style={{ color: BODY, backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
              <b style={{ color: CHARCOAL }}>Gasten die geen Nederlands spreken?</b> Maak dan een tweede kaart in hun taal:
              druk bovenaan op het plusje, dan staat alles er al, en kies hier de taal. Elke kaart krijgt zijn eigen link,
              en het zit in de prijs.
            </p>
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

          <Sectie className={telefoon("bekijken")} vast={inPaneel("bekijken")} open={isOpen("bekijken")} onToggle={() => setStap(stap === "bekijken" ? null : "bekijken")} titel="Voorbeeld en proefkaart">
            {/* Klaar om te versturen? Wat nog ontbreekt is aanklikbaar en brengt
                je naar de plek waar het hoort. Michiels keuze van 25 september
                2026. */}
            <div className="rounded-xl p-3 flex flex-col gap-1" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}>
              <span className="text-xs font-semibold mb-1" style={{ color: CHARCOAL }}>
                {controles.every((c) => c.klaar || c.mag) ? "Klaar om te versturen" : "Nog even nalopen"}
              </span>
              {controles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { if (!c.klaar) doeControle(c.id) }}
                  className="flex items-center gap-2 text-left text-[12px] py-1"
                  style={{ background: "none", border: 0, padding: 0, cursor: c.klaar ? "default" : "pointer", color: c.klaar ? BODY : CHARCOAL }}
                >
                  <span
                    aria-hidden
                    className="w-4 h-4 flex-shrink-0 rounded-full inline-flex items-center justify-center text-[10px] font-bold"
                    style={c.klaar
                      ? { backgroundColor: KLEUR.groen, color: "#fff" }
                      : { border: `1.5px solid ${c.mag ? GOLD_LIGHT : "#D97706"}` }}
                  >
                    {c.klaar ? "✓" : ""}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {!c.klaar && <span className="font-semibold" style={{ color: GOLD }}>{c.actie} {"›"}</span>}
                </button>
              ))}
            </div>
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
        {/* Op de telefoon blijft het voorbeeld bovenin staan terwijl je onder
            de secties doorscrolt, op iets minder dan de helft van het scherm.
            Zo zie je je kaart veranderen terwijl je typt. */}
        <main
          ref={voorbeeldRef}
          className={`flex-1 p-4 sm:p-5 md:overflow-y-auto md:relative md:order-2 ${blad && blad !== "kaart" && !bladKlein ? "max-md:max-h-[40vh] max-md:overflow-hidden" : ""}`}
          onTouchStart={(e) => { veegStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
          onTouchEnd={(e) => {
            const s = veegStart.current
            veegStart.current = null
            if (!s) return
            const dx = e.changedTouches[0].clientX - s.x
            const dy = e.changedTouches[0].clientY - s.y
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) void veeg(dx < 0 ? 1 : -1)
          }}
          /* Dezelfde achtergrond als je gast straks ziet, zodat het voorbeeld
             in de bouwer klopt met de kaart die aankomt. Michiels wens van
             23 september 2026. */
          style={{ background: sc.bodyBackground ?? sc.bodyBg }}
        >
          {/* Rechtsboven in het voorbeeld, in dezelfde stijl als "Terug naar
              ontwerpen" in de simulatie. Michiels punt: die knop hoort bij
              het voorbeeld, niet ergens in een sectie. */}
          {/* Blijft staan als je in het voorbeeld naar beneden scrolt (Michiel,
              25 september 2026). Een lege rij met de knop erin, zodat hij de
              kaart niet naar beneden duwt. */}
          <div className="hidden md:flex sticky top-0 z-10 h-0 justify-end">
          <button
            type="button"
            onClick={() => setSimulatie(true)}
            className="inline-flex text-sm font-semibold px-4 py-2 rounded-xl shadow-lg"
            style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            {"💌"} Bekijk hoe het opengaat
          </button>
          </div>
          <div className={`mx-auto max-w-md transition-transform duration-200 origin-top ${blad && blad !== "kaart" && !bladKlein ? "max-md:scale-[0.45]" : ""}`}>
            {/* Op de telefoon weg: daar was de bovenkant te druk met twee
                balken, een kopje, een demoknop en een uitleg (Michiel, 26
                september 2026). De demo staat daar in de balk bovenin. */}
            <div className="hidden md:flex items-center justify-center gap-3 mb-1">
              <p className="m-0 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: sc.headingColor, opacity: 0.75 }}>
                Zo ziet jullie kaart eruit
              </p>
            </div>
            <p className="hidden md:block m-0 mb-4 text-center text-[11px]" style={{ color: sc.headingColor, opacity: 0.55 }}>
              {cardDesign(ontwerp.template) === "eigen"
                ? "Jullie eigen ontwerp, zonder tekst eroverheen"
                : "Tik op een tekst op de kaart om hem te wijzigen"}
            </p>
            {kaartenVanDitSoort.length > 1 && (
              <div className="md:hidden -mt-2 mb-3 flex items-center justify-center gap-1.5" aria-label="Veeg voor je andere kaarten">
                {kaartenVanDitSoort.map((k) => (
                  <span
                    key={k.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: k.id === cardId ? sc.headingColor : `${sc.headingColor}44` }}
                  />
                ))}
                <span className="ml-1.5 text-[10px]" style={{ color: sc.headingColor, opacity: 0.55 }}>veeg voor je andere kaarten</span>
              </div>
            )}
            {/* Geen overflow-clip en geen eigen schaduw om de kaart heen: de
                kaart tekent zijn eigen schaduw, en een klippende doos eromheen
                sneed die af tot een vierkant. */}
            {/* Tik op een tekst op de kaart en je bewerkt die tekst */}
            <div className="rounded-2xl cursor-text" onClick={tikOpKaart} title="Tik op een tekst om hem te wijzigen">
              <CardReveal
                display={display}
                initials={initialen}
                sc={sc}
                siteUrl={null}
                rsvpUrl={null}
                startOpen
                compact
                watermerk="licht"
              />            </div>

            {/* ── Wat je gasten zien ──
                Michiels punt: de keuze die je bij Aanmelden maakt moet ook in de
                bouwer te zien zijn, en niet pas als de kaart de deur uit is.
                Dit is hetzelfde formulier dat je gast krijgt, alleen kan er
                niets verstuurd worden. */}
            {ontwerp.aanmelden !== "geen" && (
              <div className="mt-6" ref={formulierRef}>
                <p className="text-center text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: sc.headingColor, opacity: 0.75 }}>
                  En dit vullen je gasten in
                </p>
                {/* Dezelfde doos en kleuren als op de kaartpagina, zodat het
                    voorbeeld hier klopt met wat de gast ziet. */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: sc.cardBg ?? "#ffffff", border: `1px solid ${sc.accent}33` }}
                >
                  <AanmeldFormulier
                    stand={ontwerp.aanmelden}
                    taal={ontwerp.taal}
                    voorbeeld
                    compact
                    accentColor={sc.accent ?? GOLD}
                    labelColor={sc.cardText ?? sc.bodyText}
                    knopTekstKleur={sc.buttonText}
                    guestTypes={ontwerp.guestType ? [ontwerp.guestType] : ["daggast"]}
                  />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Envelopsimulatie ── */}
      {simulatie && (
        /* "background" en niet "backgroundColor": bij Roze is de achtergrond
           een patroon met een kleur erachter, en dat is als kleur ongeldig.
           Dan viel de achtergrond weg en zag je de bouwer erdoorheen zodra je
           onder de kaart scrolde (Michiels bevinding van 23 september 2026). */
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ background: sc.bodyBackground ?? sc.bodyBg }}>
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
            /* Nog niet bewaard? Dan staat de knop er wel, maar doet hij nog
               niets: de link bestaat pas na het bewaren. Anders leek de knop
               verdwenen bij een nieuwe kaart (Michiel, 23 september 2026). */
            agendaVoorbeeld={!!ontwerp.datum && !huidigeKaart}
            previewNotice
            /* Het formulier op de plek waar je gast het krijgt, tussen de
               kaart en de agendaknop. */
            aanmeldStand={ontwerp.aanmelden}
            aanmeldVoorbeeld={
              <AanmeldFormulier
                stand={ontwerp.aanmelden}
                taal={ontwerp.taal}
                voorbeeld
                compact
                accentColor={sc.accent ?? GOLD}
                labelColor={sc.cardText ?? sc.bodyText}
                knopTekstKleur={sc.buttonText}
                guestTypes={ontwerp.guestType ? [ontwerp.guestType] : ["daggast"]}
              />
            }
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
    </BouwerSchil>
  )
}
