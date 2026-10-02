"use client"

// De bouwer voor Ons verhaal in momenten (lib/verhaal.ts): een uitgelichte
// zin, en per moment een jaar of woord, een kopje, een foto en een paar
// zinnen. Hoogstens zes; een trouwverhaal heeft er meestal drie.

import { useRef, useState } from "react"
import { MAX_MOMENTEN, verhaalMomenten, verhaalQuote, type Moment } from "@/lib/verhaal"

const invoer =
  "w-full rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"

// Als voorbeeld in de lege velden, nooit als ingevulde tekst: wat er staat
// moet van het bruidspaar zelf zijn (Michiel, 2 oktober 2026)
const VOORBEELDEN: Partial<Moment>[] = [
  { jaar: "2016", titel: "Hoe we elkaar leerden kennen", tekst: "Op een feestje van een gezamenlijke vriend. Hij was te laat, zij vergaf het hem na één drankje." },
  { jaar: "2020", titel: "Samen wonen", tekst: "Een huis met een hond en een moestuin die nooit iets opleverde." },
  { jaar: "2025", titel: "Het aanzoek", tekst: "Op het strand, met zand in de ring." },
  { jaar: "Nu", titel: "Wij gaan trouwen", tekst: "En dat vieren we het liefst met jullie erbij." },
]

