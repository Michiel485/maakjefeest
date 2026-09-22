"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { KLEUR } from "@/lib/ontwerp"
import { CARD_TYPE_PLAN, type CardContent, type CardRow } from "@/lib/cards"

// Alles wat je met één kaart kunt doen, achter één knop op de regel zelf.
//
// Michiels wens van 22 september 2026: "ik wil in dat stukje alles kunnen
// doen". Hieronder zat een tweede blok ("Je kaarten delen") met dezelfde
// kaarten en een rij losse knoppen. Twee plekken voor dezelfde kaart is
// precies waarom het dashboard rommelig werd, dus die knoppen staan nu hier
// en dat blok is weg.
//
// Wat er in het menu staat hangt af van of de kaart geactiveerd is: een link
// kopiëren of een QR-code laten drukken heeft geen zin zolang je gasten een
// watermerk zouden zien.

export default function KaartActies({
  card,
  eventId,
  live,
  naam,
}: {
  card: CardRow
  eventId: string | null
  /** Is het pakket van deze kaart betaald, dus werkt de link voor gasten? */
  live: boolean
  /** Hoe de kaart nu heet, voor het naamveld in het menu. */
  naam: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [hernoemen, setHernoemen] = useState(false)
  const [nieuweNaam, setNieuweNaam] = useState(naam)
  const [weetJeHetZeker, setWeetJeHetZeker] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const wrap = useRef<HTMLDivElement>(null)

  // Buiten het menu klikken sluit het, net als Escape. Zonder dit blijft er
  // een open paneel achter zodra je verderop in het dashboard iets aanraakt.
  useEffect(() => {
    if (!open) return
    function buiten(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false)
        setHernoemen(false)
        setWeetJeHetZeker(false)
        setFout(null)
      }
    }
    function toets(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", buiten)
    document.addEventListener("keydown", toets)
    return () => {
      document.removeEventListener("mousedown", buiten)
      document.removeEventListener("keydown", toets)
    }
  }, [open])

  function sluit() {
    setOpen(false)
    setHernoemen(false)
    setWeetJeHetZeker(false)
    setFout(null)
  }

  const kaartUrl =
    typeof window !== "undefined" ? `${window.location.origin}/kaart/${card.share_token}` : ""

  function kopieerLink() {
    navigator.clipboard.writeText(kaartUrl).then(
      () => {
        setGekopieerd(true)
        setTimeout(() => setGekopieerd(false), 2000)
      },
      () => setFout("Kopiëren lukte niet. Open de kaart en kopieer de link uit de adresbalk."),
    )
  }

  async function bewaarNaam() {
    setBezig(true)
    setFout(null)
    try {
      // De hele inhoud terugsturen: de server bewaart wat hij krijgt, dus
      // alleen de naam sturen zou de rest van de kaart wissen.
      const content: CardContent = { ...card.content, naam: nieuweNaam.trim() || undefined }
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error()
      sluit()
      router.refresh()
    } catch {
      setFout("Bewaren lukte niet, probeer het nog eens.")
    } finally {
      setBezig(false)
    }
  }

  async function verwijder() {
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      sluit()
      router.refresh()
    } catch {
      setFout("Verwijderen lukte niet, probeer het nog eens.")
    } finally {
      setBezig(false)
    }
  }

  const bouwer = `/kaart-maken?event_id=${eventId ?? card.event_id}&card_id=${card.id}&type=${card.type}`
  const betalen = `/betalen?event_id=${eventId ?? card.event_id}&plan=${CARD_TYPE_PLAN[card.type]}`

  return (
    <div className="relative ml-auto" ref={wrap}>
      <button
        type="button"
        onClick={() => (open ? sluit() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-[13px] font-semibold px-2.5 py-1 rounded-lg"
        style={{
          color: KLEUR.inkt,
          backgroundColor: open ? KLEUR.goudVlak : "transparent",
          border: `1px solid ${KLEUR.zand}`,
          cursor: "pointer",
        }}
      >
        Acties <span aria-hidden style={{ color: KLEUR.zacht }}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-60 rounded-xl overflow-hidden shadow-lg"
          style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.goudLicht}` }}
        >
          <Item href={bouwer}>Verder bewerken</Item>
          <Item href={`/kaart/${card.share_token}/voorbeeld`} nieuwTabblad>
            Bekijken zoals je gast hem ziet
          </Item>
          <Item href={`/kaart/${card.share_token}/afbeelding`}>
            {live ? "Afbeelding downloaden" : "Voorbeeld downloaden"}
          </Item>

          <Scheiding />

          {live ? (
            <>
              <Item onClick={kopieerLink}>{gekopieerd ? "Link gekopieerd" : "Link kopiëren"}</Item>
              <Item
                href={`https://wa.me/?text=${encodeURIComponent(`Er is post voor je 💌 ${kaartUrl}`)}`}
                nieuwTabblad
              >
                Versturen via WhatsApp
              </Item>
              <Item href={`/api/cards/qr?token=${card.share_token}`}>QR-code downloaden</Item>
              <Item href={`/api/cards/qr?token=${card.share_token}&vorm=svg`}>
                QR-code als svg, voor je drukker
              </Item>
            </>
          ) : (
            <>
              <Item href={betalen} nadruk>
                Activeren en versturen
              </Item>
              <p className="m-0 px-3 pb-2 text-[11px] leading-snug" style={{ color: KLEUR.zacht }}>
                De link, WhatsApp en de QR-code komen vrij zodra deze kaart geactiveerd is.
              </p>
            </>
          )}

          <Scheiding />

          {hernoemen ? (
            <div className="p-3 flex flex-col gap-2">
              <input
                autoFocus
                value={nieuweNaam}
                onChange={(e) => setNieuweNaam(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void bewaarNaam()
                }}
                placeholder="Daggasten Nederlands"
                maxLength={60}
                className="w-full rounded-lg border px-2.5 py-2 text-[13px] focus:outline-none"
                style={{ borderColor: KLEUR.goudLicht, color: KLEUR.inkt }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void bewaarNaam()}
                  disabled={bezig}
                  className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: 0, cursor: "pointer" }}
                >
                  {bezig ? "Bewaren…" : "Bewaren"}
                </button>
                <button
                  type="button"
                  onClick={() => setHernoemen(false)}
                  className="text-[13px] px-2 py-1.5 rounded-lg"
                  style={{ color: KLEUR.zacht, background: "none", border: 0, cursor: "pointer" }}
                >
                  Laat maar
                </button>
              </div>
            </div>
          ) : (
            <Item onClick={() => setHernoemen(true)}>Naam van deze kaart wijzigen</Item>
          )}

          {weetJeHetZeker ? (
            <div className="p-3 flex flex-col gap-2" style={{ backgroundColor: "#FEF2F2" }}>
              <p className="m-0 text-[12px] leading-snug" style={{ color: "#991B1B" }}>
                Weg is weg. De link werkt daarna niet meer, ook niet voor gasten die hem al hebben.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void verwijder()}
                  disabled={bezig}
                  className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#991B1B", color: "#fff", border: 0, cursor: "pointer" }}
                >
                  {bezig ? "Bezig…" : "Definitief verwijderen"}
                </button>
                <button
                  type="button"
                  onClick={() => setWeetJeHetZeker(false)}
                  className="text-[13px] px-2 py-1.5 rounded-lg"
                  style={{ color: KLEUR.zacht, background: "none", border: 0, cursor: "pointer" }}
                >
                  Laat maar
                </button>
              </div>
            </div>
          ) : (
            <Item onClick={() => setWeetJeHetZeker(true)} rood>
              Verwijderen
            </Item>
          )}

          {fout && (
            <p className="m-0 px-3 py-2 text-[12px] font-semibold" style={{ color: "#991B1B" }}>
              {fout}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Scheiding() {
  return <div style={{ borderTop: `1px solid ${KLEUR.zand}` }} />
}

function Item({
  children,
  href,
  onClick,
  nieuwTabblad,
  rood,
  nadruk,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  nieuwTabblad?: boolean
  rood?: boolean
  nadruk?: boolean
}) {
  const stijl: React.CSSProperties = {
    color: rood ? "#991B1B" : KLEUR.inkt,
    fontWeight: nadruk ? 700 : 500,
    textDecoration: "none",
    background: "none",
    border: 0,
    cursor: "pointer",
  }
  const cls = "block w-full text-left px-3 py-2 text-[13px] hover:bg-[#FBF5E8]"
  if (href) {
    return (
      <a
        href={href}
        role="menuitem"
        className={cls}
        style={stijl}
        {...(nieuwTabblad ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    )
  }
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cls} style={stijl}>
      {children}
    </button>
  )
}
