"use client"

import { useEffect, useState } from "react"
import {
  aanmeldStand,
  MAX_KIND_LEEFTIJD,
  type AanmeldStand,
} from "@/lib/gasten"

// Het aanmeldformulier, één keer geschreven voor de kaart én de trouwsite.
//
// Dat is geen luxe maar de opdracht: wat een gast op de trouwkaart invult en
// wat hij op de site invult moet identiek zijn. Twee bijna gelijke formulieren
// lopen binnen een maand uit elkaar, en dan staat er in de gastenlijst van het
// ene wel een allergie en van het andere niet.
//
// Twee standen. Bij "janee" vraagt hij alleen wie er komt en hoe je hem
// bereikt; dat hoort bij een Save the Date en moet in tien seconden te doen
// zijn, want dat is waarom mensen het invullen. Bij "volledig" komt de rest
// erbij. Dieetwensen achttien maanden vooraf zijn zinloos.

const LS_APPARAAT = "sayingyes_gast"

/** Een kenmerk per browser, zodat iemand zijn eigen antwoord kan bijwerken. */
function apparaatKenmerk(): string | null {
  try {
    let k = localStorage.getItem(LS_APPARAAT)
    if (!k) {
      k = crypto.randomUUID()
      localStorage.setItem(LS_APPARAAT, k)
    }
    return k
  } catch {
    // Zonder browseropslag telt elke inzending als nieuw. Niet erg, wel jammer.
    return null
  }
}

interface Persoon {
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
  dietary: string
  allergie: string
}

interface Kind {
  voornaam: string
  leeftijd: string
}

const leegPersoon = (): Persoon => ({
  voornaam: "", achternaam: "", email: "", telefoon: "", dietary: "", allergie: "",
})
const leegKind = (): Kind => ({ voornaam: "", leeftijd: "" })

export interface AanmeldFormulierProps {
  /** Eén van beide: de bruiloft, of de kaartlink waar dit onder staat. */
  eventId?: string
  bronToken?: string
  stand?: AanmeldStand
  accentColor?: string
  labelColor?: string
  knopTekstKleur?: string
  /** Vlakken en randen; op een kaart wil je lichter dan op een webpagina. */
  compact?: boolean
  deadline?: string | null
  guestTypes?: string[]
  showSongRequest?: boolean
  showOvernachting?: boolean
  customQuestion?: string | null
  customQuestion2?: string | null
}

