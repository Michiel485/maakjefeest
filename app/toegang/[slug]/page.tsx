import { notFound } from "next/navigation"
import type { Metadata, Viewport } from "next"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import EventGatekeeper from "@/components/EventGatekeeper"

// Het slot van een klantsite met een wachtwoord of geheime vraag. proxy.ts
// stuurt een bezoeker zonder geldige toegangscookie hierheen, met het adres
// van de site gewoon in de adresbalk. Hier staat alleen wat nodig is om het
// slot te tonen: de titel, de stijl en de vraag. Niets van de site zelf.

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: { absolute: "Beveiligde pagina" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export const viewport: Viewport = {
  colorScheme: "only light",
}

export default async function Toegang({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: event } = await createServiceClient()
    .from("events")
    .select("title, nav_title, style, font_frame_names, font_page_titles, pw_enabled, pw_type, pw_question")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (!event || !event.pw_enabled) notFound()

  const sc = getStyleConfig(event.style, {
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })

  return (
    <div className="min-h-screen" style={{ fontFamily: sc.fontFamily, background: sc.bodyBg }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}
      <EventGatekeeper
        slug={slug}
        pwType={(event.pw_type as "password" | "secret_question" | null) ?? null}
        pwQuestion={(event.pw_question as string | null) ?? null}
        sc={sc}
        eventTitle={(event.nav_title as string | null) || (event.title as string) || ""}
      />
    </div>
  )
}
