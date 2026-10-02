import type { Metadata } from "next"
import MeetStap from "@/components/marketing/MeetStap"

export const metadata: Metadata = {
  title: "Betaling geslaagd",
  robots: { index: false, follow: false },
}

export default function SuccesLayout({ children }: { children: React.ReactNode }) {
  return <><MeetStap naam="betaald" />{children}</>
}
