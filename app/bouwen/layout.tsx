import type { Metadata } from "next"
import MeetStap from "@/components/marketing/MeetStap"

export const metadata: Metadata = {
  title: "Website bouwen",
  robots: { index: false, follow: false },
}

export default function BouwenLayout({ children }: { children: React.ReactNode }) {
  return <><MeetStap naam="site-bouwer" />{children}</>
}
