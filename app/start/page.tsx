import type { Metadata } from "next"
import StartFlow from "./StartFlow"

export const metadata: Metadata = {
  title: "Gratis starten",
  robots: { index: false, follow: true },
}

// Gratis starten: een paar korte vragen en dan de bouwer in (28 september
// 2026). Was een pagina met drie pakketten; die keuze zit nu in stap vier.
export default function StartPage() {
  return <StartFlow />
}
