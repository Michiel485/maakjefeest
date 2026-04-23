import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  console.log('middleware host:', request.headers.get('host'))
  console.log('middleware url:', request.url)
  console.log('middleware nextUrl:', request.nextUrl.hostname)

  const rawHost = request.headers.get("host") ?? ""
  // Strip port (e.g. localhost:3001 → localhost)
  const host = rawHost.split(":")[0]

  // Local dev: pass through unchanged
  if (host === "localhost" || host === "127.0.0.1") {
    return NextResponse.next()
  }

  // Subdomain detection: <slug>.maakjefeest.nl
  if (host.endsWith(".maakjefeest.nl")) {
    const slug = host.slice(0, host.length - ".maakjefeest.nl".length)

    // Skip www and bare domain
    if (slug && slug !== "www") {
      const url = request.nextUrl.clone()
      url.pathname = `/events/${slug}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
}
