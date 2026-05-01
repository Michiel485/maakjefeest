"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import EventHomePreview from "@/components/EventHomePreview"
import EventMastersPreview from "@/components/EventMastersPreview"
import EventProgramPreview, { PROGRAM_ICONS, ProgramIcon } from "@/components/EventProgramPreview"
import { formatDate } from "@/lib/event-styles"
import { createClient } from "@/lib/supabase"

type EventType = "bruiloft" | "verjaardag" | "evenement"
type PageId = "home" | "programma" | "rsvp" | "praktisch" | "wishlist" | "fotos" | "ceremoniemeesters"
type Style = "roze" | "ivoor" | "zand"
type Viewport = "desktop" | "mobiel"
type Align = "left" | "center" | "right"

interface HomeContent {
  title: string
  body: string   // HTML from contenteditable
  align: Align
}

interface MasterPerson {
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
  style?: string
  heroOverlay?: boolean
  homeContent?: HomeContent
  navLayout?: 'stacked' | 'split' | 'left'
}

interface PageConfig {
  id: PageId
  label: string
  toggleable: boolean
}

interface ProgrammaItem { id?: string; time: string; title?: string; description: string; iconId?: string; image_url?: string | null; imagePosX?: number }
interface PraktischItem { label: string; value: string }

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
  { id: "roze",  label: "Feestelijk Roze",   sub: "Roze accenten, modern",  dot: "bg-rose-400",  border: "border-rose-300",  active: "ring-rose-400"  },
  { id: "ivoor", label: "Klassiek Ivoor",     sub: "Gebroken wit, sierlijk", dot: "bg-amber-100 border border-amber-300", border: "border-amber-200", active: "ring-amber-400" },
  { id: "zand",  label: "Scandinavisch Zand", sub: "Aards, clean",           dot: "bg-[#E8E0D5]", border: "border-stone-200", active: "ring-stone-400" },
]

const STYLE_CONFIG = {
  roze: {
    accent: "#E8627A",
    heroGradient: "linear-gradient(135deg, #fff0f3, #fce7e7, #fff5ee)",
    fontFamily: "Inter, sans-serif",
    navBg: "#ffffff",
    navText: "#374151",
    headingColor: "#1a1a1a",
    bodyText: "#4b5563",
    buttonBg: "#E8627A",
    buttonText: "#ffffff",
    labelColor: "#E8627A",
    fontImport: null as string | null,
  },
  ivoor: {
    accent: "#1A1A1A",
    heroGradient: "linear-gradient(135deg, #FAF7F2, #F5EFE6, #FAF7F2)",
    fontFamily: "'Cormorant Garamond', serif",
    navBg: "#FAF7F2",
    navText: "#1A1A1A",
    headingColor: "#1A1A1A",
    bodyText: "#3d3d3d",
    buttonBg: "#1A1A1A",
    buttonText: "#FAF7F2",
    labelColor: "#8a7a6a",
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');",
  },
  zand: {
    accent: "#8A9E8C",
    heroGradient: "linear-gradient(135deg, #F5F0E8, #EDE8DF, #E8E4DC)",
    fontFamily: "Inter, sans-serif",
    navBg: "#F5F0E8",
    navText: "#2C2C2C",
    headingColor: "#2C2C2C",
    bodyText: "#5a5a5a",
    buttonBg: "#8A9E8C",
    buttonText: "#ffffff",
    labelColor: "#8A9E8C",
    fontImport: null as string | null,
  },
} as const

const PAGES: PageConfig[] = [
  { id: "home",               label: "Home",               toggleable: false },
  { id: "programma",          label: "Programma",          toggleable: true  },
  { id: "rsvp",               label: "RSVP",               toggleable: false },
  { id: "praktisch",          label: "Praktisch",          toggleable: true  },
  { id: "wishlist",           label: "Wishlist",           toggleable: true  },
  { id: "fotos",              label: "Foto's",             toggleable: true  },
  { id: "ceremoniemeesters",  label: "Ceremoniemeesters",  toggleable: true  },
]

