"use client"

import type { SC } from "@/lib/event-styles"

export interface EventHomePreviewProps {
  typeLabel: string
  title: string
  datumFormatted: string | null
  locatie: string | null
  datum?: string | null
  heroImageUrl: string | null
  heroOverlay?: boolean
  homeTitle: string | null
  homeBody: string | null
  homeAlign: "left" | "center" | "right"
  sc: SC
  useFrame?: boolean
  frameStyle?: string | null
  initials?: string | null
  frameNames?: string | null
  frameLocation?: string | null
  heroPosition?: 'top' | 'center' | 'bottom'
  onNavigate?: (pageId: string) => void
}

export default function EventHomePreview({
  typeLabel,
  title,
  datum,
  datumFormatted,
  locatie,
  heroImageUrl,
  heroOverlay = true,
  homeTitle,
  homeBody,
  homeAlign,
  sc,
  useFrame = false,
  frameStyle,
  initials,
  frameNames,
  frameLocation,
  heroPosition = 'center',
  onNavigate,
}: EventHomePreviewProps) {
  const hasPhoto = !!heroImageUrl
  const showOverlay = hasPhoto && heroOverlay

  // Calligraphy font for names; serif fallback for other themes
  const nameFont = sc.nameFont || (sc.floral ? sc.fontFamily : "'Georgia', serif")

  // Texts shown inside the frame — dedicated fields take priority over event data
  const frameDisplayNames    = (frameNames    && frameNames.trim())    ? frameNames    : title
  const frameDisplayLocation = (frameLocation && frameLocation.trim()) ? frameLocation : (locatie ?? "")

  // Countdown: strip timezone/time noise by normalising both dates to midnight
  let countdownText = "NOG ... DAGEN • TOT WE JA ZEGGEN"
  if (datum) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weddingDay = new Date(datum); weddingDay.setHours(0, 0, 0, 0)
    const days = Math.round((weddingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 1)       countdownText = `NOG ${days} DAGEN • TOT WE JA ZEGGEN`
    else if (days === 1) countdownText = "MORGEN IS DE GROTE DAG!"
    else if (days === 0) countdownText = "VANDAAG IS DE DAG! 🤍"
    else                 countdownText = `JUST MARRIED • ${datumFormatted ?? ""}`
  }

  // Safe zone: diamonds are widest at center, circles taper from sides
  const isCircle  = frameStyle?.includes("circle")
  const isDiamond = frameStyle?.includes("diamond")
  const safeZoneClass = isDiamond ? "w-[80%] mx-auto" : "w-[65%] mx-auto"

  return (
    <>
      {/* ── Hero: only rendered when a photo is set ── */}
      {hasPhoto && (
        <section className="relative w-full h-[300px] md:h-[420px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl!}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${
              heroPosition === 'top' ? 'object-top' :
              heroPosition === 'bottom' ? 'object-bottom' :
              'object-center'
            }`}
          />

          {showOverlay && (
            <div
              className="absolute inset-0"
              style={
                sc.floral
                  ? { background: "linear-gradient(to bottom, rgba(28,25,23,0.22) 0%, rgba(28,25,23,0.54) 100%)" }
                  : { backgroundColor: sc.accent, opacity: 0.45 }
              }
            />
          )}

          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <h1
              className="leading-tight whitespace-pre-wrap"
              style={{
                color: "#fff",
                fontFamily: nameFont,
                fontSize: sc.nameFont ? "3.5rem" : "3rem",
                fontWeight: sc.nameFont ? 400 : 800,
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.75))",
              }}
            >
              {title}
            </h1>
          </div>
        </section>
      )}

      {/* ── Luxe Trouwkaart + CTA ── */}
      <section className="w-full px-6 pt-6 pb-8 flex flex-col items-center" style={{ backgroundColor: sc.bodyBg }}>
        {useFrame && frameStyle ? (
          /* Container-query wrapper — text scales proportionally with the image */
          <div
            className="relative w-full max-w-2xl"
            style={{ containerType: "inline-size" } as React.CSSProperties}
          >
            <style>{`
              .fk-initials  { font-size: clamp(1.2rem, 8cqi,  4.5rem); line-height: 1; letter-spacing: 0.2em; }
              .fk-names     { font-size: clamp(1rem,   5.5cqi, 3rem);   line-height: 1.25; }
              .fk-detail    { font-size: clamp(0.6rem, 1.8cqi, 0.85rem); letter-spacing: 0.18em; }
            `}</style>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/frames/${frameStyle}.png.png`} alt="" className="w-full h-auto block" />

            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ overflow: "hidden" }}
            >
              <div className={`flex flex-col items-center gap-[2cqi] ${safeZoneClass}`}>
              {initials && (
                <p
                  className="fk-initials uppercase text-center"
                  style={{
                    fontFamily: sc.fontFamily,
                    color: sc.headingColor,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {initials}
                </p>
              )}

              <p
                className="fk-names text-center leading-[0.9]"
                style={{
                  fontFamily: nameFont,
                  color: sc.headingColor,
                  fontStyle: sc.nameFont ? "normal" : "italic",
                  fontWeight: sc.nameFont ? 400 : 300,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxWidth: "100%",
                }}
              >
                {frameDisplayNames}
              </p>

              {datumFormatted && (
                <p
                  className="fk-detail uppercase text-center"
                  style={{
                    fontFamily: sc.fontFamily,
                    color: sc.bodyText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    marginTop: "1cqi",
                  }}
                >
                  {datumFormatted}
                </p>
              )}

              {frameDisplayLocation && (
                <p
                  className="fk-detail text-center"
                  style={{
                    fontFamily: sc.fontFamily,
                    color: sc.bodyText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {frameDisplayLocation}
                </p>
              )}
              </div>
            </div>
          </div>
        ) : (
          /* No frame: only date + location, minimal */
          <div className="flex flex-col items-center gap-2 pt-4 pb-0 text-center">
            {datumFormatted && (
              <p
                className="text-sm uppercase tracking-[0.18em] font-medium"
                style={{ color: sc.headingColor, fontFamily: sc.fontFamily }}
              >
                {datumFormatted}
              </p>
            )}
            {locatie && (
              <p className="text-sm" style={{ color: sc.bodyText, fontFamily: sc.fontFamily }}>
                {locatie}
              </p>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        <a
          href="/rsvp"
          onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("rsvp") } : undefined}
          className="mt-6 inline-block text-sm font-bold px-7 py-3 rounded-xl"
          style={{
            backgroundColor: sc.buttonBg,
            color: sc.buttonText,
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            fontFamily: sc.fontFamily,
          }}
        >
          Meld je aan
        </a>
      </section>

      {/* ── Countdown strip ── */}
      <div
        className="w-full py-3 text-center"
        style={{
          backgroundColor: sc.bodyBg,
          borderTop: `1px solid ${sc.accent}50`,
          borderBottom: `1px solid ${sc.accent}50`,
        }}
      >
        <p
          className="text-sm font-medium uppercase"
          style={{ color: sc.accent, letterSpacing: "0.18em", fontFamily: sc.fontFamily }}
        >
          {countdownText}
        </p>
      </div>

      {/* ── Home content ── */}
      {(homeTitle || homeBody) && (
        <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
          {homeTitle && (
            <p
              className={`font-bold mb-2 whitespace-pre-wrap ${sc.floral ? "text-xl" : "text-base"}`}
              style={{ color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: homeAlign }}
            >
              {homeTitle}
            </p>
          )}
          {homeBody && (
            <p
              className={`leading-relaxed whitespace-pre-wrap ${sc.floral ? "text-lg" : "text-[0.9375rem]"}`}
              style={{ color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: homeAlign }}
            >
              {homeBody}
            </p>
          )}
        </div>
      )}
    </>
  )
}
