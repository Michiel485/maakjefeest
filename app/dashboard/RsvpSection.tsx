"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { laadXlsx } from "@/lib/xlsx-laden"
import { gastSleutel, komtGast, reis, REIS_LABEL, type Reis } from "@/lib/gasten"
import GastenToevoegen from "./GastenToevoegen"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"
const SOFT       = "#9A8E82"

export interface RsvpRow {
  id: string
  event_id: string
  submission_id: string | null
  name: string
  voornaam: string | null
  achternaam: string | null
  email: string | null
  guest_type: string
  dietary: string | null
  allergie: string | null
  telefoon: string | null
  is_kind: boolean | null
  leeftijd: number | null
  /** uitgenodigd, voorlopig of definitief. Zie lib/gasten.ts. */
  status: string | null
  /** Hoe ver de Save the Date en de uitnodiging staan. Zie Reis in lib/gasten.ts. */
  std_status: string | null
  inv_status: string | null
  /** Op welke kaartlink dit binnenkwam. */
  bron_token: string | null
  /** Welke kaart het bruidspaar zegt gestuurd te hebben (bij "verstuurd zetten").
   *  Optioneel: bestaat pas na migration_gekregen.sql. */
  std_kaart_id?: string | null
  inv_kaart_id?: string | null
  /** Voor een papieren trouwkaart, als de gast dat invulde. Bestaat pas na migration_adres.sql. */
  adres?: string | null
  huishouden_id?: string | null
  huishouden_naam: string | null
  is_primary: boolean
  attending: string | null
  message: string | null
  song: string | null
  overnachting: boolean | null
  custom_answer: boolean | null
  custom_answer_2: boolean | null
  created_at: string
}

interface EventRef { id: string; title: string }

/** Een kaart van deze bruiloft, om te kunnen zeggen welke een gast kreeg. */
export interface KaartRef { id: string; type: string; naam: string; share_token: string; werkt?: boolean }

// ── Lijken twee gasten op dezelfde persoon? ─────────────────────────────────
// Een typfout tussen de Save the Date en de trouwkaart, of een keer zelf
// ingetypt en een keer zelf aangemeld. Wij wijzen het aan; samenvoegen doet
// het bruidspaar, want twee neven met bijna dezelfde naam bestaan echt.

/** Hoeveel letters verschillen er (Levenshtein), met een plafond. */
function afstand(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let vorige = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const nu = [i]
    let kleinste = i
    for (let j = 1; j <= b.length; j++) {
      nu[j] = Math.min(vorige[j] + 1, nu[j - 1] + 1, vorige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      kleinste = Math.min(kleinste, nu[j])
    }
    if (kleinste > max) return max + 1
    vorige = nu
  }
  return vorige[b.length]
}

const telefoonSleutel = (t: string | null) => (t ?? "").replace(/\D/g, "").slice(-9)

/** Waarom deze twee op elkaar lijken, of null als ze dat niet doen. */
function lijktOp(a: RsvpRow, b: RsvpRow): string | null {
  if (a.event_id !== b.event_id) return null
  // Wie samen één formulier invult of samen een gezin is, typt zijn eigen
  // gezinsleden niet dubbel: Henk en Sjenk zijn dan twee mensen. En mail en
  // telefoon worden binnen een gezin vaak gedeeld. Dus alleen over
  // huishoudens heen.
  const zelfdeHuis = !!a.huishouden_id && a.huishouden_id === b.huishouden_id
  if (zelfdeHuis || (!!a.submission_id && a.submission_id === b.submission_id)) return null
  const na = gastSleutel(a.voornaam ?? a.name, a.achternaam)
  const nb = gastSleutel(b.voornaam ?? b.name, b.achternaam)
  if (na && na === nb) return "dezelfde naam"
  const kort = Math.min(na.length, nb.length)
  if (kort >= 4 && afstand(na, nb, kort >= 8 ? 2 : 1) <= (kort >= 8 ? 2 : 1)) return "bijna dezelfde naam"
  if (a.email && b.email && a.email.trim().toLowerCase() === b.email.trim().toLowerCase() && !a.is_kind && !b.is_kind) {
    return "hetzelfde mailadres"
  }
  const ta = telefoonSleutel(a.telefoon)
  if (ta.length >= 9 && ta === telefoonSleutel(b.telefoon)) return "hetzelfde telefoonnummer"
  return null
}

const LS_GEEN_DUBBEL = "sayingyes_geen_dubbel"
const paarSleutel = (a: string, b: string) => [a, b].sort().join("|")

/** Een telefoonnummer zoals WhatsApp het wil: landcode, geen plus of nullen. */
function whatsappNummer(tel: string | null): string | null {
  if (!tel) return null
  const schoon = tel.trim()
  let cijfers = schoon.replace(/\D/g, "")
  if (schoon.startsWith("+")) {
    // al met landcode
  } else if (cijfers.startsWith("00")) {
    cijfers = cijfers.slice(2)
  } else if (cijfers.startsWith("0")) {
    cijfers = "31" + cijfers.slice(1)
  }
  return cijfers.length >= 10 ? cijfers : null
}

interface EditForm {
  name: string
  email: string
  attending: string
  guest_type: string
  dietary: string
  message: string
  song: string
  overnachting: boolean | null
  custom_answer: boolean | null
  custom_answer_2: boolean | null
}

