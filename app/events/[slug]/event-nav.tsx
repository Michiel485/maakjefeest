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
  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  function isActive(type: string) {
    if (type === "home") return segments.length <= 2 || lastSegment === segments[1]
    return lastSegment === type
  }

  return (
    <nav
      className="flex justify-between items-center px-8 py-5 sticky top-0 z-30"
      style={{
        backgroundColor: sc.navBg,
        borderBottom: `1px solid ${sc.accent}20`,
        fontFamily: sc.fontFamily,
      }}
    >
      {/* Logo — left */}
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

      {/* Links — right, gap-8 as requested */}
      <div className="flex items-center gap-8">
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
                padding: "4px 10px",
                borderRadius: 8,
                textDecoration: "none",
                whiteSpace: "nowrap",
                backgroundColor: active ? `${sc.accent}14` : "transparent",
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
