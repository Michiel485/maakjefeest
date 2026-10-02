import { type SC } from "@/lib/event-styles"
// Hetzelfde formulier als onder de trouwkaart. Zie de uitleg boven in
// components/AanmeldFormulier.tsx: identiek is hier de opdracht, niet
// "ongeveer hetzelfde".
import AanmeldFormulier from "@/components/AanmeldFormulier"
import EventMastersPreview from "@/components/EventMastersPreview"
import EventProgramPreview from "@/components/EventProgramPreview"
import StoryPreview from "@/components/StoryPreview"
import PraktischPreview, { DEFAULT_PRAKTISCH_TILES, type PraktischTile } from "@/components/PraktischPreview"
import WishlistPreview, { DEFAULT_WISHLIST_ITEMS, type WishlistItem } from "@/components/WishlistPreview"
import FotosPreview from "@/components/FotosPreview"
import SectieKop from "@/components/site/SectieKop"

export interface PageData {
  id: string
  type: string
  title: string
  content: Record<string, unknown>
}

export default function EventPageSection({ page, sc, eventId }: { page: PageData; sc: SC; eventId: string }) {
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
    // Nog niets aangepast: dezelfde voorbeelden als in de bouwer. Eerst stond
    // hier dan niets, terwijl de bouwer de voorbeelden wel liet zien (Michiel,
    // 27 september 2026, bij de cadeautips).
    const tiles = Array.isArray(page.content?.items) ? (page.content.items as PraktischTile[]) : DEFAULT_PRAKTISCH_TILES
    return <PraktischPreview tiles={tiles} sc={sc} />
  }

  if (page.type === "Cadeautips") {
    const eigen = Array.isArray(page.content?.items) ? (page.content.items as WishlistItem[]) : []
    const items = eigen.length ? eigen : DEFAULT_WISHLIST_ITEMS
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
      : "Laat weten of je erbij bent via het formulier."
    const rsvpGuestTypes = Array.isArray(c.guestTypes) ? (c.guestTypes as string[]) : ["daggast", "avondgast"]
    const rsvpShowSong = typeof c.showSongRequest === "boolean" ? c.showSongRequest : false
    const rsvpDeadline = typeof c.deadline === "string" && c.deadline ? c.deadline : null
    const rsvpShowOvernachting = typeof c.showOvernachting === "boolean" ? c.showOvernachting : (typeof c.showBus === "boolean" ? c.showBus : false)
    const rsvpCustomQuestion = typeof c.customQuestion === "string" && c.customQuestion.trim() ? c.customQuestion : null
    const rsvpCustomQuestion2 = typeof c.customQuestion2 === "string" && c.customQuestion2.trim() ? c.customQuestion2 : null
    const cardInner = (
      <>
        {/* Gecentreerd boven het formulier (Michiel, 26 september 2026) */}
        <p style={{ fontSize: "0.9375rem", marginBottom: 16, textAlign: "center", color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText }}>{introText}</p>
        <AanmeldFormulier
          eventId={eventId}
          stand="volledig"
          knopTekstKleur={sc.buttonText}
          accentColor={sc.accent}
          labelColor={sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText}
          guestTypes={rsvpGuestTypes}
          showSongRequest={rsvpShowSong}
          deadline={rsvpDeadline}
          showOvernachting={rsvpShowOvernachting}
          customQuestion={rsvpCustomQuestion}
          customQuestion2={rsvpCustomQuestion2}
        />
      </>
    )
    return (
      <div className="@container" style={{ padding: "48px 32px 64px", textAlign: "center", fontFamily: sc.fontFamily }}>
        <SectieKop sc={sc} kopje="Ben je erbij?" titel={page.title} />
        <div style={{ maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          {sc.goldBorder && sc.cardBg ? (
            <div style={{ backgroundColor: sc.cardBg, border: `2px solid ${sc.accent}`, borderRadius: 16, padding: "28px 32px", textAlign: "left" }}>
              {cardInner}
            </div>
          ) : (
            <div style={{ borderRadius: 16, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}08`, padding: "28px 32px", textAlign: "left" }}>
              {cardInner}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (page.type === "Fotos") {
    const c = page.content ?? {}
    const urls = Array.isArray(c.urls) ? (c.urls as string[]) : []
    const fotosTitle = typeof c.title === "string" && c.title.trim() ? c.title : page.title
    const fotosIntro = typeof c.intro === "string" && c.intro.trim() ? c.intro : null
    return <FotosPreview title={fotosTitle} intro={fotosIntro} urls={urls} sc={sc} useTranslatedTitle />
  }

  return (
    <div className="@container" style={{ padding: "48px 32px 64px", fontFamily: sc.fontFamily }}>
      <SectieKop sc={sc} titel={page.title} />
      <p style={{ lineHeight: 1.75, whiteSpace: "pre-wrap", fontSize: "0.9375rem", color: sc.bodyText, margin: "0 auto", maxWidth: 640, textAlign: "center" }}>
        {typeof (page.content ?? {}).text === "string" ? (page.content as Record<string, unknown>).text as string : ""}
      </p>
    </div>
  )
}
