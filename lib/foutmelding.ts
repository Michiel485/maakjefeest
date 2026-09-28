// Een mail naar de beheerder als er iets misgaat (28 september 2026).
//
// Er zijn geen automatische tests en er was geen melding bij fouten: ging er
// bij een klant iets mis, dan hoorde Michiel dat pas als de klant mailde.
// Drie bronnen komen hier samen:
// - server: elke fout die de server niet afvangt (instrumentation.ts)
// - browser: een pagina die vastloopt bij een bezoeker (app/api/fout)
// - stil: een fout die de code wel afvangt maar die niet had mogen gebeuren,
//   zoals een betaling of aanmelding die niet opgeslagen wordt
//
// Geen gastgegevens in de mail: alleen wat er misging, waar en wanneer. Het
// pad zonder zoekvraag, want daarin staan soms tokens van gasten.

import { sendFoutmeldingEmail } from "./mail"

export type FoutSoort = "server" | "browser" | "stil"

// Een rem, zodat één kapotte pagina geen honderd mails geeft. Per
// serverinstantie; op Vercel draaien er soms een paar tegelijk, dus het is een
// bovengrens bij benadering.
const laatst = new Map<string, number>()
const UUR = 60 * 60 * 1000
const MAX_PER_UUR = 10
let uurBegin = 0
let ditUur = 0

/** Alleen het pad, zonder zoekvraag of hekje */
export function kaalPad(pad: string | null | undefined): string {
  return (pad ?? "").split(/[?#]/)[0].slice(0, 200) || "(onbekend)"
}

function tekstVan(fout: unknown): { bericht: string; stapel: string | null } {
  if (fout instanceof Error) {
    return { bericht: fout.message.slice(0, 500), stapel: fout.stack?.split("\n").slice(0, 10).join("\n") ?? null }
  }
  if (fout && typeof fout === "object" && "message" in fout) {
    return { bericht: String((fout as { message: unknown }).message).slice(0, 500), stapel: null }
  }
  return { bericht: String(fout).slice(0, 500), stapel: null }
}

/**
 * Meldt een fout per mail. Gooit nooit: een melding mag de pagina of de route
 * nooit zelf laten mislukken.
 */
export async function meldFout(o: { soort: FoutSoort; waar: string; fout: unknown; pad?: string | null; extra?: string }): Promise<void> {
  try {
    const { bericht, stapel } = tekstVan(o.fout)
    const pad = kaalPad(o.pad)
    // Lokaal alleen in het log: anders mailt elke fout tijdens het bouwen
    if (process.env.NODE_ENV !== "production") {
      console.error(`[fout:${o.soort}] ${o.waar} ${pad}: ${bericht}`)
      return
    }
    const nu = Date.now()
    const sleutel = `${o.soort}|${o.waar}|${bericht.slice(0, 120)}`
    const vorige = laatst.get(sleutel)
    if (vorige && nu - vorige < UUR) return
    if (nu - uurBegin > UUR) {
      uurBegin = nu
      ditUur = 0
    }
    if (ditUur >= MAX_PER_UUR) return
    ditUur++
    if (laatst.size > 500) laatst.clear()
    laatst.set(sleutel, nu)

    const toEmail = process.env.ADMIN_EMAIL
    if (!toEmail) return
    await sendFoutmeldingEmail({
      toEmail,
      soort: o.soort,
      waar: o.waar,
      pad,
      bericht,
      stapel,
      extra: o.extra?.slice(0, 500) ?? null,
      tijd: new Date(nu),
    })
  } catch (e) {
    console.error("[foutmelding] kon niet melden:", e)
  }
}
