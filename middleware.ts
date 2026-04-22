import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const url = request.nextUrl.clone()

  // Local dev: pass through /events/[slug] directly, no rewrite needed
  if (host.includes("localhost")) {
    return NextResponse.next()
  }

  // Subdomain detection: *.maakjefeest.nl (not www, not bare domain)
  const maakjefeestRegex = /^([a-z0-9-]+)\.maakjefeest\.nl$/i
  const match = host.match(maakjefeestRegex)

  if (match && match[1] !== "www") {
    const slug = match[1]
    url.pathname = `/events/${slug}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