export default function MomentenEditor({
  content,
  onChange,
  upload,
}: {
  content: Record<string, unknown> | undefined
  onChange: (content: Record<string, unknown>) => void
  upload: (file: File) => Promise<string>
}) {
  const momenten = verhaalMomenten(content)
  const quote = verhaalQuote(content)
  const [blobs, setBlobs] = useState<Record<string, string>>({})
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const bestand = useRef<HTMLInputElement>(null)
  const voorId = useRef<string | null>(null)

  // Het oude verhaal (text, image_url) gaat mee als eerste moment en de oude
  // velden gaan weg, zodat er maar één waarheid is
  const schrijf = (nieuw: Moment[], extra: Record<string, unknown> = {}) => {
    const { text: _t, image_url: _i, image_pos_x: _x, image_pos_y: _y, show_overlay: _o, ...rest } = content ?? {}
    void _t; void _i; void _x; void _y; void _o
    onChange({ ...rest, ...extra, momenten: nieuw })
  }
  const zet = (id: string, patch: Partial<Moment>) => schrijf(momenten.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const voegToe = () => {
    if (momenten.length >= MAX_MOMENTEN) return
    schrijf([...momenten, { id: crypto.randomUUID(), jaar: "", titel: "", tekst: "", image_url: null, image_pos_x: 50, image_pos_y: 50 }])
  }
  const weg = (id: string) => schrijf(momenten.filter((m) => m.id !== id))
  const verplaats = (i: number, richting: -1 | 1) => {
    const j = i + richting
    if (j < 0 || j >= momenten.length) return
    const n = momenten.slice()
    ;[n[i], n[j]] = [n[j], n[i]]
    schrijf(n)
  }

  async function kiesFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    const id = voorId.current
    voorId.current = null
    if (!file || !id) return
    if (file.size > 10 * 1024 * 1024) { setFout("De foto is groter dan 10 MB."); return }
    setFout(null)
    const blob = URL.createObjectURL(file)
    setBlobs((b) => ({ ...b, [id]: blob }))
    setBezig(id)
    try {
      const url = await upload(file)
      zet(id, { image_url: url })
    } catch {
      setFout("Upload mislukt. Controleer je verbinding en probeer het opnieuw.")
    } finally {
      URL.revokeObjectURL(blob)
      setBlobs((b) => { const { [id]: _weg, ...rest } = b; void _weg; return rest })
      setBezig(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-600">Eén zin die eruit springt <span className="font-normal text-gray-400">(optioneel)</span></span>
        <input
          id="onsverhaal-quote"
          type="text"
          value={quote}
          onChange={(e) => schrijf(momenten, { quote: e.target.value })}
          placeholder="Ze zei ja voordat hij was uitgepraat."
          maxLength={140}
          className={invoer}
        />
      </label>

      {fout && <p className="text-xs text-red-500">{fout}</p>}

      {momenten.map((m, i) => {
        const foto = blobs[m.id] ?? m.image_url
        return (
          <div key={m.id} id={`onsverhaal-moment-${m.id}`} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Moment {i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => verplaats(i, -1)} disabled={i === 0} aria-label="Omhoog" className="text-gray-300 hover:text-gray-600 disabled:opacity-30 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button type="button" onClick={() => verplaats(i, 1)} disabled={i === momenten.length - 1} aria-label="Omlaag" className="text-gray-300 hover:text-gray-600 disabled:opacity-30 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button type="button" onClick={() => weg(m.id)} aria-label="Moment verwijderen" className="text-gray-300 hover:text-red-500 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            {/* Het kopje kreeg w-full naast het jaar en stak zo buiten het
                paneel (Michiel, 2 oktober 2026): flex-1 met min-w-0 */}
            <div className="flex gap-2">
              <input type="text" value={m.jaar ?? ""} onChange={(e) => zet(m.id, { jaar: e.target.value })} placeholder={VOORBEELDEN[i]?.jaar ?? "2016"} maxLength={24} className={`${invoer} w-20 flex-shrink-0`} aria-label="Jaar of woord" />
              <input type="text" value={m.titel ?? ""} onChange={(e) => zet(m.id, { titel: e.target.value })} placeholder={VOORBEELDEN[i]?.titel ?? "Een kopje"} maxLength={60} className={`${invoer} flex-1 min-w-0`} aria-label="Kopje" />
            </div>
            <textarea
              id={`onsverhaal-moment-${m.id}-tekst`}
              rows={3}
              value={m.tekst}
              onChange={(e) => zet(m.id, { tekst: e.target.value })}
              placeholder={VOORBEELDEN[i]?.tekst ?? "Een paar zinnen over dit moment."}
              className={`${invoer} resize-none`}
            />
            {foto ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="" className={`w-16 h-12 rounded-lg object-cover ${bezig === m.id ? "opacity-50" : ""}`} />
                {bezig === m.id ? (
                  <span className="text-xs text-gray-400">Uploaden...</span>
                ) : (
                  <button type="button" onClick={() => zet(m.id, { image_url: null })} className="text-xs font-semibold text-gray-400 hover:text-red-500">Foto verwijderen</button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { voorId.current = m.id; bestand.current?.click() }}
                disabled={bezig !== null}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-3 text-gray-400 hover:border-[var(--goud)] hover:text-[var(--goud)] disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Foto bij dit moment
              </button>
            )}
          </div>
        )
      })}

      {momenten.length === 0 && (
        <div className="rounded-xl px-3.5 py-3 text-xs leading-relaxed" style={{ backgroundColor: "var(--goud-vlak)", color: "#6B5F52" }}>
          <p className="m-0 font-semibold mb-1.5" style={{ color: "#3F3730" }}>Bijvoorbeeld</p>
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {VOORBEELDEN.map((v) => (
              <li key={v.jaar} className="flex gap-2">
                <span className="font-semibold shrink-0 w-8" style={{ color: "var(--goud)" }}>{v.jaar}</span>
                <span>{v.titel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {momenten.length < MAX_MOMENTEN && (
        <button
          type="button"
          onClick={voegToe}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold border-2 border-dashed border-[var(--goud-licht)] rounded-xl py-3 text-[var(--goud)] hover:bg-[var(--goud-vlak)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          {momenten.length === 0 ? "Eerste moment toevoegen" : "Nog een moment"}
        </button>
      )}
      <p className="text-[11px] text-gray-400 leading-snug">Een jaar of een woord, een kopje en een paar zinnen. Drie of vier momenten is meestal genoeg.</p>
      <input ref={bestand} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={kiesFoto} />
    </div>
  )
}
