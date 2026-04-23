import { createServiceClient } from "@/lib/supabase"
import RsvpForm from "./rsvp-form"

interface Page {
  id: string
  type: string
  title: string
  content: Record<string, unknown>
  order: number
}

interface Event {
  id: string
  slug: string
  type: string
  title: string
  datum: string
  locatie: string
}

const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

function formatDate(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, type, title, datum, locatie")
    .eq("slug", slug)
    .eq("status", "published")
    .single<Event>()

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Pagina niet gevonden</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Deze eventwebsite bestaat niet of is nog niet gepubliceerd.
          </p>
          <a
            href="https://maakjefeest.nl"
            className="inline-flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl text-white shadow-md"
            style={{ backgroundColor: "#E8627A" }}
          >
            Maak jouw eigen eventwebsite
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("id, type, title, content, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })

  const pageList: Page[] = pages ?? []

  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <span
            className="text-base font-extrabold tracking-tight flex-shrink-0 truncate max-w-[180px] sm:max-w-xs"
            style={{ color: "#E8627A" }}
          >
            {event.title}
          </span>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {pageList.map((page) => (
              <a
                key={page.id}
                href={`#${page.type}`}
                className="text-xs font-semibold text-gray-500 hover:text-[#E8627A] px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                {page.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 pt-16 pb-24 px-6 text-center">
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-rose-200 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-orange-200 opacity-20 blur-3xl" />

        {/* Wave */}
        <svg aria-hidden className="pointer-events-none absolute bottom-0 left-0 w-full text-white" viewBox="0 0 1440 48" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,24 C360,48 1080,0 1440,24 L1440,48 L0,48 Z" />
        </svg>

        <div className="relative max-w-2xl mx-auto">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm"
            style={{ color: "#E8627A" }}
          >
            {TYPE_LABEL[event.type] ?? "Evenement"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-600">
            {event.datum && (
              <span className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5">
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#E8627A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formatDate(event.datum)}
              </span>
            )}
            {event.locatie && (
              <span className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5">
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#E8627A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.locatie}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Page sections ── */}
      <div className="max-w-3xl mx-auto px-5 py-14 flex flex-col gap-16">
        {pageList.map((page) => (
          <section key={page.id} id={page.type} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-7">
              <span className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: "#E8627A" }} />
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{page.title}</h2>
            </div>
            <PageContent page={page} />
          </section>
        ))}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-7 text-center text-xs text-gray-400">
        Gemaakt met{" "}
        <a href="https://maakjefeest.nl" className="font-semibold hover:underline" style={{ color: "#E8627A" }}>
          maakjefeest.nl
        </a>
      </footer>
    </div>
  )
}

function PageContent({ page }: { page: Page }) {
  const c = page.content ?? {}

  if (page.type === "rsvp") {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
        <p className="text-gray-500 text-sm mb-6">Laat weten of je erbij bent — vul het formulier in.</p>
        <RsvpForm />
      </div>
    )
  }

  if (page.type === "home") {
    const text = typeof c.text === "string" ? c.text : null
    if (!text) {
      return (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-sm text-gray-500 italic">
          Welkomsttekst wordt binnenkort toegevoegd.
        </div>
      )
    }
    return <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">{text}</p>
  }

  if (page.type === "programma") {
    const items = Array.isArray(c.items) ? (c.items as { time: string; description: string }[]) : []
    if (items.length === 0) {
      return <Placeholder>Het programma wordt binnenkort toegevoegd.</Placeholder>
    }
    return (
      <div className="flex flex-col gap-0 border border-gray-100 rounded-2xl overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className={`flex gap-4 px-6 py-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <span className="text-sm font-bold w-14 flex-shrink-0 pt-0.5" style={{ color: "#E8627A" }}>
              {item.time}
            </span>
            <p className="text-gray-700 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "praktisch") {
    const items = Array.isArray(c.items) ? (c.items as { label: string; value: string }[]) : []
    if (items.length === 0) {
      return <Placeholder>Praktische informatie wordt binnenkort toegevoegd.</Placeholder>
    }
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
            <p className="text-gray-800 font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "wishlist") {
    const items = Array.isArray(c.items) ? (c.items as { name: string; url?: string; price?: string }[]) : []
    if (items.length === 0) {
      return <Placeholder>De wishlist wordt binnenkort toegevoegd.</Placeholder>
    }
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
              {item.price && <p className="text-xs text-gray-400 mt-0.5">{item.price}</p>}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors flex-shrink-0"
                style={{ color: "#E8627A" }}
              >
                Bekijk
              </a>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "fotos") {
    const urls = Array.isArray(c.urls) ? (c.urls as string[]) : []
    if (urls.length === 0) {
      return <Placeholder>Foto&apos;s worden binnenkort toegevoegd.</Placeholder>
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {urls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" className="rounded-2xl aspect-square object-cover w-full" />
        ))}
      </div>
    )
  }

  const text = typeof c.text === "string" ? c.text : null
  if (!text) return <Placeholder>Inhoud wordt binnenkort toegevoegd.</Placeholder>
  return <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-6 py-5 text-sm text-gray-400 italic">
      {children}
    </div>
  )
}
