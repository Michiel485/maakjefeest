import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Betalen",
  robots: { index: false, follow: false },
}

export default function BetalenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
