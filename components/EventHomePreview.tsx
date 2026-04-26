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
          <div className="absolute inset-0" style={{ backgroundColor: sc.accent, opacity: 0.45 }} />
        )}

        <div className="relative z-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{
              color: showOverlay ? "#fff" : sc.labelColor,
              backgroundColor: showOverlay ? "rgba(255,255,255,0.2)" : `${sc.accent}15`,
            }}
          >
            {typeLabel}
          </span>

          <h1
            className="text-5xl font-extrabold leading-tight mb-3"
            style={{ color: showOverlay ? "#fff" : sc.headingColor, fontFamily: sc.fontFamily }}
          >
            {title}
          </h1>

          {datumFormatted && (
            <p className="text-sm mb-1" style={{ color: showOverlay ? "rgba(255,255,255,0.85)" : sc.bodyText }}>
              {datumFormatted}
            </p>
          )}

          {locatie && (
            <p className="text-sm mb-7" style={{ color: showOverlay ? "rgba(255,255,255,0.85)" : sc.bodyText }}>
              {locatie}
            </p>
          )}

          <a
            href="/rsvp"
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
              className="font-bold text-base mb-2"
              style={{
                color: sc.headingColor,
                fontFamily: sc.fontFamily,
                textAlign: homeAlign,
              }}
            >
              {homeTitle}
            </p>
          )}
          {homeBody && (
            <div
              className="text-[0.9375rem] leading-relaxed"
              style={{ color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: homeAlign }}
              dangerouslySetInnerHTML={{ __html: homeBody }}
            />
          )}
        </div>
      )}
    </>
  )
}
