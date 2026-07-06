"use client"

import { useState } from "react"
import {
  CARD_TEMPLATE_LABEL,
  CARD_TYPE_LABEL,
  GUEST_TYPE_LABEL,
  type CardContent,
  type CardGuestType,
  type CardRow,
  type CardTemplate,
  type CardType,
} from "@/lib/cards"

const GUEST_TYPE_OPTIONS: { value: CardGuestType | ""; label: string }[] = [
  { value: "", label: "Geen vermelding" },
  { value: "daggast", label: "Daggasten" },
  { value: "avondgast", label: "Avondgasten" },
  { value: "receptiegast", label: "Receptiegasten" },
]

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"

const BASE_URL = process.env.NODE_ENV === "production" ? "https://sayingyes.nl" : ""

export interface CardEventRef {
  id: string
  title: string
  status: string
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none transition-all"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

interface EditForm {
  names: string
  dateText: string
  location: string
  message: string
  photoUrl: string
  template: CardTemplate
  guestType: CardGuestType | ""
}

export default function CardsSection({
  events,
  cards: initialCards,
}: {
  events: CardEventRef[]
  cards: CardRow[]
}) {
  const [cards, setCards] = useState<CardRow[]>(initialCards)
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [newType, setNewType] = useState<CardType>("save_the_date")
  const [newTemplate, setNewTemplate] = useState<CardTemplate>("klassiek")
  const [newGuestType, setNewGuestType] = useState<CardGuestType | "">("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<CardRow | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  async function createCard(eventId: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          type: newType,
          template: newTemplate,
          guest_type: newType === "trouwkaart" && newGuestType ? newGuestType : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const { card } = (await res.json()) as { card: CardRow }
      setCards((prev) => [card, ...prev])
      setCreatingFor(null)
    } catch {
      setError("Kaart aanmaken mislukt — probeer opnieuw.")
    } finally {
      setBusy(false)
    }
  }

  function openEdit(card: CardRow) {
    setEditingCard(card)
    setEditForm({
      names: card.content.names ?? "",
      dateText: card.content.dateText ?? "",
      location: card.content.location ?? "",
      message: card.content.message ?? "",
      photoUrl: card.content.photoUrl ?? "",
      template: card.template,
      guestType: card.content.guestType ?? "",
    })
    setError(null)
  }

