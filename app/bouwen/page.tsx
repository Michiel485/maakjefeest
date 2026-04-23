"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type EventType = "bruiloft" | "verjaardag" | "evenement"
type PageId = "home" | "programma" | "rsvp" | "praktisch" | "wishlist" | "fotos"

interface Draft {
  type: EventType
  naam: string
  datum: string
  locatie: string
  email: string
}

interface PageConfig {
  id: PageId
  label: string
  toggleable: boolean
}

interface ProgrammaItem { time: string; description: string }
interface PraktischItem { label: string; value: string }

type ContentMap = Partial<Record<PageId, Record<string, unknown>>>

const PAGES: PageConfig[] = [
  { id: "home",      label: "Home",      toggleable: false },
  { id: "programma", label: "Programma", toggleable: true  },
  { id: "rsvp",      label: "RSVP",      toggleable: false },
  { id: "praktisch", label: "Praktisch", toggleable: true  },
  { id: "wishlist",  label: "Wishlist",  toggleable: true  },
  { id: "fotos",     label: "Foto's",    toggleable: true  },
]

const TYPE_LABEL: Record<EventType, string> = {
  bruiloft: "Bruiloft", verjaardag: "Verjaardag", evenement: "Evenement",
}

function formatDate(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

export default function BouwenPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [active, setActive] = useState<Record<PageId, boolean>>({
    home: true, programma: true, rsvp: true, praktisch: false, wishlist: false, fotos: false,
  })
  const [previewPage, setPreviewPage] = useState<PageId>("home")
  const [editingPage, setEditingPage] = useState<PageId | null>(null)
  const [content, setContent] = useState<ContentMap>({})
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("maakjefeest_draft")
      if (!raw) { router.replace("/aanmaken"); return }
      setDraft(JSON.parse(raw))
    } catch { router.replace("/aanmaken") }

    try {
      const saved = localStorage.getItem("maakjefeest_content")
      if (saved) setContent(JSON.parse(saved))
    } catch {}
  }, [router])

  function updateContent(pageId: PageId, value: Record<string, unknown>) {
    setContent((prev) => {
      const next = { ...prev, [pageId]: value }
      localStorage.setItem("maakjefeest_content", JSON.stringify(next))
      return next
    })
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

  function openEditor(id: PageId) {
    setPreviewPage(id)
    setEditingPage(id)
  }

  async function handlePublish() {
    if (!draft) return
    setPublishing(true)
    setPublishError(null)
    try {
      const activePages = PAGES.filter((p) => active[p.id]).map((p) => p.id)
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, pages: activePages, content }),
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

  const activePagesOrdered = PAGES.filter((p) => active[p.id])
  const eventName = draft?.naam || "Jouw evenement"
  const eventDate = draft?.datum ? formatDate(draft.datum) : "Datum nog niet ingesteld"
  const eventLocatie = draft?.locatie || ""
  const typeLabel = draft?.type ? TYPE_LABEL[draft.type] : "Evenement"

  const homeText = (content.home?.text as string) || ""
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
          <div className="px-5 pt-6 pb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Pagina's</p>
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

                    {/* Bewerken knop — alleen als pagina aan staat */}
                    {isOn && (
                      <div className="px-3 pb-2.5">
                        <button
                          onClick={() => isEditing ? setEditingPage(null) : openEditor(page.id)}
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
          <div className="flex items-center justify-between px-6 py-2.5 bg-gray-100 border-b border-gray-200 flex-shrink-0">
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
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Editor panel ── */}
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

            {/* ── Preview ── */}
            {!editingPage && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px]">
                {/* Mock browser chrome */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-400 mx-2">
                    jouwfeest.maakjefeest.nl
                  </div>
                </div>

                {/* Mock site nav */}
                <nav className="flex items-center px-6 py-3 border-b border-gray-100 bg-white overflow-x-auto gap-0">
                  <span className="text-sm font-bold text-rose-600 mr-6 flex-shrink-0">{eventName}</span>
                  {activePagesOrdered.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setPreviewPage(page.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                        previewPage === page.id ? "bg-rose-50 text-rose-600" : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {page.label}
                    </button>
                  ))}
                </nav>

                {/* Home */}
                {previewPage === "home" && (
                  <div>
                    <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 px-8 py-12 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3">{typeLabel}</p>
                      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{eventName}</h1>
                      <p className="text-sm text-gray-500 mb-1">{eventDate}</p>
                      {eventLocatie && <p className="text-sm text-gray-400">{eventLocatie}</p>}
                      <div className="mt-5 inline-flex items-center gap-2 bg-rose-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl">Meld je aan</div>
                    </div>
                    <div className="px-8 py-6">
                      {homeText
                        ? <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{homeText}</p>
                        : <div className="space-y-2.5"><div className="h-3 bg-gray-100 rounded-full w-3/4" /><div className="h-3 bg-gray-100 rounded-full w-full" /><div className="h-3 bg-gray-100 rounded-full w-2/3" /></div>
                      }
                    </div>
                  </div>
                )}

                {/* Programma */}
                {previewPage === "programma" && (
                  <div className="px-8 py-10">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-6">Programma</h2>
                    {programmaItems.length > 0
                      ? programmaItems.map((item, i) => (
                          <div key={i} className="flex gap-4 mb-4">
                            <span className="text-xs font-bold text-rose-400 w-10 flex-shrink-0 pt-0.5">{item.time}</span>
                            <p className="text-sm text-gray-700">{item.description}</p>
                          </div>
                        ))
                      : [["14:00", "Aankomst gasten"], ["15:00", "Ceremonie"], ["17:00", "Borrel"]].map(([t, d]) => (
                          <div key={t} className="flex gap-4 mb-4 opacity-30">
                            <span className="text-xs font-bold text-rose-400 w-10 flex-shrink-0 pt-0.5">{t}</span>
                            <p className="text-sm text-gray-400 italic">{d}</p>
                          </div>
                        ))
                    }
                  </div>
                )}

                {/* RSVP */}
                {previewPage === "rsvp" && (
                  <div className="px-8 py-10">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-2">Aanmelden</h2>
                    <p className="text-sm text-gray-400 mb-6">Laat weten of je erbij bent!</p>
                    <div className="flex flex-col gap-3">
                      {["Naam", "E-mailadres", "Aantal personen"].map((f) => (
                        <div key={f}>
                          <div className="text-xs font-semibold text-gray-500 mb-1">{f}</div>
                          <div className="h-9 rounded-xl border border-gray-200 bg-gray-50" />
                        </div>
                      ))}
                      <div className="h-10 rounded-xl bg-rose-500 mt-2" />
                    </div>
                  </div>
                )}

                {/* Praktisch */}
                {previewPage === "praktisch" && (
                  <div className="px-8 py-10">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-6">Praktische info</h2>
                    {praktischItems.length > 0
                      ? praktischItems.map((item, i) => (
                          <div key={i} className="mb-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                            <p className="text-sm text-gray-700">{item.value}</p>
                          </div>
                        ))
                      : [["Locatie", eventLocatie || "Nog in te vullen"], ["Datum", eventDate]].map(([k, v]) => (
                          <div key={k} className="mb-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{k}</p>
                            <p className="text-sm text-gray-700">{v}</p>
                          </div>
                        ))
                    }
                  </div>
                )}

                {/* Wishlist */}
                {previewPage === "wishlist" && (
                  <div className="px-8 py-10">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-6">Wishlist</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="rounded-2xl border border-gray-100 p-4">
                          <div className="h-16 bg-gray-100 rounded-xl mb-3" />
                          <div className="h-2.5 bg-gray-100 rounded-full w-3/4 mb-1.5" />
                          <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fotos */}
                {previewPage === "fotos" && (
                  <div className="px-8 py-10">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-6">Foto&apos;s</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="aspect-square rounded-xl bg-gray-100" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
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
    return (
      <ProgrammaEditor
        items={items}
        onChange={(items) => onChange({ ...content, items })}
      />
    )
  }

  if (pageId === "praktisch") {
    const items = (content.items as { label: string; value: string }[]) ?? []
    return (
      <PraktischEditor
        items={items}
        onChange={(items) => onChange({ ...content, items })}
      />
    )
  }

  // RSVP / Wishlist / Fotos / fallback
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
  items,
  onChange,
}: {
  items: { time: string; description: string }[]
  onChange: (items: { time: string; description: string }[]) => void
}) {
  const [newTime, setNewTime] = useState("")
  const [newDesc, setNewDesc] = useState("")

  function add() {
    if (!newTime.trim() || !newDesc.trim()) return
    onChange([...items, { time: newTime.trim(), description: newDesc.trim() }])
    setNewTime("")
    setNewDesc("")
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-rose-500 w-12 flex-shrink-0">{item.time}</span>
              <span className="text-sm text-gray-700 flex-1">{item.description}</span>
              <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="14:00"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
        />
        <input
          type="text"
          placeholder="Beschrijving"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
        />
        <button
          onClick={add}
          className="flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          Voeg toe
        </button>
      </div>
    </div>
  )
}

function PraktischEditor({
  items,
  onChange,
}: {
  items: { label: string; value: string }[]
  onChange: (items: { label: string; value: string }[]) => void
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newValue, setNewValue] = useState("")

  function add() {
    if (!newLabel.trim() || !newValue.trim()) return
    onChange([...items, { label: newLabel.trim(), value: newValue.trim() }])
    setNewLabel("")
    setNewValue("")
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
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
              <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Label (bijv. Parkeren)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="w-36 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
        />
        <input
          type="text"
          placeholder="Waarde"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
        />
        <button
          onClick={add}
          className="flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          Voeg toe
        </button>
      </div>
    </div>
  )
}
