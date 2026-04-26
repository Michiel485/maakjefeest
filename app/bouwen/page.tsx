"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import EventHomePreview from "@/components/EventHomePreview"
import EventMastersPreview from "@/components/EventMastersPreview"
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
}

interface PageConfig {
  id: PageId
  label: string
  toggleable: boolean
}

interface ProgrammaItem { time: string; description: string }
interface PraktischItem { label: string; value: string }

type ContentMap = Partial<Record<PageId, Record<string, unknown>>>
type StyleConfig = typeof STYLE_CONFIG[Style]

const UPLOAD_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", gif: "image/gif",
}

async function uploadToStorage(file: File, bucket: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const contentType = file.type || UPLOAD_MIME[ext] || "image/jpeg"
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { contentType, upsert: true })
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

const CONTROLS_PAGES = new Set<PageId>(["home", "ceremoniemeesters"])

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [heroImageError, setHeroImageError] = useState<string | null>(null)
  const [isEditingControls, setIsEditingControls] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [masterPhotoUrls, setMasterPhotoUrls] = useState<[string | null, string | null]>([null, null])
  const [masterFiles, setMasterFiles] = useState<[File | null, File | null]>([null, null])
  const masterPhotoRef0 = useRef<HTMLInputElement>(null)
  const masterPhotoRef1 = useRef<HTMLInputElement>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

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
  }, [router])

  useEffect(() => {
    function measure() {
      const el = canvasContainerRef.current
      if (!el) return
      setCanvasScale(Math.min(1, Math.max(0.4, (el.clientWidth - 48) / 1024)))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = canvasContainerRef.current
      if (!el) return
      setCanvasScale(Math.min(1, Math.max(0.4, (el.clientWidth - 48) / 1024)))
    })
    return () => cancelAnimationFrame(id)
  }, [isEditingControls])

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

      const mergedContent: ContentMap = {
        ...content,
        home: {
          ...(content.home ?? {}),
          title: homeContent.title,
          body: homeContent.body,
          align: homeContent.align,
        },
        ceremoniemeesters: { masters: uploadedMasters },
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, hero_image_url: uploadedHeroUrl, pages: activePages, content: mergedContent }),
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

  const sc = STYLE_CONFIG[style]

  const activePagesOrdered = PAGES.filter((p) => active[p.id])
  const eventName = draft?.naam || "Jouw evenement"
  const eventDate = draft?.datum ? formatDate(draft.datum) : "Datum nog niet ingesteld"
  const eventLocatie = draft?.locatie || ""
  const typeLabel = draft?.type ? TYPE_LABEL[draft.type] : "Evenement"
  const heroOverlay = draft?.heroOverlay ?? true
  const homeContent: HomeContent = draft?.homeContent ?? { title: "", body: "", align: "center" }

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
  const praktischItems = (content.praktisch?.items as PraktischItem[]) || []

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans antialiased overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-10">
        <Link href="/aanmaken" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-rose-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug naar basisinfo
        </Link>
        <span className="text-sm font-bold text-rose-600 tracking-tight hidden sm:block">maakjefeest.nl</span>
        <div className="flex flex-col items-end gap-1">
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
          {publishError && <p className="text-xs text-red-500 font-medium">{publishError}</p>}
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

          {/* ── Controls | Canvas (home + ceremoniemeesters) ── */}
          {CONTROLS_PAGES.has(previewPage) && !editingPage ? (
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* Middle — Controls (inklapbaar) */}
              {isEditingControls && (
              <div className="w-[300px] flex-shrink-0 overflow-y-auto bg-white border-r border-gray-100 p-6 flex flex-col gap-6">

                {/* ── Home controls ── */}
                {previewPage === "home" && (<>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Event</p>
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-gray-600">Naam evenement</span>
                        <input
                          type="text"
                          value={draft?.naam ?? ""}
                          onChange={(e) => updateDraft({ naam: e.target.value })}
                          placeholder="Bijv. Bruiloft Michiel & Lisa"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
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

                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => setIsEditingControls(false)}
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

              {/* Right — Canvas (Scaling Wrapper) */}
              <div ref={canvasContainerRef} className="flex-1 overflow-y-auto bg-gray-100 p-6">
                <div className="mx-auto" style={{ width: `${Math.round(1024 * canvasScale)}px` }}>
                  <div style={{ width: 1024, transform: `scale(${canvasScale})`, transformOrigin: "top left" }}>
                    <div className="rounded-2xl shadow-xl overflow-clip" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
                      {sc.fontImport && <style>{sc.fontImport}</style>}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400">
                          jouwfeest.maakjefeest.nl
                        </div>
                      </div>
                      <nav className="px-5 py-3 border-b flex items-center" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
                        <span className="text-sm font-bold mr-4 flex-shrink-0" style={{ color: sc.accent, fontFamily: sc.fontFamily }}>{eventName}</span>
                        <div className="flex items-center">
                          {activePagesOrdered.map((page) => (
                            <span key={page.id} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={page.id === previewPage ? { color: sc.accent, backgroundColor: `${sc.accent}15` } : { color: sc.navText }}>
                              {page.label}
                            </span>
                          ))}
                        </div>
                      </nav>
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
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3">Dit is precies hoe jouw site eruitziet</p>
                  </div>
                </div>
              </div>

            </div>

          ) : (

            <div className="flex-1 overflow-y-auto p-3">
              {/* ── Editor panel (niet-home pagina's) ── */}
              {editingPage && (
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
              )}

              {/* ── Preview (niet-home pagina's) ── */}
              {!editingPage && (
                <div className={`mx-auto rounded-3xl shadow-xl overflow-hidden min-h-[500px] transition-all duration-300 ${
                  viewport === "mobiel"
                    ? "w-[390px] ring-4 ring-gray-800 ring-offset-2 rounded-[2rem]"
                    : "max-w-2xl"
                }`} style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>

                  {sc.fontImport && <style>{sc.fontImport}</style>}

                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400">
                      jouwfeest.maakjefeest.nl
                    </div>
                  </div>

                  <nav className="relative px-5 py-3 border-b flex items-center" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
                    <span className="text-sm font-bold mr-4 flex-shrink-0" style={{ color: sc.accent, fontFamily: sc.fontFamily }}>{eventName}</span>
                    {viewport === "mobiel" ? (
                      <div className="relative ml-auto">
                        <button onClick={() => setMobileNavOpen((v) => !v)} className="p-1.5 rounded-lg" style={{ color: sc.navText }}>
                          {mobileNavOpen
                            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                          }
                        </button>
                        {mobileNavOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMobileNavOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg border overflow-hidden min-w-[140px]" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
                              {activePagesOrdered.map((page) => (
                                <button key={page.id} onClick={() => { setPreviewPage(page.id); setMobileNavOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm font-medium" style={previewPage === page.id ? { color: sc.accent, backgroundColor: `${sc.accent}12` } : { color: sc.navText }}>
                                  {page.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-0">
                        {activePagesOrdered.map((page) => (
                          <button key={page.id} onClick={() => setPreviewPage(page.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0" style={previewPage === page.id ? { color: sc.accent, backgroundColor: `${sc.accent}15` } : { color: sc.navText }}>
                            {page.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </nav>

                  {/* Programma */}
                  {previewPage === "programma" && (
                    <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                      <h2 className="text-lg font-extrabold mb-6" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Programma</h2>
                      {programmaItems.length > 0
                        ? programmaItems.map((item, i) => (
                            <div key={i} className="flex gap-4 mb-4">
                              <span className="text-xs font-bold w-10 flex-shrink-0 pt-0.5" style={{ color: sc.labelColor }}>{item.time}</span>
                              <p className="text-sm" style={{ color: sc.bodyText }}>{item.description}</p>
                            </div>
                          ))
                        : [["14:00", "Aankomst gasten"], ["15:00", "Ceremonie"], ["17:00", "Borrel"]].map(([t, d]) => (
                            <div key={t} className="flex gap-4 mb-4 opacity-30">
                              <span className="text-xs font-bold w-10 flex-shrink-0 pt-0.5" style={{ color: sc.labelColor }}>{t}</span>
                              <p className="text-sm italic" style={{ color: sc.bodyText }}>{d}</p>
                            </div>
                          ))
                      }
                    </div>
                  )}

                  {/* RSVP */}
                  {previewPage === "rsvp" && (
                    <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
                      <h2 className="text-lg font-extrabold mb-2" style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}>Aanmelden</h2>
                      <p className="text-sm mb-6" style={{ color: sc.bodyText }}>Laat weten of je erbij bent!</p>
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

                  {/* Praktisch */}
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

                  {/* Wishlist */}
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

                  {/* Fotos */}
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
              )}
            </div>

          )}
        </main>
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
