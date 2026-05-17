"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import EventHomePreview from "@/components/EventHomePreview"
import EventNav from "@/app/events/[slug]/event-nav"
import PraktischPreview, { DEFAULT_PRAKTISCH_TILES, type PraktischTile } from "@/components/PraktischPreview"
import WishlistPreview, { DEFAULT_WISHLIST_ITEMS, type WishlistItem } from "@/components/WishlistPreview"
import EventMastersPreview from "@/components/EventMastersPreview"
import EventProgramPreview, { PROGRAM_ICONS, ProgramIcon } from "@/components/EventProgramPreview"
import StoryPreview from "@/components/StoryPreview"
import { formatDate } from "@/lib/event-styles"
import { createClient } from "@/lib/supabase"

type EventType = "bruiloft" | "verjaardag" | "evenement"
type PageId = "Home" | "Programma" | "RSVP" | "Informatie" | "Cadeautips" | "Fotos" | "Ceremoniemeesters" | "OnsVerhaal"
type Style = "roze" | "ivoor" | "zand" | "earthy"
type Viewport = "desktop" | "mobiel"
type Align = "left" | "center" | "right"

interface HomeContent {
  title: string
  body: string   // HTML from contenteditable
  align: Align
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
  heroOverlay?: boolean
  storyOverlay?: boolean
  homeContent?: HomeContent
  navLayout?: 'stacked' | 'split' | 'left'
  use_frame?: boolean
  frame_style?: string
  initials?: string
  frame_names?: string
  frame_location?: string
  naam1?: string
  naam2?: string
  hero_image_pos_x?: number
  hero_image_pos_y?: number
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
  { id: "ivoor",  label: "Pampas & Pearl",    sub: "Salie, crème & goud",       dot: "bg-[#C2B8A3]",    border: "border-[#C2B8A3]/60",    active: "ring-[#C2B8A3]"     },
  { id: "roze",   label: "Terracotta & Gold", sub: "Warm, modern & feestelijk", dot: "bg-[#C86F59]",    border: "border-[#C86F59]/40",    active: "ring-[#C86F59]"     },
  { id: "earthy", label: "Earthy & Warm",     sub: "Diep, aards & gedurfd",     dot: "bg-[#8B5E3C]",    border: "border-[#8B5E3C]/40",    active: "ring-[#8B5E3C]"     },
]

const STYLE_CONFIG = {
  roze: {
    accent: "#E8627A",
    heroGradient: "linear-gradient(135deg, #fff0f3, #fce7e7, #fff5ee)",
    fontFamily: "Inter, sans-serif",
    nameFont: null as string | null,
    navBg: "#ffffff",
    navText: "#374151",
    headingColor: "#1a1a1a",
    bodyText: "#4b5563",
    buttonBg: "#E8627A",
    buttonText: "#ffffff",
    labelColor: "#E8627A",
    bodyBg: "#f1f5f9",
    floral: false as boolean,
    fontImport: null as string | null,
  },
  ivoor: {
    accent: "#8B7355",
    heroGradient: "linear-gradient(160deg, #FDFAF5 0%, #F5EDE0 55%, #EDE0CF 100%)",
    fontFamily: "'Cormorant Garamond', serif",
    nameFont: null as string | null,
    navBg: "#FDFAF5",
    navText: "#4A3E30",
    headingColor: "#2D2217",
    bodyText: "#6B5E4F",
    buttonBg: "#7A9478",
    buttonText: "#ffffff",
    labelColor: "#C4A265",
    bodyBg: "#EDE7DC",
    floral: true as boolean,
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');",
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
    floral: false as boolean,
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Pinyon+Script&display=swap');",
  },
  earthy: {
    accent: "#A0785A",
    heroGradient: "linear-gradient(135deg, #FAF5EE, #F0E6D8, #E8D9C8)",
    fontFamily: "Inter, sans-serif",
    nameFont: null as string | null,
    navBg: "#FAF7F2",
    navText: "#3D2B1F",
    headingColor: "#2C1A0E",
    bodyText: "#5C4033",
    buttonBg: "#A0785A",
    buttonText: "#ffffff",
    labelColor: "#A0785A",
    bodyBg: "#F0E8DC",
    floral: false as boolean,
    fontImport: null as string | null,
  },
} as const

