import { createServiceClient } from "@/lib/supabase"

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

function formatDate(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("nl-NL", {
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 font-sans antialiased flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Pagina niet gevonden</h1>
          <p className="text-gray-500 leading-relaxed">
            Deze eventwebsite bestaat niet of is nog niet gepubliceerd.
          </p>
          <a href="https://maakjefeest.nl" className="inline-block mt-6 text-sm font-semibold text-[#E8627A] hover:underline">
            Maak jouw eigen eventwebsite →
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
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto">
          <span className="text-base font-extrabold text-[#E8627A] flex-shrink-0 tracking-tight">
            {event.title}
          </span>
          <nav className="flex items-center gap-1">
            {pageList.map((page) => (
              <a
                key={page.id}
                href={`#${page.type}`}
                className="text-xs font-semibold text-gray-500 hover:text-[#E8627A] px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0"
              >
                {page.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 pt-16 pb-20 px-6 text-center">
        <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-rose-200 opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-orange-200 opacity-20 blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8627A] mb-4">
            {event.type === "bruiloft" ? "Bruiloft" : event.type === "verjaardag" ? "Verjaardag" : "Evenement"}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            {event.datum && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#E8627A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formatDate(event.datum)}
              </span>
            )}
            {event.locatie && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#E8627A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {event.locatie}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Page sections */}
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-16">
        {pageList.map((page) => (
          <section key={page.id} id={page.type}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 pb-3 border-b border-gray-100">
              {page.title}
            </h2>
            <PageContent page={page} />
          </section>
        ))}
      </div>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Gemaakt met{" "}
        <a href="https://maakjefeest.nl" className="text-[#E8627A] font-semibold hover:underline">
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
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8">
        <p className="text-gray-500 mb-6">Laat weten of je erbij bent door het formulier in te vullen.</p>
        <div className="flex flex-col gap-4 max-w-md">
          {["Naam", "E-mailadres", "Aantal personen"].map((label) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <div className="h-10 rounded-xl border border-gray-200 bg-white" />
            </div>
          ))}
          <div className="h-11 rounded-xl mt-2" style={{ backgroundColor: "#E8627A" }} />
        </div>
      </div>
    )
  }

  if (page.type === "programma") {
    const items = Array.isArray(c.items) ? c.items as { time: string; description: string }[] : []
    if (items.length === 0) {
      return <p className="text-gray-400 italic">Het programma wordt binnenkort toegevoegd.</p>
    }
    return (
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4 items-start">
            <span className="text-xs font-bold w-12 flex-shrink-0 pt-1" style={{ color: "#E8627A" }}>{item.time}</span>
            <p className="text-gray-700">{item.description}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "praktisch") {
    const items = Array.isArray(c.items) ? c.items as { label: string; value: string }[] : []
    if (items.length === 0) {
      return <p className="text-gray-400 italic">Praktische informatie wordt binnenkort toegevoegd.</p>
    }
    return (
      <div className="grid sm:grid-cols-2 gap-5">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{item.label}</p>
            <p className="text-gray-800 font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "wishlist") {
    const items = Array.isArray(c.items) ? c.items as { name: string; url?: string; price?: string }[] : []
    if (items.length === 0) {
      return <p className="text-gray-400 italic">De wishlist wordt binnenkort toegevoegd.</p>
    }
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-800">{item.name}</p>
              {item.price && <p className="text-sm text-gray-400">{item.price}</p>}
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border text-[#E8627A] border-rose-200 hover:bg-rose-50 transition-colors flex-shrink-0">
                Bekijk
              </a>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "fotos") {
    const urls = Array.isArray(c.urls) ? c.urls as string[] : []
    if (urls.length === 0) {
      return <p className="text-gray-400 italic">Foto's worden binnenkort toegevoegd.</p>
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" className="rounded-2xl aspect-square object-cover w-full" />
        ))}
      </div>
    )
  }

  // home / fallback: render text content
  const text = typeof c.text === "string" ? c.text : null
  if (!text) return <p className="text-gray-400 italic">Inhoud wordt binnenkort toegevoegd.</p>
  return <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
}
