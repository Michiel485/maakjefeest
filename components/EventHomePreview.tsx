"use client"

import type { SC } from "@/lib/event-styles"

export interface EventHomePreviewProps {
  typeLabel: string
  title: string
  datumFormatted: string | null
  locatie: string | null
  heroImageUrl: string | null
  heroOverlay?: boolean
  homeTitle: string | null
  homeBody: string | null
  homeAlign: "left" | "center" | "right"
  sc: SC
  onNavigate?: (pageId: string) => void
}

export default function EventHomePreview({
  typeLabel,
  title,
  datumFormatted,
  locatie,
  heroImageUrl,
  heroOverlay = true,
  homeTitle,
  homeBody,
  homeAlign,
  sc,
  onNavigate,
}: EventHomePreviewProps) {
  const hasPhoto = !!heroImageUrl
  const showOverlay = hasPhoto && heroOverlay

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="w-full py-20 px-8 text-center relative overflow-hidden"
        style={
          hasPhoto
            ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: sc.heroGradient }
        }
      >
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

        <div className="relative z-10 flex flex-col items-center">
          {/* Overline label */}
          <span
            className={`inline-block font-bold uppercase rounded-full tracking-widest ${sc.floral ? "text-sm px-5 py-2 mb-5 backdrop-blur-sm border border-white/20" : "text-xs px-3 py-1 mb-4"}`}
            style={{
              color: sc.floral && showOverlay ? "rgba(255,255,255,0.92)" : (showOverlay ? "#fff" : sc.labelColor),
              backgroundColor: sc.floral && showOverlay ? "rgba(255,255,255,0.10)" : (showOverlay ? "rgba(255,255,255,0.2)" : `${sc.accent}15`),
              letterSpacing: sc.floral ? "0.20em" : undefined,
            }}
          >
            {typeLabel}
          </span>

          {/* H1 */}
          <h1
            className={`text-5xl font-extrabold leading-tight whitespace-pre-wrap ${sc.floral ? "mb-6" : "mb-3"}`}
            style={{
              color: showOverlay ? "#fff" : sc.headingColor,
              fontFamily: sc.fontFamily,
              ...(sc.floral && showOverlay ? { textShadow: "0 1px 6px rgba(0,0,0,0.30)" } : {}),
            }}
          >
            {title}
          </h1>

          {/* Datum & locatie */}
          {sc.floral && hasPhoto ? (
            (datumFormatted || locatie) && (
              <div
                className="flex flex-col items-center gap-1.5 px-8 py-3 mb-6 min-w-[220px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {/* Sierlijke bovenlijn */}
                <svg width="100%" height="14" viewBox="0 0 220 14" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">
                  <line x1="0" y1="7" x2="90" y2="7" stroke="rgba(255,255,255,0.38)" strokeWidth="0.75"/>
                  <path d="M94 7 C96 4.5 100 4 103 7 C100 10 96 9.5 94 7Z" fill="rgba(255,255,255,0.48)"/>
                  <path d="M103 7 L110 2.5 L117 7 L110 11.5 Z" fill="rgba(255,255,255,0.62)"/>
                  <path d="M126 7 C124 4.5 120 4 117 7 C120 10 124 9.5 126 7Z" fill="rgba(255,255,255,0.48)"/>
                  <line x1="130" y1="7" x2="220" y2="7" stroke="rgba(255,255,255,0.38)" strokeWidth="0.75"/>
                </svg>

                {datumFormatted && (
                  <p className="text-xl" style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "0.08em", fontWeight: 300 }}>
                    {datumFormatted}
                  </p>
                )}
                {locatie && (
                  <p className="text-lg" style={{ color: "rgba(255,255,255,0.78)", letterSpacing: "0.05em", fontWeight: 300 }}>
                    {locatie}
                  </p>
                )}

                {/* Sierlijke onderlijn */}
                <svg width="100%" height="14" viewBox="0 0 220 14" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">
                  <line x1="0" y1="7" x2="90" y2="7" stroke="rgba(255,255,255,0.38)" strokeWidth="0.75"/>
                  <path d="M94 7 C96 4.5 100 4 103 7 C100 10 96 9.5 94 7Z" fill="rgba(255,255,255,0.48)"/>
                  <path d="M103 7 L110 2.5 L117 7 L110 11.5 Z" fill="rgba(255,255,255,0.62)"/>
                  <path d="M126 7 C124 4.5 120 4 117 7 C120 10 124 9.5 126 7Z" fill="rgba(255,255,255,0.48)"/>
                  <line x1="130" y1="7" x2="220" y2="7" stroke="rgba(255,255,255,0.38)" strokeWidth="0.75"/>
                </svg>
              </div>
            )
          ) : (
            <>
              {datumFormatted && (
                <p
                  className={sc.floral ? "text-xl mb-1" : "text-sm mb-1"}
                  style={{
                    color: showOverlay ? "rgba(255,255,255,0.92)" : sc.bodyText,
                    ...(sc.floral ? { letterSpacing: "0.08em", fontWeight: 300 } : {}),
                  }}
                >
                  {datumFormatted}
                </p>
              )}
              {locatie && (
                <p
                  className={sc.floral ? "text-lg mb-7" : "text-sm mb-7"}
                  style={{
                    color: showOverlay ? "rgba(255,255,255,0.85)" : sc.bodyText,
                    ...(sc.floral ? { letterSpacing: "0.05em", fontWeight: 300 } : {}),
                  }}
                >
                  {locatie}
                </p>
              )}
            </>
          )}

          {/* CTA */}
          <a
            href="/rsvp"
            onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("rsvp") } : undefined}
            className="inline-block text-sm font-bold px-7 py-3 rounded-xl"
            style={{
              backgroundColor: sc.buttonBg,
              color: sc.buttonText,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Meld je aan
          </a>
        </div>
      </section>

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
