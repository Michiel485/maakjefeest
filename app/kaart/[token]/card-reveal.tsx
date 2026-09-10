"use client"

import { useState, useSyncExternalStore } from "react"
import type { SC } from "@/lib/event-styles"
import type { CardDisplay } from "@/lib/cards"

type Stage = "closed" | "flap" | "card" | "open"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

// Envelop die opent na een tik, waarna de kaart tevoorschijn komt.
// Volledig CSS-gedreven; kleuren en fonts komen uit het sitethema.
export default function CardReveal({
  display,
  initials,
  sc,
  siteUrl,
  rsvpUrl,
  demo = false,
  previewNotice = false,
  siteVolgt = false,
  startOpen = false,
  watermerk = false,
}: {
  display: CardDisplay
  initials: string
  sc: SC
  siteUrl: string | null
  rsvpUrl: string | null
  // Voorbeeldkaart op de marketingsite: geen site-knoppen, wel een CTA
  demo?: boolean
  // Het bruidspaar bekijkt zijn eigen nog niet geactiveerde kaart
  previewNotice?: boolean
  // Er hoort een trouwsite bij dit pakket, maar die staat nog niet live
  siteVolgt?: boolean
  // Voorbeeld in de bouwer: meteen de kaart tonen, zonder envelop
  startOpen?: boolean
  // Alleen de watermerkbanen, zonder de zwarte strook bovenaan
  watermerk?: boolean
}) {
  const [stage, setStage] = useState<Stage>(startOpen ? "open" : "closed")
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  )

  function open() {
    if (stage !== "closed") return
    if (reduceMotion) {
      setStage("open")
      return
    }
    setStage("flap")
    setTimeout(() => setStage("card"), 450)
    setTimeout(() => setStage("open"), 1350)
  }

  const cardVisible = stage === "card" || stage === "open"
  const envelopeGone = stage === "card" || stage === "open"

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background: sc.bodyBackground ?? sc.bodyBg,
        fontFamily: sc.fontFamily,
        letterSpacing: sc.bodyLetterSpacing,
      }}
    >
      {sc.fontImport && <style>{sc.fontImport}</style>}
      {previewNotice && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-4 py-2.5 text-center text-xs font-semibold"
          style={{ backgroundColor: "#1A1A1A", color: "#FAF7F2", letterSpacing: "0.02em" }}
        >
          Voorbeeld, alleen voor jullie zichtbaar. Activeer je pakket om deze kaart te kunnen versturen.
        </div>
      )}
      {(previewNotice || watermerk) && (
        /* Watermerk over de hele kaart, zodat een schermafbeelding ook niet als
           echte kaart te gebruiken is. Absoluut binnen deze container, dus het
           werkt ook als de kaart in een paneel of overlay staat. */
        <div
          aria-hidden="true"
          className="absolute inset-0 z-40 flex flex-col justify-around items-center"
          style={{ pointerEvents: "none", overflow: "hidden" }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className="text-xl sm:text-3xl font-semibold whitespace-nowrap"
              style={{ transform: "rotate(-28deg)", color: "#111", opacity: 0.13, letterSpacing: "0.35em" }}
            >
              VOORBEELD · SAYINGYES
            </span>
          ))}
        </div>
      )}
      <style>{`
        @keyframes kaart-zweef {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes kaart-fadein {
          from { opacity: 0; transform: translateY(24px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes knoppen-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative w-full max-w-md flex flex-col items-center">

        {/* ── Envelop ──────────────────────────────────────────────────────── */}
        {stage !== "open" && (
          <button
            onClick={open}
            aria-label="Open de envelop"
            className="relative block outline-none"
            style={{
              width: "min(340px, 86vw)",
              aspectRatio: "17/12",
              cursor: stage === "closed" ? "pointer" : "default",
              background: "none",
              border: "none",
              padding: 0,
              animation: stage === "closed" ? "kaart-zweef 3s ease-in-out infinite" : "none",
              opacity: envelopeGone ? 0 : 1,
              transform: envelopeGone ? "translateY(70px) scale(0.92)" : "none",
              transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
            }}
          >
            {/* Romp */}
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                backgroundColor: sc.cardBg ?? sc.navBg,
                border: `1.5px solid ${sc.accent}50`,
                boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
              }}
            />
            {/* Vouwlijnen onderin (de "zak" van de envelop) */}
            <span
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{ border: "1px solid transparent" }}
            >
              <span
                className="absolute"
                style={{
                  left: -2, right: -2, bottom: -2, height: "72%",
                  background: `linear-gradient(135deg, transparent 49.6%, ${sc.accent}18 50%), linear-gradient(-135deg, transparent 49.6%, ${sc.accent}18 50%)`,
                }}
              />
            </span>
            {/* Klep */}
            <span
              className="absolute left-0 right-0 top-0"
              style={{
                height: "58%",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                backgroundColor: sc.cardBg ?? sc.navBg,
                filter: "brightness(0.96)",
                borderRadius: "16px 16px 0 0",
                boxShadow: `inset 0 -1px 0 ${sc.accent}40`,
                transformOrigin: "top center",
                transform: stage === "closed" ? "rotateX(0deg)" : "rotateX(180deg)",
                transition: "transform 0.55s ease",
                zIndex: 2,
              }}
            />
            {/* Zegel met initialen */}
            <span
              className="absolute left-1/2 flex items-center justify-center rounded-full"
              style={{
                top: "44%",
                width: 62,
                height: 62,
                marginLeft: -31,
                backgroundColor: sc.accent,
                color: sc.buttonText,
                fontFamily: sc.fontInitials ?? sc.fontPageTitles,
                fontSize: "1.35rem",
                boxShadow: "0 3px 12px rgba(0,0,0,0.22)",
                zIndex: 3,
                opacity: stage === "closed" ? 1 : 0,
                transform: stage === "closed" ? "scale(1)" : "scale(0.6)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              {initials || "♥"}
            </span>
          </button>
        )}

        {stage === "closed" && (
          <p
            className="mt-6 text-sm"
            style={{ color: sc.bodyText, opacity: 0.75 }}
          >
            Er is post voor je, tik op de envelop 💌
          </p>
        )}

        {/* ── De kaart ─────────────────────────────────────────────────────── */}
        {cardVisible && (
          <div
            className={stage === "open" ? "" : "absolute top-0"}
            style={{
              width: "100%",
              maxWidth: 420,
              animation: reduceMotion ? "none" : "kaart-fadein 0.8s ease 0.15s both",
            }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: sc.cardBg ?? "#FFFEFB",
                border: sc.goldBorder ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}45`,
                boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
              }}
            >
              {/* Fototemplate: foto bovenin */}
              {display.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={display.photoUrl}
                  alt=""
                  style={{ width: "100%", aspectRatio: "5/3", objectFit: "cover", display: "block" }}
                />
              )}

              <div className="px-8 py-9 flex flex-col items-center text-center gap-4">
                {/* Binnenkader */}
                <p
                  className="text-xs font-semibold uppercase"
                  style={{ color: sc.labelColor, letterSpacing: "0.35em" }}
                >
                  {display.heading}
                </p>

                {/* Ornament */}
                <div className="flex items-center gap-2.5 w-full max-w-[220px]">
                  <div style={{ flex: 1, height: 1, backgroundColor: `${sc.accent}70` }} />
                  <svg width="8" height="8" viewBox="0 0 8 8" fill={sc.accent}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
                  <div style={{ flex: 1, height: 1, backgroundColor: `${sc.accent}70` }} />
                </div>

                <p
                  className="notranslate leading-tight"
                  style={{
                    fontFamily: sc.fontFrameNames,
                    fontWeight: sc.fontFrameNamesWeight,
                    color: sc.cardText ?? sc.headingColor,
                    fontSize: "2.4rem",
                    margin: "6px 0",
                  }}
                >
                  {display.names}
                </p>

                {display.dateText && (
                  <p
                    className="text-lg font-semibold"
                    style={{ color: sc.accent, margin: 0, letterSpacing: "0.04em" }}
                  >
                    {display.dateText}
                  </p>
                )}

                {display.location && (
                  <p className="text-sm" style={{ color: sc.cardText ?? sc.bodyText, opacity: 0.85, margin: 0 }}>
                    {display.location}
                  </p>
                )}

                <div className="w-10 h-px my-1" style={{ backgroundColor: `${sc.accent}60` }} />

                <p
                  className="text-sm italic leading-relaxed"
                  style={{ color: sc.cardText ?? sc.bodyText, opacity: 0.9, margin: 0 }}
                >
                  {display.message}
                </p>

                {display.inviteLine && (
                  <p
                    className="text-sm font-semibold leading-relaxed"
                    style={{ color: sc.cardText ?? sc.headingColor, margin: 0 }}
                  >
                    {display.inviteLine}
                  </p>
                )}

                {display.timeText && (
                  <p
                    className="text-sm font-semibold"
                    style={{ color: sc.accent, margin: 0, letterSpacing: "0.03em" }}
                  >
                    {display.timeText}
                  </p>
                )}

                {/* Hartje als romantische afsluiter */}
                <svg
                  width="18"
                  height="16"
                  viewBox="0 0 24 22"
                  fill={sc.accent}
                  aria-hidden="true"
                  style={{ marginTop: 4, opacity: 0.9 }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>

            {/* Demo op de marketingsite: CTA in plaats van site-knoppen */}
            {stage === "open" && demo && (
              <a
                href="/kaart-maken?type=trouwkaart"
                className="mt-6 block py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: sc.accent,
                  color: sc.buttonText,
                  textDecoration: "none",
                  animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both",
                }}
              >
                Zelf zo&apos;n kaart maken? Begin gratis →
              </a>
            )}

            {/* Site hoort bij het pakket maar staat nog niet live: vooruitblik */}
            {stage === "open" && siteVolgt && !demo && (
              <p
                className="mt-6 text-center text-sm"
                style={{
                  color: sc.bodyText,
                  opacity: 0.7,
                  animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both",
                }}
              >
                Meer informatie volgt binnenkort 🤍
              </p>
            )}

            {/* Knoppen naar de trouwsite */}
            {stage === "open" && (siteUrl || rsvpUrl) && (
              <div
                className="mt-6 flex flex-col sm:flex-row gap-3"
                style={{ animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both" }}
              >
                {rsvpUrl && (
                  <a
                    href={rsvpUrl}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                    style={{ backgroundColor: sc.accent, color: sc.buttonText, textDecoration: "none" }}
                  >
                    Laat weten of je erbij bent
                  </a>
                )}
                {siteUrl && (
                  <a
                    href={siteUrl}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                    style={{
                      backgroundColor: "transparent",
                      color: sc.headingColor,
                      border: `1.5px solid ${sc.accent}`,
                      textDecoration: "none",
                    }}
                  >
                    Bekijk onze trouwsite
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Groeimotor */}
      {stage === "open" && (
        <a
          href="https://www.sayingyes.nl"
          className="mt-10 text-xs"
          style={{
            color: sc.bodyText,
            opacity: 0.55,
            textDecoration: "none",
            animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.8s both",
          }}
        >
          Gemaakt met <span style={{ fontWeight: 600, color: sc.accent }}>SayingYes</span> · sayingyes.nl
        </a>
      )}
    </div>
  )
}
