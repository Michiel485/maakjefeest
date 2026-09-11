// Server-side kaart-afbeeldingen via next/og (satori): gebruikt voor de
// og-preview (WhatsApp) en de PNG-download van de kaart.

import { ImageResponse } from "next/og"
import { CARD_DESIGN_STYLE, type CardDisplay } from "./cards"
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
  mode: "og" | "download",
  // Nog niet betaald: een watermerk over de hele afbeeldingerheen, zodat een
  // voorbeeld niet als echte kaart te gebruiken is
  watermerk = false
): Promise<ImageResponse> {
  // Download: 4:5 (mooi voor WhatsApp/Instagram), de kaart vult het beeld
  const width = mode === "og" ? 1200 : 1080
  const height = mode === "og" ? 630 : 1350

  const WATERMERK_TEKST = "VOORBEELD · SAYINGYES"

  const allText = [
    display.heading, display.names, display.dateText, display.location,
    display.inviteLine, display.message, "Gemaakt met SayingYes, sayingyes.nl",
    watermerk ? WATERMERK_TEKST : "",
  ].join(" ")

  const ds = CARD_DESIGN_STYLE[display.design]

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" }[] = []
  const serifData = await loadGoogleFont("Cormorant Garamond", 600, allText)
  if (serifData) fonts.push({ name: "CardSerif", data: serifData, weight: 600, style: "normal" })
  const sansData = await loadGoogleFont("Montserrat", 500, allText)
  if (sansData) fonts.push({ name: "CardSans", data: sansData, weight: 500, style: "normal" })

  const serif = serifData ? "CardSerif" : "serif"
  const sans = sansData ? "CardSans" : "sans-serif"

  // De namen krijgen het font van het gekozen ontwerp; bij een probleem valt
  // het terug op de schreefletter, zodat er nooit een lege kaart uitkomt.
  const namesData =
    ds.namenFontImage.family === "Cormorant Garamond"
      ? null
      // De ampersand hoort erbij: bij sierlijk is dat de afsluiter onderaan,
      // en Google Fonts levert alleen de tekens die we hier opvragen.
      : await loadGoogleFont(ds.namenFontImage.family, ds.namenFontImage.weight, `${display.names} &`)
  if (namesData) {
    fonts.push({ name: "CardNames", data: namesData, weight: ds.namenFontImage.weight, style: "normal" })
  }
  const namesFont = namesData ? "CardNames" : serif
  const kopFont = ds.kopFontImage === "serif" ? serif : sans

  const s = mode === "og" ? 0.62 : 1.1
  const showPhoto = mode === "download" && !!display.photoUrl

  // Diagonale banen over de hele afbeelding; satori kan roteren en absoluut plaatsen
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
            fontFamily: sans,
            fontSize: mode === "og" ? 34 : 56,
            letterSpacing: mode === "og" ? 5 : 9,
            color: "#111111",
            opacity: 0.16,
          }}
        >
          {WATERMERK_TEKST}
        </div>
      ))}
    </div>
  ) : null
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
        // Sierlijk ontwerp: dun tweede lijntje binnen de kaartrand. Dan geen
        // vaste breedte, want breedte plus marge zou buiten de kaart vallen.
        ...(ds.dubbeleRand
          ? {
              alignSelf: "stretch",
              margin: 22 * s,
              border: `${Math.max(1, Math.round(2 * s))}px solid ${sc.accent}40`,
              borderRadius: 12 * s,
            }
          : { width: "100%" }),
      }}
    >
      <div
        style={{
          fontFamily: kopFont,
          fontSize: 27 * s,
          letterSpacing: ds.kopSpatiering,
          textTransform: "uppercase",
          color: sc.labelColor,
        }}
      >
        {display.heading}
      </div>

      {/* Ornament per ontwerp; zelfde tekeningen als in de browser, zodat de
          download precies lijkt op het voorbeeld */}
      {ds.ornament === "krul" ? (
        <svg width={360 * s} height={45 * s} viewBox="0 0 160 20" fill="none" stroke={sc.accent} strokeWidth="1.15" strokeLinecap="round">
          <path d="M18 14C30 4 44 4 56 10c8 4 14 4 20 1" opacity="0.85" />
          <path d="M142 14C130 4 116 4 104 10c-8 4-14 4-20 1" opacity="0.85" />
          <circle cx="18" cy="14" r="1.4" fill={sc.accent} stroke="none" opacity="0.65" />
          <circle cx="142" cy="14" r="1.4" fill={sc.accent} stroke="none" opacity="0.65" />
          <path d="M80 8l2.6 2.5L80 13l-2.6-2.5z" fill={sc.accent} stroke="none" />
        </svg>
      ) : ds.ornament === "takje" ? (
        <svg width={400 * s} height={85 * s} viewBox="0 0 160 34" fill="none">
          <path d="M80 20C66 20 52 22 34 27" stroke={sc.accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
          <path d="M80 20C94 20 108 22 126 27" stroke={sc.accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
          <path d="M72 20.5C68 12.5 60 9.5 56 12.5C60 18.5 68 19.5 72 20.5Z" fill={`${sc.accent}5C`} />
          <path d="M58 22C54 14 46 11 42 14C46 20 54 21 58 22Z" fill={`${sc.accent}50`} />
          <path d="M44 24.5C40 16.5 32 13.5 28 16.5C32 22.5 40 23.5 44 24.5Z" fill={`${sc.accent}44`} />
          <path d="M88 20.5C92 12.5 100 9.5 104 12.5C100 18.5 92 19.5 88 20.5Z" fill={`${sc.accent}5C`} />
          <path d="M102 22C106 14 114 11 118 14C114 20 106 21 102 22Z" fill={`${sc.accent}50`} />
          <path d="M116 24.5C120 16.5 128 13.5 132 16.5C128 22.5 120 23.5 116 24.5Z" fill={`${sc.accent}44`} />
          <circle cx="80" cy="19" r="1.8" fill={sc.accent} />
        </svg>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: 330 * s }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 * s }}>
            <div style={{ display: "flex", height: 2, backgroundColor: `${sc.accent}70` }} />
            <div style={{ display: "flex", height: 2, backgroundColor: `${sc.accent}38` }} />
          </div>
          <div
            style={{
              display: "flex",
              width: 14 * s,
              height: 14 * s,
              backgroundColor: sc.accent,
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 * s }}>
            <div style={{ display: "flex", height: 2, backgroundColor: `${sc.accent}70` }} />
            <div style={{ display: "flex", height: 2, backgroundColor: `${sc.accent}38` }} />
          </div>
        </div>
      )}

      <div
        style={{
          fontFamily: namesFont,
          fontSize: 94 * s * ds.namenSchaal,
          lineHeight: 1.15,
          color: headingColor,
          // Alleen meegeven als het ontwerp er een heeft: satori struikelt over
          // letterSpacing met de waarde undefined.
          ...(ds.namenSpatiering ? { letterSpacing: ds.namenSpatiering } : {}),
        }}
      >
        {display.names}
      </div>

      {display.dateText && (
        <div
          style={{
            fontFamily: ds.datumStijl === "serif" ? serif : sans,
            fontSize: (ds.datumStijl === "licht" ? 38 : 42) * s,
            color: sc.accent,
            letterSpacing: ds.datumStijl === "licht" ? "0.14em" : "0.04em",
          }}
        >
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
        // Regel voor regel, zodat witregels uit de boodschap bewaard blijven:
        // satori voegt losse regeleindes anders samen tot één lap tekst.
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 720 }}>
          {display.message.split("\n").map((regel, i) =>
            regel.trim() ? (
              <div
                key={i}
                style={{
                  fontFamily: sans,
                  fontSize: 30,
                  fontStyle: "italic",
                  lineHeight: 1.55,
                  color: textColor,
                  opacity: 0.9,
                  textAlign: "center",
                }}
              >
                {regel}
              </div>
            ) : (
              <div key={i} style={{ display: "flex", height: 20 }} />
            )
          )}
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

      {mode === "download" && display.timeText && (
        <div style={{ fontFamily: sans, fontSize: 32, color: sc.accent, letterSpacing: "0.03em" }}>
          {display.timeText}
        </div>
      )}

      {/* Afsluiter per ontwerp: hartje, ampersand in handschrift of takje */}
      {ds.slot === "ampersand" ? (
        <div style={{ fontFamily: namesFont, fontSize: 72 * s, color: sc.accent, marginTop: 6 * s, opacity: 0.9 }}>
          &amp;
        </div>
      ) : ds.slot === "blaadjes" ? (
        <svg width={48 * s} height={48 * s} viewBox="0 0 24 24" fill="none" style={{ marginTop: 6 * s, opacity: 0.9 }}>
          <path d="M12 22V9" stroke={sc.accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
          <path d="M12 13c-5-1-8-5-7-9 4 1 7 5 7 9z" fill={`${sc.accent}70`} />
          <path d="M12 13c5-1 8-5 7-9-4 1-7 5-7 9z" fill={`${sc.accent}70`} />
        </svg>
      ) : (
        <svg
          width={26 * s}
          height={24 * s}
          viewBox="0 0 24 22"
          style={{ marginTop: 6 * s, opacity: 0.9 }}
        >
          <path
            fill={sc.accent}
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      )}
    </div>
  )

  if (mode === "og") {
    return new ImageResponse(
      (
        <div
          style={{
            position: "relative",
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
              borderRadius: Math.round(ds.hoekRadius * 1.5),
              overflow: "hidden",
              width: 560,
              boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
            }}
          >
            {inner}
          </div>
          {watermerkLaag}
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
          position: "relative",
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
            borderRadius: Math.round(ds.hoekRadius * 1.8),
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
          {watermerk ? "Voorbeeld, activeer je pakket op sayingyes.nl" : "Gemaakt met SayingYes · sayingyes.nl"}
        </div>
        {watermerkLaag}
      </div>
    ),
    { width, height, fonts: fonts.length > 0 ? fonts : undefined }
  )
}
