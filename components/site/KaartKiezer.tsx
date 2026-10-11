"use client"

// Een plek kiezen op de kaart, voor de knop Open in Maps op de pagina
// Praktische informatie (Michiel, 11 oktober 2026). Tik op de kaart of sleep
// de speld; met het zoekveld spring je eerst naar het adres. De kaart komt van
// OpenStreetMap, het zoeken van Nominatim (ook OpenStreetMap). Alleen in de
// bouwer; gasten zien de kaart niet.

import { useEffect, useRef, useState } from "react"
import type { Map as LeafletMap, Marker } from "leaflet"
import "leaflet/dist/leaflet.css"

const SPELD = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42"><path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 41 15 41s14-15.7 14-26.1C29 7.2 22.7 1 15 1z" fill="#C5A059" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>`

async function zoek(adres: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=nl&q=${encodeURIComponent(adres)}`)
    if (!r.ok) return null
    const d = (await r.json()) as { lat: string; lon: string }[]
    return d[0] ? { lat: Number(d[0].lat), lng: Number(d[0].lon) } : null
  } catch {
    return null
  }
}

export default function KaartKiezer({
  lat,
  lng,
  adres,
  onKies,
}: {
  lat?: number | null
  lng?: number | null
  /** Om de kaart te beginnen bij het adres als er nog geen plek is */
  adres: string
  onKies: (lat: number, lng: number) => void
}) {
  const vak = useRef<HTMLDivElement>(null)
  const kaart = useRef<LeafletMap | null>(null)
  const speld = useRef<Marker | null>(null)
  const kies = useRef(onKies)
  kies.current = onKies
  const [zoekTekst, setZoekTekst] = useState(adres)
  const [melding, setMelding] = useState<string | null>(null)

  useEffect(() => {
    let weg = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (weg || !vak.current || kaart.current) return
      const icoon = L.divIcon({ html: SPELD, className: "", iconSize: [30, 42], iconAnchor: [15, 41] })
      const heeftPlek = typeof lat === "number" && typeof lng === "number"
      const m = L.map(vak.current, { zoomControl: true, attributionControl: true }).setView(heeftPlek ? [lat!, lng!] : [52.2, 5.3], heeftPlek ? 17 : 7)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(m)
      const zetSpeld = (la: number, ln: number) => {
        if (speld.current) speld.current.setLatLng([la, ln])
        else {
          speld.current = L.marker([la, ln], { icon: icoon, draggable: true }).addTo(m)
          speld.current.on("dragend", () => {
            const p = speld.current!.getLatLng()
            kies.current(p.lat, p.lng)
          })
        }
      }
      if (heeftPlek) zetSpeld(lat!, lng!)
      m.on("click", (e) => {
        zetSpeld(e.latlng.lat, e.latlng.lng)
        kies.current(e.latlng.lat, e.latlng.lng)
      })
      kaart.current = m
      // Nog geen plek: begin bij het adres
      if (!heeftPlek && adres.trim()) {
        const p = await zoek(adres)
        if (p && !weg) m.setView([p.lat, p.lng], 16)
      }
    })()
    return () => {
      weg = true
      kaart.current?.remove()
      kaart.current = null
      speld.current = null
    }
    // Alleen bij het openen; daarna bestuurt de kaart zichzelf
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function zoekAdres() {
    if (!zoekTekst.trim() || !kaart.current) return
    setMelding(null)
    const p = await zoek(zoekTekst)
    if (p) kaart.current.setView([p.lat, p.lng], 17)
    else setMelding("Dit adres is niet gevonden. Probeer het met straat en plaats.")
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={zoekTekst}
          onChange={(e) => setZoekTekst(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); zoekAdres() } }}
          placeholder="Zoek een adres"
          aria-label="Zoek een adres op de kaart"
          className="flex-1 min-w-0 rounded-xl border border-[var(--goud-licht)] px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)]"
        />
        <button type="button" onClick={zoekAdres} className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: "#C5A059" }}>
          Zoek
        </button>
      </div>
      {melding && <span className="text-[11px] text-red-500">{melding}</span>}
      <div ref={vak} className="w-full rounded-xl overflow-hidden border border-[var(--goud-licht)]" style={{ height: 260, zIndex: 0 }} />
      <span className="text-[11px] text-gray-400 leading-snug">Tik op de juiste plek, bijvoorbeeld de ingang, of sleep de speld.</span>
    </div>
  )
}
