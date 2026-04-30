"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface EventData {
  id: string
  slug: string
  title: string
  type: string
}

export default function SuccesContent() {
  const searchParams = useSearchParams()
  const event_id = searchParams.get("event_id")

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!event_id) { setLoading(false); return }

    fetch(`/api/events/${event_id}`)
      .then((res) => res.json())
      .then((data) => { setEvent(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [event_id])

  const siteUrl = event ? `https://${event.slug}.sayingyes.nl` : null

  const whatsappText = event
    ? encodeURIComponent(
        `Hé! Bekijk onze bruiloftswebsite voor ${event.title} hier: ${siteUrl}`
      )
    : ""

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-rose-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  return (
    <main className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-20 max-w-xl mx-auto">

      <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200 mb-8">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
        Gefeliciteerd! Je website is live!
      </h1>
      <p className="text-gray-500 mb-10 leading-relaxed">
        Je betaling is ontvangen en je eventwebsite staat klaar. Deel hem met je gasten!
      </p>

      {siteUrl && (
        <div className="w-full rounded-2xl bg-white border border-rose-100 shadow-md p-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Jouw website</p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold text-rose-600 hover:text-rose-700 transition-colors break-all"
          >
            {event?.slug}.sayingyes.nl
          </a>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-200 hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Bekijk je website
          </a>
        )}

        {whatsappText && (
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-green-200 hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Deel via WhatsApp
          </a>
        )}
      </div>

      <Link href="/" className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        Terug naar home
      </Link>
    </main>
  )
}
