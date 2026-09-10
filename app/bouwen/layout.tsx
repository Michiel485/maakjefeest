import type { Metadata } from "next"

export const metadata: Metadata = {
  // Bij een kaartpakket zet de bouwer zelf een passende titel (zie page.tsx)
  title: "Ontwerpen",
  robots: { index: false, follow: false },
}

export default function BouwenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
