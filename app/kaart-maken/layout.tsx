import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kaart ontwerpen",
  robots: { index: false, follow: false },
}

export default function KaartMakenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
