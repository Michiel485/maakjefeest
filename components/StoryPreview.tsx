"use client"

// Ons verhaal: momenten om en om, foto links en tekst rechts en dan andersom,
// met de foto's een klein beetje scheef zoals losse foto's op tafel, en
// daarboven één zin die eruit springt (ontwerpronde, 2 oktober 2026).
// Eén moment zonder jaar is gewoon het oude verhaal, maar dan mooi gezet.

import type { SC } from "@/lib/event-styles"
import type { Moment } from "@/lib/verhaal"
import SectieKop from "./site/SectieKop"
import SleepFoto from "./site/SleepFoto"

export interface StoryPreviewProps {
  title: string | null
  quote?: string | null
  momenten: Moment[]
  editable?: boolean
  /** In de bouwer: 'title', 'quote' of 'moment:<id>' */
  onFieldClick?: (field: string) => void
  onPositionChange?: (id: string, x: number, y: number) => void
  sc: SC
}

export default function StoryPreview({ title, quote, momenten, editable = false, onFieldClick, onPositionChange, sc }: StoryPreviewProps) {
  const klik = (veld: string) => onFieldClick ? { onClick: () => onFieldClick(veld), style: { cursor: "pointer" } as const, title: "Klik om te bewerken" } : {}
  const metInhoud = momenten.filter((m) => m.tekst.trim() || m.image_url)
  const leeg = metInhoud.length === 0 && !quote?.trim()

  return (
    <div className="@container" style={{ fontFamily: sc.fontFamily, padding: "48px 24px 56px" }}>
      <SectieKop
        sc={sc}
        kopje="Over ons"
        titel={title || "Ons verhaal"}
        onClick={onFieldClick ? () => onFieldClick("title") : undefined}
        klikTitel={onFieldClick ? "Klik om te bewerken" : undefined}
        onder={quote?.trim() ? (
          <p
            {...klik("quote")}
            style={{
              margin: 0,
              fontFamily: sc.fontPageTitles,
              fontWeight: sc.fontPageTitlesWeight,
              fontStyle: "italic",
              fontSize: "clamp(1.25rem, 3cqw, 1.6rem)",
              lineHeight: 1.4,
              color: sc.headingColor,
              textWrap: "balance",
            }}
          >
            &ldquo;{quote.trim()}&rdquo;
          </p>
        ) : undefined}
      />

      {leeg && (editable || onFieldClick) && (
        <p className="italic text-sm text-center" style={{ color: sc.bodyText, opacity: 0.5 }}>
          Schrijf hiernaast jullie verhaal in momenten.
        </p>
      )}

      <div className="mx-auto flex flex-col" style={{ maxWidth: 860, gap: 44 }}>
        {metInhoud.map((m, i) => {
          const rechts = i % 2 === 1
          const metFoto = !!m.image_url
          const tekst = (
            <div className={`flex flex-col ${metFoto ? "items-center text-center @md:items-start @md:text-left" : "items-center text-center"}`} style={{ gap: 6, maxWidth: metFoto ? undefined : 620, margin: metFoto ? undefined : "0 auto" }}>
              {m.jaar && (
                <span style={{ fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight, fontSize: "1.5rem", lineHeight: 1, color: sc.accent }}>{m.jaar}</span>
              )}
              {m.titel && (
                <span style={{ fontWeight: 700, fontSize: "1.125rem", color: sc.headingColor, lineHeight: 1.3 }}>{m.titel}</span>
              )}
              {m.tekst && (
                <p className="whitespace-pre-wrap leading-relaxed" style={{ margin: 0, color: sc.bodyText, fontSize: "1rem" }}>{m.tekst}</p>
              )}
            </div>
          )
          if (!metFoto) {
            return <div key={m.id} {...klik(`moment:${m.id}`)}>{tekst}</div>
          }
          return (
            <div key={m.id} className="grid grid-cols-1 @md:grid-cols-2 items-center" style={{ gap: 28 }} {...klik(`moment:${m.id}`)}>
              <div className={rechts ? "@md:order-2" : ""} style={{ padding: "6px 10px" }}>
                <SleepFoto
                  src={m.image_url!}
                  posX={m.image_pos_x ?? 50}
                  posY={m.image_pos_y ?? 50}
                  editable={editable}
                  onChange={onPositionChange ? (x, y) => onPositionChange(m.id, x, y) : undefined}
                  className="w-full"
                  style={{
                    aspectRatio: "4 / 3",
                    borderRadius: 10,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
                    transform: `rotate(${rechts ? 1.6 : -1.6}deg)`,
                    border: `6px solid ${sc.navBg}`,
                  }}
                />
              </div>
              <div className={rechts ? "@md:order-1" : ""}>{tekst}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
