"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KLEUR } from "@/lib/ontwerp"
import {
  CARD_TYPE_LABEL,
  CARD_TYPE_PLAN,
  GUEST_TYPE_LABEL,
  CARD_TAAL_KORT,
  MAX_KAARTEN_PER_EVENT,
  cardTaal,
  type CardContent,
  type CardGuestType,
  type CardRow,
  type CardType,
} from "@/lib/cards"
import { PLANS, PLAN_ORDER, planRank, upgradePrice, formatEur } from "@/lib/plans"
import type { KaartRegel } from "./Tegels"

// De kaarten in een tegel, zoals een lijst bestanden: je kiest er een, en de
// knoppen eronder gaan over die ene kaart.
//
// Michiels wensen van 23 september 2026: een regel licht op als je eroverheen
// gaat, je selecteert er een, "Verder ontwerpen" is grijs tot je gekozen hebt,
// dubbelklikken op de naam is hernoemen, en naast verder ontwerpen komen
// verwijderen en de link voor je gasten. Die laatste is het lokkertje: staat
// de kaart nog niet geactiveerd, dan legt een venster uit wat activeren kost
// en wat je ervoor krijgt, met de betaalknop erbij.
//
// De lijst houdt zijn eigen staat bij, zodat hernoemen en verwijderen meteen
// te zien zijn; het dashboard haalt op de achtergrond de echte stand op.

function Vinkje() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={KLEUR.groen} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function kaartNaam(card: CardRow): string {
  const eigen = card.content.naam?.trim()
  if (eigen) return eigen
  const groep = card.content.guestType ? GUEST_TYPE_LABEL[card.content.guestType as CardGuestType] : "Alle gasten"
  const taal = cardTaal(card.content.taal)
  return taal === "nl" ? groep : `${groep} · ${CARD_TAAL_KORT[taal]}`
}

