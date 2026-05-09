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
        className="w-full py-16 px-8 text-center relative overflow-hidden"
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
                ? { background: "linear-gradient(to top, rgba(69,26,3,0.62) 0%, rgba(69,26,3,0.34) 55%, rgba(69,26,3,0.12) 100%)" }
                : { backgroundColor: sc.accent, opacity: 0.45 }
            }
          />
        )}

        <div className="relative z-10 flex flex-col items-center">
          <span
            className={`inline-block font-bold uppercase mb-4 rounded-full ${sc.floral ? "text-sm px-4 py-1.5 backdrop-blur-sm" : "text-xs px-3 py-1"} tracking-widest`}
            style={{
              color: sc.floral && showOverlay ? "rgba(255,255,255,0.92)" : (showOverlay ? "#fff" : sc.labelColor),
              backgroundColor: sc.floral && showOverlay ? "rgba(255,255,255,0.15)" : (showOverlay ? "rgba(255,255,255,0.2)" : `${sc.accent}15`),
              letterSpacing: sc.floral ? "0.18em" : undefined,
            }}
          >
            {typeLabel}
          </span>

          <h1
            className="text-5xl font-extrabold leading-tight mb-3 whitespace-pre-wrap"
            style={{
              color: showOverlay ? "#fff" : sc.headingColor,
              fontFamily: sc.fontFamily,
              ...(sc.floral && showOverlay ? { textShadow: "0 2px 14px rgba(0,0,0,0.45)" } : {}),
            }}
          >
            {title}
          </h1>

          {sc.floral && hasPhoto ? (
            (datumFormatted || locatie) && (
              <div
                className="flex flex-col items-center gap-1 py-4 px-8 mb-8 border-y border-white/30"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {datumFormatted && (
                  <p className="text-xl" style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "0.07em", fontWeight: 300 }}>
                    {datumFormatted}
                  </p>
                )}
                {locatie && (
                  <p className="text-lg" style={{ color: "rgba(255,255,255,0.80)", letterSpacing: "0.05em", fontWeight: 300 }}>
                    {locatie}
                  </p>
                )}
              </div>
            )
          ) : (
            <>
              {datumFormatted && (
                <p
                  className={sc.floral ? "text-xl mb-1" : "text-sm mb-1"}
                  style={{
                    color: showOverlay ? "rgba(255,255,255,0.92)" : sc.bodyText,
                    ...(sc.floral ? { letterSpacing: "0.07em", fontWeight: 300 } : {}),
                  }}
                >
                  {datumFormatted}
                </p>
              )}
              {locatie && (
                <p
                  className={sc.floral ? "text-lg mb-8" : "text-sm mb-7"}
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
