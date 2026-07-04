"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const STORAGE_KEY = "cookie_consent"

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  function choose(value: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, value)
    window.dispatchEvent(new Event("cookie-consent-updated"))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-xl rounded-2xl px-5 py-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ background: "#FFFDF9", border: "1px solid #E8D5A3" }}
      >
        <p className="flex-1 text-sm leading-relaxed" style={{ color: "#5C5248" }}>
          ✨ Mag ik bijhouden hoe jullie de site vinden? Zo kan ik{" "}
          <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "#C5A059" }}>SayingYes</span>{" "}
          steeds beter maken.{" "}
          <Link href="/privacy#cookies" className="underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity text-xs">
            Meer info
          </Link>
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => choose("accepted")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "#C5A059", color: "#fff", boxShadow: "0 2px 10px rgba(197,160,89,0.35)" }}
          >
            Ja, prima!
          </button>
          <button
            onClick={() => choose("declined")}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "#9A8E82" }}
          >
            Nee, liever niet
          </button>
        </div>
      </div>
    </div>
  )
}
