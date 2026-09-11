"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { STYLE_CONFIG, getStyleConfig, formatDate, type Style } from "@/lib/event-styles"
import {
  buildCardDisplay,
  cardAnimatie,
  cardDesign,
  CARD_ANIMATIE_KEUZES,
  CARD_ANIMATIE_LABEL,
  CARD_ANIMATIE_UITLEG,
  CARD_DESIGNS,
  CARD_TEMPLATE_LABEL,
  CARD_TEMPLATE_UITLEG,
  CARD_TYPE_PLAN,
  GUEST_TYPE_INVITE_LINE,
  GUEST_TYPE_LABEL,
  type CardAnimatie,
  type CardContent,
  type CardGuestType,
  type CardRow,
  type CardTemplate,
  type CardType,
} from "@/lib/cards"
import { PLANS, formatEur, upgradePrice } from "@/lib/plans"
import { compressImage } from "@/lib/client-image"
import CardReveal from "@/app/kaart/[token]/card-reveal"

// ── Kleuren (zelfde palet als dashboard en bouwer) ──────────────────────────
const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"
const SUBTLE     = "#9A8E82"

const LS_ONTWERP = "sayingyes_kaart"
const LS_ACTIE   = "sayingyes_kaart_actie"
const LS_IDS     = "sayingyes_kaart_ids"

const STYLE_LABEL: Record<Style, string> = {
  roze: "Roze", ivoor: "Ivoor", zand: "Zand", earthy: "Earthy", emerald: "Emerald",
}
const STYLE_KEYS = Object.keys(STYLE_CONFIG) as Style[]

type Stap = "stijl" | "template" | "tekst" | "foto" | "animatie" | "bekijken"
type Actie = "bewaar" | "activeer"

interface KaartOntwerp {
  type: CardType
  style: Style
  template: CardTemplate
  names: string
  datum: string
  location: string
  message: string
  guestType: CardGuestType | ""
  inviteText: string
  timeText: string
  photoDataUrl: string | null
  photoUrl: string | null
  animatie: CardAnimatie
}

const LEEG: KaartOntwerp = {
  type: "save_the_date",
  style: "zand",
  template: "klassiek",
  names: "",
  datum: "",
  location: "",
  message: "",
  guestType: "",
  inviteText: "",
  timeText: "",
  photoDataUrl: null,
  photoUrl: null,
  animatie: "rustig",
}

// Per stap één zin over waarom digitaal slim is: overtuigen zonder te duwen
const VOORDEEL: Record<Stap, string> = {
  stijl: "De stijl bepaalt ook de envelop die je gasten openen. Alles in één sfeer, zonder drukwerk.",
  template: "Drie richtingen: strak en tijdloos, sierlijk met handschrift, of bohemian en warm. Je kunt altijd wisselen.",
  tekst: "Verandert de tijd of de locatie? Geen herdruk en geen rondbelactie, je past de tekst gewoon aan.",
  foto: "Een foto van jullie samen maakt de kaart persoonlijk. Op WhatsApp valt hij dan extra op.",
  animatie: "Je gast tikt op de envelop, het zegel breekt en de kaart schuift eruit. Dat kan papier niet.",
  bekijken: "Je gasten krijgen een link, tikken op de envelop en zien jullie kaart. Geen app, geen account.",
}

function isCardType(v: unknown): v is CardType {
  return v === "save_the_date" || v === "trouwkaart"
}
function isStyle(v: unknown): v is Style {
  return typeof v === "string" && v in STYLE_CONFIG
}

function initialenVan(names: string): string {
  return names
    .split(/\s*&\s*|\s+en\s+/i)
    .map((n) => n.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("")
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

// Inklapbare stap in de zijbalk. Bewust buiten de pagina-component gedefinieerd:
// anders wordt het bij elke render een nieuw componenttype en verliezen de
// invoervelden erin hun focus bij elke toetsaanslag.
function Sectie({ id, titel, open, onToggle, children }: { id: Stap; titel: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{titel}</span>
        <span className="text-gray-400"><Chevron open={open} /></span>
      </button>
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {children}
          <p className="text-[11px] leading-snug" style={{ color: SUBTLE }}>{VOORDEEL[id]}</p>
        </div>
      )}
    </div>
  )
}

