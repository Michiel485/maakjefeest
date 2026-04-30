import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"
import { SignOutButton } from "./SignOutButton"

type Event = {
  id: string
  slug: string
  title: string
  type: string
  status: string
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

function EventCard({ event, isDraft = false }: { event: Event; isDraft?: boolean }) {
  const typeLabel = TYPE_LABEL[event.type] ?? event.type
  const date = new Date(event.created_at).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between gap-4 shadow-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-400">{typeLabel}</span>
          {isDraft && (
            <span className="text-xs bg-amber-100 text-amber-600 font-semibold px-2 py-0.5 rounded-full">
              Concept
            </span>
          )}
          {!isDraft && (
            <span className="text-xs bg-emerald-100 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 truncate">{event.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">Opgeslagen op {date}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {!isDraft && (
          <a
            href={`https://${event.slug}.maakjefeest.nl`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-rose-500 font-medium transition-colors whitespace-nowrap"
          >
            Bekijken →
          </a>
        )}
        <Link
          href="/bouwen"
          className="text-sm bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          Verder bewerken
        </Link>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/inloggen")

  const service = createServiceClient()
  const { data: events } = await service
    .from("events")
    .select("id, slug, title, type, status, created_at")
    .eq("user_email", user.email!)
    .order("created_at", { ascending: false })

  const published = (events ?? []).filter((e: Event) => e.status === "published")
  const drafts = (events ?? []).filter((e: Event) => e.status === "draft")
  const firstName = user.email?.split("@")[0] ?? "daar"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-rose-600 tracking-tight">
            maakjefeest.nl
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Welkom, {firstName}!
          </h1>
          <p className="text-gray-500">
            Hier vind je al jullie bruiloftsprojecten en RSVP-aanmeldingen.
          </p>
        </div>

        {/* Live websites */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Live bruiloftswebsites
            </h2>
            <Link
              href="/aanmaken"
              className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              + Nieuwe bruiloft
            </Link>
          </div>
          {published.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Nog geen live bruiloftswebsite. Bouw er een en publiceer hem voor eenmalig €24!
              </p>
              <Link
                href="/aanmaken"
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Start nu gratis
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {published.map((ev: Event) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </section>

        {/* Drafts */}
        {drafts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Opgeslagen concepten
            </h2>
            <div className="flex flex-col gap-4">
              {drafts.map((ev: Event) => (
                <EventCard key={ev.id} event={ev} isDraft />
              ))}
            </div>
          </section>
        )}

        {/* RSVP */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            RSVP-aanmeldingen
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">
              Aanmeldingen van jullie gasten verschijnen hier zodra de bruiloftswebsite live is.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
