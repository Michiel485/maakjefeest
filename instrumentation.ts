import type { Instrumentation } from "next"

// Elke fout die de server niet zelf afvangt komt hier langs: pagina's,
// API-routes, server actions en proxy.ts. Die gaan als mail naar de beheerder
// (lib/foutmelding.ts, 28 september 2026).
export const onRequestError: Instrumentation.onRequestError = async (fout, verzoek, context) => {
  // Alleen op Node.js: de mailbibliotheek werkt niet in de edge-omgeving
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { meldFout } = await import("./lib/foutmelding")
    const digest = (fout as { digest?: string }).digest
    await meldFout({
      soort: "server",
      waar: `${context.routePath} (${context.routeType})`,
      pad: verzoek.path,
      fout,
      extra: `${verzoek.method}${digest ? ` · digest ${digest}` : ""}`,
    })
  }
}
