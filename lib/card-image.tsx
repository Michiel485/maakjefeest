// Server-side kaart-afbeeldingen via next/og (satori): gebruikt voor de
// og-preview (WhatsApp) en de PNG-download van de kaart.

import { ImageResponse } from "next/og"
import type { CardDisplay } from "./cards"
import type { SC } from "./event-styles"

// Google Fonts levert TTF/woff (dat satori kan lezen) alleen aan oude user agents
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (
      await fetch(cssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:10.0) Gecko/20100101 Firefox/10.0",
        },
      })
    ).text()
    // satori leest ttf, otf en woff (geen woff2); deze oude UA krijgt woff
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff)'\)/)
    if (!match) return null
    const fontRes = await fetch(match[1])
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

export async function renderCardImage(
  display: CardDisplay,
  sc: SC,
  mode: "og" | "download"
): Promise<ImageResponse> {
  // Download: 4:5 (mooi voor WhatsApp/Instagram), de kaart vult het beeld
  const width = mode === "og" ? 1200 : 1080
  const height = mode === "og" ? 630 : 1350

  const allText = [
    display.heading, display.names, display.dateText, display.location,
    display.inviteLine, display.message, "Gemaakt met SayingYes — sayingyes.nl",
  ].join(" ")

  const fonts: { name: string; data: ArrayBuffer; weight: 500 | 600; style: "normal" }[] = []
  const serifData = await loadGoogleFont("Cormorant Garamond", 600, allText)
  if (serifData) fonts.push({ name: "CardSerif", data: serifData, weight: 600, style: "normal" })
  const sansData = await loadGoogleFont("Montserrat", 500, allText)
  if (sansData) fonts.push({ name: "CardSans", data: sansData, weight: 500, style: "normal" })

  const serif = serifData ? "CardSerif" : "serif"
  const sans = sansData ? "CardSans" : "sans-serif"

  const s = mode === "og" ? 0.62 : 1.1
  const showPhoto = mode === "download" && !!display.photoUrl
  const textColor = sc.cardText ?? sc.bodyText
  const headingColor = sc.cardText ?? sc.headingColor

  // Gedeelde kaartinhoud; witruimte valt bínnen de kaartrand
  const inner = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
        padding: `${40 * s}px ${56 * s}px`,
        gap: 26 * s,
        textAlign: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontSize: 27 * s,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: sc.labelColor,
        }}
      >
        {display.heading}
      </div>

      {/* Ornament */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: 320 * s }}>
        <div style={{ display: "flex", flex: 1, height: 2, backgroundColor: `${sc.accent}70` }} />
        <div
          style={{
            display: "flex",
            width: 14 * s,
            height: 14 * s,
            backgroundColor: sc.accent,
            transform: "rotate(45deg)",
          }}
        />
        <div style={{ display: "flex", flex: 1, height: 2, backgroundColor: `${sc.accent}70` }} />
      </div>

      <div
        style={{
          fontFamily: serif,
          fontSize: 94 * s,
          lineHeight: 1.1,
          color: headingColor,
        }}
      >
        {display.names}
      </div>

      {display.dateText && (
        <div style={{ fontFamily: sans, fontSize: 42 * s, color: sc.accent, letterSpacing: "0.04em" }}>
          {display.dateText}
        </div>
      )}

      {display.location && (
        <div style={{ fontFamily: sans, fontSize: 31 * s, color: textColor, opacity: 0.85 }}>
          {display.location}
        </div>
      )}

      {mode === "download" && (
        <div style={{ display: "flex", width: 52, height: 2, backgroundColor: `${sc.accent}60`, marginTop: 6, marginBottom: 6 }} />
      )}

      {mode === "download" && (
        <div
          style={{
            fontFamily: sans,
            fontSize: 30,
            fontStyle: "italic",
            lineHeight: 1.55,
            color: textColor,
            opacity: 0.9,
            maxWidth: 720,
          }}
        >
          {display.message}
        </div>
      )}

      {mode === "download" && display.inviteLine && (
        <div
          style={{
            fontFamily: sans,
            fontSize: 32,
            lineHeight: 1.5,
            color: headingColor,
            maxWidth: 720,
          }}
        >
          {display.inviteLine}
        </div>
      )}
    </div>
  )

  if (mode === "og") {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: sc.bodyBg,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: sc.cardBg ?? "#FFFEFB",
              border: `${sc.goldBorder ? 3 : 2}px solid ${sc.accent}`,
              borderRadius: 24,
              overflow: "hidden",
              width: 560,
              boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
            }}
          >
            {inner}
          </div>
        </div>
      ),
      { width, height, fonts: fonts.length > 0 ? fonts : undefined }
    )
  }

  // Download: de kaart vult vrijwel het hele beeld
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: sc.bodyBg,
          padding: "44px 44px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: sc.cardBg ?? "#FFFEFB",
            border: `${sc.goldBorder ? 3 : 2}px solid ${sc.accent}`,
            borderRadius: 28,
            overflow: "hidden",
            width: "100%",
            height: 1216,
            boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
          }}
        >
          {showPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={display.photoUrl!}
              alt=""
              width={992}
              height={480}
              style={{ width: "100%", height: 480, objectFit: "cover", flexShrink: 0 }}
            />
          )}
          {inner}
        </div>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            alignItems: "center",
            fontFamily: sans,
            fontSize: 22,
            color: sc.bodyText,
            opacity: 0.6,
          }}
        >
          Gemaakt met SayingYes — sayingyes.nl
        </div>
      </div>
    ),
    { width, height, fonts: fonts.length > 0 ? fonts : undefined }
  )
}
