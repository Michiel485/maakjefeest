import { createServiceClient } from "@/lib/supabase"
import RsvpForm from "./rsvp-form"

// ── Style system (mirrors the builder exactly) ────────────────────────────────

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

type Style = keyof typeof STYLE_CONFIG
type SC = typeof STYLE_CONFIG[Style]

// ── Types ─────────────────────────────────────────────────────────────────────

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
  style: string
  hero_image_url: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, type, title, datum, locatie, style, hero_image_url")
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

  const style: Style = (event.style in STYLE_CONFIG) ? (event.style as Style) : "roze"
  const sc = STYLE_CONFIG[style]

  const homePage = pageList.find((p) => p.type === "home")
  const homeContent = homePage?.content ?? {}
  const homeTitle = typeof homeContent.title === "string" ? homeContent.title : null
  const homeBody = typeof homeContent.body === "string" ? homeContent.body : null
  const homeAlign = (homeContent.align as string) || "center"

  return (
    <div className="min-h-screen" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-30 border-b shadow-sm" style={{ backgroundColor: sc.navBg, borderColor: `${sc.accent}22` }}>
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <span
            className="text-base font-extrabold tracking-tight flex-shrink-0 truncate max-w-[180px] sm:max-w-xs"
            style={{ color: sc.accent, fontFamily: sc.fontFamily }}
          >
            {event.title}
          </span>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {pageList.map((page) => (
              <a
                key={page.id}
                href={`#${page.type}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-75 transition-opacity flex-shrink-0 whitespace-nowrap"
                style={{ color: sc.navText }}
              >
                {page.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        id="home"
        className="relative overflow-hidden text-center"
        style={event.hero_image_url
          ? { backgroundImage: `url(${event.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: sc.heroGradient }
        }
      >
        {event.hero_image_url && (
          <div className="absolute inset-0" style={{ backgroundColor: sc.accent, opacity: 0.45 }} />
        )}
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 sm:py-20">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={event.hero_image_url
              ? { color: "#fff", backgroundColor: "rgba(255,255,255,0.2)" }
              : { color: sc.accent, backgroundColor: `${sc.accent}15` }
            }
          >
            {TYPE_LABEL[event.type] ?? "Evenement"}
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5"
            style={{ color: event.hero_image_url ? "#ffffff" : sc.headingColor, fontFamily: sc.fontFamily }}
          >
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-8">
            {event.datum && (
              <span className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5" style={{ color: event.hero_image_url ? sc.headingColor : sc.bodyText }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: sc.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formatDate(event.datum)}
              </span>
            )}
            {event.locatie && (
              <span className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5" style={{ color: event.hero_image_url ? sc.headingColor : sc.bodyText }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: sc.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.locatie}
              </span>
            )}
          </div>
          <a
            href="#rsvp"
            className="inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: sc.buttonBg, color: sc.buttonText }}
          >
            Meld je aan
          </a>
        </div>
      </section>

      {/* ── Home content block ── */}
      {(homeTitle || homeBody) && (
        <div className="max-w-3xl mx-auto px-5 pt-10 pb-2">
          {homeTitle && (
            <p
              className="font-bold mb-2"
              style={{
                color: sc.headingColor,
                fontFamily: sc.fontFamily,
                textAlign: homeAlign as React.CSSProperties["textAlign"],
                fontSize: "1rem",
              }}
            >
              {homeTitle}
            </p>
          )}
          {homeBody && (
            <div
              className="text-sm leading-relaxed"
              style={{
                color: sc.bodyText,
                fontFamily: sc.fontFamily,
                textAlign: homeAlign as React.CSSProperties["textAlign"],
              }}
              dangerouslySetInnerHTML={{ __html: homeBody }}
            />
          )}
        </div>
      )}

      {/* ── Page sections (non-home) ── */}
      <div className="max-w-3xl mx-auto px-5 py-14 flex flex-col gap-16">
        {pageList.filter((p) => p.type !== "home").map((page) => (
          <section key={page.id} id={page.type} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-7">
              <span className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sc.accent }} />
              <h2
                className="text-xl sm:text-2xl font-extrabold"
                style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}
              >
                {page.title}
              </h2>
            </div>
            <PageContent page={page} sc={sc} />
          </section>
        ))}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-7 text-center text-xs" style={{ borderColor: `${sc.accent}20`, color: sc.bodyText }}>
        Gemaakt met{" "}
        <a href="https://maakjefeest.nl" className="font-semibold hover:underline" style={{ color: sc.accent }}>
          maakjefeest.nl
        </a>
      </footer>
    </div>
  )
}

