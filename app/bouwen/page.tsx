"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import AanmeldFormulier from "@/components/AanmeldFormulier"
import { useRouter } from "next/navigation"
import Link from "next/link"
import EventHomePreview from "@/components/EventHomePreview"
import EventNav from "@/app/events/[slug]/event-nav"
import PraktischPreview, { DEFAULT_PRAKTISCH_TILES, type PraktischTile } from "@/components/PraktischPreview"
import WishlistPreview, { DEFAULT_WISHLIST_ITEMS, type WishlistItem } from "@/components/WishlistPreview"
import EventMastersPreview from "@/components/EventMastersPreview"
import EventProgramPreview, { PROGRAM_ICONS, ProgramIcon, DEFAULT_PROGRAM_ITEMS } from "@/components/EventProgramPreview"
import StoryPreview from "@/components/StoryPreview"
import FotosPreview from "@/components/FotosPreview"
import { formatDate, STYLE_CONFIG, STYLE_NAAM, STYLE_VOLGORDE, type Style } from "@/lib/event-styles"
import { TITLE_FONT_OPTIONS, getTitleFont } from "@/lib/title-fonts"
import { createClient } from "@/lib/supabase"
import { eventSiteUrl } from "@/lib/site-url"
import { DEFAULT_PLAN, hoogstePlan, PLANS, formatEur, isCardPlan, isPlan, planAllows, upgradePrice, type Plan } from "@/lib/plans"
import BouwerSchil from "@/components/BouwerSchil"
import { Knop, Melding, SectieKop } from "@/components/ui"
import { KLEUR } from "@/lib/ontwerp"
import SophieTutorial, { type SophieNav } from "@/components/SophieTutorial"
import {
  DEFAULT_PRAKTISCH,
  DEFAULT_PROGRAMMA,
  LS_NAAR_WEBSITE,
  LS_WEBSITE_CONCEPT,
  LS_WEBSITE_INHOUD,
  NAAR_WEBSITE_GELDIG_MS,
  nieuwWebsiteConcept,
} from "@/lib/nieuw-concept"

type EventType = "bruiloft" | "verjaardag" | "evenement"
type PageId = "Home" | "Programma" | "RSVP" | "Informatie" | "Cadeautips" | "Fotos" | "Ceremoniemeesters" | "OnsVerhaal"
// De stijlen komen uit lib/event-styles.ts, dezelfde als de kaarten en de
// echte website. Hier stond een kopie; die liep al een kleur achter.
type Viewport = "desktop" | "mobiel"
type Align = "left" | "center" | "right"

interface HomeContent {
  title: string
  body: string   // HTML from contenteditable
  align: Align
  titleSize?: number
  bodySize?: number
}

interface HomepageSettings {
  layout: 'editorial' | 'modern'
  subtitleText: string
  subtitleFont: string
  subtitleSize: number
  hoofdtitelVisible: boolean
  hoofdtitelFont: string
  hoofdtitelSize: number
  datumFont: string
  datumSize: number
  datumNotatie: 'uitgeschreven' | 'numeriek'
  titlePosition: 'over' | 'under'
  initialsVisible: boolean
  frameNamesVisible: boolean
  datumVisible: boolean
  subtitleVisible: boolean
  locatieVisible: boolean
  locatieFont: string
  locatieSize: number
  siteLayout: 'boxed' | 'fullwidth'
  pageMode: 'multi' | 'single'
}

const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  layout: 'editorial',
  subtitleText: '',
  subtitleFont: 'lora',
  subtitleSize: 1.1,
  subtitleVisible: true,
  // Uit: het kader toont de namen al. Aan zou dezelfde namen er een tweede
  // keer boven zetten, en dat gebeurde ook echt bij een bruiloft die in de
  // kaartbouwer was begonnen. Wie hem wil, zet hem aan bij Tekstvelden.
  hoofdtitelVisible: false,
  hoofdtitelFont: 'pinyonscript',
  hoofdtitelSize: 5.5,
  datumFont: 'playfair',
  datumSize: 1.6,
  datumNotatie: 'uitgeschreven',
  titlePosition: 'over',
  initialsVisible: true,
  frameNamesVisible: true,
  datumVisible: true,
  locatieVisible: true,
  locatieFont: 'montserrat',
  locatieSize: 1.1,
  siteLayout: 'boxed',
  pageMode: 'multi',
}

interface MasterPerson {
  id?: string
  naam: string
  telefoon: string
  email: string
  foto_url: string | null
}

interface Draft {
  type: EventType
  naam: string
  datum: string
  locatie: string
  email: string
  slug?: string
  nav_title?: string
  style?: string
  font_hero?: string
  font_initials?: string
  font_frame_names?: string
  font_page_titles?: string
  heroOverlay?: boolean
  storyOverlay?: boolean
  homeContent?: HomeContent
  navLayout?: 'stacked' | 'split' | 'left'
  use_frame?: boolean
  frame_style?: string
  initials?: string
  frame_names?: string
  frame_location?: string
  frameInitialsSize?: number
  frameNamesSize?: number
  frameDateSize?: number
  frameLocationSize?: number
  naam1?: string
  naam2?: string
  hero_image_pos_x?: number
  hero_image_pos_y?: number
  homepageSettings?: HomepageSettings
}

interface PageConfig {
  id: PageId
  label: string
  toggleable: boolean
}

interface ProgrammaItem { id?: string; time: string; title?: string; description: string; iconId?: string; image_url?: string | null; imagePosX?: number }

type ContentMap = Partial<Record<PageId, Record<string, unknown>>>
type StyleConfig = typeof STYLE_CONFIG[Style]

const UPLOAD_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", gif: "image/gif",
}

const MAX_DIM = 1920
const WEBP_QUALITY = 0.82

async function compressImage(file: File): Promise<File> {
  // GIF: canvas strips animation — upload as-is
  if (file.type === "image/gif") return file

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { naturalWidth: w, naturalHeight: h } = img
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM }
        else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM }
      }

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)

      const tryBlob = (mime: string, quality: number, fallbackMime?: string) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            if (fallbackMime) tryBlob(fallbackMime, quality)
            else resolve(file)
            return
          }
          const ext = mime === "image/webp" ? "webp" : "jpg"
          const name = file.name.replace(/\.[^.]+$/, `.${ext}`)
          const compressed = new File([blob], name, { type: mime })
          // Keep original if compression made it larger (e.g. tiny PNGs)
          resolve(compressed.size < file.size ? compressed : file)
        }, mime, quality)
      }

      tryBlob("image/webp", WEBP_QUALITY, "image/jpeg")
    }

    img.src = objectUrl
  })
}

async function uploadToStorage(file: File, bucket: string): Promise<string> {
  let toUpload = file
  try { toUpload = await compressImage(file) } catch { /* fallback: upload original */ }

  const ext = toUpload.name.split(".").pop()?.toLowerCase() ?? "webp"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const contentType = toUpload.type || UPLOAD_MIME[ext] || "image/jpeg"
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, toUpload, { contentType, upsert: true })
  if (error || !data?.path) throw new Error(error?.message ?? "Upload mislukt")
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}



const PAGES: PageConfig[] = [
  { id: "Home",               label: "Home",               toggleable: false },
  { id: "OnsVerhaal",         label: "Ons Verhaal",        toggleable: true  },
  { id: "Programma",          label: "Programma",          toggleable: true  },
  { id: "Informatie",          label: "Informatie",         toggleable: true  },
  { id: "Cadeautips",           label: "Cadeautips",         toggleable: true  },
  { id: "Ceremoniemeesters",  label: "Ceremoniemeesters",  toggleable: true  },
  { id: "RSVP",               label: "RSVP",               toggleable: true  },
  { id: "Fotos",              label: "Foto's",             toggleable: true  },
]

// ── Op de telefoon: vier onderdelen ──────────────────────────────────────────
// Hetzelfde principe als de kaartbouwer (Michiel, 25 september 2026): het
// voorbeeld vult het scherm, onderaan een balk met vier onderdelen, en elk
// onderdeel schuift als paneel omhoog. Op de laptop zijn het de kopjes in de
// zijbalk, in dezelfde volgorde.
type Sectie = 'algemeen' | 'paginas' | 'url' | 'bekijken'
type Blad = "uiterlijk" | "paginas" | "adres" | "bekijken"
const BLAD_VOLGORDE: Blad[] = ["uiterlijk", "paginas", "adres", "bekijken"]
const BLAD_TITEL: Record<Blad, string> = {
  uiterlijk: "Uiterlijk",
  paginas: "Pagina's",
  adres: "Webadres",
  bekijken: "Bekijken",
}
const BLAD_SECTIE: Record<Blad, Sectie> = {
  uiterlijk: "algemeen",
  paginas: "paginas",
  adres: "url",
  bekijken: "bekijken",
}
// De plek in de zijbalk. Letterlijk uitgeschreven, zodat Tailwind de klassen vindt.
const SECTIE_ORDE: Record<Sectie, string> = {
  algemeen: "order-[10]",
  paginas: "order-[20]",
  url: "order-[30]",
  bekijken: "order-[40]",
}

function BladIcoon({ blad }: { blad: Blad }) {
  const pad = {
    uiterlijk: "M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.76-2.24 4-5 4h-1.5a1.5 1.5 0 0 0-1.06 2.56A1.5 1.5 0 0 1 12 21zM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM16.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    paginas: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5M8 13h8M8 17h5",
    adres: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
    bekijken: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  }[blad]
  return (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={pad} />
    </svg>
  )
}

const CONTROLS_PAGES = new Set<PageId>(["Home", "Ceremoniemeesters", "Programma", "RSVP", "OnsVerhaal", "Informatie", "Cadeautips", "Fotos"])
const MAX_FOTOS = 60

const TYPE_LABEL: Record<EventType, string> = {
  bruiloft: "Bruiloft", verjaardag: "Verjaardag", evenement: "Evenement",
}

