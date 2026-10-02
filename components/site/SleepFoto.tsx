"use client"

// Een foto die je in de bouwer kunt verschuiven: slepen verandert waar de
// foto in zijn vak staat (object-position). Op de echte site gewoon de foto.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"

export default function SleepFoto({
  src,
  posX = 50,
  posY = 50,
  editable = false,
  onChange,
  className,
  style,
  kinderen,
}: {
  src: string
  posX?: number
  posY?: number
  editable?: boolean
  onChange?: (x: number, y: number) => void
  className?: string
  style?: CSSProperties
  kinderen?: React.ReactNode
}) {
  const [pos, setPos] = useState({ x: posX, y: posY })
  const [bezig, setBezig] = useState(false)
  const vak = useRef<HTMLDivElement>(null)
  const vorige = useRef<{ x: number; y: number } | null>(null)
  const bezigRef = useRef(false)

  useEffect(() => { if (!bezig) setPos({ x: posX, y: posY }) }, [posX, posY]) // eslint-disable-line react-hooks/exhaustive-deps

  // Een touchmove van React is passief en kan het scrollen niet tegenhouden
  useEffect(() => {
    const el = vak.current
    if (!el || !editable) return
    const stop = (e: TouchEvent) => { if (bezigRef.current) e.preventDefault() }
    el.addEventListener("touchmove", stop, { passive: false })
    return () => el.removeEventListener("touchmove", stop)
  }, [editable])

  // Op de telefoon scroll je gewoon over de foto; pas na even vasthouden
  // gaat hij schuiven (zie ook components/EventHomePreview.tsx)
  const vasthoud = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [aanraak, setAanraak] = useState(false)
  useEffect(() => { setAanraak(window.matchMedia("(pointer: coarse)").matches) }, [])

  const klem = (v: number) => Math.min(100, Math.max(0, v))
  const begin = useCallback((x: number, y: number) => {
    if (!editable) return
    setBezig(true); bezigRef.current = true; vorige.current = { x, y }
  }, [editable])
  const beweeg = useCallback((x: number, y: number) => {
    if (!bezigRef.current || !vorige.current || !vak.current) return
    const r = vak.current.getBoundingClientRect()
    const dx = x - vorige.current.x, dy = y - vorige.current.y
    vorige.current = { x, y }
    setPos((p) => ({ x: klem(p.x - (dx / r.width) * 100), y: klem(p.y - (dy / r.height) * 100) }))
  }, [])
  const eind = useCallback(() => {
    if (!bezigRef.current) return
    setBezig(false); bezigRef.current = false; vorige.current = null
    setPos((p) => { onChange?.(p.x, p.y); return p })
  }, [onChange])

  return (
    <div
      ref={vak}
      className={`relative overflow-hidden select-none ${className ?? ""} ${editable ? (bezig ? "cursor-grabbing" : "cursor-grab") : ""}`}
      style={style}
      onMouseDown={editable ? (e) => { e.preventDefault(); begin(e.clientX, e.clientY) } : undefined}
      onMouseMove={editable ? (e) => beweeg(e.clientX, e.clientY) : undefined}
      onMouseUp={editable ? eind : undefined}
      onMouseLeave={editable ? eind : undefined}
      onTouchStart={editable ? (e) => {
        const { clientX, clientY } = e.touches[0]
        if (vasthoud.current) clearTimeout(vasthoud.current)
        vasthoud.current = setTimeout(() => { vasthoud.current = null; begin(clientX, clientY) }, 450)
      } : undefined}
      onTouchMove={editable ? (e) => {
        if (!bezigRef.current) {
          if (vasthoud.current) { clearTimeout(vasthoud.current); vasthoud.current = null }
          return
        }
        beweeg(e.touches[0].clientX, e.touches[0].clientY)
      } : undefined}
      onTouchEnd={editable ? () => {
        if (vasthoud.current) { clearTimeout(vasthoud.current); vasthoud.current = null }
        eind()
      } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />
      {kinderen}
      {editable && !bezig && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>{aanraak ? "Houd vast om te verschuiven" : "Sleep om te positioneren"}</span>
        </div>
      )}
    </div>
  )
}