// ── Page content renderer ─────────────────────────────────────────────────────

function PageContent({ page, sc }: { page: Page; sc: SC }) {
  const c = page.content ?? {}

  if (page.type === "rsvp") {
    return (
      <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: `${sc.accent}08`, borderColor: `${sc.accent}20` }}>
        <p className="text-sm mb-6" style={{ color: sc.bodyText }}>Laat weten of je erbij bent — vul het formulier in.</p>
        <RsvpForm />
      </div>
    )
  }

  if (page.type === "programma") {
    const items = Array.isArray(c.items) ? (c.items as { time: string; description: string }[]) : []
    if (items.length === 0) return <Placeholder sc={sc}>Het programma wordt binnenkort toegevoegd.</Placeholder>
    return (
      <div className="flex flex-col gap-0 border rounded-2xl overflow-hidden" style={{ borderColor: `${sc.accent}20` }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 px-6 py-4"
            style={{ backgroundColor: i % 2 === 0 ? sc.navBg : `${sc.accent}06` }}
          >
            <span className="text-sm font-bold w-14 flex-shrink-0 pt-0.5" style={{ color: sc.labelColor }}>{item.time}</span>
            <p className="text-sm" style={{ color: sc.bodyText }}>{item.description}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "praktisch") {
    const items = Array.isArray(c.items) ? (c.items as { label: string; value: string }[]) : []
    if (items.length === 0) return <Placeholder sc={sc}>Praktische informatie wordt binnenkort toegevoegd.</Placeholder>
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl border p-5"
            style={{ borderColor: `${sc.accent}20`, backgroundColor: `${sc.accent}06` }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: sc.labelColor }}>{item.label}</p>
            <p className="font-semibold" style={{ color: sc.headingColor }}>{item.value}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "wishlist") {
    const items = Array.isArray(c.items) ? (c.items as { name: string; url?: string; price?: string }[]) : []
    if (items.length === 0) return <Placeholder sc={sc}>De wishlist wordt binnenkort toegevoegd.</Placeholder>
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl border p-5 flex items-center justify-between gap-3"
            style={{ borderColor: `${sc.accent}20` }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: sc.headingColor }}>{item.name}</p>
              {item.price && <p className="text-xs mt-0.5" style={{ color: sc.bodyText }}>{item.price}</p>}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 hover:opacity-80"
                style={{ color: sc.accent, borderColor: `${sc.accent}40` }}
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
    if (urls.length === 0) return <Placeholder sc={sc}>Foto&apos;s worden binnenkort toegevoegd.</Placeholder>
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
  if (!text) return <Placeholder sc={sc}>Inhoud wordt binnenkort toegevoegd.</Placeholder>
  return <p className="leading-relaxed whitespace-pre-wrap text-sm" style={{ color: sc.bodyText }}>{text}</p>
}

function Placeholder({ children, sc }: { children: React.ReactNode; sc: SC }) {
  return (
    <div
      className="rounded-2xl border px-6 py-5 text-sm italic"
      style={{ borderColor: `${sc.accent}20`, backgroundColor: `${sc.accent}06`, color: sc.bodyText }}
    >
      {children}
    </div>
  )
}
