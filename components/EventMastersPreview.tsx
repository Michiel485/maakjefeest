import type { SC } from "@/lib/event-styles"

export interface Master {
  naam: string
  telefoon: string
  email: string
  foto_url: string | null
}

export interface EventMastersPreviewProps {
  masters: Master[]
  sc: SC
}

export default function EventMastersPreview({ masters, sc }: EventMastersPreviewProps) {
  const visible = masters.filter((m) => m.naam || m.foto_url)

  if (visible.length === 0) {
    return (
      <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
        <p className="text-sm italic" style={{ color: sc.bodyText }}>
          Informatie over de ceremoniemeesters volgt binnenkort.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 py-10" style={{ backgroundColor: sc.navBg }}>
      <div className="flex flex-wrap gap-12 justify-center">
        {visible.map((master, i) => (
          <div key={i} className="flex flex-col items-center text-center" style={{ maxWidth: 200 }}>
            {master.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={master.foto_url}
                alt={master.naam}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: 16,
                  border: `3px solid ${sc.accent}30`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: "50%",
                  marginBottom: 16,
                  backgroundColor: `${sc.accent}12`,
                  border: `3px solid ${sc.accent}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="42" height="42" fill="none" viewBox="0 0 24 24" stroke={sc.accent} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}

            {master.naam && (
              <p
                className="font-bold uppercase mb-2"
                style={{
                  letterSpacing: "0.12em",
                  fontSize: "0.8125rem",
                  color: sc.headingColor,
                  fontFamily: sc.fontFamily,
                }}
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
    </div>
  )
}
