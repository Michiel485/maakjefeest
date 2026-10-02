// Jullie aanspreekpunt: de ceremoniemeesters met hun rol, een WhatsApp-knop
// en waar je bij hen voor terechtkunt (ontwerpronde, 2 oktober 2026). Bellen
// gebeurt bijna niet meer; appen wel.

import type { SC } from "@/lib/event-styles"
import SectieKop from "./site/SectieKop"

export interface Master {
  id?: string
  naam: string
  telefoon: string
  email: string
  foto_url: string | null
  /** "zus van Lindsey", "beste vriend van Michiel" */
  rol?: string
  /** Komma's ertussen: "speeches, verrassingen, dieetwensen" */
  onderwerpen?: string
}

export interface EventMastersPreviewProps {
  masters: Master[]
  sc: SC
  text?: string | null
  onMasterClick?: (masterId: string) => void
  onTextClick?: () => void
  onContactClick?: (masterId: string, field: 'telefoon' | 'email') => void
}

export const DEFAULT_MASTERS_TEXT =
  "Wil je iets regelen wat wij niet mogen weten, heb je een vraag over het programma of over dieetwensen? Dan niet bij ons, maar bij onze ceremoniemeesters."

/** Een Nederlands nummer zoals WhatsApp hem wil: alleen cijfers, met landcode */
export function whatsappNummer(telefoon: string): string | null {
  let cijfers = telefoon.replace(/\D/g, "")
  if (!cijfers) return null
  if (cijfers.startsWith("00")) cijfers = cijfers.slice(2)
  else if (cijfers.startsWith("0")) cijfers = "31" + cijfers.slice(1)
  return cijfers.length >= 9 ? cijfers : null
}

function WhatsAppIcoon({ maat = 16 }: { maat?: number }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5L10.5 9c-.2-.5-.4-.5-.6-.5h-.9z" />
    </svg>
  )
}

export default function EventMastersPreview({ masters, sc, text, onMasterClick, onTextClick, onContactClick }: EventMastersPreviewProps) {
  const visible = masters.filter((m) => m.naam || m.foto_url)
  const intro = text ?? DEFAULT_MASTERS_TEXT

  return (
    <div className="@container px-6 pt-12 pb-14" style={{ fontFamily: sc.fontFamily }}>

      <SectieKop
        sc={sc}
        kopje="Jullie aanspreekpunt"
        titel="Ceremoniemeesters"
        onder={intro ? (
          <p
            style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: sc.bodyText, cursor: onTextClick ? "pointer" : undefined }}
            onClick={onTextClick}
            title={onTextClick ? "Klik om te bewerken" : undefined}
          >
            {intro}
          </p>
        ) : undefined}
      />

      {/* Zonder ceremoniemeesters alleen in de bouwer een hint; op de echte
          site staat de sectie er dan helemaal niet (lib/sectie-inhoud.ts) */}
      {visible.length === 0 ? (
        onMasterClick ? (
          <p className="text-sm italic text-center" style={{ color: sc.bodyText, opacity: 0.6 }}>
            Voeg hiernaast jullie ceremoniemeesters toe.
          </p>
        ) : null
      ) : (
        <div
          className={`mx-auto grid grid-cols-1 ${visible.length > 1 ? "@md:grid-cols-2" : ""}`}
          style={{ gap: 20, maxWidth: visible.length > 1 ? 720 : 380 }}
        >
          {visible.map((master, i) => {
            const id = master.id ?? i.toString()
            const wa = master.telefoon ? whatsappNummer(master.telefoon) : null
            const onderwerpen = (master.onderwerpen ?? "").split(",").map((s) => s.trim()).filter(Boolean)
            return (
              <div
                key={id}
                className="flex flex-col items-center text-center"
                style={{
                  padding: "28px 22px 24px",
                  borderRadius: 18,
                  backgroundColor: sc.goldBorder && sc.cardBg ? sc.cardBg : `${sc.accent}0a`,
                  border: sc.goldBorder && sc.cardBg ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}22`,
                  color: sc.goldBorder && sc.cardText ? sc.cardText : sc.bodyText,
                }}
              >
                {master.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={master.foto_url} alt={master.naam} style={{ width: 128, height: 128, borderRadius: "50%", objectFit: "cover", border: `3px solid ${sc.accent}55`, marginBottom: 14 }} />
                ) : (
                  <div style={{ width: 128, height: 128, borderRadius: "50%", backgroundColor: `${sc.accent}14`, border: `3px solid ${sc.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke={sc.accent} strokeWidth={1.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}

                {master.naam && (
                  <p
                    style={{ margin: 0, fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight, fontSize: "1.5rem", lineHeight: 1.15, color: sc.goldBorder && sc.cardText ? sc.cardText : sc.headingColor, cursor: onMasterClick ? "pointer" : undefined }}
                    onClick={onMasterClick ? () => onMasterClick(id) : undefined}
                    title={onMasterClick ? "Klik om te bewerken" : undefined}
                  >
                    {master.naam}
                  </p>
                )}
                {master.rol && (
                  <p style={{ margin: "4px 0 0", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: sc.accent }}>
                    {master.rol}
                  </p>
                )}

                {(master.telefoon || master.email) && (
                  <div className="flex flex-col items-center" style={{ gap: 8, marginTop: 16 }}>
                    {master.telefoon && (
                      onContactClick ? (
                        <span
                          className="inline-flex items-center gap-2"
                          style={{ padding: "9px 18px", borderRadius: 999, border: `1px solid ${sc.accent}`, color: sc.accent, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}
                          onClick={() => onContactClick(id, "telefoon")}
                          title="Klik om te bewerken"
                        >
                          <WhatsAppIcoon /> WhatsApp
                        </span>
                      ) : wa ? (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                          style={{ padding: "9px 18px", borderRadius: 999, backgroundColor: sc.buttonBg, color: sc.buttonText, fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}
                        >
                          <WhatsAppIcoon /> WhatsApp
                        </a>
                      ) : (
                        <a href={`tel:${master.telefoon.replace(/[\s\-()]/g, "")}`} style={{ color: sc.accent, textDecoration: "none", fontSize: "0.9375rem" }}>{master.telefoon}</a>
                      )
                    )}
                    {master.email && (
                      onContactClick ? (
                        <span style={{ fontSize: "0.8125rem", opacity: 0.85, cursor: "pointer" }} onClick={() => onContactClick(id, "email")} title="Klik om te bewerken">{master.email}</span>
                      ) : (
                        <a href={`mailto:${master.email}`} style={{ fontSize: "0.8125rem", color: "inherit", opacity: 0.85, textDecoration: "none" }}>{master.email}</a>
                      )
                    )}
                  </div>
                )}

                {onderwerpen.length > 0 && (
                  <div className="flex flex-wrap justify-center" style={{ gap: 6, marginTop: 16 }}>
                    {onderwerpen.map((o) => (
                      <span key={o} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: 999, border: `1px solid ${sc.accent}44`, color: "inherit", opacity: 0.9 }}>{o}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
