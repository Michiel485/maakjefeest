import type { SC } from "@/lib/event-styles"

export type ProgramLayout = "centered" | "timeline" | "bento"

export interface ProgramItem {
  id?: string
  time: string
  description: string
  iconId?: string
  image_url?: string | null
}

// ── Icon registry ──────────────────────────────────────────────────────────

export const PROGRAM_ICONS: { id: string; label: string }[] = [
  { id: "clock",      label: "Klok"          },
  { id: "door",       label: "Aankomst"      },
  { id: "coffee",     label: "Koffie"        },
  { id: "cake",       label: "Taart"         },
  { id: "rings",      label: "Ringen"        },
  { id: "champagne",  label: "Champagne"     },
  { id: "cloche",     label: "Diner"         },
  { id: "dance",      label: "Dansen"        },
  { id: "music",      label: "Muziek"        },
  { id: "flag",       label: "Einde"         },
  { id: "car",        label: "Vervoer"       },
  { id: "camera",     label: "Foto"          },
  { id: "heart",      label: "Liefde"        },
  { id: "pin",        label: "Locatie"       },
  { id: "confetti",   label: "Feest"         },
  { id: "bouquet",    label: "Bloemen"       },
]

export function ProgramIcon({ iconId = "clock", size, strokeWidth }: {
  iconId?: string
  size: number
  strokeWidth: number
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  switch (iconId) {
    case "door": return (
      <svg {...p}>
        <path d="M13.5 3.5H7Q5.5 3.5 5.5 5v14Q5.5 21 7 21h6.5" />
        <path d="M17 9l4.5 3-4.5 3" />
        <path d="M21.5 12H10" />
        <circle cx="11.5" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
    case "coffee": return (
      <svg {...p}>
        <path d="M5.5 9h13v8Q18.5 20 16.5 20h-9Q5.5 20 5.5 17V9z" />
        <path d="M18.5 11h2Q22.5 11 22.5 13Q22.5 15 20.5 15h-2" />
        <path d="M9 6.5Q8.5 5.2 9.5 4.5Q10.5 3.8 10 2.5" />
        <path d="M14 6.5Q13.5 5.2 14.5 4.5Q15.5 3.8 15 2.5" />
      </svg>
    )
    case "cake": return (
      <svg {...p}>
        <path d="M3.5 20.5h17" />
        <path d="M6 20.5L8 11.5h8l2 9" />
        <path d="M8 11.5Q10 9 12 11.5Q14 14 16 11.5" />
        <path d="M12 11.5V7.5" />
        <path d="M12 7.5Q11.5 6.5 12 5.5Q12.5 4.5 12.5 6Q12 7 12 7.5z" fill="currentColor" stroke="none" />
      </svg>
    )
    case "rings": return (
      <svg {...p}>
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
        <path d="M6.5 9.5Q7.2 8.5 8.5 8.5" />
        <path d="M12.5 9.5Q13.2 8.5 14.5 8.5" />
      </svg>
    )
    case "champagne": return (
      <svg {...p}>
        <path d="M7 3.5h5L9.5 12H9L7 3.5z" />
        <path d="M9.5 12v5.5" />
        <path d="M7 18h5.5" />
        <path d="M12.5 3.5H17.5L15.5 12H15L12.5 3.5z" />
        <path d="M15 12v5.5" />
        <path d="M12 18h5.5" />
        <path d="M10.5 4.5l3.5-1" />
        <path d="M11 6.5l2-3" />
        <circle cx="8.5" cy="7" r=".6" fill="currentColor" stroke="none" />
        <circle cx="9.5" cy="9.5" r=".6" fill="currentColor" stroke="none" />
        <circle cx="14" cy="8" r=".6" fill="currentColor" stroke="none" />
      </svg>
    )
    case "cloche": return (
      <svg {...p}>
        <path d="M4 17Q4 7.5 12 7.5Q20 7.5 20 17" />
        <path d="M2.5 17h19" />
        <path d="M12 7.5V5" />
        <circle cx="12" cy="4.5" r="1.5" />
        <path d="M8 14.5Q10 13 12 14.5Q14 16 16 14.5" />
      </svg>
    )
    case "dance": return (
      <svg {...p}>
        <circle cx="7.5" cy="3.5" r="2" />
        <path d="M7.5 5.5Q7 8 7.5 10" />
        <path d="M4.5 7.5Q6 6.5 7.5 7.5Q9 8.5 10.5 7.5" />
        <path d="M7.5 10Q5.5 13.5 6 15.5M7.5 10Q9.5 13 9.5 15.5" />
        <circle cx="16.5" cy="3.5" r="2" />
        <path d="M16.5 5.5Q16 8 16.5 10" />
        <path d="M13.5 7.5Q15 6.5 16.5 7.5Q18 8.5 19.5 7.5" />
        <path d="M16.5 10Q14.5 13 14.5 15.5M16.5 10Q18.5 13.5 18 15.5" />
        <path d="M12 6V9.5M12 6h1.5V7.5" />
      </svg>
    )
    case "music": return (
      <svg {...p}>
        <path d="M9 18.5V5l12-2.5v13.5" />
        <circle cx="6.5" cy="18.5" r="3" />
        <circle cx="18" cy="16" r="3" />
        <path d="M9 10l12-2" />
      </svg>
    )
    case "flag": return (
      <svg {...p}>
        <path d="M6 21.5V4" />
        <path d="M6 4Q10 3 14 5Q18 7 18 9.5Q18 12 14 12Q10 12 6 10.5" />
      </svg>
    )
    case "car": return (
      <svg {...p}>
        <path d="M3 13.5h18v5Q21 20 20 20H4Q3 20 3 19z" />
        <path d="M5.5 13.5L8 8.5Q8.5 7.5 10 7.5h4Q15.5 7.5 16 8.5L18.5 13.5" />
        <circle cx="7.5" cy="20" r="2.5" />
        <circle cx="16.5" cy="20" r="2.5" />
        <path d="M9.5 13.5L11 9.5h2L14.5 13.5" />
      </svg>
    )
    case "camera": return (
      <svg {...p}>
        <rect x="2" y="8" width="20" height="13" rx="2.5" />
        <circle cx="12" cy="14.5" r="4.5" />
        <circle cx="12" cy="14.5" r="2.5" />
        <path d="M8 8V6Q8 5 9.5 5h5Q16 5 16 6V8" />
        <circle cx="18" cy="11" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
    case "heart": return (
      <svg {...p}>
        <path d="M12 21Q8 17 5 14Q2 11 2 8.5Q2 5.5 4.5 4Q7 2.5 9 4Q10.5 5 12 6.5Q13.5 5 15 4Q17 2.5 19.5 4Q22 5.5 22 8.5Q22 11 19 14Q16 17 12 21z" />
      </svg>
    )
    case "pin": return (
      <svg {...p}>
        <path d="M12 2C8.5 2 6 4.5 6 8C6 13.5 12 22 12 22C12 22 18 13.5 18 8C18 4.5 15.5 2 12 2z" />
        <circle cx="12" cy="8" r="3" />
      </svg>
    )
    case "confetti": return (
      <svg {...p}>
        <path d="M3 21l5.5-9L18 15z" />
        <path d="M11.5 12L20 4" />
        <circle cx="20.5" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
        <path d="M14 6l1.5-3.5M18.5 10.5l3.5-1M16.5 15.5l2.5 2" />
        <circle cx="13" cy="3" r="1" fill="currentColor" stroke="none" />
        <circle cx="21" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
    case "bouquet": return (
      <svg {...p}>
        <path d="M12 22V16" />
        <path d="M9 17Q7 15.5 8 13Q9 10.5 12 11" />
        <path d="M15 17Q17 15.5 16 13Q15 10.5 12 11" />
        <circle cx="12" cy="8.5" r="3" />
        <circle cx="7.5" cy="7" r="2.5" />
        <circle cx="16.5" cy="7" r="2.5" />
        <circle cx="10" cy="4" r="2" />
        <circle cx="14" cy="4" r="2" />
      </svg>
    )
    default: return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 6.5V12.5L16 15" />
      </svg>
    )
  }
}

// ── Placeholder ────────────────────────────────────────────────────────────

const PLACEHOLDER_ITEMS: ProgramItem[] = [
  { id: "p1", time: "14:00", description: "Aankomst gasten",  iconId: "door"       },
  { id: "p2", time: "15:00", description: "Ceremonie",        iconId: "rings"      },
  { id: "p3", time: "17:00", description: "Borrel & toast",   iconId: "champagne"  },
  { id: "p4", time: "19:00", description: "Diner",            iconId: "cloche"     },
  { id: "p5", time: "22:00", description: "Feest & dansen",   iconId: "dance"      },
]

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  items: ProgramItem[]
  sc: SC
  programLayout?: ProgramLayout
}

export default function EventProgramPreview({ items, sc, programLayout = "centered" }: Props) {
  const sorted = items.slice().sort((a, b) => a.time.localeCompare(b.time))
  const list = sorted.length > 0 ? sorted : PLACEHOLDER_ITEMS
  const faded = items.length === 0 ? 0.3 : 1

  return (
    <div style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
      <div style={{ padding: "36px 32px 52px" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: sc.headingColor, margin: "0 0 28px" }}>
          Programma
        </h2>

        {/* ── Centered ──────────────────────────────────────────────────── */}
        {programLayout === "centered" && (
          <div>
            {list.map((item, i) => (
              <div
                key={item.id ?? i}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                  padding: "32px 16px",
                  borderBottom: i < list.length - 1 ? `1px dashed ${sc.accent}35` : "none",
                  opacity: faded,
                }}
              >
                <span style={{ color: sc.accent, marginBottom: 18 }}>
                  <ProgramIcon iconId={item.iconId} size={64} strokeWidth={2} />
                </span>
                <p style={{ fontSize: "1.375rem", fontWeight: 300, color: sc.headingColor, margin: "0 0 8px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                  {item.description}
                </p>
                <span style={{ fontSize: "1rem", color: sc.bodyText, opacity: 0.6 }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        {programLayout === "timeline" && (
          <div style={{ position: "relative", paddingLeft: 64 }}>
            {list.map((item, i) => (
              <div key={item.id ?? i} style={{ position: "relative", paddingBottom: 32, opacity: faded }}>
                {i < list.length - 1 && (
                  <div style={{
                    position: "absolute", left: -45, top: 20, bottom: -20,
                    width: 2, borderRadius: 1, backgroundColor: `${sc.accent}28`,
                  }} />
                )}
                <div style={{
                  position: "absolute", left: -64, top: 0,
                  width: 40, height: 40, borderRadius: "50%",
                  backgroundColor: sc.navBg, border: `2px solid ${sc.accent}45`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: sc.accent,
                }}>
                  <ProgramIcon iconId={item.iconId} size={22} strokeWidth={2} />
                </div>
                <div style={{ paddingTop: 6 }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: sc.labelColor }}>
                    {item.time}
                  </span>
                  <p style={{ fontSize: "1.0625rem", fontWeight: 500, color: sc.headingColor, margin: "5px 0 0", lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Bento cards (vertical stack) ──────────────────────────────── */}
        {programLayout === "bento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, opacity: faded }}>
            {list.map((item, i) => (
              <div
                key={item.id ?? i}
                style={{
                  borderRadius: 20, border: `1px solid ${sc.accent}22`,
                  backgroundColor: `${sc.accent}06`, overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                }}
              >
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                )}
                <div style={{
                  padding: item.image_url ? "20px 24px 24px" : "28px 24px 24px",
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12,
                }}>
                  {!item.image_url && (
                    <span style={{ color: sc.accent }}>
                      <ProgramIcon iconId={item.iconId} size={48} strokeWidth={2} />
                    </span>
                  )}
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: sc.labelColor, letterSpacing: "0.04em" }}>
                    {item.time}
                  </span>
                  <p style={{ fontSize: "1rem", color: sc.bodyText, margin: 0, lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
