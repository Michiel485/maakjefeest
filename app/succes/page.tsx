"use client"

import { Suspense } from "react"
import Link from "next/link"
import SuccesContent from "./succes-content"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"


function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg className="w-8 h-8 animate-spin" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  )
}

export default function SuccesPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: IVORY }}>
      <header
        className="relative z-10 flex items-center px-8 py-5 max-w-xl mx-auto"
        style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}
      >
        <Link
          href="/"
          className="tracking-wide transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 600, color: CHARCOAL }}
        >
          SayingYes
        </Link>
      </header>
      <Suspense fallback={<Spinner />}>
        <SuccesContent />
      </Suspense>
    </div>
  )
}