function rowToForm(row: RsvpRow): EditForm {
  return {
    name: row.name,
    email: row.email ?? "",
    attending: row.attending ?? "yes",
    guest_type: row.guest_type,
    dietary: row.dietary ?? "",
    message: row.message ?? "",
    song: row.song ?? "",
    overnachting: row.overnachting,
    custom_answer: row.custom_answer,
    custom_answer_2: row.custom_answer_2,
  }
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none transition-all"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

export default function RsvpSection({
  rsvps: initialRsvps,
  events,
  kaarten = [],
}: {
  rsvps: RsvpRow[]
  events: EventRef[]
  kaarten?: KaartRef[]
}) {
  const [rsvps, setRsvps] = useState<RsvpRow[]>(initialRsvps)
  // Komt er een nieuwe lijst van de server (na het toevoegen van gasten
  // ververst het dashboard zichzelf), dan nemen we die over. Zonder dit bleef
  // de oude kopie staan en zag je je nieuwe gasten pas na een handmatige
  // verversing.
  const [vorigeLijst, setVorigeLijst] = useState(initialRsvps)
  if (initialRsvps !== vorigeLijst) {
    setVorigeLijst(initialRsvps)
    setRsvps(initialRsvps)
  }
  // Welke kaart je hebt gestuurd, als er van een soort meer dan één is
  // (daggasten, avondgasten, een andere taal). Standaard de eerste.
  const stdKaarten = kaarten.filter((k) => k.type === "save_the_date")
  const invKaarten = kaarten.filter((k) => k.type === "trouwkaart")
  const [stdKaart, setStdKaart] = useState<string>(stdKaarten[0]?.id ?? "")
  const [invKaart, setInvKaart] = useState<string>(invKaarten[0]?.id ?? "")

  /** Welke kaart een gast kreeg: wat het bruidspaar aangaf, anders de link
   *  waarop de gast antwoordde. */
  function gekregen(row: RsvpRow, product: "std" | "inv"): string | null {
    const id = product === "std" ? row.std_kaart_id : row.inv_kaart_id
    const viaId = id ? kaarten.find((k) => k.id === id) : null
    if (viaId) return viaId.naam
    const viaLink = row.bron_token ? kaarten.find((k) => k.share_token === row.bron_token) : null
    if (viaLink && (product === "std" ? viaLink.type === "save_the_date" : viaLink.type === "trouwkaart")) return viaLink.naam
    return null
  }
  const [editingRow, setEditingRow] = useState<RsvpRow | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // Aangevinkte regels. Nodig om in één keer een herinnering te sturen, en om
  // meerdere regels tegelijk op te ruimen.
  const [gekozen, setGekozen] = useState<Set<string>>(new Set())
  const [berichtSoort, setBerichtSoort] = useState<"herinnering" | "wijziging" | null>(null)
  const [berichtTekst, setBerichtTekst] = useState("")
  const [berichtBezig, setBerichtBezig] = useState(false)
  const [berichtUitslag, setBerichtUitslag] = useState<string | null>(null)

  // Paren die het bruidspaar al als "twee mensen" aanwees. Per browser, want
  // het is een vinkje voor jezelf, geen gegeven van de bruiloft.
  const [geenDubbel, setGeenDubbel] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const bewaard = JSON.parse(localStorage.getItem(LS_GEEN_DUBBEL) ?? "[]") as string[]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(bewaard) && bewaard.length > 0) setGeenDubbel(new Set(bewaard))
    } catch {}
  }, [])
  function tweeMensen(a: string, b: string) {
    setGeenDubbel((v) => {
      const n = new Set(v)
      n.add(paarSleutel(a, b))
      try { localStorage.setItem(LS_GEEN_DUBBEL, JSON.stringify([...n])) } catch {}
      return n
    })
  }
  const [sortering, setSortering] = useState<Sortering>({ sleutel: "naam", op: true })

  // Een gast met de hand toevoegen: het plusje onder de lijst opent een lege
  // regel onderaan, die je ter plekke invult. Enter bewaart en opent meteen
  // de volgende, Escape sluit hem. Michiels wens van 24 september 2026; het
  // formulier met Excel en plakken blijft voor een hele lijst tegelijk.
  const [nieuw, setNieuw] = useState<NieuweRegel | null>(null)
  const [nieuwBezig, setNieuwBezig] = useState(false)
  const [nieuwFout, setNieuwFout] = useState<string | null>(null)
  const [nieuwTeller, setNieuwTeller] = useState(0)
  const bruiloftId = events[0]?.id ?? null
  function zetNieuw(veld: keyof NieuweRegel, waarde: string) {
    setNieuw((v) => (v ? { ...v, [veld]: waarde } : v))
  }
  const [voegtSamen, setVoegtSamen] = useState(false)
  const [samenvoegFout, setSamenvoegFout] = useState<string | null>(null)

  // WhatsApp per gast: welke gast kiest nu een kaart
  const [whatsappVoor, setWhatsappVoor] = useState<RsvpRow | null>(null)
  const werkendeKaarten = kaarten.filter((k) => k.werkt)


  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.title]))

  // Bruiloften waar al aanmeldingen voor zijn: alleen daarvoor is een
  // cateraarsoverzicht zinvol. Bijna altijd precies een.
  const eventsMetGasten = events.filter((e) => rsvps.some((r) => r.event_id === e.id))

  const attending      = rsvps.filter((r) => r.attending !== "no")
  const declined       = rsvps.filter((r) => r.attending === "no")
  const daggasten      = attending.filter((r) => r.guest_type === "daggast").length
  const avondgasten    = attending.filter((r) => r.guest_type === "avondgast").length
  const receptiegasten = attending.filter((r) => r.guest_type === "receptiegast").length

  const hasReceptiegasten = attending.some((r) => r.guest_type === "receptiegast")
  const hasSong           = rsvps.some((r) => r.song)
  const hasOvernachting   = rsvps.some((r) => r.overnachting !== null)
  const hasCustomAnswer   = rsvps.some((r) => r.custom_answer !== null)
  const hasCustomAnswer2  = rsvps.some((r) => r.custom_answer_2 !== null)

  // Sorteren op een kolom. Standaard op naam.
  const RANG_REIS: Record<Reis, number> = { ja: 3, nee: 2, verstuurd: 1, niet_verstuurd: 0 }
  const gesorteerd = [...rsvps].sort((a, b) => {
    const r = sortering.op ? 1 : -1
    switch (sortering.sleutel) {
      case "type":
        return r * (a.guest_type ?? "").localeCompare(b.guest_type ?? "", "nl") || a.name.localeCompare(b.name, "nl")
      case "std":
        return r * (RANG_REIS[reis(b.std_status)] - RANG_REIS[reis(a.std_status)]) || a.name.localeCompare(b.name, "nl")
      case "inv":
        return r * (RANG_REIS[reis(b.inv_status)] - RANG_REIS[reis(a.inv_status)]) || a.name.localeCompare(b.name, "nl")
      default:
        return r * a.name.localeCompare(b.name, "nl")
    }
  })
  const heeftDieet = rsvps.some((r) => r.dietary || r.allergie)

  // Alle zichtbare regels, voor het vinkje in de kop
  const alleIds = gesorteerd.map((r) => r.id)

  // Vermoedelijke dubbelen, als paren, voor de melding boven de lijst. Wij
  // voegen niet uit onszelf samen; alleen het bruidspaar weet of het dezelfde
  // persoon is. Hoogstens een paar honderd gasten, dus alle paren langs is
  // geen probleem.
  const verdacht: { a: RsvpRow; b: RsvpRow; waarom: string }[] = []
  for (let i = 0; i < rsvps.length; i++) {
    for (let j = i + 1; j < rsvps.length; j++) {
      const waarom = lijktOp(rsvps[i], rsvps[j])
      if (waarom && !geenDubbel.has(paarSleutel(rsvps[i].id, rsvps[j].id))) {
        verdacht.push({ a: rsvps[i], b: rsvps[j], waarom })
      }
    }
  }
  const gekozenRijen = rsvps.filter((r) => gekozen.has(r.id))

  // Wie nog geen antwoord heeft gegeven, op geen van beide producten. Dat is
  // letterlijk de lijst "wie moet ik nog najagen", en met één druk te pakken:
  // in de praktijk is dat waar je de herinnering naartoe stuurt.
  const stilleIds = rsvps
    .filter((r) => komtGast(reis(r.std_status), reis(r.inv_status)) === null)
    .map((r) => r.id)


  function openEdit(row: RsvpRow) {
    setEditingRow(row)
    setEditForm(rowToForm(row))
    setSaveError(null)
  }

  async function handleSave() {
    if (!editingRow || !editForm) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/rsvp/${editingRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      setRsvps((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, name: editForm.name, email: editForm.email || null, attending: editForm.attending, guest_type: editForm.guest_type, dietary: editForm.dietary || null, message: editForm.message || null, song: editForm.song || null, overnachting: editForm.overnachting, custom_answer: editForm.custom_answer, custom_answer_2: editForm.custom_answer_2 }
            : r
        )
      )
      setEditingRow(null)
      setEditForm(null)
    } catch {
      setSaveError("Opslaan mislukt — probeer opnieuw.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/rsvp/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRsvps((prev) => prev.filter((r) => r.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // silently leave row
    } finally {
      setDeletingId(null)
    }
  }

  function wissel(id: string) {
    setGekozen((v) => {
      const n = new Set(v)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function kiesAlle(ids: string[], aan: boolean) {
    setGekozen((v) => {
      const n = new Set(v)
      for (const id of ids) {
        if (aan) n.add(id)
        else n.delete(id)
      }
      return n
    })
  }

  // Verstuurd-zetten doet het bruidspaar zelf, want delen gaat via WhatsApp en
  // dat kunnen wij niet zien. Meestal voor tientallen mensen tegelijk.
  async function zetReis(product: "std" | "inv", waarde: Reis) {
    setBerichtBezig(true)
    setBerichtUitslag(null)
    // Bij "verstuurd" onthouden we ook welke kaart je stuurde, zodat de lijst
    // kan zeggen wie de avondgastenkaart kreeg en wie de Engelse.
    const kaartId = waarde === "verstuurd" ? (product === "std" ? stdKaart : invKaart) || null : null
    try {
      const res = await fetch("/api/gasten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...gekozen], product, waarde, kaart_id: kaartId }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; bijgewerkt?: number; ids?: string[]; overgeslagen?: number }
      if (!res.ok) throw new Error(j.error || "Bijwerken mislukte")
      const kolom = product === "inv" ? "inv_status" : "std_status"
      const kaartKolom = product === "inv" ? "inv_kaart_id" : "std_kaart_id"
      const bijgewerkt = new Set(j.ids ?? [...gekozen])
      setRsvps((vorig) =>
        vorig.map((r) =>
          bijgewerkt.has(r.id)
            ? {
                ...r,
                [kolom]: waarde,
                ...(kaartId ? { [kaartKolom]: kaartId } : {}),
                ...(waarde === "ja" || waarde === "nee" ? { attending: waarde === "ja" ? "yes" : "no" } : {}),
              }
            : r
        )
      )
      setBerichtUitslag(
        `${j.bijgewerkt ?? 0} bijgewerkt.` +
          (j.overgeslagen
            ? ` ${j.overgeslagen} ${j.overgeslagen === 1 ? "had" : "hadden"} al geantwoord; dat antwoord blijft staan.`
            : ""),
      )
    } catch (e) {
      setBerichtUitslag(e instanceof Error ? e.message : "Bijwerken mislukte")
    } finally {
      setBerichtBezig(false)
    }
  }

  // Twee regels tot één. De oudste blijft, met zijn naam; de server vult aan
  // en kiest per product het sterkste antwoord. Zie /api/gasten/samenvoegen.
  async function voegSamen(a: RsvpRow, b: RsvpRow) {
    const [houd, weg] = new Date(a.created_at) <= new Date(b.created_at) ? [a, b] : [b, a]
    setVoegtSamen(true)
    setSamenvoegFout(null)
    try {
      const res = await fetch("/api/gasten/samenvoegen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houd: houd.id, weg: weg.id }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; gast?: RsvpRow }
      if (!res.ok || !j.gast) throw new Error(j.error || "Samenvoegen mislukte")
      const samen = j.gast
      setRsvps((v) => v.filter((r) => r.id !== weg.id).map((r) => (r.id === houd.id ? { ...r, ...samen } : r)))
      setGekozen(new Set())
    } catch (e) {
      setSamenvoegFout(e instanceof Error ? e.message : "Samenvoegen mislukte")
    } finally {
      setVoegtSamen(false)
    }
  }

  // Een gast zijn persoonlijke link sturen via je eigen WhatsApp. Wij kunnen
  // niet namens jou versturen, en dat willen we ook niet: dit opent WhatsApp
  // met zijn gesprek open en het bericht klaar, jij drukt op versturen. Met de
  // persoonlijke link weten we wie reageert, en zijn naam staat er al. Daarna
  // zetten we hem en zijn huishouden op verstuurd, als dat nog niet zo was.
  async function stuurWhatsApp(row: RsvpRow, kaart: KaartRef) {
    setWhatsappVoor(null)
    const link = `${window.location.origin}/kaart/${kaart.share_token}?gast=${row.id}`
    const voornaam = row.voornaam || row.name.split(" ")[0]
    const tekst = encodeURIComponent(`Hoi ${voornaam}! Er is post voor je 💌\n${link}`)
    const nummer = whatsappNummer(row.telefoon)
    // Eerst openen, dan pas de server: anders houdt de browser het venster tegen.
    window.open(nummer ? `https://wa.me/${nummer}?text=${tekst}` : `https://wa.me/?text=${tekst}`, "_blank", "noopener,noreferrer")

    const product = kaart.type === "save_the_date" ? "std" : "inv"
    const kolom = product === "std" ? "std_status" : "inv_status"
    const kaartKolom = product === "std" ? "std_kaart_id" : "inv_kaart_id"
    const huis = row.huishouden_id ? rsvps.filter((r) => r.huishouden_id === row.huishouden_id) : [row]
    const ids = huis.filter((r) => reis(r[kolom]) === "niet_verstuurd").map((r) => r.id)
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/gasten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, product, waarde: "verstuurd", kaart_id: kaart.id }),
      })
      if (res.ok) {
        setRsvps((v) => v.map((r) => (ids.includes(r.id) ? { ...r, [kolom]: "verstuurd", [kaartKolom]: kaart.id } : r)))
      }
    } catch {}
  }

  function kiesWhatsApp(row: RsvpRow) {
    if (werkendeKaarten.length === 1) void stuurWhatsApp(row, werkendeKaarten[0])
    else setWhatsappVoor(row)
  }

  async function bewaarNieuw() {
    if (!nieuw || !bruiloftId || nieuwBezig) return
    if (!nieuw.voornaam.trim()) {
      setNieuwFout("Vul minstens een voornaam in.")
      return
    }
    setNieuwBezig(true)
    setNieuwFout(null)
    try {
      const res = await fetch("/api/gasten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: bruiloftId,
          gasten: [{
            voornaam: nieuw.voornaam,
            achternaam: nieuw.achternaam,
            email: nieuw.email,
            telefoon: nieuw.telefoon,
            guest_type: nieuw.type,
          }],
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; gasten?: RsvpRow[] }
      if (!res.ok) throw new Error(j.error || "Toevoegen mislukte")
      setRsvps((v) => [...v, ...(j.gasten ?? [])])
      // Meteen de volgende, met hetzelfde type: je voert meestal een hele
      // groep daggasten achter elkaar in.
      setNieuw({ ...LEGE_REGEL, type: nieuw.type })
      setNieuwTeller((n) => n + 1)
    } catch (e) {
      setNieuwFout(e instanceof Error ? e.message : "Toevoegen mislukte")
    } finally {
      setNieuwBezig(false)
    }
  }

  async function verwijderGekozen() {
    const ids = [...gekozen]
    for (const id of ids) {
      try {
        const res = await fetch(`/api/rsvp/${id}`, { method: "DELETE" })
        if (res.ok) setRsvps((prev) => prev.filter((r) => r.id !== id))
      } catch {}
    }
    setGekozen(new Set())
  }

  // Het bruidspaar schrijft zelf, wij versturen alleen wat het aanvinkt.
  async function stuurBericht() {
    if (!berichtSoort) return
    setBerichtBezig(true)
    setBerichtUitslag(null)
    try {
      const res = await fetch("/api/gasten/bericht", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...gekozen], soort: berichtSoort, bericht: berichtTekst }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; verstuurd?: number; zonderMail?: string[] }
      if (!res.ok) throw new Error(j.error || "Versturen mislukte")
      const zonder = j.zonderMail ?? []
      setBerichtUitslag(
        `${j.verstuurd ?? 0} bericht${(j.verstuurd ?? 0) === 1 ? "" : "en"} verstuurd.` +
          (zonder.length > 0
            ? ` Geen mailadres van: ${zonder.join(", ")}. Die kun je zelf een appje sturen.`
            : "")
      )
      setBerichtTekst("")
    } catch (e) {
      setBerichtUitslag(e instanceof Error ? e.message : "Versturen mislukte")
    } finally {
      setBerichtBezig(false)
    }
  }

  function buildExportRows() {
    const headers = [
      "Naam", "E-mail", "Adres", "Status", "Type", "Dieetwensen",
      ...(hasSong ? ["Song Request"] : []),
      ...(hasOvernachting ? ["Overnachting"] : []),
      ...(hasCustomAnswer ? ["Extra vraag 1"] : []),
      ...(hasCustomAnswer2 ? ["Extra vraag 2"] : []),
      "Berichtje", "Event", "Datum",
    ]
    const rows = rsvps.map((r) => [
      r.name, r.email ?? "", r.adres ?? "",
      // De reis is de waarheid, niet de oude attending-kolom: zonder antwoord
      // is het geen aanwezig.
      (() => {
        const k = komtGast(reis(r.std_status), reis(r.inv_status))
        return k === true ? "Aanwezig" : k === false ? "Afwezig" : "Nog niets gehoord"
      })(),
      r.guest_type, r.dietary ?? "",
      ...(hasSong ? [r.song ?? ""] : []),
      ...(hasOvernachting ? [r.overnachting === true ? "Ja" : r.overnachting === false ? "Nee" : ""] : []),
      ...(hasCustomAnswer ? [r.custom_answer === true ? "Ja" : r.custom_answer === false ? "Nee" : ""] : []),
      ...(hasCustomAnswer2 ? [r.custom_answer_2 === true ? "Ja" : r.custom_answer_2 === false ? "Nee" : ""] : []),
      r.message ?? "",
      eventMap[r.event_id] ?? r.event_id,
      new Date(r.created_at).toLocaleDateString("nl-NL"),
    ])
    return { headers, rows }
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function exportCsv() {
    const { headers, rows } = buildExportRows()
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), "gasten.csv")
  }

  async function exportExcel() {
    const { headers, rows } = buildExportRows()
    const XLSX = await laadXlsx()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1")
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
      if (cell) cell.s = { font: { bold: true } }
    }
    ws["!cols"] = headers.map((h, i) => ({
      wch: Math.min(Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2, 50),
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Gasten")
    XLSX.writeFile(wb, "gasten.xlsx")
  }

  // De lijst zelf, met het plusje eronder. Staat ook bij een lege lijst, want
  // daar begin je met het eerste plusje.
  const invoer = "w-full min-w-[90px] rounded-lg border bg-white px-2 py-1.5 text-sm focus:outline-none"
  const invoerStijl: React.CSSProperties = { borderColor: GOLD_LIGHT, color: CHARCOAL }
  function toetsNieuw(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); void bewaarNieuw() }
    if (e.key === "Escape") { setNieuw(null); setNieuwFout(null) }
  }
  const tabelBlok = (
    <div className="flex flex-col gap-3">
        {/* ── De lijst ──
            Een gewone tabel, één regel per persoon. Michiels wens van
            24 september 2026: naam, type, de Save the Date, de trouwkaart,
            mail en telefoon, zonder gekleurde kaders. Het huishouden staat
            niet meer als groep in beeld: het zijn mensen met elk hun eigen
            antwoord en dieetwensen. Onder water blijft het bestaan, zodat een
            persoonlijke link het hele gezin herkent. Klik op een kop om te
            sorteren. Wat er verder is (liedje, berichtje, eigen vragen) staat
            in het bewerkvenster en in de export. */}
        <div className="rounded-2xl overflow-x-auto" style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: "#fff" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${GOLD_LIGHT}`, backgroundColor: GOLD_BG }}>
                <th className="w-10 px-4 py-2.5 text-left">
                  <input
                    type="checkbox"
                    aria-label="Alles selecteren"
                    checked={alleIds.length > 0 && alleIds.every((id) => gekozen.has(id))}
                    onChange={(e) => kiesAlle(alleIds, e.target.checked)}
                    style={{ accentColor: GOLD, cursor: "pointer" }}
                  />
                </th>
                <SorteerKop sleutel="naam" sortering={sortering} zet={setSortering}>Naam</SorteerKop>
                <SorteerKop sleutel="type" sortering={sortering} zet={setSortering}>Type</SorteerKop>
                <SorteerKop sleutel="std" sortering={sortering} zet={setSortering}>Save the Date</SorteerKop>
                <SorteerKop sleutel="inv" sortering={sortering} zet={setSortering}>Trouwkaart</SorteerKop>
                <th className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: BODY }}>E-mail</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: BODY }}>Telefoon</th>
                {heeftDieet && <th className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: BODY }}>Dieetwensen</th>}
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {gesorteerd.map((row) => {
                const isDeleting = deletingId === row.id
                const confirmingDel = deleteConfirmId === row.id
                const dieet = [row.dietary, row.allergie].filter(Boolean).join(", ")
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-[#FCF9F2] ${isDeleting ? "opacity-40" : ""}`}
                    style={{ borderTop: `1px solid ${GOLD_LIGHT}66`, backgroundColor: gekozen.has(row.id) ? GOLD_BG : undefined }}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        aria-label={`${row.name} selecteren`}
                        checked={gekozen.has(row.id)}
                        onChange={() => wissel(row.id)}
                        style={{ accentColor: GOLD, cursor: "pointer" }}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ color: CHARCOAL }}>
                      <span className="font-medium">{row.name}</span>
                      {row.is_kind && (
                        <span className="ml-1.5 text-xs" style={{ color: SOFT }}>
                          ({row.leeftijd != null ? `${row.leeftijd} jaar` : "kind"})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: BODY }}>{TYPE_NAAM[row.guest_type] ?? row.guest_type}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ReisTekst waarde={reis(row.std_status)} />
                      {gekregen(row, "std") && <span className="block text-[11px]" style={{ color: SOFT }}>{gekregen(row, "std")}</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ReisTekst waarde={reis(row.inv_status)} />
                      {gekregen(row, "inv") && <span className="block text-[11px]" style={{ color: SOFT }}>{gekregen(row, "inv")}</span>}
                    </td>
                    <td className="px-3 py-2" style={{ color: BODY }}>{row.email || <span style={{ color: GOLD_LIGHT }}>—</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: BODY }}>{row.telefoon || <span style={{ color: GOLD_LIGHT }}>—</span>}</td>
                    {heeftDieet && (
                      <td className="px-3 py-2" style={{ color: BODY }}>{dieet || <span style={{ color: GOLD_LIGHT }}>—</span>}</td>
                    )}
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {confirmingDel ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => handleDelete(row.id)} className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Ja</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors" style={{ color: BODY }}>Nee</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            {werkendeKaarten.length > 0 && !row.is_kind && (
                              <button
                                onClick={() => kiesWhatsApp(row)}
                                title={`Stuur ${row.voornaam || row.name} een persoonlijke link via WhatsApp`}
                                aria-label={`Stuur ${row.name} een persoonlijke link via WhatsApp`}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "#25D366", background: "none", border: 0, cursor: "pointer" }}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 01-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.7 2.78a9.4 9.4 0 012.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0012.04.63C5.76.63.65 5.74.65 12.02c0 2 .52 3.96 1.52 5.69L.55 23.62l6.04-1.58a11.36 11.36 0 005.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(row)}
                              title="Bewerken"
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: GOLD_LIGHT }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(row.id)}
                              title="Verwijderen"
                              className="p-1.5 rounded-lg transition-colors text-red-300 hover:text-red-500"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                  </tr>
                )
              })}
              {nieuw && (
                <tr key={`nieuw-${nieuwTeller}`} style={{ borderTop: `1px solid ${GOLD_LIGHT}66`, backgroundColor: GOLD_BG }}>
                  <td className="px-4 py-2" />
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        value={nieuw.voornaam}
                        onChange={(e) => zetNieuw("voornaam", e.target.value)}
                        onKeyDown={toetsNieuw}
                        placeholder="Voornaam"
                        aria-label="Voornaam"
                        maxLength={80}
                        className={invoer}
                        style={invoerStijl}
                      />
                      <input
                        value={nieuw.achternaam}
                        onChange={(e) => zetNieuw("achternaam", e.target.value)}
                        onKeyDown={toetsNieuw}
                        placeholder="Achternaam"
                        aria-label="Achternaam"
                        maxLength={80}
                        className={invoer}
                        style={invoerStijl}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={nieuw.type}
                      onChange={(e) => zetNieuw("type", e.target.value)}
                      onKeyDown={toetsNieuw}
                      aria-label="Type gast"
                      className={invoer}
                      style={{ ...invoerStijl, cursor: "pointer" }}
                    >
                      {Object.entries(TYPE_NAAM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: SOFT }}>Niet verstuurd</td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: SOFT }}>Niet verstuurd</td>
                  <td className="px-3 py-2">
                    <input
                      type="email"
                      value={nieuw.email}
                      onChange={(e) => zetNieuw("email", e.target.value)}
                      onKeyDown={toetsNieuw}
                      placeholder="naam@voorbeeld.nl"
                      aria-label="E-mail"
                      maxLength={160}
                      className={invoer}
                      style={invoerStijl}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="tel"
                      value={nieuw.telefoon}
                      onChange={(e) => zetNieuw("telefoon", e.target.value)}
                      onKeyDown={toetsNieuw}
                      placeholder="06 12345678"
                      aria-label="Telefoon"
                      maxLength={32}
                      className={invoer}
                      style={invoerStijl}
                    />
                  </td>
                  {heeftDieet && <td className="px-3 py-2" />}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => void bewaarNieuw()}
                      disabled={nieuwBezig}
                      title="Bewaren (Enter)"
                      aria-label="Gast bewaren"
                      className="p-1.5 rounded-lg disabled:opacity-50"
                      style={{ color: "#047857", background: "none", border: 0, cursor: "pointer" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNieuw(null); setNieuwFout(null) }}
                      title="Sluiten (Escape)"
                      aria-label="Niet toevoegen"
                      className="p-1.5 rounded-lg"
                      style={{ color: SOFT, background: "none", border: 0, cursor: "pointer" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      {nieuwFout && <p className="m-0 text-sm font-semibold text-center" style={{ color: "#DC2626" }}>{nieuwFout}</p>}
      {!nieuw && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => { setNieuw({ ...LEGE_REGEL }); setNieuwFout(null) }}
            disabled={!bruiloftId}
            title={bruiloftId ? "Gast toevoegen" : "Bewaar eerst een ontwerp, dan weten we bij welke bruiloft je gasten horen"}
            aria-label="Gast toevoegen"
            className="w-11 h-11 rounded-full inline-flex items-center justify-center transition-transform hover:-translate-y-px disabled:opacity-40"
            /* Dezelfde kleur als de kop van de tabel: het hoort bij de lijst en
               schreeuwt niet (Michiel, 24 september 2026). */
            style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}`, cursor: bruiloftId ? "pointer" : "default" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      )}
    </div>
  )

  // Staat in beide toestanden, ook als de lijst nog leeg is: een gastenlijst
  // begint bij wie je uitnodigt, niet bij wie zich meldt.
  if (rsvps.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <GastenToevoegen events={events} bruikbaar={events.length > 0} />
        <p className="m-0 text-sm text-center" style={{ color: BODY }}>
          Nog geen gasten. Druk op het plusje om er een toe te voegen, of laat ze zichzelf invullen: wie jullie kaart
          opent kan daar meteen laten weten of hij erbij is.
        </p>
        {tabelBlok}
      </div>
    )
  }

  return (
    <>
      {whatsappVoor && (
        <WhatsAppKeuze
          gast={whatsappVoor}
          kaarten={werkendeKaarten}
          kies={(k) => void stuurWhatsApp(whatsappVoor, k)}
          sluit={() => setWhatsappVoor(null)}
        />
      )}
      <div className="flex flex-col gap-6">

        {/* KPI cards */}
        <div className={`grid gap-4 ${hasReceptiegasten ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
          <KpiCard label="Aanwezig"      value={attending.length}      accent="#10b981" />
          <KpiCard label="Afgemeld"      value={declined.length}       accent="#ef4444" />
          <KpiCard label="Daggasten"     value={daggasten}             accent={GOLD}    />
          <KpiCard label="Avondgasten"   value={avondgasten}           accent={CHARCOAL} />
          {hasReceptiegasten && <KpiCard label="Receptiegasten" value={receptiegasten} accent="#0d9488" />}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
            Gastenlijst
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {/* Het lijstje dat elke locatie vraagt: aantallen, dieetwensen en
                wie er blijft slapen, op een pagina die je kunt printen. */}
            {eventsMetGasten.map((e) => (
              <a
                key={e.id}
                href={`/print/gasten/${e.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: CHARCOAL, textDecoration: "none" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Voor de cateraar{eventsMetGasten.length > 1 ? `: ${e.title}` : ""}
              </a>
            ))}
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: BODY }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: GOLD }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel (.xlsx)
            </button>
          </div>
        </div>

        <GastenToevoegen events={events} bruikbaar={events.length > 0} />

        {/* ── Wat je met de aangevinkte regels kunt ──
            Verschijnt alleen als er iets gekozen is, zodat de lijst rustig
            blijft zolang je alleen kijkt. */}
        {gekozen.size > 0 && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {gekozen.size} {gekozen.size === 1 ? "gast" : "gasten"} geselecteerd
              </span>
              <button
                onClick={() => { setBerichtSoort("herinnering"); setBerichtTekst("We zijn benieuwd of je erbij bent. Laat je het ons even weten?"); setBerichtUitslag(null) }}
                className="text-sm font-semibold px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
              >
                Stuur een herinnering
              </button>
              <button
                onClick={() => { setBerichtSoort("wijziging"); setBerichtTekst("Er is iets veranderd aan onze trouwdag. Kijk je even?"); setBerichtUitslag(null) }}
                className="text-sm font-semibold px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
              >
                Laat weten dat er iets is veranderd
              </button>
              <button
                onClick={() => zetReis("std", "verstuurd")}
                disabled={berichtBezig}
                className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                title="Zet de Save the Date op verstuurd voor de aangevinkte gasten"
              >
                Save the Date verstuurd
              </button>
              {/* Meer dan één Save the Date (daggasten, avondgasten, een andere
                  taal)? Dan zeg je welke je stuurde; de lijst onthoudt het. */}
              {stdKaarten.length > 1 && (
                <select
                  value={stdKaart}
                  onChange={(e) => setStdKaart(e.target.value)}
                  aria-label="Welke Save the Date heb je gestuurd"
                  className="text-sm px-2 py-2 rounded-xl"
                  style={{ border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, backgroundColor: "#fff" }}
                >
                  {stdKaarten.map((k) => <option key={k.id} value={k.id}>{k.naam}</option>)}
                </select>
              )}
              <button
                onClick={() => zetReis("inv", "verstuurd")}
                disabled={berichtBezig}
                className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                title="Zet de uitnodiging op verstuurd voor de aangevinkte gasten"
              >
                Uitnodiging verstuurd
              </button>
              {invKaarten.length > 1 && (
                <select
                  value={invKaart}
                  onChange={(e) => setInvKaart(e.target.value)}
                  aria-label="Welke trouwkaart heb je gestuurd"
                  className="text-sm px-2 py-2 rounded-xl"
                  style={{ border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, backgroundColor: "#fff" }}
                >
                  {invKaarten.map((k) => <option key={k.id} value={k.id}>{k.naam}</option>)}
                </select>
              )}
              {gekozenRijen.length === 2 && (
                <button
                  onClick={() => void voegSamen(gekozenRijen[0], gekozenRijen[1])}
                  disabled={voegtSamen}
                  className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60"
                  style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                  title="Staat dezelfde gast er twee keer in? Dan worden het één regel, met de laatste antwoorden."
                >
                  {voegtSamen ? "Samenvoegen..." : "Samenvoegen"}
                </button>
              )}
              <button
                onClick={verwijderGekozen}
                className="text-sm font-semibold px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#fff", color: "#DC2626", border: "1px solid #fca5a5", cursor: "pointer" }}
              >
                Verwijderen
              </button>
              <button
                onClick={() => { setGekozen(new Set()); setBerichtSoort(null); setBerichtUitslag(null) }}
                className="text-sm font-semibold underline ml-auto"
                style={{ color: BODY, cursor: "pointer" }}
              >
                Selectie wissen
              </button>
            </div>

            {berichtSoort && (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={berichtTekst}
                  onChange={(e) => setBerichtTekst(e.target.value)}
                  maxLength={1000}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: GOLD_LIGHT, color: CHARCOAL }}
                  placeholder="Wat wil je ze laten weten?"
                />
                <p className="text-xs" style={{ color: BODY }}>
                  {berichtSoort === "herinnering"
                    ? "In de mail staat de link die ze eerder kregen, zodat ze alsnog kunnen reageren."
                    : "In de mail staat erbij dat hun aanmelding gewoon blijft staan en dat ze niets opnieuw hoeven in te vullen."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={stuurBericht}
                    disabled={berichtBezig || !berichtTekst.trim()}
                    className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
                    style={{ backgroundColor: CHARCOAL, color: IVORY_CARD, border: "none", cursor: "pointer" }}
                  >
                    {berichtBezig ? "Versturen..." : `Versturen naar ${gekozen.size}`}
                  </button>
                  <button
                    onClick={() => setBerichtSoort(null)}
                    className="text-sm font-semibold underline"
                    style={{ color: BODY, cursor: "pointer" }}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {berichtUitslag && (
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{berichtUitslag}</p>
            )}
          </div>
        )}

        {/* ── Lijken op dezelfde gast ──
            Wij voegen niet uit onszelf samen; we vragen het. */}
        {verdacht.length > 0 && (
          <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <p className="m-0 text-sm font-semibold" style={{ color: "#92400E" }}>
              {verdacht.length === 1 ? "Deze twee lijken dezelfde gast" : `${verdacht.length} keer lijken twee regels dezelfde gast`}
            </p>
            {verdacht.slice(0, 3).map(({ a, b, waarom }) => (
              <div key={paarSleutel(a.id, b.id)} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex-1 min-w-[220px]" style={{ color: CHARCOAL }}>
                  <b>{a.name}</b> en <b>{b.name}</b> <span style={{ color: BODY }}>({waarom})</span>
                </span>
                <button
                  onClick={() => void voegSamen(a, b)}
                  disabled={voegtSamen}
                  className="text-sm font-semibold px-3 py-1.5 rounded-xl disabled:opacity-60"
                  style={{ backgroundColor: CHARCOAL, color: IVORY, border: 0, cursor: "pointer" }}
                >
                  Samenvoegen
                </button>
                <button
                  onClick={() => tweeMensen(a.id, b.id)}
                  className="text-sm font-semibold px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                >
                  Nee, twee mensen
                </button>
              </div>
            ))}
            {verdacht.length > 3 && (
              <p className="m-0 text-xs" style={{ color: BODY }}>En nog {verdacht.length - 3}; die komen vanzelf in beeld als je deze afhandelt.</p>
            )}
            {samenvoegFout && <p className="m-0 text-sm font-semibold" style={{ color: "#DC2626" }}>{samenvoegFout}</p>}
            <p className="m-0 text-xs" style={{ color: BODY }}>
              Samenvoegen houdt de oudste regel, met de laatste antwoorden en aangevuld met wat er bij de andere stond.
            </p>
          </div>
        )}

        {/* ── Snel selecteren ──
            De herinnering gaat bijna altijd naar dezelfde groep: iedereen die
            nog niets heeft laten weten. Dat hoort één druk te zijn en niet
            veertig vinkjes. */}
        {alleIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: SOFT }}>
              Selecteer
            </span>
            <button
              onClick={() => { setGekozen(new Set(stilleIds)); setBerichtUitslag(null) }}
              disabled={stilleIds.length === 0}
              className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{
                backgroundColor: stilleIds.length ? GOLD_BG : "transparent",
                color: stilleIds.length ? CHARCOAL : SOFT,
                border: `1px solid ${GOLD_LIGHT}`,
                cursor: stilleIds.length ? "pointer" : "default",
              }}
            >
              Wie nog niet reageerde ({stilleIds.length})
            </button>
            <button
              onClick={() => { setGekozen(new Set(alleIds)); setBerichtUitslag(null) }}
              className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "transparent", color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
            >
              Iedereen ({alleIds.length})
            </button>
            {gekozen.size > 0 && (
              <button
                onClick={() => { setGekozen(new Set()); setBerichtSoort(null); setBerichtUitslag(null) }}
                className="text-sm underline"
                style={{ color: SOFT, cursor: "pointer" }}
              >
                Selectie wissen
              </button>
            )}
          </div>
        )}

        {tabelBlok}
      </div>

      {/* ── Edit modal ── */}
      {editingRow && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(14,12,9,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!saving) { setEditingRow(null); setEditForm(null) } }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: IVORY, border: `1px solid ${GOLD_LIGHT}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <h3
                className="text-xl"
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}
              >
                Gast bewerken
              </h3>
              <button
                onClick={() => { setEditingRow(null); setEditForm(null) }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: BODY }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 flex flex-col gap-5">

              <Field label="Naam">
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} style={inputStyle} />
              </Field>

              <Field label="E-mailadres">
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="(leeg)" className={inputCls} style={inputStyle} />
              </Field>

              <Field label="Status">
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((val) => (
                    <button
                      key={val} type="button"
                      onClick={() => setEditForm({ ...editForm, attending: val })}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        border: `2px solid ${editForm.attending === val ? (val === "yes" ? "#10b981" : "#ef4444") : GOLD_LIGHT}`,
                        backgroundColor: editForm.attending === val ? (val === "yes" ? "#ecfdf5" : "#fef2f2") : "white",
                        color: editForm.attending === val ? (val === "yes" ? "#065f46" : "#991b1b") : BODY,
                      }}
                    >
                      {val === "yes" ? "Aanwezig" : "Afwezig"}
                    </button>
                  ))}
                </div>
              </Field>

              {editForm.attending !== "no" && (
                <Field label="Type gast">
                  <div className="flex gap-2">
                    {["daggast", "avondgast", "receptiegast"].map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => setEditForm({ ...editForm, guest_type: t })}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: `2px solid ${editForm.guest_type === t ? GOLD : GOLD_LIGHT}`,
                          backgroundColor: editForm.guest_type === t ? GOLD_BG : "white",
                          color: editForm.guest_type === t ? CHARCOAL : BODY,
                        }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {editForm.attending !== "no" && (
                <Field label="Dieetwensen / Allergieën">
                  <input type="text" value={editForm.dietary} onChange={(e) => setEditForm({ ...editForm, dietary: e.target.value })} placeholder="—" className={inputCls} style={inputStyle} />
                </Field>
              )}

              {hasSong && editForm.attending !== "no" && (
                <Field label="Song request">
                  <input type="text" value={editForm.song} onChange={(e) => setEditForm({ ...editForm, song: e.target.value })} placeholder="—" className={inputCls} style={inputStyle} />
                </Field>
              )}

              {hasOvernachting && editForm.attending !== "no" && (
                <Field label="Overnachting">
                  <TriStateButtons value={editForm.overnachting} onChange={(v) => setEditForm({ ...editForm, overnachting: v })} />
                </Field>
              )}

              {hasCustomAnswer && editForm.attending !== "no" && (
                <Field label="Extra vraag 1">
                  <TriStateButtons value={editForm.custom_answer} onChange={(v) => setEditForm({ ...editForm, custom_answer: v })} />
                </Field>
              )}

              {hasCustomAnswer2 && editForm.attending !== "no" && (
                <Field label="Extra vraag 2">
                  <TriStateButtons value={editForm.custom_answer_2} onChange={(v) => setEditForm({ ...editForm, custom_answer_2: v })} />
                </Field>
              )}

              {editForm.attending === "no" && (
                <Field label="Berichtje">
                  <textarea rows={3} value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} placeholder="—" className={`${inputCls} resize-none`} style={inputStyle} />
                </Field>
              )}

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>

            <div className="px-7 py-5 flex gap-3" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
              <button
                onClick={() => { setEditingRow(null); setEditForm(null) }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: BODY, backgroundColor: "white" }}
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                style={{ backgroundColor: CHARCOAL, color: IVORY }}
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Sub-components ───────────────────────────────────────────────── */

