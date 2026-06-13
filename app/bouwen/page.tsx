"use client"

import { useEffect, useRef, useState } from "react"
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
import { formatDate } from "@/lib/event-styles"
import { TITLE_FONT_OPTIONS, getTitleFont } from "@/lib/title-fonts"
import { createClient } from "@/lib/supabase"
import { eventSiteUrl } from "@/lib/site-url"

type EventType = "bruiloft" | "verjaardag" | "evenement"
type PageId = "Home" | "Programma" | "RSVP" | "Informatie" | "Cadeautips" | "Fotos" | "Ceremoniemeesters" | "OnsVerhaal"
type Style = "roze" | "ivoor" | "zand" | "earthy" | "emerald"
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
  hoofdtitelVisible: true,
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

const STYLES: { id: Style; label: string; sub: string; dot: string; border: string; active: string }[] = [
  { id: "zand",   label: "Gold & Ivory",      sub: "Clean, licht & tijdloos",   dot: "bg-[#E6D5B8]",    border: "border-[#E6D5B8]/60",    active: "ring-[#E6D5B8]"     },
  { id: "ivoor",  label: "Pampas & Pearl",    sub: "Luchtig, wild & vrij",      dot: "bg-[#C8D4C0]",    border: "border-[#C8D4C0]/60",    active: "ring-[#9CA996]"     },
  { id: "roze",   label: "Terracotta & Gold", sub: "Mediterraans, rijk & gedurfd", dot: "bg-[#D07C60]", border: "border-[#C5A059]/50",   active: "ring-[#C5A059]"     },
  { id: "earthy",   label: "Earthy & Warm",     sub: "Modern rustiek & betoverend",  dot: "bg-[#5A6B5D]",   border: "border-[#5A6B5D]/50",   active: "ring-[#5A6B5D]"   },
  { id: "emerald",  label: "Emerald Luxury",    sub: "Donker, diep & luxueus",       dot: "bg-[#07353A]",   border: "border-[#D59C76]/50",   active: "ring-[#D59C76]"   },
]

