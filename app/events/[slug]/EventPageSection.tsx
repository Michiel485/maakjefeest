import { formatDate, type SC } from "@/lib/event-styles"
// Hetzelfde formulier als onder de trouwkaart. Zie de uitleg boven in
// components/AanmeldFormulier.tsx: identiek is hier de opdracht, niet
// "ongeveer hetzelfde".
import AanmeldFormulier from "@/components/AanmeldFormulier"
import EventMastersPreview from "@/components/EventMastersPreview"
import EventProgramPreview from "@/components/EventProgramPreview"
import StoryPreview from "@/components/StoryPreview"
import PraktischPreview, { DEFAULT_PRAKTISCH_TILES, type PraktischTile } from "@/components/PraktischPreview"
import WishlistPreview, { DEFAULT_WISHLIST_ITEMS, type Rekening, type WishlistItem } from "@/components/WishlistPreview"
import { verhaalMomenten, verhaalQuote } from "@/lib/verhaal"
import FotosPreview from "@/components/FotosPreview"
import SectieKop from "@/components/site/SectieKop"

export interface PageData {
  id: string
  type: string
  title: string
  content: Record<string, unknown>
}

export interface SectieEvent {
  datum?: string | null
  locatie?: string | null
  /** De knoppen op de afsluiting van het aanmelden */
  agendaHref?: string | null
  programmaHref?: string | null
}

export default function EventPageSection({ page, sc, eventId, event }: { page: PageData; sc: SC; eventId: string; event?: SectieEvent }) {
  if (page.type === "OnsVerhaal") {
    const c = page.content ?? {}
    return (
      <StoryPreview
        title={typeof c.title === "string" ? c.title : null}
        quote={verhaalQuote(c)}
        momenten={verhaalMomenten(c)}
        sc={sc}
      />
    )
  }

  if (page.type === "Programma") {
    const items = Array.isArray(page.content?.items)
      ? (page.content.items as { id?: string; time: string; title?: string; description: string; iconId?: string; image_url?: string | null; imagePosX?: number }[])
      : []
    return <EventProgramPreview items={items} sc={sc} datum={event?.datum ?? null} />
  }

  if (page.type === "Informatie") {
    // Nog niets aangepast: dezelfde voorbeelden als in de bouwer. Eerst stond
    // hier dan niets, terwijl de bouwer de voorbeelden wel liet zien (Michiel,
    // 27 september 2026, bij de cadeautips).
    const tiles = Array.isArray(page.content?.items) ? (page.content.items as PraktischTile[]) : DEFAULT_PRAKTISCH_TILES
    return <PraktischPreview tiles={tiles} sc={sc} locatie={event?.locatie ?? null} />
  }

  if (page.type === "Cadeautips") {
    const eigen = Array.isArray(page.content?.items) ? (page.content.items as WishlistItem[]) : []
    const items = eigen.length ? eigen : DEFAULT_WISHLIST_ITEMS
    const rekening = page.content?.rekening && typeof page.content.rekening === "object" ? (page.content.rekening as Rekening) : null
    return <WishlistPreview items={items} sc={sc} rekening={rekening} />
  }

  if (page.type === "Ceremoniemeesters") {
    const c = page.content ?? {}
    const rawMasters = Array.isArray(c.masters) ? (c.masters as { naam?: string; telefoon?: string; email?: string; foto_url?: string | null; rol?: string; onderwerpen?: string }[]) : []
    const masters = rawMasters.map((m) => ({
      naam: m.naam ?? "",
      telefoon: m.telefoon ?? "",
      email: m.email ?? "",
      foto_url: m.foto_url ?? null,
      rol: m.rol ?? "",
      onderwerpen: m.onderwerpen ?? "",
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
    // Geen doos meer om het formulier: het staat in de kleuren en letters van
    // de site zelf, als een gesprek in stappen (ontwerpronde, 2 oktober 2026)
    return (
      <div className="@container" style={{ padding: "48px 24px 64px", fontFamily: sc.fontFamily }}>
        <SectieKop
          sc={sc}
          kopje="Ben je erbij?"
          titel={page.title}
          onder={<p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: sc.bodyText }}>{introText}</p>}
        />
        <div style={{ maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          <AanmeldFormulier
            eventId={eventId}
            stand="volledig"
            knopTekstKleur={sc.buttonText}
            accentColor={sc.accent}
            labelColor={sc.bodyText}
            titelFont={sc.fontPageTitles}
            titelGewicht={sc.fontPageTitlesWeight}
            datumTekst={event?.datum ? formatDate(event.datum) : null}
            agendaHref={event?.agendaHref ?? null}
            programmaHref={event?.programmaHref ?? null}
            guestTypes={rsvpGuestTypes}
            showSongRequest={rsvpShowSong}
            deadline={rsvpDeadline}
            showOvernachting={rsvpShowOvernachting}
            customQuestion={rsvpCustomQuestion}
            customQuestion2={rsvpCustomQuestion2}
          />
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
