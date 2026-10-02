import type { Metadata } from "next"
import MeetStap from "@/components/marketing/MeetStap"

export const metadata: Metadata = {
  title: "Kaart ontwerpen",
  robots: { index: false, follow: false },
}

export default function KaartMakenLayout({ children }: { children: React.ReactNode }) {
  return <><MeetStap naam="kaart-bouwer" />{children}</>
}
