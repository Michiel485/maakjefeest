// De envelop op de homepage, maar dan zoals een gast hem echt krijgt: als
// berichtje in WhatsApp, met de link en de voorvertoning van de kaart, en
// daaronder wat er gebeurt als je op die link tikt (Michiel, 23 oktober 2026).
// Zo ziet een bezoeker in één oogopslag wat zijn gasten op hun telefoon
// krijgen, en hoe simpel dat is.

import type { ReactNode } from "react"
import KaartVoorkant from "@/components/kaart/KaartVoorkant"
import { browserLetters } from "@/lib/kaart-ontwerpen"
import { formatDate } from "@/lib/event-styles"
import type { SC } from "@/lib/event-styles"
import { VOORBEELD, voorbeeldKaart } from "@/lib/voorbeeld"
import { GOUD, INKT, TEKST } from "./stijl"

// De kleuren van WhatsApp zelf, zodat het meteen herkenbaar is
const CHAT_ACHTERGROND = "#EFE7DD"
const BUBBEL = "#FFFFFF"
const GROEN = "#25D366"

export default function WhatsAppVenster({ sc, children }: { sc: SC; children: ReactNode }) {
  const datum = formatDate(VOORBEELD.datum)
  return (
    <div style={{ backgroundColor: CHAT_ACHTERGROND, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      {/* De balk bovenin: met wie je appt */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#F6F6F6", borderBottom: "1px solid #E0DCD5" }}>
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: GOUD, color: "#fff", letterSpacing: "0.02em" }}>
          {VOORBEELD.initialen}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate" style={{ color: INKT }}>{VOORBEELD.namen}</span>
          <span className="text-[11px]" style={{ color: "#6B7280" }}>online</span>
        </span>
        <span className="ml-auto flex items-center gap-4" aria-hidden="true" style={{ color: "#9CA3AF" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="7" width="13" height="10" rx="2" /><path d="M16 10.5 21 8v8l-5-2.5" /></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
        </span>
      </div>

      {/* Het berichtje van het bruidspaar, met de voorvertoning van de link */}
      <div className="px-4 pt-4 pb-3">
        <p className="m-0 mb-3 text-center text-[11px]" style={{ color: "#6B7280" }}>
          <span className="inline-block rounded-md px-2 py-0.5" style={{ backgroundColor: "#E1DBD2" }}>vandaag</span>
        </p>
        <div className="relative max-w-[320px] rounded-xl rounded-tl-sm p-2 shadow-sm" style={{ backgroundColor: BUBBEL }}>
          {/* De voorvertoning: zo laat WhatsApp een link zien */}
          <div className="flex gap-3 rounded-lg p-2" style={{ backgroundColor: "#F3F1EC" }}>
            <div className="shrink-0 overflow-hidden rounded-md" style={{ width: 56 }}>
              <KaartVoorkant d={voorbeeldKaart()} ontwerp={VOORBEELD.ontwerp} sc={sc} breedte={56} letters={browserLetters(VOORBEELD.ontwerp)} />
            </div>
            <div className="min-w-0 flex flex-col justify-center gap-0.5">
              <span className="text-[13px] font-semibold leading-tight truncate" style={{ color: INKT }}>{VOORBEELD.namen} gaan trouwen</span>
              <span className="text-[12px] leading-snug" style={{ color: TEKST }}>{datum}. Open de envelop en laat weten of je erbij bent.</span>
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>sayingyes.nl</span>
            </div>
          </div>
          <p className="m-0 mt-2 px-1 text-[14px] leading-snug" style={{ color: INKT }}>
            Hoi oma! We gaan trouwen 🎉 Open de envelop maar:{" "}
            <span style={{ color: "#027EB5", textDecoration: "underline" }}>sayingyes.nl/kaart/sophie-en-daan</span>
          </p>
          <p className="m-0 mt-1 px-1 text-right text-[10px]" style={{ color: "#9CA3AF" }}>
            11:02 <span style={{ color: "#53BDEB" }}>&#10003;&#10003;</span>
          </p>
        </div>
      </div>

      {/* Wat er gebeurt als je op de link tikt */}
      <div className="flex items-center gap-3 px-4 pb-2">
        <span className="h-px flex-1" style={{ backgroundColor: "#D9D3C9" }} />
        <span className="text-[11px] font-semibold uppercase" style={{ color: TEKST, letterSpacing: "0.14em" }}>
          <span style={{ color: GROEN }}>&#9679;</span>&nbsp; tik op de link
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: "#D9D3C9" }} />
      </div>
      {children}
    </div>
  )
}
