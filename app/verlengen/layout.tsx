import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Abonnement verlengen",
  robots: { index: false, follow: false },
}

export default function VerlengenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