// ── Compact font selector ─────────────────────────────────────────────────────

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cur = TITLE_FONT_OPTIONS.find(f => f.id === value) ?? TITLE_FONT_OPTIONS[0]
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border border-[var(--goud-licht)] bg-white px-2 py-1.5 text-[11px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-[var(--goud-vlak)]"
      >
        {TITLE_FONT_OPTIONS.map(f => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      <span
        className="text-sm flex-shrink-0 text-gray-600 leading-none"
        style={{ fontFamily: `var(${cur.cssVar})`, fontWeight: cur.weight, minWidth: "1.5rem" }}
      >Aa</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BouwenPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storyFileInputRef = useRef<HTMLInputElement>(null)
  const fotosFileInputRef = useRef<HTMLInputElement>(null)

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [storyImageBlob, setStoryImageBlob] = useState<string | null>(null)
  const [storyUploading, setStoryUploading] = useState(false)
  const [storyImageError, setStoryImageError] = useState<string | null>(null)
  const [fotosUploading, setFotosUploading] = useState(false)
  const [fotosUploadError, setFotosUploadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [active, setActive] = useState<Record<PageId, boolean>>({
    Home: true, Programma: true, RSVP: true, Informatie: false, Cadeautips: false, Fotos: false, Ceremoniemeesters: false, OnsVerhaal: false,
  })
  // Gekozen pakket: bepaalt welke onderdelen te bewerken zijn. Bij een
  // kaartpakket gaat het alleen om de voorkant (namen, datum, stijl).
  // Server en client moeten dezelfde eerste render geven, dus het pakket wordt
  // pas na het monteren uit de URL of localStorage gelezen.
  const [plan, setPlan] = useState<Plan>(DEFAULT_PLAN)
  // Wat er al betaald is, als de bruiloft al een pakket heeft. Dan kost
  // publiceren alleen het verschil.
  const [betaaldPlan, setBetaaldPlan] = useState<Plan | null>(null)
  const [previewPage, setPreviewPage] = useState<PageId>("Home")
  const [activeSection, setActiveSection] = useState<Sectie | null>(null)
  const [activeSubPage, setActiveSubPage] = useState<PageId | null>(null)
  const [content, setContent] = useState<ContentMap>({})
  const [style, setStyle] = useState<Style>("zand")
  const [fontHero, setFontHero] = useState("pinyonscript")
  const [fontInitials, setFontInitials] = useState("pinyonscript")
  const [fontFrameNames, setFontFrameNames] = useState("pinyonscript")
  const [fontPageTitles, setFontPageTitles] = useState("playfair")
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [heroImageError, setHeroImageError] = useState<string | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [zoomMultiplier, setZoomMultiplier] = useState(1)
  const [openIconPickerIdx, setOpenIconPickerIdx] = useState<number | null>(null)
  const [programUploadingIds, setProgramUploadingIds] = useState<Set<string>>(new Set())
  const [isPublished, setIsPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedEventId, setSavedEventId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authEmail, setAuthEmail] = useState("")
  const [authSent, setAuthSent] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [changeKey, setChangeKey] = useState(0)
  /**
   * Pas tellen als het laden klaar is.
   *
   * Tijdens het inlezen van een bewaarde bruiloft zetten voorvertoningen en
   * standaardwaarden nog van alles, en dat telde mee als een wijziging van de
   * klant. Je zag dan "Opslaan" of zelfs een automatische opslag zodra je de
   * bouwer opende, terwijl je niets had aangeraakt.
   */
  const [ladenKlaar, setLadenKlaar] = useState(false)
  // Hoe jullie dit ontwerp noemen. Staat op de bruiloft (concept_naam) en is
  // wat het dashboard bij de websitetegel laat zien, net als de naam van een
  // kaart. Michiels wens van 22 september 2026.
  const [conceptNaam, setConceptNaam] = useState("")
  /** Het laden is echt mislukt. Dan niet doorsturen, maar zeggen wat er is. */
  const [laadFout, setLaadFout] = useState<string | null>(null)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const savingRef = useRef(false)
  const [slugEditOpen, setSlugEditOpen]         = useState(false)
  const [slugValue, setSlugValue]               = useState("")
  const [slugError, setSlugError]               = useState<string | null>(null)
  const [slugSaving, setSlugSaving]             = useState(false)
  const [hpSettings, setHpSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS)
  const [hpOpenGear, setHpOpenGear] = useState<string | null>(null)
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null)
  const [openAlgSection, setOpenAlgSection] = useState<'stijl' | 'layout' | 'lettertype' | null>(null)
  const [openUrlSection, setOpenUrlSection] = useState<'url' | 'beveiliging' | null>(null)
  const [openHomeSection, setOpenHomeSection] = useState<'layout' | 'headerfoto' | 'kaders' | 'tekstvelden' | 'welkomst' | null>(null)
  const [pwEnabled, setPwEnabled] = useState(false)

  useEffect(() => { if (window.innerWidth < 768) setViewport("mobiel") }, [])
  useEffect(() => {
    const uitUrl = new URLSearchParams(window.location.search).get("plan")
    if (isPlan(uitUrl)) { setPlan(uitUrl); return }
    try {
      const bewaard = localStorage.getItem("sayingyes_plan")
      if (isPlan(bewaard)) setPlan(bewaard)
    } catch {}
  }, [])
  // Wie met een kaartpakket op deze bouwer belandt zonder bruiloft hoort in de
  // kaartbouwer: daar begint zijn product. Maar hoort er al een bruiloft bij,
  // dan mag hij hier gewoon een site ontwerpen. Ontwerpen is gratis; pas bij
  // publiceren komt het pakket Compleet erbij (zie handlePublish).
  useEffect(() => {
    if (!isCardPlan(plan)) return
    if (new URLSearchParams(window.location.search).get("event_id")) return
    router.replace("/kaart-maken")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan])
  useEffect(() => { if (activeSection !== 'algemeen') setOpenAlgSection(null) }, [activeSection])
  useEffect(() => { if (activeSection !== 'url') setOpenUrlSection(null) }, [activeSection])
  useEffect(() => { if (activeSection !== 'paginas') setActiveSubPage(null) }, [activeSection])
  useEffect(() => { if (activeSection !== 'paginas' || activeSubPage !== 'Home') setOpenHomeSection(null) }, [activeSection, activeSubPage])

  const [pwType, setPwType] = useState<'password' | 'secret_question'>('password')
  const [pwValue, setPwValue] = useState('')
  const [pwQuestion, setPwQuestion] = useState('')
  const [pwAnswer, setPwAnswer] = useState('')

  // Welk paneel op de telefoon open is; op een groot scherm blijft dit leeg.
  const [blad, setBlad] = useState<Blad | null>(null)
  const bladRef = useRef<HTMLElement>(null)
  // Twee standen, net als in de kaartbouwer: vol, of klein met alleen de kop
  // zichtbaar zodat je de hele pagina ziet. Half omlaag vegen maakt hem
  // klein, verder vegen sluit hem, omhoog vegen of op de kop tikken maakt hem
  // weer vol.
  const [bladKlein, setBladKlein] = useState(false)
  const [sleep, setSleep] = useState(0)
  const sleepStart = useRef<number | null>(null)
  function openBlad(b: Blad | null) {
    setBlad(b)
    setBladKlein(false)
    setSleep(0)
    if (b) setActiveSection(BLAD_SECTIE[b])
    // Pagina's begint bij de lijst, zodat je ziet wat er aan staat
    if (b === "paginas") setActiveSubPage(null)
  }
  // Een nieuw paneel, of een andere pagina erin, begint bovenaan. Anders
  // kwam je met Volgende onderaan het volgende onderdeel uit.
  useLayoutEffect(() => {
    if (blad && bladRef.current) bladRef.current.scrollTop = 0
  }, [blad, activeSubPage])
  /** Hoort deze sectie bij het paneel dat nu op de telefoon open is? */
  const inPaneel = (s: Sectie) => !!blad && BLAD_SECTIE[blad] === s
  /** Zijn plek in de zijbalk, en op de telefoon alleen zichtbaar in zijn eigen paneel. */
  const sectieKlassen = (s: Sectie) => `${SECTIE_ORDE[s]} ${inPaneel(s) ? "" : "max-md:hidden"}`
  // In een paneel op de telefoon staat alles open, dan mis je niets. Op de
  // laptop blijft het één tegelijk.
  const algOpen = (s: 'stijl' | 'layout' | 'lettertype') => openAlgSection === s || blad === "uiterlijk"
  const urlOpen = (s: 'url' | 'beveiliging') => openUrlSection === s || blad === "adres"
  const homeOpen = (s: 'layout' | 'headerfoto' | 'kaders' | 'tekstvelden' | 'welkomst') => openHomeSection === s || blad === "paginas"
  // Tik je in het voorbeeld op iets, dan open je de pagina waar het bij
  // hoort. Op de telefoon schuift daarvoor het paneel Pagina's omhoog.
  function toonPaginas() {
    setActiveSection('paginas')
    if (window.matchMedia("(max-width: 767px)").matches) {
      setBlad("paginas")
      setBladKlein(false)
    }
  }
  /** Naar een onderdeel: op de telefoon het paneel, op de laptop het kopje. */
  function gaNaarBlad(b: Blad) {
    if (window.matchMedia("(max-width: 767px)").matches) openBlad(b)
    else setActiveSection(BLAD_SECTIE[b])
  }

  function handlePreviewFieldClick(field: string) {
    // Map field name to the accordion section it lives in
    const sectionForField: Record<string, 'layout' | 'headerfoto' | 'kaders' | 'tekstvelden' | 'welkomst'> = {
      'welkomst-titel': 'welkomst',
      'welkomst-tekst': 'welkomst',
      'headerfoto': 'headerfoto',
      'hoofdtitel': 'tekstvelden',
      'subtitle': 'tekstvelden',
      'namen': 'tekstvelden',
      'initialen': 'tekstvelden',
      'datum': 'tekstvelden',
      'locatie': 'tekstvelden',
    }
    const section = sectionForField[field] ?? 'tekstvelden'

    setPreviewPage("Home")
    toonPaginas()
    setActiveSubPage('Home')
    setOpenHomeSection(section)
    setHpOpenGear(field)
    // Wait for sidebar+accordion to render before scrolling/focusing
    setTimeout(() => {
      const el = document.getElementById(`hp-field-${field}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type="range"]):not([type="checkbox"]):not([type="file"]), textarea'
      )
      if (input) {
        input.focus()
        const len = input.value.length
        input.setSelectionRange(len, len)
      }
    }, 150)
  }

  function handleStoryFieldClick(field: 'title' | 'text') {
    toonPaginas()
    setActiveSubPage('OnsVerhaal')
    setTimeout(() => {
      const el = document.getElementById(field === 'title' ? 'onsverhaal-title' : 'onsverhaal-text')
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement | HTMLTextAreaElement).value.length
      ;(el as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(len, len)
    }, 150)
  }

  function handleProgramItemClick(itemId: string, field?: 'title' | 'description') {
    toonPaginas()
    setActiveSubPage('Programma')
    setTimeout(() => {
      const id = field === 'description' ? `programma-description-${itemId}` : `programma-title-${itemId}`
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement | HTMLTextAreaElement).value.length
      ;(el as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(len, len)
    }, 150)
  }

  function handleInfoTileClick(tileId: string, field: 'title' | 'text') {
    toonPaginas()
    setActiveSubPage('Informatie')
    setTimeout(() => {
      const el = document.getElementById(`informatie-${field}-${tileId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement | HTMLTextAreaElement).value.length
      ;(el as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(len, len)
    }, 150)
  }

  function handleWishlistItemClick(itemId: string, field: 'title' | 'text') {
    toonPaginas()
    setActiveSubPage('Cadeautips')
    setTimeout(() => {
      const el = document.getElementById(`cadeau-${field}-${itemId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement | HTMLTextAreaElement).value.length
      ;(el as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(len, len)
    }, 150)
  }

  function handleMasterClick(masterId: string) {
    toonPaginas()
    setActiveSubPage('Ceremoniemeesters')
    setTimeout(() => {
      const el = document.getElementById(`master-naam-${masterId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement).value.length
      ;(el as HTMLInputElement).setSelectionRange(len, len)
    }, 150)
  }

  function handleMastersTextClick() {
    toonPaginas()
    setActiveSubPage('Ceremoniemeesters')
    setTimeout(() => {
      const el = document.getElementById('ceremoniemeesters-vrije-tekst')
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }, 150)
  }

  function handleMasterContactClick(masterId: string, field: 'telefoon' | 'email') {
    toonPaginas()
    setActiveSubPage('Ceremoniemeesters')
    setTimeout(() => {
      const el = document.getElementById(`master-${field}-${masterId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement).value.length
      ;(el as HTMLInputElement).setSelectionRange(len, len)
    }, 150)
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlEventId = urlParams.get("event_id")

    if (urlEventId) {
      setSavedEventId(urlEventId)

      // Always fetch from server — auto-save keeps the DB current so this is always safe.
      fetch(`/api/drafts/${urlEventId}`)
        .then((r) => r.json())
        .then(({ event, pages }: { event: Record<string, unknown>; pages: Array<{ type: string; content: Record<string, unknown>; is_enabled: boolean }> }) => {
          // Bestaat de bruiloft niet (meer), dan zeggen we dat. Doorsturen naar
          // /bouwen zou een lus maken: die stuurt je bij een bewaarde bruiloft
          // weer hierheen, en dan blijft het laadscherm staan.
          if (!event) {
            setLaadFout("We konden deze bruiloft niet vinden. Misschien is hij verwijderd.")
            return
          }

          setConceptNaam(typeof event.concept_naam === "string" ? event.concept_naam : "")

          const newContent: ContentMap = {}
          const newActive: Record<PageId, boolean> = {
            Home: false, Programma: false, RSVP: false, Informatie: false,
            Cadeautips: false, Fotos: false, Ceremoniemeesters: false, OnsVerhaal: false,
          }
          let restoredHomeContent: HomeContent | undefined
          for (const page of pages) {
            const t = page.type as PageId
            if (page.is_enabled) newActive[t] = true
            newContent[t] = page.content
            if (t === "Home" && page.content) {
              restoredHomeContent = {
                title: (page.content.title as string) ?? "",
                body: (page.content.body as string) ?? "",
                align: (page.content.align as Align) ?? "center",
              }
            }
          }

          const restoredDraft: Draft = {
            type: (event.type as EventType) ?? "bruiloft",
            naam: (event.title as string) ?? "",
            datum: (event.datum as string) ?? "",
            locatie: (event.locatie as string) ?? "",
            email: "",
            slug: (event.slug as string) ?? "",
            nav_title: (event.nav_title as string) ?? undefined,
            style: (event.style as string) ?? "zand",
            font_hero:        (event.font_hero as string)        ?? "pinyonscript",
            font_initials:    (event.font_initials as string)    ?? "pinyonscript",
            font_frame_names: (event.font_frame_names as string) ?? "pinyonscript",
            font_page_titles: (event.font_page_titles as string) ?? "playfair",
            navLayout: (event.nav_layout as Draft["navLayout"]) ?? "split",
            use_frame: (event.use_frame as boolean) ?? false,
            frame_style: (event.frame_style as string) ?? undefined,
            initials: (event.initials as string) ?? undefined,
            frame_names: (event.frame_names as string) ?? undefined,
            frame_location: (event.frame_location as string) ?? undefined,
            frameInitialsSize: (event.frame_initials_size as number) ?? undefined,
            frameNamesSize: (event.frame_names_size as number) ?? undefined,
            frameDateSize: (event.frame_date_size as number) ?? undefined,
            frameLocationSize: (event.frame_location_size as number) ?? undefined,
            hero_image_pos_x: (event.hero_image_pos_x as number) ?? 50,
            hero_image_pos_y: (event.hero_image_pos_y as number) ?? 50,
            heroOverlay: (event.hero_overlay as boolean) ?? true,
            storyOverlay: typeof newContent.OnsVerhaal?.show_overlay === "boolean" ? newContent.OnsVerhaal.show_overlay : true,
            homeContent: restoredHomeContent,
          }

          // Seed programma defaults if not yet set
          if (!newContent.Programma?.items || (newContent.Programma.items as unknown[]).length === 0) {
            newContent.Programma = { ...(newContent.Programma ?? {}), items: DEFAULT_PROGRAM_ITEMS, layout: "timeline" }
          }

          // Seed informatie defaults if not yet set
          if (!newContent.Informatie?.items || (newContent.Informatie.items as unknown[]).length === 0) {
            newContent.Informatie = { ...(newContent.Informatie ?? {}), items: DEFAULT_PRAKTISCH_TILES }
          }

          // Betaald is nog niet "de site staat live": met alleen een Save the
          // Date is de bruiloft wel gepubliceerd, maar hoort de website er
          // niet bij. Dan toonde de bouwer "Bekijk live site" voor een site
          // die er niet was (gevonden 24 september 2026).
          const published = event.status === "published" && planAllows(event.plan, "site")
          if (event.status === "published" || event.status === "expired") {
            setBetaaldPlan(isPlan(event.plan) ? event.plan : null)
          }
          if (isPlan(event.plan)) setPlan(event.plan)
          setDraft(restoredDraft)
          setLadenKlaar(true)
          setStyle(((event.style as string) || "zand") as Style)
          setFontHero((event.font_hero as string) || "pinyonscript")
          setFontInitials((event.font_initials as string) || "pinyonscript")
          setFontFrameNames((event.font_frame_names as string) || "pinyonscript")
          setFontPageTitles((event.font_page_titles as string) || "playfair")
          if (event.homepage_settings) {
            setHpSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...(event.homepage_settings as Partial<HomepageSettings>) })
          }
          if (event.pw_enabled) setPwEnabled(event.pw_enabled as boolean)
          if (event.pw_type)    setPwType(event.pw_type as 'password' | 'secret_question')
          if (event.pw_value)   setPwValue(event.pw_value as string)
          if (event.pw_question) setPwQuestion(event.pw_question as string)
          if (event.pw_answer)  setPwAnswer(event.pw_answer as string)
          setContent(newContent)
          setActive(newActive)
          setIsPublished(published)
          const heroUrl = event.hero_image_url as string | null
          if (heroUrl) setHeroImageUrl(heroUrl)
        })
        .catch(() => setLaadFout("We konden je bruiloft niet laden. Ververs de pagina en probeer het opnieuw."))
      return
    }

    // No URL param — check auth, then fall back to localStorage draft for new (guest) users
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      // Een concept uit de browseropslag inlezen. Dit staat als functie los,
      // omdat er twee wegen naartoe zijn: iemand die niet is ingelogd en zijn
      // werk uit het aanmaakformulier heeft, en iemand die wel is ingelogd en
      // net vanuit de kaartbouwer op Website drukte. Dat tweede ging eerst mis,
      // want alleen de eerste tak keek naar de browser.
      function laadConceptUitBrowser(email?: string | null): boolean {
        try {
          const savedDraft = localStorage.getItem("sayingyes_draft")
          if (!savedDraft) return false
        const d = JSON.parse(savedDraft) as Record<string, unknown>
        const savedContent = localStorage.getItem("sayingyes_content")
        const extraContent: ContentMap = savedContent ? JSON.parse(savedContent) : {}
        const hp = d.homepage_settings as Partial<HomepageSettings> | undefined
        const hc = d.homeContent as HomeContent | undefined

        setDraft({
          type: (d.type as EventType) ?? "bruiloft",
          naam: (d.naam as string) ?? "",
          datum: (d.datum as string) ?? "",
          locatie: (d.locatie as string) ?? "",
          email: (d.email as string) ?? "",
          slug: (d.slug as string) ?? undefined,
          nav_title: (d.nav_title as string) ?? undefined,
          style: (d.style as string) ?? "ivoor",
          navLayout: (d.nav_layout as Draft["navLayout"]) ?? "split",
          use_frame: (d.use_frame as boolean) ?? true,
          frame_style: (d.frame_style as string) ?? "olive-square",
          initials: (d.initials as string) ?? undefined,
          frame_names: (d.frame_names as string) ?? undefined,
          frame_location: (d.frame_location as string) ?? undefined,
          frameInitialsSize: (d.frameInitialsSize as number) ?? undefined,
          frameNamesSize: (d.frameNamesSize as number) ?? undefined,
          frameDateSize: (d.frameDateSize as number) ?? undefined,
          frameLocationSize: (d.frameLocationSize as number) ?? undefined,
          font_hero: (d.font_hero as string) ?? "cormorant",
          font_initials: (d.font_initials as string) ?? "cormorant",
          font_frame_names: (d.font_frame_names as string) ?? "cormorant",
          font_page_titles: (d.font_page_titles as string) ?? "cormorant",
          homeContent: hc,
        })
        setStyle(((d.style as string) || "ivoor") as Style)
        setFontHero((d.font_hero as string) || "cormorant")
        setFontInitials((d.font_initials as string) || "cormorant")
        setFontFrameNames((d.font_frame_names as string) || "cormorant")
        setFontPageTitles((d.font_page_titles as string) || "cormorant")
        if (hp) setHpSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...hp })
        if (typeof d.concept_naam === "string") setConceptNaam(d.concept_naam)
        setContent({
          ...extraContent,
          ...(hc ? { Home: hc as unknown as Record<string, unknown> } : {}),
        })
        setActive({
          Home: true, Programma: true, RSVP: true, Informatie: true,
          Cadeautips: true, OnsVerhaal: true, Ceremoniemeesters: true, Fotos: false,
        })
          const mail = (d.email as string) || email
          if (mail) setAuthEmail(mail)
          setLadenKlaar(true)
          return true
        } catch {
          return false
        }
      }

      // Leeg beginnen. Het aanmaakformulier is weg: wie hier zonder iets
      // binnenkomt krijgt een lege website met de standaardpagina's, en vult
      // namen, datum en locatie in bij Algemene info. Tot die tijd wacht het
      // voorbeeld. Dezelfde standaardwaarden als de overdracht uit de
      // kaartbouwer, uit lib/nieuw-concept.ts, zodat er één beginpunt is.
      function beginLeeg(email?: string | null) {
        try {
          // Wat je in het dashboard invulde staat in je browser onder de
          // sleutels van de kaartbouwer. Die nemen we hier over, want anders
          // zou je je namen en datum twee keer moeten typen.
          let namen = ""
          let datum = ""
          let locatie = ""
          try {
            const uitDashboard = JSON.parse(localStorage.getItem("sayingyes_kaart") ?? "{}") as Record<string, unknown>
            if (typeof uitDashboard.names === "string") namen = uitDashboard.names
            if (typeof uitDashboard.datum === "string") datum = uitDashboard.datum
            locatie = localStorage.getItem("sayingyes_bruiloft_locatie") ?? ""
          } catch {}

          // Zonder namen niet "Ons" invullen, zoals nieuwWebsiteConcept doet:
          // dan zou het voorbeeld doen alsof er iets ingevuld is.
          const basis = nieuwWebsiteConcept({ namen, datum, locatie, style: "ivoor" })
          const leeg = namen.trim()
            ? basis
            : { ...basis, naam: "", nav_title: "", frame_names: "", initials: "" }
          localStorage.setItem(LS_WEBSITE_CONCEPT, JSON.stringify(leeg))
          localStorage.setItem(
            LS_WEBSITE_INHOUD,
            JSON.stringify({ Programma: DEFAULT_PROGRAMMA, Informatie: DEFAULT_PRAKTISCH })
          )
        } catch {}
        laadConceptUitBrowser(email)
      }

      if (!user) {
        if (laadConceptUitBrowser()) return
        beginLeeg()
        return
      }

      // Logged in — check for a pending save left by the magic-link auth flow
      try {
        const pendingSave = localStorage.getItem("sayingyes_pending_save")
        const savedDraft = localStorage.getItem("sayingyes_draft")
        if (pendingSave && savedDraft) {
          localStorage.removeItem("sayingyes_pending_save")
          const d = JSON.parse(savedDraft) as Record<string, unknown>
          const savedContent = localStorage.getItem("sayingyes_content")
          const extraContent: ContentMap = savedContent ? JSON.parse(savedContent) : {}
          const hc = d.homeContent as HomeContent | undefined

          const res = await fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: d.type || "bruiloft",
              naam: d.naam,
              slug: d.slug,
              datum: d.datum || "",
              locatie: d.locatie || "",
              style: d.style || "ivoor",
              nav_title: d.nav_title,
              nav_layout: d.nav_layout || "split",
              use_frame: d.use_frame ?? true,
              frame_style: d.frame_style,
              initials: d.initials,
              frame_names: d.frame_names,
              frame_location: d.frame_location,
              frameInitialsSize: d.frameInitialsSize,
              frameNamesSize: d.frameNamesSize,
              frameDateSize: d.frameDateSize,
              frameLocationSize: d.frameLocationSize,
              font_hero: d.font_hero || "cormorant",
              font_initials: d.font_initials || "cormorant",
              font_frame_names: d.font_frame_names || "cormorant",
              font_page_titles: d.font_page_titles || "cormorant",
              homepage_settings: d.homepage_settings,
              pages: ["Home", "Programma", "RSVP", "Informatie", "Cadeautips", "OnsVerhaal", "Ceremoniemeesters"],
              content: { ...extraContent, ...(hc ? { Home: hc } : {}) },
            }),
          })
          if (res.ok) {
            const json = await res.json()
            localStorage.removeItem("sayingyes_draft")
            localStorage.removeItem("sayingyes_content")
            window.location.replace(`/bouwen?event_id=${json.id}`)
            return
          }
        }
      } catch {}

      // Komt dit net uit de kaartbouwer? Dan hoort dat concept voor te gaan op
      // wat er op de server staat. Anders belandt iemand die op Website drukt
      // in het aanmaakformulier, terwijl de knop juist bedoeld is om te laten
      // voelen dat je in dezelfde bouwer blijft. Dit ging alleen goed zolang je
      // niet was ingelogd, want alleen die tak keek naar de browseropslag.
      try {
        const overdracht = Number(localStorage.getItem(LS_NAAR_WEBSITE) ?? 0)
        const versGenoeg = overdracht > 0 && Date.now() - overdracht < NAAR_WEBSITE_GELDIG_MS
        const vanKaart = localStorage.getItem("sayingyes_draft")
        if (versGenoeg && vanKaart) {
          localStorage.removeItem(LS_NAAR_WEBSITE)
          if (laadConceptUitBrowser(user.email)) return
        }
      } catch {}

      // Normal logged-in flow: load most recent event from server
      fetch("/api/drafts").then(r => r.json()).then((events: Array<{ id: string }>) => {
        if (Array.isArray(events) && events.length > 0) {
          window.location.replace(`/bouwen?event_id=${events[0].id}`)
        } else {
          beginLeeg(user.email)
        }
      }).catch(() => beginLeeg(user.email))
    }).catch(() => {
      // Alleen als we niet eens konden nakijken of je ingelogd bent. Dan helpt
      // doorsturen niet; zeggen wat er is wel.
      setPublishError("We konden je account niet controleren. Ververs de pagina en probeer het opnieuw.")
    })
  }, [router])

  // Het voorbeeld past in de breedte die er is. Een ResizeObserver, omdat het
  // vlak er bij het laden nog niet is: eerst staat er "We zetten jullie
  // website klaar". Toen dit alleen bij het openen werd gemeten, bleef het
  // voorbeeld op de telefoon op volle grootte en viel het rechts van het
  // scherm af.
  const heeftDraft = !!draft
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    function measure() {
      if (!el) return
      const cw = viewport === "mobiel" ? 390 : 1024
      const rand = window.innerWidth < 768 ? 32 : 48
      setCanvasScale(Math.min(1, Math.max(0.4, (el.clientWidth - rand) / cw)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewport, heeftDraft])

  // Mark pending whenever the user makes a change; cleared after save.
  useEffect(() => { if (changeKey > 0 && ladenKlaar) setHasPendingChanges(true) }, [changeKey, ladenKlaar])

  // Auto-save: 2 seconds after the last user change, save to DB.
  // changeKey is incremented by every user-triggered state mutation.
  // changeKey === 0 means no user changes yet (only the initial server load happened).
  useEffect(() => {
    if (changeKey === 0 || !ladenKlaar || !draft || !savedEventId) return
    const timer = setTimeout(async () => {
      if (savingRef.current) return // a manual save is already in progress
      savingRef.current = true
      setSaving(true)
      setSaveError(null)
      try {
        await doSave()
        setHasPendingChanges(false)
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 3000)
      } catch (err) {
        console.error("[auto-save] fout:", err)
        setSaveError(err instanceof Error ? err.message : "Automatisch opslaan mislukt")
      } finally {
        setSaving(false)
        savingRef.current = false
      }
    }, 5000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeKey])


  function updateDraft(fields: Partial<Draft>) {
    setChangeKey(k => k + 1)
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, ...fields }
    })
  }

  function updateHpSettings(patch: Partial<HomepageSettings>) {
    setHpSettings(prev => {
      const next = { ...prev, ...patch }
      updateDraft({ homepageSettings: next })
      return next
    })
  }

  function updateContent(pageId: PageId, value: Record<string, unknown>) {
    setChangeKey(k => k + 1)
    setContent((prev) => ({ ...prev, [pageId]: value }))
  }

  function saveStyle(s: Style) {
    setStyle(s)
    updateDraft({ style: s })
  }

  function saveFontHero(id: string)        { setFontHero(id);        updateDraft({ font_hero: id }) }
  function saveFontInitials(id: string)    { setFontInitials(id);    updateDraft({ font_initials: id }) }
  function saveFontFrameNames(id: string)  { setFontFrameNames(id);  updateDraft({ font_frame_names: id }) }
  function saveFontPageTitles(id: string)  { setFontPageTitles(id);  updateDraft({ font_page_titles: id }) }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!supported.includes(file.type)) {
      setHeroImageError("Gebruik een JPEG, PNG of WebP afbeelding. HEIC (iPhone) werkt niet in de browser, zet de foto eerst om.")
      return
    }
    setHeroImageError(null)

    // Show blob preview immediately while upload runs in background
    const blobUrl = URL.createObjectURL(file)
    setHeroImageUrl(blobUrl)
    updateDraft({ heroOverlay: true })
    setHeroUploading(true)

    try {
      const url = await uploadToStorage(file, "hero-images")
      console.log("[hero] geüpload naar Storage:", url)
      URL.revokeObjectURL(blobUrl)
      setHeroImageUrl(url)
      setChangeKey(k => k + 1)
    } catch (err) {
      console.error("[hero] upload mislukt:", err)
      setHeroImageError("Upload mislukt. Controleer je verbinding en probeer het opnieuw.")
      URL.revokeObjectURL(blobUrl)
      setHeroImageUrl(null)
    } finally {
      setHeroUploading(false)
    }
  }

  async function handleStoryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!supported.includes(file.type)) {
      setStoryImageError("Gebruik een JPEG, PNG of WebP afbeelding.")
      return
    }
    setStoryImageError(null)
    const blobUrl = URL.createObjectURL(file)
    setStoryImageBlob(blobUrl)
    setStoryUploading(true)
    try {
      const url = await uploadToStorage(file, "hero-images")
      URL.revokeObjectURL(blobUrl)
      setStoryImageBlob(null)
      updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), image_url: url })
    } catch (err) {
      console.error("[story] upload mislukt:", err)
      setStoryImageError("Upload mislukt. Probeer het opnieuw.")
      URL.revokeObjectURL(blobUrl)
      setStoryImageBlob(null)
    } finally {
      setStoryUploading(false)
    }
  }

  async function handleFotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    )
    e.target.value = ""
    if (!files.length) return

    const currentUrls = (content.Fotos?.urls as string[] | undefined) ?? []
    const slots = MAX_FOTOS - currentUrls.length
    const toUpload = files.slice(0, slots)
    if (!toUpload.length) return

    setFotosUploadError(null)
    setFotosUploading(true)
    const accumulated = [...currentUrls]
    try {
      for (const file of toUpload) {
        const url = await uploadToStorage(file, "hero-images")
        accumulated.push(url)
        updateContent("Fotos", { ...(content.Fotos ?? {}), urls: [...accumulated] })
      }
    } catch {
      setFotosUploadError("Upload mislukt. Controleer je verbinding en probeer het opnieuw.")
    } finally {
      setFotosUploading(false)
    }
  }

  function deleteFotosImage(idx: number) {
    const urls = (content.Fotos?.urls as string[] | undefined) ?? []
    updateContent("Fotos", { ...(content.Fotos ?? {}), urls: urls.filter((_, i) => i !== idx) })
  }

  function toggle(id: PageId) {
    setChangeKey(k => k + 1)
    setActive((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (!next[previewPage]) {
        const fallback = PAGES.find((p) => next[p.id])
        if (fallback) setPreviewPage(fallback.id)
      }
      return next
    })
  }

  // De terugknop van de browser werd hier onderschept met een eigen venster.
  // Dat is weg: de bouwer bewaart nu zelf (op de server zodra er een bruiloft
  // is, anders in je browser) en waarschuwt alleen nog als er echt iets
  // verloren zou gaan. Zie de twee effecten hieronder.

  // Nog niet bewaard op de server? Dan gaat elke wijziging naar je browser,
  // zodat je na een ongelukje (tabblad dicht, laptop leeg) gewoon verder
  // kunt. Dezelfde sleutels als de overdracht vanuit de kaartbouwer, en
  // dezelfde die het laden hierboven terugleest.
  useEffect(() => {
    if (changeKey === 0 || !ladenKlaar || !draft || savedEventId) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("sayingyes_draft", JSON.stringify({
          ...draft,
          style,
          nav_layout: "stacked", // de enige indeling die de bouwer nog kent, zie navLayout verderop
          homepage_settings: hpSettings,
          homeContent: content.Home ?? draft.homeContent,
          concept_naam: conceptNaam,
        }))
        const { Home: _home, ...restContent } = content
        localStorage.setItem("sayingyes_content", JSON.stringify(restContent))
      } catch {}
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeKey])

  // Staat er iets dat nog niet op de server staat, dan vraagt de browser
  // bij het sluiten of je dat zeker weet. Alleen dan: een waarschuwing bij
  // elke keer weggaan leert mensen erop te klikken zonder te lezen.
  useEffect(() => {
    if (!hasPendingChanges || !savedEventId) return
    function waarschuw(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", waarschuw)
    return () => window.removeEventListener("beforeunload", waarschuw)
  }, [hasPendingChanges, savedEventId])

  // Van tabblad wisselen in de schil: eerst bewaren, dan pas gaan. Lukt het
  // bewaren niet, dan is het aan jou.
  async function voorVerlaten(): Promise<boolean> {
    if (!hasPendingChanges) return true
    if (!savedEventId) return true // staat in je browser, zie hierboven
    try {
      await doSave()
      setHasPendingChanges(false)
      return true
    } catch {
      return window.confirm("Bewaren lukte niet. Toch weggaan? Je laatste wijzigingen gaan dan verloren.")
    }
  }

  // ── Shared core: stuurt opgeslagen state op via /api/drafts ─────────────────
  // Alle foto-uploads zijn al gedaan in de upload-handlers (immediate upload).
  // doSave() hoeft alleen de huidige state te lezen en naar de API te sturen.
  async function doSave(): Promise<{ id: string; slug: string }> {
    if (!draft) throw new Error("Geen draft beschikbaar")

    const activePages = PAGES.filter((p) => active[p.id]).map((p) => p.id)

    // Hero: skip blob-URLs (upload still in progress or failed)
    const heroUrl: string | null =
      (heroImageUrl && !heroImageUrl.startsWith("blob:") ? heroImageUrl : null)

    const mergedContent: ContentMap = {
      ...content,
      Home: {
        ...(content.Home ?? {}),
        title: homeContent.title,
        body: homeContent.body,
        align: homeContent.align,
        titleSize: homeContent.titleSize,
        bodySize: homeContent.bodySize,
      },
      Programma: { ...(content.Programma ?? {}) },
      OnsVerhaal: {
        ...(content.OnsVerhaal ?? {}),
        title: (content.OnsVerhaal?.title as string) ?? "Ons Verhaal",
        show_overlay: storyOverlay,
      },
    }

    const payload = {
      ...draft,
      style,
      font_hero: fontHero,
      font_initials: fontInitials,
      font_frame_names: fontFrameNames,
      font_page_titles: fontPageTitles,
      hero_image_url: heroUrl,
      heroOverlay: draft?.heroOverlay ?? true,
      nav_layout: navLayout,
      pages: activePages,
      content: mergedContent,
      concept_naam: conceptNaam.trim() || null,
      event_id: savedEventId ?? undefined,
      plan,
      homepage_settings: hpSettings,
      pw_enabled: pwEnabled,
      pw_type: pwEnabled ? pwType : null,
      pw_value: pwEnabled && pwType === 'password' ? pwValue : null,
      pw_question: pwEnabled && pwType === 'secret_question' ? pwQuestion : null,
      pw_answer: pwEnabled && pwType === 'secret_question' ? pwAnswer : null,
    }
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Opslaan mislukt")

    localStorage.setItem("sayingyes_saved_event_id", json.id)
    localStorage.setItem("sayingyes_is_published", isPublished ? "1" : "0")
    setSavedEventId(json.id)
    // Keep event_id in URL so this tab and bookmarked links always load from server
    const url = new URL(window.location.href)
    url.searchParams.set("event_id", json.id)
    window.history.replaceState({}, "", url.toString())
    return json as { id: string; slug: string }
  }

  async function performSave() {
    if (!draft) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      await doSave()
      setHasPendingChanges(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
    } catch (err) {
      console.error("[save] fout:", err)
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt")
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  async function handlePublish() {
    if (!draft) return
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { setShowAuthModal(true); return }
    setPublishing(true)
    setPublishError(null)
    try {
      // Sla altijd eerst de laatste wijzigingen op via dezelfde flow als "Opslaan"
      const { id: eventId } = await doSave()
      // De trouwwebsite is het pakket Compleet. Publiceren vraagt dus altijd dat
      // pakket, ook als iemand bij een Save the Date begon: wat je afneemt
      // volgt uit wat je activeert, niet uit waar je begon. De kassa rekent
      // zelf het verschil als er al iets betaald is.
      const publicatiePlan = hoogstePlan(plan, "compleet")
      console.log("[publish] opgeslagen, navigeer naar betalen met event_id:", eventId, "pakket:", publicatiePlan)
      router.push(`/betalen?event_id=${eventId}&plan=${publicatiePlan}`)
    } catch (err) {
      console.error("[publish] fout:", err)
      setPublishError(err instanceof Error ? err.message : "Er ging iets mis")
      setPublishing(false)
    }
  }

  async function handleSave() {
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) {
      setShowAuthModal(true)
      return
    }
    await performSave()
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)

    // Persist current builder state to localStorage so it survives the magic-link redirect
    if (draft && !savedEventId) {
      try {
        const currentDraft = {
          ...draft,
          nav_layout: navLayout,
          homepage_settings: hpSettings,
          homeContent: draft.homeContent,
        }
        localStorage.setItem("sayingyes_draft", JSON.stringify(currentDraft))
        const { Home: _home, ...restContent } = content
        localStorage.setItem("sayingyes_content", JSON.stringify(restContent))
      } catch {}
    }

    localStorage.setItem("sayingyes_pending_save", "1")
    const { error } = await createClient().auth.signInWithOtp({
      email: authEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/bouwen`,
      },
    })
    setAuthLoading(false)
    if (error) {
      localStorage.removeItem("sayingyes_pending_save")
      setSaveError(error.message)
      setShowAuthModal(false)
    } else {
      setAuthSent(true)
    }
  }

  const anyUploading = heroUploading || programUploadingIds.size > 0 || storyUploading

  const { family: fhF, weight: fhW } = getTitleFont(fontHero)
  const { family: fiF, weight: fiW } = getTitleFont(fontInitials)
  const { family: ffF, weight: ffW } = getTitleFont(fontFrameNames)
  const { family: fpF, weight: fpW } = getTitleFont(fontPageTitles)
  const sc = {
    ...STYLE_CONFIG[style],
    fontFamily: fontPageTitles ? fpF : STYLE_CONFIG[style].fontFamily,
    fontHero: fhF,        fontHeroWeight: fhW,
    fontInitials: fiF,    fontInitialsWeight: fiW,
    fontFrameNames: ffF,  fontFrameNamesWeight: ffW,
    fontPageTitles: fpF,  fontPageTitlesWeight: fpW,
  }
  const canvasWidth = viewport === "mobiel" ? 390 : 1024
  // Met een paneel open op de telefoon wat kleiner, zodat je boven het paneel
  // nog een flink stuk van de pagina ziet.
  const voorbeeldSchaal = canvasScale * zoomMultiplier * (blad && !bladKlein ? 0.6 : 1)

  const activePagesOrdered = PAGES.filter((p) => active[p.id])
  const eventName = draft?.naam || "Jullie bruiloft"
  const safeEventName = eventName.replace(/\n/g, " ")
  const eventDate = draft?.datum ? formatDate(draft.datum) : "Datum nog niet ingesteld"
  const eventLocatie = draft?.locatie || ""
  const typeLabel = draft?.type ? TYPE_LABEL[draft.type] : "Evenement"
  const heroOverlay = draft?.heroOverlay ?? true
  const storyOverlay = draft?.storyOverlay ?? true
  const homeContent: HomeContent = draft?.homeContent ?? { title: "", body: "", align: "center" }
  const navLayout = 'stacked' as const
  const navTitle = draft?.nav_title ?? draft?.frame_names ?? draft?.naam ?? ""
  const safeNavTitle = navTitle.replace(/\n/g, " ")
  const slugPreview = draft?.slug || "jouwbruiloft"

  function sanitizeSlugInput(value: string): string {
    return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  async function handleSlugSave() {
    const newSlug = sanitizeSlugInput(slugValue)
    if (!newSlug || newSlug.length < 3) { setSlugError("Minimaal 3 tekens vereist."); return }
    if (!savedEventId) { setSlugError("Sla de site eerst op."); return }
    setSlugSaving(true); setSlugError(null)
    try {
      const res  = await fetch("/api/event/update-slug", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: savedEventId, newSlug }),
      })
      const json = await res.json()
      if (!res.ok) { setSlugError(json.error ?? "Er ging iets mis.") }
      else {
        setDraft((d) => d ? { ...d, slug: newSlug } : d)
        setSlugEditOpen(false)
      }
    } catch { setSlugError("Netwerkfout. Probeer opnieuw.") }
    finally { setSlugSaving(false) }
  }

  const mastersForPreview = ((content.Ceremoniemeesters?.masters as MasterPerson[] | undefined) ?? [])
    .filter(m => m.naam || m.foto_url)
    .map(m => ({ id: m.id ?? "", naam: m.naam ?? "", telefoon: m.telefoon ?? "", email: m.email ?? "", foto_url: m.foto_url ?? null }))

  const programmaItems = (content.Programma?.items as ProgrammaItem[]) || []
  const programmaItemsSorted = programmaItems.slice().sort((a, b) => a.time.localeCompare(b.time))
  const programmaItemsForPreview = programmaItemsSorted
  const rawLayout = (content.Programma?.layout as string) || "centered"
  const programLayout = (rawLayout === "bento" ? "centered" : rawLayout) as "centered" | "timeline"
  const praktischTiles = content.Informatie?.items as PraktischTile[] | undefined
  const wishlistItems = content.Cadeautips?.items as WishlistItem[] | undefined
  const fotosUrls  = (content.Fotos?.urls as string[] | undefined) ?? []
  // Pagina's die aan staan maar nog niets hebben om te laten zien. Informatie
  // en Cadeautips beginnen altijd met voorbeelden, Home en RSVP vullen zich
  // zelf; die tellen dus niet mee.
  const paginaLeeg: Partial<Record<PageId, boolean>> = {
    OnsVerhaal: !((content.OnsVerhaal?.text as string | undefined) ?? "").trim(),
    Programma: programmaItems.length === 0,
    Ceremoniemeesters: mastersForPreview.length === 0 && !((content.Ceremoniemeesters?.text as string | undefined) ?? "").trim(),
    Fotos: fotosUrls.length === 0,
  }
  const legePaginas = PAGES.filter((pg) => active[pg.id] && paginaLeeg[pg.id])
  const rsvpGuestTypes        = (content.RSVP?.guestTypes as string[] | undefined) ?? ["daggast", "avondgast"]
  const rsvpShowSong          = (content.RSVP?.showSongRequest as boolean) ?? false
  const rsvpShowOvernachting  = (content.RSVP?.showOvernachting as boolean) ?? false
  const rsvpCustomQuestion    = (content.RSVP?.customQuestion as string) ?? ""
  const rsvpCustomQuestion2   = (content.RSVP?.customQuestion2 as string) ?? ""
  const rsvpDeadline          = (content.RSVP?.deadline as string | null) ?? null
  const RSVP_GUEST_LABELS: Record<string, string> = { daggast: "Daggast", avondgast: "Avondgast", receptiegast: "Receptiegast" }

  const isSinglePagePreview = hpSettings.pageMode === 'single'

  // Onderaan het paneel: door naar de volgende. Binnen Pagina's loop je eerst
  // alle pagina's langs die aan staan, dan pas door naar Webadres.
  const volgendeBlad = blad ? BLAD_VOLGORDE[BLAD_VOLGORDE.indexOf(blad) + 1] : undefined
  const volgendePagina = blad === "paginas"
    ? activePagesOrdered[(activeSubPage ? activePagesOrdered.findIndex((pg) => pg.id === activeSubPage) : -1) + 1]
    : undefined
  function gaNaarPagina(id: PageId) {
    setPreviewPage(id)
    setActiveSubPage(id)
  }
  const activePageIds = new Set<string>(activePagesOrdered.map(p => p.id))
  const showSection = (id: string) => isSinglePagePreview ? activePageIds.has(id) : previewPage === id


  // Vangnet: blijft het laden om wat voor reden ook hangen, dan beginnen we
  // na een paar tellen gewoon leeg. Beter een lege bouwer dan een hartje dat
  // eeuwig klopt.
  useEffect(() => {
    if (draft || laadFout) return
    const t = setTimeout(() => {
      if (!draft) setLaadFout("Het laden duurde te lang. Ververs de pagina, dan pakken we het opnieuw op.")
    }, 12000)
    return () => clearTimeout(t)
  }, [draft, laadFout])

  // Zolang we je gegevens ophalen is er nog geen voorbeeld. Dat duurt een paar
  // tellen en zonder iets in beeld voelt het als een lege bouwer.
  if (!draft) {
    return (
      <BouwerSchil actief="website" eventId={savedEventId}>
        <div className="flex-1 flex items-center justify-center p-8">
          {laadFout ? (
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <p className="m-0 text-lg" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: KLEUR.inkt }}>
                Dat ging even mis
              </p>
              <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>{laadFout}</p>
              <Knop soort="primair" onClick={() => window.location.reload()}>
                Opnieuw proberen
              </Knop>
            </div>
          ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <span
              aria-hidden="true"
              className="text-3xl"
              style={{ color: KLEUR.goud, animation: "sy-klop 1.1s ease-in-out infinite" }}
            >
              {"♥"}
            </span>
            <p className="m-0 text-lg" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: KLEUR.inkt }}>
              We zetten jullie website klaar
            </p>
            <p className="m-0 text-sm max-w-xs" style={{ color: KLEUR.tekst }}>
              Een paar tellen, dan staat je eerste pagina er met jullie namen en datum erin.
            </p>
          </div>
          )}
        </div>
        <style>{`@keyframes sy-klop { 0%, 100% { transform: scale(1); opacity: 0.85 } 50% { transform: scale(1.18); opacity: 1 } }`}</style>
      </BouwerSchil>
    )
  }

  const publiceerPrijs = formatEur((betaaldPlan && upgradePrice(betaaldPlan, "compleet")) || PLANS.compleet.price)
  const publiceerKnop = isPublished ? (
    <Knop soort="actie" href={eventSiteUrl(slugPreview)} nieuwTabblad className="flex-1 md:flex-none">
      Bekijk live site
    </Knop>
  ) : (
    <Knop
      soort="actie"
      onClick={handlePublish}
      disabled={publishing || anyUploading}
      bezig={publishing}
      bezigTekst="Naar de kassa"
      className="flex-1 md:flex-none"
    >
      Publiceren voor&nbsp;{publiceerPrijs}
    </Knop>
  )

  // De check onder Bekijken. Wat nog open staat is aanklikbaar en brengt je
  // naar de plek waar het hoort. Publiceren telt apart: dat is de laatste stap.
  const controles: { label: string; klaar: boolean; actie?: string; doe?: () => void }[] = [
    {
      label: "Jullie namen",
      klaar: !!(draft?.frame_names?.trim() || draft?.naam?.trim()),
      actie: "Invullen",
      doe: () => handlePreviewFieldClick("namen"),
    },
    { label: "Trouwdatum", klaar: !!draft?.datum, actie: "Invullen", doe: () => handlePreviewFieldClick("datum") },
    ...(legePaginas.length
      ? legePaginas.map((pg) => ({
          label: `${pg.label} is nog leeg`,
          klaar: false,
          actie: "Invullen",
          doe: () => { toonPaginas(); gaNaarPagina(pg.id) },
        }))
      : [{ label: "Elke pagina heeft inhoud", klaar: true }]),
    {
      label: draft?.slug ? `Webadres: ${draft.slug}.sayingyes.nl` : "Webadres",
      klaar: !!draft?.slug,
      actie: "Kiezen",
      doe: () => gaNaarBlad("adres"),
    },
    { label: "Bewaard", klaar: !!savedEventId && !hasPendingChanges && !saving, actie: "Bewaren", doe: () => void handleSave() },
  ]
  const allesKlaar = controles.every((c) => c.klaar)
  // Het stipje: waar nog iets te doen is
  const stip: Partial<Record<Blad, boolean>> = {
    paginas: legePaginas.length > 0,
    adres: !draft?.slug,
  }

  return (
    <BouwerSchil
      actief="website"
      eventId={savedEventId}
      voorVerlaten={voorVerlaten}
      /* Altijd de hoogte van het venster: op de laptop scrollen zijbalk en
         voorbeeld elk apart, op de telefoon scrolt alleen het voorbeeld en
         schuiven de panelen eroverheen. */
      className="h-[100dvh] overflow-hidden"
      /* Op de telefoon onder de kop: de naam, bewaren en publiceren, net als
         in de kaartbouwer. Fouten daaronder, zodat de kop zelf niet van
         hoogte verspringt terwijl je aan het werk bent. */
      onderKop={
        <>
          <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b flex-shrink-0" style={{ backgroundColor: "#fff", borderColor: `${KLEUR.goudLicht}80` }}>
            <input
              value={conceptNaam}
              onChange={(e) => { setConceptNaam(e.target.value); setChangeKey((k) => k + 1) }}
              placeholder="Onze trouwwebsite"
              maxLength={60}
              aria-label="Naam van deze website"
              className="flex-1 min-w-0 rounded-xl border bg-white px-3 py-2 text-sm font-semibold placeholder-gray-400 focus:outline-none"
              style={{ color: KLEUR.inkt, borderColor: KLEUR.goudLicht }}
            />
            <button
              type="button"
              title={justSaved ? "Opgeslagen" : "Bewaren"}
              aria-label={justSaved ? "Opgeslagen" : "Bewaren"}
              onClick={handleSave}
              disabled={saving || anyUploading}
              className="w-9 h-9 flex-shrink-0 inline-flex items-center justify-center rounded-xl disabled:opacity-40"
              style={{ backgroundColor: justSaved ? KLEUR.groenVlak : "#fff", color: justSaved ? KLEUR.groenTekst : KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
            >
              {justSaved ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
              )}
            </button>
            {isPublished ? (
              <a
                href={eventSiteUrl(slugPreview)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold px-3.5 py-2 rounded-full whitespace-nowrap"
                style={{ backgroundColor: KLEUR.groen, color: "#fff", textDecoration: "none" }}
              >
                Bekijk live
              </a>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || anyUploading}
                className="text-[13px] font-semibold px-3.5 py-2 rounded-full whitespace-nowrap disabled:opacity-60"
                style={{ backgroundColor: KLEUR.groen, color: "#fff", border: 0, cursor: "pointer" }}
              >
                {publishing ? "Even..." : "Publiceren"}
              </button>
            )}
          </div>
          {(publishError || saveError) ? <Melding soort="fout">{publishError || saveError}</Melding> : null}
        </>
      }
      onderbalk={
        <nav className="flex justify-around px-1 pt-1.5 pb-2" aria-label="Onderdelen van de website">
          {BLAD_VOLGORDE.map((b) => {
            const aan = blad === b
            return (
              <button
                key={b}
                type="button"
                onClick={() => openBlad(aan ? null : b)}
                aria-pressed={aan}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold min-w-[68px]"
                style={{ color: aan ? KLEUR.goud : KLEUR.zacht, backgroundColor: aan ? KLEUR.goudVlak : "transparent", border: 0, cursor: "pointer" }}
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
      acties={
        <>
          {/* Opslaan. De vier standen blijven, in dezelfde vorm als de knoppen
              in de kaartbouwer. */}
          {anyUploading || saving ? (
            <Knop soort="rustig" klein bezig bezigTekst={anyUploading ? "Uploaden" : "Opslaan"} className="flex-1 md:flex-none">
              Opslaan
            </Knop>
          ) : saveError ? (
            <Knop soort="gevaar" klein onClick={handleSave} className="flex-1 md:flex-none">
              Opnieuw proberen
            </Knop>
          ) : !justSaved ? (
            // Gewoon de bewaarknop, net als in de kaartbouwer. Het groene
            // "Opgeslagen" is een bevestiging vlak na het bewaren, geen
            // toestand: bij binnenkomen stond hij er meteen, en dat wekte de
            // indruk dat er al iets was gebeurd (Michiel, 23 september 2026).
            <Knop soort="rustig" klein onClick={handleSave} className="flex-1 md:flex-none">
              {savedEventId ? "Opslaan" : "Bewaar ontwerp"}
            </Knop>
          ) : (
            <span
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl flex-1 md:flex-none"
              style={{ backgroundColor: KLEUR.groenVlak, color: KLEUR.groenTekst, border: `1px solid ${KLEUR.groen}33` }}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Opgeslagen
            </span>
          )}

          {publiceerKnop}
        </>
      }
    >

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* ── Sidebar ──
            Op de telefoon het paneel dat over het voorbeeld schuift. */}
        <aside
          ref={bladRef}
          className={`w-full md:w-80 md:flex-shrink-0 bg-white border-r border-gray-100 flex flex-col md:overflow-y-auto ${
            blad
              ? `max-md:fixed max-md:inset-x-0 max-md:bottom-[64px] max-md:z-40 max-md:rounded-t-2xl max-md:border-t max-md:shadow-[0_-16px_40px_-16px_rgba(26,18,4,0.35)] ${
                  bladKlein ? "max-md:max-h-[56px] max-md:overflow-hidden" : "max-md:max-h-[50vh] max-md:overflow-y-auto"
                }`
              : "max-md:hidden"
          }`}
          style={sleep !== 0 ? { transform: `translateY(${sleep}px)`, transition: "none" } : { transition: "transform 180ms ease, max-height 200ms ease" }}
        >
          {/* De kop van het paneel, alleen op de telefoon. In een pagina een
              pijltje terug naar de lijst. */}
          {blad && (
            <div
              className="md:hidden sticky top-0 z-10 bg-white flex items-center justify-between gap-2 px-5 pt-2 pb-2 border-b border-gray-100"
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
                const begin = sleepStart.current
                sleepStart.current = null
                const dy = begin === null ? 0 : e.changedTouches[0].clientY - begin
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
              <span aria-hidden className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full" style={{ backgroundColor: KLEUR.goudLicht }} />
              {blad === "paginas" && activeSubPage ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setBladKlein(false); setActiveSubPage(null) }}
                  className="mt-2 flex items-center gap-1 text-sm font-semibold min-w-0"
                  style={{ color: KLEUR.inkt, background: "none", border: 0, padding: 0, cursor: "pointer" }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  <span style={{ color: KLEUR.zacht, fontWeight: 500 }}>Pagina&apos;s</span>
                  <span className="truncate">/ {PAGES.find((pg) => pg.id === activeSubPage)?.label}</span>
                </button>
              ) : (
                <span className="text-sm font-semibold mt-2" style={{ color: KLEUR.inkt }}>{BLAD_TITEL[blad]}</span>
              )}
              <button
                type="button"
                onClick={() => openBlad(null)}
                aria-label="Sluiten"
                className="mt-2 w-8 h-8 flex-shrink-0 inline-flex items-center justify-center rounded-full"
                style={{ backgroundColor: KLEUR.goudVlak, color: KLEUR.inkt, border: 0, cursor: "pointer" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* Onderaan elk paneel: door naar de volgende, zodat je er vanzelf
              doorheen loopt. */}
          {blad && (
            <div className="md:hidden order-[100] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  if (volgendePagina) gaNaarPagina(volgendePagina.id)
                  else if (volgendeBlad) openBlad(volgendeBlad)
                  else { openBlad(null); void handleSave() }
                }}
                className="w-full text-sm font-semibold px-4 py-3 rounded-xl"
                style={{ backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: 0, cursor: "pointer" }}
              >
                {volgendePagina
                  ? activeSubPage ? `Volgende pagina: ${volgendePagina.label} →` : `Begin bij ${volgendePagina.label} →`
                  : volgendeBlad ? `Volgende: ${BLAD_TITEL[volgendeBlad]} →` : "Klaar, bewaar mijn website"}
              </button>
            </div>
          )}

          {/* ── BEKIJKEN ── */}
          <div className={`${sectieKlassen('bekijken')} border-b border-gray-100`}>
            <div className="max-md:hidden">
              <SectieKop
                titel="Bekijken"
                open={activeSection === 'bekijken'}
                onToggle={() => setActiveSection(prev => prev === 'bekijken' ? null : 'bekijken')}
              />
            </div>
            {activeSection === 'bekijken' && (
              <div className="px-5 pt-4 md:pt-0 pb-5 flex flex-col gap-3">
                {/* Klaar om te publiceren? Wat nog ontbreekt is aanklikbaar,
                    net als in de kaartbouwer. */}
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ backgroundColor: KLEUR.goudVlak, border: `1px solid ${KLEUR.goudLicht}` }}>
                  <span className="text-xs font-semibold mb-1" style={{ color: KLEUR.inkt }}>
                    {allesKlaar ? (isPublished ? "Alles staat live" : "Klaar om te publiceren") : "Nog even nalopen"}
                  </span>
                  {controles.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={c.klaar ? undefined : c.doe}
                      className="flex items-center gap-2 text-left text-[12px] py-1"
                      style={{ background: "none", border: 0, padding: 0, cursor: c.klaar ? "default" : "pointer", color: c.klaar ? KLEUR.tekst : KLEUR.inkt }}
                    >
                      <span
                        aria-hidden
                        className="w-4 h-4 flex-shrink-0 rounded-full inline-flex items-center justify-center text-[10px] font-bold"
                        style={c.klaar ? { backgroundColor: KLEUR.groen, color: "#fff" } : { border: "1.5px solid #D97706" }}
                      >
                        {c.klaar ? "✓" : ""}
                      </span>
                      <span className="flex-1 min-w-0 truncate">{c.label}</span>
                      {!c.klaar && c.actie && <span className="font-semibold flex-shrink-0" style={{ color: KLEUR.goud }}>{c.actie} {"›"}</span>}
                    </button>
                  ))}
                </div>
                <p className="m-0 text-[13px] leading-relaxed" style={{ color: KLEUR.tekst }}>
                  {isPublished ? (
                    <>Jullie website staat live op <b style={{ color: KLEUR.inkt }}>{slugPreview}.sayingyes.nl</b>. Wat je bewaart zien je gasten.</>
                  ) : (
                    <>Nog niet gepubliceerd. Ontwerpen is gratis; pas als je publiceert gaat je website live op <b style={{ color: KLEUR.inkt }}>{slugPreview}.sayingyes.nl</b>.</>
                  )}
                </p>
                <div className="flex flex-col gap-2">
                  {publiceerKnop}
                  <Knop soort="rustig" onClick={handleSave} disabled={saving || anyUploading} bezig={saving} bezigTekst="Opslaan">
                    {justSaved ? "Opgeslagen" : "Opslaan"}
                  </Knop>
                </div>
              </div>
            )}
          </div>

          {/* ── De naam van dit ontwerp, en bewaren ──
              Bovenaan de zijbalk, op dezelfde plek en in dezelfde vorm als in
              de kaartbouwer. Alleen voor jullie: je gasten zien de naam
              nergens. Michiels wens van 23 september 2026; eerst stond dit
              als balk over de volle breedte onder de kop. */}
          <div className="max-md:hidden px-4 py-3 border-b border-gray-100 flex items-center gap-1.5" style={{ backgroundColor: "#FBF5E8" }}>
            <input
              value={conceptNaam}
              onChange={(e) => { setConceptNaam(e.target.value); setChangeKey((k) => k + 1) }}
              placeholder="Onze trouwwebsite"
              maxLength={60}
              aria-label="Naam van deze website"
              title="De naam van dit ontwerp, alleen voor jullie. Zo heet je website in je dashboard."
              className="flex-1 min-w-0 rounded-xl border bg-white px-3 py-2 text-sm font-semibold placeholder-gray-400 focus:outline-none"
              style={{ color: KLEUR.inkt, borderColor: KLEUR.goudLicht }}
            />
            <button
              type="button"
              title="Bewaren"
              aria-label="Bewaren"
              onClick={handleSave}
              disabled={saving || anyUploading}
              className="w-9 h-9 flex-shrink-0 inline-flex items-center justify-center rounded-xl disabled:opacity-40"
              style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <path d="M17 21v-8H7v8M7 3v5h8" />
              </svg>
            </button>
          </div>

          {/* ── 3. URL & BEVEILIGING (alleen bij een pakket met publieke site) ── */}
          <div className={`${sectieKlassen('url')} border-b border-gray-100`}>
            <div className="max-md:hidden">
              <SectieKop
                titel="Webadres"
                open={activeSection === 'url'}
                onToggle={() => setActiveSection(prev => prev === 'url' ? null : 'url')}
              />
            </div>
            {activeSection === 'url' && (
              <div className="flex flex-col">

                {/* ── Jouw URL ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenUrlSection(prev => prev === 'url' ? null : 'url')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${urlOpen('url') ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Jouw URL</span>
                  </button>
                  {urlOpen('url') && (
                    <div className="px-5 pb-4">
                      {!slugEditOpen ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-gray-500 font-mono truncate">{slugPreview}.sayingyes.nl</p>
                          {savedEventId && (
                            <button
                              onClick={() => { setSlugValue(slugPreview); setSlugError(null); setSlugEditOpen(true) }}
                              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <input
                            autoFocus
                            value={slugValue}
                            onChange={(e) => { setSlugValue(sanitizeSlugInput(e.target.value)); setSlugError(null) }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSlugSave(); if (e.key === "Escape") setSlugEditOpen(false) }}
                            className="w-full text-xs rounded-lg px-2 py-1.5 outline-none font-mono"
                            style={{ border: `1px solid ${slugError ? "#dc2626" : "#d1d5db"}`, color: "#111827" }}
                            placeholder={slugPreview}
                            maxLength={60}
                          />
                          {slugError && <p className="text-[10px] text-red-500">{slugError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={handleSlugSave}
                              disabled={slugSaving}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                              style={{ backgroundColor: slugSaving ? "#d1d5db" : "#1A1A1A", color: "#fff" }}
                            >
                              {slugSaving ? "…" : "Opslaan"}
                            </button>
                            <button
                              onClick={() => setSlugEditOpen(false)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Beveiliging ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenUrlSection(prev => prev === 'beveiliging' ? null : 'beveiliging')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${urlOpen('beveiliging') ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Beveiliging</span>
                  </button>
                  {urlOpen('beveiliging') && (
                    <div className="px-5 pb-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Website afschermen</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Gasten moeten een code of antwoord invoeren</p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={pwEnabled}
                          onClick={() => { setPwEnabled(v => !v); setChangeKey(k => k + 1) }}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer focus:outline-none ${pwEnabled ? "bg-emerald-500" : "bg-gray-200"}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${pwEnabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {pwEnabled && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Type beveiliging</p>
                            <div className="flex rounded-xl overflow-hidden border border-[var(--goud-licht)]">
                              <button
                                onClick={() => { setPwType('password'); setChangeKey(k => k + 1) }}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${pwType === 'password' ? 'bg-[#C5A059] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                              >
                                Wachtwoord
                              </button>
                              <button
                                onClick={() => { setPwType('secret_question'); setChangeKey(k => k + 1) }}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${pwType === 'secret_question' ? 'bg-[#C5A059] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                              >
                                Geheime vraag
                              </button>
                            </div>
                          </div>

                          {pwType === 'password' && (
                            <label className="flex flex-col gap-1.5">
                              <span className="text-xs font-semibold text-gray-600">Wachtwoord voor gasten</span>
                              <input
                                type="text"
                                value={pwValue}
                                onChange={(e) => setPwValue(e.target.value)}
                                onBlur={() => setChangeKey(k => k + 1)}
                                placeholder="bijv. JansenBakker2025"
                                className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                              />
                              <p className="text-[11px] text-gray-400">Gasten moeten dit exact invoeren (hoofdlettergevoelig).</p>
                            </label>
                          )}

                          {pwType === 'secret_question' && (
                            <>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Stel je vraag</span>
                                <input
                                  type="text"
                                  value={pwQuestion}
                                  onChange={(e) => setPwQuestion(e.target.value)}
                                  onBlur={() => setChangeKey(k => k + 1)}
                                  placeholder="bijv. Wat zijn onze achternamen?"
                                  className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                />
                              </label>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Het juiste antwoord</span>
                                <input
                                  type="text"
                                  value={pwAnswer}
                                  onChange={(e) => setPwAnswer(e.target.value)}
                                  onBlur={() => setChangeKey(k => k + 1)}
                                  placeholder="bijv. Jansen en Bakker"
                                  className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                />
                                <p className="text-[11px] text-gray-400">Variaties zoals &ldquo;Jansen & Bakker&rdquo; worden ook geaccepteerd (~90% gelijkenis).</p>
                              </label>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
          {/* ── 1. ALGEMEEN ── */}
          <div className={`${sectieKlassen('algemeen')} border-b border-gray-100`}>
            <div className="max-md:hidden">
              <SectieKop
                titel="Uiterlijk"
                open={activeSection === 'algemeen'}
                onToggle={() => setActiveSection(prev => prev === 'algemeen' ? null : 'algemeen')}
              />
            </div>
            {activeSection === 'algemeen' && (
              <div className="flex flex-col">

                {/* ── Stijl ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenAlgSection(prev => prev === 'stijl' ? null : 'stijl')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${algOpen('stijl') ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Stijl</span>
                  </button>
                  {algOpen('stijl') && (
                    <div className="px-5 pb-4 flex flex-col gap-2">
                      {/* Dezelfde rondjes en namen als in de kaartbouwer
                          (Michiel, 25 september 2026) */}
                      <div className="grid grid-cols-5 gap-2">
                        {STYLE_VOLGORDE.map((s) => {
                          const cfg = STYLE_CONFIG[s]
                          const actief = style === s
                          return (
                            <button
                              key={s}
                              onClick={() => saveStyle(s)}
                              title={STYLE_NAAM[s]}
                              className="flex flex-col items-center gap-1.5"
                              style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
                            >
                              <span
                                className="w-10 h-10 rounded-full"
                                style={{
                                  background: `linear-gradient(135deg, ${cfg.bodyBg} 50%, ${cfg.accent} 50%)`,
                                  boxShadow: actief ? "0 0 0 2px #fff, 0 0 0 4px #C5A059" : "0 0 0 1px rgba(0,0,0,0.08)",
                                }}
                              />
                              <span className="text-[10px]" style={{ color: actief ? "#1A1A1A" : "#5C5248", fontWeight: actief ? 700 : 500 }}>{STYLE_NAAM[s]}</span>
                            </button>
                          )
                        })}
                      </div>

                    </div>
                  )}
                </div>

                {/* ── Lay-out ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenAlgSection(prev => prev === 'layout' ? null : 'layout')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${algOpen('layout') ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Lay-out</span>
                  </button>
                  {algOpen('layout') && (
                    <div className="px-5 pb-5 flex flex-col gap-5">

                      {/* Paginaweergave */}
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-gray-700">Paginaweergave</p>
                        <p className="text-[11px] text-gray-400 leading-snug">Aparte pagina's zijn bereikbaar via het menu. Bij één pagina scrollt de bezoeker door alle onderdelen.</p>
                        <div className="flex rounded-xl border border-[var(--goud-licht)] overflow-hidden mt-0.5">
                          {([
                            { value: 'multi', label: "Aparte pagina's" },
                            { value: 'single', label: 'Één pagina' },
                          ] as const).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateHpSettings({ pageMode: opt.value })}
                              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                                hpSettings.pageMode === opt.value
                                  ? 'bg-[#C5A059] text-white'
                                  : 'bg-white text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>


                    </div>
                  )}
                </div>

                {/* ── Basislettertype ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenAlgSection(prev => prev === 'lettertype' ? null : 'lettertype')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${algOpen('lettertype') ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Basislettertype</span>
                  </button>
                  {algOpen('lettertype') && (
                    <div className="px-5 pb-4 flex flex-col gap-2">
                      <FontSelect value={fontPageTitles} onChange={saveFontPageTitles} />
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Dit lettertype geldt voor alle pagina's, behalve voor de homepage. De tekstvelden op de homepage kun je apart aanpassen bij de instellingen van de pagina 'Home'.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ── 2. PAGINA'S ── */}
          <div className={`${sectieKlassen('paginas')} border-b border-gray-100`}>
            <div className="max-md:hidden">
              <SectieKop
                titel="Pagina's"
                open={activeSection === 'paginas'}
                onToggle={() => setActiveSection(prev => prev === 'paginas' ? null : 'paginas')}
              />
            </div>
            {activeSection === 'paginas' && (
              <div>
                {PAGES.map((page) => {
                  const isOn = active[page.id]
                  const isExpanded = activeSubPage === page.id && isOn
                  return (
                    <div key={page.id} className={`border-t border-gray-100 ${blad === "paginas" && activeSubPage && activeSubPage !== page.id ? "max-md:hidden" : ""}`}>
                      {/* Page row. In een paneel op de telefoon staat de naam
                          van de pagina in de kop, met een pijltje terug. */}
                      <div className={`flex items-center justify-between px-4 py-2.5 ${blad === "paginas" && activeSubPage ? "max-md:hidden" : ""}`}>
                        <button
                          onClick={() => {
                            if (!isOn) return
                            setPreviewPage(page.id)
                            setActiveSubPage(prev => prev === page.id ? null : page.id)
                          }}
                          className={`flex items-center gap-2 flex-1 min-w-0 text-left ${isOn ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className={`transition-transform duration-200 flex-shrink-0 ${isOn && isExpanded ? 'rotate-90' : ''}`}>
                            {isOn ? (
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            ) : (
                              <span className="w-3.5 h-3.5 block" />
                            )}
                          </span>
                          <span className={`text-sm font-medium truncate ${isOn ? "text-gray-800" : "text-gray-400"}`}>
                            {page.label}
                          </span>
                          {isOn && paginaLeeg[page.id] && (
                            <span className="flex-shrink-0 text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: "#B45309" }}>
                              <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#D97706" }} />
                              nog leeg
                            </span>
                          )}
                        </button>
                        {page.toggleable ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggle(page.id) }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${isOn ? "bg-[#C5A059]" : "bg-gray-200"}`}
                          >
                            <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform ${isOn ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 font-semibold flex-shrink-0">aan</span>
                        )}
                      </div>

                      {/* Inline page controls */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-5 pt-4 pb-5 flex flex-col gap-5">

                          {/* ── Home controls ── */}
                          {page.id === 'Home' && (
                          <div className="-mx-5 -mt-4 -mb-5 flex flex-col">

                            {/* ── Lay-out ── */}
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => setOpenHomeSection(prev => prev === 'layout' ? null : 'layout')}
                                className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className={`transition-transform duration-200 flex-shrink-0 ${homeOpen('layout') ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Lay-out</span>
                              </button>
                              {homeOpen('layout') && (
                                <div className="px-5 pb-4 flex flex-col gap-3">
                                  <div className="flex gap-2">
                                    {([
                                      { id: 'editorial', label: 'Flexibel',       sub: 'Layout 1' },
                                      { id: 'modern',    label: 'Vaste indeling', sub: 'Layout 2' },
                                    ] as const).map((opt) => (
                                      <button
                                        key={opt.id}
                                        onClick={() => updateHpSettings({ layout: opt.id })}
                                        className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                          hpSettings.layout === opt.id
                                            ? 'border-[#C5A059] bg-[#FBF5E8] text-[#C5A059] ring-2 ring-[#C5A059]/30'
                                            : 'border-[var(--goud-licht)] text-gray-400 hover:border-gray-300'
                                        }`}
                                      >
                                        <span className="font-bold">{opt.label}</span>
                                        <span className="text-[10px] font-normal opacity-70">{opt.sub}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <div className="text-xs leading-relaxed space-y-1.5" style={{ color: "#9A8E82" }}>
                                    <p><span className="font-semibold" style={{ color: "#5C5248" }}>Flexibel</span>: volledig aanpasbaar naar jullie smaak. Kies voor een grote foto bovenaan, voeg een mooi trouwkaart-kader toe, of zet ze allebei uit voor een rustige, minimalistische look met direct tekst.</p>
                                    <p><span className="font-semibold" style={{ color: "#5C5248" }}>Vaste indeling</span>: een stijlvolle, vaste indeling met links de headerfoto en rechts jullie tekstvelden strak naast elkaar.</p>
                                    <p className="pt-0.5" style={{ color: "#C5A059" }}>Speel met beide stijlen en ontdek wat het beste bij jullie past!</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ── Headerfoto ── */}
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => setOpenHomeSection(prev => prev === 'headerfoto' ? null : 'headerfoto')}
                                className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className={`transition-transform duration-200 flex-shrink-0 ${homeOpen('headerfoto') ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Headerfoto</span>
                              </button>
                              {homeOpen('headerfoto') && (
                                <div id="hp-field-headerfoto" className="px-5 pb-4">
                                  {heroImageUrl ? (
                                    <div className="flex flex-col gap-3">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={heroImageUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-gray-600">Kleur overlay</span>
                                          <button
                                            onClick={() => updateDraft({ heroOverlay: !heroOverlay })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${heroOverlay ? "bg-[#C5A059]" : "bg-gray-200"}`}
                                          >
                                            <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${heroOverlay ? "translate-x-4" : "translate-x-0.5"}`} />
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => { setHeroImageUrl(null); localStorage.removeItem("sayingyes_hero_image_url") }}
                                          className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          Verwijderen
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {heroImageError && <p className="text-xs text-red-500 mb-2 leading-snug">{heroImageError}</p>}
                                      <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-5 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Foto uploaden
                                      </button>
                                    </div>
                                  )}
                                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
                                </div>
                              )}
                            </div>

                            {/* ── Kaders ── */}
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => setOpenHomeSection(prev => prev === 'kaders' ? null : 'kaders')}
                                className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className={`transition-transform duration-200 flex-shrink-0 ${homeOpen('kaders') ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Kaders</span>
                              </button>
                              {homeOpen('kaders') && (
                                <div className="px-5 pb-4 flex flex-col gap-4">
                                  {hpSettings.layout === 'editorial' ? (
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-600">Kader activeren</span>
                                        <button
                                          onClick={() => updateDraft({ use_frame: !(draft?.use_frame ?? false) })}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft?.use_frame ? "bg-[#C5A059]" : "bg-gray-200"}`}
                                        >
                                          <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${draft?.use_frame ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                      </div>
                                      {draft?.use_frame && (
                                        <div className="grid grid-cols-3 gap-2">
                                          {([
                                            { id: "gold-circle",     label: "Gold Cirkel",    file: "gold-circle.webp"    },
                                            { id: "gold-diamond",    label: "Gold Ruit",      file: "gold-diamond.webp"   },
                                            { id: "terra-circle",    label: "Terra Cirkel",   file: "terra-circle.webp"   },
                                            { id: "terra-diamond",   label: "Terra Ruit",     file: "terra-diamond.webp"  },
                                            { id: "earthy-circle",   label: "Earthy Cirkel",  file: "earthy-circle.webp"  },
                                            { id: "earthy-diamond",  label: "Earthy Ruit",    file: "earthy-diamond.webp" },
                                            { id: "bloem2-breed",    label: "Bloem 2 Breed",  file: "Bloem2-breed.webp"       },
                                            { id: "olive-square",    label: "Olijf Vierkant", file: "olive-square.webp"   },
                                            { id: "bloem-rechthoek", label: "Bloem Breed",    file: "Bloem-rechthoek.webp"    },
                                          ]).map((frame) => {
                                            const isActive = (draft?.frame_style ?? "gold-circle") === frame.id
                                            return (
                                              <button
                                                key={frame.id}
                                                onClick={() => updateDraft({ frame_style: frame.id })}
                                                title={frame.label}
                                                className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${isActive ? "border-rose-400 ring-2 ring-rose-300 ring-offset-1" : "border-gray-100 hover:border-gray-300"}`}
                                              >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={`/frames/${frame.file}`} alt={frame.label} className="w-full h-full object-cover" />
                                                {isActive && (
                                                  <div className="absolute inset-0 bg-[#C5A059] bg-opacity-10 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                  </div>
                                                )}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 leading-relaxed">Kaders zijn beschikbaar bij Lay-out &ldquo;Flexibel&rdquo;.</p>
                                  )}

                                </div>
                              )}
                            </div>

                            {/* ── Tekstvelden ── */}
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => setOpenHomeSection(prev => prev === 'tekstvelden' ? null : 'tekstvelden')}
                                className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className={`transition-transform duration-200 flex-shrink-0 ${homeOpen('tekstvelden') ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Tekstvelden</span>
                              </button>
                              {homeOpen('tekstvelden') && (
                                <div className="px-5 pb-4 flex flex-col gap-4">

                                  {/* Hoofdtitel */}
                                  <div id="hp-field-hoofdtitel" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Hoofdtitel</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ hoofdtitelVisible: !hpSettings.hoofdtitelVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.hoofdtitelVisible ? 'bg-[#C5A059]' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.hoofdtitelVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'hoofdtitel' ? 'bg-[#FBF5E8] text-[#C5A059]' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={draft?.naam ?? ""}
                                      onChange={(e) => updateDraft({ naam: e.target.value })}
                                      onFocus={() => setHpOpenGear('hoofdtitel')}
                                      placeholder="Bijv. Bruiloft Michiel & Lisa"
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
                                    />
                                    {hpOpenGear === 'hoofdtitel' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
                                        <FontSelect value={hpSettings.hoofdtitelFont} onChange={(v) => updateHpSettings({ hoofdtitelFont: v })} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{hpSettings.hoofdtitelSize}rem</span>
                                        </div>
                                        <input type="range" min={1} max={10} step={0.25} value={hpSettings.hoofdtitelSize} onChange={(e) => updateHpSettings({ hoofdtitelSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                        {heroImageUrl && (
                                          <>
                                            <p className="text-xs text-gray-500 mt-1">Positie</p>
                                            <div className="flex rounded-xl border border-[var(--goud-licht)] overflow-hidden bg-white">
                                              {([
                                                { id: 'over',  label: 'Over foto'  },
                                                { id: 'under', label: hpSettings.layout === 'modern' ? 'In tekstvlak' : 'Onder foto' },
                                              ] as const).map((opt) => (
                                                <button
                                                  key={opt.id}
                                                  onClick={() => updateHpSettings({ titlePosition: opt.id })}
                                                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${hpSettings.titlePosition === opt.id ? 'bg-[#C5A059] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                  {opt.label}
                                                </button>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Subtitel */}
                                  <div id="hp-field-subtitle" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Subtitel</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ subtitleVisible: !hpSettings.subtitleVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.subtitleVisible ? 'bg-[#C5A059]' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.subtitleVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'subtitle' ? 'bg-[#FBF5E8] text-[#C5A059]' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={hpSettings.subtitleText}
                                      onChange={(e) => updateHpSettings({ subtitleText: e.target.value })}
                                      onFocus={() => setHpOpenGear('subtitle')}
                                      placeholder="bijv. Samen vieren we de liefde"
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                    />
                                    {hpOpenGear === 'subtitle' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
                                        <FontSelect value={hpSettings.subtitleFont} onChange={(v) => updateHpSettings({ subtitleFont: v })} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{hpSettings.subtitleSize}rem</span>
                                        </div>
                                        <input type="range" min={0.7} max={5} step={0.1} value={hpSettings.subtitleSize} onChange={(e) => updateHpSettings({ subtitleSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Initialen */}
                                  <div id="hp-field-initialen" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Initialen</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ initialsVisible: !hpSettings.initialsVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.initialsVisible ? 'bg-[#C5A059]' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.initialsVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'initialen' ? 'bg-[#FBF5E8] text-[#C5A059]' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={draft?.initials ?? ""}
                                      onChange={(e) => updateDraft({ initials: e.target.value })}
                                      onFocus={() => setHpOpenGear('initialen')}
                                      placeholder="bijv. M | W"
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                    />
                                    {hpOpenGear === 'initialen' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
                                        <FontSelect value={fontInitials} onChange={saveFontInitials} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{draft?.frameInitialsSize ?? 8}</span>
                                        </div>
                                        <input type="range" min={4} max={18} step={0.5} value={draft?.frameInitialsSize ?? 8} onChange={(e) => updateDraft({ frameInitialsSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Namen */}
                                  <div id="hp-field-namen" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Namen</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ frameNamesVisible: !hpSettings.frameNamesVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.frameNamesVisible ? 'bg-[#C5A059]' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.frameNamesVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'namen' ? 'bg-[#FBF5E8] text-[#C5A059]' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={draft?.frame_names ?? ""}
                                      onChange={(e) => updateDraft({ frame_names: e.target.value })}
                                      onFocus={() => setHpOpenGear('namen')}
                                      placeholder={"bijv. Michiel\n& Lindsey"}
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all resize-none"
                                    />
                                    {hpOpenGear === 'namen' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
                                        <FontSelect value={fontFrameNames} onChange={saveFontFrameNames} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{draft?.frameNamesSize ?? 5.5}</span>
                                        </div>
                                        <input type="range" min={2} max={13} step={0.5} value={draft?.frameNamesSize ?? 5.5} onChange={(e) => updateDraft({ frameNamesSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Datum */}
                                  <div id="hp-field-datum" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Datum</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ datumVisible: !hpSettings.datumVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.datumVisible ? 'bg-[#C5A059]' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.datumVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'datum' ? 'bg-[#FBF5E8] text-[#C5A059]' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="date"
                                      value={draft?.datum ?? ""}
                                      onChange={(e) => updateDraft({ datum: e.target.value })}
                                      onFocus={() => setHpOpenGear('datum')}
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                    />
                                    {hpOpenGear === 'datum' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
                                        <FontSelect value={hpSettings.datumFont} onChange={(v) => updateHpSettings({ datumFont: v })} />
                                        {draft?.use_frame ? (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte in kader</span>
                                              <span className="text-xs text-gray-400">{draft?.frameDateSize ?? 1.8}</span>
                                            </div>
                                            <input type="range" min={0.3} max={6} step={0.1} value={draft?.frameDateSize ?? 1.8} onChange={(e) => updateDraft({ frameDateSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                          </>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte</span>
                                              <span className="text-xs text-gray-400">{hpSettings.datumSize}rem</span>
                                            </div>
                                            <input type="range" min={0.7} max={3} step={0.1} value={hpSettings.datumSize} onChange={(e) => updateHpSettings({ datumSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                          </>
                                        )}
                                        <div className="flex flex-col gap-1">
                                          <span className="text-xs text-gray-500">Notatie</span>
                                          <div className="flex rounded-xl border border-[var(--goud-licht)] overflow-hidden">
                                            <button
                                              onClick={() => updateHpSettings({ datumNotatie: 'uitgeschreven' })}
                                              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${(hpSettings.datumNotatie ?? 'uitgeschreven') === 'uitgeschreven' ? 'bg-[#C5A059] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                              Optie 1
                                            </button>
                                            <button
                                              onClick={() => updateHpSettings({ datumNotatie: 'numeriek' })}
                                              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${(hpSettings.datumNotatie ?? 'uitgeschreven') === 'numeriek' ? 'bg-[#C5A059] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                              Optie 2
                                            </button>
                                          </div>
                                          <p className="text-[10px] text-gray-400 leading-snug">
                                            {(hpSettings.datumNotatie ?? 'uitgeschreven') === 'uitgeschreven' ? '28 juni 2026' : '28-06-2026'}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Locatie */}
                                  <div id="hp-field-locatie" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Locatie</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ locatieVisible: !hpSettings.locatieVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.locatieVisible ? 'bg-[#C5A059]' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.locatieVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'locatie' ? 'bg-[#FBF5E8] text-[#C5A059]' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={draft?.frame_location ?? ""}
                                      onChange={(e) => updateDraft({ frame_location: e.target.value })}
                                      onFocus={() => setHpOpenGear('locatie')}
                                      placeholder="bijv. Kasteel de Haar"
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                    />
                                    {hpOpenGear === 'locatie' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
                                        <FontSelect value={hpSettings.locatieFont} onChange={(v) => updateHpSettings({ locatieFont: v })} />
                                        {draft?.use_frame ? (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte in kader</span>
                                              <span className="text-xs text-gray-400">{draft?.frameLocationSize ?? 1.8}</span>
                                            </div>
                                            <input type="range" min={0.3} max={6} step={0.1} value={draft?.frameLocationSize ?? 1.8} onChange={(e) => updateDraft({ frameLocationSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                          </>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte</span>
                                              <span className="text-xs text-gray-400">{hpSettings.locatieSize}rem</span>
                                            </div>
                                            <input type="range" min={0.7} max={3} step={0.1} value={hpSettings.locatieSize} onChange={(e) => updateHpSettings({ locatieSize: Number(e.target.value) })} className="w-full accent-[#C5A059]" />
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              )}
                            </div>

                            {/* ── Welkomstbericht ── */}
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => setOpenHomeSection(prev => prev === 'welkomst' ? null : 'welkomst')}
                                className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className={`transition-transform duration-200 flex-shrink-0 ${homeOpen('welkomst') ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Welkomstbericht</span>
                              </button>
                              {homeOpen('welkomst') && (
                                <div className="px-5 pb-4 flex flex-col gap-3">
                                  <div id="hp-field-welkomst-titel" className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Titel</span>
                                    <input
                                      type="text"
                                      value={homeContent.title}
                                      onChange={(e) => updateDraft({ homeContent: { ...homeContent, title: e.target.value } })}
                                      placeholder="Optionele titel"
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Grootte</span>
                                      <span className="text-xs text-gray-400">{homeContent.titleSize ?? 1.0}rem</span>
                                    </div>
                                    <input type="range" min={0.7} max={3} step={0.05} value={homeContent.titleSize ?? 1.0} onChange={(e) => updateDraft({ homeContent: { ...homeContent, titleSize: Number(e.target.value) } })} className="w-full accent-[#C5A059]" />
                                  </div>
                                  <div id="hp-field-welkomst-tekst" className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Tekst</span>
                                    <textarea
                                      rows={5}
                                      value={homeContent.body}
                                      onChange={(e) => updateDraft({ homeContent: { ...homeContent, body: e.target.value } })}
                                      placeholder="Schrijf een welkomstbericht voor je gasten..."
                                      className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Grootte</span>
                                      <span className="text-xs text-gray-400">{homeContent.bodySize ?? 0.9375}rem</span>
                                    </div>
                                    <input type="range" min={0.7} max={2.5} step={0.05} value={homeContent.bodySize ?? 0.9375} onChange={(e) => updateDraft({ homeContent: { ...homeContent, bodySize: Number(e.target.value) } })} className="w-full accent-[#C5A059]" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Uitlijning</span>
                                    <div className="flex gap-1.5">
                                      {(["left", "center", "right"] as const).map((a) => (
                                        <button
                                          key={a}
                                          onClick={() => updateDraft({ homeContent: { ...homeContent, align: a } })}
                                          className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all ${homeContent.align === a ? "border-[#C5A059] bg-[#FBF5E8] text-[#C5A059]" : "border-[var(--goud-licht)] text-gray-400 hover:border-gray-300"}`}
                                        >
                                          {a === "left" && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h12" /></svg>}
                                          {a === "center" && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M6 18h12" /></svg>}
                                          {a === "right" && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M8 18h12" /></svg>}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                          )}

                          {/* ── Ceremoniemeesters controls ── */}
                          {page.id === 'Ceremoniemeesters' && (
                            <div className="flex flex-col gap-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ceremoniemeesters</p>
                              <MastersEditor
                                masters={(content.Ceremoniemeesters?.masters as MasterPerson[] | undefined) ?? []}
                                onChange={(masters) => updateContent("Ceremoniemeesters", { ...(content.Ceremoniemeesters ?? {}), masters })}
                              />
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500">Vrije tekst onderaan</label>
                                <textarea
                                  id="ceremoniemeesters-vrije-tekst"
                                  rows={4}
                                  value={typeof content.Ceremoniemeesters?.text === "string" ? content.Ceremoniemeesters.text : ""}
                                  onChange={(e) => updateContent("Ceremoniemeesters", { ...(content.Ceremoniemeesters ?? {}), text: e.target.value })}
                                  placeholder="Optionele tekst onderaan de pagina..."
                                  className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none leading-relaxed"
                                />
                              </div>
                            </div>
                          )}

                          {/* ── Programma controls ── */}
                          {page.id === 'Programma' && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Weergave</p>
                              <div className="flex rounded-xl border border-[var(--goud-licht)] overflow-hidden mb-5">
                                {(["timeline", "centered"] as const).map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => updateContent("Programma", { items: programmaItems, layout: opt })}
                                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                                      programLayout === opt ? "bg-[#C5A059] text-white" : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    {opt === "timeline" ? "Tijdlijn" : "Gecentreerd"}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Onderdelen</p>
                              <div className="flex flex-col gap-2">
                                {programmaItems.map((item, i) => (
                                  <div key={item.id ?? i} className="flex flex-col gap-1.5 bg-white rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <select
                                          value={item.time ? item.time.split(":")[0] : "12"}
                                          onChange={(e) => {
                                            const min = item.time ? item.time.split(":")[1] ?? "00" : "00"
                                            const updated = [...programmaItems]
                                            updated[i] = { ...updated[i], time: `${e.target.value}:${min}` }
                                            updateContent("Programma", { items: updated, layout: programLayout })
                                          }}
                                          className="rounded-lg border border-[var(--goud-licht)] px-1.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] bg-white cursor-pointer"
                                        >
                                          {Array.from({ length: 24 }, (_, k) => String(k).padStart(2, "0")).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                          ))}
                                        </select>
                                        <span className="text-xs font-bold text-gray-500">:</span>
                                        <select
                                          value={item.time ? (Array.from({length:12},(_,k)=>String(k*5).padStart(2,"0")).includes(item.time.split(":")[1]) ? item.time.split(":")[1] : "00") : "00"}
                                          onChange={(e) => {
                                            const hr = item.time ? item.time.split(":")[0] ?? "00" : "00"
                                            const updated = [...programmaItems]
                                            updated[i] = { ...updated[i], time: `${hr}:${e.target.value}` }
                                            updateContent("Programma", { items: updated, layout: programLayout })
                                          }}
                                          className="rounded-lg border border-[var(--goud-licht)] px-1.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] bg-white cursor-pointer"
                                        >
                                          {Array.from({length:12},(_,k)=>String(k*5).padStart(2,"0")).map(m => (
                                            <option key={m} value={m}>{m}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button
                                        onClick={() => setOpenIconPickerIdx(openIconPickerIdx === i ? null : i)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                          openIconPickerIdx === i
                                            ? "border-[#C5A059] bg-[#FBF5E8] text-[#C5A059]"
                                            : "border-[var(--goud-licht)] bg-white text-gray-500 hover:border-[var(--goud)] hover:text-[var(--goud)]"
                                        }`}
                                      >
                                        <ProgramIcon iconId={item.iconId ?? "heart"} size={14} strokeWidth={2} />
                                        <span>Icoon</span>
                                      </button>
                                      {deleteConfirmIdx === i ? (
                                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                          <span className="text-xs font-medium text-red-700 whitespace-nowrap">Verwijderen?</span>
                                          <button
                                            onClick={() => {
                                              const updated = programmaItems.filter((_, j) => j !== i)
                                              updateContent("Programma", { items: updated, layout: programLayout })
                                              setDeleteConfirmIdx(null)
                                            }}
                                            className="text-xs font-semibold px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                          >
                                            Ja
                                          </button>
                                          <button
                                            onClick={() => setDeleteConfirmIdx(null)}
                                            className="text-xs font-semibold px-2 py-0.5 bg-white hover:bg-gray-100 text-gray-600 border border-[var(--goud-licht)] rounded transition-colors"
                                          >
                                            Nee
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setDeleteConfirmIdx(i)}
                                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                                          title="Onderdeel verwijderen"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                    {openIconPickerIdx === i && (
                                      <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        {PROGRAM_ICONS.map((icon) => (
                                          <button
                                            key={icon.id}
                                            onClick={() => {
                                              const updated = [...programmaItems]
                                              updated[i] = { ...updated[i], iconId: icon.id }
                                              updateContent("Programma", { items: updated, layout: programLayout })
                                              setOpenIconPickerIdx(null)
                                            }}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                                              (item.iconId ?? "heart") === icon.id
                                                ? "bg-[#FBF5E8] text-[#C5A059]"
                                                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                            }`}
                                          >
                                            <div className="h-9 flex items-center justify-center">
                                              <ProgramIcon iconId={icon.id} size={36} strokeWidth={2} fixedHeight />
                                            </div>
                                            <span className="text-[11px] leading-tight w-full text-center break-words">{icon.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <input
                                      id={`programma-title-${item.id ?? i}`}
                                      type="text"
                                      value={item.title ?? ""}
                                      onChange={(e) => {
                                        const updated = [...programmaItems]
                                        updated[i] = { ...updated[i], title: e.target.value }
                                        updateContent("Programma", { items: updated, layout: programLayout })
                                      }}
                                      placeholder="Titel..."
                                      className="rounded-lg border border-[var(--goud-licht)] px-2 py-1.5 text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]"
                                    />
                                    <textarea
                                      id={`programma-description-${item.id ?? i}`}
                                      rows={2}
                                      value={item.description}
                                      onChange={(e) => {
                                        const updated = [...programmaItems]
                                        updated[i] = { ...updated[i], description: e.target.value }
                                        updateContent("Programma", { items: updated, layout: programLayout })
                                      }}
                                      placeholder="Beschrijving..."
                                      className="rounded-lg border border-[var(--goud-licht)] px-2 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none"
                                    />
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const updated = [...programmaItems, { id: crypto.randomUUID(), time: "", title: "", description: "", iconId: "heart" }]
                                    updateContent("Programma", { items: updated, layout: programLayout })
                                  }}
                                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-emerald-200 rounded-xl py-3 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors mt-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  Onderdeel toevoegen
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ── RSVP controls ── */}
                          {page.id === 'RSVP' && (
                            <div className="flex flex-col gap-5">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Introductietekst</p>
                                <label className="flex flex-col gap-1.5">
                                  <span className="text-xs font-semibold text-gray-600">Tekst boven het formulier</span>
                                  <textarea
                                    rows={3}
                                    value={(content.RSVP?.text as string) ?? ""}
                                    onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), text: e.target.value })}
                                    placeholder="Laat weten of je erbij bent via het formulier."
                                    className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
                                  />
                                </label>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Type gasten</p>
                                <div className="flex flex-col gap-2">
                                  {(["daggast", "avondgast", "receptiegast"] as const).map((t) => {
                                    const current = (content.RSVP?.guestTypes as string[]) ?? ["daggast", "avondgast"]
                                    const label = t === "daggast" ? "Daggast" : t === "avondgast" ? "Avondgast" : "Receptiegast"
                                    return (
                                      <label key={t} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          className="rounded"
                                          checked={current.includes(t)}
                                          onChange={(e) => {
                                            const updated = e.target.checked
                                              ? [...current, t]
                                              : current.filter((x) => x !== t)
                                            if (updated.length > 0) {
                                              updateContent("RSVP", { ...(content.RSVP ?? {}), guestTypes: updated })
                                            }
                                          }}
                                        />
                                        {label}
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Sluitingsdatum</p>
                                <label className="flex flex-col gap-1.5">
                                  <span className="text-xs font-semibold text-gray-600">Aanmelden niet meer mogelijk na</span>
                                  <input
                                    type="date"
                                    value={(content.RSVP?.deadline as string) ?? ""}
                                    onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), deadline: e.target.value || null })}
                                    className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                  />
                                  <span className="text-xs text-gray-400">Laat leeg voor geen sluitingsdatum.</span>
                                </label>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">DJ-tip / Song Request</p>
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    checked={(content.RSVP?.showSongRequest as boolean) ?? false}
                                    onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), showSongRequest: e.target.checked })}
                                  />
                                  <span className="text-sm text-gray-700">
                                    Vraag om een song request<br />
                                    <span className="text-xs text-gray-400">&ldquo;Welk nummer brengt jou gegarandeerd naar de dansvloer?&rdquo;</span>
                                  </span>
                                </label>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Overnachting</p>
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    checked={(content.RSVP?.showOvernachting as boolean) ?? false}
                                    onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), showOvernachting: e.target.checked })}
                                  />
                                  <span className="text-sm text-gray-700">
                                    Overnachtingsvraag tonen<br />
                                    <span className="text-xs text-gray-400">&ldquo;Blijven jullie overnachten?&rdquo;</span>
                                  </span>
                                </label>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Eigen Ja/Nee-vraag</p>
                                <label className="flex flex-col gap-1.5">
                                  <span className="text-xs font-semibold text-gray-600">Stel je eigen vraag</span>
                                  <input
                                    type="text"
                                    value={(content.RSVP?.customQuestion as string) ?? ""}
                                    onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), customQuestion: e.target.value })}
                                    placeholder="Bijv. Komen jullie naar het afterparty?"
                                    className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                  />
                                  <span className="text-xs text-gray-400">Laat leeg om uit te schakelen.</span>
                                </label>
                                <label className="flex flex-col gap-1.5 mt-3">
                                  <span className="text-xs font-semibold text-gray-600">Stel je eigen vraag 2</span>
                                  <input
                                    type="text"
                                    value={(content.RSVP?.customQuestion2 as string) ?? ""}
                                    onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), customQuestion2: e.target.value })}
                                    placeholder="Bijv. Doen jullie mee met het spel?"
                                    className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                  />
                                  <span className="text-xs text-gray-400">Laat leeg om uit te schakelen.</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* ── Ons Verhaal controls ── */}
                          {page.id === 'OnsVerhaal' && (
                            <div className="flex flex-col gap-5">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ons Verhaal</p>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Titel</span>
                                <input
                                  id="onsverhaal-title"
                                  type="text"
                                  value={(content.OnsVerhaal?.title as string) ?? "Ons Verhaal"}
                                  onChange={(e) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), title: e.target.value })}
                                  placeholder="Ons Verhaal"
                                  className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                />
                              </label>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Verhaal</span>
                                <textarea
                                  id="onsverhaal-text"
                                  rows={6}
                                  value={(content.OnsVerhaal?.text as string) ?? ""}
                                  onChange={(e) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), text: e.target.value })}
                                  placeholder="Vertel hier jullie verhaal..."
                                  className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
                                />
                              </label>
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Foto</p>
                                {storyImageError && <p className="text-xs text-red-500 mb-2">{storyImageError}</p>}
                                {(storyImageBlob ?? (content.OnsVerhaal?.image_url as string | null)) ? (
                                  <div className="flex flex-col gap-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={(storyImageBlob ?? (content.OnsVerhaal?.image_url as string))!}
                                      alt=""
                                      className="w-full h-24 object-cover rounded-xl"
                                    />
                                    {!storyUploading && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-gray-600">Kleur overlay</span>
                                          <button
                                            onClick={() => updateDraft({ storyOverlay: !storyOverlay })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${storyOverlay ? "bg-[#C5A059]" : "bg-gray-200"}`}
                                          >
                                            <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${storyOverlay ? "translate-x-4" : "translate-x-0.5"}`} />
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setStoryImageBlob(null)
                                            updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), image_url: null })
                                          }}
                                          className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          Verwijderen
                                        </button>
                                      </div>
                                    )}
                                    {storyUploading && <p className="text-xs text-gray-400">Uploading...</p>}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => storyFileInputRef.current?.click()}
                                    disabled={storyUploading}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-5 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] disabled:opacity-50 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Foto uploaden
                                  </button>
                                )}
                                <input ref={storyFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleStoryImageUpload} />
                              </div>
                            </div>
                          )}

                          {/* ── Informatie controls ── */}
                          {page.id === 'Informatie' && (
                            <div className="flex flex-col gap-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Informatie</p>
                              <PraktischEditor
                                tiles={praktischTiles ?? DEFAULT_PRAKTISCH_TILES}
                                onChange={(tiles) => updateContent("Informatie", { ...(content.Informatie ?? {}), items: tiles })}
                              />
                            </div>
                          )}

                          {/* ── Cadeautips controls ── */}
                          {page.id === 'Cadeautips' && (
                            <div className="flex flex-col gap-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cadeautips</p>
                              <WishlistEditor
                                items={wishlistItems ?? DEFAULT_WISHLIST_ITEMS}
                                onChange={(items) => updateContent("Cadeautips", { ...(content.Cadeautips ?? {}), items })}
                              />
                            </div>
                          )}

                          {/* ── Foto's controls ── */}
                          {page.id === 'Fotos' && (
                            <div className="flex flex-col gap-5">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Foto&apos;s</p>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Paginatitel</span>
                                <input
                                  type="text"
                                  value={(content.Fotos?.title as string) ?? "Foto's"}
                                  onChange={(e) => updateContent("Fotos", { ...(content.Fotos ?? {}), title: e.target.value })}
                                  placeholder="Foto's"
                                  className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"
                                />
                              </label>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Introductietekst <span className="font-normal text-gray-400">(optioneel)</span></span>
                                <textarea
                                  rows={2}
                                  value={(content.Fotos?.intro as string) ?? ""}
                                  onChange={(e) => updateContent("Fotos", { ...(content.Fotos ?? {}), intro: e.target.value })}
                                  placeholder="Bijv. Geniet hier na van de foto's van onze mooie dag."
                                  className="rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
                                />
                              </label>
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-semibold text-gray-600">
                                    {fotosUrls.length} / {MAX_FOTOS} foto&apos;s
                                  </span>
                                  <span className="text-xs text-gray-400">{MAX_FOTOS - fotosUrls.length} plaatsen over</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-rose-400 transition-all"
                                    style={{ width: `${Math.min(100, (fotosUrls.length / MAX_FOTOS) * 100)}%` }}
                                  />
                                </div>
                              </div>
                              {fotosUploadError && <p className="text-xs text-red-500">{fotosUploadError}</p>}
                              <button
                                type="button"
                                disabled={fotosUploading || fotosUrls.length >= MAX_FOTOS}
                                onClick={() => fotosFileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-[var(--goud-licht)] text-sm font-semibold text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {fotosUploading ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Uploaden...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {fotosUrls.length >= MAX_FOTOS ? "Limiet bereikt" : "Foto's toevoegen"}
                                  </>
                                )}
                              </button>
                              <input
                                ref={fotosFileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={handleFotosUpload}
                              />
                              {fotosUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-1.5">
                                  {fotosUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-square group">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                                      <button
                                        onClick={() => deleteFotosImage(i)}
                                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </aside>

        {/* ── Main panel ── */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-gray-100 border-t md:border-t-0 border-[var(--goud-licht)]">
          <div className={`flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-[var(--goud-licht)] flex-shrink-0 ${blad && !bladKlein ? "max-md:hidden" : ""}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live preview</p>
            <div className="flex items-center gap-2">
                {/* Zoom controls — desktop only */}
                <div className="hidden md:flex items-center gap-1 bg-gray-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setZoomMultiplier(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))}
                    title="Zoom uit"
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setZoomMultiplier(1)}
                    title="Zoom resetten"
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 w-9 text-center transition-colors tabular-nums"
                  >
                    {Math.round(zoomMultiplier * 100)}%
                  </button>
                  <button
                    onClick={() => setZoomMultiplier(z => Math.min(1.5, parseFloat((z + 0.1).toFixed(1))))}
                    title="Zoom in"
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Viewport toggle */}
                <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewport("desktop")}
                    title="Desktop"
                    className={`p-1.5 rounded-md transition-colors ${viewport === "desktop" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewport("mobiel")}
                    title="Mobiel"
                    className={`p-1.5 rounded-md transition-colors ${viewport === "mobiel" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" strokeWidth={2.5} />
                    </svg>
                  </button>
                </div>
              </div>
          </div>

          {/* ── Canvas ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Canvas */}
              <div ref={canvasContainerRef} className={`flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 ${blad && !bladKlein ? "max-md:pb-[55vh]" : "max-md:pb-16"}`}>
                <div className="mx-auto" style={{ width: `${Math.round(canvasWidth * voorbeeldSchaal)}px` }}>
                  <div style={{ width: canvasWidth, transform: `scale(${voorbeeldSchaal})`, transformOrigin: "top left" }}>
                    <div className="rounded-2xl shadow-xl overflow-clip" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily, letterSpacing: sc.bodyLetterSpacing, fontWeight: sc.bodyFontWeight }}>
                      {sc.fontImport && <style>{sc.fontImport}</style>}
                      <div className="bg-gray-50 border-b border-[var(--goud-licht)] px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-[var(--goud-licht)] px-3 py-1 text-xs text-gray-400">
                          {slugPreview}.sayingyes.nl
                        </div>
                      </div>
                      <EventNav
                        title={safeNavTitle}
                        pages={activePagesOrdered.map((p) => ({ type: p.id, title: p.label }))}
                        sc={sc}
                        navLayout={navLayout}
                        activeType={isSinglePagePreview ? undefined : previewPage}
                        onNavigate={(type) => {
                          if (!isSinglePagePreview) {
                            setPreviewPage(type as PageId)
                            setActiveSubPage(type as PageId)
                            return
                          }
                          // Eén pagina: naar dat onderdeel scrollen, zoals een gast
                          // het op de echte site ziet (Michiel, 26 september 2026)
                          document
                            .querySelector(`[data-voorbeeld-sectie="${type}"]`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }}
                        singlePage={isSinglePagePreview}
                      />
                      <div style={isSinglePagePreview ? { display: "flex", flexDirection: "column" } : undefined}>
                      {showSection("Home") && (
                        <div data-voorbeeld-sectie="Home" style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Home"), scrollMarginTop: 16 } : undefined}>
                        <EventHomePreview
                          title={draft?.naam ?? ""}
                          datum={draft?.datum || null}
                          datumFormatted={draft?.datum ? formatDate(draft.datum) : null}
                          locatie={eventLocatie || null}
                          heroImageUrl={heroImageUrl}
                          heroOverlay={heroOverlay}
                          homeTitle={homeContent.title || null}
                          homeBody={homeContent.body || null}
                          homeAlign={homeContent.align}
                          homeTitleSize={homeContent.titleSize}
                          homeBodySize={homeContent.bodySize}
                          sc={sc}
                          useFrame={draft?.use_frame}
                          frameStyle={draft?.frame_style}
                          initials={draft?.initials}
                          frameNames={draft?.frame_names}
                          frameLocation={draft?.frame_location}
                          frameInitialsSize={draft?.frameInitialsSize}
                          frameNamesSize={draft?.frameNamesSize}
                          frameDateSize={draft?.frameDateSize}
                          frameLocationSize={draft?.frameLocationSize}
                          heroPosX={draft?.hero_image_pos_x ?? 50}
                          heroPosY={draft?.hero_image_pos_y ?? 50}
                          editableHero={true}
                          onHeroPositionChange={(x, y) => updateDraft({ hero_image_pos_x: x, hero_image_pos_y: y })}
                          onNavigate={(id) => setPreviewPage(id as PageId)}
                          homepageSettings={hpSettings}
                          onFieldClick={handlePreviewFieldClick}
                        />
                        </div>
                      )}
                      {showSection("Ceremoniemeesters") && (
                        <div data-voorbeeld-sectie="Ceremoniemeesters" style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Ceremoniemeesters"), scrollMarginTop: 16 } : undefined}>
                        <EventMastersPreview
                          masters={mastersForPreview}
                          sc={sc}
                          text={typeof content.Ceremoniemeesters?.text === "string" ? content.Ceremoniemeesters.text : undefined}
                          onMasterClick={handleMasterClick}
                          onTextClick={handleMastersTextClick}
                          onContactClick={handleMasterContactClick}
                        />
                        </div>
                      )}
                      {showSection("OnsVerhaal") && (
                        <div data-voorbeeld-sectie="OnsVerhaal" style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "OnsVerhaal"), scrollMarginTop: 16 } : undefined}>
                        <StoryPreview
                          title={(content.OnsVerhaal?.title as string) ?? "Ons Verhaal"}
                          text={(content.OnsVerhaal?.text as string) ?? null}
                          imageUrl={storyImageBlob ?? ((content.OnsVerhaal?.image_url as string) || null)}
                          imagePosX={(content.OnsVerhaal?.image_pos_x as number) ?? 50}
                          imagePosY={(content.OnsVerhaal?.image_pos_y as number) ?? 50}
                          showOverlay={storyOverlay}
                          editable={true}
                          onPositionChange={(x, y) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), image_pos_x: x, image_pos_y: y })}
                          onFieldClick={handleStoryFieldClick}
                          sc={sc}
                        />
                        </div>
                      )}
                      {showSection("Programma") && (
                        <div data-voorbeeld-sectie="Programma" style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Programma"), scrollMarginTop: 16 } : undefined}>
                        <EventProgramPreview
                          items={programmaItemsForPreview}
                          sc={sc}
                          programLayout={programLayout}
                          builderMode
                          onImagePositionChange={(itemId, x) => {
                            const updated = programmaItems.map((it) => {
                              const itId = it.id ?? `${it.time}::${it.description}`
                              return itId === itemId ? { ...it, imagePosX: x } : it
                            })
                            updateContent("Programma", { items: updated, layout: programLayout })
                          }}
                          onItemClick={handleProgramItemClick}
                        />
                        </div>
                      )}
                      {showSection("RSVP") && (
                        <div
                          data-voorbeeld-sectie="RSVP"
                          style={{ cursor: "pointer", ...(isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "RSVP"), scrollMarginTop: 16 } : {}) }}
                          onClick={() => { toonPaginas(); gaNaarPagina("RSVP") }}
                        >
                        <div style={{ padding: "36px 32px 64px", textAlign: "center", backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
                          <h1 style={{ fontSize: "1.75rem", fontWeight: sc.fontPageTitlesWeight, color: sc.headingColor, fontFamily: sc.fontPageTitles, margin: "0 0 28px" }}>RSVP</h1>
                          <div style={{ maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                            {(() => {
                              const rsvpLabelColor = sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText
                              // Het echte formulier dat gasten zien, in de voorbeeldstand: je
                              // kunt klikken en invullen, er wordt niets verstuurd. Eerst stond
                              // hier een nagebouwd plaatje (Michiel, 26 september 2026).
                              const cardInner = (
                                <>
                                  <p style={{ fontSize: "0.9375rem", marginBottom: 16, textAlign: "center", color: rsvpLabelColor }}>
                                    {(content.RSVP?.text as string) || "Laat weten of je erbij bent via het formulier."}
                                  </p>
                                  <p style={{ textAlign: "center", fontSize: "0.8125rem", marginBottom: 24, padding: "10px 14px", borderRadius: 10, backgroundColor: `${sc.accent}12`, border: `1px solid ${sc.accent}30`, color: sc.bodyText, lineHeight: 1.55 }}>
                                    📋 Check even je uitnodiging welk type gast je bent. Als daggast verschijnen aan de avondtafel? Wij zeggen er niets van, de catering wel. 😉
                                  </p>
                                  {/* Klikken in het formulier is het formulier proberen, niet
                                      naar de instellingen springen */}
                                  <div onClick={(e) => e.stopPropagation()} style={{ cursor: "auto" }}>
                                    <AanmeldFormulier
                                      voorbeeld
                                      stand="volledig"
                                      knopTekstKleur={sc.buttonText}
                                      accentColor={sc.accent}
                                      labelColor={rsvpLabelColor}
                                      guestTypes={rsvpGuestTypes}
                                      showSongRequest={rsvpShowSong}
                                      deadline={rsvpDeadline}
                                      showOvernachting={rsvpShowOvernachting}
                                      customQuestion={rsvpCustomQuestion.trim() || null}
                                      customQuestion2={rsvpCustomQuestion2.trim() || null}
                                    />
                                  </div>
                                </>
                              )
                              return sc.goldBorder && sc.cardBg ? (
                                <div style={{ backgroundColor: sc.cardBg, border: `2px solid ${sc.accent}`, borderRadius: 16, padding: "28px 32px", textAlign: "left" }}>
                                  {cardInner}
                                </div>
                              ) : (
                                <div style={{ borderRadius: 16, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}08`, padding: "28px 32px", textAlign: "left" }}>
                                  {cardInner}
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                        </div>
                      )}
                      {showSection("Informatie") && (
                        <div data-voorbeeld-sectie="Informatie" style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Informatie"), scrollMarginTop: 16 } : undefined}>
                        <PraktischPreview tiles={praktischTiles ?? DEFAULT_PRAKTISCH_TILES} sc={sc} onTileClick={handleInfoTileClick} />
                        </div>
                      )}
                      {showSection("Cadeautips") && (
                        <div data-voorbeeld-sectie="Cadeautips" style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Cadeautips"), scrollMarginTop: 16 } : undefined}>
                        <WishlistPreview items={wishlistItems?.length ? wishlistItems : DEFAULT_WISHLIST_ITEMS} sc={sc} onItemClick={handleWishlistItemClick} />
                        </div>
                      )}
                      {showSection("Fotos") && (
                        <div
                          data-voorbeeld-sectie="Fotos"
                          style={{ cursor: "pointer", ...(isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Fotos"), scrollMarginTop: 16 } : {}) }}
                          onClick={() => { toonPaginas(); gaNaarPagina("Fotos") }}
                        >
                        <FotosPreview
                          title={(content.Fotos?.title as string) || "Foto's"}
                          intro={(content.Fotos?.intro as string) || null}
                          urls={fotosUrls}
                          sc={sc}
                        />
                        </div>
                      )}
                      </div>
                      {sc.floral && (
                        <div className="w-full flex justify-center" style={{ backgroundColor: sc.navBg, marginTop: "-20px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/bouquet-home.png.jpg"
                            alt=""
                            aria-hidden="true"
                            style={{
                              width: "45%",
                              maxWidth: "280px",
                              display: "block",
                              mixBlendMode: "multiply",
                              userSelect: "none",
                              pointerEvents: "none",
                              filter: sc.floralFilter ?? undefined,
                            }}
                          />
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

          </div>
        </main>
      </div>

      {/* ── Auth / magic-link modal ── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!authSent) { setShowAuthModal(false); setSaveError(null) } }}
        >
          <div
            className="rounded-3xl shadow-2xl p-8 max-w-sm w-full"
            style={{ backgroundColor: "#FDFAF6", border: "1px solid #E8D5A3" }}
            onClick={(e) => e.stopPropagation()}
          >
            {authSent ? (
              <>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: "#FBF5E8", border: "1px solid #E8D5A3" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: "#C5A059" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3
                  className="text-center mb-2"
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 700, color: "#1A1A1A" }}
                >
                  Controleer je inbox
                </h3>
                <p className="text-sm text-center mb-5 leading-relaxed" style={{ color: "#5C5248" }}>
                  We hebben een inloglink gestuurd naar <strong style={{ color: "#1A1A1A" }}>{authEmail}</strong>.
                  Klik op de link in de e-mail, dan wordt je website automatisch opgeslagen.
                </p>
                <button
                  onClick={() => { setShowAuthModal(false); setAuthSent(false); setAuthEmail("") }}
                  className="w-full text-center text-sm font-semibold py-2 transition-opacity hover:opacity-60"
                  style={{ color: "#C5A059" }}
                >
                  Sluiten
                </button>
                <button
                  onClick={() => { setAuthSent(false); localStorage.removeItem("sayingyes_pending_save") }}
                  className="mt-1 w-full text-center text-xs transition-opacity hover:opacity-60"
                  style={{ color: "#9A8E82" }}
                >
                  E-mailadres verkeerd gespeld? Klik hier om aan te passen.
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: "#FBF5E8", border: "1px solid #E8D5A3" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: "#C5A059" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <h3
                  className="text-center mb-2"
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 700, color: "#1A1A1A" }}
                >
                  Inloggen om op te slaan
                </h3>
                <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: "#5C5248" }}>
                  Vul je e-mailadres in, dan ontvang je een magische inloglink. Geen wachtwoord nodig.
                </p>
                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all"
                    style={{ border: "1px solid #E8D5A3", backgroundColor: "#fff", color: "#1A1A1A" }}
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full font-semibold py-3.5 rounded-2xl text-sm transition-all disabled:opacity-50 hover:-translate-y-0.5"
                    style={{ backgroundColor: "#1A1A1A", color: "#FAF7F2", boxShadow: "0 4px 16px rgba(26,26,26,0.15)" }}
                  >
                    {authLoading ? "Bezig..." : "Stuur inloglink"}
                  </button>
                </form>
                <button
                  onClick={() => { setShowAuthModal(false); setSaveError(null) }}
                  className="mt-3 w-full text-center text-sm transition-opacity hover:opacity-60"
                  style={{ color: "#9A8E82" }}
                >
                  Annuleren
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Sophie tutorial ── */}
      <SophieTutorial
        onNavigate={(nav: SophieNav) => {
          // Op de telefoon staat de zijbalk in een paneel; open het goede
          if (window.matchMedia("(max-width: 767px)").matches && nav.activeSection) {
            openBlad(({ algemeen: "uiterlijk", paginas: "paginas", url: "adres" } as const)[nav.activeSection])
          }
          if ('activeSection' in nav) setActiveSection(nav.activeSection ?? null)
          if ('openAlgSection' in nav) setOpenAlgSection(nav.openAlgSection ?? null)
          if ('activeSubPage' in nav) setActiveSubPage((nav.activeSubPage as PageId) ?? null)
          if ('openHomeSection' in nav) setOpenHomeSection(nav.openHomeSection ?? null)
        }}
      />
    </BouwerSchil>
  )
}

// ── Rich text home content editor ────────────────────────────────────────────

function HomeContentEditor({
  sc,
  homeContent,
  onSave,
  onClose,
}: {
  sc: StyleConfig
  homeContent: HomeContent
  onSave: (val: HomeContent) => void
  onClose: () => void
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState(homeContent.title)
  const [align, setAlign] = useState<Align>(homeContent.align)
  const [bodyEmpty, setBodyEmpty] = useState(!homeContent.body)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = homeContent.body
      setBodyEmpty(!homeContent.body)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function currentBody() {
    return bodyRef.current?.innerHTML ?? homeContent.body
  }

  function save(overrides?: Partial<HomeContent>) {
    onSave({ title, body: currentBody(), align, ...overrides })
  }

  function applyFormat(command: string, value?: string) {
    bodyRef.current?.focus()
    document.execCommand(command, false, value)
    requestAnimationFrame(() => save())
  }

  function handleAlign(a: Align) {
    setAlign(a)
    save({ align: a })
  }

  const toolbarBtnBase = "p-1.5 rounded-md transition-colors text-xs"

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 mb-3 pb-2.5 border-b flex-wrap" style={{ borderColor: `${sc.accent}20` }}>

        {/* Alignment */}
        {(["left", "center", "right"] as const).map((a) => (
          <button
            key={a}
            onMouseDown={(e) => { e.preventDefault(); handleAlign(a) }}
            className={toolbarBtnBase}
            style={align === a ? { backgroundColor: `${sc.accent}18`, color: sc.accent } : { color: "#9ca3af" }}
          >
            {a === "left" && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h12" />
              </svg>
            )}
            {a === "center" && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M6 18h12" />
              </svg>
            )}
            {a === "right" && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M8 18h12" />
              </svg>
            )}
          </button>
        ))}

        <span className="w-px h-4 mx-1 flex-shrink-0" style={{ backgroundColor: `${sc.accent}20` }} />

        {/* Bold / Italic / Underline */}
        <button onMouseDown={(e) => { e.preventDefault(); applyFormat("bold") }} className={`${toolbarBtnBase} font-bold px-2`} style={{ color: "#6b7280" }}>B</button>
        <button onMouseDown={(e) => { e.preventDefault(); applyFormat("italic") }} className={`${toolbarBtnBase} italic px-2`} style={{ color: "#6b7280" }}>I</button>
        <button onMouseDown={(e) => { e.preventDefault(); applyFormat("underline") }} className={`${toolbarBtnBase} underline px-2`} style={{ color: "#6b7280" }}>U</button>

        <span className="w-px h-4 mx-1 flex-shrink-0" style={{ backgroundColor: `${sc.accent}20` }} />

        {/* Font size */}
        {[{ label: "Klein", val: "1" }, { label: "Normaal", val: "3" }, { label: "Groot", val: "5" }].map(({ label, val }) => (
          <button
            key={val}
            onMouseDown={(e) => { e.preventDefault(); applyFormat("fontSize", val) }}
            className={`${toolbarBtnBase} px-2`}
            style={{ color: "#6b7280" }}
          >{label}</button>
        ))}

        {/* Close */}
        <button
          onMouseDown={(e) => { e.preventDefault(); save(); onClose() }}
          className="ml-auto flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: `${sc.accent}15`, color: sc.accent }}
        >
          Klaar
        </button>
      </div>

      {/* Title input */}
      <input
        type="text"
        placeholder="Titel (optioneel)"
        value={title}
        onChange={(e) => { setTitle(e.target.value); save({ title: e.target.value }) }}
        className="w-full bg-transparent outline-none font-bold mb-3 placeholder-gray-200"
        style={{ color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: align, fontSize: "1rem" }}
      />

      {/* Body contenteditable */}
      <div className="relative">
        {bodyEmpty && (
          <p className="absolute top-0 left-0 right-0 text-sm pointer-events-none select-none italic" style={{ color: `${sc.accent}50`, textAlign: align }}>
            Schrijf een welkomstbericht...
          </p>
        )}
        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            setBodyEmpty(!bodyRef.current?.textContent?.trim())
            save()
          }}
          className="outline-none text-sm leading-relaxed min-h-[80px]"
          style={{ color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: align }}
        />
      </div>
    </div>
  )
}

// ── Per-page editors ──────────────────────────────────────────────────────────

function Editor({
  pageId,
  content,
  onChange,
}: {
  pageId: PageId
  content: Record<string, unknown>
  onChange: (val: Record<string, unknown>) => void
}) {
  if (pageId === "Home") {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Welkomsttekst</label>
        <textarea
          rows={6}
          placeholder="Schrijf een welkomstbericht voor je gasten..."
          value={(content.text as string) ?? ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          className="w-full rounded-xl border border-[var(--goud-licht)] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
        />
      </div>
    )
  }

  if (pageId === "Programma") {
    const items = (content.items as { time: string; description: string }[]) ?? []
    return <ProgrammaEditor items={items} onChange={(items) => onChange({ ...content, items })} />
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Tekst</label>
      <textarea
        rows={5}
        placeholder="Voeg hier informatie toe..."
        value={(content.text as string) ?? ""}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        className="w-full rounded-xl border border-[var(--goud-licht)] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none transition-all"
      />
    </div>
  )
}

function ProgrammaEditor({
  items, onChange,
}: {
  items: { time: string; description: string }[]
  onChange: (items: { time: string; description: string }[]) => void
}) {
  const [newTime, setNewTime] = useState("")
  const [newDesc, setNewDesc] = useState("")

  function add() {
    if (!newTime.trim() || !newDesc.trim()) return
    onChange([...items, { time: newTime.trim(), description: newDesc.trim() }])
    setNewTime(""); setNewDesc("")
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-rose-500 w-12 flex-shrink-0">{item.time}</span>
              <span className="text-sm text-gray-700 flex-1">{item.description}</span>
              <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" placeholder="14:00" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-20 rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]" />
        <input type="text" placeholder="Beschrijving" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="flex-1 rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]" />
        <button onClick={add} className="flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">Voeg toe</button>
      </div>
    </div>
  )
}

function MastersEditor({
  masters: initialMasters,
  onChange,
}: {
  masters: MasterPerson[]
  onChange: (masters: MasterPerson[]) => void
}) {
  const [masters, setMasters] = useState<MasterPerson[]>(() =>
    initialMasters.map(m => ({ ...m, id: m.id ?? (Date.now().toString() + Math.random()) }))
  )
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingIdRef = useRef<string | null>(null)

  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    onChange(masters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update(id: string, patch: Partial<MasterPerson>) {
    setMasters(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...patch } : m)
      onChange(next.map(m => ({ ...m, foto_url: m.foto_url?.startsWith("blob:") ? null : m.foto_url })))
      return next
    })
  }

  function add() {
    setMasters(prev => {
      const next = [...prev, { id: Date.now().toString(), naam: "", telefoon: "", email: "", foto_url: null }]
      onChange(next)
      return next
    })
  }

  function remove(id: string) {
    setMasters(prev => {
      const next = prev.filter(m => m.id !== id)
      onChange(next)
      return next
    })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    const masterId = pendingIdRef.current
    if (!file || !masterId) return
    const blobUrl = URL.createObjectURL(file)
    setMasters(prev => prev.map(m => m.id === masterId ? { ...m, foto_url: blobUrl } : m))
    setUploading(masterId)
    try {
      const url = await uploadToStorage(file, "hero-images")
      URL.revokeObjectURL(blobUrl)
      update(masterId, { foto_url: url })
    } catch {
      URL.revokeObjectURL(blobUrl)
      setMasters(prev => prev.map(m => m.id === masterId ? { ...m, foto_url: null } : m))
    } finally {
      setUploading(null)
      pendingIdRef.current = null
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {masters.map((master) => (
        <div key={master.id} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3">
          {/* Header: label + trash */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ceremoniemeester</span>
            <button
              onClick={() => remove(master.id!)}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
              aria-label="Verwijder ceremoniemeester"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {/* Foto */}
          {master.foto_url ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={master.foto_url} alt="" className={`w-12 h-12 rounded-full object-cover ${uploading === master.id ? "opacity-50" : ""}`} />
              {uploading === master.id ? (
                <span className="text-xs text-gray-400">Uploaden...</span>
              ) : (
                <button onClick={() => update(master.id!, { foto_url: null })} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                  Foto verwijderen
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { pendingIdRef.current = master.id!; fileInputRef.current?.click() }}
              disabled={uploading !== null}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-4 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Foto uploaden
            </button>
          )}
          {/* Naam */}
          <input
            id={`master-naam-${master.id}`}
            type="text"
            value={master.naam}
            onChange={(e) => update(master.id!, { naam: e.target.value })}
            placeholder="Volledige naam"
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]"
          />
          {/* Telefoon */}
          <input
            id={`master-telefoon-${master.id}`}
            type="tel"
            value={master.telefoon}
            onChange={(e) => update(master.id!, { telefoon: e.target.value })}
            placeholder="+31 6 12345678"
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]"
          />
          {/* E-mail */}
          <input
            id={`master-email-${master.id}`}
            type="email"
            value={master.email}
            onChange={(e) => update(master.id!, { email: e.target.value })}
            placeholder="naam@voorbeeld.nl"
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-3 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ceremoniemeester toevoegen
      </button>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoUpload} />
    </div>
  )
}

function WishlistEditor({
  items: initialItems,
  onChange,
}: {
  items: WishlistItem[]
  onChange: (items: WishlistItem[]) => void
}) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems)
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    onChange(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update(id: string, patch: Partial<WishlistItem>) {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, ...patch } : it)
      onChange(next)
      return next
    })
  }

  function add() {
    setItems(prev => {
      const next = [...prev, { id: Date.now().toString(), iconId: "heart", title: "Nieuw blok", text: "" }]
      onChange(next)
      return next
    })
  }

  function remove(id: string) {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id)
      onChange(next)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3">
          {/* Rij 1: Titel */}
          <input
            id={`cadeau-title-${item.id}`}
            type="text"
            value={item.title}
            onChange={(e) => update(item.id, { title: e.target.value })}
            placeholder="Titel"
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]"
          />
          {/* Rij 2: Icoon-picker + Verwijder */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setOpenPickerId(openPickerId === item.id ? null : item.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                openPickerId === item.id
                  ? "border-[#C5A059] bg-[#FBF5E8] text-[#C5A059]"
                  : "border-[var(--goud-licht)] bg-white text-gray-500 hover:border-[var(--goud)] hover:text-[var(--goud)]"
              }`}
            >
              <ProgramIcon iconId={item.iconId} size={14} strokeWidth={2} />
              <span>Icoon</span>
            </button>
            <button
              onClick={() => remove(item.id)}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
              aria-label="Verwijder blok"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {/* Icoon grid picker */}
          {openPickerId === item.id && (
            <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              {PROGRAM_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => { update(item.id, { iconId: icon.id }); setOpenPickerId(null) }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    item.iconId === icon.id
                      ? "bg-[#FBF5E8] text-[#C5A059]"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                  title={icon.label}
                >
                  <div className="h-9 flex items-center justify-center">
                    <ProgramIcon iconId={icon.id} size={36} strokeWidth={2} fixedHeight />
                  </div>
                  <span className="text-[11px] leading-tight w-full text-center break-words">{icon.label}</span>
                </button>
              ))}
            </div>
          )}
          {/* Rij 3: Beschrijving */}
          <textarea
            id={`cadeau-text-${item.id}`}
            rows={3}
            value={item.text}
            onChange={(e) => update(item.id, { text: e.target.value })}
            placeholder="Beschrijving..."
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-3 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Informatieblok toevoegen
      </button>
    </div>
  )
}

function PraktischEditor({
  tiles: initialTiles,
  onChange,
}: {
  tiles: PraktischTile[]
  onChange: (tiles: PraktischTile[]) => void
}) {
  const [tiles, setTiles] = useState<PraktischTile[]>(initialTiles)
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  // Seed content state immediately so defaults are persisted even without user edits
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    onChange(tiles)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update(id: string, patch: Partial<PraktischTile>) {
    setTiles(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...patch } : t)
      onChange(next)
      return next
    })
  }

  function add() {
    setTiles(prev => {
      const next = [...prev, { id: Date.now().toString(), iconId: "heart", title: "Nieuw blok", text: "" }]
      onChange(next)
      return next
    })
  }

  function remove(id: string) {
    setTiles(prev => {
      const next = prev.filter(t => t.id !== id)
      onChange(next)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {tiles.map((tile) => (
        <div key={tile.id} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3">
          {/* Rij 1: Titel (volle breedte) */}
          <input
            id={`informatie-title-${tile.id}`}
            type="text"
            value={tile.title}
            onChange={(e) => update(tile.id, { title: e.target.value })}
            placeholder="Titel"
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)]"
          />
          {/* Rij 2: Icoon-picker + Verwijder */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setOpenPickerId(openPickerId === tile.id ? null : tile.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                openPickerId === tile.id
                  ? "border-[#C5A059] bg-[#FBF5E8] text-[#C5A059]"
                  : "border-[var(--goud-licht)] bg-white text-gray-500 hover:border-[var(--goud)] hover:text-[var(--goud)]"
              }`}
            >
              <ProgramIcon iconId={tile.iconId} size={14} strokeWidth={2} />
              <span>Icoon</span>
            </button>
            <button
              onClick={() => remove(tile.id)}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
              aria-label="Verwijder blok"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {/* Icon grid picker */}
          {openPickerId === tile.id && (
            <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              {PROGRAM_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => { update(tile.id, { iconId: icon.id }); setOpenPickerId(null) }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    tile.iconId === icon.id
                      ? "bg-[#FBF5E8] text-[#C5A059]"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                  title={icon.label}
                >
                  <div className="h-9 flex items-center justify-center">
                    <ProgramIcon iconId={icon.id} size={36} strokeWidth={2} fixedHeight />
                  </div>
                  <span className="text-[11px] leading-tight w-full text-center break-words">{icon.label}</span>
                </button>
              ))}
            </div>
          )}
          {/* Rij 3: Beschrijving (volle breedte) */}
          <textarea
            id={`informatie-text-${tile.id}`}
            rows={3}
            value={tile.text}
            onChange={(e) => update(tile.id, { text: e.target.value })}
            placeholder="Beschrijving..."
            className="w-full rounded-lg border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] resize-none"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-3 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Informatieblok toevoegen
      </button>
    </div>
  )
}
