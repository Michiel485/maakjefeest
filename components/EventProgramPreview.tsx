"use client"

import type { SC } from "@/lib/event-styles"

export type ProgramLayout = "centered" | "timeline"

export interface ProgramItem {
  id?: string
  time: string
  title?: string
  description: string
  iconId?: string
  image_url?: string | null
  imagePosX?: number
}

// ── Icon registry ──────────────────────────────────────────────────────────

export const PROGRAM_ICONS: { id: string; label: string }[] = [
  { id: "heart",     label: "Hart"      },
  { id: "rings",     label: "Ringen"    },
  { id: "church",    label: "Kerk"      },
  { id: "bouquet",   label: "Boeket"    },
  { id: "car",       label: "Auto"      },
  { id: "dove",      label: "Duif"      },
  { id: "suit",      label: "Pak"       },
  { id: "ring",      label: "Ring"      },
  { id: "letter",    label: "Brief"     },
  { id: "hand_ring", label: "Aanzoek"   },
  { id: "cake",      label: "Taart"     },
  { id: "couple",    label: "Honeymoon" },
  { id: "calendar",  label: "Datum"     },
  { id: "champagne", label: "Champagne" },
  { id: "video",     label: "Video"     },
  { id: "camera",    label: "Camera"    },
  { id: "cutlery",   label: "Diner"     },
  { id: "dress",     label: "Jurk"      },
  { id: "cupid",     label: "Cupido"    },
  { id: "gender",    label: "Symbolen"  },
]