export default function AanmeldFormulier({
  eventId,
  bronToken,
  stand: standIn = "volledig",
  accentColor = "#C5A059",
  labelColor = "#374151",
  knopTekstKleur = "#ffffff",
  compact = false,
  deadline = null,
  guestTypes = ["daggast"],
  showSongRequest = false,
  showOvernachting = false,
  customQuestion = null,
  customQuestion2 = null,
}: AanmeldFormulierProps) {
  const stand = aanmeldStand(standIn)
  const volledig = stand === "volledig"

  const [komt, setKomt] = useState<"yes" | "no" | null>(null)
  const [aantal, setAantal] = useState(1)
  const [personen, setPersonen] = useState<Persoon[]>([leegPersoon()])
  const [metKinderen, setMetKinderen] = useState(false)
  const [kinderen, setKinderen] = useState<Kind[]>([leegKind()])
  const [bericht, setBericht] = useState("")
  const [liedje, setLiedje] = useState("")
  const [overnachting, setOvernachting] = useState<boolean | null>(null)
  const [eigen1, setEigen1] = useState<boolean | null>(null)
  const [eigen2, setEigen2] = useState<boolean | null>(null)
  const [status, setStatus] = useState<"idle" | "bezig" | "klaar" | "fout">("idle")
  const [fout, setFout] = useState<string | null>(null)
  const [bijgewerkt, setBijgewerkt] = useState(false)

  const naDeadline = deadline ? new Date() > new Date(deadline) : false
  const heeftVraag1 = typeof customQuestion === "string" && customQuestion.trim().length > 0
  const heeftVraag2 = typeof customQuestion2 === "string" && customQuestion2.trim().length > 0

  useEffect(() => {
    setPersonen((vorig) =>
      aantal > vorig.length
        ? [...vorig, ...Array.from({ length: aantal - vorig.length }, leegPersoon)]
        : vorig.slice(0, aantal)
    )
  }, [aantal])

  function zetPersoon(i: number, veld: keyof Persoon, waarde: string) {
    setPersonen((v) => v.map((p, idx) => (idx === i ? { ...p, [veld]: waarde } : p)))
  }
  function zetKind(i: number, veld: keyof Kind, waarde: string) {
    setKinderen((v) => v.map((k, idx) => (idx === i ? { ...k, [veld]: waarde } : k)))
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    setFout(null)

    if (!komt) { setFout("Laat even weten of je erbij bent."); return }
    if (!personen[0].voornaam.trim()) { setFout("Vul je voornaam in."); return }

    setStatus("bezig")
    try {
      const hoofdEmail = personen[0].email.trim()
      const gasten =
        komt === "no"
          ? [{
              voornaam: personen[0].voornaam,
              achternaam: personen[0].achternaam,
              email: hoofdEmail || undefined,
              telefoon: personen[0].telefoon || undefined,
              is_primary: true,
              attending: "no",
              message: bericht || undefined,
            }]
          : [
              ...personen.map((p, i) => ({
                voornaam: p.voornaam,
                achternaam: p.achternaam,
                email: p.email.trim() || (i > 0 && hoofdEmail ? hoofdEmail : undefined),
                telefoon: p.telefoon.trim() || undefined,
                guest_type: guestTypes[0],
                is_primary: i === 0,
                attending: "yes",
                ...(volledig ? { dietary: p.dietary || undefined, allergie: p.allergie || undefined } : {}),
                ...(i === 0 ? { message: bericht || undefined } : {}),
                ...(i === 0 && volledig && showSongRequest && liedje ? { song: liedje } : {}),
                ...(i === 0 && volledig && showOvernachting && overnachting !== null ? { overnachting } : {}),
                ...(i === 0 && volledig && heeftVraag1 && eigen1 !== null ? { custom_answer: eigen1 } : {}),
                ...(i === 0 && volledig && heeftVraag2 && eigen2 !== null ? { custom_answer_2: eigen2 } : {}),
              })),
              // Kinderen apart, want die tellen anders bij de catering
              ...(metKinderen ? kinderen : [])
                .filter((k) => k.voornaam.trim())
                .map((k) => ({
                  voornaam: k.voornaam,
                  achternaam: personen[0].achternaam,
                  guest_type: guestTypes[0],
                  is_primary: false,
                  attending: "yes",
                  is_kind: true,
                  leeftijd: k.leeftijd ? Number(k.leeftijd) : null,
                })),
            ]

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(bronToken ? { bron_token: bronToken } : { event_id: eventId }),
          apparaat: apparaatKenmerk(),
          status: volledig ? "definitief" : "voorlopig",
          guests: gasten,
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; bijgewerkt?: boolean }
      if (!res.ok) throw new Error(j.error || "Versturen mislukte, probeer het zo nog eens.")
      setBijgewerkt(Boolean(j.bijgewerkt))
      setStatus("klaar")
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Versturen mislukte")
      setStatus("fout")
    }
  }

  // ── Na afloop ─────────────────────────────────────────────────────────────
  if (status === "klaar") {
    const gaatKomen = komt === "yes"
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          backgroundColor: gaatKomen ? "#ECFDF5" : "#FFF7ED",
          border: `1px solid ${gaatKomen ? "#10b98133" : "#f59e0b33"}`,
        }}
      >
        <p className="font-bold mb-1" style={{ color: gaatKomen ? "#065F46" : "#92400E" }}>
          {bijgewerkt ? "Je antwoord is bijgewerkt" : gaatKomen ? "Leuk, tot dan!" : "Jammer, bedankt voor het laten weten"}
        </p>
        <p className="text-sm" style={{ color: labelColor, opacity: 0.8 }}>
          {gaatKomen
            ? volledig
              ? "We hebben alles genoteerd."
              : "We houden er rekening mee. De officiële uitnodiging volgt nog."
            : "We vinden het jammer, maar fijn dat je het laat weten."}
        </p>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setBijgewerkt(false) }}
          className="mt-3 text-xs font-semibold underline"
          style={{ color: labelColor, opacity: 0.7 }}
        >
          Toch iets aanpassen
        </button>
      </div>
    )
  }

  if (naDeadline) {
    return (
      <p className="text-sm text-center" style={{ color: labelColor, opacity: 0.8 }}>
        De aanmeldtermijn is verstreken. Neem even contact op met het bruidspaar.
      </p>
    )
  }

  // ── Het formulier ─────────────────────────────────────────────────────────
  const veldKlassen = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
  const veldStijl: React.CSSProperties = { borderColor: `${accentColor}55`, color: "#1A1A1A" }
  const labelKlassen = `block font-semibold mb-2 ${compact ? "text-xs" : "text-sm"}`

  return (
    <form onSubmit={verstuur} className={`flex flex-col ${compact ? "gap-4" : "gap-6"}`}>
      {/* ── Ben je erbij? ── */}
      <div>
        <label className={labelKlassen} style={{ color: labelColor }}>Ben je erbij?</label>
        <div className="flex flex-col sm:flex-row gap-2">
          {(["yes", "no"] as const).map((v) => {
            const aan = komt === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setKomt(v)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-left flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: aan ? (v === "yes" ? "#ECFDF5" : "#FFF7ED") : "#fff",
                  border: `2px solid ${aan ? (v === "yes" ? "#10b981" : "#f59e0b") : `${accentColor}44`}`,
                  color: aan ? (v === "yes" ? "#065F46" : "#92400E") : labelColor,
                  cursor: "pointer",
                }}
              >
                <span>{v === "yes" ? "✓" : "✕"}</span>
                {v === "yes" ? "Ja, ik ben erbij" : "Nee, ik kan niet"}
              </button>
            )
          })}
        </div>
      </div>

      {komt && (
        <>
          {/* ── Met hoeveel volwassenen ── */}
          {komt === "yes" && (
            <div>
              <label className={labelKlassen} style={{ color: labelColor }}>
                Met hoeveel volwassenen kom je?
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAantal(n)}
                    className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
                    style={{
                      backgroundColor: aantal === n ? accentColor : "transparent",
                      color: aantal === n ? knopTekstKleur : labelColor,
                      border: `2px solid ${aantal === n ? accentColor : `${accentColor}44`}`,
                      cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Namen ── */}
          <div className="flex flex-col gap-4">
            {(komt === "no" ? personen.slice(0, 1) : personen).map((p, i) => (
              <div key={i} className="flex flex-col gap-2">
                {komt === "yes" && personen.length > 1 && (
                  <span className="text-xs font-semibold" style={{ color: labelColor, opacity: 0.7 }}>
                    {i === 0 ? "Jij" : `Persoon ${i + 1}`}
                  </span>
                )}
                <div className="flex gap-2">
                  <input
                    className={veldKlassen}
                    style={veldStijl}
                    placeholder="Voornaam"
                    value={p.voornaam}
                    onChange={(e) => zetPersoon(i, "voornaam", e.target.value)}
                    maxLength={80}
                    required={i === 0}
                  />
                  <input
                    className={veldKlassen}
                    style={veldStijl}
                    placeholder="Achternaam"
                    value={p.achternaam}
                    onChange={(e) => zetPersoon(i, "achternaam", e.target.value)}
                    maxLength={80}
                  />
                </div>
                {i === 0 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder="E-mailadres"
                      value={p.email}
                      onChange={(e) => zetPersoon(i, "email", e.target.value)}
                      maxLength={160}
                    />
                    <input
                      type="tel"
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder="Telefoon (niet verplicht)"
                      value={p.telefoon}
                      onChange={(e) => zetPersoon(i, "telefoon", e.target.value)}
                      maxLength={32}
                    />
                  </div>
                )}
                {volledig && komt === "yes" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder="Dieetwens, bijv. vegetarisch"
                      value={p.dietary}
                      onChange={(e) => zetPersoon(i, "dietary", e.target.value)}
                      maxLength={120}
                    />
                    <input
                      className={veldKlassen}
                      style={veldStijl}
                      placeholder="Allergie, bijv. noten"
                      value={p.allergie}
                      onChange={(e) => zetPersoon(i, "allergie", e.target.value)}
                      maxLength={120}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Kinderen ──
              Niet iedereen naar zijn leeftijd vragen, dat is raar op een
              trouwkaart. Alleen van kinderen, en met de reden erbij. */}
          {komt === "yes" && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={metKinderen}
                  onChange={(e) => setMetKinderen(e.target.checked)}
                  style={{ accentColor }}
                />
                <span className="text-sm font-semibold" style={{ color: labelColor }}>
                  Komen er kinderen mee?
                </span>
              </label>
              {metKinderen && (
                <div className="mt-3 flex flex-col gap-2">
                  {kinderen.map((k, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={veldKlassen}
                        style={veldStijl}
                        placeholder="Naam van het kind"
                        value={k.voornaam}
                        onChange={(e) => zetKind(i, "voornaam", e.target.value)}
                        maxLength={80}
                      />
                      <input
                        type="number"
                        min={0}
                        max={MAX_KIND_LEEFTIJD}
                        className={`${veldKlassen} w-24`}
                        style={veldStijl}
                        placeholder="Leeftijd"
                        value={k.leeftijd}
                        onChange={(e) => zetKind(i, "leeftijd", e.target.value)}
                      />
                    </div>
                  ))}
                  {kinderen.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setKinderen((v) => [...v, leegKind()])}
                      className="text-xs font-semibold self-start underline"
                      style={{ color: accentColor }}
                    >
                      Nog een kind
                    </button>
                  )}
                  <p className="text-[11px] leading-snug" style={{ color: labelColor, opacity: 0.65 }}>
                    De leeftijd helpt bij de catering: voor kinderen geldt vaak een ander tarief.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Alleen bij het volledige formulier ── */}
          {volledig && komt === "yes" && showSongRequest && (
            <div>
              <label className={labelKlassen} style={{ color: labelColor }}>Welk nummer mag er niet ontbreken?</label>
              <input className={veldKlassen} style={veldStijl} value={liedje} onChange={(e) => setLiedje(e.target.value)} maxLength={120} />
            </div>
          )}

          {volledig && komt === "yes" && showOvernachting && (
            <JaNee label="Blijf je slapen?" waarde={overnachting} zet={setOvernachting} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} />
          )}

          {volledig && komt === "yes" && heeftVraag1 && (
            <JaNee label={customQuestion!} waarde={eigen1} zet={setEigen1} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} />
          )}
          {volledig && komt === "yes" && heeftVraag2 && (
            <JaNee label={customQuestion2!} waarde={eigen2} zet={setEigen2} accentColor={accentColor} labelColor={labelColor} knopTekstKleur={knopTekstKleur} labelKlassen={labelKlassen} />
          )}

          <div>
            <label className={labelKlassen} style={{ color: labelColor }}>
              {komt === "no" ? "Wil je nog iets meegeven?" : "Een berichtje voor het bruidspaar?"}
            </label>
            <textarea
              className={`${veldKlassen} resize-none`}
              style={veldStijl}
              rows={compact ? 2 : 3}
              value={bericht}
              onChange={(e) => setBericht(e.target.value)}
              maxLength={1000}
            />
          </div>

          {fout && (
            <p className="text-sm font-semibold" style={{ color: "#991B1B" }} role="alert">{fout}</p>
          )}

          <button
            type="submit"
            disabled={status === "bezig"}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: accentColor, color: knopTekstKleur, border: "none", cursor: "pointer" }}
          >
            {status === "bezig" ? "Versturen..." : "Versturen"}
          </button>

          <p className="text-[11px] leading-snug text-center" style={{ color: labelColor, opacity: 0.6 }}>
            Je gegevens gaan naar het bruidspaar.
          </p>
        </>
      )}
    </form>
  )
}

/** Een ja-of-nee-vraag, zoals "blijf je slapen". */
function JaNee({
  label, waarde, zet, accentColor, labelColor, knopTekstKleur, labelKlassen,
}: {
  label: string
  waarde: boolean | null
  zet: (v: boolean) => void
  accentColor: string
  labelColor: string
  knopTekstKleur: string
  labelKlassen: string
}) {
  return (
    <div>
      <label className={labelKlassen} style={{ color: labelColor }}>{label}</label>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => zet(v)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: waarde === v ? accentColor : "transparent",
              color: waarde === v ? knopTekstKleur : labelColor,
              border: `2px solid ${waarde === v ? accentColor : `${accentColor}44`}`,
              cursor: "pointer",
            }}
          >
            {v ? "Ja" : "Nee"}
          </button>
        ))}
      </div>
    </div>
  )
}
