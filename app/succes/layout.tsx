import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Betaling geslaagd",
  robots: { index: false, follow: false },
}

export default function SuccesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