const PAGES: PageConfig[] = [
  { id: "Home",               label: "Home",               toggleable: false },
  { id: "OnsVerhaal",         label: "Ons Verhaal",        toggleable: true  },
  { id: "Programma",          label: "Programma",          toggleable: true  },
  { id: "Informatie",          label: "Informatie",         toggleable: true  },
  { id: "Cadeautips",           label: "Cadeautips",         toggleable: true  },
  { id: "Ceremoniemeesters",  label: "Ceremoniemeesters",  toggleable: true  },
  { id: "RSVP",               label: "RSVP",               toggleable: false },
  { id: "Fotos",              label: "Foto's",             toggleable: true  },
]

const CONTROLS_PAGES = new Set<PageId>(["Home", "Ceremoniemeesters", "Programma", "RSVP", "OnsVerhaal", "Informatie", "Cadeautips"])

const TYPE_LABEL: Record<EventType, string> = {
  bruiloft: "Bruiloft", verjaardag: "Verjaardag", evenement: "Evenement",
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BouwenPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storyFileInputRef = useRef<HTMLInputElement>(null)

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [storyImageBlob, setStoryImageBlob] = useState<string | null>(null)
  const [storyUploading, setStoryUploading] = useState(false)
  const [storyImageError, setStoryImageError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [active, setActive] = useState<Record<PageId, boolean>>({
    Home: true, Programma: true, RSVP: true, Informatie: false, Cadeautips: false, Fotos: false, Ceremoniemeesters: false, OnsVerhaal: false,
  })
  const [previewPage, setPreviewPage] = useState<PageId>("Home")
  const [editingPage, setEditingPage] = useState<PageId | null>(null)
  const [content, setContent] = useState<ContentMap>({})
  const [style, setStyle] = useState<Style>("zand")
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [heroImageError, setHeroImageError] = useState<string | null>(null)
  const [isEditingControls, setIsEditingControls] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [zoomMultiplier, setZoomMultiplier] = useState(1)
  const [openIconPickerIdx, setOpenIconPickerIdx] = useState<number | null>(null)
  const [programUploadingIds, setProgramUploadingIds] = useState<Set<string>>(new Set())
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
  const [autoSavePending, setAutoSavePending] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlEventId = urlParams.get("event_id")

    if (urlEventId) {
      // Load full event from server, overwriting any stale localStorage
      setSavedEventId(urlEventId)
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
            navLayout: (event.nav_layout as Draft["navLayout"]) ?? "split",
            use_frame: (event.use_frame as boolean) ?? false,
            frame_style: (event.frame_style as string) ?? undefined,
            initials: (event.initials as string) ?? undefined,
            frame_names: (event.frame_names as string) ?? undefined,
            frame_location: (event.frame_location as string) ?? undefined,
            hero_image_pos_x: (event.hero_image_pos_x as number) ?? 50,
            hero_image_pos_y: (event.hero_image_pos_y as number) ?? 50,
            homeContent: restoredHomeContent,
          }

          setDraft(restoredDraft)
          setStyle(((event.style as string) || "zand") as Style)
          setContent(newContent)
          setActive(newActive)
          const heroUrl = event.hero_image_url as string | null
          if (heroUrl) {
            setHeroImageUrl(heroUrl)
            localStorage.setItem("sayingyes_hero_image_url", heroUrl)
          }

          localStorage.setItem("sayingyes_draft", JSON.stringify(restoredDraft))
          localStorage.setItem("sayingyes_content", JSON.stringify(newContent))
          localStorage.setItem("sayingyes_active", JSON.stringify(newActive))
          localStorage.setItem("sayingyes_saved_event_id", urlEventId)
        })
        .catch(() => router.replace("/aanmaken"))
      return
    }

    // No URL param — load from localStorage as usual
    try {
      const raw = localStorage.getItem("sayingyes_draft")
      if (!raw) { router.replace("/aanmaken"); return }
      const parsed = JSON.parse(raw)
      setDraft(parsed)
      if (parsed.style) setStyle(parsed.style as Style)
    } catch { router.replace("/aanmaken") }

    try {
      const saved = localStorage.getItem("sayingyes_content")
      if (saved) setContent(JSON.parse(saved))
    } catch {}

    try {
      const savedHero = localStorage.getItem("sayingyes_hero_image_url")
      if (savedHero) setHeroImageUrl(savedHero)
    } catch {}

    try {
      const savedActive = localStorage.getItem("sayingyes_active")
      if (savedActive) setActive(JSON.parse(savedActive))
    } catch {}

    const savedId = localStorage.getItem("sayingyes_saved_event_id")
    if (savedId) setSavedEventId(savedId)

    if (localStorage.getItem("sayingyes_pending_save") === "1") {
      localStorage.removeItem("sayingyes_pending_save")
      setAutoSavePending(true)
    }
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
  }, [isEditingControls, viewport])

  useEffect(() => {
    if (!autoSavePending || !draft) return
    setAutoSavePending(false)
    ;(async () => {
      const { data: { user } } = await createClient().auth.getUser()
      if (!user) return
      await performSave()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSavePending, draft])

  function updateDraft(fields: Partial<Draft>) {
    setDraft((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...fields }
      localStorage.setItem("sayingyes_draft", JSON.stringify(next))
      return next
    })
  }

  function updateContent(pageId: PageId, value: Record<string, unknown>) {
    setContent((prev) => {
      const next = { ...prev, [pageId]: value }
      localStorage.setItem("sayingyes_content", JSON.stringify(next))
      return next
    })
  }

  function saveStyle(s: Style) {
    setStyle(s)
    updateDraft({ style: s })
  }

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
      localStorage.setItem("sayingyes_hero_image_url", url)
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

  function toggle(id: PageId) {
    setActive((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem("sayingyes_active", JSON.stringify(next))
      if (!next[previewPage]) {
        const fallback = PAGES.find((p) => next[p.id])
        if (fallback) setPreviewPage(fallback.id)
      }
      if (editingPage === id && !next[id]) setEditingPage(null)
      return next
    })
  }

  function openEditor(id: PageId) {
    setPreviewPage(id)
    if (!CONTROLS_PAGES.has(id)) setEditingPage(id)
  }

  // ── Shared core: stuurt opgeslagen state op via /api/drafts ─────────────────
  // Alle foto-uploads zijn al gedaan in de upload-handlers (immediate upload).
  // doSave() hoeft alleen de huidige state te lezen en naar de API te sturen.
  async function doSave(): Promise<{ id: string; slug: string }> {
    if (!draft) throw new Error("Geen draft beschikbaar")

    const activePages = PAGES.filter((p) => active[p.id]).map((p) => p.id)

    // Hero: gebruik de permanente URL; blob-URL betekent upload nog bezig of mislukt
    const persistedHero = typeof window !== "undefined" ? localStorage.getItem("sayingyes_hero_image_url") : null
    const heroUrl: string | null =
      (heroImageUrl && !heroImageUrl.startsWith("blob:") ? heroImageUrl : null)
      ?? (persistedHero && !persistedHero.startsWith("blob:") ? persistedHero : null)

    const mergedContent: ContentMap = {
      ...content,
      Home: {
        ...(content.Home ?? {}),
        title: homeContent.title,
        body: homeContent.body,
        align: homeContent.align,
      },
      Programma: { ...(content.Programma ?? {}) },
    }

    const payload = {
      ...draft,
      style,           // always use the builder's active style state, never draft.style
      hero_image_url: heroUrl,
      nav_layout: navLayout,
      pages: activePages,
      content: mergedContent,
      event_id: savedEventId ?? undefined,
    }
    console.log(
      "[save] verstuur naar /api/drafts",
      "| event_id:", payload.event_id,
      "| hero_image_url:", payload.hero_image_url,
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
    setSavedEventId(json.id)
    return json as { id: string; slug: string }
  }

  async function performSave() {
    if (!draft) return
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

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    localStorage.setItem("sayingyes_pending_save", "1")
    const { error } = await createClient().auth.signInWithOtp({
      email: authEmail,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/bouwen` },
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

  const sc = STYLE_CONFIG[style]
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

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans antialiased overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-10">
        <Link href="/aanmaken" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-rose-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug naar gegevens
        </Link>
        <span className="text-sm font-bold text-rose-600 tracking-tight hidden sm:block">Saying Yes</span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {/* Opslaan */}
            <button
              onClick={handleSave}
              disabled={saving || anyUploading}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 disabled:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:translate-y-0 transition-all"
            >
              {anyUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Uploaden...
                </>
              ) : saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Opslaan...
                </>
              ) : justSaved ? (
                <>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Opgeslagen!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Opslaan
                </>
              )}
            </button>

            {/* Publiceren */}
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
          </div>
          {(publishError || saveError) && (
            <p className="text-xs text-red-500 font-medium">{publishError || saveError}</p>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">

          {/* Stijl kiezer */}
          <div className="px-5 pt-6 pb-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Stijl</p>
            <div className="flex flex-col gap-2">
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
            </div>
          </div>

          {/* Nav layout toggle */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Navigatie</p>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['left', 'split', 'stacked'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    const next = { ...draft, navLayout: opt } as Draft
                    setDraft(next)
                    localStorage.setItem("sayingyes_draft", JSON.stringify(next))
                  }}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    navLayout === opt ? 'bg-rose-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt === 'left' ? 'Links' : opt === 'split' ? 'Verdeeld' : 'Gecentreerd'}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pt-5 pb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Pagina&apos;s</p>
            <div className="flex flex-col gap-1">
              {PAGES.map((page) => {
                const isOn = active[page.id]
                const isEditing = editingPage === page.id
                const isControlsOpen = CONTROLS_PAGES.has(page.id) && previewPage === page.id && isEditingControls
                const buttonActive = isEditing || isControlsOpen
                return (
                  <div key={page.id} className={`rounded-xl transition-colors ${buttonActive ? "bg-rose-50 ring-1 ring-rose-200" : isOn ? "hover:bg-gray-50" : ""}`}>
                    <div
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                      onClick={() => isOn && setPreviewPage(page.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOn ? "bg-rose-400" : "bg-gray-200"}`} />
                        <span className={`text-sm font-medium truncate ${isOn ? "text-gray-800" : "text-gray-400"}`}>
                          {page.label}
                        </span>
                      </div>
                      {page.toggleable ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggle(page.id) }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${isOn ? "bg-pink-500" : "bg-gray-200"}`}
                        >
                          <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 font-semibold flex-shrink-0">aan</span>
                      )}
                    </div>
                    {isOn && (
                      <div className="px-3 pb-2.5">
                        <button
                          onClick={() => {
                            if (CONTROLS_PAGES.has(page.id)) {
                              setPreviewPage(page.id)
                              if (isControlsOpen) {
                                setIsEditingControls(false)
                              } else {
                                setIsEditingControls(true)
                              }
                            } else {
                              setIsEditingControls(false)
                              isEditing ? setEditingPage(null) : openEditor(page.id)
                            }
                          }}
                          className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                            buttonActive
                              ? "bg-rose-100 text-rose-600"
                              : "bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                          }`}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {buttonActive ? "Klaar" : "Bewerken"}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-auto px-5 py-5 border-t border-gray-100">
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5">
              <p className="text-xs font-bold text-rose-700 mb-0.5">{typeLabel}</p>
              <p className="text-xs text-rose-500 leading-relaxed truncate">{eventName}</p>
              {eventLocatie && <p className="text-xs text-rose-400 truncate mt-0.5">{eventLocatie}</p>}
            </div>
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
            {editingPage ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingPage(null)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Terug naar preview
                </button>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
                  {PAGES.find(p => p.id === editingPage)?.label} bewerken
                </span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live preview</p>
            )}
            {!editingPage && (
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
            )}
          </div>

          {/* ── Builder layout: optional controls sidebar + canvas or editor ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Controls sidebar — only for CONTROLS_PAGES when open */}
            {!editingPage && CONTROLS_PAGES.has(previewPage) && isEditingControls && (
              <div className="w-[300px] flex-shrink-0 overflow-y-auto bg-white border-r border-gray-100 p-6 flex flex-col gap-6">

                {/* Top back button */}
                <div className="flex items-center justify-between -mb-2">
                  <button
                    onClick={() => setIsEditingControls(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Sluiten
                  </button>
                  <span className="text-xs font-bold text-gray-700 capitalize">{previewPage}</span>
                </div>

                {/* ── Home controls ── */}
                {previewPage === "Home" && (<>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Event</p>
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Naam evenement</span>
                        <textarea
                          rows={2}
                          value={draft?.naam ?? ""}
                          onChange={(e) => updateDraft({ naam: e.target.value })}
                          placeholder="Bijv. Bruiloft Michiel & Lisa"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                        />
                      </label>
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
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Datum</span>
                        <input
                          type="date"
                          value={draft?.datum ?? ""}
                          onChange={(e) => updateDraft({ datum: e.target.value })}
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Locatie</span>
                        <input
                          type="text"
                          value={draft?.locatie ?? ""}
                          onChange={(e) => updateDraft({ locatie: e.target.value })}
                          placeholder="Bijv. Kasteel de Haar, Utrecht"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Headerfoto</p>
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

                  <div className="border-t border-gray-100" />

                  {/* ── Luxe Trouwkaart ── */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Luxe Trouwkaart</p>
                    <div className="flex flex-col gap-4">

                      {/* Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Toon grafisch kader</span>
                        <button
                          onClick={() => updateDraft({ use_frame: !(draft?.use_frame ?? false) })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft?.use_frame ? "bg-pink-500" : "bg-gray-200"}`}
                        >
                          <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${draft?.use_frame ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      {draft?.use_frame && (<>
                        {/* Initialen */}
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">Initialen</span>
                          <input
                            type="text"
                            maxLength={5}
                            value={draft?.initials ?? ""}
                            onChange={(e) => updateDraft({ initials: e.target.value })}
                            placeholder="bijv. M | W"
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          />
                        </label>

                        {/* Namen in kader */}
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">Namen in kader</span>
                          <textarea
                            rows={2}
                            value={draft?.frame_names ?? ""}
                            onChange={(e) => updateDraft({ frame_names: e.target.value })}
                            placeholder={"bijv. Michiel\n& Lindsey"}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
                          />
                        </label>

                        {/* Locatie in kader */}
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">Locatie in kader</span>
                          <input
                            type="text"
                            value={draft?.frame_location ?? ""}
                            onChange={(e) => updateDraft({ frame_location: e.target.value })}
                            placeholder="bijv. Kasteel de Haar"
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          />
                        </label>

                        {/* Kader grid */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">Kader stijl</span>
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              { id: "gold-circle",   label: "Gold Cirkel"   },
                              { id: "gold-diamond",  label: "Gold Ruit"     },
                              { id: "terra-circle",  label: "Terra Cirkel"  },
                              { id: "terra-diamond", label: "Terra Ruit"    },
                              { id: "earthy-circle", label: "Earthy Cirkel" },
                              { id: "earthy-diamond",label: "Earthy Ruit"   },
                            ] as const).map((frame) => {
                              const isActive = (draft?.frame_style ?? "gold-circle") === frame.id
                              return (
                                <button
                                  key={frame.id}
                                  onClick={() => updateDraft({ frame_style: frame.id })}
                                  title={frame.label}
                                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                                    isActive
                                      ? "border-rose-400 ring-2 ring-rose-300 ring-offset-1"
                                      : "border-gray-100 hover:border-gray-300"
                                  }`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`/frames/${frame.id}.png.png`}
                                    alt={frame.label}
                                    className="w-full h-full object-cover"
                                  />
                                  {isActive && (
                                    <div className="absolute inset-0 bg-rose-400/10 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-rose-500 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </>)}

                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Welkomstbericht</p>
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Titel</span>
                        <input
                          type="text"
                          value={homeContent.title}
                          onChange={(e) => updateDraft({ homeContent: { ...homeContent, title: e.target.value } })}
                          placeholder="Optionele titel"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Tekst</span>
                        <textarea
                          rows={5}
                          value={homeContent.body}
                          onChange={(e) => updateDraft({ homeContent: { ...homeContent, body: e.target.value } })}
                          placeholder="Schrijf een welkomstbericht voor je gasten..."
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                        />
                      </label>
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
                  </div>
                </>)}

                {/* ── Ceremoniemeesters controls ── */}
                {previewPage === "Ceremoniemeesters" && (
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
                {previewPage === "Programma" && (
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
                        <div key={item.id ?? i} className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={item.time}
                              onChange={(e) => {
                                const updated = [...programmaItems]
                                updated[i] = { ...updated[i], time: e.target.value }
                                updateContent("Programma", { items: updated, layout: programLayout })
                              }}
                              className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                            />
                            <button
                              onClick={() => setOpenIconPickerIdx(openIconPickerIdx === i ? null : i)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                openIconPickerIdx === i
                                  ? "border-rose-400 bg-rose-50 text-rose-600"
                                  : "border-gray-200 bg-white text-gray-500 hover:border-rose-300 hover:text-rose-500"
                              }`}
                              title="Icoon kiezen"
                            >
                              <ProgramIcon iconId={item.iconId ?? "heart"} size={14} strokeWidth={2} />
                              <span>Icoon</span>
                            </button>
                            <button
                              onClick={() => {
                                const updated = programmaItems.filter((_, j) => j !== i)
                                updateContent("Programma", { items: updated, layout: programLayout })
                              }}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Verwijderen"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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
                          <input
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
                {previewPage === "RSVP" && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Introductietekst</p>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-gray-600">Tekst boven het formulier</span>
                      <textarea
                        rows={4}
                        value={(content.RSVP?.text as string) ?? ""}
                        onChange={(e) => updateContent("RSVP", { ...(content.RSVP ?? {}), text: e.target.value })}
                        placeholder="Laat weten of je erbij bent — vul het formulier in."
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                      />
                    </label>
                  </div>
                )}

                {/* ── Ons Verhaal controls ── */}
                {previewPage === "OnsVerhaal" && (
                  <div className="flex flex-col gap-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ons Verhaal</p>

                    {/* Titel */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-gray-600">Titel</span>
                      <input
                        type="text"
                        value={(content.OnsVerhaal?.title as string) ?? "Ons Verhaal"}
                        onChange={(e) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), title: e.target.value })}
                        placeholder="Ons Verhaal"
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                      />
                    </label>

                    {/* Verhaal tekst */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-gray-600">Verhaal</span>
                      <textarea
                        rows={6}
                        value={(content.OnsVerhaal?.text as string) ?? ""}
                        onChange={(e) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), text: e.target.value })}
                        placeholder="Vertel hier jullie verhaal..."
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                      />
                    </label>

                    {/* Foto */}
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

                {/* ── Praktisch controls ── */}
                {previewPage === "Informatie" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Informatie</p>
                    <PraktischEditor
                      tiles={praktischTiles ?? DEFAULT_PRAKTISCH_TILES}
                      onChange={(tiles) => updateContent("Informatie", { ...(content.Informatie ?? {}), items: tiles })}
                    />
                  </div>
                )}

                {/* ── Wishlist controls ── */}
                {previewPage === "Cadeautips" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cadeautips</p>
                    <WishlistEditor
                      items={wishlistItems ?? DEFAULT_WISHLIST_ITEMS}
                      onChange={(items) => updateContent("Cadeautips", { ...(content.Cadeautips ?? {}), items })}
                    />
                  </div>
                )}

                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      if (previewPage === "Programma") {
                        const sorted = [...programmaItems].sort((a, b) => a.time.localeCompare(b.time))
                        updateContent("Programma", { items: sorted, layout: programLayout })
                      }
                      setIsEditingControls(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-md shadow-emerald-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Klaar
                  </button>
                </div>

              </div>
              )}

            {/* Editor when editing a page */}
            {editingPage ? (
              <div className="flex-1 overflow-y-auto p-3">
                <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                  <div className="px-8 py-6">
                    <h3 className="text-base font-bold text-gray-900 mb-5">
                      {PAGES.find(p => p.id === editingPage)?.label}
                    </h3>
                    <Editor
                      pageId={editingPage}
                      content={content[editingPage] ?? {}}
                      onChange={(val) => updateContent(editingPage, val)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Universal scaling canvas — all pages */
              <div ref={canvasContainerRef} className="flex-1 overflow-y-auto bg-gray-100 p-6">
                <div className="mx-auto" style={{ width: `${Math.round(canvasWidth * canvasScale * zoomMultiplier)}px` }}>
                  <div style={{ width: canvasWidth, transform: `scale(${canvasScale * zoomMultiplier})`, transformOrigin: "top left" }}>
                    <div className="rounded-2xl shadow-xl overflow-clip relative" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
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
                        activeType={previewPage}
                        onNavigate={(type) => { setPreviewPage(type as PageId); setIsEditingControls(false) }}
                      />
                      {previewPage === "Home" && (
                        <EventHomePreview
                          typeLabel={typeLabel}
                          title={eventName}
                          datum={draft?.datum || null}
                          datumFormatted={draft?.datum ? formatDate(draft.datum) : null}
                          locatie={eventLocatie || null}
                          heroImageUrl={heroImageUrl}
                          heroOverlay={heroOverlay}
                          homeTitle={homeContent.title || null}
                          homeBody={homeContent.body || null}
                          homeAlign={homeContent.align}
                          sc={sc}
                          useFrame={draft?.use_frame}
                          frameStyle={draft?.frame_style}
                          initials={draft?.initials}
                          frameNames={draft?.frame_names}
                          frameLocation={draft?.frame_location}
                          heroPosX={draft?.hero_image_pos_x ?? 50}
                          heroPosY={draft?.hero_image_pos_y ?? 50}
                          editableHero={true}
                          onHeroPositionChange={(x, y) => updateDraft({ hero_image_pos_x: x, hero_image_pos_y: y })}
                          onNavigate={(id) => setPreviewPage(id as PageId)}
                        />
                      )}
                      {previewPage === "Ceremoniemeesters" && (
                        <EventMastersPreview
                          masters={mastersForPreview}
                          sc={sc}
                          text={typeof content.Ceremoniemeesters?.text === "string" ? content.Ceremoniemeesters.text : undefined}
                        />
                      )}
                      {previewPage === "OnsVerhaal" && (
                        <StoryPreview
                          title={(content.OnsVerhaal?.title as string) ?? "Ons Verhaal"}
                          text={(content.OnsVerhaal?.text as string) ?? null}
                          imageUrl={storyImageBlob ?? ((content.OnsVerhaal?.image_url as string) || null)}
                          imagePosX={(content.OnsVerhaal?.image_pos_x as number) ?? 50}
                          imagePosY={(content.OnsVerhaal?.image_pos_y as number) ?? 50}
                          showOverlay={storyOverlay}
                          editable={true}
                          onPositionChange={(x, y) => updateContent("OnsVerhaal", { ...(content.OnsVerhaal ?? {}), image_pos_x: x, image_pos_y: y })}
                          sc={sc}
                        />
                      )}
                      {previewPage === "Programma" && (
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
                        />
                      )}
                      {previewPage === "RSVP" && (
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                          <h2 className="text-2xl font-extrabold mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>RSVP</h2>
                          {/* max-w-lg: zelfde breedte als de echte form */}
                          <div className="flex flex-col gap-6 max-w-lg">
                            <p className="text-sm" style={{ color: sc.bodyText }}>{(content.RSVP?.text as string) || "Laat weten of je erbij bent — vul het formulier in."}</p>
                            {/* Aantal personen — buiten de inner card */}
                            <div>
                              <div className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Met hoeveel personen komen jullie?</div>
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
                            {/* Hoofdgast inner card — bg-gray-50 border-gray-100, net als de echte form */}
                            <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Hoofdgast</div>
                              <div>
                                <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Naam *</div>
                                <div className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 flex items-center shadow-sm">
                                  <span className="text-sm text-gray-400">Voornaam</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Type gast</div>
                                <div className="flex gap-2">
                                  <div className="flex-1 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
                                    style={{ backgroundColor: sc.accent, color: "#fff", border: `2px solid ${sc.accent}` }}>
                                    Daggast
                                  </div>
                                  <div className="flex-1 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-gray-500"
                                    style={{ border: "2px solid #e5e7eb" }}>
                                    Avondgast
                                  </div>
                                </div>
                              </div>
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
                            {/* Aanmelden knop buiten de inner card */}
                            <div className="w-full h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-md"
                              style={{ backgroundColor: sc.accent, color: "#fff" }}>
                              Aanmelden
                            </div>
                          </div>
                        </div>
                      )}
                      {previewPage === "Informatie" && (
                        <PraktischPreview tiles={praktischTiles ?? []} sc={sc} />
                      )}
                      {previewPage === "Cadeautips" && (
                        <WishlistPreview items={wishlistItems ?? []} sc={sc} />
                      )}
                      {previewPage === "Fotos" && (
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                          <h2 className="text-lg font-extrabold mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Foto&apos;s</h2>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <div key={n} className="aspect-square rounded-xl" style={{ backgroundColor: `${sc.accent}12` }} />
                            ))}
                          </div>
                        </div>
                      )}
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
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3">Dit is precies hoe jouw site eruitziet</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Auth modal ── */}
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