const CONTROLS_PAGES = new Set<PageId>(["home", "ceremoniemeesters", "programma", "rsvp"])

const TYPE_LABEL: Record<EventType, string> = {
  bruiloft: "Bruiloft", verjaardag: "Verjaardag", evenement: "Evenement",
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BouwenPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [active, setActive] = useState<Record<PageId, boolean>>({
    home: true, programma: true, rsvp: true, praktisch: false, wishlist: false, fotos: false, ceremoniemeesters: false,
  })
  const [previewPage, setPreviewPage] = useState<PageId>("home")
  const [editingPage, setEditingPage] = useState<PageId | null>(null)
  const [content, setContent] = useState<ContentMap>({})
  const [style, setStyle] = useState<Style>("roze")
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [heroImageError, setHeroImageError] = useState<string | null>(null)
  const [isEditingControls, setIsEditingControls] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [masterPhotoUrls, setMasterPhotoUrls] = useState<[string | null, string | null]>([null, null])
  const [masterFiles, setMasterFiles] = useState<[File | null, File | null]>([null, null])
  const [programUploadIndex, setProgramUploadIndex] = useState<number | null>(null)
  const [openIconPickerIdx, setOpenIconPickerIdx] = useState<number | null>(null)
  const masterPhotoRef0 = useRef<HTMLInputElement>(null)
  const masterPhotoRef1 = useRef<HTMLInputElement>(null)
  const programPhotoRef = useRef<HTMLInputElement>(null)
  const [programBlobUrls, setProgramBlobUrls] = useState<Record<string, string>>({})
  const [programFileMap, setProgramFileMap] = useState<Record<string, File>>({})
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("maakjefeest_draft")
      if (!raw) { router.replace("/aanmaken"); return }
      const parsed = JSON.parse(raw)
      setDraft(parsed)
      if (parsed.style) setStyle(parsed.style as Style)
    } catch { router.replace("/aanmaken") }

    try {
      const saved = localStorage.getItem("maakjefeest_content")
      if (saved) setContent(JSON.parse(saved))
    } catch {}

    const savedId = localStorage.getItem("maakjefeest_saved_event_id")
    if (savedId) setSavedEventId(savedId)
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

  function updateDraft(fields: Partial<Draft>) {
    setDraft((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...fields }
      localStorage.setItem("maakjefeest_draft", JSON.stringify(next))
      return next
    })
  }

  function updateContent(pageId: PageId, value: Record<string, unknown>) {
    setContent((prev) => {
      const next = { ...prev, [pageId]: value }
      localStorage.setItem("maakjefeest_content", JSON.stringify(next))
      return next
    })
  }

  function saveStyle(s: Style) {
    setStyle(s)
    updateDraft({ style: s })
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!supported.includes(file.type)) {
      setHeroImageError("Gebruik een JPEG, PNG of WebP afbeelding. HEIC (iPhone) werkt niet in de browser — converteer het eerst.")
      e.target.value = ""
      return
    }
    setHeroImageError(null)
    setHeroFile(file)
    const url = URL.createObjectURL(file)
    setHeroImageUrl(url)
    updateDraft({ heroOverlay: true })
    e.target.value = ""
  }

  function toggle(id: PageId) {
    setActive((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (!next[previewPage]) {
        const fallback = PAGES.find((p) => next[p.id])
        if (fallback) setPreviewPage(fallback.id)
      }
      if (editingPage === id && !next[id]) setEditingPage(null)
      return next
    })
  }

  function handleMasterPhotoUpload(e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) {
    const file = e.target.files?.[0]
    if (!file) return
    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!supported.includes(file.type)) { e.target.value = ""; return }
    const url = URL.createObjectURL(file)
    setMasterFiles((prev) => { const next: [File | null, File | null] = [...prev] as [File | null, File | null]; next[index] = file; return next })
    setMasterPhotoUrls((prev) => { const next: [string | null, string | null] = [...prev] as [string | null, string | null]; next[index] = url; return next })
    e.target.value = ""
  }

  function handleProgramPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || programUploadIndex === null) return
    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!supported.includes(file.type)) return

    let item = programmaItems[programUploadIndex]
    if (!item.id) {
      item = { ...item, id: crypto.randomUUID() }
      const updated = [...programmaItems]
      updated[programUploadIndex] = item
      updateContent("programma", { items: updated, layout: programLayout })
    }

    const blobUrl = URL.createObjectURL(file)
    if (programBlobUrls[item.id!]) URL.revokeObjectURL(programBlobUrls[item.id!])
    setProgramBlobUrls((prev) => ({ ...prev, [item.id!]: blobUrl }))
    setProgramFileMap((prev) => ({ ...prev, [item.id!]: file }))
    setProgramUploadIndex(null)
  }

  function openEditor(id: PageId) {
    setPreviewPage(id)
    if (!CONTROLS_PAGES.has(id)) setEditingPage(id)
  }

  async function handlePublish() {
    if (!draft) return
    setPublishing(true)
    setPublishError(null)
    try {
      const activePages = PAGES.filter((p) => active[p.id]).map((p) => p.id)
      let uploadedHeroUrl: string | null = null
      if (heroFile) {
        uploadedHeroUrl = await uploadToStorage(heroFile, "hero-images")
      } else if (heroImageUrl && !heroImageUrl.startsWith("blob:")) {
        uploadedHeroUrl = heroImageUrl
      }

      const uploadedMasters = [...mastersData] as typeof mastersData
      for (let i = 0; i < 2; i++) {
        const f = masterFiles[i as 0 | 1]
        if (f) {
          try {
            const url = await uploadToStorage(f, "hero-images")
            uploadedMasters[i] = { ...uploadedMasters[i], foto_url: url }
          } catch { /* niet-kritiek: ceremoniemeester-foto overslaan bij fout */ }
        }
      }

      let programmaItemsUploaded = programmaItems.slice()
      if (Object.keys(programFileMap).length > 0) {
        for (let i = 0; i < programmaItemsUploaded.length; i++) {
          const it = programmaItemsUploaded[i]
          if (!it.id || !programFileMap[it.id]) continue
          try {
            const url = await uploadToStorage(programFileMap[it.id], "hero-images")
            programmaItemsUploaded[i] = { ...it, image_url: url }
          } catch { /* skip */ }
        }
        Object.values(programBlobUrls).forEach((u) => URL.revokeObjectURL(u))
        setProgramBlobUrls({})
        setProgramFileMap({})
      }

      const mergedContent: ContentMap = {
        ...content,
        home: {
          ...(content.home ?? {}),
          title: homeContent.title,
          body: homeContent.body,
          align: homeContent.align,
        },
        ceremoniemeesters: { masters: uploadedMasters },
        programma: { ...(content.programma ?? {}), items: programmaItemsUploaded },
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, hero_image_url: uploadedHeroUrl, nav_layout: navLayout, pages: activePages, content: mergedContent }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Er ging iets mis")
      localStorage.setItem("maakjefeest_event", JSON.stringify({ id: json.id, slug: json.slug }))
      router.push(`/betalen?event_id=${json.id}`)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Er ging iets mis")
      setPublishing(false)
    }
  }

  async function performSave() {
    if (!draft) return
    setSaving(true)
    setSaveError(null)
    try {
      const activePages = PAGES.filter((p) => active[p.id]).map((p) => p.id)
      let uploadedHeroUrl: string | null = null
      if (heroFile) {
        uploadedHeroUrl = await uploadToStorage(heroFile, "hero-images")
      } else if (heroImageUrl && !heroImageUrl.startsWith("blob:")) {
        uploadedHeroUrl = heroImageUrl
      }
      let programmaItemsUploaded = programmaItems.slice()
      if (Object.keys(programFileMap).length > 0) {
        for (let i = 0; i < programmaItemsUploaded.length; i++) {
          const it = programmaItemsUploaded[i]
          if (!it.id || !programFileMap[it.id]) continue
          try {
            const url = await uploadToStorage(programFileMap[it.id], "hero-images")
            programmaItemsUploaded[i] = { ...it, image_url: url }
          } catch { /* skip */ }
        }
        Object.values(programBlobUrls).forEach((u) => URL.revokeObjectURL(u))
        setProgramBlobUrls({})
        setProgramFileMap({})
      }

      const mergedContent: ContentMap = {
        ...content,
        home: { ...(content.home ?? {}), title: homeContent.title, body: homeContent.body, align: homeContent.align },
        ceremoniemeesters: { masters: mastersData },
        programma: { ...(content.programma ?? {}), items: programmaItemsUploaded },
      }
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, hero_image_url: uploadedHeroUrl, nav_layout: navLayout, pages: activePages, content: mergedContent, event_id: savedEventId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Opslaan mislukt")
      localStorage.setItem("maakjefeest_saved_event_id", json.id)
      setSavedEventId(json.id)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt")
    } finally {
      setSaving(false)
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
    const { error } = await createClient().auth.signInWithOtp({
      email: authEmail,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/bouwen` },
    })
    setAuthLoading(false)
    if (error) {
      setSaveError(error.message)
      setShowAuthModal(false)
    } else {
      setAuthSent(true)
    }
  }

  const sc = STYLE_CONFIG[style]
  const canvasWidth = viewport === "mobiel" ? 390 : 1024

  const activePagesOrdered = PAGES.filter((p) => active[p.id])
  const eventName = draft?.naam || "Jullie bruiloft"
  const safeEventName = eventName.replace(/\n/g, " ")
  const eventDate = draft?.datum ? formatDate(draft.datum) : "Datum nog niet ingesteld"
  const eventLocatie = draft?.locatie || ""
  const typeLabel = draft?.type ? TYPE_LABEL[draft.type] : "Evenement"
  const heroOverlay = draft?.heroOverlay ?? true
  const homeContent: HomeContent = draft?.homeContent ?? { title: "", body: "", align: "center" }
  const navLayout = (draft?.navLayout ?? 'split') as 'stacked' | 'split' | 'left'

  const emptyMaster: MasterPerson = { naam: "", telefoon: "", email: "", foto_url: null }
  const rawMasters = (content.ceremoniemeesters?.masters as Partial<MasterPerson>[] | undefined) ?? []
  const mastersData: [MasterPerson, MasterPerson] = [
    { ...emptyMaster, ...rawMasters[0] },
    { ...emptyMaster, ...rawMasters[1] },
  ]
  const mastersForPreview = [
    { ...mastersData[0], foto_url: masterPhotoUrls[0] ?? mastersData[0].foto_url },
    { ...mastersData[1], foto_url: masterPhotoUrls[1] ?? mastersData[1].foto_url },
  ]

  const programmaItems = (content.programma?.items as ProgrammaItem[]) || []
  const programmaItemsSorted = programmaItems.slice().sort((a, b) => a.time.localeCompare(b.time))
  const programmaItemsForPreview = programmaItemsSorted.map((it) =>
    it.id && programBlobUrls[it.id] ? { ...it, image_url: programBlobUrls[it.id] } : it
  )
  const rawLayout = (content.programma?.layout as string) || "centered"
  const programLayout = (rawLayout === "bento" ? "centered" : rawLayout) as "centered" | "timeline"
  const praktischItems = (content.praktisch?.items as PraktischItem[]) || []

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
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 disabled:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:translate-y-0 transition-all"
            >
              {saving ? (
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
              disabled={publishing}
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
                    localStorage.setItem("maakjefeest_draft", JSON.stringify(next))
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
                return (
                  <div key={page.id} className={`rounded-xl transition-colors ${isEditing ? "bg-rose-50 ring-1 ring-rose-200" : isOn ? "hover:bg-gray-50" : ""}`}>
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
                              setIsEditingControls(true)
                            } else {
                              setIsEditingControls(false)
                              isEditing ? setEditingPage(null) : openEditor(page.id)
                            }
                          }}
                          className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                            isEditing
                              ? "bg-rose-100 text-rose-600"
                              : "bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                          }`}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {isEditing ? "Klaar" : "Bewerken"}
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
                {previewPage === "home" && (<>
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
                            onClick={() => { setHeroImageUrl(null); setHeroFile(null) }}
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
                {previewPage === "ceremoniemeesters" && (<>
                  {([0, 1] as const).map((i) => (
                    <div key={i}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                        Ceremoniemeester {i + 1}{i === 1 && <span className="normal-case font-normal ml-1 text-gray-300">(optioneel)</span>}
                      </p>
                      <div className="flex flex-col gap-3">
                        {masterPhotoUrls[i] ? (
                          <div className="flex flex-col gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={masterPhotoUrls[i]!} alt="" className="w-16 h-16 rounded-full object-cover" />
                            <button
                              onClick={() => setMasterPhotoUrls((prev) => { const n: [string | null, string | null] = [...prev] as [string | null, string | null]; n[i] = null; return n })}
                              className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors self-start"
                            >
                              Foto verwijderen
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => (i === 0 ? masterPhotoRef0 : masterPhotoRef1).current?.click()}
                            className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-gray-200 rounded-xl py-4 text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Foto uploaden
                          </button>
                        )}
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">Naam</span>
                          <input
                            type="text"
                            value={mastersData[i].naam}
                            onChange={(e) => {
                              const updated = [...mastersData] as [MasterPerson, MasterPerson]
                              updated[i] = { ...updated[i], naam: e.target.value }
                              updateContent("ceremoniemeesters", { masters: updated })
                            }}
                            placeholder="Volledige naam"
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">Telefoon</span>
                          <input
                            type="tel"
                            value={mastersData[i].telefoon}
                            onChange={(e) => {
                              const updated = [...mastersData] as [MasterPerson, MasterPerson]
                              updated[i] = { ...updated[i], telefoon: e.target.value }
                              updateContent("ceremoniemeesters", { masters: updated })
                            }}
                            placeholder="+31 6 12345678"
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-gray-600">E-mail</span>
                          <input
                            type="email"
                            value={mastersData[i].email}
                            onChange={(e) => {
                              const updated = [...mastersData] as [MasterPerson, MasterPerson]
                              updated[i] = { ...updated[i], email: e.target.value }
                              updateContent("ceremoniemeesters", { masters: updated })
                            }}
                            placeholder="naam@voorbeeld.nl"
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          />
                        </label>
                      </div>
                      {i === 0 && <div className="border-t border-gray-100 mt-6" />}
                    </div>
                  ))}
                  <input ref={masterPhotoRef0} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleMasterPhotoUpload(e, 0)} />
                  <input ref={masterPhotoRef1} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleMasterPhotoUpload(e, 1)} />
                </>)}

                {/* ── Programma controls ── */}
                {previewPage === "programma" && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Weergave</p>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-5">
                      {(["timeline", "centered"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateContent("programma", { items: programmaItems, layout: opt })}
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
                                updateContent("programma", { items: updated, layout: programLayout })
                              }}
                              className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                            />
                            <button
                              onClick={() => setOpenIconPickerIdx(openIconPickerIdx === i ? null : i)}
                              className={`p-1 rounded-lg transition-colors ${openIconPickerIdx === i ? "text-rose-500 bg-rose-50" : "text-gray-400 hover:text-rose-400"}`}
                              title="Icoon kiezen"
                            >
                              <ProgramIcon iconId={item.iconId ?? "heart"} size={18} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => {
                                setProgramUploadIndex(i)
                                programPhotoRef.current?.click()
                              }}
                              className="ml-auto text-gray-300 hover:text-rose-400 transition-colors p-1"
                              title="Foto toevoegen"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                const updated = programmaItems.filter((_, j) => j !== i)
                                updateContent("programma", { items: updated, layout: programLayout })
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
                            <div className="grid grid-cols-4 gap-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                              {PROGRAM_ICONS.map((icon) => (
                                <button
                                  key={icon.id}
                                  onClick={() => {
                                    const updated = [...programmaItems]
                                    updated[i] = { ...updated[i], iconId: icon.id }
                                    updateContent("programma", { items: updated, layout: programLayout })
                                    setOpenIconPickerIdx(null)
                                  }}
                                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${
                                    (item.iconId ?? "heart") === icon.id
                                      ? "bg-rose-50 text-rose-500"
                                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                  }`}
                                  title={icon.label}
                                >
                                  <ProgramIcon iconId={icon.id} size={20} strokeWidth={2} />
                                  <span className="text-[9px] leading-tight truncate w-full text-center">{icon.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {((item.id && programBlobUrls[item.id]) || item.image_url) && (() => {
                            const photoUrl = (item.id && programBlobUrls[item.id]) || item.image_url!
                            return (
                              <div className="flex flex-col items-center gap-1.5 py-1">
                                <div className="relative">
                                  {/* Round photo preview — drag left/right to pan */}
                                  <div
                                    style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", cursor: "ew-resize", userSelect: "none", flexShrink: 0 }}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      const startX = e.clientX
                                      const startPosX = item.imagePosX ?? 50
                                      function onMove(me: MouseEvent) {
                                        const newX = Math.max(0, Math.min(100, startPosX - (me.clientX - startX)))
                                        const updated = [...programmaItems]
                                        updated[i] = { ...updated[i], imagePosX: newX }
                                        updateContent("programma", { items: updated, layout: programLayout })
                                      }
                                      function onUp() {
                                        window.removeEventListener("mousemove", onMove)
                                        window.removeEventListener("mouseup", onUp)
                                      }
                                      window.addEventListener("mousemove", onMove)
                                      window.addEventListener("mouseup", onUp)
                                    }}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={photoUrl}
                                      alt=""
                                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${item.imagePosX ?? 50}% 50%`, display: "block", pointerEvents: "none" }}
                                    />
                                  </div>
                                  {/* Pan hint arrows */}
                                  <div className="absolute inset-0 rounded-full flex items-center justify-between px-1.5 pointer-events-none">
                                    <span className="text-white text-sm font-bold leading-none" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))", opacity: 0.7 }}>‹</span>
                                    <span className="text-white text-sm font-bold leading-none" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))", opacity: 0.7 }}>›</span>
                                  </div>
                                  {/* Remove button */}
                                  <button
                                    onClick={() => {
                                      if (item.id && programBlobUrls[item.id]) {
                                        URL.revokeObjectURL(programBlobUrls[item.id])
                                        setProgramBlobUrls((prev) => { const n = { ...prev }; delete n[item.id!]; return n })
                                        setProgramFileMap((prev) => { const n = { ...prev }; delete n[item.id!]; return n })
                                      }
                                      const updated = [...programmaItems]
                                      updated[i] = { ...updated[i], image_url: null }
                                      updateContent("programma", { items: updated, layout: programLayout })
                                    }}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 text-gray-400 hover:text-red-500 transition-colors shadow-sm border border-gray-100"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-[10px] text-gray-400">Sleep om bij te snijden</p>
                              </div>
                            )
                          })()}
                          <input
                            type="text"
                            value={item.title ?? ""}
                            onChange={(e) => {
                              const updated = [...programmaItems]
                              updated[i] = { ...updated[i], title: e.target.value }
                              updateContent("programma", { items: updated, layout: programLayout })
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
                              updateContent("programma", { items: updated, layout: programLayout })
                            }}
                            placeholder="Beschrijving..."
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const updated = [...programmaItems, { id: crypto.randomUUID(), time: "", title: "", description: "", iconId: "heart" }]
                          updateContent("programma", { items: updated, layout: programLayout })
                        }}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-emerald-200 rounded-xl py-3 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors mt-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Onderdeel toevoegen
                      </button>
                    </div>
                    <input
                      ref={programPhotoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleProgramPhotoUpload}
                    />
                  </div>
                )}

                {/* ── RSVP controls ── */}
                {previewPage === "rsvp" && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Introductietekst</p>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-gray-600">Tekst boven het formulier</span>
                      <textarea
                        rows={4}
                        value={(content.rsvp?.text as string) ?? ""}
                        onChange={(e) => updateContent("rsvp", { ...(content.rsvp ?? {}), text: e.target.value })}
                        placeholder="Laat weten of je erbij bent — vul het formulier in."
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
                      />
                    </label>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      if (previewPage === "programma") {
                        const sorted = [...programmaItems].sort((a, b) => a.time.localeCompare(b.time))
                        updateContent("programma", { items: sorted, layout: programLayout })
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
                <div className="mx-auto" style={{ width: `${Math.round(canvasWidth * canvasScale)}px` }}>
                  <div style={{ width: canvasWidth, transform: `scale(${canvasScale})`, transformOrigin: "top left" }}>
                    <div className="rounded-2xl shadow-xl overflow-clip" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
                      {sc.fontImport && <style>{sc.fontImport}</style>}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400">
                          jouwbruiloft.sayingyes.nl
                        </div>
                      </div>
                      {navLayout === 'left' ? (
                        <nav className="px-5 py-4 border-b flex items-center gap-6 flex-wrap" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
                          <span className="text-sm font-bold whitespace-nowrap flex-shrink-0 overflow-hidden text-ellipsis" style={{ color: sc.accent, fontFamily: sc.fontFamily, maxWidth: 200 }}>{safeEventName}</span>
                          <div className="flex items-center flex-wrap gap-1">
                            {activePagesOrdered.map((page) => (
                              <button
                                key={page.id}
                                onClick={() => { setPreviewPage(page.id); setIsEditingControls(false) }}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={page.id === previewPage ? { color: sc.accent, backgroundColor: `${sc.accent}15` } : { color: sc.navText }}
                              >
                                {page.label}
                              </button>
                            ))}
                          </div>
                        </nav>
                      ) : navLayout === 'split' ? (
                        <nav className="px-5 py-4 border-b flex items-center justify-between gap-4" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
                          <span className="text-sm font-bold whitespace-nowrap flex-shrink-0 overflow-hidden text-ellipsis" style={{ color: sc.accent, fontFamily: sc.fontFamily, maxWidth: 200 }}>{safeEventName}</span>
                          <div className="flex items-center flex-wrap justify-end gap-1">
                            {activePagesOrdered.map((page) => (
                              <button
                                key={page.id}
                                onClick={() => { setPreviewPage(page.id); setIsEditingControls(false) }}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={page.id === previewPage ? { color: sc.accent, backgroundColor: `${sc.accent}15` } : { color: sc.navText }}
                              >
                                {page.label}
                              </button>
                            ))}
                          </div>
                        </nav>
                      ) : (
                        <nav className="px-5 py-5 border-b flex flex-col items-center gap-2" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
                          <span className="text-sm font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: sc.accent, fontFamily: sc.fontFamily, maxWidth: 200 }}>{safeEventName}</span>
                          <div className="flex items-center flex-wrap justify-center gap-1">
                            {activePagesOrdered.map((page) => (
                              <button
                                key={page.id}
                                onClick={() => { setPreviewPage(page.id); setIsEditingControls(false) }}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={page.id === previewPage ? { color: sc.accent, backgroundColor: `${sc.accent}15` } : { color: sc.navText }}
                              >
                                {page.label}
                              </button>
                            ))}
                          </div>
                        </nav>
                      )}
                      {previewPage === "home" && (
                        <EventHomePreview
                          typeLabel={typeLabel}
                          title={eventName}
                          datumFormatted={draft?.datum ? formatDate(draft.datum) : null}
                          locatie={eventLocatie || null}
                          heroImageUrl={heroImageUrl}
                          heroOverlay={heroOverlay}
                          homeTitle={homeContent.title || null}
                          homeBody={homeContent.body || null}
                          homeAlign={homeContent.align}
                          sc={sc}
                          onNavigate={(id) => setPreviewPage(id as PageId)}
                        />
                      )}
                      {previewPage === "ceremoniemeesters" && (
                        <>
                          <div style={{ padding: "28px 32px 0", backgroundColor: sc.navBg }}>
                            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: sc.headingColor, fontFamily: sc.fontFamily, margin: 0 }}>
                              Ceremoniemeesters
                            </h2>
                          </div>
                          <EventMastersPreview masters={mastersForPreview} sc={sc} />
                        </>
                      )}
                      {previewPage === "programma" && (
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
                            updateContent("programma", { items: updated, layout: programLayout })
                          }}
                        />
                      )}
                      {previewPage === "rsvp" && (
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                          <h2 className="text-lg font-extrabold mb-2" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Aanmelden</h2>
                          <p className="text-sm mb-6" style={{ color: sc.bodyText }}>{(content.rsvp?.text as string) || "Laat weten of je erbij bent — vul het formulier in."}</p>
                          <div className="flex flex-col gap-3">
                            {["Naam", "E-mailadres", "Aantal personen"].map((f) => (
                              <div key={f}>
                                <div className="text-xs font-semibold mb-1" style={{ color: sc.navText }}>{f}</div>
                                <div className="h-9 rounded-xl border" style={{ backgroundColor: `${sc.accent}08`, borderColor: `${sc.accent}25` }} />
                              </div>
                            ))}
                            <div className="h-10 rounded-xl mt-2" style={{ backgroundColor: sc.buttonBg }} />
                          </div>
                        </div>
                      )}
                      {previewPage === "praktisch" && (
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                          <h2 className="text-lg font-extrabold mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Praktische info</h2>
                          {praktischItems.length > 0
                            ? praktischItems.map((item, i) => (
                                <div key={i} className="mb-4">
                                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: sc.labelColor }}>{item.label}</p>
                                  <p className="text-sm font-semibold" style={{ color: sc.headingColor }}>{item.value}</p>
                                </div>
                              ))
                            : [["Locatie", eventLocatie || "Nog in te vullen"], ["Datum", eventDate]].map(([k, v]) => (
                                <div key={k} className="mb-4">
                                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: sc.labelColor }}>{k}</p>
                                  <p className="text-sm font-semibold" style={{ color: sc.headingColor }}>{v}</p>
                                </div>
                              ))
                          }
                        </div>
                      )}
                      {previewPage === "wishlist" && (
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                          <h2 className="text-lg font-extrabold mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Wishlist</h2>
                          <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((n) => (
                              <div key={n} className="rounded-2xl border p-4" style={{ borderColor: `${sc.accent}20` }}>
                                <div className="h-16 rounded-xl mb-3" style={{ backgroundColor: `${sc.accent}12` }} />
                                <div className="h-2.5 rounded-full w-3/4 mb-1.5" style={{ backgroundColor: `${sc.accent}18` }} />
                                <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: `${sc.accent}10` }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {previewPage === "fotos" && (
                        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                          <h2 className="text-lg font-extrabold mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Foto&apos;s</h2>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <div key={n} className="aspect-square rounded-xl" style={{ backgroundColor: `${sc.accent}12` }} />
                            ))}
                          </div>
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
  if (pageId === "home") {
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

  if (pageId === "programma") {
    const items = (content.items as { time: string; description: string }[]) ?? []
    return <ProgrammaEditor items={items} onChange={(items) => onChange({ ...content, items })} />
  }

  if (pageId === "praktisch") {
    const items = (content.items as { label: string; value: string }[]) ?? []
    return <PraktischEditor items={items} onChange={(items) => onChange({ ...content, items })} />
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

function PraktischEditor({
  items, onChange,
}: {
  items: { label: string; value: string }[]
  onChange: (items: { label: string; value: string }[]) => void
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newValue, setNewValue] = useState("")

  function add() {
    if (!newLabel.trim() || !newValue.trim()) return
    onChange([...items, { label: newLabel.trim(), value: newValue.trim() }])
    setNewLabel(""); setNewValue("")
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm text-gray-700 truncate">{item.value}</p>
              </div>
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
        <input type="text" placeholder="Label (bijv. Parkeren)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-36 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" />
        <input type="text" placeholder="Waarde" value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400" />
        <button onClick={add} className="flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">Voeg toe</button>
      </div>
    </div>
  )
}