export default function KaartMakenPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [ontwerp, setOntwerp] = useState<KaartOntwerp>(LEEG)
  const [geladen, setGeladen] = useState(false)
  const [stap, setStap] = useState<Stap>("tekst")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [simulatie, setSimulatie] = useState(false)
  const [mailActie, setMailActie] = useState<Actie | null>(null)
  const [mailAdres, setMailAdres] = useState("")
  const [mailVerstuurd, setMailVerstuurd] = useState(false)
  const [busy, setBusy] = useState<Actie | "download" | "foto" | null>(null)
  const [melding, setMelding] = useState<{ tekst: string; fout?: boolean } | null>(null)

  const plan = CARD_TYPE_PLAN[ontwerp.type]
  const prijs = formatEur(PLANS[plan].price).replace(",00", "")
  const isTrouwkaart = ontwerp.type === "trouwkaart"
  const naarCompleet = upgradePrice(plan, "compleet")

  function update(patch: Partial<KaartOntwerp>) {
    setOntwerp((o) => ({ ...o, ...patch }))
  }

  // ── Laden: URL, bestaand event, of ontwerp uit de browser ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const typeUitUrl = params.get("type")
    const eventUitUrl = params.get("event_id")

    let basis: KaartOntwerp = LEEG
    try {
      const bewaard = localStorage.getItem(LS_ONTWERP)
      if (bewaard) basis = { ...LEEG, ...(JSON.parse(bewaard) as Partial<KaartOntwerp>) }
      const ids = localStorage.getItem(LS_IDS)
      if (ids) {
        const { eventId: e, cardId: c } = JSON.parse(ids) as { eventId?: string; cardId?: string }
        if (e) setEventId(e)
        if (c) setCardId(c)
      }
    } catch {}
    if (isCardType(typeUitUrl)) basis = { ...basis, type: typeUitUrl }
    setOntwerp(basis)

    createClient().auth.getUser().then(async ({ data }) => {
      const email = data.user?.email ?? null
      setUserEmail(email)

      // Bestaand event bewerken (vanuit het dashboard)
      if (eventUitUrl && email) {
        try {
          const r = await fetch(`/api/drafts/${eventUitUrl}`)
          if (r.ok) {
            const { event } = (await r.json()) as { event: Record<string, unknown> }
            const kr = await fetch(`/api/cards?event_id=${eventUitUrl}`)
            const { cards } = kr.ok ? ((await kr.json()) as { cards: CardRow[] }) : { cards: [] }
            const gewenstType: CardType = isCardType(typeUitUrl) ? typeUitUrl : (event.plan === "uitnodiging" ? "trouwkaart" : "save_the_date")
            const kaart = cards.find((c) => c.type === gewenstType) ?? cards[0]
            setEventId(eventUitUrl)
            setCardId(kaart?.id ?? null)
            setOntwerp({
              type: kaart?.type ?? gewenstType,
              style: isStyle(event.style) ? event.style : "zand",
              template: kaart?.template ?? "klassiek",
              names: kaart?.content.names ?? (event.frame_names as string) ?? (event.title as string) ?? "",
              datum: (event.datum as string) ?? "",
              location: kaart?.content.location ?? (event.locatie as string) ?? "",
              message: kaart?.content.message ?? "",
              guestType: kaart?.content.guestType ?? "",
              inviteText: kaart?.content.inviteText ?? "",
              timeText: kaart?.content.timeText ?? "",
              photoDataUrl: null,
              photoUrl: kaart?.content.photoUrl ?? null,
              animatie: cardAnimatie(kaart?.content.animatie),
            })
          }
        } catch {}
      }
      setGeladen(true)
    })
  }, [])

  // Escape sluit de simulatie en het mailvenster
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      setSimulatie(false)
      setMailActie(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Ontwerp altijd lokaal bewaren, zodat niets verloren gaat bij inloggen of verversen
  useEffect(() => {
    if (!geladen) return
    try { localStorage.setItem(LS_ONTWERP, JSON.stringify(ontwerp)) } catch {}
  }, [ontwerp, geladen])

  // ── Weergave ──────────────────────────────────────────────────────────────
  const sc = getStyleConfig(ontwerp.style)
  const content: CardContent = {
    names: ontwerp.names || undefined,
    dateText: ontwerp.datum ? formatDate(ontwerp.datum) : undefined,
    location: ontwerp.location || undefined,
    message: ontwerp.message || undefined,
    guestType: ontwerp.guestType || undefined,
    inviteText: ontwerp.inviteText || undefined,
    timeText: ontwerp.timeText || undefined,
    photoUrl: ontwerp.photoUrl ?? ontwerp.photoDataUrl ?? undefined,
    animatie: ontwerp.animatie,
  }
  const display = buildCardDisplay(ontwerp.type, ontwerp.template, content, {
    title: ontwerp.names || "Jullie namen",
    frame_names: ontwerp.names || null,
    datum: ontwerp.datum || null,
    locatie: ontwerp.location || null,
    hero_image_url: null,
  })
  const initialen = initialenVan(ontwerp.names) || "♥"

  // ── Opslaan op de server (event + kaart) ──────────────────────────────────
  const slaOp = useCallback(async (): Promise<{ eventId: string; cardId: string }> => {
    let fotoUrl = ontwerp.photoUrl
    if (ontwerp.photoDataUrl && !fotoUrl) {
      const blob = await (await fetch(ontwerp.photoDataUrl)).blob()
      const fd = new FormData()
      fd.append("file", new File([blob], "kaartfoto.jpg", { type: "image/jpeg" }))
      const up = await fetch("/api/cards/upload", { method: "POST", body: fd })
      if (up.ok) {
        fotoUrl = ((await up.json()) as { url: string }).url
        update({ photoUrl: fotoUrl, photoDataUrl: null })
      }
    }

    const eventBody = {
      type: "bruiloft",
      naam: ontwerp.names || "Onze bruiloft",
      datum: ontwerp.datum,
      locatie: ontwerp.location,
      style: ontwerp.style,
      frame_names: ontwerp.names,
      initials: initialenVan(ontwerp.names),
      pages: ["Home"],
      content: {},
      plan,
      ...(eventId ? { event_id: eventId } : {}),
    }
    const er = await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventBody) })
    if (!er.ok) throw new Error("Opslaan van het event mislukt")
    const { id: nieuwEventId } = (await er.json()) as { id: string }

    const kaartContent: CardContent = { ...content, photoUrl: fotoUrl ?? undefined }
    let nieuwCardId = cardId
    if (!nieuwCardId) {
      const cr = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: nieuwEventId,
          type: ontwerp.type,
          template: ontwerp.template,
          guest_type: isTrouwkaart && ontwerp.guestType ? ontwerp.guestType : undefined,
          photo_url: fotoUrl ?? undefined,
        }),
      })
      if (!cr.ok) throw new Error("Aanmaken van de kaart mislukt")
      nieuwCardId = ((await cr.json()) as { card: CardRow }).card.id
    }
    const pr = await fetch(`/api/cards/${nieuwCardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: kaartContent, template: ontwerp.template }),
    })
    if (!pr.ok) throw new Error("Opslaan van de kaarttekst mislukt")

    setEventId(nieuwEventId)
    setCardId(nieuwCardId)
    try { localStorage.setItem(LS_IDS, JSON.stringify({ eventId: nieuwEventId, cardId: nieuwCardId })) } catch {}
    return { eventId: nieuwEventId, cardId: nieuwCardId }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ontwerp, eventId, cardId, plan, isTrouwkaart])

  function controleer(): string | null {
    if (!ontwerp.names.trim()) return "Vul eerst jullie namen in."
    if (!ontwerp.datum) return "Kies eerst de datum van jullie bruiloft."
    return null
  }

  async function voerUit(actie: Actie) {
    const fout = controleer()
    if (fout) { setMelding({ tekst: fout, fout: true }); setStap("tekst"); return }
    if (!userEmail) { setMailActie(actie); setMailVerstuurd(false); return }
    setBusy(actie)
    setMelding(null)
    try {
      const ids = await slaOp()
      if (actie === "activeer") {
        router.push(`/betalen?event_id=${ids.eventId}&plan=${plan}`)
        return
      }
      setMelding({ tekst: "Opgeslagen. Je vindt dit ontwerp terug in je dashboard." })
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Er ging iets mis, probeer opnieuw.", fout: true })
    } finally {
      setBusy(null)
    }
  }

  // Na inloggen via de mail: de gekozen actie afmaken
  useEffect(() => {
    if (!geladen || !userEmail) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("resume") !== "1") return
    let actie: Actie | null = null
    try {
      const a = localStorage.getItem(LS_ACTIE)
      if (a === "bewaar" || a === "activeer") actie = a
      localStorage.removeItem(LS_ACTIE)
    } catch {}
    params.delete("resume")
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
    if (actie) void voerUit(actie)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geladen, userEmail])

  async function stuurInloglink(e: React.FormEvent) {
    e.preventDefault()
    if (!mailActie || !mailAdres.trim()) return
    setBusy(mailActie)
    try {
      localStorage.setItem(LS_ACTIE, mailActie)
      const next = `/kaart-maken?type=${ontwerp.type}&plan=${plan}&resume=1`
      await createClient().auth.signInWithOtp({
        email: mailAdres.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      setMailVerstuurd(true)
    } catch {
      setMelding({ tekst: "Versturen van de inloglink mislukte, probeer opnieuw.", fout: true })
    } finally {
      setBusy(null)
    }
  }

  async function kiesFoto(file: File) {
    setBusy("foto")
    try {
      const blob = await compressImage(file, 1200, 0.8)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(new Error("Kon de foto niet lezen"))
        r.readAsDataURL(blob)
      })
      update({ photoDataUrl: dataUrl, photoUrl: null })
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Foto laden mislukt", fout: true })
    } finally {
      setBusy(null)
    }
  }

  async function downloadVoorbeeld() {
    setBusy("download")
    setMelding(null)
    try {
      const r = await fetch("/api/kaart-voorbeeld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: ontwerp.type, template: ontwerp.template, style: ontwerp.style,
          names: ontwerp.names, dateText: ontwerp.datum ? formatDate(ontwerp.datum) : "",
          location: ontwerp.location, message: ontwerp.message,
          guestType: ontwerp.guestType, inviteText: ontwerp.inviteText, timeText: ontwerp.timeText,
          photoUrl: ontwerp.photoUrl,
        }),
      })
      if (!r.ok) throw new Error("Voorbeeld maken mislukte, probeer het zo opnieuw.")
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "voorbeeld-kaart.png"
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      setMelding({ tekst: e instanceof Error ? e.message : "Downloaden mislukte", fout: true })
    } finally {
      setBusy(null)
    }
  }

  const titel = isTrouwkaart ? "Trouwkaart ontwerpen" : "Save the Date ontwerpen"

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: IVORY }}>
      {/* ── Kop ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b" style={{ backgroundColor: "#fff", borderColor: `${GOLD_LIGHT}80` }}>
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="text-xl tracking-wide" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600, textDecoration: "none" }}>
            SayingYes
          </Link>
          <span className="hidden sm:inline text-sm truncate" style={{ color: BODY }}>{titel}</span>
        </div>
        <div className="flex items-center gap-2">
          {userEmail && (
            <Link href="/dashboard" className="hidden sm:inline-flex text-sm font-semibold px-3 py-2 rounded-xl" style={{ color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}>
              Mijn dashboard
            </Link>
          )}
          <button
            onClick={() => voerUit("bewaar")}
            disabled={busy !== null}
            className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60"
            style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            {busy === "bewaar" ? "Bezig..." : "Bewaar ontwerp"}
          </button>
          <button
            onClick={() => voerUit("activeer")}
            disabled={busy !== null}
            className="text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-60 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "#059669", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.3)" }}
          >
            {busy === "activeer" ? "Bezig..." : `Activeer voor ${prijs}`}
          </button>
        </div>
      </header>

      {melding && (
        <div className="px-4 py-2.5 text-sm text-center" style={{ backgroundColor: melding.fout ? "#FEF2F2" : "#ECFDF5", color: melding.fout ? "#991B1B" : "#065F46" }}>
          {melding.tekst}
          {!melding.fout && eventId && (
            <>
              {" "}<Link href="/dashboard" className="underline font-semibold">Naar het dashboard</Link>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* ── Stappen ── */}
        <aside className="w-full md:w-80 md:flex-shrink-0 bg-white border-r border-gray-100 md:overflow-y-auto">
          <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: GOLD_BG }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>{PLANS[plan].label}</span>
              <span className="text-[11px] font-semibold" style={{ color: CHARCOAL }}>{prijs} eenmalig</span>
            </div>
            <p className="text-[11px] leading-snug mt-1.5" style={{ color: BODY }}>
              {isTrouwkaart
                ? "Ontwerp gratis, betaal pas als je verstuurt. Per gastengroep maak je straks een eigen kaart met eigen tijden."
                : "Ontwerp gratis, betaal pas als je verstuurt. Later upgraden kan altijd, alles blijft staan."}
            </p>
          </div>

          <Sectie id="tekst" open={stap === "tekst"} onToggle={() => setStap(stap === "tekst" ? "tekst" : "tekst")} titel="Tekst op de kaart">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Jullie namen</span>
              <input className={inputCls} style={inputStyle} placeholder="Sophie & Daan" value={ontwerp.names} onChange={(e) => update({ names: e.target.value })} maxLength={80} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Trouwdatum</span>
              <input type="date" className={inputCls} style={inputStyle} value={ontwerp.datum} onChange={(e) => update({ datum: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Locatie</span>
              <input className={inputCls} style={inputStyle} placeholder="Landgoed Duno, Doorwerth" value={ontwerp.location} onChange={(e) => update({ location: e.target.value })} maxLength={120} />
            </label>
            {isTrouwkaart && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Voor wie is deze kaart?</span>
                  <div className="flex flex-wrap gap-2">
                    {([["", "Geen vermelding"], ...Object.entries(GUEST_TYPE_LABEL)] as [CardGuestType | "", string][]).map(([w, label]) => (
                      <button
                        key={w || "geen"}
                        onClick={() => update({ guestType: w })}
                        className="text-xs font-semibold px-3 py-2 rounded-xl"
                        style={{ border: `2px solid ${ontwerp.guestType === w ? GOLD : GOLD_LIGHT}`, backgroundColor: ontwerp.guestType === w ? "#fff" : "transparent", color: CHARCOAL, cursor: "pointer" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Uitnodigingszin</span>
                  <input className={inputCls} style={inputStyle} placeholder={ontwerp.guestType ? GUEST_TYPE_INVITE_LINE[ontwerp.guestType] : "Wij nodigen je van harte uit"} value={ontwerp.inviteText} onChange={(e) => update({ inviteText: e.target.value })} maxLength={160} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Tijden</span>
                  <input className={inputCls} style={inputStyle} placeholder="Van 13:30 tot 23:00 uur" value={ontwerp.timeText} onChange={(e) => update({ timeText: e.target.value })} maxLength={80} />
                </label>
              </>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>Boodschap</span>
              <textarea className={inputCls} style={{ ...inputStyle, minHeight: 84 }} placeholder={display.message} value={ontwerp.message} onChange={(e) => update({ message: e.target.value })} maxLength={400} />
            </label>
          </Sectie>

          <Sectie id="stijl" open={stap === "stijl"} onToggle={() => setStap(stap === "stijl" ? "tekst" : "stijl")} titel="Stijl">
            <div className="grid grid-cols-5 gap-2">
              {STYLE_KEYS.map((s) => {
                const cfg = STYLE_CONFIG[s]
                const actief = ontwerp.style === s
                return (
                  <button
                    key={s}
                    onClick={() => update({ style: s })}
                    title={STYLE_LABEL[s]}
                    className="flex flex-col items-center gap-1.5"
                    style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
                  >
                    <span
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${cfg.bodyBg} 50%, ${cfg.accent} 50%)`,
                        boxShadow: actief ? `0 0 0 2px #fff, 0 0 0 4px ${GOLD}` : "0 0 0 1px rgba(0,0,0,0.08)",
                      }}
                    />
                    <span className="text-[10px]" style={{ color: actief ? CHARCOAL : BODY, fontWeight: actief ? 700 : 500 }}>{STYLE_LABEL[s]}</span>
                  </button>
                )
              })}
            </div>
          </Sectie>

          <Sectie id="template" open={stap === "template"} onToggle={() => setStap(stap === "template" ? "tekst" : "template")} titel="Ontwerp">
            <div className="flex flex-col gap-2">
              {CARD_DESIGNS.map((t) => (
                <button
                  key={t}
                  onClick={() => update({ template: t })}
                  className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: `2px solid ${cardDesign(ontwerp.template) === t ? GOLD : GOLD_LIGHT}`, backgroundColor: cardDesign(ontwerp.template) === t ? "#fff" : "transparent", color: CHARCOAL, cursor: "pointer" }}
                >
                  {CARD_TEMPLATE_LABEL[t]}
                  <span className="block text-[11px] font-normal" style={{ color: BODY }}>{CARD_TEMPLATE_UITLEG[t]}</span>
                </button>
              ))}
            </div>
          </Sectie>

          {/* Een foto kan bij elk ontwerp */}
          <Sectie id="foto" open={stap === "foto"} onToggle={() => setStap(stap === "foto" ? "tekst" : "foto")} titel="Foto (optioneel)">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void kiesFoto(f) }} />
              {(ontwerp.photoDataUrl || ontwerp.photoUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ontwerp.photoUrl ?? ontwerp.photoDataUrl ?? ""} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: 140 }} />
              )}
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={busy === "foto"} className="flex-1 text-sm font-semibold px-3 py-2.5 rounded-xl disabled:opacity-60" style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}>
                  {busy === "foto" ? "Bezig..." : ontwerp.photoDataUrl || ontwerp.photoUrl ? "Andere foto" : "Kies een foto"}
                </button>
                {(ontwerp.photoDataUrl || ontwerp.photoUrl) && (
                  <button onClick={() => update({ photoDataUrl: null, photoUrl: null })} className="text-sm font-semibold px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#fff", color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}>
                    Weg
                  </button>
                )}
              </div>
            </Sectie>

          {/* Hoe de envelop opengaat bij de gast. Het uitschuiven, het brekende
              zegel en het verende landen zitten in beide keuzes; het verschil
              is alleen of er gouden stofjes bij komen. */}
          <Sectie id="animatie" open={stap === "animatie"} onToggle={() => setStap(stap === "animatie" ? "tekst" : "animatie")} titel="Openen">
            <div className="flex flex-col gap-2">
              {CARD_ANIMATIE_KEUZES.map((a) => (
                <button
                  key={a}
                  onClick={() => update({ animatie: a })}
                  className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: `2px solid ${ontwerp.animatie === a ? GOLD : GOLD_LIGHT}`, backgroundColor: ontwerp.animatie === a ? "#fff" : "transparent", color: CHARCOAL, cursor: "pointer" }}
                >
                  {CARD_ANIMATIE_LABEL[a]}
                  <span className="block text-[11px] font-normal" style={{ color: BODY }}>{CARD_ANIMATIE_UITLEG[a]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSimulatie(true)}
              className="text-sm font-semibold px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
            >
              Bekijk hoe het opengaat
            </button>
          </Sectie>

          <Sectie id="bekijken" open={stap === "bekijken"} onToggle={() => setStap(stap === "bekijken" ? "tekst" : "bekijken")} titel="Bekijken">
            <button
              onClick={() => setSimulatie(true)}
              className="w-full text-sm font-semibold px-3 py-3 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}
            >
              💌 Zo ontvangen je gasten hem
            </button>
            <button
              onClick={downloadVoorbeeld}
              disabled={busy === "download"}
              className="w-full text-sm font-semibold px-3 py-3 rounded-xl disabled:opacity-60"
              style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
            >
              {busy === "download" ? "Bezig..." : "⬇ Download voorbeeld"}
            </button>
            <p className="text-[11px] leading-snug" style={{ color: SUBTLE }}>
              Het voorbeeld draagt een watermerk. Na activeren krijg je de kaart zonder, plus de link om te delen.
            </p>
          </Sectie>
        </aside>

        {/* ── Voorbeeld ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ backgroundColor: "#F1ECE3" }}>
          <div className="mx-auto max-w-md">
            <p className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: SUBTLE }}>
              Zo ziet jullie kaart eruit
            </p>
            <div className="rounded-2xl shadow-xl overflow-clip">
              <CardReveal
                display={display}
                initials={initialen}
                sc={sc}
                siteUrl={null}
                rsvpUrl={null}
                startOpen
                watermerk="licht"
              />
            </div>

            {/* Websiteblok: één keer, rustig, met het verschilbedrag */}
            <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: GOLD }}>Ook een trouwwebsite erbij?</p>
              <p className="text-sm leading-relaxed mb-3" style={{ color: BODY }}>
                De knop onder jullie kaart kan naar een complete trouwwebsite leiden: programma, locatie, cadeautips, fotogalerij en een live fotomuur voor op de dag zelf. Alles wat je gasten anders per appje vragen, op één plek.
              </p>
              <ul className="text-sm space-y-1.5 mb-4" style={{ color: BODY }}>
                {["Gasten reageren met één tik, jullie zien alles in het dashboard", "Eigen adres: jullienamen.sayingyes.nl", "Gastenfotomuur met QR-code voor op de tafels"].map((p) => (
                  <li key={p} className="flex items-start gap-2"><span style={{ color: GOLD, fontSize: "0.45rem", marginTop: 6 }}>✦</span>{p}</li>
                ))}
              </ul>
              <p className="text-xs" style={{ color: SUBTLE }}>
                {naarCompleet != null ? `Later upgraden kost ${formatEur(naarCompleet)} extra. Dit ontwerp blijft dan gewoon staan.` : ""}{" "}
                <Link href="/digitale-uitnodiging" className="underline" style={{ color: GOLD }}>Bekijk de pakketten</Link>
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ── Envelopsimulatie ── */}
      {simulatie && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ backgroundColor: sc.bodyBackground ?? sc.bodyBg }}>
          <button
            onClick={() => setSimulatie(false)}
            className="fixed top-12 right-4 z-[110] text-sm font-semibold px-4 py-2 rounded-xl shadow-lg"
            style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            ✕ Terug naar ontwerpen
          </button>
          <CardReveal
            /* De animatie in de key, zodat de simulatie opnieuw begint als je
               een andere manier van openen kiest */
            key={`${ontwerp.style}-${ontwerp.template}-${ontwerp.animatie}`}
            display={display}
            initials={initialen}
            sc={sc}
            siteUrl={null}
            rsvpUrl={null}
            previewNotice
          />
        </div>
      )}

      {/* ── E-mail vragen bij bewaren of activeren ── */}
      {mailActie && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setMailActie(null)}>
          <div className="w-full max-w-md rounded-3xl p-7" style={{ backgroundColor: IVORY }} onClick={(e) => e.stopPropagation()}>
            {mailVerstuurd ? (
              <>
                <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}>Check je mail 💌</h2>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                  We hebben een inloglink gestuurd naar <strong style={{ color: CHARCOAL }}>{mailAdres}</strong>. Klik erop en je komt hier terug; je ontwerp staat dan klaar en we gaan meteen verder met {mailActie === "activeer" ? "activeren" : "bewaren"}.
                </p>
                <button onClick={() => setMailActie(null)} className="mt-6 w-full text-sm font-semibold px-4 py-3 rounded-xl" style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}>
                  Sluiten
                </button>
              </>
            ) : (
              <form onSubmit={stuurInloglink}>
                <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}>
                  {mailActie === "activeer" ? "Bijna klaar om te versturen" : "Bewaar jullie ontwerp"}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: BODY }}>
                  {mailActie === "activeer"
                    ? "Vul je e-mailadres in voor de inlog en de factuur. Je krijgt een link, klikt erop en betaalt daarna via Mollie. Je ontwerp gaat niet verloren."
                    : "Vul je e-mailadres in en we bewaren dit ontwerp in je dashboard, zodat je er later op elk apparaat aan verder kunt. Geen wachtwoord, je logt in met een link."}
                </p>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="jullie@voorbeeld.nl"
                  value={mailAdres}
                  onChange={(e) => setMailAdres(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
                <button type="submit" disabled={busy !== null} className="mt-4 w-full text-sm font-bold px-4 py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: mailActie === "activeer" ? "#059669" : CHARCOAL, color: "#fff", border: "none", cursor: "pointer" }}>
                  {busy ? "Bezig..." : mailActie === "activeer" ? `Stuur mij de link en activeer voor ${prijs}` : "Stuur mij de link"}
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-center" style={{ color: SUBTLE }}>
                  Door verder te gaan ga je akkoord met onze <Link href="/voorwaarden" className="underline">voorwaarden</Link> en ons <Link href="/privacy" className="underline">privacybeleid</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