export function ProgramIcon({ iconId = "heart", size, strokeWidth }: {
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
    case "heart": return (
      <svg {...p}>
        <path d="M12 21Q8 17 5 14Q2 11 2 8.5Q2 5.5 4.5 4Q7 2.5 9 4Q10.5 5 12 6.5Q13.5 5 15 4Q17 2.5 19.5 4Q22 5.5 22 8.5Q22 11 19 14Q16 17 12 21z" />
      </svg>
    )
    case "rings": return (
      <svg {...p}>
        {/* two interlocked wedding bands */}
        <circle cx="9" cy="14" r="5" />
        <circle cx="15" cy="14" r="5" />
        {/* diamond gem sitting on top of the right ring (pavilion tip at y=9 = top of ring) */}
        <path d="M12.5 2.5H17.5L19 6.5H11z" />
        <path d="M11 6.5H19L15 9z" />
        <path d="M15 2.5V6.5M12.5 6.5L15 9M17.5 6.5L15 9" />
      </svg>
    )
    case "church": return (
      <svg {...p}>
        {/* building body + roof */}
        <path d="M4 22V10L12 5L20 10V22H4z" />
        {/* arched door */}
        <path d="M9 22V16Q9 13.5 12 13.5Q15 13.5 15 16V22" />
        {/* cross steeple */}
        <path d="M12 1V5" />
        <path d="M10.5 2.5H13.5" />
        {/* round windows */}
        <circle cx="7.5" cy="11.5" r="1.5" />
        <circle cx="16.5" cy="11.5" r="1.5" />
      </svg>
    )
    case "bouquet": return (
      <svg {...p}>
        {/* flower heads — tulip/petal shapes */}
        <path d="M12 9Q10 7 10 5Q10 3 12 3Q14 3 14 5Q14 7 12 9z" />
        <path d="M8.5 10Q6.5 8.5 7 6.5Q7.5 4.5 9.5 5Q11 5.5 10.5 8.5z" />
        <path d="M15.5 10Q17.5 8.5 17 6.5Q16.5 4.5 14.5 5Q13 5.5 13.5 8.5z" />
        {/* leaves */}
        <path d="M7.5 11.5Q5.5 11 5.5 9.5" />
        <path d="M16.5 11.5Q18.5 11 18.5 9.5" />
        {/* stems converging */}
        <path d="M8.5 11Q10 13 12 13Q14 13 15.5 11" />
        <path d="M12 13V21" />
        {/* ribbon bow */}
        <path d="M10.5 17Q9.5 15.5 10.5 15Q11.5 15.5 12 15Q12.5 15.5 13.5 15Q14.5 15.5 13.5 17" />
      </svg>
    )
    case "car": return (
      <svg {...p}>
        {/* body / running board */}
        <path d="M1 15H23V19Q23 20.5 22 20.5H2Q1 20.5 1 19z" />
        {/* cabin silhouette (open-top convertible) */}
        <path d="M4 15L6.5 9Q7 8 9 8H16Q17.5 8 18 9L21 15" />
        {/* windscreen divider */}
        <path d="M14 8L15 15" />
        {/* wheels */}
        <circle cx="6.5" cy="20.5" r="2.5" />
        <circle cx="17.5" cy="20.5" r="2.5" />
        {/* headlight */}
        <path d="M21.5 16.5L23 16.5" />
        {/* bumper / front detail */}
        <path d="M1 17H3" />
      </svg>
    )
    case "dove": return (
      <svg {...p}>
        {/* body + right wing */}
        <path d="M13 12Q14.5 8 18 6.5Q21 5.5 22 8Q20 10 17 11" />
        {/* tail wing fills body */}
        <path d="M17 11Q19 13.5 18 17Q15 15 13 12" />
        {/* left wing / breast */}
        <path d="M2 11Q5 7 9 8Q12 9 13 12" />
        {/* body neck + head */}
        <path d="M13 12Q12 14.5 11 17" />
        {/* tail feathers */}
        <path d="M11 17L8.5 16M11 17L9.5 19.5" />
        {/* eye dot */}
        <circle cx="21" cy="8" r=".8" fill="currentColor" stroke="none" />
      </svg>
    )
    case "suit": return (
      <svg {...p}>
        {/* jacket outer body */}
        <path d="M5 22Q5 15 6 9Q7 5.5 8 3" />
        <path d="M19 22Q19 15 18 9Q17 5.5 16 3" />
        {/* lapels — two curves meeting at chest point */}
        <path d="M8 3Q9 6 12 10" />
        <path d="M16 3Q15 6 12 10" />
        {/* collar V between lapels */}
        <path d="M8 3Q10 5 12 4Q14 5 16 3" />
        {/* center seam */}
        <path d="M12 10V22" />
        {/* bow tie — left lobe */}
        <path d="M9.5 6L12 7.5L9.5 9Q10.5 7.5 9.5 6z" />
        {/* bow tie — right lobe */}
        <path d="M14.5 6L12 7.5L14.5 9Q13.5 7.5 14.5 6z" />
      </svg>
    )
    case "ring": return (
      <svg {...p}>
        {/* ring band */}
        <circle cx="12" cy="17" r="5" />
        {/* diamond crown (table + girdle facets) */}
        <path d="M9.5 5.5H14.5L16 9.5H8z" />
        {/* diamond pavilion */}
        <path d="M8 9.5H16L12 14z" />
        {/* facet lines */}
        <path d="M12 5.5V9.5M10.5 9.5L12 14M13.5 9.5L12 14" />
      </svg>
    )
    case "letter": return (
      <svg {...p}>
        {/* envelope body */}
        <rect x="2.5" y="6" width="19" height="14" rx="1.5" />
        {/* open flap V */}
        <path d="M2.5 6L12 14L21.5 6" />
        {/* heart on flap */}
        <path d="M12 12.5Q10.5 11 10.5 10Q10.5 9 11.5 9Q12 9 12 9.5Q12 9 12.5 9Q13.5 9 13.5 10Q13.5 11 12 12.5z" fill="currentColor" stroke="none" />
      </svg>
    )
    case "hand_ring": return (
      <svg {...p}>
        {/* palm / base of hand */}
        <path d="M7 22Q5.5 19 5.5 15V13Q5.5 11.5 7 11.5Q8.5 11.5 8.5 13" />
        {/* index finger */}
        <path d="M8.5 13V11Q8.5 9.5 10 9.5Q11.5 9.5 11.5 11V13" />
        {/* middle finger */}
        <path d="M11.5 13V10Q11.5 8.5 13 8.5Q14.5 8.5 14.5 10V13" />
        {/* ring finger + thumb side */}
        <path d="M14.5 13V11Q14.5 9.5 16 9.5Q17.5 9.5 17.5 11V14Q17.5 19 15 21Q13 22 7 22" />
        {/* ring on middle finger */}
        <path d="M11.5 13Q11.5 14.5 13 14.5Q14.5 14.5 14.5 13" />
        {/* diamond above (crown + pavilion) */}
        <path d="M11 6H15L16 8.5H10z" />
        <path d="M10 8.5H16L13 11z" />
      </svg>
    )
    case "cake": return (
      <svg {...p}>
        {/* bottom tier */}
        <rect x="3.5" y="16.5" width="17" height="5" rx="1" />
        {/* wave on bottom tier */}
        <path d="M3.5 18Q6 16 8.5 18Q11 20 13.5 18Q16 16 18.5 18Q20 16.5 20.5 17" />
        {/* middle tier */}
        <rect x="6.5" y="12.5" width="11" height="4" rx="1" />
        {/* wave on middle tier */}
        <path d="M6.5 14Q8.5 12.5 10.5 14Q12.5 15.5 14.5 14Q16.5 12.5 17.5 13.5" />
        {/* top tier */}
        <rect x="9" y="9.5" width="6" height="3" rx="1" />
        {/* heart topper */}
        <path d="M12 8Q11 6.5 10 6.5Q9 6.5 9 7.5Q9 9 12 10.5Q15 9 15 7.5Q15 6.5 14 6.5Q13 6.5 12 8z" />
        {/* stem from heart to cake */}
        <path d="M12 10.5V9.5" />
      </svg>
    )
    case "couple": return (
      <svg {...p}>
        {/* headboard */}
        <path d="M2 9V5Q2 4 3 4H21Q22 4 22 5V9" />
        {/* mattress */}
        <path d="M2 9H22V20Q22 21 21 21H3Q2 21 2 20z" />
        {/* floor line */}
        <path d="M1 22H23" />
        {/* left pillow */}
        <rect x="3.5" y="11.5" width="7" height="5.5" rx="2.5" />
        {/* right pillow */}
        <rect x="13.5" y="11.5" width="7" height="5.5" rx="2.5" />
        {/* heart on headboard */}
        <path d="M12 7.5Q11 6 10 6Q9 6 9 7Q9 8.5 12 10Q15 8.5 15 7Q15 6 14 6Q13 6 12 7.5z" />
      </svg>
    )
    case "calendar": return (
      <svg {...p}>
        {/* calendar body */}
        <rect x="3" y="4.5" width="18" height="17" rx="1.5" />
        <path d="M3 9.5H21" />
        {/* ring tabs */}
        <path d="M8 2V6M16 2V6" />
        {/* dashed border effect — dots on inner sides */}
        <path d="M6 12H7M11 12H13M17 12H18" strokeDasharray="1 2" />
        {/* heart */}
        <path d="M12 19Q9.5 17 9.5 15.5Q9.5 14 11 14Q11.5 14 12 14.5Q12.5 14 13 14Q14.5 14 14.5 15.5Q14.5 17 12 19z" />
      </svg>
    )
    case "champagne": return (
      <svg {...p}>
        {/* left flute (tilted slightly right to clink) */}
        <path d="M6.5 3.5L10 4.5L8.5 12H8L6.5 3.5z" />
        <path d="M8.5 12V17.5" />
        <path d="M6 18.5H11" />
        {/* right flute (tilted slightly left) */}
        <path d="M17.5 3.5L14 4.5L15.5 12H16L17.5 3.5z" />
        <path d="M15.5 12V17.5" />
        <path d="M13 18.5H18" />
        {/* clink spark at top centre */}
        <path d="M12 2.5L12 4M10.5 3.5L11.5 4.5M13.5 3.5L12.5 4.5" />
        {/* bubbles */}
        <circle cx="8.5" cy="7" r=".5" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="8" r=".5" fill="currentColor" stroke="none" />
        <circle cx="9" cy="10" r=".5" fill="currentColor" stroke="none" />
      </svg>
    )
    case "video": return (
      <svg {...p}>
        {/* camera body */}
        <rect x="1.5" y="9" width="14" height="10" rx="1.5" />
        {/* film-camera side lens / playback triangle */}
        <path d="M15.5 11.5L22 9V18L15.5 15.5z" />
        {/* two film reels on top */}
        <circle cx="5" cy="6" r="2.5" />
        <circle cx="10.5" cy="6" r="2.5" />
        {/* reel connector bar */}
        <path d="M7.5 6H8" />
      </svg>
    )
    case "camera": return (
      <svg {...p}>
        {/* camera body */}
        <rect x="2" y="8" width="20" height="13" rx="2" />
        {/* viewfinder bump */}
        <path d="M8 8V6Q8 5 9.5 5H14.5Q16 5 16 6V8" />
        {/* lens circle */}
        <circle cx="12" cy="14.5" r="4.5" />
        {/* heart inside lens */}
        <path d="M12 16.5Q10.5 15 10.5 14Q10.5 13 11.5 13Q12 13 12 13.5Q12 13 12.5 13Q13.5 13 13.5 14Q13.5 15 12 16.5z" fill="currentColor" stroke="none" />
        {/* shutter button */}
        <circle cx="18" cy="11" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
    case "cutlery": return (
      <svg {...p}>
        {/* fork — 3 prongs + handle */}
        <path d="M5 3V9M6.5 3V9M8 3V9" />
        <path d="M5 9Q5 11.5 6.5 11.5Q8 11.5 8 9" />
        <path d="M6.5 11.5V21" />
        {/* plate in the center */}
        <circle cx="12" cy="14" r="4" />
        {/* knife — blade + handle */}
        <path d="M16.5 3H18.5Q20.5 7 18.5 12" />
        <path d="M16.5 3Q16 7 18.5 12" />
        <path d="M18.5 12V21" />
      </svg>
    )
    case "dress": return (
      <svg {...p}>
        {/* straps */}
        <path d="M10 3Q9.5 5 8.5 7" />
        <path d="M14 3Q14.5 5 15.5 7" />
        {/* bodice trapezoid */}
        <path d="M8.5 7H15.5L16.5 11H7.5z" />
        {/* skirt A-line */}
        <path d="M7.5 11L3 22H21L16.5 11" />
        {/* neckline */}
        <path d="M10 3Q11 4.5 12 4Q13 4.5 14 3" />
        {/* waist decoration */}
        <path d="M8 11Q10 10 12 10Q14 10 16 11" />
      </svg>
    )
    case "cupid": return (
      <svg {...p}>
        {/* bow arc (curves to the left) */}
        <path d="M6 3Q3 7 3 12Q3 17 6 21" />
        {/* bow string (straight chord) */}
        <path d="M6 3L6 21" />
        {/* arrow shaft */}
        <path d="M8 12H22" />
        {/* arrowhead */}
        <path d="M19.5 9L22 12L19.5 15" />
        {/* fletching */}
        <path d="M8 10.5L6 9M8 13.5L6 15" />
      </svg>
    )
    case "gender": return (
      <svg {...p}>
        {/* female symbol — circle + cross */}
        <circle cx="8" cy="12" r="5" />
        <path d="M8 17V21M6 19H10" />
        <circle cx="16" cy="9" r="5" />
        <path d="M19.5 5.5L22 3" />
        <path d="M19.5 3H22V5.5" />
      </svg>
    )
    default: return (
      <svg {...p}>
        <path d="M12 21Q8 17 5 14Q2 11 2 8.5Q2 5.5 4.5 4Q7 2.5 9 4Q10.5 5 12 6.5Q13.5 5 15 4Q17 2.5 19.5 4Q22 5.5 22 8.5Q22 11 19 14Q16 17 12 21z" />
      </svg>
    )
  }
}

// ── Drag handle overlay ────────────────────────────────────────────────────

function DragHandle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))", opacity: 0.85 }}>
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 2v20M2 12h20" />
    </svg>
  )
}

