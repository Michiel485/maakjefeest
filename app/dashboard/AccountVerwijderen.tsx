"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { wisBruiloftUitBrowser } from "@/lib/browser-opslag"

const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL = "#1A1A1A"
const BODY = "#5C5248"
const SOFT = "#9A8E82"
const RED = "#991B1B"
const RED_BG = "#FEF2F2"

// Je account verwijderen. Onopvallend onderaan het dashboard, zoals Michiel
// vroeg, want dit is geen knop waar je naartoe geleid wilt worden.
//
// Er zit een bevestiging voor waarin je je eigen mailadres moet typen. Niet
// omdat wij het niet weten, maar omdat je dan niet per ongeluk je hele bruiloft
// weggooit. Wat blijft staan, staat er ook bij: facturen hebben een wettelijke
// bewaarplicht van zeven jaar.

export default function AccountVerwijderen({
  email,
  aantalBruiloften,
}: {
  email: string
  aantalBruiloften: number
}) {
  const [open, setOpen] = useState(false)
  const [getypt, setGetypt] = useState("")
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const klaar = getypt.trim().toLowerCase() === email.toLowerCase()

  async function verwijder() {
    if (!klaar) return
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bevestig: getypt.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setFout(data.error ?? "Verwijderen mislukte, probeer het nog eens.")
        setBezig(false)
        return
      }
      // Uitloggen en naar de homepage. De sessie hoort niet te blijven hangen
      // op een account dat niet meer bestaat.
      try {
        await createClient().auth.signOut()
      } catch {}
      // Ook wat er in deze browser stond, zie lib/browser-opslag.ts.
      wisBruiloftUitBrowser()
      window.location.href = "/?verwijderd=1"
    } catch {
      setFout("Verwijderen mislukte, probeer het nog eens.")
      setBezig(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-12 pt-6" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
        <button
          onClick={() => { setOpen(true); setFout(null); setGetypt("") }}
          className="text-xs underline"
          style={{ color: SOFT, cursor: "pointer", background: "none", border: 0, padding: 0 }}
        >
          Account verwijderen
        </button>
      </div>
    )
  }

  return (
    <div
      className="mt-12 rounded-2xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: RED_BG, border: `1px solid ${RED}33` }}
    >
      <div>
        <p className="font-semibold m-0" style={{ color: CHARCOAL }}>
          Weet je het zeker?
        </p>
        <p className="text-sm mt-1 m-0 max-w-[68ch]" style={{ color: BODY }}>
          {aantalBruiloften === 0
            ? "Er staan geen bruiloften meer onder dit account. Je inlog wordt verwijderd."
            : aantalBruiloften === 1
              ? "Je bruiloft gaat weg, met je gastenlijst, je kaarten, je website en alle foto's die je gasten hebben geüpload."
              : `Je ${aantalBruiloften} bruiloften gaan weg, met je gastenlijsten, je kaarten, je websites en alle foto's die je gasten hebben geüpload.`}{" "}
          Dit kan niet ongedaan worden gemaakt en wij hebben geen kopie.
        </p>
        <p className="text-xs mt-2 m-0" style={{ color: SOFT }}>
          Je facturen blijven wel staan: daar zit een wettelijke bewaarplicht van zeven jaar op.
        </p>
      </div>

      <label className="flex flex-col gap-1.5 max-w-sm">
        <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>
          Typ <span style={{ fontFamily: "ui-monospace, monospace" }}>{email}</span> om te bevestigen
        </span>
        <input
          id="account-bevestig"
          value={getypt}
          onChange={(e) => setGetypt(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="text-sm px-3 py-2.5 rounded-xl"
          style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: "#fff", color: CHARCOAL }}
        />
      </label>

      {fout && (
        <p className="text-sm font-semibold m-0" style={{ color: RED }}>
          {fout}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void verwijder()}
          disabled={!klaar || bezig}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl"
          style={{
            backgroundColor: klaar ? RED : "#fff",
            color: klaar ? "#fff" : SOFT,
            border: `1px solid ${klaar ? RED : GOLD_LIGHT}`,
            cursor: klaar && !bezig ? "pointer" : "default",
          }}
        >
          {bezig ? "Verwijderen…" : "Definitief verwijderen"}
        </button>
        <button
          onClick={() => { setOpen(false); setGetypt(""); setFout(null) }}
          disabled={bezig}
          className="text-sm underline"
          style={{ color: SOFT, cursor: "pointer", background: "none", border: 0 }}
        >
          Laat maar
        </button>
      </div>
    </div>
  )
}
