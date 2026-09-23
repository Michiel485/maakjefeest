"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KLEUR } from "@/lib/ontwerp"
import { CARD_TYPE_PLAN, type CardContent, type CardRow } from "@/lib/cards"
import ActieMenu, { ActieFout, ActieItem, ActieScheiding, ActieUitleg, ActieVeld } from "./ActieMenu"

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
  onHernoemd,
  onVerwijderd,
}: {
  card: CardRow
  eventId: string | null
  /** Is het pakket van deze kaart betaald, dus werkt de link voor gasten? */
  live: boolean
  /** Hoe de kaart nu heet, voor het naamveld in het menu. */
  naam: string
  /** Meteen laten zien, nog voordat de server de nieuwe stand heeft. */
  onHernoemd?: (naam: string) => void
  onVerwijderd?: () => void
}) {
  const router = useRouter()
  const [hernoemen, setHernoemen] = useState(false)
  const [nieuweNaam, setNieuweNaam] = useState(naam)
  const [weetJeHetZeker, setWeetJeHetZeker] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

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

  async function bewaarNaam(sluit: () => void) {
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
      setHernoemen(false)
      sluit()
      onHernoemd?.(nieuweNaam.trim())
      router.refresh()
    } catch {
      setFout("Bewaren lukte niet, probeer het nog eens.")
    } finally {
      setBezig(false)
    }
  }

  async function verwijder(sluit: () => void) {
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setWeetJeHetZeker(false)
      sluit()
      onVerwijderd?.()
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
    <ActieMenu>
      {(sluit) => (
        <>
          <ActieItem href={bouwer}>Verder bewerken</ActieItem>
          <ActieItem href={`/kaart/${card.share_token}/voorbeeld`} nieuwTabblad>
            Bekijken zoals je gast hem ziet
          </ActieItem>
          <ActieItem href={`/kaart/${card.share_token}/afbeelding`}>
            {live ? "Afbeelding downloaden" : "Voorbeeld downloaden"}
          </ActieItem>

          <ActieScheiding />

          {live ? (
            <>
              <ActieItem onClick={kopieerLink}>{gekopieerd ? "Link gekopieerd" : "Link kopiëren"}</ActieItem>
              <ActieItem
                href={`https://wa.me/?text=${encodeURIComponent(`Er is post voor je 💌 ${kaartUrl}`)}`}
                nieuwTabblad
              >
                Versturen via WhatsApp
              </ActieItem>
              <ActieItem href={`/api/cards/qr?token=${card.share_token}`}>QR-code downloaden</ActieItem>
              <ActieItem href={`/api/cards/qr?token=${card.share_token}&vorm=svg`}>
                QR-code als svg, voor je drukker
              </ActieItem>
            </>
          ) : (
            <>
              <ActieItem href={betalen} nadruk>
                Activeren en versturen
              </ActieItem>
              <ActieUitleg>De link, WhatsApp en de QR-code komen vrij zodra deze kaart geactiveerd is.</ActieUitleg>
            </>
          )}

          <ActieScheiding />

          {hernoemen ? (
            <ActieVeld
              waarde={nieuweNaam}
              opWaarde={setNieuweNaam}
              placeholder="Daggasten Nederlands"
              bewaar={() => void bewaarNaam(sluit)}
              annuleer={() => setHernoemen(false)}
              bezig={bezig}
            />
          ) : (
            <ActieItem onClick={() => setHernoemen(true)}>Naam van deze kaart wijzigen</ActieItem>
          )}

          {weetJeHetZeker ? (
            <div className="p-3 flex flex-col gap-2" style={{ backgroundColor: "#FEF2F2" }}>
              <p className="m-0 text-[12px] leading-snug" style={{ color: "#991B1B" }}>
                Weg is weg. De link werkt daarna niet meer, ook niet voor gasten die hem al hebben.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void verwijder(sluit)}
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
            <ActieItem onClick={() => setWeetJeHetZeker(true)} rood>
              Verwijderen
            </ActieItem>
          )}

          {fout && <ActieFout>{fout}</ActieFout>}
        </>
      )}
    </ActieMenu>
  )
}
