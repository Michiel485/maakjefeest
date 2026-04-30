"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

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
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Controleer je e-mail</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            We hebben een inloglink gestuurd naar{" "}
            <strong className="text-gray-800">{email}</strong>. Klik op de link in de e-mail om in te loggen.
          </p>
          <button
            onClick={() => {
              setSent(false)
              setEmail("")
            }}
            className="text-sm text-rose-500 hover:underline"
          >
            Ander e-mailadres proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full">
        <Link href="/" className="text-lg font-bold text-rose-600 tracking-tight block mb-8">
          maakjefeest.nl
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Inloggen</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Vul je e-mailadres in. We sturen je een magische link om in te loggen — geen wachtwoord nodig.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Bezig..." : "Stuur inloglink"}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Nog geen account? Je krijgt er automatisch een bij je eerste inlog.
        </p>
      </div>
    </div>
  )
}
