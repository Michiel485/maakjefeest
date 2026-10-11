"use client"

// De tegel Route op de pagina Praktische informatie (Michiel, 11 oktober
// 2026): aan of uit, een eigen titel, adres en uitleg, en een precieze plek.
// Met een plek opent de knop Maps op dat punt. Zonder plek zoekt Maps op het
// adres, en dat kan verkeerd uitvallen.

import { useState } from "react"
import { mapsLink, plekUitTekst, type RouteInfo } from "@/components/PraktischPreview"

const invoer =
  "w-full rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"

export default function RouteEditor({
  route,
  locatie,
  onChange,
}: {
  route: RouteInfo
  locatie: string
  onChange: (route: RouteInfo) => void
}) {
  const aan = route.aan !== false
  const metPlek = typeof route.lat === "number" && typeof route.lng === "number"
  const [plakTekst, setPlakTekst] = useState("")
  const [plakFout, setPlakFout] = useState<string | null>(null)
  const zet = (patch: Partial<RouteInfo>) => onChange({ ...route, ...patch })

  function plak(tekst: string) {
    setPlakTekst(tekst)
    if (!tekst.trim()) { setPlakFout(null); return }
    const plek = plekUitTekst(tekst)
    if (plek) {
      zet({ lat: plek.lat, lng: plek.lng })
      setPlakTekst("")
      setPlakFout(null)
    } else if (/goo\.gl|maps\.app/i.test(tekst)) {
      setPlakFout("Een korte link bevat geen plek. Open de link in je browser en kopieer daarna de lange link uit de adresbalk.")
    } else {
      setPlakFout("Hier staat geen plek in. Plak coördinaten zoals 52.1208, 4.9731, of de lange link uit de adresbalk van Google Maps.")
    }
  }

  const link = mapsLink(route, locatie)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--goud-licht)] bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">Route</span>
        <button
          type="button"
          onClick={() => zet({ aan: !aan })}
          aria-label="Route op de pagina"
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${aan ? "bg-[#C5A059]" : "bg-gray-200"}`}
        >
          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${aan ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>

      {aan && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Titel</span>
            <input type="text" value={route.titel ?? ""} onChange={(e) => zet({ titel: e.target.value })} placeholder="Route" maxLength={40} className={invoer} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Adres</span>
            <textarea
              rows={2}
              value={route.adres ?? ""}
              onChange={(e) => zet({ adres: e.target.value })}
              placeholder={locatie || "Kasteel de Haar, Kasteellaan 1, Haarzuilens"}
              className={`${invoer} resize-none`}
            />
            <span className="text-[11px] text-gray-400 leading-snug">Leeg laten: dan staat de locatie van jullie bruiloft hier.</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Uitleg <span className="font-normal text-gray-400">(optioneel)</span></span>
            <textarea
              rows={3}
              value={route.tekst ?? ""}
              onChange={(e) => zet({ tekst: e.target.value })}
              placeholder="De ingang zit bij aankomst aan de linkerkant van het gebouw. Parkeren kan op het grasveld."
              maxLength={400}
              className={`${invoer} resize-none`}
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Precieze plek voor de knop Maps</span>
            {metPlek ? (
              <div className="flex flex-col gap-1.5 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--goud-vlak)" }}>
                <span className="text-xs text-gray-700">
                  Maps opent precies op deze plek: {route.lat!.toFixed(5)}, {route.lng!.toFixed(5)}
                </span>
                <div className="flex items-center gap-3">
                  {link && (
                    <a href={link} target="_blank" rel="noopener" className="text-xs font-semibold text-[#C5A059] hover:underline">
                      Controleer in Google Maps
                    </a>
                  )}
                  <button type="button" onClick={() => zet({ lat: null, lng: null })} className="text-xs font-semibold text-gray-400 hover:text-red-500">
                    Plek weghalen
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-gray-400 leading-snug">
                Nog geen plek: Maps zoekt op het adres. Kies een plek als Maps de verkeerde locatie geeft of als de ingang ergens anders is.
              </span>
            )}
            <input
              type="text"
              value={plakTekst}
              onChange={(e) => plak(e.target.value)}
              placeholder="Plak coördinaten of een link uit Google Maps"
              className={invoer}
              aria-label="Plek plakken"
            />
            {plakFout && <span className="text-[11px] text-red-500 leading-snug">{plakFout}</span>}
            <span className="text-[11px] text-gray-400 leading-snug">
              Tip: houd in Google Maps je vinger of muis op de juiste plek. Bovenaan verschijnen de coördinaten, die kun je kopiëren.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
