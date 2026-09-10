import { buildCardDisplay, type CardContent, type CardGuestType, type CardTemplate, type CardType } from "@/lib/cards"
import { getStyleConfig } from "@/lib/event-styles"
import { renderCardImage } from "@/lib/card-image"

export const dynamic = "force-dynamic"

const TYPES: CardType[] = ["save_the_date", "trouwkaart"]
const TEMPLATES: CardTemplate[] = ["klassiek", "foto"]
const GUEST_TYPES: CardGuestType[] = ["daggast", "avondgast", "receptiegast"]

// Eenvoudige rem per IP: het renderen van een afbeelding is relatief zwaar
const hits = new Map<string, number[]>()
function teVeel(ip: string): boolean {
  const nu = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => nu - t < 60_000)
  recent.push(nu)
  hits.set(ip, recent)
  return recent.length > 12
}

function tekst(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined
}

// POST: voorbeeldafbeelding van een ontwerp dat nog niet is opgeslagen.
// Altijd met watermerk: dit is bedoeld om te kijken, niet om te versturen.
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0"
  if (teVeel(ip)) {
    return Response.json({ error: "Even rustig aan, probeer het zo opnieuw" }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const type: CardType = TYPES.includes(body.type as CardType) ? (body.type as CardType) : "save_the_date"
  const template: CardTemplate = TEMPLATES.includes(body.template as CardTemplate) ? (body.template as CardTemplate) : "klassiek"
  const style = typeof body.style === "string" ? body.style : "zand"

  const content: CardContent = {
    names: tekst(body.names, 120),
    dateText: tekst(body.dateText, 120),
    location: tekst(body.location, 120),
    message: tekst(body.message, 400),
    guestType: GUEST_TYPES.includes(body.guestType as CardGuestType) ? (body.guestType as CardGuestType) : undefined,
    inviteText: tekst(body.inviteText, 160),
    timeText: tekst(body.timeText, 80),
    // Alleen echte URL's; een lokale data-URL uit de browser kan satori niet altijd aan
    photoUrl: typeof body.photoUrl === "string" && /^https?:\/\//.test(body.photoUrl) ? body.photoUrl.slice(0, 500) : undefined,
  }

  const display = buildCardDisplay(type, template, content, {
    title: content.names ?? "Jullie namen",
    frame_names: content.names ?? null,
    datum: null,
    locatie: content.location ?? null,
    hero_image_url: null,
  })
  const sc = getStyleConfig(style)

  const image = await renderCardImage(display, sc, "download", true)
  const headers = new Headers(image.headers)
  headers.set("Content-Disposition", 'attachment; filename="voorbeeld-kaart.png"')
  headers.set("Cache-Control", "no-store")
  return new Response(image.body, { status: 200, headers })
}
