import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gratis bruiloftswebsite starten",
  description: "Maak gratis een account aan en start direct met het bouwen van jullie digitale bruiloftswebsite. In minuten online.",
  alternates: { canonical: "https://sayingyes.nl/aanmaken" },
  openGraph: {
    title: "Gratis bruiloftswebsite starten — SayingYes",
    description: "Maak gratis een account aan en start direct met het bouwen van jullie digitale bruiloftswebsite.",
    url: "https://sayingyes.nl/aanmaken",
  },
}

export default function AanmakenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
