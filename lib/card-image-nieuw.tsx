// De afbeelding van een kaart in een van de nieuwe ontwerpen: de download en
// de voorvertoning in WhatsApp. Dezelfde voorkant als in de browser
// (components/kaart/KaartVoorkant.tsx), op een achtergrond in de kleur van de
// pagina. De drie eerste ontwerpen blijven via lib/card-image.tsx lopen.

import { ImageResponse } from "next/og"
import type { CardDisplay, NieuwOntwerp } from "./cards"
import type { SC } from "./event-styles"
import { ONTWERP_LETTERS, ONTWERP_VERHOUDING, type KaartLetter } from "./kaart-ontwerpen"
import KaartVoorkant from "@/components/kaart/KaartVoorkant"

type LaadFont = (family: string, weight: number, text: string) => Promise<ArrayBuffer | null>

export async function renderNieuweKaartAfbeelding({
  display,
  ontwerp,
  sc,
  mode,
  watermerk,
  watermerkTekst,
  voettekst,
  allText,
  laadFont,
}: {
  display: CardDisplay
  ontwerp: NieuwOntwerp
  sc: SC
  mode: "og" | "download"
  watermerk: boolean
  watermerkTekst: string
  voettekst: string
  allText: string
  laadFont: LaadFont
}): Promise<ImageResponse> {
  const width = mode === "og" ? 1200 : 1080
  const height = mode === "og" ? 630 : 1350

  // Elk lettertype één keer ophalen, met alle tekens die erin kunnen staan.
  // De cijfers en de ampersand staan er los bij: die komen in sommige
  // ontwerpen uit de datum of de initialen, niet uit de tekst zelf.
  const l = ONTWERP_LETTERS[ontwerp]
  const tekens = `${allText} ${allText.toUpperCase()} 0123456789 & · ♥`
  const fonts: { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600; style: "normal" }[] = []
  const geladen = new Map<string, string>()
  async function laad(letter: KaartLetter, fallback: string): Promise<string> {
    const sleutel = `${letter.google}:${letter.gewicht}`
    const bestaand = geladen.get(sleutel)
    if (bestaand) return bestaand
    const data = await laadFont(letter.google, letter.gewicht, tekens)
    if (!data) return fallback
    const naam = `Kaart${geladen.size}`
    fonts.push({ name: naam, data, weight: letter.gewicht, style: "normal" })
    geladen.set(sleutel, naam)
    return naam
  }
  const letters = {
    namen: await laad(l.namen, "serif"),
    kop: await laad(l.kop, "serif"),
    tekst: await laad(l.tekst, "sans-serif"),
    extra: await laad(l.extra ?? l.namen, "serif"),
  }

  // Diagonale banen over de hele afbeelding, net als bij de eerste ontwerpen
  const watermerkLaag = watermerk ? (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            transform: "rotate(-28deg)",
            fontFamily: letters.tekst,
            fontSize: mode === "og" ? 34 : 56,
            letterSpacing: mode === "og" ? 5 : 9,
            color: sc.cardBg && /^#[0-3]/.test(sc.cardBg) ? "#FFFFFF" : "#111111",
            opacity: 0.08,
          }}
        >
          {watermerkTekst}
        </div>
      ))}
    </div>
  ) : null

  // In de voorvertoning past de kaart in de hoogte, in de download in de breedte
  // Een eigen ontwerp heeft zijn eigen verhouding; een hoge kaart wordt
  // smaller, zodat hij er helemaal op past
  const verhouding = ontwerp === "eigen" && display.ontwerpVerhouding ? display.ontwerpVerhouding : ONTWERP_VERHOUDING[ontwerp] ?? 1.4
  const kaartBreedte = mode === "og"
    ? Math.min(420, Math.round(590 / verhouding))
    : Math.min(840, Math.round(1230 / verhouding))

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: mode === "og" ? "center" : "flex-start",
          width: "100%",
          height: "100%",
          backgroundColor: sc.bodyBg,
          // Een lage (vierkante) kaart in het midden van de download, niet bovenin
          paddingTop: mode === "og" ? 0 : Math.max(48, Math.round((height - kaartBreedte * verhouding - 90) / 2)),
        }}
      >
        <KaartVoorkant d={display} ontwerp={ontwerp} sc={sc} breedte={kaartBreedte} letters={letters} schaduw="0 24px 70px rgba(0,0,0,0.25)" voorAfbeelding />
        {mode === "download" && (
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              alignItems: "center",
              fontFamily: letters.tekst,
              fontSize: 22,
              color: sc.bodyText,
              opacity: 0.6,
            }}
          >
            {voettekst}
          </div>
        )}
        {watermerkLaag}
      </div>
    ),
    { width, height, fonts: fonts.length > 0 ? fonts : undefined }
  )
}