const STYLE_CONFIG = {
  roze: {
    accent: "#C5A059",
    heroGradient: "linear-gradient(135deg, #C87A68, #B86050, #A85040)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#F0D8CB",
    navText: "#3A1E0D",
    headingColor: "#3A1E0D",
    bodyText: "#5A2E1E",
    buttonBg: "#C5A059",
    buttonText: "#ffffff",
    labelColor: "#C5A059",
    bodyBg: "#E8C8B5",
    bodyBackground: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\") repeat, #F0D8CB" as string | null,
    cardBg: "#B5705F" as string | null,
    cardText: "#FDFBF7" as string | null,
    goldBorder: true as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "0.02em",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  ivoor: {
    accent: "#9CA996",
    heroGradient: "linear-gradient(160deg, #FDFAF6 0%, #F4F0E8 60%, #EBE6DF 100%)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: null as string | null,
    navBg: "#FDFAF6",
    navText: "#4A4440",
    headingColor: "#3D3530",
    bodyText: "#6B6257",
    buttonBg: "#9CA996",
    buttonText: "#ffffff",
    labelColor: "#B5A898",
    bodyBg: "#EBE6DF",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  zand: {
    accent: "#C5A059",
    heroGradient: "linear-gradient(135deg, #FAF8F5, #F3EFEA, #EDE8DF)",
    fontFamily: "'Cormorant Garamond', serif",
    nameFont: "'Pinyon Script', cursive" as string | null,
    navBg: "#FAF8F5",
    navText: "#3A352F",
    headingColor: "#3A352F",
    bodyText: "#3A352F",
    buttonBg: "#C5A059",
    buttonText: "#ffffff",
    labelColor: "#C5A059",
    bodyBg: "#F3EFEA",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Pinyon+Script&display=swap');",
    frameBodyText: null as string | null,
  },
  earthy: {
    accent: "#5A6B5D",
    heroGradient: "linear-gradient(135deg, #D8D0C0, #C6BA9E, #B3A285)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#E5DDD0",
    navText: "#2A1A10",
    headingColor: "#2A1A10",
    bodyText: "#4A3728",
    buttonBg: "#5A6B5D",
    buttonText: "#ffffff",
    labelColor: "#8A4B53",
    bodyBg: "#DDD7CA",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "500",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  emerald: {
    accent: "#D59C76",
    heroGradient: "linear-gradient(160deg, #07353A 0%, #0A4550 60%, #0D5058 100%)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: "var(--font-cinzel), serif" as string | null,
    navBg: "#0D5058",
    navText: "#FFFFFF",
    headingColor: "#D59C76",
    bodyText: "#E8DDD0",
    buttonBg: "#D59C76",
    buttonText: "#07353A",
    labelColor: "#D59C76",
    bodyBg: "#0D5058",
    bodyBackground: null as string | null,
    cardBg: "#0D4A52" as string | null,
    cardText: "#FFFFFF" as string | null,
    goldBorder: true as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "0.08em",
    bodyFontWeight: "500",
    fontImport: null as string | null,
    frameBodyText: "#2A1A10" as string | null,
  },
} as const

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
        className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-200"
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
  const [previewPage, setPreviewPage] = useState<PageId>("Home")
  const [activeSection, setActiveSection] = useState<'algemeen' | 'paginas' | 'url' | null>(null)
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
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [changeKey, setChangeKey] = useState(0)
  const savingRef = useRef(false)
  const [slugEditOpen, setSlugEditOpen]         = useState(false)
  const [slugValue, setSlugValue]               = useState("")
  const [slugError, setSlugError]               = useState<string | null>(null)
  const [slugSaving, setSlugSaving]             = useState(false)
  const [hpSettings, setHpSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS)
  const [hpOpenGear, setHpOpenGear] = useState<string | null>(null)
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null)
  const [openAlgSection, setOpenAlgSection] = useState<'stijl' | 'navigatie' | 'lettertype' | null>(null)
  const [openUrlSection, setOpenUrlSection] = useState<'url' | 'beveiliging' | null>(null)
  const [openHomeSection, setOpenHomeSection] = useState<'layout' | 'headerfoto' | 'kaders' | 'tekstvelden' | 'welkomst' | null>(null)
  const [pwEnabled, setPwEnabled] = useState(false)

  useEffect(() => { if (activeSection !== 'algemeen') setOpenAlgSection(null) }, [activeSection])
  useEffect(() => { if (activeSection !== 'url') setOpenUrlSection(null) }, [activeSection])
  useEffect(() => { if (activeSection !== 'paginas' || activeSubPage !== 'Home') setOpenHomeSection(null) }, [activeSection, activeSubPage])
  const [pwType, setPwType] = useState<'password' | 'secret_question'>('password')
  const [pwValue, setPwValue] = useState('')
  const [pwQuestion, setPwQuestion] = useState('')
  const [pwAnswer, setPwAnswer] = useState('')

  function handlePreviewFieldClick(field: string) {
    // Ensure Home controls sidebar is open
    setPreviewPage("Home")
    setActiveSection('paginas')
    setActiveSubPage('Home')
    setHpOpenGear(field)
    // Wait for sidebar to render before scrolling/focusing
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

  function handleStoryFieldDoubleClick(field: 'title' | 'text') {
    setActiveSection('paginas')
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

  function handleProgramItemDoubleClick(itemId: string) {
    setActiveSection('paginas')
    setActiveSubPage('Programma')
    setTimeout(() => {
      const el = document.getElementById(`programma-title-${itemId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      const len = (el as HTMLInputElement).value.length
      ;(el as HTMLInputElement).setSelectionRange(len, len)
    }, 150)
  }

  function handleInfoTileDoubleClick(tileId: string, field: 'title' | 'text') {
    setActiveSection('paginas')
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

  function handleWishlistItemDoubleClick(itemId: string, field: 'title' | 'text') {
    setActiveSection('paginas')
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

  function handleMasterDoubleClick(masterId: string) {
    setActiveSection('paginas')
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlEventId = urlParams.get("event_id")

    if (urlEventId) {
      setSavedEventId(urlEventId)

      // Always fetch from server — auto-save keeps the DB current so this is always safe.
      fetch(`/api/drafts/${urlEventId}`)
        .then((r) => r.json())
        .then(({ event, pages }: { event: Record<string, unknown>; pages: Array<{ type: string; content: Record<string, unknown>; is_enabled: boolean }> }) => {
          if (!event) { router.replace("/aanmaken"); return }

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

          const published = event.status === "published"
          setDraft(restoredDraft)
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
        .catch(() => router.replace("/aanmaken"))
      return
    }

    // No URL param — always load from server so every device sees the latest saved state.
    // localStorage is device-local and would show stale data on any other device.
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.replace("/aanmaken"); return }
      return fetch("/api/drafts").then(r => r.json()).then((events: Array<{ id: string }>) => {
        if (Array.isArray(events) && events.length > 0) {
          window.location.replace(`/bouwen?event_id=${events[0].id}`)
        } else {
          window.location.replace("/aanmaken")
        }
      })
    }).catch(() => window.location.replace("/aanmaken"))
  }, [router])

  useEffect(() => {
    function measure() {
      const el = canvasContainerRef.current
      if (!el) return
      const cw = viewport === "mobiel" ? 390 : 1024
      setCanvasScale(Math.min(1, Math.max(0.4, (el.clientWidth - 48) / cw)))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [viewport])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = canvasContainerRef.current
      if (!el) return
      const cw = viewport === "mobiel" ? 390 : 1024
      setCanvasScale(Math.min(1, Math.max(0.4, (el.clientWidth - 48) / cw)))
    })
    return () => cancelAnimationFrame(id)
  }, [viewport])

  // Auto-save: 2 seconds after the last user change, save to DB.
  // changeKey is incremented by every user-triggered state mutation.
  // changeKey === 0 means no user changes yet (only the initial server load happened).
  useEffect(() => {
    if (changeKey === 0 || !draft || !savedEventId) return
    const timer = setTimeout(async () => {
      if (savingRef.current) return // a manual save is already in progress
      savingRef.current = true
      setSaving(true)
      setSaveError(null)
      try {
        await doSave()
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 3000)
      } catch (err) {
        console.error("[auto-save] fout:", err)
        setSaveError(err instanceof Error ? err.message : "Automatisch opslaan mislukt")
      } finally {
        setSaving(false)
        savingRef.current = false
      }
    }, 2000)
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
      setHeroImageError("Gebruik een JPEG, PNG of WebP afbeelding. HEIC (iPhone) werkt niet in de browser — converteer het eerst.")
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
      setHeroImageError("Upload mislukt — controleer je verbinding en probeer opnieuw.")
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
      setStoryImageError("Upload mislukt — probeer opnieuw.")
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
      setFotosUploadError("Upload mislukt — controleer je verbinding en probeer opnieuw.")
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
      event_id: savedEventId ?? undefined,
      homepage_settings: hpSettings,
      pw_enabled: pwEnabled,
      pw_type: pwEnabled ? pwType : null,
      pw_value: pwEnabled && pwType === 'password' ? pwValue : null,
      pw_question: pwEnabled && pwType === 'secret_question' ? pwQuestion : null,
      pw_answer: pwEnabled && pwType === 'secret_question' ? pwAnswer : null,
    }
    console.log(
      "[save] verstuur naar /api/drafts",
      "| event_id:", payload.event_id,
      "| hero_image_url:", payload.hero_image_url,
      "| heroOverlay:", payload.heroOverlay,
      "| programma items:", (programmaItems).map((it) => ({ id: it.id, image_url: it.image_url })),
    )

    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    console.log("[save] /api/drafts response:", json)
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
      console.log("[publish] opgeslagen, navigeer naar betalen met event_id:", eventId)
      router.push(`/betalen?event_id=${eventId}`)
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

  async function handleDashboardClick() {
    if (!savedEventId) {
      setShowDashboardModal(true)
      return
    }
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { setShowAuthModal(true); return }
    setDashboardLoading(true)
    try {
      await doSave()
      router.push(`/dashboard?event_id=${savedEventId}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt")
      setDashboardLoading(false)
    }
  }

  async function handleDashboardModalSave() {
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { setShowDashboardModal(false); setShowAuthModal(true); return }
    setDashboardLoading(true)
    try {
      const { id } = await doSave()
      router.push(`/dashboard?event_id=${id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt")
      setDashboardLoading(false)
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
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

  const activePagesOrdered = PAGES.filter((p) => active[p.id])
  const eventName = draft?.naam || "Jullie bruiloft"
  const safeEventName = eventName.replace(/\n/g, " ")
  const eventDate = draft?.datum ? formatDate(draft.datum) : "Datum nog niet ingesteld"
  const eventLocatie = draft?.locatie || ""
  const typeLabel = draft?.type ? TYPE_LABEL[draft.type] : "Evenement"
  const heroOverlay = draft?.heroOverlay ?? true
  const storyOverlay = draft?.storyOverlay ?? true
  const homeContent: HomeContent = draft?.homeContent ?? { title: "", body: "", align: "center" }
  const navLayout = (draft?.navLayout ?? 'split') as 'stacked' | 'split' | 'left'
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
  const rsvpGuestTypes        = (content.RSVP?.guestTypes as string[] | undefined) ?? ["daggast", "avondgast"]
  const rsvpShowSong          = (content.RSVP?.showSongRequest as boolean) ?? false
  const rsvpShowOvernachting  = (content.RSVP?.showOvernachting as boolean) ?? false
  const rsvpCustomQuestion    = (content.RSVP?.customQuestion as string) ?? ""
  const rsvpCustomQuestion2   = (content.RSVP?.customQuestion2 as string) ?? ""
  const rsvpDeadline          = (content.RSVP?.deadline as string | null) ?? null
  const rsvpDeadlinePassed    = rsvpDeadline ? new Date() > new Date(rsvpDeadline) : false
  const RSVP_GUEST_LABELS: Record<string, string> = { daggast: "Daggast", avondgast: "Avondgast", receptiegast: "Receptiegast" }

  const isSinglePagePreview = hpSettings.pageMode === 'single'
  const activePageIds = new Set<string>(activePagesOrdered.map(p => p.id))
  const showSection = (id: string) => isSinglePagePreview ? activePageIds.has(id) : previewPage === id

  const Chevron = ({ open }: { open: boolean }) => (
    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div translate="no" className="min-h-screen md:h-screen flex flex-col bg-gray-50 font-sans antialiased md:overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-10">
        <span className="text-sm font-bold text-rose-600 tracking-tight sm:hidden">SayingYes</span>
        <span className="text-sm font-bold text-rose-600 tracking-tight hidden sm:block">SayingYes</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {/* Mijn Dashboard */}
            <button
              onClick={handleDashboardClick}
              disabled={dashboardLoading || anyUploading}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-50 disabled:opacity-50 text-amber-700 text-sm font-bold px-3 md:px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:translate-y-0 transition-all"
            >
              {dashboardLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              )}
              <span className="hidden sm:inline">Mijn Dashboard</span>
            </button>

            {/* Auto-save status — klikbaar als force-save of bij fout */}
            {anyUploading ? (
              <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm px-3 py-2.5">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploaden...
              </span>
            ) : saving ? (
              <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm px-3 py-2.5">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Opslaan...
              </span>
            ) : saveError ? (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-3 py-2.5 rounded-xl border border-red-200 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Opnieuw proberen
              </button>
            ) : justSaved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm px-3 py-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Opgeslagen
              </span>
            ) : changeKey > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm px-3 py-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Niet opgeslagen
              </span>
            ) : null}

            {/* Publiceren / Bekijk live site */}
            {isPublished ? (
              <a
                href={eventSiteUrl(slugPreview)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Bekijk live site
              </a>
            ) : (
              <button
                onClick={handlePublish}
                disabled={publishing || anyUploading}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-100 hover:shadow-lg hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 transition-all"
              >
                {publishing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Bezig...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Publiceren voor €24
                  </>
                )}
              </button>
            )}
          </div>
          {(publishError || saveError) && (
            <p className="text-xs text-red-500 font-medium">{publishError || saveError}</p>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 md:min-h-0">

        {/* ── Sidebar ── */}
        <aside className="w-full md:w-80 md:flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">

          {/* Mobile tip — only visible on small screens */}
          <div className="block md:hidden mx-4 mt-4 mb-1 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              ✨ <strong>Tip:</strong> Willen jullie het complete design live bekijken en de styling aanpassen? Open SayingYes dan op een desktop of laptop!
            </p>
          </div>


          {/* ── 3. URL & BEVEILIGING ── */}
          <div>
            <button
              onClick={() => setActiveSection(prev => prev === 'url' ? null : 'url')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">URL &amp; Beveiliging</span>
              <Chevron open={activeSection === 'url'} />
            </button>
            {activeSection === 'url' && (
              <div className="flex flex-col">

                {/* ── Jouw URL ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenUrlSection(prev => prev === 'url' ? null : 'url')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${openUrlSection === 'url' ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Jouw URL</span>
                  </button>
                  {openUrlSection === 'url' && (
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
                    <span className={`transition-transform duration-200 flex-shrink-0 ${openUrlSection === 'beveiliging' ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Beveiliging</span>
                  </button>
                  {openUrlSection === 'beveiliging' && (
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
                            <div className="flex rounded-xl overflow-hidden border border-gray-200">
                              <button
                                onClick={() => { setPwType('password'); setChangeKey(k => k + 1) }}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${pwType === 'password' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                              >
                                Wachtwoord
                              </button>
                              <button
                                onClick={() => { setPwType('secret_question'); setChangeKey(k => k + 1) }}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${pwType === 'secret_question' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
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
                                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
          <div className="border-b border-gray-100">
            <button
              onClick={() => setActiveSection(prev => prev === 'algemeen' ? null : 'algemeen')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Algemeen</span>
              <Chevron open={activeSection === 'algemeen'} />
            </button>
            {activeSection === 'algemeen' && (
              <div className="flex flex-col">

                {/* ── Stijl ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenAlgSection(prev => prev === 'stijl' ? null : 'stijl')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${openAlgSection === 'stijl' ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Stijl</span>
                  </button>
                  {openAlgSection === 'stijl' && (
                    <div className="px-5 pb-4 flex flex-col gap-2">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => saveStyle(s.id)}
                          className={`flex items-center gap-3 w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                            style === s.id
                              ? `${s.border} bg-gray-50 ring-2 ${s.active} ring-offset-1`
                              : `border-gray-100 hover:border-gray-200 hover:bg-gray-50`
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex-shrink-0 ${s.dot}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 leading-tight">{s.label}</p>
                            <p className="text-[10px] text-gray-400 truncate">{s.sub}</p>
                          </div>
                          {style === s.id && (
                            <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}

                      {/* Site breedte */}
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mt-2 mb-1">Breedte website</p>
                      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        {([
                          { value: 'boxed', label: 'Kader' },
                          { value: 'fullwidth', label: 'Volledig scherm' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateHpSettings({ siteLayout: opt.value })}
                            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                              hpSettings.siteLayout === opt.value
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Paginaweergave */}
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mt-3 mb-1">Paginaweergave</p>
                      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        {([
                          { value: 'multi', label: 'Aparte pagina\'s' },
                          { value: 'single', label: 'Alles op één pagina' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateHpSettings({ pageMode: opt.value })}
                            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                              hpSettings.pageMode === opt.value
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Navigatie ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenAlgSection(prev => prev === 'navigatie' ? null : 'navigatie')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${openAlgSection === 'navigatie' ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Navigatie</span>
                  </button>
                  {openAlgSection === 'navigatie' && (
                    <div className="px-5 pb-4 flex flex-col gap-3">
                      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        {(['left', 'split', 'stacked'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => updateDraft({ navLayout: opt })}
                            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                              navLayout === opt ? 'bg-rose-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {opt === 'left' ? 'Links' : opt === 'split' ? 'Verdeeld' : 'Gecentreerd'}
                          </button>
                        ))}
                      </div>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Navigatietitel</span>
                        <input
                          type="text"
                          value={draft?.nav_title ?? draft?.naam ?? ""}
                          onChange={(e) => updateDraft({ nav_title: e.target.value })}
                          placeholder="Bijv. Sanne & Tom"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                        />
                        <p className="text-[10px] text-gray-400 leading-snug">Naam in de menubalk van de website</p>
                      </label>
                    </div>
                  )}
                </div>

                {/* ── Basislettertype ── */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setOpenAlgSection(prev => prev === 'lettertype' ? null : 'lettertype')}
                    className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`transition-transform duration-200 flex-shrink-0 ${openAlgSection === 'lettertype' ? 'rotate-90' : ''}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800">Basislettertype</span>
                  </button>
                  {openAlgSection === 'lettertype' && (
                    <div className="px-5 pb-4 flex flex-col gap-2">
                      <FontSelect value={fontPageTitles} onChange={saveFontPageTitles} />
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Gebruikt voor paginatitels, sectiekoppen en namen. Lopende tekst volgt het stijlthema.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ── 2. PAGINA'S ── */}
          <div className="border-b border-gray-100 flex-1">
            <button
              onClick={() => setActiveSection(prev => prev === 'paginas' ? null : 'paginas')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Pagina&apos;s</span>
              <Chevron open={activeSection === 'paginas'} />
            </button>
            {activeSection === 'paginas' && (
              <div>
                {PAGES.map((page) => {
                  const isOn = active[page.id]
                  const isExpanded = activeSubPage === page.id && isOn
                  return (
                    <div key={page.id} className="border-t border-gray-100">
                      {/* Page row */}
                      <div className="flex items-center justify-between px-4 py-2.5">
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
                        </button>
                        {page.toggleable ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggle(page.id) }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${isOn ? "bg-pink-500" : "bg-gray-200"}`}
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
                                <span className={`transition-transform duration-200 flex-shrink-0 ${openHomeSection === 'layout' ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Lay-out</span>
                              </button>
                              {openHomeSection === 'layout' && (
                                <div className="px-5 pb-4 flex gap-2">
                                  {([
                                    { id: 'editorial', label: 'Kader',  sub: 'Layout 1' },
                                    { id: 'modern',    label: 'Modern', sub: 'Layout 2' },
                                  ] as const).map((opt) => (
                                    <button
                                      key={opt.id}
                                      onClick={() => updateHpSettings({ layout: opt.id })}
                                      className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                        hpSettings.layout === opt.id
                                          ? 'border-rose-400 bg-rose-50 text-rose-600 ring-2 ring-rose-200'
                                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                      }`}
                                    >
                                      <span className="font-bold">{opt.label}</span>
                                      <span className="text-[10px] font-normal opacity-70">{opt.sub}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* ── Headerfoto ── */}
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => setOpenHomeSection(prev => prev === 'headerfoto' ? null : 'headerfoto')}
                                className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className={`transition-transform duration-200 flex-shrink-0 ${openHomeSection === 'headerfoto' ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Headerfoto</span>
                              </button>
                              {openHomeSection === 'headerfoto' && (
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
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${heroOverlay ? "bg-pink-400" : "bg-gray-200"}`}
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
                                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors"
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
                                <span className={`transition-transform duration-200 flex-shrink-0 ${openHomeSection === 'kaders' ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Kaders</span>
                              </button>
                              {openHomeSection === 'kaders' && (
                                <div className="px-5 pb-4 flex flex-col gap-4">
                                  {hpSettings.layout === 'editorial' ? (
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-600">Kader activeren</span>
                                        <button
                                          onClick={() => updateDraft({ use_frame: !(draft?.use_frame ?? false) })}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft?.use_frame ? "bg-pink-500" : "bg-gray-200"}`}
                                        >
                                          <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${draft?.use_frame ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                      </div>
                                      {draft?.use_frame && (
                                        <div className="grid grid-cols-3 gap-2">
                                          {([
                                            { id: "gold-circle",     label: "Gold Cirkel",    file: "gold-circle.png.png"    },
                                            { id: "gold-diamond",    label: "Gold Ruit",      file: "gold-diamond.png.png"   },
                                            { id: "terra-circle",    label: "Terra Cirkel",   file: "terra-circle.png.png"   },
                                            { id: "terra-diamond",   label: "Terra Ruit",     file: "terra-diamond.png.png"  },
                                            { id: "earthy-circle",   label: "Earthy Cirkel",  file: "earthy-circle.png.png"  },
                                            { id: "earthy-diamond",  label: "Earthy Ruit",    file: "earthy-diamond.png.png" },
                                            { id: "bloem2-breed",    label: "Bloem 2 Breed",  file: "Bloem2-breed.png"       },
                                            { id: "olive-square",    label: "Olijf Vierkant", file: "olive-square.png.png"   },
                                            { id: "bloem-rechthoek", label: "Bloem Breed",    file: "Bloem-rechthoek.png"    },
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
                                                  <div className="absolute inset-0 bg-rose-500 bg-opacity-10 flex items-center justify-center">
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
                                    <p className="text-xs text-gray-400 leading-relaxed">Kaders zijn beschikbaar bij Lay-out &ldquo;Kader&rdquo;.</p>
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
                                <span className={`transition-transform duration-200 flex-shrink-0 ${openHomeSection === 'tekstvelden' ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Tekstvelden</span>
                              </button>
                              {openHomeSection === 'tekstvelden' && (
                                <div className="px-5 pb-4 flex flex-col gap-4">

                                  {/* Hoofdtitel */}
                                  <div id="hp-field-hoofdtitel" className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-gray-600">Hoofdtitel</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => updateHpSettings({ hoofdtitelVisible: !hpSettings.hoofdtitelVisible })}
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.hoofdtitelVisible ? 'bg-pink-400' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.hoofdtitelVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'hoofdtitel' ? 'bg-rose-50 text-rose-400' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={draft?.naam ?? ""}
                                      onChange={(e) => updateDraft({ naam: e.target.value })}
                                      onFocus={() => setHpOpenGear('hoofdtitel')}
                                      placeholder="Bijv. Bruiloft Michiel & Lisa"
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                                    />
                                    {hpOpenGear === 'hoofdtitel' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-gray-200">
                                        <FontSelect value={hpSettings.hoofdtitelFont} onChange={(v) => updateHpSettings({ hoofdtitelFont: v })} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{hpSettings.hoofdtitelSize}rem</span>
                                        </div>
                                        <input type="range" min={2} max={10} step={0.25} value={hpSettings.hoofdtitelSize} onChange={(e) => updateHpSettings({ hoofdtitelSize: Number(e.target.value) })} className="w-full accent-rose-400" />
                                        {heroImageUrl && (
                                          <>
                                            <p className="text-xs text-gray-500 mt-1">Positie</p>
                                            <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                                              {([
                                                { id: 'over',  label: 'Over foto'  },
                                                { id: 'under', label: hpSettings.layout === 'modern' ? 'In tekstvlak' : 'Onder foto' },
                                              ] as const).map((opt) => (
                                                <button
                                                  key={opt.id}
                                                  onClick={() => updateHpSettings({ titlePosition: opt.id })}
                                                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${hpSettings.titlePosition === opt.id ? 'bg-rose-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
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
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.subtitleVisible ? 'bg-pink-400' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.subtitleVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'subtitle' ? 'bg-rose-50 text-rose-400' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={hpSettings.subtitleText}
                                      onChange={(e) => updateHpSettings({ subtitleText: e.target.value })}
                                      onFocus={() => setHpOpenGear('subtitle')}
                                      placeholder="bijv. Samen vieren we de liefde"
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                                    />
                                    {hpOpenGear === 'subtitle' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-gray-200">
                                        <FontSelect value={hpSettings.subtitleFont} onChange={(v) => updateHpSettings({ subtitleFont: v })} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{hpSettings.subtitleSize}rem</span>
                                        </div>
                                        <input type="range" min={0.7} max={5} step={0.1} value={hpSettings.subtitleSize} onChange={(e) => updateHpSettings({ subtitleSize: Number(e.target.value) })} className="w-full accent-rose-400" />
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
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.initialsVisible ? 'bg-pink-400' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.initialsVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'initialen' ? 'bg-rose-50 text-rose-400' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={draft?.initials ?? ""}
                                      onChange={(e) => updateDraft({ initials: e.target.value })}
                                      onFocus={() => setHpOpenGear('initialen')}
                                      placeholder="bijv. M | W"
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                                    />
                                    {hpOpenGear === 'initialen' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-gray-200">
                                        <FontSelect value={fontInitials} onChange={saveFontInitials} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{draft?.frameInitialsSize ?? 8}</span>
                                        </div>
                                        <input type="range" min={4} max={18} step={0.5} value={draft?.frameInitialsSize ?? 8} onChange={(e) => updateDraft({ frameInitialsSize: Number(e.target.value) })} className="w-full accent-rose-400" />
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
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.frameNamesVisible ? 'bg-pink-400' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.frameNamesVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'namen' ? 'bg-rose-50 text-rose-400' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={draft?.frame_names ?? ""}
                                      onChange={(e) => updateDraft({ frame_names: e.target.value })}
                                      onFocus={() => setHpOpenGear('namen')}
                                      placeholder={"bijv. Michiel\n& Lindsey"}
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
                                    />
                                    {hpOpenGear === 'namen' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-gray-200">
                                        <FontSelect value={fontFrameNames} onChange={saveFontFrameNames} />
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500">Grootte</span>
                                          <span className="text-xs text-gray-400">{draft?.frameNamesSize ?? 5.5}</span>
                                        </div>
                                        <input type="range" min={2} max={13} step={0.5} value={draft?.frameNamesSize ?? 5.5} onChange={(e) => updateDraft({ frameNamesSize: Number(e.target.value) })} className="w-full accent-rose-400" />
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
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.datumVisible ? 'bg-pink-400' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.datumVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'datum' ? 'bg-rose-50 text-rose-400' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="date"
                                      value={draft?.datum ?? ""}
                                      onChange={(e) => updateDraft({ datum: e.target.value })}
                                      onFocus={() => setHpOpenGear('datum')}
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                                    />
                                    {hpOpenGear === 'datum' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-gray-200">
                                        <FontSelect value={hpSettings.datumFont} onChange={(v) => updateHpSettings({ datumFont: v })} />
                                        {draft?.use_frame ? (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte in kader</span>
                                              <span className="text-xs text-gray-400">{draft?.frameDateSize ?? 1.8}</span>
                                            </div>
                                            <input type="range" min={0.3} max={6} step={0.1} value={draft?.frameDateSize ?? 1.8} onChange={(e) => updateDraft({ frameDateSize: Number(e.target.value) })} className="w-full accent-rose-400" />
                                          </>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte</span>
                                              <span className="text-xs text-gray-400">{hpSettings.datumSize}rem</span>
                                            </div>
                                            <input type="range" min={0.7} max={3} step={0.1} value={hpSettings.datumSize} onChange={(e) => updateHpSettings({ datumSize: Number(e.target.value) })} className="w-full accent-rose-400" />
                                          </>
                                        )}
                                        <div className="flex flex-col gap-1">
                                          <span className="text-xs text-gray-500">Notatie</span>
                                          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                                            <button
                                              onClick={() => updateHpSettings({ datumNotatie: 'uitgeschreven' })}
                                              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${(hpSettings.datumNotatie ?? 'uitgeschreven') === 'uitgeschreven' ? 'bg-rose-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                              Optie 1
                                            </button>
                                            <button
                                              onClick={() => updateHpSettings({ datumNotatie: 'numeriek' })}
                                              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${(hpSettings.datumNotatie ?? 'uitgeschreven') === 'numeriek' ? 'bg-rose-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
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
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hpSettings.locatieVisible ? 'bg-pink-400' : 'bg-gray-200'}`}
                                        >
                                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${hpSettings.locatieVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${hpOpenGear === 'locatie' ? 'bg-rose-50 text-rose-400' : 'text-gray-300'}`}>Aa</span>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={draft?.frame_location ?? ""}
                                      onChange={(e) => updateDraft({ frame_location: e.target.value })}
                                      onFocus={() => setHpOpenGear('locatie')}
                                      placeholder="bijv. Kasteel de Haar"
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                                    />
                                    {hpOpenGear === 'locatie' && (
                                      <div className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-gray-200">
                                        <FontSelect value={hpSettings.locatieFont} onChange={(v) => updateHpSettings({ locatieFont: v })} />
                                        {draft?.use_frame ? (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte in kader</span>
                                              <span className="text-xs text-gray-400">{draft?.frameLocationSize ?? 1.8}</span>
                                            </div>
                                            <input type="range" min={0.3} max={6} step={0.1} value={draft?.frameLocationSize ?? 1.8} onChange={(e) => updateDraft({ frameLocationSize: Number(e.target.value) })} className="w-full accent-rose-400" />
                                          </>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-gray-500">Grootte</span>
                                              <span className="text-xs text-gray-400">{hpSettings.locatieSize}rem</span>
                                            </div>
                                            <input type="range" min={0.7} max={3} step={0.1} value={hpSettings.locatieSize} onChange={(e) => updateHpSettings({ locatieSize: Number(e.target.value) })} className="w-full accent-rose-400" />
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
                                <span className={`transition-transform duration-200 flex-shrink-0 ${openHomeSection === 'welkomst' ? 'rotate-90' : ''}`}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                                <span className="text-sm font-medium text-gray-800">Welkomstbericht</span>
                              </button>
                              {openHomeSection === 'welkomst' && (
                                <div className="px-5 pb-4 flex flex-col gap-3">
                                  <div id="hp-field-welkomst-titel" className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Titel</span>
                                    <input
                                      type="text"
                                      value={homeContent.title}
                                      onChange={(e) => updateDraft({ homeContent: { ...homeContent, title: e.target.value } })}
                                      placeholder="Optionele titel"
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Grootte</span>
                                      <span className="text-xs text-gray-400">{homeContent.titleSize ?? 1.0}rem</span>
                                    </div>
                                    <input type="range" min={0.7} max={3} step={0.05} value={homeContent.titleSize ?? 1.0} onChange={(e) => updateDraft({ homeContent: { ...homeContent, titleSize: Number(e.target.value) } })} className="w-full accent-rose-400" />
                                  </div>
                                  <div id="hp-field-welkomst-tekst" className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Tekst</span>
                                    <textarea
                                      rows={5}
                                      value={homeContent.body}
                                      onChange={(e) => updateDraft({ homeContent: { ...homeContent, body: e.target.value } })}
                                      placeholder="Schrijf een welkomstbericht voor je gasten..."
                                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Grootte</span>
                                      <span className="text-xs text-gray-400">{homeContent.bodySize ?? 0.9375}rem</span>
                                    </div>
                                    <input type="range" min={0.7} max={2.5} step={0.05} value={homeContent.bodySize ?? 0.9375} onChange={(e) => updateDraft({ homeContent: { ...homeContent, bodySize: Number(e.target.value) } })} className="w-full accent-rose-400" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Uitlijning</span>
                                    <div className="flex gap-1.5">
                                      {(["left", "center", "right"] as const).map((a) => (
                                        <button
                                          key={a}
                                          onClick={() => updateDraft({ homeContent: { ...homeContent, align: a } })}
                                          className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all ${homeContent.align === a ? "border-rose-300 bg-rose-50 text-rose-600" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
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
                                  rows={4}
                                  value={typeof content.Ceremoniemeesters?.text === "string" ? content.Ceremoniemeesters.text : ""}
                                  onChange={(e) => updateContent("Ceremoniemeesters", { ...(content.Ceremoniemeesters ?? {}), text: e.target.value })}
                                  placeholder="Optionele tekst onderaan de pagina..."
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none leading-relaxed"
                                />
                              </div>
                            </div>
                          )}

                          {/* ── Programma controls ── */}
                          {page.id === 'Programma' && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Weergave</p>
                              <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-5">
                                {(["timeline", "centered"] as const).map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => updateContent("Programma", { items: programmaItems, layout: opt })}
                                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                                      programLayout === opt ? "bg-rose-500 text-white" : "text-gray-500 hover:bg-gray-50"
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
                                          className="rounded-lg border border-gray-200 px-1.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 bg-white cursor-pointer"
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
                                          className="rounded-lg border border-gray-200 px-1.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 bg-white cursor-pointer"
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
                                            ? "border-rose-400 bg-rose-50 text-rose-600"
                                            : "border-gray-200 bg-white text-gray-500 hover:border-rose-300 hover:text-rose-500"
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
                                            className="text-xs font-semibold px-2 py-0.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded transition-colors"
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
                                                ? "bg-rose-50 text-rose-500"
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
                                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                                    />
                                    <textarea
                                      rows={2}
                                      value={item.description}
                                      onChange={(e) => {
                                        const updated = [...programmaItems]
                                        updated[i] = { ...updated[i], description: e.target.value }
                                        updateContent("Programma", { items: updated, layout: programLayout })
                                      }}
                                      placeholder="Beschrijving..."
                                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
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
                                    placeholder="Laat weten of je erbij bent — vul het formulier in."
                                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
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
                                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
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
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${storyOverlay ? "bg-pink-400" : "bg-gray-200"}`}
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
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:border-rose-300 hover:text-rose-500 disabled:opacity-50 transition-colors"
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
                                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                                />
                              </label>
                              <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-gray-600">Introductietekst <span className="font-normal text-gray-400">(optioneel)</span></span>
                                <textarea
                                  rows={2}
                                  value={(content.Fotos?.intro as string) ?? ""}
                                  onChange={(e) => updateContent("Fotos", { ...(content.Fotos ?? {}), intro: e.target.value })}
                                  placeholder="Bijv. Geniet hier na van de foto's van onze mooie dag."
                                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
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
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* ── Main panel ── hidden on mobile, visible on desktop ── */}
        <main className="hidden md:flex flex-1 flex-col overflow-hidden bg-gray-100">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live preview</p>
            <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-0.5">
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
              <div ref={canvasContainerRef} className="flex-1 overflow-y-auto bg-gray-100 p-6">
                <div className="mx-auto" style={{ width: `${Math.round(canvasWidth * canvasScale * zoomMultiplier)}px` }}>
                  <div style={{ width: canvasWidth, transform: `scale(${canvasScale * zoomMultiplier})`, transformOrigin: "top left" }}>
                    <div className="rounded-2xl shadow-xl overflow-clip relative" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily, letterSpacing: sc.bodyLetterSpacing, fontWeight: sc.bodyFontWeight }}>
                      {sc.fontImport && <style>{sc.fontImport}</style>}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400">
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
                          }
                        }}
                        singlePage={isSinglePagePreview}
                      />
                      <div style={isSinglePagePreview ? { display: "flex", flexDirection: "column" } : undefined}>
                      {showSection("Home") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Home") } : undefined}>
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
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Ceremoniemeesters") } : undefined}>
                        <EventMastersPreview
                          masters={mastersForPreview}
                          sc={sc}
                          text={typeof content.Ceremoniemeesters?.text === "string" ? content.Ceremoniemeesters.text : undefined}
                          onMasterDoubleClick={handleMasterDoubleClick}
                        />
                        </div>
                      )}
                      {showSection("OnsVerhaal") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "OnsVerhaal") } : undefined}>
                        <StoryPreview
                          title={(content.OnsVerhaal?.title as string) ?? "Ons Verhaal"}
                          text={(content.OnsVerhaal?.text as string) ?? null}
                          imageUrl={storyImageBlob ?? ((content.OnsVerhaal?.image_url as string) || null)}
                          imagePosX={(content.OnsVerhaal?.image_pos_x as number) ?? 50}
                          imagePosY={(content.OnsVerhaal?.image_pos_y as number) ?? 50}
                          showOverlay={storyOverlay}
                          editable={true}
                          onPositionChange={(x, y) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), image_pos_x: x, image_pos_y: y })}
                          onFieldDoubleClick={handleStoryFieldDoubleClick}
                          sc={sc}
                        />
                        </div>
                      )}
                      {showSection("Programma") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Programma") } : undefined}>
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
                          onItemDoubleClick={handleProgramItemDoubleClick}
                        />
                        </div>
                      )}
                      {showSection("RSVP") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "RSVP") } : undefined}>
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
                          <h2 className="text-2xl mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight }}>RSVP</h2>
                          <div className="flex flex-col gap-6 max-w-lg">
                            <p className="text-sm" style={{ color: sc.bodyText }}>{(content.RSVP?.text as string) || "Laat weten of je erbij bent — vul het formulier in."}</p>
                            {rsvpDeadlinePassed ? (
                              <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                                <div className="text-sm font-bold text-gray-700 mb-1">Aanmelden is gesloten</div>
                                <div className="text-xs text-gray-500">De uiterste RSVP-datum is verstreken.</div>
                              </div>
                            ) : (
                              <>
                                {/* Ben je erbij? */}
                                <div>
                                  <div className="text-sm font-semibold mb-3" style={{ color: sc.bodyText }}>Ben je erbij?</div>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center gap-3"
                                      style={{ backgroundColor: "#ecfdf5", border: "2px solid #10b981", color: "#065f46" }}>
                                      <span>✓</span> Ja, ik ben erbij!
                                    </div>
                                    <div className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center gap-3"
                                      style={{ backgroundColor: "#f9fafb", border: "2px solid #e5e7eb", color: "#6b7280" }}>
                                      <span>✕</span> Nee, ik kan helaas niet komen.
                                    </div>
                                  </div>
                                </div>
                                {/* Aantal personen */}
                                <div>
                                  <div className="text-sm font-semibold mb-3" style={{ color: sc.bodyText }}>Met hoeveel personen komen jullie?</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {[1,2,3,4,5,6,7,8].map((n) => (
                                      <div key={n} className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                        style={n === 1
                                          ? { backgroundColor: sc.accent, color: "#fff", border: `2px solid ${sc.accent}` }
                                          : { backgroundColor: "transparent", color: "#6b7280", border: "2px solid #e5e7eb" }
                                        }>
                                        {n}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Hoofdgast card */}
                                <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Hoofdgast</div>
                                  <div>
                                    <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Naam *</div>
                                    <div className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 flex items-center shadow-sm">
                                      <span className="text-sm text-gray-400">Voornaam</span>
                                    </div>
                                  </div>
                                  {rsvpGuestTypes.length > 1 && (
                                    <div>
                                      <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Type gast</div>
                                      <div className="flex gap-2 flex-wrap">
                                        {rsvpGuestTypes.map((t, ti) => (
                                          <div key={t} className="flex-1 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
                                            style={ti === 0
                                              ? { backgroundColor: sc.accent, color: "#fff", border: `2px solid ${sc.accent}` }
                                              : { backgroundColor: "transparent", color: "#6b7280", border: "2px solid #e5e7eb" }
                                            }>
                                            {RSVP_GUEST_LABELS[t] ?? t}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Dieetwensen / Allergieën</div>
                                    <div className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 flex items-center shadow-sm">
                                      <span className="text-sm text-gray-400">Bijv. vegetarisch, notenallergie</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>E-mailadres *</div>
                                    <div className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 flex items-center shadow-sm">
                                      <span className="text-sm text-gray-400">jouw@email.nl</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Song request */}
                                {rsvpShowSong && (
                                  <div>
                                    <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>
                                      Welk nummer brengt jou gegarandeerd naar de dansvloer?{" "}
                                      <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optioneel)</span>
                                    </div>
                                    <div className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 flex items-center shadow-sm">
                                      <span className="text-sm text-gray-400">Artiest — Nummertitel</span>
                                    </div>
                                  </div>
                                )}
                                {/* Overnachting */}
                                {rsvpShowOvernachting && (
                                  <PreviewYesNo label="Blijven jullie overnachten?" />
                                )}
                                {/* Eigen vraag 1 */}
                                {rsvpCustomQuestion.trim() && (
                                  <PreviewYesNo label={rsvpCustomQuestion} />
                                )}
                                {/* Eigen vraag 2 */}
                                {rsvpCustomQuestion2.trim() && (
                                  <PreviewYesNo label={rsvpCustomQuestion2} />
                                )}
                                {/* Aanmelden knop */}
                                <div className="w-full h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-md"
                                  style={{ backgroundColor: sc.accent, color: "#fff" }}>
                                  Aanmelden
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        </div>
                      )}
                      {showSection("Informatie") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Informatie") } : undefined}>
                        <PraktischPreview tiles={praktischTiles ?? []} sc={sc} onTileDoubleClick={handleInfoTileDoubleClick} />
                        </div>
                      )}
                      {showSection("Cadeautips") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Cadeautips") } : undefined}>
                        <WishlistPreview items={wishlistItems?.length ? wishlistItems : DEFAULT_WISHLIST_ITEMS} sc={sc} onItemDoubleClick={handleWishlistItemDoubleClick} />
                        </div>
                      )}
                      {showSection("Fotos") && (
                        <div style={isSinglePagePreview ? { order: activePagesOrdered.findIndex(p => p.id === "Fotos") } : undefined}>
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
                    <p className="text-center text-xs text-gray-400 mt-3">Dit is precies hoe jouw site eruitziet</p>
                  </div>
                </div>
              </div>

          </div>
        </main>
      </div>

      {/* ── Auth modal ── */}
      {showDashboardModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDashboardModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#fef3c7" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "#b45309" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 text-center mb-2">Ontgrendel je Gasten Dashboard!</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              Sla je website gratis op om direct toegang te krijgen tot je persoonlijke dashboard. Daar kun je straks je gastenlijst beheren en RSVP&apos;s bijhouden!
            </p>
            <button
              onClick={handleDashboardModalSave}
              disabled={dashboardLoading}
              className="w-full font-bold py-3 rounded-xl text-sm transition-colors mb-2 disabled:opacity-60"
              style={{ backgroundColor: "#b45309", color: "#fff" }}
              onMouseEnter={(e) => { if (!dashboardLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#92400e" }}
              onMouseLeave={(e) => { if (!dashboardLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#b45309" }}
            >
              {dashboardLoading ? "Opslaan..." : "Nu Opslaan & Doorgaan"}
            </button>
            <button
              onClick={() => setShowDashboardModal(false)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { if (!authSent) { setShowAuthModal(false); setSaveError(null) } }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {authSent ? (
              <>
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 text-center mb-2">Controleer je inbox</h3>
                <p className="text-sm text-gray-500 text-center mb-4 leading-relaxed">
                  We hebben een inloglink gestuurd naar <strong className="text-gray-800">{authEmail}</strong>.
                  Klik op de link, kom dan terug naar deze pagina en klik nogmaals op <strong>Opslaan</strong>.
                </p>
                <button
                  onClick={() => { setShowAuthModal(false); setAuthSent(false); setAuthEmail("") }}
                  className="w-full text-center text-sm text-rose-500 hover:underline font-medium"
                >
                  Sluiten
                </button>
                <button
                  onClick={() => { setAuthSent(false); localStorage.removeItem("sayingyes_pending_save") }}
                  className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                  E-mailadres verkeerd gespeld? Klik hier om aan te passen.
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1.5">Opslaan vereist een account</h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  Vul je e-mailadres in om een magische inloglink te ontvangen — geen wachtwoord nodig.
                </p>
                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    {authLoading ? "Bezig..." : "Stuur inloglink"}
                  </button>
                </form>
                <button
                  onClick={() => { setShowAuthModal(false); setSaveError(null) }}
                  className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600"
                >
                  Annuleren
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewYesNo({ label }: { label: string }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>{label}</div>
      <div className="flex gap-2">
        {["Ja", "Nee"].map((lbl) => (
          <div key={lbl} className="flex-1 h-11 rounded-xl flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: "#f9fafb", border: "2px solid #e5e7eb", color: "#6b7280" }}>
            {lbl}
          </div>
        ))}
      </div>
    </div>
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
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
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
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
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
        <input type="text" placeholder="14:00" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" />
        <input type="text" placeholder="Beschrijving" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" />
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
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-4 text-gray-400 hover:border-rose-300 hover:text-rose-500 disabled:opacity-50 transition-colors"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
          {/* Telefoon */}
          <input
            type="tel"
            value={master.telefoon}
            onChange={(e) => update(master.id!, { telefoon: e.target.value })}
            placeholder="+31 6 12345678"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
          {/* E-mail */}
          <input
            type="email"
            value={master.email}
            onChange={(e) => update(master.id!, { email: e.target.value })}
            placeholder="naam@voorbeeld.nl"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
          {/* Rij 2: Icoon-picker + Verwijder */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setOpenPickerId(openPickerId === item.id ? null : item.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                openPickerId === item.id
                  ? "border-rose-400 bg-rose-50 text-rose-600"
                  : "border-gray-200 bg-white text-gray-500 hover:border-rose-300 hover:text-rose-500"
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
                      ? "bg-rose-50 text-rose-500"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
          {/* Rij 2: Icoon-picker + Verwijder */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setOpenPickerId(openPickerId === tile.id ? null : tile.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                openPickerId === tile.id
                  ? "border-rose-400 bg-rose-50 text-rose-600"
                  : "border-gray-200 bg-white text-gray-500 hover:border-rose-300 hover:text-rose-500"
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
                      ? "bg-rose-50 text-rose-500"
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Informatieblok toevoegen
      </button>
    </div>
  )
}
