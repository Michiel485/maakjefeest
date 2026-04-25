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
  const currentType = segments[segments.length - 1]
  const isHome = segments.length <= 2 || currentType === segments[1]

  function isActive(type: string) {
    if (type === "home") return isHome || segments.length <= 2
    return currentType === type
  }

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      backgroundColor: sc.navBg,
      borderBottom: `1px solid ${sc.accent}22`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 2 }}>
        <a
          href="/"
          style={{ fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.02em", color: sc.accent, fontFamily: sc.fontFamily, textDecoration: "none", flexShrink: 0, marginRight: 8, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {title}
        </a>

        {pages.map((page) => {
          const active = isActive(page.type)
          return (
            <a
              key={page.type}
              href={page.type === "home" ? "/" : `/${page.type}`}
              style={{
                fontSize: "0.75rem",
                fontWeight: active ? 700 : 600,
                color: active ? sc.accent : sc.navText,
                padding: "5px 10px",
                borderRadius: 8,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                backgroundColor: active ? `${sc.accent}14` : "transparent",
              }}
            >
              {page.title}
            </a>
          )
        })}
      </div>
    </header>
  )
}