function WhatsAppKeuze({
  gast,
  kaarten,
  kies,
  sluit,
}: {
  gast: RsvpRow
  kaarten: KaartRef[]
  kies: (k: KaartRef) => void
  sluit: () => void
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }}
      onClick={sluit}
      role="dialog"
      aria-modal="true"
      aria-label="Welke kaart stuur je?"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-3"
        style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="m-0 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Via WhatsApp</p>
        <h3 className="m-0" style={{ fontFamily: "var(--font-cormorant)", fontSize: 24, fontWeight: 600, color: CHARCOAL }}>
          Welke kaart stuur je {gast.voornaam || gast.name}?
        </h3>
        <p className="m-0 text-sm" style={{ color: BODY }}>
          WhatsApp opent met {whatsappNummer(gast.telefoon) ? "het gesprek met deze gast" : "de keuze aan wie je het stuurt"} en
          het bericht klaar. Jij drukt op versturen. De link is persoonlijk, dus zijn naam staat er al en je ziet precies
          wanneer hij reageert.
        </p>
        {kaarten.map((k) => (
          <button
            key={k.id}
            onClick={() => kies(k)}
            className="w-full text-left text-sm font-semibold px-4 py-3 rounded-xl"
            style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
          >
            {k.type === "save_the_date" ? "Save the Date" : "Trouwkaart"}
            <span className="font-normal" style={{ color: BODY }}> · {k.naam}</span>
          </button>
        ))}
        <button onClick={sluit} className="text-sm underline self-center mt-1" style={{ color: SOFT, background: "none", border: 0, cursor: "pointer" }}>
          Laat maar
        </button>
      </div>
    </div>,
    document.body,
  )
}

