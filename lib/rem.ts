// Een simpele rem per IP, in het geheugen van deze serverinstantie.
//
// Niet waterdicht: Vercel draait meerdere instanties en het geheugen gaat leeg
// bij een koude start. Het doel is ook niet waterdicht zijn, maar het verschil
// tussen "iemand probeert wat" en "iemand laat een script duizend codes
// aflopen". Voor het echte werk zou hier een teller in de database of een
// dienst als Upstash moeten staan; zolang er nog geen klanten zijn is dit
// genoeg en kost het niets.

const emmers = new Map<string, number[]>()

/**
 * Registreert een poging en zegt of het er te veel zijn binnen het venster.
 * De sleutel bevat het doel, zodat een gast die een kaart opent geen rem zet
 * op iemand die een kortingscode intikt vanaf hetzelfde kantoornetwerk.
 */
export function teVeelPogingen(doel: string, ip: string, max: number, vensterMs = 60_000): boolean {
  const nu = Date.now()
  const sleutel = `${doel}:${ip}`
  const recent = (emmers.get(sleutel) ?? []).filter((t) => nu - t < vensterMs)
  recent.push(nu)
  emmers.set(sleutel, recent)

  // Af en toe opruimen, zodat de map niet oneindig groeit
  if (emmers.size > 5000) {
    for (const [k, v] of emmers) if (v.every((t) => nu - t >= vensterMs)) emmers.delete(k)
  }

  return recent.length > max
}

/** Het IP van de bezoeker, zoals Vercel het doorgeeft. */
export function bezoekerIp(request: Request): string {
  return (
    (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0"
  )
}
