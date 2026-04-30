"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export function NavLoginButton() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setLoggedIn(!!user))
  }, [])

  if (loggedIn === null) {
    return <div className="w-24 h-5 rounded-full bg-gray-100 animate-pulse" />
  }

  if (loggedIn) {
    return (
      <Link
        href="/dashboard"
        className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Mijn Dashboard
      </Link>
    )
  }

  return (
    <Link
      href="/inloggen"
      className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors"
    >
      Inloggen
    </Link>
  )
}
