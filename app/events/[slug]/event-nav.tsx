"use client"

import { usePathname } from "next/navigation"

interface NavPage {
  type: string
  title: string
}

interface SC {
  accent: string
  navBg: string
  navText: string
  fontFamily: string
}

export default function EventNav({
  title,
  pages,
  sc,
  navLayout = "split",
  onNavigate,
}: {
  title: string
  pages: NavPage[]
  sc: SC
  navLayout?: "stacked" | "split"
  onNavigate?: (type: string) => void
}) {
  const pathname = usePathname()

  function isActive(type: string) {
    if (type === "home") return pathname === "/"
    return pathname === `/${type}`
  }

  const links = (
    <div className={`flex items-center gap-1 flex-wrap ${navLayout === "split" ? "justify-end" : "justify-center"}`}>
      {pages.map((page) => {
        const active = isActive(page.type)
        return (
          <a
            key={page.type}
            href={page.type === "home" ? "/" : `/${page.type}`}
            onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(page.type) } : undefined}
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: active ? sc.accent : sc.navText,
              padding: "5px 12px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
              backgroundColor: active ? `${sc.accent}15` : "transparent",
            }}
          >
            {page.title}
          </a>
        )
      })}
    </div>
  )

  if (navLayout === "split") {
    return (
      <nav
        className="sticky top-0 z-50 flex items-center justify-between gap-4 px-8 py-4 border-b backdrop-blur-sm"
        style={{
          backgroundColor: `${sc.navBg}f2`,
          borderColor: `${sc.accent}20`,
          fontFamily: sc.fontFamily,
        }}
      >
        <a
          href="/"
          onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("home") } : undefined}
          className="flex-shrink-0"
          style={{
            fontSize: "0.9375rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: sc.accent,
            textDecoration: "none",
          }}
        >
          {title}
        </a>
        {links}
      </nav>
    )
  }

  return (
    <nav
      className="sticky top-0 z-50 flex flex-col items-center gap-2 px-8 py-5 border-b backdrop-blur-sm"
      style={{
        backgroundColor: `${sc.navBg}f2`,
        borderColor: `${sc.accent}20`,
        fontFamily: sc.fontFamily,
      }}
    >
      <a
        href="/"
        onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("home") } : undefined}
        className="text-center"
        style={{
          fontSize: "0.9375rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: sc.accent,
          textDecoration: "none",
        }}
      >
        {title}
      </a>
      {links}
    </nav>
  )
}
