// Welke secties er echt staan. Een lege sectie hoort niet op de echte site:
// eerst zag een gast daar "Schrijf jullie verhaal in de sidebar..." of
// "Informatie over de ceremoniemeesters volgt binnenkort" (Michiel, 2 oktober
// 2026). Praktische info, cadeautips en aanmelden hebben altijd inhoud, want
// die vallen terug op de voorbeelden uit de bouwer.

export function sectieHeeftInhoud(type: string, content: unknown): boolean {
  const c = (content && typeof content === "object" ? content : {}) as Record<string, unknown>
  switch (type) {
    case "OnsVerhaal":
      return (typeof c.text === "string" && c.text.trim().length > 0) || (typeof c.image_url === "string" && c.image_url.length > 0)
    case "Programma": {
      const items = Array.isArray(c.items) ? (c.items as { time?: string; title?: string; description?: string }[]) : []
      return items.some((it) => (it.title ?? "").trim() || (it.description ?? "").trim())
    }
    case "Ceremoniemeesters": {
      const masters = Array.isArray(c.masters) ? (c.masters as { naam?: string; foto_url?: string | null }[]) : []
      return masters.some((m) => (m.naam ?? "").trim() || m.foto_url)
    }
    case "Fotos": {
      const urls = Array.isArray(c.urls) ? (c.urls as string[]) : []
      return urls.length > 0
    }
    default:
      return true
  }
}
