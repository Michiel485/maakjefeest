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
}: {
  title: string
  pages: NavPage[]
  sc: SC
}) {
  const pathname = usePathname()

  // With middleware, usePathname() returns the browser URL (/rsvp, /programma, /)
  // NOT the internal rewritten path (/events/slug/rsvp), so comparison is straightforward.
  function isActive(type: string) {
    if (type === "home") return pathname === "/"
    return pathname === `/${type}`
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center gap-10 px-8 py-4 border-b backdrop-blur-sm"
      style={{
        backgroundColor: `${sc.navBg}f2`,
        borderColor: `${sc.accent}20`,
        fontFamily: sc.fontFamily,
      }}
    >
      {/* Logo */}
      <a
        href="/"
        style={{
          fontSize: "0.9375rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: sc.accent,
          textDecoration: "none",
          flexShrink: 0,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </a>

      {/* Nav links — grouped next to logo, gap-1 between items */}
      <div className="flex items-center gap-1">
        {pages.map((page) => {
          const active = isActive(page.type)
          return (
            <a
              key={page.type}
              href={page.type === "home" ? "/" : `/${page.type}`}
              style={{
                fontSize: "0.8125rem",
                fontWeight: active ? 700 : 500,
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
    </nav>
  )
}