  async function saveEdit() {
    if (!editingCard || !editForm) return
    setBusy(true)
    setError(null)
    try {
      const content: CardContent = {
        names: editForm.names || undefined,
        dateText: editForm.dateText || undefined,
        location: editForm.location || undefined,
        message: editForm.message || undefined,
        photoUrl: editForm.photoUrl || undefined,
        guestType: editForm.guestType || undefined,
      }
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, template: editForm.template }),
      })
      if (!res.ok) throw new Error()
      setCards((prev) =>
        prev.map((c) =>
          c.id === editingCard.id ? { ...c, content, template: editForm.template } : c
        )
      )
      setEditingCard(null)
      setEditForm(null)
    } catch {
      setError("Opslaan mislukt — probeer opnieuw.")
    } finally {
      setBusy(false)
    }
  }

  async function deleteCard(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/cards/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setCards((prev) => prev.filter((c) => c.id !== id))
      setDeleteConfirmId(null)
    } catch {
      setError("Verwijderen mislukt — probeer opnieuw.")
    } finally {
      setBusy(false)
    }
  }

  function copyLink(card: CardRow) {
    const url = `${BASE_URL || window.location.origin}/kaart/${card.share_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(card.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function whatsappUrl(card: CardRow) {
    const url = `${BASE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/kaart/${card.share_token}`
    return `https://wa.me/?text=${encodeURIComponent(`Er is post voor je 💌 ${url}`)}`
  }

  return (
    <div className="flex flex-col gap-6">
      {events.map((event) => {
        const eventCards = cards.filter((c) => c.event_id === event.id)
        const creating = creatingFor === event.id
        return (
          <div
            key={event.id}
            className="rounded-2xl p-5 md:p-6 flex flex-col gap-4"
            style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: CHARCOAL }}>{event.title}</p>
                <p className="text-xs mt-0.5" style={{ color: BODY }}>
                  {eventCards.length === 0
                    ? "Nog geen kaarten — maak een Save the Date of trouwkaart"
                    : `${eventCards.length} ${eventCards.length === 1 ? "kaart" : "kaarten"}`}
                  {event.status === "draft" && (
                    <span style={{ color: GOLD }}>
                      {" "}· Ook voor dit concept: verstuur je Save the Date alvast, de site-knoppen verschijnen zodra jullie site live is
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => { setCreatingFor(creating ? null : event.id); setError(null) }}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 flex-shrink-0"
                style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}
              >
                {creating ? "Annuleren" : "+ Nieuwe kaart"}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Nieuwe kaart */}
            {creating && (
              <div
                className="rounded-xl p-4 flex flex-col gap-4"
                style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Soort kaart</span>
                  <div className="flex gap-2">
                    {(Object.keys(CARD_TYPE_LABEL) as CardType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: `2px solid ${newType === t ? GOLD : GOLD_LIGHT}`,
                          backgroundColor: newType === t ? "white" : "transparent",
                          color: newType === t ? CHARCOAL : BODY,
                          cursor: "pointer",
                        }}
                      >
                        {CARD_TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Ontwerp</span>
                  <div className="flex gap-2">
                    {(Object.keys(CARD_TEMPLATE_LABEL) as CardTemplate[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewTemplate(t)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: `2px solid ${newTemplate === t ? GOLD : GOLD_LIGHT}`,
                          backgroundColor: newTemplate === t ? "white" : "transparent",
                          color: newTemplate === t ? CHARCOAL : BODY,
                          cursor: "pointer",
                        }}
                      >
                        {CARD_TEMPLATE_LABEL[t]}
                        <span className="block text-xs font-normal" style={{ color: BODY }}>
                          {t === "klassiek" ? "elegant, alleen tekst" : "met jullie foto bovenaan"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {newType === "trouwkaart" && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                      Voor wie is deze kaart?
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {GUEST_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value || "geen"}
                          onClick={() => setNewGuestType(opt.value)}
                          className="flex-1 min-w-[45%] sm:min-w-0 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            border: `2px solid ${newGuestType === opt.value ? GOLD : GOLD_LIGHT}`,
                            backgroundColor: newGuestType === opt.value ? "white" : "transparent",
                            color: newGuestType === opt.value ? CHARCOAL : BODY,
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: BODY, opacity: 0.8 }}>
                      Tip: maak per gastengroep een eigen kaart en stuur elke groep de juiste link —
                      op de kaart staat dan bijvoorbeeld &quot;wij nodigen je uit voor het avondfeest&quot;.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => createCard(event.id)}
                  disabled={busy}
                  className="py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ backgroundColor: GOLD, color: "white", border: "none", cursor: "pointer" }}
                >
                  {busy ? "Bezig..." : "Kaart aanmaken"}
                </button>
              </div>
            )}

            {/* Bestaande kaarten */}
            {eventCards.map((card) => (
              <div
                key={card.id}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ backgroundColor: "white", border: `1px solid ${GOLD_LIGHT}` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}
                    >
                      {CARD_TYPE_LABEL[card.type]}
                    </span>
                    {card.type === "trouwkaart" && card.content.guestType && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                      >
                        {GUEST_TYPE_LABEL[card.content.guestType]}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: BODY }}>
                      {CARD_TEMPLATE_LABEL[card.template]}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: BODY }}>
                    👁 {card.view_count}× bekeken
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyLink(card)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: copiedId === card.id ? "#ecfdf5" : GOLD_BG, color: copiedId === card.id ? "#065f46" : CHARCOAL, border: `1px solid ${copiedId === card.id ? "#10b981" : GOLD_LIGHT}`, cursor: "pointer" }}
                  >
                    {copiedId === card.id ? "✓ Gekopieerd" : "🔗 Kopieer link"}
                  </button>
                  <a
                    href={whatsappUrl(card)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "#dcf8c6", color: "#075e54", border: "1px solid #b8e0a8", textDecoration: "none" }}
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`/kaart/${card.share_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}
                  >
                    Bekijken
                  </a>
                  <a
                    href={`/kaart/${card.share_token}/afbeelding`}
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}
                  >
                    ⬇ Afbeelding
                  </a>
                  <button
                    onClick={() => openEdit(card)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                  >
                    ✏️ Bewerken
                  </button>
                  {deleteConfirmId === card.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => deleteCard(card.id)}
                        disabled={busy}
                        className="text-xs font-semibold px-3 py-2 rounded-lg text-red-500 hover:bg-red-50"
                        style={{ border: "1px solid #fca5a5", cursor: "pointer", backgroundColor: "white" }}
                      >
                        Definitief verwijderen
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs font-semibold px-3 py-2 rounded-lg"
                        style={{ color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer", backgroundColor: "white" }}
                      >
                        Nee
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(card.id)}
                      className="text-xs font-semibold px-3 py-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                      style={{ border: "1px solid #fecaca", cursor: "pointer", backgroundColor: "white" }}
                    >
                      Verwijderen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* ── Bewerk-modal ── */}
      {editingCard && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(14,12,9,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!busy) { setEditingCard(null); setEditForm(null) } }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: IVORY, border: `1px solid ${GOLD_LIGHT}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <h3 className="text-xl" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}>
                {CARD_TYPE_LABEL[editingCard.type]} bewerken
              </h3>
              <button
                onClick={() => { setEditingCard(null); setEditForm(null) }}
                className="p-1.5 rounded-lg"
                style={{ color: BODY, background: "none", border: "none", cursor: "pointer" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 flex flex-col gap-5">
              <p className="text-xs" style={{ color: BODY }}>
                Lege velden worden automatisch ingevuld vanuit jullie website (namen, datum, locatie).
              </p>

              <Field label="Namen">
                <input type="text" value={editForm.names} onChange={(e) => setEditForm({ ...editForm, names: e.target.value })} placeholder="Bijv. Anna & Tom" className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Datumtekst">
                <input type="text" value={editForm.dateText} onChange={(e) => setEditForm({ ...editForm, dateText: e.target.value })} placeholder="Bijv. 12 september 2026" className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Locatie">
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="Bijv. Kasteel Duivenvoorde" className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Tekst op de kaart">
                <textarea rows={3} value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} className={`${inputCls} resize-none`} style={inputStyle} />
              </Field>
              <Field label="Ontwerp">
                <div className="flex gap-2">
                  {(Object.keys(CARD_TEMPLATE_LABEL) as CardTemplate[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, template: t })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        border: `2px solid ${editForm.template === t ? GOLD : GOLD_LIGHT}`,
                        backgroundColor: editForm.template === t ? GOLD_BG : "white",
                        color: editForm.template === t ? CHARCOAL : BODY,
                        cursor: "pointer",
                      }}
                    >
                      {CARD_TEMPLATE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </Field>
              {editForm.template === "foto" && (
                <Field label="Foto-URL (leeg = de foto van jullie site)">
                  <input type="text" value={editForm.photoUrl} onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })} placeholder="https://..." className={inputCls} style={inputStyle} />
                </Field>
              )}
              {editingCard.type === "trouwkaart" && (
                <Field label="Voor wie is deze kaart?">
                  <div className="flex flex-wrap gap-2">
                    {GUEST_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value || "geen"}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, guestType: opt.value })}
                        className="flex-1 min-w-[45%] sm:min-w-0 py-2 px-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: `2px solid ${editForm.guestType === opt.value ? GOLD : GOLD_LIGHT}`,
                          backgroundColor: editForm.guestType === opt.value ? GOLD_BG : "white",
                          color: editForm.guestType === opt.value ? CHARCOAL : BODY,
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="px-7 py-5 flex gap-3" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
              <button
                onClick={() => { setEditingCard(null); setEditForm(null) }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: BODY, backgroundColor: "white", cursor: "pointer" }}
              >
                Annuleren
              </button>
              <button
                onClick={saveEdit}
                disabled={busy}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}
              >
                {busy ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