type Sortering = { sleutel: "naam" | "type" | "std" | "inv"; op: boolean }

interface NieuweRegel {
  voornaam: string
  achternaam: string
  type: string
  email: string
  telefoon: string
}
const LEGE_REGEL: NieuweRegel = { voornaam: "", achternaam: "", type: "daggast", email: "", telefoon: "" }

const TYPE_NAAM: Record<string, string> = {
  daggast: "Daggast",
  avondgast: "Avondgast",
  receptiegast: "Receptiegast",
}

/** De stand als gewone tekst: geen gekleurde kaders, alleen een kleur voor
 *  wie komt en wie niet. */
function ReisTekst({ waarde }: { waarde: Reis }) {
  const kleur = { ja: "#047857", nee: "#9A3412", verstuurd: CHARCOAL, niet_verstuurd: SOFT }[waarde]
  return (
    <span className={waarde === "ja" || waarde === "nee" ? "font-semibold" : ""} style={{ color: kleur }}>
      {REIS_LABEL[waarde]}
    </span>
  )
}

function SorteerKop({
  sleutel,
  sortering,
  zet,
  children,
}: {
  sleutel: Sortering["sleutel"]
  sortering: Sortering
  zet: (s: Sortering) => void
  children: React.ReactNode
}) {
  const aan = sortering.sleutel === sleutel
  return (
    <th className="px-3 py-2.5 text-left" aria-sort={aan ? (sortering.op ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => zet({ sleutel, op: aan ? !sortering.op : true })}
        className="text-xs font-semibold inline-flex items-center gap-1"
        style={{ color: aan ? CHARCOAL : BODY, background: "none", border: 0, padding: 0, cursor: "pointer" }}
      >
        {children}
        <span aria-hidden style={{ color: aan ? GOLD : GOLD_LIGHT }}>{aan ? (sortering.op ? "▲" : "▼") : "▲"}</span>
      </button>
    </th>
  )
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>{label}</span>
      {children}
    </label>
  )
}

function TriStateButtons({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false, null] as const).map((v) => (
        <button
          key={String(v)} type="button"
          onClick={() => onChange(v)}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            border: `2px solid ${value === v ? (v === true ? "#10b981" : v === false ? "#ef4444" : GOLD_LIGHT) : GOLD_LIGHT}`,
            backgroundColor: value === v ? (v === true ? "#ecfdf5" : v === false ? "#fef2f2" : GOLD_BG) : "white",
            color: value === v ? (v === true ? "#065f46" : v === false ? "#991b1b" : BODY) : BODY,
          }}
        >
          {v === true ? "Ja" : v === false ? "Nee" : "—"}
        </button>
      ))}
    </div>
  )
}

/**
 * Hoe ver een product staat bij deze gast. Vier standen: niet verstuurd,
 * verstuurd, komt, komt niet. Zie Reis in lib/gasten.ts.
 */



function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="rounded-2xl p-5 text-center"
      style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
    >
      <p className="text-3xl font-extrabold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: accent }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: BODY }}>{label}</p>
    </div>
  )
}