// ── Placeholder ────────────────────────────────────────────────────────────

const PLACEHOLDER_ITEMS: ProgramItem[] = [
  { id: "p1", time: "13:00", title: "Aankomst",  description: "Welkom bij onze trouwdag",    iconId: "church"    },
  { id: "p2", time: "14:00", title: "Ceremonie", description: "Het ja-woord moment",          iconId: "rings"     },
  { id: "p3", time: "17:00", title: "Borrel",    description: "Toasten op het geluk",         iconId: "champagne" },
  { id: "p4", time: "19:00", title: "Diner",     description: "Geniet van het feestmaal",     iconId: "cutlery"   },
  { id: "p5", time: "22:00", title: "Feest",     description: "Dansen tot in de nacht",       iconId: "heart"     },
]

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  items: ProgramItem[]
  sc: SC
  programLayout?: ProgramLayout
  builderMode?: boolean
  onImagePositionChange?: (itemId: string, x: number) => void
}

export default function EventProgramPreview({
  items, sc, programLayout = "centered", builderMode, onImagePositionChange,
}: Props) {
  const sorted = items.slice().sort((a, b) => a.time.localeCompare(b.time))
  const list = sorted.length > 0 ? sorted : PLACEHOLDER_ITEMS
  const faded = items.length === 0 ? 0.3 : 1

  function startDrag(e: React.MouseEvent, item: ProgramItem) {
    if (!builderMode || !onImagePositionChange) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const itemId = item.id ?? `${item.time}::${item.description}`
    const startX = e.clientX
    const startPosX = item.imagePosX ?? 50
    const w = rect.width

    function onMove(me: MouseEvent) {
      if (!onImagePositionChange) return
      // Pan: drag right → image slides right → reveal left side → posX decreases
      const newX = Math.max(0, Math.min(100, startPosX - ((me.clientX - startX) / w) * 150))
      onImagePositionChange(itemId, newX)
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  return (
    <div style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
      <div style={{ padding: "36px 32px 52px" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: sc.headingColor, margin: "0 0 28px" }}>
          Programma
        </h2>

        {/* ── Centered — strict 3-column grid, text always middle ─────────── */}
        {programLayout === "centered" && (
          <div>
            {list.map((item, i) => {
              const isOdd = i % 2 === 0   // true = icon left, photo right
              const posX = item.imagePosX ?? 50

              const iconTimeCell = (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <span style={{ color: sc.accent }}>
                    <ProgramIcon iconId={item.iconId} size={80} strokeWidth={1.5} />
                  </span>
                  <span style={{ fontSize: "1.75rem", fontWeight: 700, color: sc.labelColor, letterSpacing: "0.02em", lineHeight: 1 }}>
                    {item.time}
                  </span>
                </div>
              )

              const textCell = (
                <div style={{ textAlign: isOdd ? "left" : "right" }}>
                  {item.title && (
                    <p style={{ fontSize: "1.25rem", fontWeight: 800, color: sc.headingColor, margin: "0 0 6px", lineHeight: 1.2 }}>
                      {item.title}
                    </p>
                  )}
                  {item.description && (
                    <p style={{ fontSize: "0.9375rem", fontWeight: 400, color: sc.bodyText, margin: 0, lineHeight: 1.6 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              )

              const photoCell = (
                <div style={{ width: 128, height: 128, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                  {item.image_url && (
                    <>
                      <div
                        onMouseDown={(e) => startDrag(e, item)}
                        style={{ width: "100%", height: "100%", cursor: builderMode ? "grab" : undefined }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${posX}% 50%`, display: "block", pointerEvents: "none" }}
                        />
                      </div>
                      {builderMode && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                          <DragHandle size={24} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )

              return (
                <div
                  key={item.id ?? i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px 1fr 128px",
                    alignItems: "center",
                    gap: 24,
                    padding: "28px 0",
                    borderBottom: i < list.length - 1 ? `1px dashed ${sc.accent}35` : "none",
                    opacity: faded,
                  }}
                >
                  {isOdd
                    ? <>{iconTimeCell}{textCell}{photoCell}</>
                    : <>{photoCell}{textCell}{iconTimeCell}</>
                  }
                </div>
              )
            })}
          </div>
        )}

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        {programLayout === "timeline" && (
          <div style={{ position: "relative", paddingLeft: 72 }}>
            {list.map((item, i) => {
              const posX = item.imagePosX ?? 50
              return (
                <div key={item.id ?? i} style={{ position: "relative", paddingBottom: 48, opacity: faded }}>
                  {i < list.length - 1 && (
                    <div style={{
                      position: "absolute", left: -53, top: 24, bottom: -24,
                      width: 2, borderRadius: 1, backgroundColor: `${sc.accent}28`,
                    }} />
                  )}
                  <div style={{
                    position: "absolute", left: -72, top: 0,
                    width: 44, height: 44, borderRadius: "50%",
                    backgroundColor: sc.navBg, border: `2px solid ${sc.accent}45`,
                    display: "flex", alignItems: "center", justifyContent: "center", color: sc.accent,
                  }}>
                    <ProgramIcon iconId={item.iconId} size={24} strokeWidth={2} />
                  </div>
                  <div style={{ paddingTop: 8, display: "flex", alignItems: "flex-start", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: sc.labelColor }}>
                        {item.time}
                      </span>
                      {item.title && (
                        <p style={{ fontSize: "1.125rem", fontWeight: 800, color: sc.headingColor, margin: "6px 0 4px", lineHeight: 1.3 }}>
                          {item.title}
                        </p>
                      )}
                      {item.description && (
                        <p style={{ fontSize: "0.9375rem", fontWeight: 400, color: sc.bodyText, margin: item.title ? "0" : "7px 0 0", lineHeight: 1.4 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.image_url && (
                      <div
                        onMouseDown={(e) => startDrag(e, item)}
                        style={{
                          width: 128, height: 128, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                          position: "relative", cursor: builderMode ? "grab" : undefined,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${posX}% 50%` }}
                        />
                        {builderMode && (
                          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DragHandle size={22} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
