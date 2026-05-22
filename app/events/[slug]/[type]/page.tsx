import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, type SC } from "@/lib/event-styles"
import RsvpForm from "../rsvp-form"
import EventMastersPreview from "@/components/EventMastersPreview"
import EventProgramPreview from "@/components/EventProgramPreview"
import StoryPreview from "@/components/StoryPreview"
import PraktischPreview, { type PraktischTile } from "@/components/PraktischPreview"
import WishlistPreview, { type WishlistItem } from "@/components/WishlistPreview"

interface Page {
  id: string
  type: string
  title: string
  content: Record<string, unknown>
}

export default async function EventSubPage({
  params,
}: {
  params: Promise<{ slug: string; type: string }>
}) {
  const { slug, type } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, style, font_hero, font_initials, font_frame_names, font_page_titles")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) notFound()

  const { data: page } = await supabase
    .from("pages")
    .select("id, type, title, content")
    .eq("event_id", event.id)
    .eq("type", type)
    .eq("is_enabled", true)
    .single<Page>()

  if (!page) notFound()

  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero        as string | null,
    fontInitials:   event.font_initials    as string | null,
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })

  if (page.type === "OnsVerhaal") {
    const c = page.content ?? {}
    return (
      <StoryPreview
        title={typeof c.title === "string" ? c.title : null}
        text={typeof c.text === "string" ? c.text : null}
        imageUrl={typeof c.image_url === "string" ? c.image_url : null}
        imagePosX={typeof c.image_pos_x === "number" ? c.image_pos_x : 50}
        imagePosY={typeof c.image_pos_y === "number" ? c.image_pos_y : 50}
        showOverlay={typeof c.show_overlay === "boolean" ? c.show_overlay : true}
        sc={sc}
      />
    )
  }

  if (page.type === "Programma") {
    const items = Array.isArray(page.content?.items)
      ? (page.content.items as { id?: string; time: string; title?: string; description: string; iconId?: string; image_url?: string | null; imagePosX?: number }[])
      : []
    const rawLayout = (page.content?.layout as string) || "centered"
    const programLayout = (rawLayout === "bento" ? "centered" : rawLayout) as "centered" | "timeline"
    return <EventProgramPreview items={items} sc={sc} programLayout={programLayout} />
  }

  if (page.type === "Informatie") {
    const tiles = Array.isArray(page.content?.items) ? (page.content.items as PraktischTile[]) : []
    return <PraktischPreview tiles={tiles} sc={sc} />
  }

  if (page.type === "Cadeautips") {
    const items = Array.isArray(page.content?.items) ? (page.content.items as WishlistItem[]) : []
    return <WishlistPreview items={items} sc={sc} />
  }

  if (page.type === "Ceremoniemeesters") {
    const c = page.content ?? {}
    const rawMasters = Array.isArray(c.masters) ? (c.masters as { naam?: string; telefoon?: string; email?: string; foto_url?: string | null }[]) : []
    const masters = rawMasters.map((m) => ({
      naam: m.naam ?? "",
      telefoon: m.telefoon ?? "",
      email: m.email ?? "",
      foto_url: m.foto_url ?? null,
    }))
    const text = typeof c.text === "string" ? c.text : undefined
    return <EventMastersPreview masters={masters} sc={sc} text={text} />
  }

  if (page.type === "RSVP") {
    const c = page.content ?? {}
    const introText = (typeof c.text === "string" && c.text)
      ? c.text
      : "Laat weten of je erbij bent — vul het formulier in."
    const rsvpGuestTypes = Array.isArray(c.guestTypes) ? (c.guestTypes as string[]) : ["daggast", "avondgast"]
    const rsvpShowSong = typeof c.showSongRequest === "boolean" ? c.showSongRequest : false
    const rsvpDeadline = typeof c.deadline === "string" && c.deadline ? c.deadline : null
    const rsvpShowOvernachting = typeof c.showOvernachting === "boolean" ? c.showOvernachting : (typeof c.showBus === "boolean" ? c.showBus : false)
    const rsvpCustomQuestion = typeof c.customQuestion === "string" && c.customQuestion.trim() ? c.customQuestion : null
    const cardInner = (
      <>
        <p style={{ fontSize: "0.9375rem", marginBottom: 24, color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText }}>{introText}</p>
        <RsvpForm
          eventId={event.id}
          accentColor={sc.accent}
          guestTypes={rsvpGuestTypes}
          showSongRequest={rsvpShowSong}
          deadline={rsvpDeadline}
          showOvernachting={rsvpShowOvernachting}
          customQuestion={rsvpCustomQuestion}
        />
      </>
    )
    return (
      <div style={{ padding: "36px 32px 64px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: sc.fontPageTitlesWeight, color: sc.headingColor, fontFamily: sc.fontPageTitles, margin: "0 0 28px" }}>
          {page.title}
        </h1>
        {sc.goldBorder && sc.cardBg ? (
          <div style={{ backgroundColor: sc.cardBg, border: `2px solid ${sc.accent}`, borderRadius: 16, padding: "28px 32px" }}>
            {cardInner}
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}08`, padding: "28px 32px" }}>
            {cardInner}
          </div>
        )}
      </div>
    )
  }

  if (page.type === "Fotos") {
    const c = page.content ?? {}
    const urls = Array.isArray(c.urls) ? (c.urls as string[]) : []
    return (
      <div style={{ padding: "36px 32px 64px" }}>
        {urls.length === 0 ? (
          <Placeholder sc={sc}>Foto&apos;s worden binnenkort toegevoegd.</Placeholder>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" style={{ borderRadius: 12, aspectRatio: "1", objectFit: "cover", width: "100%", display: "block" }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: "36px 32px 64px" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: sc.headingColor, fontFamily: sc.fontFamily, margin: "0 0 28px" }}>
        {page.title}
      </h1>
      <p style={{ lineHeight: 1.75, whiteSpace: "pre-wrap", fontSize: "0.9375rem", color: sc.bodyText, margin: 0 }}>
        {typeof (page.content ?? {}).text === "string" ? (page.content as Record<string, unknown>).text as string : ""}
      </p>
    </div>
  )
}

function Placeholder({ children, sc }: { children: React.ReactNode; sc: SC }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}06`, padding: "18px 24px", fontSize: "0.875rem", fontStyle: "italic", color: sc.bodyText }}>
      {children}
    </div>
  )
}

