import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Website bouwen",
  robots: { index: false, follow: false },
}

export default function BouwenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
