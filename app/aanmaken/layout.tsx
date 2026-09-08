import type { Metadata } from "next"
import { MARKETING_URL } from "@/lib/site-url"

export const metadata: Metadata = {
  // De root-layout voegt zelf " | SayingYes" toe
  title: "Gratis bruiloftswebsite starten",
  description: "Maak gratis een account aan en start direct met het bouwen van jullie digitale bruiloftswebsite. In minuten online.",
  alternates: { canonical: `${MARKETING_URL}/aanmaken` },
  openGraph: {
    title: "Gratis bruiloftswebsite starten | SayingYes",
    description: "Maak gratis een account aan en start direct met het bouwen van jullie digitale bruiloftswebsite.",
    url: `${MARKETING_URL}/aanmaken`,
  },
}

export default function AanmakenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
