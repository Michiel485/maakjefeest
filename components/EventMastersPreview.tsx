import type { SC } from "@/lib/event-styles"

export interface Master {
  id?: string
  naam: string
  telefoon: string
  email: string
  foto_url: string | null
}

export interface EventMastersPreviewProps {
  masters: Master[]
  sc: SC
  text?: string | null
}

export const DEFAULT_MASTERS_TEXT =
  "Heb je vragen over het programma, dieetwensen of wil je gewoon iets leuks overleggen voor de grote dag? Neem dan gerust contact op met een van onze ceremoniemeesters!"

export default function EventMastersPreview({ masters, sc, text }: EventMastersPreviewProps) {
  const visible = masters.filter((m) => m.naam || m.foto_url)

  return (
    <div className="@container px-6 py-10" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>

      {/* Paginatitel */}
      <p
        className="text-4xl text-center mb-8 max-w-fit mx-auto"
        style={{ color: sc.headingColor, fontFamily: sc.nameFont || sc.fontFamily, fontWeight: sc.nameFont ? 400 : 800 }}
      >
        Ceremoniemeesters
      </p>

      {/* Kaarten */}
      {visible.length === 0 ? (
        <p className="text-sm italic text-center" style={{ color: sc.bodyText }}>
          Informatie over de ceremoniemeesters volgt binnenkort.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-10">
          {visible.map((master, i) => (
            <div
              key={master.id ?? i}
              className="flex flex-col items-center text-center w-full max-w-[240px]"
            >
              {master.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={master.foto_url}
                  alt={master.naam}
                  style={{
                    width: 168,
                    height: 168,
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: 16,
                    border: `3px solid ${sc.accent}30`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 168,
                    height: 168,
                    borderRadius: "50%",
                    marginBottom: 16,
                    backgroundColor: `${sc.accent}12`,
                    border: `3px solid ${sc.accent}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke={sc.accent} strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}

              {master.naam && (
                <p
                  className="font-bold uppercase mb-2"
                  style={{ letterSpacing: "0.12em", fontSize: "0.8125rem", color: sc.headingColor, fontFamily: sc.fontFamily }}
                >
                  {master.naam}
                </p>
              )}

              {master.telefoon && (
                <a
                  href={`tel:${master.telefoon.replace(/[\s\-()]/g, "")}`}
                  className="text-sm block mb-1"
                  style={{ color: sc.accent, textDecoration: "none" }}
                >
                  {master.telefoon}
                </a>
              )}

              {master.email && (
                <a
                  href={`mailto:${master.email}`}
                  className="block"
                  style={{ fontSize: "0.8125rem", color: sc.bodyText, textDecoration: "none" }}
                >
                  {master.email}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vrije tekst */}
      {text && (
        <p
          className="text-sm leading-relaxed text-center max-w-lg mx-auto mt-10"
          style={{ color: sc.bodyText }}
        >
          {text}
        </p>
      )}
    </div>
  )
}