export default function KaartLijst({
  regels: regelsVanServer,
  eventId,
  soort,
  live,
  prijs,
}: {
  regels: KaartRegel[]
  eventId: string | null
  soort: CardType
  /** Werkt de link al voor gasten, dus is het pakket betaald? */
  live: boolean
  /** Wat activeren kost, bijvoorbeeld "€15". */
  prijs: string
}) {
  const router = useRouter()
  const [regels, setRegels] = useState(regelsVanServer)
  // Eén kaart? Dan is die gekozen; met meer kies je zelf.
  const [gekozenId, setGekozenId] = useState<string | null>(regelsVanServer.length === 1 ? regelsVanServer[0].card.id : null)
  const [hernoemId, setHernoemId] = useState<string | null>(null)
  const [naamInvoer, setNaamInvoer] = useState("")
  const [venster, setVenster] = useState<null | "delen" | "activeren">(null)
  const [verwijderVraag, setVerwijderVraag] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [gekopieerd, setGekopieerd] = useState(false)

  // Komt er een nieuwe lijst van de server, dan is die de waarheid.
  const [vorige, setVorige] = useState(regelsVanServer)
  if (regelsVanServer !== vorige) {
    setVorige(regelsVanServer)
    setRegels(regelsVanServer)
  }

  useEffect(() => {
    if (!venster) return
    function toets(e: KeyboardEvent) {
      if (e.key === "Escape") setVenster(null)
    }
    document.addEventListener("keydown", toets)
    return () => document.removeEventListener("keydown", toets)
  }, [venster])

  const gekozen = regels.find((r) => r.card.id === gekozenId) ?? null
  const bouwerNieuw = eventId ? `/kaart-maken?event_id=${eventId}&type=${soort}` : `/kaart-maken?type=${soort}`
  const bouwerVoor = (c: CardRow) => `/kaart-maken?event_id=${eventId ?? c.event_id}&card_id=${c.id}&type=${c.type}`
  const betalen = `/betalen?event_id=${eventId ?? gekozen?.card.event_id ?? ""}&plan=${CARD_TYPE_PLAN[soort]}`
  // Wat je later bijbetaalt als je alsnog een groter pakket kiest: het
  // verschil, dus dit bedrag is dan korting. Uit lib/plans, de enige bron.
  const ditPlan = CARD_TYPE_PLAN[soort]
  const laterBij = PLAN_ORDER.filter((p) => planRank(p) > planRank(ditPlan)).map((p) => ({
    label: PLANS[p].label,
    bij: upgradePrice(ditPlan, p),
  }))
  // Wat er gratis bij zit: de kleinere pakketten. Bij de trouwkaart is dat de
  // Save the Date.
  const zitErbij = PLAN_ORDER.filter((p) => planRank(p) < planRank(ditPlan)).map((p) => PLANS[p].label)
  const kaartUrl = (c: CardRow) =>
    typeof window !== "undefined" ? `${window.location.origin}/kaart/${c.share_token}` : `/kaart/${c.share_token}`

  function kies(id: string) {
    setGekozenId(id)
    setVerwijderVraag(false)
    setFout(null)
  }

  function beginHernoemen(r: KaartRegel) {
    setGekozenId(r.card.id)
    setHernoemId(r.card.id)
    setNaamInvoer(r.card.content.naam ?? "")
  }

  async function bewaarNaam(r: KaartRegel) {
    const naam = naamInvoer.trim()
    setHernoemId(null)
    if ((r.card.content.naam ?? "") === naam) return
    // Meteen laten zien, dan pas de server.
    setRegels((v) =>
      v.map((x) => (x.card.id === r.card.id ? { ...x, card: { ...x.card, content: { ...x.card.content, naam: naam || undefined } } } : x)),
    )
    try {
      // De hele inhoud terugsturen: de server bewaart wat hij krijgt.
      const content: CardContent = { ...r.card.content, naam: naam || undefined }
      const res = await fetch(`/api/cards/${r.card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setFout("De naam bewaren lukte niet, probeer het nog eens.")
      setRegels(regelsVanServer)
    }
  }

  async function verwijder() {
    if (!gekozen) return
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch(`/api/cards/${gekozen.card.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const rest = regels.filter((x) => x.card.id !== gekozen.card.id)
      setRegels(rest)
      setGekozenId(rest.length === 1 ? rest[0].card.id : null)
      setVerwijderVraag(false)
      router.refresh()
    } catch {
      setFout("Verwijderen lukte niet, probeer het nog eens.")
    } finally {
      setBezig(false)
    }
  }

  function kopieer(c: CardRow) {
    navigator.clipboard.writeText(kaartUrl(c)).then(
      () => {
        setGekopieerd(true)
        setTimeout(() => setGekopieerd(false), 2000)
      },
      () => setFout("Kopiëren lukte niet. Selecteer de link en kopieer hem met de hand."),
    )
  }

  const knop = "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold min-h-[36px] transition-opacity"
  const uit: React.CSSProperties = { opacity: 0.4, pointerEvents: "none" }

  return (
    /* flex-1, zodat mt-auto op de knoppenrij ze onderaan de tegel zet en de
       knoppen van twee tegels naast elkaar op één lijn staan. */
    <div className="flex flex-col gap-3 flex-1">
      {/* ── De regels ── */}
      <div role="listbox" aria-label={`Je ${CARD_TYPE_LABEL[soort].toLowerCase()}s`} className="flex flex-col rounded-xl" style={{ border: `1px solid ${KLEUR.zand}` }}>
        {regels.map((r, i) => {
          const aan = r.card.id === gekozenId
          return (
            <div
              key={r.card.id}
              role="option"
              aria-selected={aan}
              tabIndex={0}
              onClick={() => kies(r.card.id)}
              onDoubleClick={() => beginHernoemen(r)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  kies(r.card.id)
                }
                if (e.key === "F2") beginHernoemen(r)
              }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px] transition-colors cursor-pointer select-none outline-none focus-visible:ring-2"
              style={{
                borderTop: i === 0 ? undefined : `1px solid ${KLEUR.zand}`,
                backgroundColor: aan ? KLEUR.goudVlak : undefined,
                boxShadow: aan ? `inset 3px 0 0 ${KLEUR.goud}` : undefined,
                borderRadius: i === 0 ? "11px 11px 0 0" : i === regels.length - 1 ? "0 0 11px 11px" : undefined,
              }}
              onMouseEnter={(e) => { if (!aan) e.currentTarget.style.backgroundColor = "#FCF9F2" }}
              onMouseLeave={(e) => { if (!aan) e.currentTarget.style.backgroundColor = "" }}
            >
              {hernoemId === r.card.id ? (
                <input
                  autoFocus
                  value={naamInvoer}
                  onChange={(e) => setNaamInvoer(e.target.value)}
                  onBlur={() => void bewaarNaam(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void bewaarNaam(r)
                    if (e.key === "Escape") setHernoemId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={kaartNaam({ ...r.card, content: { ...r.card.content, naam: undefined } })}
                  maxLength={60}
                  aria-label="Naam van deze kaart"
                  className="flex-1 min-w-[120px] rounded-lg border bg-white px-2 py-1 text-[13px] font-medium focus:outline-none"
                  style={{ borderColor: KLEUR.goud, color: KLEUR.inkt }}
                />
              ) : (
                <span
                  className="font-medium flex-1 min-w-[120px] truncate"
                  style={{ color: KLEUR.inkt }}
                  title="Dubbelklik om de naam te wijzigen"
                >
                  {kaartNaam(r.card)}
                </span>
              )}
              <span className="tabular-nums" style={{ color: KLEUR.zacht }}>
                {r.komen + r.komenNiet === 0
                  ? "nog geen antwoorden"
                  : <>
                      <b style={{ color: KLEUR.groen, fontWeight: 600 }}>{r.komen} {r.komen === 1 ? "komt" : "komen"}</b>
                      {r.kinderen > 0 && ` (waarvan ${r.kinderen} ${r.kinderen === 1 ? "kind" : "kinderen"})`}
                      {" · "}{r.komenNiet} {r.komenNiet === 1 ? "komt" : "komen"} niet
                    </>}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── De knoppen, over de gekozen kaart ── */}
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={() => setVenster(live ? "delen" : "activeren")}
          className={knop}
          style={{ backgroundColor: KLEUR.groen, color: "#fff", border: `1px solid ${KLEUR.groen}`, cursor: "pointer", ...(gekozen ? {} : uit) }}
          aria-disabled={!gekozen}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Link voor je gasten
        </button>
        <Link
          href={gekozen ? bouwerVoor(gekozen.card) : bouwerNieuw}
          className={knop}
          style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, textDecoration: "none", ...(gekozen ? {} : uit) }}
          aria-disabled={!gekozen}
        >
          Verder ontwerpen
        </Link>
        <button
          type="button"
          onClick={() => setVerwijderVraag(true)}
          className={knop}
          style={{ backgroundColor: "transparent", color: "#991B1B", border: `1px solid ${KLEUR.zand}`, cursor: "pointer", ...(gekozen ? {} : uit) }}
          aria-disabled={!gekozen}
        >
          Verwijderen
        </button>
        <Link
          href={bouwerNieuw}
          className={`${knop} ml-auto`}
          style={{ backgroundColor: "transparent", color: KLEUR.tekst, border: `1px solid ${KLEUR.zand}`, textDecoration: "none" }}
          title="Een tweede kaart, bijvoorbeeld voor je avondgasten of in een andere taal. Zit in de prijs."
        >
          + Nieuwe kaart
        </Link>
      </div>


      {verwijderVraag && gekozen && (
        <div className="rounded-xl p-3 flex flex-wrap items-center gap-2 text-[13px]" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <span style={{ color: "#991B1B" }} className="flex-1 min-w-[200px]">
            <b>{kaartNaam(gekozen.card)}</b> weggooien? De link werkt daarna niet meer, ook niet voor wie hem al heeft.
            {gekozen.komen + gekozen.komenNiet > 0 && (
              <> De antwoorden van de {gekozen.komen + gekozen.komenNiet} gasten die reageerden blijven gewoon in je gastenlijst staan.</>
            )}
          </span>
          <button type="button" onClick={() => void verwijder()} disabled={bezig} className={knop} style={{ backgroundColor: "#991B1B", color: "#fff", border: 0, cursor: "pointer" }}>
            {bezig ? "Bezig…" : "Ja, weggooien"}
          </button>
          <button type="button" onClick={() => setVerwijderVraag(false)} className={knop} style={{ background: "none", color: KLEUR.zacht, border: 0, cursor: "pointer" }}>
            Laat maar
          </button>
        </div>
      )}

      {fout && (
        <p className="m-0 text-[13px] font-semibold" style={{ color: "#991B1B" }}>{fout}</p>
      )}

      {/* ── Het venster: delen, of eerst activeren ──
          Via een portal buiten de tegel. De tegel verschuift een pixel als je
          eroverheen gaat, en een verschuiving maakt van "fixed" iets dat aan
          de tegel hangt: het venster sprong dan heen en weer zodra je muis
          van het venster af ging (Michiels bevinding van 23 september 2026). */}
      {venster && gekozen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setVenster(null)}
          role="dialog"
          aria-modal="true"
          aria-label={venster === "delen" ? "Deel je kaart" : "Eerst activeren"}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 sm:p-7 flex flex-col gap-4"
            style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.goudLicht}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {venster === "delen" ? (
              <>
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: KLEUR.goud }}>Delen</p>
                  <h3 className="m-0 mt-1" style={{ fontFamily: "var(--font-cormorant)", fontSize: 26, fontWeight: 600, color: KLEUR.inkt }}>
                    {kaartNaam(gekozen.card)}
                  </h3>
                  <p className="m-0 mt-1 text-sm" style={{ color: KLEUR.tekst }}>
                    Dit is de link voor je gasten. Elke kaart heeft zijn eigen link, en in je gastenlijst zie je wie welke kreeg.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={kaartUrl(gekozen.card)}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 rounded-xl border px-3 py-2 text-sm font-mono"
                    style={{ borderColor: KLEUR.goudLicht, color: KLEUR.inkt, backgroundColor: KLEUR.ivoor }}
                  />
                  <button type="button" onClick={() => kopieer(gekozen.card)} className={knop} style={{ backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: 0, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {gekopieerd ? "Gekopieerd" : "Kopieer"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Er is post voor je 💌 ${kaartUrl(gekozen.card)}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={knop}
                    style={{ backgroundColor: "#DCF8C6", color: "#075E54", border: "1px solid #B8E0A8", textDecoration: "none" }}
                  >
                    Via WhatsApp
                  </a>
                  <a href={`/kaart/${gekozen.card.share_token}/voorbeeld`} target="_blank" rel="noopener noreferrer" className={knop} style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, textDecoration: "none" }}>
                    Bekijk als gast
                  </a>
                  <a href={`/api/cards/qr?token=${gekozen.card.share_token}`} className={knop} style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, textDecoration: "none" }} title="Voor op je papieren kaart: de gast scant en komt op deze digitale kaart">
                    QR-code (png)
                  </a>
                  <a href={`/api/cards/qr?token=${gekozen.card.share_token}&vorm=svg`} className={knop} style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, textDecoration: "none" }} title="Dezelfde code als vector, voor je drukker">
                    QR-code (svg)
                  </a>
                  <a href={`/kaart/${gekozen.card.share_token}/afbeelding`} className={`${knop} col-span-2`} style={{ backgroundColor: "transparent", color: KLEUR.tekst, border: `1px solid ${KLEUR.zand}`, textDecoration: "none" }}>
                    Afbeelding downloaden
                  </a>
                </div>
                <button type="button" onClick={() => setVenster(null)} className="text-sm underline self-center" style={{ color: KLEUR.zacht, background: "none", border: 0, cursor: "pointer" }}>
                  Sluiten
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: KLEUR.goud }}>Bijna</p>
                  <h3 className="m-0 mt-1" style={{ fontFamily: "var(--font-cormorant)", fontSize: 26, fontWeight: 600, color: KLEUR.inkt }}>
                    Eerst activeren, dan delen
                  </h3>
                </div>
                <p className="m-0 text-sm leading-relaxed" style={{ color: KLEUR.tekst }}>
                  Voor <b style={{ color: KLEUR.inkt }}>{prijs}</b> activeer je je {CARD_TYPE_LABEL[soort]}. Daarna werkt de link voor je
                  gasten, krijg je een QR-code voor op papier, en vult je gastenlijst zich met wie antwoordt.
                </p>
                {/* De drie dingen die de drempel wegnemen. Michiel, 23 september
                    2026: aanpassen kan altijd, ook na het versturen, en wat je
                    nu betaalt is later korting. Dat hoort hier nadrukkelijk. */}
                <ul className="m-0 p-0 list-none flex flex-col gap-2.5 rounded-xl px-3.5 py-3 text-sm leading-relaxed" style={{ color: KLEUR.tekst, backgroundColor: KLEUR.goudVlak, border: `1px solid ${KLEUR.goudLicht}` }}>
                  <li className="flex gap-2.5">
                    <Vinkje />
                    <span>
                      {zitErbij.length > 0 ? (
                        <>
                          <b style={{ color: KLEUR.inkt }}>De {zitErbij.join(" en de ")} en de gastenlijst zitten erbij.</b> Activeer je
                          de {CARD_TYPE_LABEL[soort].toLowerCase()}, dan verstuur je ook een {zitErbij.join(" en een ")} zonder bij te
                          betalen, en wie antwoordt staat meteen in je gastenlijst.
                        </>
                      ) : (
                        <>
                          <b style={{ color: KLEUR.inkt }}>De gastenlijst zit erbij.</b> Wie antwoordt staat meteen in je lijst, en je
                          ziet wie nog stil is.
                        </>
                      )}
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <Vinkje />
                    <span>
                      <b style={{ color: KLEUR.inkt }}>Aanpassen kan altijd, ook na het versturen.</b> Wijzig je iets, dan zien
                      je gasten de nieuwe kaart zodra ze de link opnieuw openen. Je stuurt dus nooit iets fout de wereld in.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <Vinkje />
                    <span>
                      <b style={{ color: KLEUR.inkt }}>Meerdere kaarten zitten in de prijs.</b> Binnen deze bruiloft maak je tot{" "}
                      {MAX_KAARTEN_PER_EVENT} kaarten: voor je daggasten en je avondgasten, of dezelfde kaart in een andere taal.
                      Elke kaart krijgt zijn eigen link.
                    </span>
                  </li>
                  {laterBij.length > 0 && (
                    <li className="flex gap-2.5">
                      <Vinkje />
                      <span>
                        <b style={{ color: KLEUR.inkt }}>Dit bedrag is later korting.</b> Kies je alsnog{" "}
                        {laterBij.map((l, i) => (
                          <span key={l.label}>
                            {i > 0 ? (i === laterBij.length - 1 ? " of " : ", ") : ""}
                            de {l.label} ({l.bij != null ? `${formatEur(l.bij).replace(",00", "")} bijbetalen` : ""})
                          </span>
                        ))}
                        , dan betaal je alleen het verschil.
                      </span>
                    </li>
                  )}
                </ul>
                <div className="flex flex-col gap-2">
                  <Link href={betalen} className={knop} style={{ backgroundColor: KLEUR.groen, color: "#fff", border: `1px solid ${KLEUR.groen}`, textDecoration: "none", minHeight: 44 }}>
                    Activeer voor {prijs}
                  </Link>
                  <a href={`/kaart/${gekozen.card.share_token}/voorbeeld`} target="_blank" rel="noopener noreferrer" className={knop} style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, textDecoration: "none" }}>
                    Eerst bekijken zoals je gast hem ziet
                  </a>
                  <button type="button" onClick={() => setVenster(null)} className="text-sm underline self-center mt-1" style={{ color: KLEUR.zacht, background: "none", border: 0, cursor: "pointer" }}>
                    Laat maar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
