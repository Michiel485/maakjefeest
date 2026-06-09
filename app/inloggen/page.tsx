"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

const GOLD     = "#C5A059"
const IVORY    = "#FAF7F2"
const CHARCOAL = "#1A1A1A"
const BODY     = "#5C5248"

export default function InloggenPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) router.replace("/dashboard")
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      setError("Dit e-mailadres is nog niet bij ons bekend. Controleer op typefouten of start een nieuwe website via de homepage!")
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: IVORY }}>
        <div className="rounded-3xl shadow-xl p-10 max-w-md w-full text-center" style={{ backgroundColor: "#ffffff" }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${GOLD}18` }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: GOLD }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: CHARCOAL }}>Controleer je e-mail</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: BODY }}>
            We hebben een inloglink gestuurd naar{" "}
            <strong style={{ color: CHARCOAL }}>{email}</strong>. Klik op de link in de e-mail om in te loggen.
          </p>
          <button
            onClick={() => { setSent(false); setEmail("") }}
            className="text-sm hover:underline transition-colors"
            style={{ color: GOLD }}
          >
            Ander e-mailadres proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: IVORY }}>
      <div className="rounded-3xl shadow-xl p-10 max-w-md w-full" style={{ backgroundColor: "#ffffff" }}>
        <Link
          href="/"
          className="text-lg font-bold tracking-tight block mb-8"
          style={{ color: CHARCOAL, fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.25rem" }}
        >
          Saying Yes
        </Link>

        <h1 className="text-2xl font-extrabold mb-2" style={{ color: CHARCOAL }}>Inloggen</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: BODY }}>
          Vul je e-mailadres in. We sturen je een magische link om in te loggen — geen wachtwoord nodig.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: CHARCOAL }}>
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                border: `1px solid #E8D5A3`,
                color: CHARCOAL,
                backgroundColor: "#fff",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E8D5A3")}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl transition-colors text-sm"
            style={{
              backgroundColor: loading ? `${GOLD}80` : GOLD,
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B8904A" }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD }}
          >
            {loading ? "Bezig..." : "Stuur inloglink"}
          </button>
        </form>

        <p className="mt-6 text-xs text-center" style={{ color: `${BODY}80` }}>
          Nog geen account?{" "}
          <Link href="/" className="hover:underline" style={{ color: GOLD }}>
            Start hier een nieuwe website.
          </Link>
        </p>
      </div>
    </div>
  )
}
