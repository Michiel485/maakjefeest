"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type EventType = "bruiloft" | "verjaardag" | "evenement"

interface Draft {
  type: EventType
  naam: string
  datum: string
  locatie: string
  email: string
}

type PageId = "home" | "programma" | "rsvp" | "praktisch" | "wishlist" | "fotos"

interface PageConfig {
  id: PageId
  label: string
  toggleable: boolean
}

const PAGES: PageConfig[] = [
  { id: "home",      label: "Home",      toggleable: false },
  { id: "programma", label: "Programma", toggleable: true  },
  { id: "rsvp",      label: "RSVP",      toggleable: false },
  { id: "praktisch", label: "Praktisch", toggleable: true  },
  { id: "wishlist",  label: "Wishlist",  toggleable: true  },
  { id: "fotos",     label: "Foto's",    toggleable: true  },
]

const TYPE_LABEL: Record<EventType, string> = {
  bruiloft:   "Bruiloft",
  verjaardag: "Verjaardag",
  evenement:  "Evenement",
}

function formatDate(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

export default function BouwenPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [active, setActive] = useState<Record<PageId, boolean>>({
    home: true, programma: true, rsvp: true, praktisch: false, wishlist: false, fotos: false,
  })
  const [previewPage, setPreviewPage] = useState<PageId>("home")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("maakjefeest_draft")
      if (!raw) { router.replace("/aanmaken"); return }
      setDraft(JSON.parse(raw))
    } catch {
      router.replace("/aanmaken")
    }
  }, [router])

  function toggle(id: PageId) {
    setActive((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (!next[previewPage]) {
        const fallback = PAGES.find((p) => next[p.id])
        if (fallback) setPreviewPage(fallback.id)
      }
      return next
    })
  }

  const activePagesOrdered = PAGES.filter((p) => active[p.id])
  const eventName = draft?.naam || "Jouw evenement"
  const eventDate = draft?.datum ? formatDate(draft.datum) : "Datum nog niet ingesteld"
  const eventLocatie = draft?.locatie || ""
  const typeLabel = draft?.type ? TYPE_LABEL[draft.type] : "Evenement"

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans antialiased overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-10">
        <Link
          href="/aanmaken"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-rose-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug naar basisinfo
        </Link>

        <span className="text-sm font-bold text-rose-600 tracking-tight hidden sm:block">maakjefeest.nl</span>

        <button className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-100 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Publiceren voor €24
        </button>
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
                return (
                  <div
                    key={page.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                      previewPage === page.id && isOn
                        ? "bg-rose-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => isOn && setPreviewPage(page.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOn ? "bg-rose-400" : "bg-gray-200"}`} />
                      <span className={`text-sm font-medium ${isOn ? "text-gray-800" : "text-gray-400"}`}>
                        {page.label}
                      </span>
                      {!page.toggleable && (
                        <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">vast</span>
                      )}
                    </div>

                    {page.toggleable ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(page.id) }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${isOn ? "bg-pink-500" : "bg-gray-200"}`}
                      >
                        <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 font-semibold">aan</span>
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

        {/* ── Preview ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="flex items-center justify-between px-6 py-2.5 bg-gray-100 border-b border-gray-200 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live preview</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
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
              <nav className="flex items-center gap-0 px-6 py-3 border-b border-gray-100 bg-white overflow-x-auto">
                <span className="text-sm font-bold text-rose-600 mr-6 flex-shrink-0">{eventName}</span>
                {activePagesOrdered.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setPreviewPage(page.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      previewPage === page.id
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {page.label}
                  </button>
                ))}
              </nav>

              {/* Mock page content */}
              {previewPage === "home" && (
                <div>
                  <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 px-8 py-14 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3">{typeLabel}</p>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{eventName}</h1>
                    <p className="text-sm text-gray-500 mb-1">{eventDate}</p>
                    {eventLocatie && <p className="text-sm text-gray-400">{eventLocatie}</p>}
                    <div className="mt-6 inline-flex items-center gap-2 bg-rose-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl">
                      Meld je aan
                    </div>
                  </div>
                  <div className="px-8 py-8">
                    <div className="h-3 bg-gray-100 rounded-full w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded-full w-full mb-3" />
                    <div className="h-3 bg-gray-100 rounded-full w-2/3" />
                  </div>
                </div>
              )}

              {previewPage === "programma" && (
                <div className="px-8 py-10">
                  <h2 className="text-lg font-extrabold text-gray-900 mb-6">Programma</h2>
                  {[["14:00", "Aankomst gasten"], ["15:00", "Ceremonie"], ["17:00", "Borrel"], ["19:00", "Diner"]].map(([time, item]) => (
                    <div key={time} className="flex gap-4 mb-5">
                      <span className="text-xs font-bold text-rose-400 w-10 flex-shrink-0 pt-0.5">{time}</span>
                      <div>
                        <div className="h-2.5 bg-gray-100 rounded-full w-40" />
                        <p className="text-xs text-gray-400 mt-1">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

              {previewPage === "praktisch" && (
                <div className="px-8 py-10">
                  <h2 className="text-lg font-extrabold text-gray-900 mb-6">Praktische info</h2>
                  {[["Locatie", eventLocatie || "Nog in te vullen"], ["Datum", eventDate], ["Parkeren", "Gratis parkeren aanwezig"]].map(([k, v]) => (
                    <div key={k} className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{k}</p>
                      <p className="text-sm text-gray-700">{v}</p>
                    </div>
                  ))}
                </div>
              )}

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

              {previewPage === "fotos" && (
                <div className="px-8 py-10">
                  <h2 className="text-lg font-extrabold text-gray-900 mb-6">Foto's</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="aspect-square rounded-xl bg-gray-100" />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
