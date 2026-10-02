"use client"

// Confetti, alleen op de trouwdag zelf en één keer per bezoek, in de kleuren
// van de stijl (ontwerpronde, 2 oktober 2026). Flauw op papier, geliefd in
// het echt. Niets bij "minder beweging".

import { useEffect, useRef } from "react"

const SLEUTEL = "sayingyes_confetti"

export default function Confetti({ kleuren }: { kleuren: string[] }) {
  const doek = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    try {
      const vandaag = new Date().toDateString()
      if (sessionStorage.getItem(SLEUTEL) === vandaag) return
      sessionStorage.setItem(SLEUTEL, vandaag)
    } catch {}
    const canvas = doek.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const schaal = Math.min(2, window.devicePixelRatio || 1)
    const maat = () => {
      canvas.width = window.innerWidth * schaal
      canvas.height = window.innerHeight * schaal
    }
    maat()
    const w = () => canvas.width / schaal
    const h = () => canvas.height / schaal
    const stukjes = Array.from({ length: 140 }, () => ({
      x: Math.random() * w(),
      y: -20 - Math.random() * h() * 0.6,
      vx: (Math.random() - 0.5) * 1.6,
      vy: 1.6 + Math.random() * 2.4,
      draai: Math.random() * Math.PI,
      dDraai: (Math.random() - 0.5) * 0.2,
      b: 5 + Math.random() * 6,
      l: 8 + Math.random() * 8,
      kleur: kleuren[Math.floor(Math.random() * kleuren.length)],
    }))
    let frame = 0
    let start = performance.now()
    const DUUR = 4200
    const teken = (t: number) => {
      const verstreken = t - start
      ctx.setTransform(schaal, 0, 0, schaal, 0, 0)
      ctx.clearRect(0, 0, w(), h())
      const vervaag = verstreken > DUUR - 900 ? Math.max(0, (DUUR - verstreken) / 900) : 1
      for (const s of stukjes) {
        s.x += s.vx + Math.sin((t / 400) + s.draai) * 0.6
        s.y += s.vy
        s.draai += s.dDraai
        if (s.y > h() + 20) { s.y = -20; s.x = Math.random() * w() }
        ctx.save()
        ctx.globalAlpha = 0.9 * vervaag
        ctx.translate(s.x, s.y)
        ctx.rotate(s.draai)
        ctx.fillStyle = s.kleur
        ctx.fillRect(-s.b / 2, -s.l / 2, s.b, s.l * Math.abs(Math.cos(s.draai)) + 1)
        ctx.restore()
      }
      if (verstreken < DUUR) frame = requestAnimationFrame(teken)
      else ctx.clearRect(0, 0, w(), h())
    }
    frame = requestAnimationFrame((t) => { start = t; teken(t) })
    window.addEventListener("resize", maat)
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", maat) }
  }, [kleuren])

  return (
    <canvas
      ref={doek}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 60 }}
    />
  )
}
